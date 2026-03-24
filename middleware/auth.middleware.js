const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
);

/**
 * Authentication Middleware
 * Verifies JWT token from Authorization header or cookies
 * Attaches user object to req.user
 */
const authenticate = async (req, res, next) => {
  try {
    let token;

    // Check Authorization header first
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }
    // Fall back to cookies
    else if (req.cookies.access_token) {
      token = req.cookies.access_token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No authentication token provided",
      });
    }

    // Verify token with Supabase
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    // Attach user to request
    req.user = data.user;
    req.token = token;

    next();
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * Optional Authentication Middleware
 * Verifies JWT token if provided, but doesn't require it
 * Attaches user object to req.user if authenticated
 */
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    // Check Authorization header first
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }
    // Fall back to cookies
    else if (req.cookies.access_token) {
      token = req.cookies.access_token;
    }

    if (token) {
      // Verify token with Supabase
      const { data, error } = await supabase.auth.getUser(token);

      if (!error && data.user) {
        req.user = data.user;
        req.token = token;
      }
    }

    next();
  } catch (error) {
    console.error("Optional authentication error:", error);
    // Don't fail on optional auth
    next();
  }
};

/**
 * Role-based Authorization Middleware
 * Requires user to have specific role(s)
 * @param {string|string[]} requiredRoles - Role(s) required
 * @returns {Function} Middleware function
 */
const authorize = (requiredRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - user not authenticated",
      });
    }

    const userRole = req.user.user_metadata?.role || "user";
    const roles = Array.isArray(requiredRoles)
      ? requiredRoles
      : [requiredRoles];

    if (!roles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden - insufficient permissions",
      });
    }

    next();
  };
};

/**
 * Guest Middleware
 * Ensures user is NOT authenticated
 * Useful for login/register pages
 */
const guest = (req, res, next) => {
  if (req.user) {
    return res.status(403).json({
      success: false,
      message: "Already authenticated",
    });
  }

  next();
};

module.exports = {
  authenticate,
  optionalAuth,
  authorize,
  guest,
};
