const cron = require("node-cron");

/**
 * Keep-alive service to prevent Render free tier from spinning down
 * Pings the health endpoint every 10 minutes
 */
function createKeepAliveService(config, logger) {
  // Only run in production on Render
  if (config.NODE_ENV !== "production") {
    logger.info("Keep-alive service disabled in development");
    return;
  }

  // Get the service URL from environment or construct it
  const serviceUrl = process.env.RENDER_EXTERNAL_URL || process.env.SERVICE_URL;
  
  if (!serviceUrl) {
    logger.warn("No service URL found, keep-alive service disabled");
    return;
  }

  const healthUrl = `${serviceUrl}/api/health`;

  // Schedule a job to run every 10 minutes
  const job = cron.schedule("*/10 * * * *", async () => {
    try {
      logger.info("Keep-alive: Pinging health endpoint...");
      
      // Use native fetch (Node 18+) or http module
      const response = await fetch(healthUrl);
      
      if (response.ok) {
        logger.info(`Keep-alive: ✅ Backend is alive (${response.status})`);
      } else {
        logger.warn(`Keep-alive: ⚠️ Unexpected status ${response.status}`);
      }
    } catch (error) {
      logger.error(`Keep-alive: ❌ Failed to ping - ${error.message}`);
    }
  });

  logger.info(`Keep-alive service started - pinging ${healthUrl} every 10 minutes`);

  return {
    stop: () => {
      job.stop();
      logger.info("Keep-alive service stopped");
    },
  };
}

module.exports = { createKeepAliveService };
