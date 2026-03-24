require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const app = express();

// Import routes
const authRoutes = require("./routes/auth.routes");

const { sequelize } = require("./models");

/* =====================
   Middleware
===================== */
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/* =====================
   Routes
===================== */
app.get("/", (req, res) => {
  res.status(200).send("Welcome to the API!");
});

app.use("/api/auth", authRoutes);

/* =====================
   Error Handling
===================== */
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Internal server error" });
});

/* =====================
   Server + DB Start
===================== */
const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  try {
    await sequelize.authenticate();
    console.log("Connected to PostgreSQL database successfully.");
  } catch (error) {
    console.error("Failed to connect to PostgreSQL database:", error.message);
  }

  console.log(`Server is running on port ${PORT}`);
});
