const { Order, Invoice, Payment, User, Product } = require("../models");

/**
 * @desc    Get admin dashboard stats
 * @route   GET /api/reports/dashboard
 * @access  Admin
 */
exports.getDashboard = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
    
    // Today's orders
    const todayOrders = await Order.countDocuments({
      createdAt: { $gte: today }
    });
    
    // Today's sales
    const todaySalesResult = await Order.aggregate([
      { $match: { createdAt: { $gte: today }, status: { $ne: "CANCELLED" } } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);
    const todaySales = todaySalesResult[0]?.total || 0;
    
    // This month sales
    const monthSalesResult = await Order.aggregate([
      { $match: { createdAt: { $gte: thisMonth }, status: { $ne: "CANCELLED" } } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);
    const monthSales = monthSalesResult[0]?.total || 0;
    
    // Last month sales (for comparison)
    const lastMonthSalesResult = await Order.aggregate([
      { $match: { createdAt: { $gte: lastMonth, $lte: lastMonthEnd }, status: { $ne: "CANCELLED" } } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);
    const lastMonthSales = lastMonthSalesResult[0]?.total || 0;
    
    // Total outstanding dues
    const duesResult = await Invoice.aggregate([
      { $match: { isPaid: false } },
      { $group: { _id: null, total: { $sum: "$dueAmount" } } }
    ]);
    const totalDues = duesResult[0]?.total || 0;
    
    // Overdue invoices count
    const overdueCount = await Invoice.countDocuments({
      isPaid: false,
      dueDate: { $lt: today }
    });
    
    // Today's payments received
    const todayPaymentsResult = await Payment.aggregate([
      { $match: { paymentDate: { $gte: today } } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const todayPayments = todayPaymentsResult[0]?.total || 0;
    
    // Active customers
    const activeCustomers = await User.countDocuments({ role: "USER", isActive: true });
    
    // Low stock products
    const lowStockProducts = await Product.countDocuments({
      $expr: { $lte: ["$stock", "$lowStockThreshold"] }
    });
    
    // Pending orders
    const pendingOrders = await Order.countDocuments({ status: "PENDING" });
    
    // Orders by status
    const ordersByStatusResult = await Order.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);
    const ordersByStatus = {};
    ordersByStatusResult.forEach(item => {
      ordersByStatus[item._id] = item.count;
    });
    
    res.json({
      success: true,
      data: {
        today: {
          orders: todayOrders,
          sales: todaySales,
          payments: todayPayments
        },
        thisMonth: {
          sales: monthSales,
          growth: lastMonthSales > 0 
            ? Math.round(((monthSales - lastMonthSales) / lastMonthSales) * 100)
            : 0
        },
        dues: {
          total: totalDues,
          overdueCount
        },
        customers: {
          active: activeCustomers
        },
        inventory: {
          lowStock: lowStockProducts
        },
        orders: {
          pending: pendingOrders
        },
        ordersByStatus
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Get sales report
 * @route   GET /api/reports/sales
 * @access  Admin
 */
exports.getSalesReport = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = "day" } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    
    let dateFormat;
    switch (groupBy) {
      case "month":
        dateFormat = { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } };
        break;
      case "week":
        dateFormat = { year: { $year: "$createdAt" }, week: { $week: "$createdAt" } };
        break;
      default:
        dateFormat = { 
          year: { $year: "$createdAt" }, 
          month: { $month: "$createdAt" }, 
          day: { $dayOfMonth: "$createdAt" } 
        };
    }
    
    const salesData = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          status: { $ne: "CANCELLED" }
        }
      },
      {
        $group: {
          _id: dateFormat,
          totalSales: { $sum: "$totalAmount" },
          orderCount: { $sum: 1 },
          avgOrderValue: { $avg: "$totalAmount" }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
    ]);
    
    // Calculate totals
    const totals = salesData.reduce((acc, item) => {
      acc.sales += item.totalSales;
      acc.orders += item.orderCount;
      return acc;
    }, { sales: 0, orders: 0 });
    
    res.json({
      success: true,
      data: {
        period: { start, end, groupBy },
        salesData,
        totals: {
          ...totals,
          avgOrderValue: totals.orders > 0 ? totals.sales / totals.orders : 0
        }
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Get customer-wise dues report
 * @route   GET /api/reports/dues
 * @access  Admin
 */
exports.getDuesReport = async (req, res) => {
  try {
    const duesData = await Invoice.aggregate([
      { $match: { isPaid: false } },
      {
        $group: {
          _id: "$userId",
          totalDue: { $sum: "$dueAmount" },
          invoiceCount: { $sum: 1 },
          oldestDueDate: { $min: "$dueDate" }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: "$user" },
      {
        $project: {
          userId: "$_id",
          shopName: "$user.shopName",
          ownerName: "$user.ownerName",
          email: "$user.email",
          phone: "$user.phone",
          totalDue: 1,
          invoiceCount: 1,
          oldestDueDate: 1,
          isBlocked: "$user.isBlocked"
        }
      },
      { $sort: { totalDue: -1 } }
    ]);
    
    const totalDue = duesData.reduce((sum, item) => sum + item.totalDue, 0);
    
    res.json({
      success: true,
      data: {
        customers: duesData,
        summary: {
          totalDue,
          customerCount: duesData.length
        }
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Get top selling products
 * @route   GET /api/reports/top-products
 * @access  Admin
 */
exports.getTopProducts = async (req, res) => {
  try {
    const { startDate, endDate, limit = 10 } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    
    const topProducts = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          status: { $ne: "CANCELLED" }
        }
      },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productId",
          name: { $first: "$items.name" },
          unit: { $first: "$items.unit" },
          totalQuantity: { $sum: "$items.quantity" },
          totalRevenue: { $sum: "$items.totalPrice" },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: parseInt(limit) }
    ]);
    
    res.json({
      success: true,
      data: topProducts
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Get profit/loss report
 * @route   GET /api/reports/profit
 * @access  Admin
 */
exports.getProfitReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    
    // Total sales
    const salesResult = await Order.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end }, status: { $ne: "CANCELLED" } } },
      { $group: { _id: null, total: { $sum: "$totalAmount" }, count: { $sum: 1 } } }
    ]);
    
    // Total payments received
    const paymentsResult = await Payment.aggregate([
      { $match: { paymentDate: { $gte: start, $lte: end } } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    
    const totalSales = salesResult[0]?.total || 0;
    const totalPayments = paymentsResult[0]?.total || 0;
    const orderCount = salesResult[0]?.count || 0;
    
    res.json({
      success: true,
      data: {
        period: { start, end },
        sales: {
          total: totalSales,
          orderCount
        },
        payments: {
          received: totalPayments
        },
        outstanding: totalSales - totalPayments
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
