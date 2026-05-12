/**
 * Controller for handling user feedback
 */
function createFeedbackController({ store, logger }) {
  return {
    /**
     * Submit new feedback
     */
    submitFeedback: async (req, res) => {
      try {
        const { name, rating, comment } = req.body;

        // Basic validation
        if (!name || !rating || !comment) {
          return res.status(400).json({
            success: false,
            error: "Name, rating, and comment are required",
          });
        }

        const feedback = {
          name: name.substring(0, 50),
          rating: Math.min(Math.max(parseInt(rating) || 5, 1), 5),
          comment: comment.substring(0, 500),
          created_at: new Date(),
        };

        const saved = await store.saveFeedback(feedback);
        logger.info(`Feedback received from ${name}`);

        return res.status(201).json({
          success: true,
          data: saved,
        });
      } catch (err) {
        logger.error(`Feedback submission error: ${err.message}`);
        return res.status(500).json({
          success: false,
          error: "Failed to submit feedback",
        });
      }
    },

    /**
     * Get recent feedback entries
     */
    getRecentFeedback: async (req, res) => {
      try {
        const limit = parseInt(req.query.limit) || 5;
        const feedbacks = await store.getRecentFeedback(limit);

        return res.status(200).json({
          success: true,
          data: feedbacks,
        });
      } catch (err) {
        logger.error(`Error fetching feedback: ${err.message}`);
        return res.status(500).json({
          success: false,
          error: "Failed to fetch feedback",
        });
      }
    },
  };
}

module.exports = { createFeedbackController };
