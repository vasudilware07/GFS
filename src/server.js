const app = require("./app");
const connectDB = require("./config/db");
const config = require("./config/env");
const { startDueReminderCron } = require("./cron/dueReminder.cron");

// Connect to database
connectDB();

// Start cron jobs
startDueReminderCron();

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`
  🍎 LBR Fruit Suppliers API
  ============================
  📦 Server running on port ${PORT}
  🌐 URL: http://localhost:${PORT}
  📊 Environment: ${config.nodeEnv}
  
  📌 API Endpoints:
  • Auth:     http://localhost:${PORT}/api/auth
  • Users:    http://localhost:${PORT}/api/users
  • Products: http://localhost:${PORT}/api/products
  • Orders:   http://localhost:${PORT}/api/orders
  • Invoices: http://localhost:${PORT}/api/invoices
  • Payments: http://localhost:${PORT}/api/payments
  • Reports:  http://localhost:${PORT}/api/reports
  `);
});
