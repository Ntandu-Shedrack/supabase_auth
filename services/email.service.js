const nodemailer = require("nodemailer");

/**
 * Email Service
 * Handles sending emails for password reset codes and other notifications
 *
 * Configuration (set in .env):
 * - EMAIL_SERVICE: SMTP service name (e.g., 'Gmail', 'SendGrid')
 * - EMAIL_USER: SMTP username or email address
 * - EMAIL_PASS: SMTP password or API key
 * - EMAIL_FROM: Sender email address
 * - EMAIL_FROM_NAME: Sender display name
 */
class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransport();
  }

  /**
   * Initialize email transport
   * Supports multiple providers:
   * - Gmail: service: "gmail"
   * - SendGrid: host: "smtp.sendgrid.net", port: 587
   * - Custom SMTP: configure host, port, secure, auth
   */
  initializeTransport() {
    try {
      const emailService = process.env.EMAIL_SERVICE || "gmail";
      const emailUser = process.env.EMAIL_USER;
      const emailPass = process.env.EMAIL_PASS;
      const emailFrom = process.env.EMAIL_FROM || emailUser;
      const emailFromName = process.env.EMAIL_FROM_NAME || "Auth Service";

      if (!emailUser || !emailPass) {
        console.warn(
          "⚠️  Email service not configured. Password reset codes won't be sent via email.",
        );
        console.warn(
          "   Configure EMAIL_USER, EMAIL_PASS, and EMAIL_SERVICE in .env",
        );
        return;
      }

      // Configure transporter based on service
      let transportConfig = {};

      if (emailService.toLowerCase() === "senrigrid") {
        // SendGrid configuration
        transportConfig = {
          host: "smtp.sendgrid.net",
          port: 587,
          secure: false,
          auth: {
            user: "apikey",
            pass: emailPass,
          },
        };
      } else if (emailService.toLowerCase() === "gmail") {
        // Gmail configuration
        transportConfig = {
          service: "gmail",
          auth: {
            user: emailUser,
            pass: emailPass,
          },
        };
      } else {
        // Custom SMTP configuration
        transportConfig = {
          host: process.env.EMAIL_HOST || "localhost",
          port: parseInt(process.env.EMAIL_PORT || "587"),
          secure: process.env.EMAIL_SECURE === "true",
          auth: {
            user: emailUser,
            pass: emailPass,
          },
        };
      }

      this.transporter = nodemailer.createTransport(transportConfig);
      this.emailFrom = emailFrom;
      this.emailFromName = emailFromName;

      console.log("✅ Email service initialized");
    } catch (error) {
      console.error("❌ Failed to initialize email service:", error.message);
    }
  }

  /**
   * Send password reset code email
   * @param {string} email - Recipient email
   * @param {string} code - 6-digit reset code
   * @param {number} expiresInMinutes - Code expiration time in minutes
   * @returns {Promise<{success, error}>}
   */
  async sendResetCode(email, code, expiresInMinutes = 15) {
    try {
      if (!this.transporter) {
        return {
          success: false,
          error: "Email service not configured",
        };
      }

      const mailOptions = {
        from: `${this.emailFromName} <${this.emailFrom}>`,
        to: email,
        subject: "Password Reset Code",
        html: this.getResetCodeTemplate(code, expiresInMinutes),
        text: `Your password reset code is: ${code}\n\nThis code expires in ${expiresInMinutes} minutes.`,
      };

      await this.transporter.sendMail(mailOptions);

      console.log(`✅ Reset code email sent to ${email}`);
      return { success: true, error: null };
    } catch (error) {
      console.error(`❌ Failed to send email to ${email}:`, error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * HTML email template for password reset code
   * @param {string} code - 6-digit reset code
   * @param {number} expiresInMinutes - Expiration time in minutes
   * @returns {string} HTML email content
   */
  getResetCodeTemplate(code, expiresInMinutes) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; }
            .header { text-align: center; border-bottom: 2px solid #007bff; padding-bottom: 20px; margin-bottom: 20px; }
            .header h1 { color: #333; margin: 0; }
            .content { color: #555; line-height: 1.6; }
            .code-box {
              background-color: #f0f0f0;
              border: 2px solid #007bff;
              border-radius: 6px;
              padding: 20px;
              text-align: center;
              margin: 20px 0;
            }
            .code { font-size: 32px; font-weight: bold; color: #007bff; letter-spacing: 2px; }
            .expiry { color: #999; font-size: 14px; margin-top: 10px; }
            .footer { text-align: center; border-top: 2px solid #f0f0f0; padding-top: 20px; margin-top: 20px; color: #999; font-size: 12px; }
            .warning { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 10px; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>You requested to reset your password. Use the code below to complete your password reset:</p>
              <div class="code-box">
                <div class="code">${code}</div>
                <div class="expiry">Expires in ${expiresInMinutes} minutes</div>
              </div>
              <p><strong>Important:</strong></p>
              <ul>
                <li>This code will expire in ${expiresInMinutes} minutes</li>
                <li>Do not share this code with anyone</li>
                <li>If you didn't request a password reset, please ignore this email</li>
                <li>You have 5 attempts to enter the correct code before it's locked</li>
              </ul>
              <div class="warning">
                <strong>⚠️ Security Notice:</strong> Never share this code with customer support or anyone else. They will never ask for it.
              </div>
            </div>
            <div class="footer">
              <p>© 2026 Auth Service. All rights reserved.</p>
              <p>This is an automated message. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Send welcome email to new users
   * @param {string} email - Recipient email
   * @param {string} name - User name
   * @returns {Promise<{success, error}>}
   */
  async sendWelcomeEmail(email, name = "User") {
    try {
      if (!this.transporter) {
        return {
          success: false,
          error: "Email service not configured",
        };
      }

      const mailOptions = {
        from: `${this.emailFromName} <${this.emailFrom}>`,
        to: email,
        subject: "Welcome to Our Platform!",
        html: this.getWelcomeTemplate(name),
        text: `Welcome ${name}! Your account has been created successfully.`,
      };

      await this.transporter.sendMail(mailOptions);

      console.log(`✅ Welcome email sent to ${email}`);
      return { success: true, error: null };
    } catch (error) {
      console.error(
        `❌ Failed to send welcome email to ${email}:`,
        error.message,
      );
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * HTML email template for welcome email
   * @param {string} name - User name
   * @returns {string} HTML email content
   */
  getWelcomeTemplate(name) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; }
            .header { text-align: center; color: #007bff; margin-bottom: 20px; }
            .header h1 { margin: 0; }
            .content { color: #555; line-height: 1.6; }
            .footer { text-align: center; border-top: 2px solid #f0f0f0; padding-top: 20px; margin-top: 20px; color: #999; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>👋 Welcome ${name}!</h1>
            </div>
            <div class="content">
              <p>Thank you for creating an account with us. We're excited to have you on board!</p>
              <p>Your account is now active and ready to use. You can log in anytime with your credentials.</p>
              <p>If you have any questions, feel free to reach out to our support team.</p>
              <p>Best regards,<br>The Auth Service Team</p>
            </div>
            <div class="footer">
              <p>© 2024 Auth Service. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Verify transporter is working
   * @returns {Promise<boolean>}
   */
  async verifyTransporter() {
    try {
      if (!this.transporter) {
        return false;
      }
      await this.transporter.verify();
      console.log("✅ Email transporter verified successfully");
      return true;
    } catch (error) {
      console.error("❌ Email transporter verification failed:", error.message);
      return false;
    }
  }
}

module.exports = new EmailService();
