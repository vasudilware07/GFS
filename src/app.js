const express = require("express");
const cors = require("cors");
const path = require("path");

// Load environment variables first
require("dotenv").config();

const passport = require("./config/passport");

const routes = require("./routes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Passport
app.use(passport.initialize());;

// Serve static files (invoices)
app.use("/invoices", express.static(path.join(__dirname, "../invoices")));

// Serve static files (uploads - images, videos, documents)
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// API Routes
app.use("/api", routes);

// Welcome route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "🍎 Welcome to LBR Fruit Suppliers API",
    version: "1.0.0",
    endpoints: {
      auth: "/api/auth",
      users: "/api/users",
      products: "/api/products",
      orders: "/api/orders",
      invoices: "/api/invoices",
      payments: "/api/payments",
      reports: "/api/reports",
      kyc: "/api/kyc",
      health: "/api/health"
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found"
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Error:", err.message);
  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error"
  });
});

module.exports = app;
