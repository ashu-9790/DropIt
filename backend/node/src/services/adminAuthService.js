const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

/**
 * Admin Authentication Service
 * Handles admin login and JWT token generation
 */
class AdminAuthService {
  constructor(config) {
    this.adminEmail = config.ADMIN_EMAIL;
    this.adminPasswordHash = config.ADMIN_PASSWORD_HASH;
    this.jwtSecret = config.JWT_SECRET;
    this.jwtExpiresIn = config.JWT_EXPIRES_IN || "7d";
  }

  /**
   * Authenticate admin user
   * @param {string} email 
   * @param {string} password 
   * @returns {Promise<{success: boolean, token?: string, error?: string}>}
   */
  async login(email, password) {
    try {
      // Check if email matches
      if (email !== this.adminEmail) {
        return { success: false, error: "Invalid credentials" };
      }

      // Verify password
      const isValid = await bcrypt.compare(password, this.adminPasswordHash);
      
      if (!isValid) {
        return { success: false, error: "Invalid credentials" };
      }

      // Generate JWT token
      const token = jwt.sign(
        { email: this.adminEmail, role: "admin" },
        this.jwtSecret,
        { expiresIn: this.jwtExpiresIn }
      );

      return { success: true, token };
    } catch (error) {
      return { success: false, error: "Authentication failed" };
    }
  }

  /**
   * Verify JWT token
   * @param {string} token 
   * @returns {Promise<{valid: boolean, decoded?: object}>}
   */
  async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, this.jwtSecret);
      
      // Check if it's admin
      if (decoded.role !== "admin" || decoded.email !== this.adminEmail) {
        return { valid: false };
      }

      return { valid: true, decoded };
    } catch (error) {
      return { valid: false };
    }
  }

  /**
   * Hash a password (utility for generating admin password hash)
   * @param {string} password 
   * @returns {Promise<string>}
   */
  static async hashPassword(password) {
    return await bcrypt.hash(password, 10);
  }
}

module.exports = AdminAuthService;
