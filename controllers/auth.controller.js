const AuthService = require("../services/auth.service");
const EmailService = require("../services/email.service");

class AuthController {
  /**
   * POST /api/auth/register
   * Register a new user
   */
  async register(req, res) {
    try {
      const { email, password, name } = req.body;

      // Validation
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: "Email and password are required",
        });
      }

      // Register user
      const { user, session, error } = await AuthService.register(
        email,
        password,
        {
          name: name || "",
        },
      );

      if (error) {
        return res.status(400).json({
          success: false,
          message: error,
        });
      }

      // Set tokens in HTTP-only cookies
      res.cookie("access_token", session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: session.expires_in * 1000,
      });

      res.cookie("refresh_token", session.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      return res.status(201).json({
        success: true,
        message: "User registered successfully",
        user: {
          id: user.id,
          email: user.email,
        },
      });
    } catch (error) {
      console.error("Register error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  /**
   * POST /api/auth/login
   * Login user
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Validation
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: "Email and password are required",
        });
      }

      // Login user
      const { user, session, error } = await AuthService.login(email, password);

      if (error) {
        return res.status(401).json({
          success: false,
          message: error,
        });
      }

      // Set tokens in HTTP-only cookies
      res.cookie("access_token", session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: session.expires_in * 1000,
      });

      res.cookie("refresh_token", session.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.status(200).json({
        success: true,
        message: "Login successful",
        user: {
          id: user.id,
          email: user.email,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  /**
   * POST /api/auth/logout
   * Logout user
   */
  async logout(req, res) {
    try {
      // Clear tokens
      res.clearCookie("access_token");
      res.clearCookie("refresh_token");

      // Optional: Call logout service
      // await AuthService.logout();

      return res.status(200).json({
        success: true,
        message: "Logout successful",
      });
    } catch (error) {
      console.error("Logout error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  /**
   * POST /api/auth/refresh
   * Refresh access token using refresh token
   */
  async refresh(req, res) {
    try {
      const { refresh_token } = req.cookies;

      if (!refresh_token) {
        return res.status(401).json({
          success: false,
          message: "Refresh token not found",
        });
      }

      const { session, error } =
        await AuthService.refreshSession(refresh_token);

      if (error) {
        return res.status(401).json({
          success: false,
          message: error,
        });
      }

      // Update tokens
      res.cookie("access_token", session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: session.expires_in * 1000,
      });

      return res.status(200).json({
        success: true,
        message: "Token refreshed successfully",
      });
    } catch (error) {
      console.error("Refresh error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  /**
   * GET /api/auth/me
   * Get current user profile from auth.users table
   */
  async getProfile(req, res) {
    try {
      const user = req.user;

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      return res.status(200).json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          email_confirmed_at: user.email_confirmed_at,
          user_metadata: user.user_metadata || {},
          app_metadata: user.app_metadata || {},
          created_at: user.created_at,
          updated_at: user.updated_at,
        },
      });
    } catch (error) {
      console.error("Get profile error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  /**
   * PATCH /api/auth/profile
   * Update user metadata in auth.users table
   */
  async updateProfile(req, res) {
    try {
      const user = req.user;
      const updates = req.body;

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      // Only allow updating metadata fields (name, phone, avatar_url, etc)
      const allowedFields = ["name", "phone", "avatar_url", "display_name"];
      const metadata = {};

      for (const field of allowedFields) {
        if (field in updates) {
          metadata[field] = updates[field];
        }
      }

      // Update user metadata in auth.users
      const { user: updatedUser, error } =
        await AuthService.updateUserMetadata(metadata);

      if (error) {
        return res.status(400).json({
          success: false,
          message: error,
        });
      }

      return res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          user_metadata: updatedUser.user_metadata || {},
          updated_at: updatedUser.updated_at,
        },
      });
    } catch (error) {
      console.error("Update profile error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  /**
   * POST /api/auth/forgot-password
   * Request password reset code
   * @body {email: string}
   * @returns {code, expiresAt, message}
   */
  async forgotPassword(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: "Email is required",
        });
      }

      const { code, expiresAt, error } =
        await AuthService.generateResetCode(email);

      if (error) {
        // Return generic message for security (don't reveal if email exists)
        return res.status(200).json({
          success: true,
          message:
            "If an account exists with this email, a reset code will be sent",
        });
      }

      // Send code via email
      const { success: emailSent } = await EmailService.sendResetCode(
        email,
        code,
      );

      if (!emailSent) {
        console.error(
          "Failed to send reset code email, but code was generated. User can still reset password.",
        );
      }

      // Always return success message for security (don't reveal if email exists)
      return res.status(200).json({
        success: true,
        message:
          "If an account exists with this email, a reset code will be sent",
        code: process.env.NODE_ENV === "development" ? code : undefined, // Only return in dev
        expiresAt:
          process.env.NODE_ENV === "development" ? expiresAt : undefined,
      });
    } catch (error) {
      console.error("Forgot password error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  /**
   * POST /api/auth/reset-password
   * Reset password with code
   * @body {email: string, code: string, newPassword: string}
   * @returns {success, message}
   */
  async resetPassword(req, res) {
    try {
      const { email, code, newPassword } = req.body;

      if (!email || !code || !newPassword) {
        return res.status(400).json({
          success: false,
          message: "Email, code, and new password are required",
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: "Password must be at least 6 characters long",
        });
      }

      const { session, error } = await AuthService.resetPasswordWithCode(
        email,
        code,
        newPassword,
      );

      if (error) {
        return res.status(400).json({
          success: false,
          message: error,
        });
      }

      return res.status(200).json({
        success: true,
        message: "Password reset successfully",
      });
    } catch (error) {
      console.error("Reset password error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  /**
   * DELETE /api/auth/account
   * Delete user account (protected)
   */
  async deleteAccount(req, res) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const { error } = await AuthService.deleteUser(userId);

      if (error) {
        return res.status(400).json({
          success: false,
          message: error,
        });
      }

      // Clear tokens
      res.clearCookie("access_token");
      res.clearCookie("refresh_token");

      return res.status(200).json({
        success: true,
        message: "Account deleted successfully",
      });
    } catch (error) {
      console.error("Delete account error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
}

module.exports = new AuthController();
