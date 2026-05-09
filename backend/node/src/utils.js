const { v4: uuidv4 } = require("uuid");

function makeShareId() {
  return uuidv4().replace(/-/g, "").slice(0, 12);
}

function safeJSONExtract(text) {
  if (!text) return null;
  // Try to find first { ... } block
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end > start) {
    try {
      return JSON.parse(text.slice(start, end + 1));
    } catch (e) {
      return null;
    }
  }
  return null;
}

module.exports = { makeShareId, safeJSONExtract };
