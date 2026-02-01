/**
 * Database Seed Script
 * Creates admin user and sample products
 * Run: npm run seed
 */

require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const config = require("./config/env");

// Import models
const { User, Product } = require("./models");

// Sample data
const adminUser = {
  role: "ADMIN",
  shopName: "LBR Fruit Suppliers",
  ownerName: "Admin",
  email: "admin@lbrfruits.com",
  phone: "+91 98765 43210",
  gstNumber: "27AABCU9603R1ZM",
  address: {
    street: "123 Market Road",
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400001"
  },
  creditLimit: 1000000,
  password: "admin123"
};

const sampleProducts = [
  // Fruits
  { name: "Apple (Kashmir)", category: "FRUITS", unit: "kg", pricePerUnit: 180, stock: 500, hsnCode: "0808", gstRate: 0 },
  { name: "Apple (Shimla)", category: "FRUITS", unit: "kg", pricePerUnit: 150, stock: 400, hsnCode: "0808", gstRate: 0 },
  { name: "Banana (Robusta)", category: "FRUITS", unit: "dozen", pricePerUnit: 45, stock: 1000, hsnCode: "0803", gstRate: 0 },
  { name: "Banana (Elaichi)", category: "FRUITS", unit: "dozen", pricePerUnit: 60, stock: 500, hsnCode: "0803", gstRate: 0 },
  { name: "Orange (Nagpur)", category: "FRUITS", unit: "kg", pricePerUnit: 80, stock: 600, hsnCode: "0805", gstRate: 0 },
  { name: "Orange (Kinnow)", category: "FRUITS", unit: "kg", pricePerUnit: 70, stock: 400, hsnCode: "0805", gstRate: 0 },
  { name: "Mango (Alphonso)", category: "SEASONAL", unit: "dozen", pricePerUnit: 800, stock: 200, hsnCode: "0804", gstRate: 0 },
  { name: "Mango (Kesar)", category: "SEASONAL", unit: "dozen", pricePerUnit: 500, stock: 300, hsnCode: "0804", gstRate: 0 },
  { name: "Grapes (Green)", category: "FRUITS", unit: "kg", pricePerUnit: 90, stock: 300, hsnCode: "0806", gstRate: 0 },
  { name: "Grapes (Black)", category: "FRUITS", unit: "kg", pricePerUnit: 100, stock: 250, hsnCode: "0806", gstRate: 0 },
  { name: "Pomegranate", category: "FRUITS", unit: "kg", pricePerUnit: 150, stock: 400, hsnCode: "0810", gstRate: 0 },
  { name: "Papaya", category: "FRUITS", unit: "kg", pricePerUnit: 40, stock: 300, hsnCode: "0807", gstRate: 0 },
  { name: "Watermelon", category: "SEASONAL", unit: "piece", pricePerUnit: 60, stock: 200, hsnCode: "0807", gstRate: 0 },
  { name: "Pineapple", category: "FRUITS", unit: "piece", pricePerUnit: 80, stock: 150, hsnCode: "0804", gstRate: 0 },
  { name: "Guava", category: "FRUITS", unit: "kg", pricePerUnit: 50, stock: 300, hsnCode: "0804", gstRate: 0 },
  { name: "Sapota (Chiku)", category: "FRUITS", unit: "kg", pricePerUnit: 70, stock: 250, hsnCode: "0810", gstRate: 0 },
  { name: "Custard Apple", category: "SEASONAL", unit: "kg", pricePerUnit: 120, stock: 150, hsnCode: "0810", gstRate: 0 },
  { name: "Coconut (Fresh)", category: "FRUITS", unit: "piece", pricePerUnit: 35, stock: 500, hsnCode: "0801", gstRate: 0 },
  
  // More Seasonal Fruits
  { name: "Litchi", category: "SEASONAL", unit: "kg", pricePerUnit: 150, stock: 200, hsnCode: "0810", gstRate: 0 },
  { name: "Jackfruit", category: "SEASONAL", unit: "kg", pricePerUnit: 60, stock: 100, hsnCode: "0810", gstRate: 0 },
  { name: "Jamun", category: "SEASONAL", unit: "kg", pricePerUnit: 100, stock: 150, hsnCode: "0810", gstRate: 0 },
  { name: "Mulberry", category: "SEASONAL", unit: "kg", pricePerUnit: 180, stock: 80, hsnCode: "0810", gstRate: 0 },
  { name: "Star Fruit", category: "SEASONAL", unit: "kg", pricePerUnit: 90, stock: 100, hsnCode: "0810", gstRate: 0 }
];

const sampleCustomer = {
  role: "USER",
  shopName: "Fresh Mart Store",
  ownerName: "Rahul Sharma",
  email: "rahul@freshmart.com",
  phone: "+91 98765 12345",
  gstNumber: "27AABCS1234R1Z5",
  address: {
    street: "456 Mall Road",
    city: "Pune",
    state: "Maharashtra",
    pincode: "411001"
  },
  creditLimit: 100000,
  password: "customer123"
};

async function seedDatabase() {
  try {
    // Connect to database
    await mongoose.connect(config.mongoUri);
    console.log("✅ Connected to MongoDB");
    
    // Clear existing data (optional - comment out if you want to keep existing data)
    await User.deleteMany({});
    await Product.deleteMany({});
    console.log("🗑️  Cleared existing data");
    
    // Create admin user
    const admin = await User.create(adminUser);
    console.log(`👤 Admin created: ${admin.email}`);
    
    // Create sample customer
    const customer = await User.create(sampleCustomer);
    console.log(`👤 Sample customer created: ${customer.email}`);
    
    // Create products
    const products = await Product.insertMany(sampleProducts);
    console.log(`🍎 Created ${products.length} products`);
    
    console.log(`
    ✅ Database seeded successfully!
    
    📌 Admin Login:
    Email: admin@lbrfruits.com
    Password: admin123
    
    📌 Sample Customer Login:
    Email: rahul@freshmart.com
    Password: customer123
    `);
    
    process.exit(0);
    
  } catch (error) {
    console.error("❌ Seed error:", error.message);
    process.exit(1);
  }
}

// Run seed
seedDatabase();
