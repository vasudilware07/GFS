const PDFDocument = require("pdfkit");
const config = require("../config/env");
const streamifier = require("streamifier");

// Check if Cloudinary is configured
const useCloudinary = config.cloudinary.cloudName && config.cloudinary.apiKey && config.cloudinary.apiSecret;

let cloudinary;
if (useCloudinary) {
  cloudinary = require("cloudinary").v2;
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret
  });
}

// For local development only
const fs = require("fs");
const path = require("path");
const invoicesDir = path.join(__dirname, "../../invoices");

/**
 * Generate GST-style Invoice PDF
 * @param {Object} invoice - Invoice document
 * @param {Object} order - Order document with items
 * @param {Object} user - User/Customer document
 * @returns {Promise<string>} - Path/URL to generated PDF
 */
async function generateInvoicePDF(invoice, order, user) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: "A4" });
      const chunks = [];
      
      doc.on("data", (chunk) => chunks.push(chunk));
      
      doc.on("end", async () => {
        const pdfBuffer = Buffer.concat(chunks);
        
        if (useCloudinary) {
          // Upload to Cloudinary
          try {
            const uploadPromise = new Promise((res, rej) => {
              const uploadStream = cloudinary.uploader.upload_stream(
                {
                  folder: "lbr-fruits/invoices",
                  public_id: invoice.invoiceNumber,
                  resource_type: "raw",
                  format: "pdf"
                },
                (error, result) => {
                  if (error) rej(error);
                  else res(result);
                }
              );
              streamifier.createReadStream(pdfBuffer).pipe(uploadStream);
            });
            
            const result = await uploadPromise;
            resolve(result.secure_url);
          } catch (uploadError) {
            console.error("Cloudinary upload error:", uploadError);
            reject(uploadError);
          }
        } else {
          // Save locally for development
          if (!fs.existsSync(invoicesDir)) {
            fs.mkdirSync(invoicesDir, { recursive: true });
          }
          const fileName = `${invoice.invoiceNumber}.pdf`;
          const filePath = path.join(invoicesDir, fileName);
          fs.writeFileSync(filePath, pdfBuffer);
          resolve(filePath);
        }
      });
      
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
      doc.text(user.shopName || user.name, 300, doc.y + 5);
      if (user.kyc?.businessDetails?.businessType === 'individual') {
        doc.text(`Customer: ${user.name}`, 300, doc.y + 3);
      }
      if (user.kyc?.businessAddress) {
        const addr = user.kyc.businessAddress;
        doc.text(`${addr.street || ""}`, 300, doc.y + 3);
        doc.text(`${addr.city || ""}, ${addr.state || ""} ${addr.pincode || ""}`, 300, doc.y + 3);
      }
      doc.text(`Phone: ${user.phone || user.kyc?.phone || "N/A"}`, 300, doc.y + 3);
      if (user.kyc?.businessDetails?.gstNumber) {
        doc.text(`GSTIN: ${user.kyc.businessDetails.gstNumber}`, 300, doc.y + 3);
      }
      
      doc.moveDown(2);
      
      // ===== ITEMS TABLE =====
      const tableTop = doc.y + 10;
      const itemsPerPage = 15;
      
      // Table header
      drawTableHeader(doc, tableTop);
      
      let y = tableTop + 25;
      let itemIndex = 0;
      let pageSubtotal = 0;
      
      // Get items from order
      const items = order.items || [];
      
      items.forEach((item, i) => {
        if (itemIndex > 0 && itemIndex % itemsPerPage === 0) {
          // New page
          doc.addPage();
          drawTableHeader(doc, 50);
          y = 75;
        }
        
        const productName = item.productId?.name || item.name || "Product";
        const qty = item.quantity || 0;
        const unit = item.productId?.unit || item.unit || "KG";
        const rate = item.price || item.pricePerUnit || 0;
        const amount = qty * rate;
        pageSubtotal += amount;
        
        // Draw row
        doc.fontSize(8).font("Helvetica");
        doc.text(i + 1, 55, y, { width: 30, align: "center" });
        doc.text(productName.substring(0, 30), 90, y, { width: 150 });
        doc.text(`${qty} ${unit}`, 245, y, { width: 50, align: "center" });
        doc.text(`₹${rate.toFixed(2)}`, 300, y, { width: 60, align: "right" });
        doc.text(`₹${amount.toFixed(2)}`, 380, y, { width: 80, align: "right" });
        
        y += 20;
        itemIndex++;
      });
      
      // Draw table bottom line
      doc.moveTo(50, y).lineTo(545, y).stroke();
      
      // ===== TOTALS SECTION =====
      y += 15;
      const totalsX = 350;
      
      const subtotal = invoice.subtotal || order.subtotal || 0;
      const taxAmount = invoice.taxAmount || order.taxAmount || 0;
      const discount = invoice.discount || order.discount || 0;
      const total = invoice.totalAmount || order.totalAmount || 0;
      
      doc.fontSize(9).font("Helvetica");
      doc.text("Subtotal:", totalsX, y);
      doc.text(`₹${subtotal.toFixed(2)}`, 450, y, { width: 90, align: "right" });
      
      y += 15;
      doc.text("GST (18%):", totalsX, y);
      doc.text(`₹${taxAmount.toFixed(2)}`, 450, y, { width: 90, align: "right" });
      
      if (discount > 0) {
        y += 15;
        doc.text("Discount:", totalsX, y);
        doc.text(`-₹${discount.toFixed(2)}`, 450, y, { width: 90, align: "right" });
      }
      
      y += 20;
      doc.moveTo(totalsX, y).lineTo(545, y).stroke();
      y += 10;
      doc.fontSize(11).font("Helvetica-Bold");
      doc.text("Grand Total:", totalsX, y);
      doc.text(`₹${total.toFixed(2)}`, 450, y, { width: 90, align: "right" });
      
      // Amount in words
      y += 25;
      doc.fontSize(9).font("Helvetica");
      doc.text(`Amount in Words: ${numberToWords(Math.round(total))} Rupees Only`, 50, y);
      
      // ===== PAYMENT INFO =====
      y += 30;
      doc.fontSize(10).font("Helvetica-Bold").text("Payment Information:", 50, y);
      doc.font("Helvetica").fontSize(9);
      y += 15;
      doc.text(`Status: ${invoice.status || "UNPAID"}`, 50, y);
      doc.text(`Payment Mode: ${order.paymentMethod || "Cash on Delivery"}`, 200, y);
      
      // ===== BANK DETAILS =====
      y += 30;
      doc.fontSize(10).font("Helvetica-Bold").text("Bank Details:", 50, y);
      doc.font("Helvetica").fontSize(9);
      y += 15;
      doc.text("Bank: State Bank of India", 50, y);
      doc.text("Account No: 1234567890", 200, y);
      y += 12;
      doc.text("IFSC: SBIN0001234", 50, y);
      doc.text("Branch: Mumbai Main", 200, y);
      
      // ===== TERMS & CONDITIONS =====
      y += 30;
      doc.fontSize(8).font("Helvetica-Bold").text("Terms & Conditions:", 50, y);
      doc.font("Helvetica").fontSize(7);
      y += 12;
      doc.text("1. Payment is due within 7 days of invoice date.", 50, y);
      y += 10;
      doc.text("2. Goods once sold will not be taken back.", 50, y);
      y += 10;
      doc.text("3. Subject to Mumbai jurisdiction.", 50, y);
      
      // ===== SIGNATURE =====
      const signatureY = doc.page.height - 100;
      doc.fontSize(9).font("Helvetica");
      doc.text("For " + config.business.name, 400, signatureY, { align: "center" });
      doc.moveDown(2);
      doc.text("Authorized Signatory", 400, signatureY + 40, { align: "center" });
      
      // ===== FOOTER =====
      doc.fontSize(8).text(
        "This is a computer generated invoice and does not require signature.",
        50,
        doc.page.height - 40,
        { align: "center", width: 495 }
      );
      
      doc.end();
      
    } catch (error) {
      reject(error);
    }
  });
}

// Helper: Draw table header
function drawTableHeader(doc, y) {
  doc.fillColor("#f0f0f0").rect(50, y, 495, 20).fill();
  doc.fillColor("#000000");
  
  doc.fontSize(9).font("Helvetica-Bold");
  doc.text("S.No", 55, y + 5, { width: 30, align: "center" });
  doc.text("Description", 90, y + 5, { width: 150 });
  doc.text("Qty", 245, y + 5, { width: 50, align: "center" });
  doc.text("Rate", 300, y + 5, { width: 60, align: "right" });
  doc.text("Amount", 380, y + 5, { width: 80, align: "right" });
  
  doc.moveTo(50, y).lineTo(545, y).stroke();
  doc.moveTo(50, y + 20).lineTo(545, y + 20).stroke();
}

// Helper: Format date
function formatDate(date) {
  if (!date) return "N/A";
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
