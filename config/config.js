require("dotenv").config();

module.exports = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD || null,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST || "127.0.0.1",
    port: 5432,
    dialect: "postgres",
  },

  production: {
    username: process.env.SUPABASE_USER,
    password: process.env.SUPABASE_PASSWORD,
    database: process.env.SUPABASE_DATABASE,
    host: process.env.SUPABASE_HOST,
    port: process.env.SUPABASE_PORT,
    pool_mode: "transaction",
    dialect: "postgres",
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  },
};
