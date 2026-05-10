/**
 * Admin Controller
 * Handles admin API endpoints
 */
function createAdminController({ adminAuthService, adminStatsService, adminSettingsService, logger }) {
  return {
    /**
     * POST /api/admin/login
     * Admin login
     */
    async login(req, res) {
      try {
        const { email, password } = req.body;

        if (!email || !password) {
          return res.status(400).json({
            success: false,
            error: "Email and password are required"
          });
        }

        const result = await adminAuthService.login(email, password);

        if (!result.success) {
          logger.warn(`Failed admin login attempt: ${email}`);
          return res.status(401).json(result);
        }

        logger.info(`Admin logged in: ${email}`);
        return res.json(result);
      } catch (error) {
        logger.error(`Admin login error: ${error.message}`);
        return res.status(500).json({
          success: false,
          error: "Login failed"
        });
      }
    },

    /**
     * GET /api/admin/stats
     * Get overview statistics
     */
    async getStats(req, res) {
      try {
        const result = await adminStatsService.getOverviewStats();
        return res.json(result);
      } catch (error) {
        logger.error(`Admin stats error: ${error.message}`);
        return res.status(500).json({
          success: false,
          error: "Failed to fetch statistics"
        });
      }
    },

    /**
     * GET /api/admin/messages
     * Get recent messages with filters
     */
    async getMessages(req, res) {
      try {
        const limit = parseInt(req.query.limit) || 50;
        const page = parseInt(req.query.page) || 1;
        const skip = (page - 1) * limit;

        const filters = {};
        if (req.query.vibe) filters.vibe = req.query.vibe;
        if (req.query.language) filters.language = req.query.language;
        if (req.query.startDate) filters.startDate = req.query.startDate;
        if (req.query.endDate) filters.endDate = req.query.endDate;

        const result = await adminStatsService.getRecentMessages(limit, skip, filters);
        return res.json(result);
      } catch (error) {
        logger.error(`Admin messages error: ${error.message}`);
        return res.status(500).json({
          success: false,
          error: "Failed to fetch messages"
        });
      }
    },

    /**
     * GET /api/admin/analytics
     * Get analytics data
     */
    async getAnalytics(req, res) {
      try {
        const days = parseInt(req.query.days) || 30;
        const result = await adminStatsService.getAnalytics(days);
        return res.json(result);
      } catch (error) {
        logger.error(`Admin analytics error: ${error.message}`);
        return res.status(500).json({
          success: false,
          error: "Failed to fetch analytics"
        });
      }
    },

    /**
     * GET /api/admin/top-messages
     * Get top performing messages
     */
    async getTopMessages(req, res) {
      try {
        const type = req.query.type || "views"; // views or shares
        const limit = parseInt(req.query.limit) || 10;
        const result = await adminStatsService.getTopMessages(type, limit);
        return res.json(result);
      } catch (error) {
        logger.error(`Admin top messages error: ${error.message}`);
        return res.status(500).json({
          success: false,
          error: "Failed to fetch top messages"
        });
      }
    },

    /**
     * GET /api/admin/performance
     * Get performance metrics
     */
    async getPerformance(req, res) {
      try {
        const result = await adminStatsService.getPerformanceMetrics();
        return res.json(result);
      } catch (error) {
        logger.error(`Admin performance error: ${error.message}`);
        return res.status(500).json({
          success: false,
          error: "Failed to fetch performance metrics"
        });
      }
    },

    /**
     * DELETE /api/admin/message/:shareId
     * Delete a message
     */
    async deleteMessage(req, res) {
      try {
        const { shareId } = req.params;
        const result = await adminStatsService.deleteMessage(shareId);
        
        if (!result.success) {
          return res.status(404).json(result);
        }

        logger.info(`Admin deleted message: ${shareId}`);
        return res.json(result);
      } catch (error) {
        logger.error(`Admin delete message error: ${error.message}`);
        return res.status(500).json({
          success: false,
          error: "Failed to delete message"
        });
      }
    },

    /**
     * POST /api/admin/messages/bulk-delete
     * Bulk delete messages
     */
    async bulkDeleteMessages(req, res) {
      try {
        const { shareIds } = req.body;

        if (!Array.isArray(shareIds) || shareIds.length === 0) {
          return res.status(400).json({
            success: false,
            error: "shareIds array is required"
          });
        }

        const result = await adminStatsService.bulkDeleteMessages(shareIds);
        logger.info(`Admin bulk deleted ${result.deletedCount} messages`);
        return res.json(result);
      } catch (error) {
        logger.error(`Admin bulk delete error: ${error.message}`);
        return res.status(500).json({
          success: false,
          error: "Failed to delete messages"
        });
      }
    },

    /**
     * GET /api/admin/verify
     * Verify admin token (for frontend to check if logged in)
     */
    async verifyToken(req, res) {
      // If middleware passed, token is valid
      return res.json({
        success: true,
        admin: {
          email: req.admin.email,
          role: req.admin.role
        }
      });
    },

    /**
     * GET /api/admin/settings
     * Get system settings
     */
    async getSettings(req, res) {
      try {
        const result = await adminSettingsService.getSettings();
        return res.json(result);
      } catch (error) {
        logger.error(`Admin get settings error: ${error.message}`);
        return res.status(500).json({
          success: false,
          error: "Failed to fetch settings"
        });
      }
    },

    /**
     * PUT /api/admin/settings
     * Update system settings
     */
    async updateSettings(req, res) {
      try {
        const { settings } = req.body;

        if (!settings) {
          return res.status(400).json({
            success: false,
            error: "Settings object is required"
          });
        }

        const result = await adminSettingsService.updateSettings(settings);
        logger.info(`Admin updated settings`);
        return res.json(result);
      } catch (error) {
        logger.error(`Admin update settings error: ${error.message}`);
        return res.status(500).json({
          success: false,
          error: "Failed to update settings"
        });
      }
    },

    /**
     * POST /api/admin/settings/maintenance
     * Toggle maintenance mode
     */
    async toggleMaintenance(req, res) {
      try {
        const { enabled } = req.body;

        if (typeof enabled !== "boolean") {
          return res.status(400).json({
            success: false,
            error: "enabled (boolean) is required"
          });
        }

        const result = await adminSettingsService.toggleMaintenanceMode(enabled);
        logger.info(`Admin toggled maintenance mode: ${enabled}`);
        return res.json(result);
      } catch (error) {
        logger.error(`Admin toggle maintenance error: ${error.message}`);
        return res.status(500).json({
          success: false,
          error: "Failed to toggle maintenance mode"
        });
      }
    },

    /**
     * POST /api/admin/settings/feature
     * Toggle feature (roast/toast)
     */
    async toggleFeature(req, res) {
      try {
        const { feature, enabled } = req.body;

        if (!feature || typeof enabled !== "boolean") {
          return res.status(400).json({
            success: false,
            error: "feature (string) and enabled (boolean) are required"
          });
        }

        const result = await adminSettingsService.toggleFeature(feature, enabled);
        logger.info(`Admin toggled feature ${feature}: ${enabled}`);
        return res.json(result);
      } catch (error) {
        logger.error(`Admin toggle feature error: ${error.message}`);
        return res.status(500).json({
          success: false,
          error: "Failed to toggle feature"
        });
      }
    },

    /**
     * POST /api/admin/cache/clear
     * Clear cache
     */
    async clearCache(req, res) {
      try {
        const result = await adminSettingsService.clearCache();
        logger.info(`Admin cleared cache`);
        return res.json(result);
      } catch (error) {
        logger.error(`Admin clear cache error: ${error.message}`);
        return res.status(500).json({
          success: false,
          error: "Failed to clear cache"
        });
      }
    },

    /**
     * GET /api/admin/database/info
     * Get database information
     */
    async getDatabaseInfo(req, res) {
      try {
        const result = await adminSettingsService.getDatabaseInfo();
        return res.json(result);
      } catch (error) {
        logger.error(`Admin database info error: ${error.message}`);
        return res.status(500).json({
          success: false,
          error: "Failed to fetch database info"
        });
      }
    }
  };
}

module.exports = { createAdminController };
