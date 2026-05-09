// Thin model layer wrapping the storage adapter
function createMessageModel(store) {
  return {
    create: async (doc) => {
      return await store.saveMessage(doc);
    },
    findByShareId: async (shareId) => {
      return await store.getMessage(shareId);
    },
    incrementViewCount: async (shareId) => {
      if (store.incrementViewCount) {
        return await store.incrementViewCount(shareId);
      }
      return null;
    },
    incrementShareCount: async (shareId) => {
      if (store.incrementShareCount) {
        return await store.incrementShareCount(shareId);
      }
      return null;
    },
    getStats: async () => {
      if (store.getStats) {
        return await store.getStats();
      }
      return {};
    },
  };
}

module.exports = { createMessageModel };
