const logger = require("../logger");

/**
 * Simple in-memory cache with TTL
 * For production, use Redis
 */
class CacheService {
  constructor(ttlSeconds = 3600) {
    this.cache = new Map();
    this.ttlSeconds = ttlSeconds;
  }

  /**
   * Set a value in cache
   */
  set(key, value, ttlSeconds = null) {
    const ttl = ttlSeconds || this.ttlSeconds;
    const expiresAt = Date.now() + ttl * 1000;

    this.cache.set(key, {
      value,
      expiresAt,
    });

    logger.debug(`Cache SET: ${key} (TTL: ${ttl}s)`);
  }

  /**
   * Get a value from cache
   */
  get(key) {
    const entry = this.cache.get(key);

    if (!entry) {
      logger.debug(`Cache MISS: ${key}`);
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      logger.debug(`Cache EXPIRED: ${key}`);
      return null;
    }

    logger.debug(`Cache HIT: ${key}`);
    return entry.value;
  }

  /**
   * Delete a value from cache
   */
  delete(key) {
    this.cache.delete(key);
    logger.debug(`Cache DELETE: ${key}`);
  }

  /**
   * Clear all cache
   */
  clear() {
    this.cache.clear();
    logger.info("Cache cleared");
  }

  /**
   * Get cache size
   */
  size() {
    return this.cache.size;
  }

  /**
   * Clean up expired entries
   */
  cleanup() {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.debug(`Cache cleanup: removed ${cleaned} expired entries`);
    }
  }
}

/**
 * Create cache service
 */
function createCacheService(ttlSeconds = 3600) {
  const cache = new CacheService(ttlSeconds);

  // Cleanup every 10 minutes
  setInterval(() => cache.cleanup(), 600000);

  return cache;
}

module.exports = {
  createCacheService,
  CacheService,
};
