const { MongoClient } = require("mongodb");
const config = require("../config");

async function createMongoStore(uri, dbName, logger) {
  const client = new MongoClient(uri, {
    connectTimeoutMS: 5000,
    serverSelectionTimeoutMS: 5000,
    maxPoolSize: config.MONGO_POOL_SIZE,
    minPoolSize: 2,
    retryWrites: true,
  });

  await client.connect();
  const db = client.db(dbName);
  const col = db.collection("messages");
  const feedbackCol = db.collection("feedback");

  // Create indexes for better query performance
  try {
    await col.createIndex({ share_id: 1 }, { unique: true });
    await feedbackCol.createIndex({ created_at: -1 });
    logger.info("Created indexes on messages and feedback");
  } catch (err) {
    if (err.code !== 11000 && !err.message.includes("already exists")) {
      logger.warn(`Failed to create share_id index: ${err.message}`);
    }
  }

  try {
    // Check if TTL index exists with expiration and remove it
    const indexes = await col.indexes();
    const existingTTL = indexes.find(idx => idx.name === "created_at_1");
    
    if (existingTTL && existingTTL.expireAfterSeconds !== undefined) {
      // Drop the TTL index and recreate as regular index so messages are kept forever
      await col.dropIndex("created_at_1");
      await col.createIndex({ created_at: 1 });
      logger.info("Replaced TTL index with regular index on created_at (messages now kept forever)");
    } else if (!existingTTL) {
      await col.createIndex({ created_at: 1 });
      logger.info("Created regular index on created_at (messages kept forever)");
    } else {
      logger.debug("Regular index on created_at already exists");
    }
  } catch (err) {
    logger.warn(`TTL index note: ${err.message}`);
  }

  try {
    await col.createIndex({ vibe: 1, language: 1 });
    logger.info("Created compound index on vibe and language");
  } catch (err) {
    if (!err.message.includes("already exists")) {
      logger.warn(`Failed to create compound index: ${err.message}`);
    }
  }

  // Add schema validation
  try {
    await db.command({
      collMod: "messages",
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: ["share_id", "vibe", "content", "created_at"],
          properties: {
            share_id: { bsonType: "string" },
            vibe: { enum: ["Roast", "Toast"] },
            tone: { bsonType: "string" },
            language: { enum: ["English", "Hindi", "Marathi"] },
            content: {
              bsonType: "object",
              properties: {
                title: { bsonType: "string" },
                body: { bsonType: "string" },
              },
            },
            creator_name: { bsonType: "string" },
            recipient_name: { bsonType: "string" },
            created_at: { bsonType: "date" },
            view_count: { bsonType: "int" },
            share_count: { bsonType: "int" },
          },
        },
      },
    });
    logger.info("Schema validation applied");
  } catch (err) {
    // Collection might already have validation, ignore
    logger.debug(`Schema validation note: ${err.message}`);
  }

  logger.info(`Connected to MongoDB database '${dbName}'.`);

  return {
    db,
    saveMessage: async (doc) => {
      try {
        const result = await col.insertOne(doc);
        return { ...doc, _id: result.insertedId };
      } catch (err) {
        if (err.code === 11000) {
          logger.error(`Duplicate share_id: ${doc.share_id}`);
          throw new Error("Message already exists");
        }
        throw err;
      }
    },
    getMessage: async (shareId) => {
      return await col.findOne({ share_id: shareId });
    },
    incrementViewCount: async (shareId) => {
      return await col.findOneAndUpdate(
        { share_id: shareId },
        { $inc: { view_count: 1 } },
        { returnDocument: "after" }
      );
    },
    incrementShareCount: async (shareId) => {
      return await col.findOneAndUpdate(
        { share_id: shareId },
        { $inc: { share_count: 1 } },
        { returnDocument: "after" }
      );
    },
    getStats: async () => {
      const stats = await col.aggregate([
        {
          $group: {
            _id: null,
            totalMessages: { $sum: 1 },
            totalViews: { $sum: "$view_count" },
            totalShares: { $sum: "$share_count" },
            roastCount: {
              $sum: { $cond: [{ $eq: ["$vibe", "Roast"] }, 1, 0] },
            },
            toastCount: {
              $sum: { $cond: [{ $eq: ["$vibe", "Toast"] }, 1, 0] },
            },
          },
        },
      ]).toArray();
      return stats[0] || { totalMessages: 0, totalViews: 0, totalShares: 0 };
    },
    saveFeedback: async (doc) => {
      try {
        const result = await feedbackCol.insertOne(doc);
        return { ...doc, _id: result.insertedId };
      } catch (err) {
        logger.error(`Error saving feedback: ${err.message}`);
        throw err;
      }
    },
    getRecentFeedback: async (limit = 5) => {
      try {
        return await feedbackCol
          .find({})
          .sort({ created_at: -1 })
          .limit(limit)
          .toArray();
      } catch (err) {
        logger.error(`Error getting recent feedback: ${err.message}`);
        throw err;
      }
    },
    close: async () => client.close(),
  };
}

function createMemoryStore(logger) {
  const map = new Map();
  logger.info("Using in-memory message store");

  return {
    db: null,
    saveMessage: async (doc) => {
      map.set(doc.share_id, doc);
      return doc;
    },
    getMessage: async (shareId) => map.get(shareId) || null,
    incrementViewCount: async (shareId) => {
      const doc = map.get(shareId);
      if (doc) {
        doc.view_count = (doc.view_count || 0) + 1;
      }
      return doc;
    },
    incrementShareCount: async (shareId) => {
      const doc = map.get(shareId);
      if (doc) {
        doc.share_count = (doc.share_count || 0) + 1;
      }
      return doc;
    },
    getStats: async () => {
      let totalMessages = 0;
      let totalViews = 0;
      let totalShares = 0;
      let roastCount = 0;
      let toastCount = 0;

      for (const doc of map.values()) {
        totalMessages++;
        totalViews += doc.view_count || 0;
        totalShares += doc.share_count || 0;
        if (doc.vibe === "Roast") roastCount++;
        else if (doc.vibe === "Toast") toastCount++;
      }

      return { totalMessages, totalViews, totalShares, roastCount, toastCount };
    },
    close: async () => {},
  };
}

async function createStore(uri, dbName, logger) {
  if (uri) {
    try {
      return await createMongoStore(uri, dbName, logger);
    } catch (err) {
      logger.error(
        "MongoDB connect failed, falling back to memory store: " + err.message,
      );
      return createMemoryStore(logger);
    }
  }
  return createMemoryStore(logger);
}

module.exports = { createStore };
