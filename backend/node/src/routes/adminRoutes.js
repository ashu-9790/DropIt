const express = require("express");
const router = express.Router();
const { createAdminController } = require("../controllers/adminController");
const { createAdminAuthMiddleware } = require("../middleware/adminAuth");

function createAdminRoutes({ adminAuthService, adminStatsService, logger }) {
  const controller = createAdminController({
    adminAuthService,
    adminStatsService,
    logger
  });

  const authMiddleware = createAdminAuthMiddleware(adminAuthService, logger);

  // Public route - login
  router.post("/login", controller.login);

  // Protected routes - require authentication
  router.get("/verify", authMiddleware, controller.verifyToken);
  router.get("/stats", authMiddleware, controller.getStats);
  router.get("/messages", authMiddleware, controller.getMessages);
  router.get("/analytics", authMiddleware, controller.getAnalytics);
  router.get("/top-messages", authMiddleware, controller.getTopMessages);
  router.get("/performance", authMiddleware, controller.getPerformance);
  router.delete("/message/:shareId", authMiddleware, controller.deleteMessage);
  router.post("/messages/bulk-delete", authMiddleware, controller.bulkDeleteMessages);

  return router;
}

module.exports = createAdminRoutes;
