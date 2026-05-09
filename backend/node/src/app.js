const express = require("express");
const cors = require("cors");
const config = require("./config");
const logger = require("./logger");
const { createStore } = require("./services/storageService");
const { createCacheService } = require("./services/cacheService");
const { createRateLimiter } = require("./middleware/rateLimiter");
const { createKeepAliveService } = require("./services/keepAliveService");
const AIService = require("./services/aiService");
const createRoutes = require("./routes");

async function main() {
  const app = express();

  // Middleware
  app.use(express.json({ limit: "10kb" })); // Reduced from 100kb
  app.use(express.urlencoded({ extended: true, limit: "10kb" }));

  // CORS configuration - restrict to specific origins in production
  const origins =
    config.CORS_ORIGINS === "*"
      ? "*"
      : config.CORS_ORIGINS.split(",").map((s) => s.trim());

  app.use(
    cors({
      origin: origins,
      credentials: true,
      methods: ["GET", "POST", "OPTIONS"],
      allowedHeaders: ["Content-Type"],
    })
  );

  // Request logging middleware
  app.use((req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
      const duration = Date.now() - start;
      logger.info(
        `${req.method} ${req.path} ${res.statusCode} ${duration}ms`
      );
    });
    next();
  });

  // Initialize services
  const store = await createStore(config.MONGO_URI, config.MONGO_DB, logger);
  const cache = createCacheService(config.CACHE_TTL_SECONDS);
  const rateLimiter = createRateLimiter(
    config.RATE_LIMIT_WINDOW_MS,
    config.RATE_LIMIT_MAX_REQUESTS
  );
  const gemini = new AIService(config);

  // Routes
  app.use("/api", createRoutes({ store, gemini, logger, rateLimiter, cache }));

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ success: false, error: "Endpoint not found" });
  });

  // Error handler
  app.use((err, req, res, next) => {
    logger.error(`Unhandled error: ${err.message}`);
    res.status(500).json({ success: false, error: "Internal server error" });
  });

  const port = config.PORT || 8080;
  const server = app.listen(port, () =>
    logger.info(
      `DropIt backend listening on port ${port} (${config.NODE_ENV})`
    )
  );

  // Start keep-alive service (only in production)
  const keepAlive = createKeepAliveService(config, logger);

  server.on("error", (err) => {
    if (err && err.code === "EADDRINUSE") {
      logger.error(
        `Port ${port} is already in use. Stop the other backend process and restart once.`
      );
      process.exit(1);
      return;
    }
    logger.error("Server failed to start: " + (err && err.message));
    process.exit(1);
  });

  // Graceful shutdown
  process.on("SIGTERM", async () => {
    logger.info("SIGTERM received, shutting down gracefully");
    
    // Stop keep-alive service
    if (keepAlive && keepAlive.stop) {
      keepAlive.stop();
    }
    
    server.close(async () => {
      await store.close();
      logger.info("Server closed");
      process.exit(0);
    });
  });
}

main().catch((err) => {
  console.error("Startup error", err);
  process.exit(1);
});
