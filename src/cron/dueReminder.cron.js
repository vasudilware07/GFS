const cron = require("node-cron");
const { Invoice, User } = require("../models");
const { sendDueReminderEmail } = require("../utils/emailSender");

/**
 * Due Reminder Cron Job
 * Runs every day at 9:00 AM
 * Sends reminders for:
 * 1. Invoices due within 3 days
 * 2. Overdue invoices (every 3 days)
 */
function startDueReminderCron() {
  // Run every day at 9:00 AM
  cron.schedule("0 9 * * *", async () => {
    console.log("🔔 Running due reminder cron job...");
    
    try {
      const now = new Date();
      
      // 1. Get invoices due within 3 days (not yet due)
      const dueSoonInvoices = await Invoice.getDueSoonInvoices(3);
      
      for (const invoice of dueSoonInvoices) {
        const user = await User.findById(invoice.userId);
        if (user && user.email) {
          try {
            await sendDueReminderEmail(user, invoice, 0);
            
            // Update reminder count
            invoice.remindersSent += 1;
            invoice.lastReminderAt = now;
            await invoice.save();
            
            console.log(`📧 Due soon reminder sent to ${user.email} for invoice ${invoice.invoiceNumber}`);
          } catch (emailError) {
            console.error(`Failed to send reminder to ${user.email}:`, emailError.message);
          }
        }
      }
      
      // 2. Get overdue invoices
      const overdueInvoices = await Invoice.getOverdueInvoices();
      
      for (const invoice of overdueInvoices) {
        // Only send reminder every 3 days for overdue
        const lastReminder = invoice.lastReminderAt ? new Date(invoice.lastReminderAt) : null;
        const daysSinceLastReminder = lastReminder 
          ? Math.floor((now - lastReminder) / (1000 * 60 * 60 * 24))
          : 999;
        
        if (daysSinceLastReminder >= 3) {
          const user = await User.findById(invoice.userId);
          if (user && user.email) {
            const daysOverdue = Math.floor((now - new Date(invoice.dueDate)) / (1000 * 60 * 60 * 24));
            
            try {
              await sendDueReminderEmail(user, invoice, daysOverdue);
              
              // Update reminder count
              invoice.remindersSent += 1;
              invoice.lastReminderAt = now;
              await invoice.save();
              
              console.log(`📧 Overdue reminder sent to ${user.email} for invoice ${invoice.invoiceNumber} (${daysOverdue} days overdue)`);
              
              // Block user if more than 30 days overdue
              if (daysOverdue > 30 && !user.isBlocked) {
                user.isBlocked = true;
                await user.save();
                console.log(`🚫 User ${user.email} blocked due to 30+ days overdue payment`);
              }
            } catch (emailError) {
              console.error(`Failed to send overdue reminder to ${user.email}:`, emailError.message);
            }
          }
        }
      }
      
      console.log("✅ Due reminder cron job completed");
      
    } catch (error) {
      console.error("❌ Cron job error:", error.message);
    }
  });
  
  console.log("⏰ Due reminder cron job scheduled (daily at 9:00 AM)");
}

module.exports = { startDueReminderCron };
