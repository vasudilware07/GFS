import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiPackage, FiTruck, FiDollarSign, FiStar, FiClock, FiCheck,
  FiArrowRight, FiMapPin, FiUser, FiRefreshCw
} from 'react-icons/fi';
import { useDeliveryAuthStore } from '../../store/deliveryAuthStore';
import { deliveryAPI } from '../../api';
import { PageLoading } from '../../components/Loading';
import toast from 'react-hot-toast';

export default function DeliveryDashboard() {
  const { deliveryPerson, refreshProfile } = useDeliveryAuthStore();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({
    assigned: 0,
    outForDelivery: 0,
    delivered: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [ordersRes] = await Promise.all([
        deliveryAPI.getMyOrders({ limit: 5 }),
        refreshProfile()
      ]);
      
      const allOrders = ordersRes.data.data || [];
      setOrders(allOrders.slice(0, 5));
      
      setStats({
        assigned: allOrders.filter(o => o.status === 'SHIPPED').length,
        outForDelivery: allOrders.filter(o => o.status === 'OUT_FOR_DELIVERY').length,
        delivered: allOrders.filter(o => o.status === 'DELIVERED').length
      });
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      SHIPPED: 'bg-blue-100 text-blue-700',
      OUT_FOR_DELIVERY: 'bg-orange-100 text-orange-700',
      DELIVERED: 'bg-green-100 text-green-700'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
        {status?.replace(/_/g, ' ')}
      </span>
    );
  };

  if (loading) return <PageLoading />;

  return (
    <div className="p-4 lg:p-6">
      {/* Welcome Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {deliveryPerson?.name?.split(' ')[0]}! 👋
        </h1>
        <p className="text-gray-500 mt-1">
          {deliveryPerson?.isAvailable 
            ? 'You are available for deliveries' 
            : 'You are currently offline'}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <FiPackage className="text-blue-500 text-xl" />
            <span className="text-xs text-blue-500 font-medium">Assigned</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.assigned}</p>
          <p className="text-sm text-gray-500">Pending pickup</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <FiTruck className="text-orange-500 text-xl" />
            <span className="text-xs text-orange-500 font-medium">In Transit</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.outForDelivery}</p>
          <p className="text-sm text-gray-500">Out for delivery</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <FiCheck className="text-green-500 text-xl" />
            <span className="text-xs text-green-500 font-medium">Completed</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{deliveryPerson?.totalDeliveries || 0}</p>
          <p className="text-sm text-gray-500">Total delivered</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <FiStar className="text-yellow-500 text-xl" />
            <span className="text-xs text-yellow-500 font-medium">Rating</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{deliveryPerson?.rating?.toFixed(1) || 'N/A'}</p>
          <p className="text-sm text-gray-500">Average rating</p>
        </div>
      </div>

      {/* Earnings Card */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-green-100">Your Earnings</p>
            <p className="text-3xl font-bold mt-1">
              ₹{deliveryPerson?.totalEarnings?.toLocaleString() || 0}
            </p>
          </div>
          <Link 
            to="/delivery/earnings"
            className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            View Details
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/20">
          <div>
            <p className="text-green-100 text-sm">Pending</p>
            <p className="text-xl font-bold">₹{deliveryPerson?.pendingAmount?.toLocaleString() || 0}</p>
          </div>
          <div>
            <p className="text-green-100 text-sm">Paid</p>
            <p className="text-xl font-bold">₹{deliveryPerson?.paidAmount?.toLocaleString() || 0}</p>
          </div>
          <div>
            <p className="text-green-100 text-sm">Per Delivery</p>
            <p className="text-xl font-bold">₹{deliveryPerson?.perDeliveryRate || 0}</p>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="font-semibold text-gray-900">Recent Orders</h2>
          <Link 
            to="/delivery/orders"
            className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center gap-1"
          >
            View All <FiArrowRight />
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="p-8 text-center">
            <FiPackage className="mx-auto text-4xl text-gray-300 mb-4" />
            <p className="text-gray-500">No orders assigned yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Check available orders to request deliveries
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {orders.map(order => (
              <Link 
                key={order._id}
                to={`/delivery/orders?id=${order._id}`}
                className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    order.status === 'DELIVERED' ? 'bg-green-100' :
                    order.status === 'OUT_FOR_DELIVERY' ? 'bg-orange-100' :
                    'bg-blue-100'
                  }`}>
                    {order.status === 'DELIVERED' ? (
                      <FiCheck className="text-green-600" />
                    ) : order.status === 'OUT_FOR_DELIVERY' ? (
                      <FiTruck className="text-orange-600" />
                    ) : (
                      <FiPackage className="text-blue-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">#{order.orderNumber}</p>
                    <p className="text-sm text-gray-500">
                      <FiMapPin className="inline mr-1" />
                      {order.shippingAddress?.city || 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {getStatusBadge(order.status)}
                  <p className="text-sm text-gray-500 mt-1">
                    ₹{order.totalAmount?.toLocaleString()}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4 mt-6">
        <Link
          to="/delivery/orders"
          className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex items-center gap-3"
        >
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <FiPackage className="text-xl text-blue-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">My Orders</p>
            <p className="text-sm text-gray-500">Manage deliveries</p>
          </div>
        </Link>

        <Link
          to="/delivery/earnings"
          className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex items-center gap-3"
        >
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <FiDollarSign className="text-xl text-green-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">Request Payment</p>
            <p className="text-sm text-gray-500">Withdraw earnings</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
