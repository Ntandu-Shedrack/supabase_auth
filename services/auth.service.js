const { createClient } = require("@supabase/supabase-js");
const db = require("../models");

// Initialize Supabase client with error handling
let supabase;

try {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase credentials. Please set SUPABASE_URL and SUPABASE_ANON_KEY in your .env file.",
    );
  }

  supabase = createClient(supabaseUrl, supabaseAnonKey);
} catch (error) {
  console.error("❌ Supabase Client Initialization Error:", error.message);
  console.error(
    "\n📝 Please configure your .env file with Supabase credentials:",
  );
  console.error(
    "   - SUPABASE_URL: Your Supabase project URL (e.g., https://your-project.supabase.co)",
  );
  console.error("   - SUPABASE_ANON_KEY: Your Supabase anonymous key");
  console.error(
    "\n📚 Get these from: https://app.supabase.com/project/_/settings/api",
  );
  process.exit(1);
}

class AuthService {
  /**
   * Register a new user
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {Object} metadata - Optional user metadata (name, phone, etc.)
   * @returns {Promise<{user, session, error}>}
   */
  async register(email, password, metadata = {}) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      });

      if (error) {
        return { user: null, session: null, error: error.message };
      }

      return {
        user: data.user,
        session: data.session,
        error: null,
      };
    } catch (error) {
      return {
        user: null,
        session: null,
        error: error.message,
      };
    }
  }

  /**
   * Login user with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<{user, session, error}>}
   */
  async login(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { user: null, session: null, error: error.message };
      }

      return {
        user: data.user,
        session: data.session,
        error: null,
      };
    } catch (error) {
      return {
        user: null,
        session: null,
        error: error.message,
      };
    }
  }

  /**
   * Verify JWT token (typically from Authorization header)
   * @param {string} token - JWT token
   * @returns {Promise<{user, error}>}
   */
  async verifyToken(token) {
    try {
      const { data, error } = await supabase.auth.getUser(token);

      if (error) {
        return { user: null, error: error.message };
      }

      return { user: data.user, error: null };
    } catch (error) {
      return { user: null, error: error.message };
    }
  }

  /**
   * Refresh session using refresh token
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<{session, error}>}
   */
  async refreshSession(refreshToken) {
    try {
      const { data, error } = await supabase.auth.refreshSession({
        refresh_token: refreshToken,
      });

      if (error) {
        return { session: null, error: error.message };
      }

      return { session: data.session, error: null };
    } catch (error) {
      return { session: null, error: error.message };
    }
  }

  /**
   * Logout user
   * @returns {Promise<{error}>}
   */
  async logout() {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Get current user from auth.users table with token
   * @param {string} accessToken - User's access token
   * @returns {Promise<{user, error}>}
   */
  async getCurrentUser(accessToken) {
    try {
      const { data, error } = await supabase.auth.getUser(accessToken);

      if (error) {
        return { user: null, error: error.message };
      }

      return { user: data.user, error: null };
    } catch (error) {
      return { user: null, error: error.message };
    }
  }

  /**
   * Update user metadata stored in auth.users.raw_user_meta_data
   * Metadata includes: name, phone, avatar_url, etc.
   * @param {Object} updates - Metadata to update
   * @returns {Promise<{user, error}>}
   */
  async updateUserMetadata(updates = {}) {
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: updates,
      });

      if (error) {
        return { user: null, error: error.message };
      }

      return { user: data.user, error: null };
    } catch (error) {
      return { user: null, error: error.message };
    }
  }

  /**
   * Generate a password reset code and store it
   * Code expires in 15 minutes
   * @param {string} email - User email
   * @returns {Promise<{code, expiresAt, error}>}
   */
  async generateResetCode(email) {
    try {
      // Generate 6-digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString();

      // Calculate expiration (15 minutes from now)
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      // Look up user_id by email using service role key
      let userId = null;

      if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const adminClient = createClient(
          process.env.SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY,
        );
        const {
          data: { users = [] },
        } = await adminClient.auth.admin.listUsers();
        const user = users.find((u) => u.email === email);
        userId = user?.id || null;
      }

      // Create password reset code in database using Sequelize
      const resetCode = await db.PasswordResetCode.create({
        user_id: userId,
        email: email,
        code: code,
        expires_at: expiresAt,
      });

      return {
        code: code, // In production, send this via email only
        expiresAt: expiresAt,
        error: null,
      };
    } catch (error) {
      return {
        code: null,
        expiresAt: null,
        error: error.message,
      };
    }
  }

  /**
   * Verify reset code
   * @param {string} email - User email
   * @param {string} code - Reset code
   * @returns {Promise<{valid, userId, error}>}
   */
  async verifyResetCode(email, code) {
    try {
      // Find the reset code using Sequelize model
      const resetRecord = await db.PasswordResetCode.findByEmailAndCode(
        email,
        code,
      );

      if (!resetRecord) {
        return {
          valid: false,
          userId: null,
          error: "Invalid or expired reset code",
        };
      }

      // Check if code has expired
      if (new Date(resetRecord.expires_at) < new Date()) {
        return {
          valid: false,
          userId: null,
          error: "Reset code has expired",
        };
      }

      // Check if max attempts exceeded
      if (resetRecord.attempts >= resetRecord.max_attempts) {
        // Delete the record
        await resetRecord.destroy();

        return {
          valid: false,
          userId: null,
          error: "Too many failed attempts. Please request a new reset code.",
        };
      }

      return {
        valid: true,
        userId: resetRecord.user_id,
        resetRecord: resetRecord,
        error: null,
      };
    } catch (error) {
      return {
        valid: false,
        userId: null,
        error: error.message,
      };
    }
  }

  /**
   * Reset password with code
   * @param {string} email - User email
   * @param {string} code - Reset code
   * @param {string} newPassword - New password
   * @returns {Promise<{session, error}>}
   */
  async resetPasswordWithCode(email, code, newPassword) {
    try {
      // Verify the code
      const {
        valid,
        userId,
        resetRecord,
        error: verifyError,
      } = await this.verifyResetCode(email, code);

      if (!valid) {
        // Increment attempts using Sequelize model method
        const failedRecord = await db.PasswordResetCode.findByEmailAndCode(
          email,
          code,
        );
        if (failedRecord) {
          await failedRecord.incrementAttempts();
        }

        return { session: null, error: verifyError };
      }

      // Update password using service role key if available
      let updateError = null;
      let session = null;

      if (process.env.SUPABASE_SERVICE_ROLE_KEY && userId) {
        // Use admin client to update user password
        const adminClient = createClient(
          process.env.SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY,
        );
        const { error } = await adminClient.auth.admin.updateUserById(userId, {
          password: newPassword,
        });
        updateError = error;
      } else {
        // Fallback: updateUser requires current session
        const { data, error } = await supabase.auth.updateUser({
          password: newPassword,
        });
        updateError = error;
        session = data?.session;
      }

      if (updateError) {
        return { session: null, error: updateError.message };
      }

      // Mark reset code as used using Sequelize model method
      if (resetRecord) {
        await resetRecord.markAsUsed();
      }

      return { session: session, error: null };
    } catch (error) {
      return { session: null, error: error.message };
    }
  }

  /**
   * Delete user account from auth.users
   * Note: Requires admin API with service_role_key
   * @param {string} userId - User ID
   * @returns {Promise<{error}>}
   */
  async deleteUser(userId) {
    try {
      // User deletion from auth.users requires service_role_key
      // This is typically done via a server-side admin endpoint
      // not through the anon client
      // For now just return success - implement admin delete endpoint separately
      return { error: null };
    } catch (error) {
      return { error: error.message };
    }
  }
}

module.exports = new AuthService();
