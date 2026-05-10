/**
 * Admin Authentication Middleware
 * Protects admin routes by verifying JWT token
 */
function createAdminAuthMiddleware(adminAuthService, logger) {
  return async (req, res, next) => {
    try {
      // Get token from Authorization header
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        logger.warn("Admin auth failed: No token provided");
        return res.status(401).json({
          success: false,
          error: "Authentication required"
        });
      }

      const token = authHeader.substring(7); // Remove "Bearer " prefix

      // Verify token
      const verification = await adminAuthService.verifyToken(token);

      if (!verification.valid) {
        logger.warn("Admin auth failed: Invalid token");
        return res.status(401).json({
          success: false,
          error: "Invalid or expired token"
        });
      }

      // Attach admin info to request
      req.admin = verification.decoded;
      
      logger.info(`Admin authenticated: ${req.admin.email}`);
      next();
    } catch (error) {
      logger.error(`Admin auth error: ${error.message}`);
      return res.status(500).json({
        success: false,
        error: "Authentication error"
      });
    }
  };
}

module.exports = { createAdminAuthMiddleware };
