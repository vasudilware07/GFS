# 🍎 Ganesh Fruit Suppliers - B2B Wholesale Platform

A complete B2B ecommerce and billing management system for wholesale fruit business. Built with Node.js, Express, and MongoDB.

## ✨ Features

### 👤 User Management
- **Admin** - Full control over system
- **Customers** - Wholesale buyers with credit limits

### 📦 Product Management
- Add/Edit/Delete products (fruits)
- Stock tracking with low stock alerts
- Bulk price updates
- Category management (Fruits, Exotic, Seasonal, Dry Fruits)

### 🛒 Order Management
- Place wholesale orders
- Order status tracking (Pending → Confirmed → Shipped → Delivered)
- Credit limit enforcement
- Auto stock deduction

### 🧾 Invoice & Billing
- GST-compliant PDF invoices
- Auto invoice generation
- Email invoices to customers
- Payment due reminders (automated via cron)
- Overdue tracking

### 💰 Payment Management
- Record payments (Cash, UPI, Bank Transfer, Cheque)
- Partial payment support
- Auto-update dues on payment
- Payment confirmation emails

### 📊 Reports & Analytics
- Dashboard with key metrics
- Sales reports (daily/weekly/monthly)
- Customer-wise dues report
- Top selling products
- Profit/Loss overview

### 🔔 Automated Reminders
- Daily cron job at 9 AM
- Due soon reminders (3 days before)
- Overdue reminders (every 3 days)
- Auto-block users with 30+ days overdue

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MongoDB (local or cloud)
- npm or yarn

### Installation

1. **Clone/Navigate to project**
```bash
cd ganesh-fruit-suppliers
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment**
```bash
# Copy example env file
cp .env.example .env

# Edit .env with your values
```

4. **Start MongoDB** (if local)
```bash
# Windows
mongod

# Or use MongoDB Atlas cloud
```

5. **Seed database** (creates admin + sample data)
```bash
npm run seed
```

6. **Start server**
```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Server runs at: **http://localhost:5000**

---

## 🔐 Default Credentials

### Admin
- **Email:** admin@ganeshfruits.com
- **Password:** admin123

### Sample Customer
- **Email:** rahul@freshmart.com
- **Password:** customer123

---

## 📚 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new customer |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get profile |
| PUT | `/api/auth/me` | Update profile |
| PUT | `/api/auth/change-password` | Change password |

### Users (Admin only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List all users |
| GET | `/api/users/:id` | Get user details |
| POST | `/api/users` | Create user |
| PUT | `/api/users/:id` | Update user |
| PUT | `/api/users/:id/block` | Block/Unblock user |
| PUT | `/api/users/:id/credit-limit` | Update credit limit |
| DELETE | `/api/users/:id` | Delete user |
| GET | `/api/users/with-dues` | Users with outstanding dues |

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List products |
| GET | `/api/products/:id` | Get product |
| POST | `/api/products` | Create product (Admin) |
| PUT | `/api/products/:id` | Update product (Admin) |
| PUT | `/api/products/:id/stock` | Update stock (Admin) |
| DELETE | `/api/products/:id` | Delete product (Admin) |
| GET | `/api/products/admin/low-stock` | Low stock alert (Admin) |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/orders` | Create order |
| GET | `/api/orders` | List orders |
| GET | `/api/orders/:id` | Get order details |
| PUT | `/api/orders/:id/status` | Update status (Admin) |
| PUT | `/api/orders/:id/cancel` | Cancel order |
| POST | `/api/orders/:id/invoice` | Generate invoice (Admin) |

### Invoices
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/invoices` | List invoices |
| GET | `/api/invoices/:id` | Get invoice |
| GET | `/api/invoices/:id/download` | Download PDF |
| POST | `/api/invoices/:id/resend` | Resend email (Admin) |
| POST | `/api/invoices/:id/reminder` | Send reminder (Admin) |
| GET | `/api/invoices/admin/overdue` | Overdue invoices (Admin) |
| GET | `/api/invoices/admin/due-soon` | Due soon invoices (Admin) |

### Payments (Admin)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payments` | Record payment |
| GET | `/api/payments` | List payments |
| GET | `/api/payments/:id` | Get payment |
| GET | `/api/payments/admin/summary` | Payment summary |

### Reports (Admin)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reports/dashboard` | Dashboard stats |
| GET | `/api/reports/sales` | Sales report |
| GET | `/api/reports/dues` | Dues report |
| GET | `/api/reports/top-products` | Top selling products |
| GET | `/api/reports/profit` | Profit/Loss report |

---

## 📧 Email Configuration

For email functionality, update `.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM=Ganesh Fruit Suppliers <your_email@gmail.com>
```

**Gmail Setup:**
1. Enable 2-Factor Authentication
2. Generate App Password: Google Account → Security → App Passwords
3. Use the 16-character password in `SMTP_PASS`

---

## 📁 Project Structure

```
ganesh-fruit-suppliers/
├── src/
│   ├── config/
│   │   ├── db.js           # MongoDB connection
│   │   ├── env.js          # Environment config
│   │   └── mail.js         # Email transporter
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   ├── product.controller.js
│   │   ├── order.controller.js
│   │   ├── invoice.controller.js
│   │   ├── payment.controller.js
│   │   └── report.controller.js
│   ├── middlewares/
│   │   ├── auth.middleware.js
│   │   └── role.middleware.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Product.js
│   │   ├── Order.js
│   │   ├── Invoice.js
│   │   └── Payment.js
│   ├── routes/
│   │   └── [all routes]
│   ├── utils/
│   │   ├── pdfGenerator.js  # Invoice PDF
│   │   └── emailSender.js   # Email templates
│   ├── cron/
│   │   └── dueReminder.cron.js
│   ├── app.js
│   ├── server.js
│   └── seed.js
├── invoices/                # Generated PDFs
├── .env
├── .env.example
├── package.json
└── README.md
```

---

## 🧪 API Testing

### Using cURL

**Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ganeshfruits.com","password":"admin123"}'
```

**Get Products:**
```bash
curl http://localhost:5000/api/products
```

**Create Order (with token):**
```bash
curl -X POST http://localhost:5000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "items": [
      {"productId": "PRODUCT_ID", "quantity": 10}
    ]
  }'
```

### Using Postman
1. Import the endpoints
2. Set `{{baseUrl}}` = `http://localhost:5000`
3. After login, set `{{token}}` from response

---

## 🌐 Deployment

### Environment Variables for Production
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/ganesh-fruits
JWT_SECRET=your_very_long_random_secret_key
```

### Deploy to:
- **Railway** - Easy Node.js deployment
- **Render** - Free tier available
- **DigitalOcean** - App Platform
- **AWS** - EC2 or Elastic Beanstalk

---

## 📝 License

ISC License

---

## 👨‍💻 Author

**Ganesh Fruit Suppliers**

---

## 🆘 Support

For issues or questions, contact: ganeshfruits@example.com
