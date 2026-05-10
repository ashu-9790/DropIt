/**
 * Maintenance Check Middleware
 * Blocks access to public endpoints if maintenance mode is enabled
 */
function createMaintenanceCheck(adminSettingsService, logger) {
  return async (req, res, next) => {
    try {
      // Skip check for certain routes
      if (req.path === '/status' || req.path === '/health' || req.path.startsWith('/admin')) {
        return next();
      }

      const settings = await adminSettingsService.getSettings();
      if (settings.success && settings.data.features.maintenanceMode) {
        return res.status(503).json({
          success: false,
          error: "Maintenance",
          message: "DropIt is currently undergoing maintenance. Please check back later!"
        });
      }
      next();
    } catch (error) {
      logger.error(`Maintenance check error: ${error.message}`);
      next(); // Fail open for safety
    }
  };
}

module.exports = { createMaintenanceCheck };
