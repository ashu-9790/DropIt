const express = require("express");
const router = express.Router();
const { createAdminController } = require("../controllers/adminController");
const { createAdminAuthMiddleware } = require("../middleware/adminAuth");

function createAdminRoutes({ adminAuthService, adminStatsService, adminSettingsService, logger }) {
  const controller = createAdminController({
    adminAuthService,
    adminStatsService,
    adminSettingsService,
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
  
  // Settings routes
  router.get("/settings", authMiddleware, controller.getSettings);
  router.put("/settings", authMiddleware, controller.updateSettings);
  router.post("/settings/maintenance", authMiddleware, controller.toggleMaintenance);
  router.post("/settings/feature", authMiddleware, controller.toggleFeature);
  router.post("/cache/clear", authMiddleware, controller.clearCache);
  router.get("/database/info", authMiddleware, controller.getDatabaseInfo);

  return router;
}

module.exports = createAdminRoutes;
