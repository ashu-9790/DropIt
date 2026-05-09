const logger = require("../logger");

// Allowed values
const ALLOWED_VIBES = ["Roast", "Toast"];
const ALLOWED_LANGUAGES = ["English", "Hindi", "Marathi"];

// Validation rules
const VALIDATION_RULES = {
  creator_name: {
    required: true,
    minLength: 1,
    maxLength: 80,
    pattern: /^[a-zA-Z0-9\s\-']+$/, // Alphanumeric, spaces, hyphens, apostrophes
  },
  recipient_name: {
    required: true,
    minLength: 1,
    maxLength: 80,
    pattern: /^[a-zA-Z0-9\s\-']+$/,
  },
  quirks: {
    required: true,
    minLength: 5,
    maxLength: 500,
  },
  vibe: {
    required: true,
    enum: ALLOWED_VIBES,
  },
  language: {
    required: true,
    enum: ALLOWED_LANGUAGES,
  },
};

/**
 * Validates a field against rules
 */
function validateField(fieldName, value, rules) {
  if (rules.required && (!value || (typeof value === "string" && !value.trim()))) {
    return `${fieldName} is required`;
  }

  if (typeof value === "string") {
    value = value.trim();
  }

  if (rules.minLength && value.length < rules.minLength) {
    return `${fieldName} must be at least ${rules.minLength} characters`;
  }

  if (rules.maxLength && value.length > rules.maxLength) {
    return `${fieldName} must be at most ${rules.maxLength} characters`;
  }

  if (rules.pattern && !rules.pattern.test(value)) {
    return `${fieldName} contains invalid characters`;
  }

  if (rules.enum && !rules.enum.includes(value)) {
    return `${fieldName} must be one of: ${rules.enum.join(", ")}`;
  }

  return null;
}

/**
 * Middleware to validate generate request
 */
function validateGenerateRequest(req, res, next) {
  const { creator_name, recipient_name, quirks, vibe, language } = req.body;

  // Check all required fields exist
  const errors = [];

  for (const [fieldName, rules] of Object.entries(VALIDATION_RULES)) {
    const value = req.body[fieldName];
    const error = validateField(fieldName, value, rules);
    if (error) {
      errors.push(error);
    }
  }

  if (errors.length > 0) {
    logger.warn(`Validation failed: ${errors.join("; ")}`);
    return res.status(400).json({
      success: false,
      error: "Validation failed",
      details: errors,
    });
  }

  // Sanitize inputs
  req.body.creator_name = creator_name.trim();
  req.body.recipient_name = recipient_name.trim();
  req.body.quirks = quirks.trim();

  next();
}

/**
 * Middleware to validate share_id parameter
 */
function validateShareId(req, res, next) {
  const { share_id } = req.params;

  // Share ID should be a valid UUID or alphanumeric string
  if (!share_id || !/^[a-zA-Z0-9\-_]{8,}$/.test(share_id)) {
    return res.status(400).json({
      success: false,
      error: "Invalid share_id format",
    });
  }

  next();
}

module.exports = {
  validateGenerateRequest,
  validateShareId,
  ALLOWED_VIBES,
  ALLOWED_LANGUAGES,
};
