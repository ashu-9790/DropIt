/**
 * Admin Settings Service
 * Manages system settings and configurations
 */
class AdminSettingsService {
  constructor(store) {
    this.store = store;
    this.settingsCollection = "system_settings";
  }

  /**
   * Get all system settings
   */
  async getSettings() {
    try {
      const db = this.store.db;
      const settings = await db.collection(this.settingsCollection).findOne({ _id: "system" });

      // Default settings if none exist
      const defaultSettings = {
        features: {
          roastEnabled: true,
          toastEnabled: true,
          maintenanceMode: false,
        },
        rateLimiting: {
          windowMs: 900000, // 15 minutes
          maxRequests: 100,
        },
        cache: {
          enabled: true,
          ttlSeconds: 3600, // 1 hour
        },
        ai: {
          model: "openai/gpt-4o",
          fallbackEnabled: true,
        }
      };

      return {
        success: true,
        data: settings ? settings.settings : defaultSettings
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Update system settings
   */
  async updateSettings(newSettings) {
    try {
      const db = this.store.db;
      
      await db.collection(this.settingsCollection).updateOne(
        { _id: "system" },
        {
          $set: {
            settings: newSettings,
            updatedAt: new Date().toISOString()
          }
        },
        { upsert: true }
      );

      return {
        success: true,
        message: "Settings updated successfully",
        data: newSettings
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Toggle maintenance mode
   */
  async toggleMaintenanceMode(enabled) {
    try {
      const currentSettings = await this.getSettings();
      
      if (!currentSettings.success) {
        return currentSettings;
      }

      const settings = currentSettings.data;
      settings.features.maintenanceMode = enabled;

      return await this.updateSettings(settings);
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Toggle feature (roast/toast)
   */
  async toggleFeature(feature, enabled) {
    try {
      const currentSettings = await this.getSettings();
      
      if (!currentSettings.success) {
        return currentSettings;
      }

      const settings = currentSettings.data;
      
      if (feature === "roast") {
        settings.features.roastEnabled = enabled;
      } else if (feature === "toast") {
        settings.features.toastEnabled = enabled;
      } else {
        return { success: false, error: "Invalid feature name" };
      }

      return await this.updateSettings(settings);
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Clear cache (placeholder - implement based on your cache service)
   */
  async clearCache() {
    try {
      // This would integrate with your cache service
      // For now, just return success
      return {
        success: true,
        message: "Cache cleared successfully"
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get database backup info
   */
  async getDatabaseInfo() {
    try {
      const db = this.store.db;
      const stats = await db.stats();
      const collections = await db.listCollections().toArray();

      return {
        success: true,
        data: {
          databaseName: db.databaseName,
          collections: collections.map(c => ({
            name: c.name,
            type: c.type
          })),
          stats: {
            dataSize: stats.dataSize,
            storageSize: stats.storageSize,
            indexSize: stats.indexSize,
            totalSize: stats.dataSize + stats.indexSize,
            objects: stats.objects,
            avgObjSize: stats.avgObjSize
          }
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = AdminSettingsService;
