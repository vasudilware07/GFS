const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const config = require("../config/env");

// Ensure invoices directory exists
const invoicesDir = path.join(__dirname, "../../invoices");
if (!fs.existsSync(invoicesDir)) {
  fs.mkdirSync(invoicesDir, { recursive: true });
}

/**
 * Generate GST-style Invoice PDF
 * @param {Object} invoice - Invoice document
 * @param {Object} order - Order document with items
 * @param {Object} user - User/Customer document
 * @returns {Promise<string>} - Path to generated PDF
 */
async function generateInvoicePDF(invoice, order, user) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: "A4" });
      const fileName = `${invoice.invoiceNumber}.pdf`;
      const filePath = path.join(invoicesDir, fileName);
      const writeStream = fs.createWriteStream(filePath);
      
      doc.pipe(writeStream);
      
      // ===== HEADER =====
      doc.fontSize(24).font("Helvetica-Bold").text(config.business.name, { align: "center" });
      doc.fontSize(10).font("Helvetica").text("Wholesale Fruit Suppliers", { align: "center" });
      doc.moveDown(0.5);
      
      // Business details
      doc.fontSize(9).text(config.business.address, { align: "center" });
      doc.text(`Phone: ${config.business.phone} | Email: ${config.business.email}`, { align: "center" });
      doc.text(`GSTIN: ${config.business.gst}`, { align: "center" });
      
      doc.moveDown();
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown();
      
      // ===== TAX INVOICE TITLE =====
      doc.fontSize(16).font("Helvetica-Bold").text("TAX INVOICE", { align: "center" });
      doc.moveDown();
      
      // ===== INVOICE & CUSTOMER DETAILS =====
      const detailsTop = doc.y;
      
      // Left column - Invoice details
      doc.fontSize(10).font("Helvetica-Bold").text("Invoice Details:", 50, detailsTop);
      doc.font("Helvetica").fontSize(9);
      doc.text(`Invoice No: ${invoice.invoiceNumber}`, 50, doc.y + 5);
      doc.text(`Invoice Date: ${formatDate(invoice.invoiceDate)}`, 50, doc.y + 3);
      doc.text(`Due Date: ${formatDate(invoice.dueDate)}`, 50, doc.y + 3);
      doc.text(`Order No: ${order.orderNumber}`, 50, doc.y + 3);
      
      // Right column - Customer details
      doc.fontSize(10).font("Helvetica-Bold").text("Bill To:", 300, detailsTop);
      doc.font("Helvetica").fontSize(9);
      doc.text(`${user.shopName}`, 300, doc.y + 5);
      doc.text(`${user.ownerName}`, 300, doc.y + 3);
      doc.text(`${user.getFullAddress() || "Address not provided"}`, 300, doc.y + 3);
      doc.text(`Phone: ${user.phone}`, 300, doc.y + 3);
      if (user.gstNumber) {
        doc.text(`GSTIN: ${user.gstNumber}`, 300, doc.y + 3);
      }
      
      doc.moveDown(3);
      
      // ===== ITEMS TABLE =====
      const tableTop = doc.y + 10;
      const tableHeaders = ["#", "Item", "HSN", "Qty", "Unit", "Rate (₹)", "GST %", "Amount (₹)"];
      const colWidths = [25, 140, 50, 40, 40, 60, 45, 70];
      let xPos = 50;
      
      // Table header background
      doc.rect(50, tableTop - 5, 495, 20).fill("#f0f0f0");
      
      // Table headers
      doc.fillColor("#000000").fontSize(9).font("Helvetica-Bold");
      tableHeaders.forEach((header, i) => {
        doc.text(header, xPos, tableTop, { width: colWidths[i], align: i > 2 ? "right" : "left" });
        xPos += colWidths[i];
      });
      
      // Table rows
      let yPos = tableTop + 25;
      doc.font("Helvetica").fontSize(9);
      
      order.items.forEach((item, index) => {
        xPos = 50;
        const rowData = [
          (index + 1).toString(),
          item.name,
          item.hsnCode || "0808",
          item.quantity.toString(),
          item.unit,
          item.pricePerUnit.toFixed(2),
          (item.gstRate || 0).toString(),
          item.totalPrice.toFixed(2)
        ];
        
        rowData.forEach((data, i) => {
          doc.text(data, xPos, yPos, { width: colWidths[i], align: i > 2 ? "right" : "left" });
          xPos += colWidths[i];
        });
        
        yPos += 20;
        
        // Add new page if needed
        if (yPos > 700) {
          doc.addPage();
          yPos = 50;
        }
      });
      
      // Table border
      doc.moveTo(50, tableTop - 5).lineTo(545, tableTop - 5).stroke();
      doc.moveTo(50, tableTop + 15).lineTo(545, tableTop + 15).stroke();
      doc.moveTo(50, yPos).lineTo(545, yPos).stroke();
      
      doc.moveDown(2);
      
      // ===== TOTALS =====
      const totalsX = 380;
      yPos = doc.y + 10;
      
      doc.fontSize(10);
      doc.text("Subtotal:", totalsX, yPos);
      doc.text(`₹ ${order.subtotal.toFixed(2)}`, totalsX + 100, yPos, { align: "right" });
      
      if (order.gstAmount > 0) {
        yPos += 18;
        doc.text("GST:", totalsX, yPos);
        doc.text(`₹ ${order.gstAmount.toFixed(2)}`, totalsX + 100, yPos, { align: "right" });
      }
      
      if (order.discount > 0) {
        yPos += 18;
        doc.text("Discount:", totalsX, yPos);
        doc.text(`- ₹ ${order.discount.toFixed(2)}`, totalsX + 100, yPos, { align: "right" });
      }
      
      yPos += 20;
      doc.moveTo(totalsX, yPos).lineTo(545, yPos).stroke();
      
      yPos += 8;
      doc.fontSize(12).font("Helvetica-Bold");
      doc.text("Total Amount:", totalsX, yPos);
      doc.text(`₹ ${order.totalAmount.toFixed(2)}`, totalsX + 100, yPos, { align: "right" });
      
      if (invoice.paidAmount > 0) {
        yPos += 20;
        doc.fontSize(10).font("Helvetica");
        doc.text("Paid Amount:", totalsX, yPos);
        doc.text(`₹ ${invoice.paidAmount.toFixed(2)}`, totalsX + 100, yPos, { align: "right" });
        
        yPos += 18;
        doc.font("Helvetica-Bold").fillColor(invoice.dueAmount > 0 ? "#cc0000" : "#008800");
        doc.text("Balance Due:", totalsX, yPos);
        doc.text(`₹ ${invoice.dueAmount.toFixed(2)}`, totalsX + 100, yPos, { align: "right" });
        doc.fillColor("#000000");
      }
      
      // ===== AMOUNT IN WORDS =====
      doc.moveDown(3);
      doc.fontSize(10).font("Helvetica-Bold");
      doc.text(`Amount in Words: ${numberToWords(order.totalAmount)} Rupees Only`, 50);
      
      // ===== BANK DETAILS =====
      doc.moveDown(2);
      doc.fontSize(10).font("Helvetica-Bold").text("Bank Details:", 50);
      doc.fontSize(9).font("Helvetica");
      doc.text("Bank: State Bank of India", 50);
      doc.text("Account Name: Ganesh Fruit Suppliers", 50);
      doc.text("Account No: 1234567890", 50);
      doc.text("IFSC Code: SBIN0001234", 50);
      
      // ===== TERMS & CONDITIONS =====
      doc.moveDown(2);
      doc.fontSize(9).font("Helvetica-Bold").text("Terms & Conditions:", 50);
      doc.font("Helvetica").fontSize(8);
      doc.text("1. Payment is due within the specified due date.", 50);
      doc.text("2. Late payments may attract interest charges.", 50);
      doc.text("3. Goods once sold will not be taken back.", 50);
      doc.text("4. Subject to local jurisdiction.", 50);
      
      // ===== SIGNATURE =====
      doc.moveDown(3);
      doc.fontSize(10).text("For " + config.business.name, 400, doc.y, { align: "right" });
      doc.moveDown(3);
      doc.text("Authorized Signatory", 400, doc.y, { align: "right" });
      
      // ===== FOOTER =====
      doc.fontSize(8).text("This is a computer generated invoice.", 50, 780, { align: "center" });
      
      doc.end();
      
      writeStream.on("finish", () => {
        resolve(filePath);
      });
      
      writeStream.on("error", reject);
      
    } catch (error) {
      reject(error);
    }
  });
}

// Helper: Format date
function formatDate(date) {
  const d = new Date(date);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

// Helper: Convert number to words
function numberToWords(num) {
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  
  if (num === 0) return "Zero";
  
  const numStr = Math.floor(num).toString();
  
  if (numStr.length > 9) return "Amount too large";
  
  const n = ("000000000" + numStr).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return "";
  
  let str = "";
  str += (n[1] != 0) ? (ones[Number(n[1])] || tens[n[1][0]] + " " + ones[n[1][1]]) + " Crore " : "";
  str += (n[2] != 0) ? (ones[Number(n[2])] || tens[n[2][0]] + " " + ones[n[2][1]]) + " Lakh " : "";
  str += (n[3] != 0) ? (ones[Number(n[3])] || tens[n[3][0]] + " " + ones[n[3][1]]) + " Thousand " : "";
  str += (n[4] != 0) ? (ones[Number(n[4])] || tens[n[4][0]] + " " + ones[n[4][1]]) + " Hundred " : "";
  str += (n[5] != 0) ? (ones[Number(n[5])] || tens[n[5][0]] + " " + ones[n[5][1]]) : "";
  
  return str.trim();
}

module.exports = { generateInvoicePDF };
