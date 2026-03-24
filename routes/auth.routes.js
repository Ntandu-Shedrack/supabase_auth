const express = require("express");
const router = express.Router();
const AuthController = require("../controllers/auth.controller");
const {
  authenticate,
  optionalAuth,
  authorize,
  guest,
} = require("../middleware/auth.middleware");

/**
 * Public Routes
 */

// Register new user
router.post("/register", guest, AuthController.register.bind(AuthController));

// Login user
router.post("/login", guest, AuthController.login.bind(AuthController));

// Logout user
router.post(
  "/logout",
  authenticate,
  AuthController.logout.bind(AuthController),
);

// Refresh access token
router.post("/refresh", AuthController.refresh.bind(AuthController));

// Request password reset
router.post(
  "/forgot-password",
  guest,
  AuthController.forgotPassword.bind(AuthController),
);

// Reset password with token
router.post(
  "/reset-password",
  guest,
  AuthController.resetPassword.bind(AuthController),
);

/**
 * Protected Routes
 */

// Get current user profile
router.get("/me", authenticate, AuthController.getProfile.bind(AuthController));

// Update user profile
router.patch(
  "/profile",
  authenticate,
  AuthController.updateProfile.bind(AuthController),
);

// Delete user account
router.delete(
  "/account",
  authenticate,
  AuthController.deleteAccount.bind(AuthController),
);

module.exports = router;
