const logger = require("../logger");

/**
 * Simple in-memory rate limiter
 * For production, use Redis-based rate limiter
 */
class RateLimiter {
  constructor(windowMs = 900000, maxRequests = 100) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    this.requests = new Map();
  }

  /**
   * Check if request is allowed
   */
  isAllowed(key) {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    if (!this.requests.has(key)) {
      this.requests.set(key, []);
    }

    const timestamps = this.requests.get(key);

    // Remove old timestamps outside the window
    const validTimestamps = timestamps.filter((ts) => ts > windowStart);
    this.requests.set(key, validTimestamps);

    if (validTimestamps.length >= this.maxRequests) {
      return false;
    }

    validTimestamps.push(now);
    return true;
  }

  /**
   * Get remaining requests for key
   */
  getRemaining(key) {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    if (!this.requests.has(key)) {
      return this.maxRequests;
    }

    const timestamps = this.requests.get(key);
    const validTimestamps = timestamps.filter((ts) => ts > windowStart);

    return Math.max(0, this.maxRequests - validTimestamps.length);
  }

  /**
   * Get reset time for key (in seconds)
   */
  getResetTime(key) {
    if (!this.requests.has(key) || this.requests.get(key).length === 0) {
      return 0;
    }

    const timestamps = this.requests.get(key);
    const oldestTimestamp = Math.min(...timestamps);
    const resetTime = Math.ceil((oldestTimestamp + this.windowMs - Date.now()) / 1000);

    return Math.max(0, resetTime);
  }

  /**
   * Clean up old entries (call periodically)
   */
  cleanup() {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    for (const [key, timestamps] of this.requests.entries()) {
      const validTimestamps = timestamps.filter((ts) => ts > windowStart);
      if (validTimestamps.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, validTimestamps);
      }
    }
  }
}

/**
 * Create rate limiter middleware
 */
function createRateLimiter(windowMs = 900000, maxRequests = 100) {
  const limiter = new RateLimiter(windowMs, maxRequests);

  // Cleanup every 5 minutes
  setInterval(() => limiter.cleanup(), 300000);

  return (req, res, next) => {
    // Use IP address as key (or user ID if authenticated)
    const key = req.ip || req.connection.remoteAddress || "unknown";

    if (!limiter.isAllowed(key)) {
      const resetTime = limiter.getResetTime(key);
      logger.warn(`Rate limit exceeded for ${key}`);

      return res.status(429).json({
        success: false,
        error: "Too many requests",
        retryAfter: resetTime,
      });
    }

    // Add rate limit info to response headers
    res.set("X-RateLimit-Limit", limiter.maxRequests.toString());
    res.set("X-RateLimit-Remaining", limiter.getRemaining(key).toString());
    res.set("X-RateLimit-Reset", (Date.now() + limiter.windowMs).toString());

    next();
  };
}

module.exports = {
  createRateLimiter,
  RateLimiter,
};
