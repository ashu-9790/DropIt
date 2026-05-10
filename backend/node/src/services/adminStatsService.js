/**
 * Admin Statistics Service
 * Provides analytics and stats for admin dashboard
 */
class AdminStatsService {
  constructor(store) {
    this.store = store;
  }

  /**
   * Get overview statistics
   */
  async getOverviewStats() {
    try {
      const db = this.store.db;
      const messagesCollection = db.collection("messages");

      // Total messages
      const totalMessages = await messagesCollection.countDocuments();

      // Messages today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const messagesToday = await messagesCollection.countDocuments({
        "metadata.created_at": { $gte: today.toISOString() }
      });

      // Total views and shares
      const viewsSharesResult = await messagesCollection.aggregate([
        {
          $group: {
            _id: null,
            totalViews: { $sum: "$stats.views" },
            totalShares: { $sum: "$stats.shares" }
          }
        }
      ]).toArray();

      const totalViews = viewsSharesResult[0]?.totalViews || 0;
      const totalShares = viewsSharesResult[0]?.totalShares || 0;

      // Roast vs Toast ratio
      const roastCount = await messagesCollection.countDocuments({ vibe: "Roast" });
      const toastCount = await messagesCollection.countDocuments({ vibe: "Toast" });

      // Language distribution
      const languageStats = await messagesCollection.aggregate([
        {
          $group: {
            _id: "$language",
            count: { $sum: 1 }
          }
        }
      ]).toArray();

      return {
        success: true,
        data: {
          totalMessages,
          messagesToday,
          totalViews,
          totalShares,
          roastCount,
          toastCount,
          roastPercentage: totalMessages > 0 ? Math.round((roastCount / totalMessages) * 100) : 0,
          toastPercentage: totalMessages > 0 ? Math.round((toastCount / totalMessages) * 100) : 0,
          languageDistribution: languageStats.map(l => ({
            language: l._id,
            count: l.count
          }))
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get recent messages
   */
  async getRecentMessages(limit = 50, skip = 0, filters = {}) {
    try {
      const db = this.store.db;
      const messagesCollection = db.collection("messages");

      const query = {};
      
      // Apply filters
      if (filters.vibe) {
        query.vibe = filters.vibe;
      }
      if (filters.language) {
        query.language = filters.language;
      }
      if (filters.startDate || filters.endDate) {
        query["metadata.created_at"] = {};
        if (filters.startDate) {
          query["metadata.created_at"].$gte = filters.startDate;
        }
        if (filters.endDate) {
          query["metadata.created_at"].$lte = filters.endDate;
        }
      }

      const messages = await messagesCollection
        .find(query)
        .sort({ "metadata.created_at": -1 })
        .skip(skip)
        .limit(limit)
        .toArray();

      const total = await messagesCollection.countDocuments(query);

      return {
        success: true,
        data: {
          messages: messages.map(m => ({
            shareId: m.share_id,
            vibe: m.vibe,
            language: m.language,
            title: m.content?.title || "",
            views: m.stats?.views || 0,
            shares: m.stats?.shares || 0,
            createdAt: m.metadata?.created_at || "",
          })),
          total,
          page: Math.floor(skip / limit) + 1,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get analytics data (daily message counts)
   */
  async getAnalytics(days = 30) {
    try {
      const db = this.store.db;
      const messagesCollection = db.collection("messages");

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const dailyStats = await messagesCollection.aggregate([
        {
          $match: {
            "metadata.created_at": { $gte: startDate.toISOString() }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: { $dateFromString: { dateString: "$metadata.created_at" } }
              }
            },
            roastCount: {
              $sum: { $cond: [{ $eq: ["$vibe", "Roast"] }, 1, 0] }
            },
            toastCount: {
              $sum: { $cond: [{ $eq: ["$vibe", "Toast"] }, 1, 0] }
            },
            totalCount: { $sum: 1 }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ]).toArray();

      return {
        success: true,
        data: {
          dailyStats: dailyStats.map(d => ({
            date: d._id,
            roastCount: d.roastCount,
            toastCount: d.toastCount,
            totalCount: d.totalCount
          }))
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get top performing messages
   */
  async getTopMessages(type = "views", limit = 10) {
    try {
      const db = this.store.db;
      const messagesCollection = db.collection("messages");

      const sortField = type === "views" ? "stats.views" : "stats.shares";

      const topMessages = await messagesCollection
        .find()
        .sort({ [sortField]: -1 })
        .limit(limit)
        .toArray();

      return {
        success: true,
        data: {
          messages: topMessages.map(m => ({
            shareId: m.share_id,
            vibe: m.vibe,
            title: m.content?.title || "",
            views: m.stats?.views || 0,
            shares: m.stats?.shares || 0,
            createdAt: m.metadata?.created_at || "",
          }))
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics() {
    try {
      const db = this.store.db;
      const messagesCollection = db.collection("messages");

      // Database stats
      const dbStats = await db.stats();
      const totalRecords = await messagesCollection.countDocuments();

      // Calculate average generation time (if stored)
      const avgGenTime = await messagesCollection.aggregate([
        {
          $match: {
            "generation.duration_ms": { $exists: true }
          }
        },
        {
          $group: {
            _id: null,
            avgDuration: { $avg: "$generation.duration_ms" }
          }
        }
      ]).toArray();

      // AI source breakdown
      const sourceStats = await messagesCollection.aggregate([
        {
          $group: {
            _id: "$generation.source",
            count: { $sum: 1 }
          }
        }
      ]).toArray();

      return {
        success: true,
        data: {
          database: {
            totalRecords,
            storageSize: dbStats.dataSize,
            indexSize: dbStats.indexSize,
            totalSize: dbStats.dataSize + dbStats.indexSize
          },
          performance: {
            avgGenerationTime: avgGenTime[0]?.avgDuration || 0,
            aiSourceBreakdown: sourceStats.map(s => ({
              source: s._id,
              count: s.count
            }))
          }
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete a message
   */
  async deleteMessage(shareId) {
    try {
      const db = this.store.db;
      const messagesCollection = db.collection("messages");

      const result = await messagesCollection.deleteOne({ share_id: shareId });

      if (result.deletedCount === 0) {
        return { success: false, error: "Message not found" };
      }

      return { success: true, message: "Message deleted successfully" };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Bulk delete messages
   */
  async bulkDeleteMessages(shareIds) {
    try {
      const db = this.store.db;
      const messagesCollection = db.collection("messages");

      const result = await messagesCollection.deleteMany({
        share_id: { $in: shareIds }
      });

      return {
        success: true,
        deletedCount: result.deletedCount,
        message: `${result.deletedCount} message(s) deleted successfully`
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = AdminStatsService;
