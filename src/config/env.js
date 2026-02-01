require("dotenv").config();

module.exports = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  mongoUri: process.env.MONGODB_URI || "mongodb://localhost:27017/ganesh-fruit-suppliers",
  jwt: {
    secret: process.env.JWT_SECRET || "default_secret",
    expiresIn: process.env.JWT_EXPIRES_IN || "7d"
  },
  smtp: {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.EMAIL_FROM
  },
  business: {
    name: process.env.BUSINESS_NAME || "Ganesh Fruit Suppliers",
    address: process.env.BUSINESS_ADDRESS || "Mumbai, Maharashtra",
    phone: process.env.BUSINESS_PHONE || "+91 98765 43210",
    email: process.env.BUSINESS_EMAIL || "ganeshfruits@example.com",
    gst: process.env.BUSINESS_GST || "27AABCU9603R1ZM"
  }
};
