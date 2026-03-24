"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("password_reset_codes", {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: true,
        comment: "Reference to Supabase auth.users.id - no FK since it's managed by Supabase",
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      code: {
        type: Sequelize.STRING(6),
        allowNull: false,
        unique: true,
      },
      attempts: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      max_attempts: {
        type: Sequelize.INTEGER,
        defaultValue: 5,
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      used_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    // Add indexes
    await queryInterface.addIndex("password_reset_codes", {
      fields: ["email"],
      name: "idx_password_reset_codes_email",
    });

    await queryInterface.addIndex("password_reset_codes", {
      fields: ["code"],
      name: "idx_password_reset_codes_code",
    });

    await queryInterface.addIndex("password_reset_codes", {
      fields: ["user_id"],
      name: "idx_password_reset_codes_user_id",
    });

    await queryInterface.addIndex("password_reset_codes", {
      fields: ["expires_at"],
      name: "idx_password_reset_codes_expires_at",
    });

    // Composite index for efficient lookups
    await queryInterface.addIndex("password_reset_codes", {
      fields: ["email", "code"],
      name: "idx_password_reset_codes_email_code_unused",
      where: { used_at: null, deleted_at: null },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("password_reset_codes");
  },
};
