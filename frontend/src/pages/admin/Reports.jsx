import { useState, useEffect } from 'react';
import { FiCalendar, FiDownload, FiTrendingUp, FiDollarSign, FiPackage, FiUsers, FiBarChart2 } from 'react-icons/fi';
import { reportAPI } from '../../api';
import { PageLoading } from '../../components/Loading';
import toast from 'react-hot-toast';

export default function AdminReports() {
  const [reportType, setReportType] = useState('sales');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    try {
      let res;
      switch (reportType) {
        case 'sales':
          res = await reportAPI.getSalesReport(dateRange);
          break;
        case 'products':
          res = await reportAPI.getProductReport(dateRange);
          break;
        case 'customers':
          res = await reportAPI.getCustomerReport(dateRange);
          break;
        case 'payments':
          res = await reportAPI.getPaymentReport(dateRange);
          break;
        default:
          res = await reportAPI.getDashboard();
      }
      setReportData(res.data.data);
    } catch (error) {
      toast.error('Failed to fetch report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportType, dateRange]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Reports</h1>

      {/* Report Type Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { id: 'sales', label: 'Sales Report', icon: FiTrendingUp },
          { id: 'products', label: 'Products Report', icon: FiPackage },
          { id: 'customers', label: 'Customers Report', icon: FiUsers },
          { id: 'payments', label: 'Payments Report', icon: FiDollarSign },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setReportType(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              reportType === id 
                ? 'bg-green-600 text-white' 
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Date Range Filter */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex items-center gap-2">
            <FiCalendar className="text-gray-400" />
            <span className="text-gray-600">Date Range:</span>
          </div>
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
            className="input-field md:w-40"
          />
          <span className="text-gray-400">to</span>
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
            className="input-field md:w-40"
          />
          <button onClick={fetchReport} className="btn-primary">
            Generate Report
          </button>
        </div>
      </div>

      {/* Report Content */}
      {loading ? (
        <PageLoading />
      ) : reportData ? (
        <div className="space-y-6">
          {reportType === 'sales' && <SalesReport data={reportData} />}
          {reportType === 'products' && <ProductsReport data={reportData} />}
          {reportType === 'customers' && <CustomersReport data={reportData} />}
          {reportType === 'payments' && <PaymentsReport data={reportData} />}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <FiBarChart2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Select a report type and date range to generate report</p>
        </div>
      )}
    </div>
  );
}

function SalesReport({ data }) {
  return (
    <>
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4">
          <p className="text-sm text-gray-500 mb-1">Total Revenue</p>
          <p className="text-2xl font-bold text-green-600">₹{(data.totalRevenue || 0).toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-white rounded-xl p-4">
          <p className="text-sm text-gray-500 mb-1">Total Orders</p>
          <p className="text-2xl font-bold text-blue-600">{data.totalOrders || 0}</p>
        </div>
        <div className="bg-white rounded-xl p-4">
          <p className="text-sm text-gray-500 mb-1">Average Order Value</p>
          <p className="text-2xl font-bold text-purple-600">₹{(data.avgOrderValue || 0).toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-white rounded-xl p-4">
          <p className="text-sm text-gray-500 mb-1">Items Sold</p>
          <p className="text-2xl font-bold text-orange-600">{data.itemsSold || 0}</p>
        </div>
      </div>

      {/* Daily Sales */}
      {data.dailySales && data.dailySales.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-4">Daily Sales</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4">Date</th>
                  <th className="text-right py-2 px-4">Orders</th>
                  <th className="text-right py-2 px-4">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {data.dailySales.map((day, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-4">{day.date || day._id}</td>
                    <td className="py-2 px-4 text-right">{day.orders}</td>
                    <td className="py-2 px-4 text-right font-medium">₹{day.revenue?.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

function ProductsReport({ data }) {
  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4">
          <p className="text-sm text-gray-500 mb-1">Total Products</p>
          <p className="text-2xl font-bold text-gray-900">{data.totalProducts || 0}</p>
        </div>
        <div className="bg-white rounded-xl p-4">
          <p className="text-sm text-gray-500 mb-1">Low Stock</p>
          <p className="text-2xl font-bold text-yellow-600">{data.lowStock || 0}</p>
        </div>
        <div className="bg-white rounded-xl p-4">
          <p className="text-sm text-gray-500 mb-1">Out of Stock</p>
          <p className="text-2xl font-bold text-red-600">{data.outOfStock || 0}</p>
        </div>
      </div>

      {/* Top Selling Products */}
      {data.topProducts && data.topProducts.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-4">Top Selling Products</h3>
          <div className="space-y-4">
            {data.topProducts.map((product, index) => (
              <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                <span className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-bold">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{product.name}</p>
                  <p className="text-sm text-gray-500">{product.category}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{product.quantity} sold</p>
                  <p className="text-sm text-green-600">₹{product.revenue?.toLocaleString('en-IN')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function CustomersReport({ data }) {
  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4">
          <p className="text-sm text-gray-500 mb-1">Total Customers</p>
          <p className="text-2xl font-bold text-gray-900">{data.totalCustomers || 0}</p>
        </div>
        <div className="bg-white rounded-xl p-4">
          <p className="text-sm text-gray-500 mb-1">New Customers</p>
          <p className="text-2xl font-bold text-green-600">{data.newCustomers || 0}</p>
        </div>
        <div className="bg-white rounded-xl p-4">
          <p className="text-sm text-gray-500 mb-1">Active Customers</p>
          <p className="text-2xl font-bold text-blue-600">{data.activeCustomers || 0}</p>
        </div>
        <div className="bg-white rounded-xl p-4">
          <p className="text-sm text-gray-500 mb-1">Blocked</p>
          <p className="text-2xl font-bold text-red-600">{data.blockedCustomers || 0}</p>
        </div>
      </div>

      {/* Top Customers */}
      {data.topCustomers && data.topCustomers.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-4">Top Customers</h3>
          <div className="space-y-4">
            {data.topCustomers.map((customer, index) => (
              <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                <span className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{customer.shopName}</p>
                  <p className="text-sm text-gray-500">{customer.ownerName}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{customer.orders} orders</p>
                  <p className="text-sm text-green-600">₹{customer.totalSpent?.toLocaleString('en-IN')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function PaymentsReport({ data }) {
  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4">
          <p className="text-sm text-gray-500 mb-1">Total Received</p>
          <p className="text-2xl font-bold text-green-600">₹{(data.totalReceived || 0).toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-white rounded-xl p-4">
          <p className="text-sm text-gray-500 mb-1">Total Pending</p>
          <p className="text-2xl font-bold text-yellow-600">₹{(data.totalPending || 0).toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-white rounded-xl p-4">
          <p className="text-sm text-gray-500 mb-1">Transactions</p>
          <p className="text-2xl font-bold text-blue-600">{data.totalTransactions || 0}</p>
        </div>
        <div className="bg-white rounded-xl p-4">
          <p className="text-sm text-gray-500 mb-1">Avg Payment</p>
          <p className="text-2xl font-bold text-purple-600">₹{(data.avgPayment || 0).toLocaleString('en-IN')}</p>
        </div>
      </div>

      {/* Payment by Method */}
      {data.byMethod && Object.keys(data.byMethod).length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-4">Payments by Method</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(data.byMethod).map(([method, amount]) => (
              <div key={method} className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">{method}</p>
                <p className="text-xl font-bold text-gray-900">₹{amount.toLocaleString('en-IN')}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
