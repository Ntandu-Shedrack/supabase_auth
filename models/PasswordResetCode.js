module.exports = (sequelize, DataTypes) => {
  const PasswordResetCode = sequelize.define(
    "PasswordResetCode",
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "users",
          key: "id",
        },
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      code: {
        type: DataTypes.STRING(6),
        allowNull: false,
        unique: true,
      },
      attempts: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      max_attempts: {
        type: DataTypes.INTEGER,
        defaultValue: 5,
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      expires_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      used_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "password_reset_codes",
      timestamps: false,
      indexes: [
        {
          fields: ["email"],
          name: "idx_password_reset_codes_email",
        },
        {
          fields: ["code"],
          name: "idx_password_reset_codes_code",
        },
        {
          fields: ["user_id"],
          name: "idx_password_reset_codes_user_id",
        },
        {
          fields: ["expires_at"],
          name: "idx_password_reset_codes_expires_at",
        },
      ],
    },
  );

  /**
   * Check if a reset code is valid and not expired
   * @param {string} email - User email
   * @param {string} code - Reset code
   * @returns {Promise<boolean>}
   */
  PasswordResetCode.prototype.isValid = async function () {
    // Check if code has expired
    if (new Date(this.expires_at) < new Date()) {
      return false;
    }

    // Check if code has been used
    if (this.used_at) {
      return false;
    }

    // Check if max attempts exceeded
    if (this.attempts >= this.max_attempts) {
      return false;
    }

    return true;
  };

  /**
   * Mark reset code as used
   * @returns {Promise<PasswordResetCode>}
   */
  PasswordResetCode.prototype.markAsUsed = async function () {
    return this.update({ used_at: new Date() });
  };

  /**
   * Increment failed attempt counter
   * @returns {Promise<PasswordResetCode>}
   */
  PasswordResetCode.prototype.incrementAttempts = async function () {
    return this.increment("attempts");
  };

  /**
   * Find valid reset code by email and code
   * @param {string} email - User email
   * @param {string} code - Reset code
   * @returns {Promise<PasswordResetCode|null>}
   */
  PasswordResetCode.findByEmailAndCode = async function (email, code) {
    return this.findOne({
      where: {
        email,
        code,
        used_at: null,
        deleted_at: null,
      },
    });
  };

  /**
   * Find all valid reset codes for an email
   * @param {string} email - User email
   * @returns {Promise<PasswordResetCode[]>}
   */
  PasswordResetCode.findValidByEmail = async function (email) {
    return this.findAll({
      where: {
        email,
        used_at: null,
        deleted_at: null,
      },
    });
  };

  /**
   * Clean up expired reset codes
   * @returns {Promise<number>} Number of deleted records
   */
  PasswordResetCode.cleanupExpired = async function () {
    return this.destroy({
      where: {
        expires_at: {
          [sequelize.Sequelize.Op.lt]: new Date(),
        },
      },
    });
  };

  return PasswordResetCode;
};
