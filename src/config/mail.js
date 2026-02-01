const nodemailer = require("nodemailer");
const config = require("./env");

const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: false,
  auth: {
    user: config.smtp.user,
    pass: config.smtp.pass
  }
});

// Verify connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.log("⚠️  Email service not configured:", error.message);
  } else {
    console.log("✅ Email service ready");
  }
});

module.exports = transporter;
