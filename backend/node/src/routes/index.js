const express = require("express");
const router = express.Router();
const { createMessageController } = require("../controllers/messageController");
const { createMessageModel } = require("../models/messageModel");
const { validateGenerateRequest, validateShareId } = require("../middleware/validation");

function createRoutes({ store, gemini, logger, rateLimiter, cache }) {
  const model = createMessageModel(store);
  const controller = createMessageController({ model, gemini, logger, cache });

  // Health check
  router.get("/health", async (req, res) => {
    res.json({ ok: true, timestamp: new Date().toISOString() });
  });

  // Generate message endpoint
  router.post(
    "/generate",
    rateLimiter,
    validateGenerateRequest,
    controller.generate
  );

  // Get message endpoint
  router.get(
    "/message/:share_id",
    validateShareId,
    controller.getMessage
  );

  // Record share endpoint (for analytics)
  router.post(
    "/message/:share_id/share",
    validateShareId,
    controller.recordShare
  );

  // Get stats endpoint
  router.get("/stats", controller.getStats);

  return router;
}

module.exports = createRoutes;
