const { makeShareId } = require("../utils");

function sanitizeMessageContent(content, vibe, recipient) {
  let title = String(content && content.title ? content.title : "").trim();
  let body = String(content && content.body ? content.body : "").trim();

  const combined = `${title}\n${body}`;
  const titleMatch = combined.match(
    /["']?title["']?\s*:\s*["']([^"'\n{}]+(?:[^\n{}]*?))["']?/i,
  );
  const bodyMatch = combined.match(
    /["']?body["']?\s*:\s*["']([\s\S]*?)["']?\s*$/i,
  );

  if (titleMatch || bodyMatch) {
    title = (titleMatch && titleMatch[1] ? titleMatch[1] : title)
      .replace(/\\n/g, "\n")
      .trim();
    body = (bodyMatch && bodyMatch[1] ? bodyMatch[1] : body)
      .replace(/\\n/g, "\n")
      .trim();
  }

  if (
    title === "{" ||
    title === "[" ||
    title === "```json" ||
    title === "```"
  ) {
    title = "Your message";
  }

  body = body
    .replace(/^["']?title["']?\s*:\s*/i, "")
    .replace(/^[:\-\s]+/, "")
    .replace(/[{}]/g, "")
    .replace(/^["'`]+|["'`]+$/g, "")
    .trim();

  title = title
    .replace(/\\n/g, "\n")
    .replace(/^["'`]+|["'`]+$/g, "")
    .trim();

  if (!title) {
    title =
      vibe === "Toast"
        ? `A Toast for ${recipient || "you"}`
        : `A Roast for ${recipient || "you"}`;
  }

  if (!body || /^title\b/i.test(body)) {
    body = title;
  }

  body = body.replace(/\\n/g, "\n").trim();

  return { title, body };
}

function createMessageController({ model, gemini, logger, cache, adminSettingsService }) {
  async function generate(req, res) {
    try {
      const payload = req.body || {};
      const vibe = payload.vibe || "Roast";

      // Check if feature is enabled
      if (adminSettingsService) {
        const settings = await adminSettingsService.getSettings();
        if (settings.success) {
          const features = settings.data.features;
          if (vibe === "Roast" && !features.roastEnabled) {
            return res.status(503).json({
              success: false,
              error: "Maintenance",
              message: "Roasts are currently disabled for maintenance. Try a Toast instead!"
            });
          }
          if (vibe === "Toast" && !features.toastEnabled) {
            return res.status(503).json({
              success: false,
              error: "Maintenance",
              message: "Toasts are currently disabled for maintenance. Try a Roast instead!"
            });
          }
        }
      }
      const creator_name = payload.creator_name || "";
      const recipient_name = payload.recipient_name || "";
      const language = payload.language || "English";
      const quirks = payload.quirks || "";

      const generation = await gemini.generate({
        vibe,
        recipient: recipient_name,
        language,
        tone: quirks,
      });
      const share_id = makeShareId();

      const record = {
        share_id,
        vibe,
        creator_name,
        recipient_name,
        language,
        quirks,
        content: { title: generation.title, body: generation.body },
        generation: { source: generation.source, model: generation.model },
        created_at: new Date(),
        view_count: 0,
        share_count: 0,
      };

      await model.create(record);
      
      // Cache the message for quick retrieval
      if (cache) {
        cache.set(`message:${share_id}`, record);
      }

      logger.info(
        `Generated message share_id=${share_id} vibe=${vibe} source=${generation.source} title="${generation.title}" body="${generation.body.substring(0, 100)}${generation.body.length > 100 ? '...' : ''}"`
      );

      return res.status(201).json({
        success: true,
        share_id,
        generation: record.generation,
      });
    } catch (err) {
      logger.error("Controller generate error: " + (err && err.message));
      return res
        .status(500)
        .json({ success: false, error: "Failed to generate message" });
    }
  }

  async function getMessage(req, res) {
    try {
      const id = req.params.share_id;
      
      // Check cache first
      let doc = null;
      if (cache) {
        doc = cache.get(`message:${id}`);
      }

      // If not in cache, fetch from database
      if (!doc) {
        doc = await model.findByShareId(id);
        if (!doc) {
          return res.status(404).json({ success: false, error: "Message not found" });
        }
        // Cache for future requests
        if (cache) {
          cache.set(`message:${id}`, doc);
        }
      }

      // Increment view count
      if (model.incrementViewCount) {
        await model.incrementViewCount(id);
        doc.view_count = (doc.view_count || 0) + 1;
      }

      const safeContent = sanitizeMessageContent(
        doc.content,
        doc.vibe,
        doc.recipient_name,
      );

      return res.json({
        success: true,
        data: {
          vibe: doc.vibe,
          recipient: doc.recipient_name,
          language: doc.language || 'English',
          content: safeContent,
          generation: doc.generation,
          stats: {
            views: doc.view_count || 0,
            shares: doc.share_count || 0,
          },
        },
      });
    } catch (err) {
      logger.error("Controller getMessage error: " + (err && err.message));
      return res.status(500).json({ success: false, error: "Failed to fetch message" });
    }
  }

  async function recordShare(req, res) {
    try {
      const id = req.params.share_id;
      
      if (model.incrementShareCount) {
        const doc = await model.incrementShareCount(id);
        if (!doc) {
          return res.status(404).json({ success: false, error: "Message not found" });
        }
        
        // Update cache
        if (cache) {
          cache.set(`message:${id}`, doc.value);
        }

        logger.info(`Message shared: share_id=${id} total_shares=${doc.value.share_count}`);
        return res.json({ success: true, shares: doc.value.share_count });
      }

      return res.json({ success: true });
    } catch (err) {
      logger.error("Controller recordShare error: " + (err && err.message));
      return res.status(500).json({ success: false, error: "Failed to record share" });
    }
  }

  async function getStats(req, res) {
    try {
      if (model.getStats) {
        const stats = await model.getStats();
        return res.json({ success: true, data: stats });
      }
      return res.json({ success: true, data: {} });
    } catch (err) {
      logger.error("Controller getStats error: " + (err && err.message));
      return res.status(500).json({ success: false, error: "Failed to fetch stats" });
    }
  }

  return { generate, getMessage, recordShare, getStats };
}

module.exports = { createMessageController };
