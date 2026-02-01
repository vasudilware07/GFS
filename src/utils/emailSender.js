const transporter = require("../config/mail");
const config = require("../config/env");
const path = require("path");

/**
 * Send Invoice Email with PDF attachment
 */
async function sendInvoiceEmail(user, invoice, pdfPath) {
  const mailOptions = {
    from: config.smtp.from,
    to: user.email,
    subject: `Invoice ${invoice.invoiceNumber} - ${config.business.name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #4CAF50; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">🍎 ${config.business.name}</h1>
          <p style="margin: 5px 0 0 0;">Wholesale Fruit Suppliers</p>
        </div>
        
        <div style="padding: 20px; background: #f9f9f9;">
          <p>Dear <strong>${user.ownerName}</strong>,</p>
          
          <p>Please find attached the invoice for your recent order.</p>
          
          <div style="background: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0;"><strong>Invoice No:</strong></td>
                <td style="padding: 8px 0;">${invoice.invoiceNumber}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Invoice Date:</strong></td>
                <td style="padding: 8px 0;">${new Date(invoice.invoiceDate).toLocaleDateString("en-IN")}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Due Date:</strong></td>
                <td style="padding: 8px 0; color: #cc0000;"><strong>${new Date(invoice.dueDate).toLocaleDateString("en-IN")}</strong></td>
              </tr>
              <tr style="background: #f0f0f0;">
                <td style="padding: 12px 8px;"><strong>Total Amount:</strong></td>
                <td style="padding: 12px 8px; font-size: 18px;"><strong>₹ ${invoice.totalAmount.toFixed(2)}</strong></td>
              </tr>
            </table>
          </div>
          
          <p><strong>Payment Methods:</strong></p>
          <ul>
            <li>UPI / Google Pay / PhonePe</li>
            <li>Bank Transfer (details in invoice)</li>
            <li>Cash on delivery</li>
          </ul>
          
          <p>If you have any questions, please contact us at <a href="mailto:${config.business.email}">${config.business.email}</a></p>
          
          <p>Thank you for your business!</p>
          
          <p>Best regards,<br><strong>${config.business.name}</strong></p>
        </div>
        
        <div style="background: #333; color: white; padding: 15px; text-align: center; font-size: 12px;">
          <p style="margin: 0;">${config.business.address}</p>
          <p style="margin: 5px 0 0 0;">Phone: ${config.business.phone}</p>
        </div>
      </div>
    `,
    attachments: [
      {
        filename: `${invoice.invoiceNumber}.pdf`,
        path: pdfPath
      }
    ]
  };
  
  return transporter.sendMail(mailOptions);
}

/**
 * Send Payment Due Reminder Email
 */
async function sendDueReminderEmail(user, invoice, daysOverdue = 0) {
  const isOverdue = daysOverdue > 0;
  const subject = isOverdue 
    ? `⚠️ OVERDUE: Invoice ${invoice.invoiceNumber} - Payment Required`
    : `📅 Reminder: Invoice ${invoice.invoiceNumber} Due Soon`;
  
  const urgencyColor = isOverdue ? "#cc0000" : "#ff9800";
  const urgencyText = isOverdue 
    ? `This invoice is <strong>${daysOverdue} days overdue</strong>.`
    : `This invoice is due on <strong>${new Date(invoice.dueDate).toLocaleDateString("en-IN")}</strong>.`;
  
  const mailOptions = {
    from: config.smtp.from,
    to: user.email,
    subject: subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: ${urgencyColor}; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">${isOverdue ? "⚠️ Payment Overdue" : "📅 Payment Reminder"}</h1>
        </div>
        
        <div style="padding: 20px; background: #f9f9f9;">
          <p>Dear <strong>${user.ownerName}</strong>,</p>
          
          <p>${urgencyText}</p>
          
          <div style="background: white; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid ${urgencyColor};">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0;"><strong>Invoice No:</strong></td>
                <td style="padding: 8px 0;">${invoice.invoiceNumber}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Shop Name:</strong></td>
                <td style="padding: 8px 0;">${user.shopName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Total Amount:</strong></td>
                <td style="padding: 8px 0;">₹ ${invoice.totalAmount.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Paid Amount:</strong></td>
                <td style="padding: 8px 0;">₹ ${invoice.paidAmount.toFixed(2)}</td>
              </tr>
              <tr style="background: #ffebee;">
                <td style="padding: 12px 8px;"><strong>Due Amount:</strong></td>
                <td style="padding: 12px 8px; font-size: 20px; color: ${urgencyColor};"><strong>₹ ${invoice.dueAmount.toFixed(2)}</strong></td>
              </tr>
            </table>
          </div>
          
          ${isOverdue ? `
            <div style="background: #ffebee; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0; color: #cc0000;"><strong>⚠️ Important:</strong> Continued non-payment may result in suspension of your account and future orders.</p>
            </div>
          ` : ""}
          
          <p>Please make the payment at your earliest convenience.</p>
          
          <p><strong>Payment Methods:</strong></p>
          <ul>
            <li>UPI / Google Pay / PhonePe</li>
            <li>Bank Transfer (details in original invoice)</li>
            <li>Cash payment at shop</li>
          </ul>
          
          <p>If you have already made the payment, please ignore this reminder or contact us with payment details.</p>
          
          <p>Thank you,<br><strong>${config.business.name}</strong></p>
        </div>
        
        <div style="background: #333; color: white; padding: 15px; text-align: center; font-size: 12px;">
          <p style="margin: 0;">Contact: ${config.business.phone} | ${config.business.email}</p>
        </div>
      </div>
    `
  };
  
  return transporter.sendMail(mailOptions);
}

/**
 * Send Welcome Email to new user
 */
async function sendWelcomeEmail(user) {
  const mailOptions = {
    from: config.smtp.from,
    to: user.email,
    subject: `Welcome to ${config.business.name}! 🍎`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #4CAF50; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">🍎 Welcome to ${config.business.name}!</h1>
        </div>
        
        <div style="padding: 20px; background: #f9f9f9;">
          <p>Dear <strong>${user.ownerName}</strong>,</p>
          
          <p>Welcome to ${config.business.name}! Your account has been created successfully.</p>
          
          <div style="background: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Your Account Details:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0;"><strong>Shop Name:</strong></td>
                <td style="padding: 8px 0;">${user.shopName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Email:</strong></td>
                <td style="padding: 8px 0;">${user.email}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Credit Limit:</strong></td>
                <td style="padding: 8px 0;">₹ ${user.creditLimit.toLocaleString("en-IN")}</td>
              </tr>
            </table>
          </div>
          
          <p>You can now:</p>
          <ul>
            <li>Browse our fresh fruits catalog</li>
            <li>Place wholesale orders</li>
            <li>Track your orders and payments</li>
            <li>Download invoices</li>
          </ul>
          
          <p>If you have any questions, feel free to contact us!</p>
          
          <p>Best regards,<br><strong>${config.business.name}</strong></p>
        </div>
        
        <div style="background: #333; color: white; padding: 15px; text-align: center; font-size: 12px;">
          <p style="margin: 0;">${config.business.address}</p>
          <p style="margin: 5px 0 0 0;">Phone: ${config.business.phone}</p>
        </div>
      </div>
    `
  };
  
  return transporter.sendMail(mailOptions);
}

/**
 * Send Payment Confirmation Email
 */
async function sendPaymentConfirmationEmail(user, payment, invoice) {
  const mailOptions = {
    from: config.smtp.from,
    to: user.email,
    subject: `✅ Payment Received - ${payment.paymentNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #4CAF50; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">✅ Payment Received</h1>
        </div>
        
        <div style="padding: 20px; background: #f9f9f9;">
          <p>Dear <strong>${user.ownerName}</strong>,</p>
          
          <p>We have received your payment. Thank you!</p>
          
          <div style="background: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0;"><strong>Payment No:</strong></td>
                <td style="padding: 8px 0;">${payment.paymentNumber}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Invoice No:</strong></td>
                <td style="padding: 8px 0;">${invoice.invoiceNumber}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Payment Date:</strong></td>
                <td style="padding: 8px 0;">${new Date(payment.paymentDate).toLocaleDateString("en-IN")}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Payment Mode:</strong></td>
                <td style="padding: 8px 0;">${payment.paymentMode}</td>
              </tr>
              <tr style="background: #e8f5e9;">
                <td style="padding: 12px 8px;"><strong>Amount Paid:</strong></td>
                <td style="padding: 12px 8px; font-size: 18px; color: #4CAF50;"><strong>₹ ${payment.amount.toFixed(2)}</strong></td>
              </tr>
              ${invoice.dueAmount > 0 ? `
              <tr>
                <td style="padding: 8px 0;"><strong>Remaining Due:</strong></td>
                <td style="padding: 8px 0; color: #ff9800;">₹ ${invoice.dueAmount.toFixed(2)}</td>
              </tr>
              ` : ""}
            </table>
          </div>
          
          ${invoice.isPaid ? `
            <div style="background: #e8f5e9; padding: 15px; border-radius: 5px; text-align: center;">
              <p style="margin: 0; color: #4CAF50; font-size: 16px;"><strong>✅ Invoice Fully Paid</strong></p>
            </div>
          ` : ""}
          
          <p>Thank you for your business!</p>
          
          <p>Best regards,<br><strong>${config.business.name}</strong></p>
        </div>
        
        <div style="background: #333; color: white; padding: 15px; text-align: center; font-size: 12px;">
          <p style="margin: 0;">Contact: ${config.business.phone} | ${config.business.email}</p>
        </div>
      </div>
    `
  };
  
  return transporter.sendMail(mailOptions);
}

module.exports = {
  sendInvoiceEmail,
  sendDueReminderEmail,
  sendWelcomeEmail,
  sendPaymentConfirmationEmail
};
