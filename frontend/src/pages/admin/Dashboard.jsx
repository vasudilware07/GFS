import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiPackage, FiUsers, FiFileText, FiDollarSign, FiTrendingUp, FiShoppingCart, 
  FiArrowUp, FiArrowDown, FiAlertCircle, FiClock, FiCheckCircle, FiBarChart2 
} from 'react-icons/fi';
import { reportAPI, orderAPI, productAPI } from '../../api';
import { PageLoading } from '../../components/Loading';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, ordersRes, productsRes] = await Promise.all([
        reportAPI.getDashboard(),
        orderAPI.getAll({ limit: 5, sort: '-createdAt' }),
        productAPI.getAll({ lowStock: true, limit: 5 }),
      ]);
      
      setStats(statsRes.data.data);
      // Handle nested response structure: orders are in data.data.orders
      const ordersData = ordersRes.data.data;
      setRecentOrders(Array.isArray(ordersData) ? ordersData : (ordersData?.orders || []));
      // Handle nested response structure: products are in data.data.products
      const productsData = productsRes.data.data;
      setLowStockProducts(Array.isArray(productsData) ? productsData : (productsData?.products || []));
    } catch (error) {
      toast.error('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <PageLoading />;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total Revenue"
          value={`₹${(stats?.totalRevenue || 0).toLocaleString('en-IN')}`}
          icon={FiDollarSign}
          trend={stats?.revenueTrend}
          color="green"
        />
        <StatsCard
          title="Total Orders"
          value={stats?.totalOrders || 0}
          icon={FiShoppingCart}
          trend={stats?.ordersTrend}
          color="blue"
        />
        <StatsCard
          title="Total Customers"
          value={stats?.totalCustomers || 0}
          icon={FiUsers}
          trend={stats?.customersTrend}
          color="purple"
        />
        <StatsCard
          title="Pending Invoices"
          value={stats?.pendingInvoices || 0}
          icon={FiFileText}
          subtitle={`₹${(stats?.pendingAmount || 0).toLocaleString('en-IN')} due`}
          color="yellow"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Link to="/admin/products/new" className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow text-center">
          <FiPackage className="w-8 h-8 mx-auto mb-2 text-green-600" />
          <span className="text-sm font-medium">Add Product</span>
        </Link>
        <Link to="/admin/orders" className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow text-center">
          <FiShoppingCart className="w-8 h-8 mx-auto mb-2 text-blue-600" />
          <span className="text-sm font-medium">View Orders</span>
        </Link>
        <Link to="/admin/invoices" className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow text-center">
          <FiFileText className="w-8 h-8 mx-auto mb-2 text-purple-600" />
          <span className="text-sm font-medium">Invoices</span>
        </Link>
        <Link to="/admin/reports" className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow text-center">
          <FiBarChart2 className="w-8 h-8 mx-auto mb-2 text-orange-600" />
          <span className="text-sm font-medium">Reports</span>
        </Link>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Recent Orders</h2>
            <Link to="/admin/orders" className="text-green-600 hover:underline text-sm">View All</Link>
          </div>
          
          {recentOrders.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No orders yet</p>
          ) : (
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <Link 
                  key={order._id} 
                  to={`/admin/orders/${order._id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50"
                >
                  <div>
                    <p className="font-medium text-gray-900">#{order.orderNumber}</p>
                    <p className="text-sm text-gray-500">{order.customer?.shopName}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">₹{order.totalAmount?.toLocaleString('en-IN')}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      order.status === 'DELIVERED' ? 'bg-green-100 text-green-700' :
                      order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Low Stock Alert */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Low Stock Alert</h2>
            <Link to="/admin/products" className="text-green-600 hover:underline text-sm">View All</Link>
          </div>
          
          {lowStockProducts.length === 0 ? (
            <div className="text-center py-8">
              <FiCheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
              <p className="text-gray-500">All products are well stocked!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {lowStockProducts.map((product) => (
                <Link 
                  key={product._id} 
                  to={`/admin/products/${product._id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={product.images?.[0] || 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=100'}
                      alt={product.name}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                    <div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-500">{product.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${product.stock <= 10 ? 'text-red-600' : 'text-yellow-600'}`}>
                      {product.stock} {product.unit}
                    </p>
                    {product.stock <= 10 && (
                      <span className="text-xs text-red-500 flex items-center gap-1">
                        <FiAlertCircle className="w-3 h-3" /> Critical
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Order Status Overview */}
      <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Order Status Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'].map((status) => {
            const count = stats?.ordersByStatus?.[status] || 0;
            const colors = {
              PENDING: 'bg-yellow-100 text-yellow-800',
              CONFIRMED: 'bg-blue-100 text-blue-800',
              PROCESSING: 'bg-purple-100 text-purple-800',
              SHIPPED: 'bg-indigo-100 text-indigo-800',
              DELIVERED: 'bg-green-100 text-green-800',
            };
            return (
              <div key={status} className={`p-4 rounded-lg ${colors[status]}`}>
                <p className="text-2xl font-bold">{count}</p>
                <p className="text-sm">{status}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatsCard({ title, value, icon: Icon, trend, subtitle, color }) {
  const colorClasses = {
    green: 'bg-green-100 text-green-600',
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    orange: 'bg-orange-100 text-orange-600',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-lg ${colorClasses[color]} flex items-center justify-center`}>
          <Icon className="w-6 h-6" />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-sm ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend >= 0 ? <FiArrowUp /> : <FiArrowDown />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500">{subtitle || title}</p>
    </div>
  );
}
