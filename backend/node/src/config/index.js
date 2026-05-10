const dotenv = require("dotenv");
const path = require("path");

// .env lives in the project root for the node backend (backend/node/.env)
dotenv.config({ path: path.resolve(__dirname, "..", "..", ".env") });

const cfg = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 8080,
  MONGO_URI: process.env.MONGO_URI || null,
  MONGO_DB: process.env.MONGO_DB || "dropit",
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || null,
  OPENROUTER_MODEL: process.env.OPENROUTER_MODEL || "openai/gpt-4o",
  CORS_ORIGINS: process.env.CORS_ORIGINS || "http://localhost:4200",
  LOG_FILE:
    process.env.LOG_FILE ||
    path.resolve(__dirname, "..", "..", "dropit-node.log"),
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10), // 15 min
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100", 10),
  REQUEST_TIMEOUT_MS: parseInt(process.env.REQUEST_TIMEOUT_MS || "30000", 10), // 30 sec
  MONGO_POOL_SIZE: parseInt(process.env.MONGO_POOL_SIZE || "10", 10),
  CACHE_TTL_SECONDS: parseInt(process.env.CACHE_TTL_SECONDS || "3600", 10), // 1 hour
  
  // Admin settings
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || "ap548024@gmail.com",
  ADMIN_PASSWORD_HASH: process.env.ADMIN_PASSWORD_HASH || null,
  JWT_SECRET: process.env.JWT_SECRET || null,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
};

// Validate required config
if (cfg.NODE_ENV === "production") {
  if (!cfg.MONGO_URI) throw new Error("MONGO_URI is required in production");
  if (!cfg.OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY is required in production");
  if (!cfg.ADMIN_PASSWORD_HASH) throw new Error("ADMIN_PASSWORD_HASH is required in production");
  if (!cfg.JWT_SECRET) throw new Error("JWT_SECRET is required in production");
}

module.exports = cfg;
