import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FiPackage, FiCalendar, FiTruck, FiCheck, FiClock, FiFileText, FiChevronRight, FiAlertCircle } from 'react-icons/fi';
import { orderAPI } from '../api';
import { PageLoading } from '../components/Loading';
import toast from 'react-hot-toast';

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  PROCESSING: 'bg-purple-100 text-purple-800',
  SHIPPED: 'bg-indigo-100 text-indigo-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

const statusIcons = {
  PENDING: FiClock,
  CONFIRMED: FiCheck,
  PROCESSING: FiPackage,
  SHIPPED: FiTruck,
  DELIVERED: FiCheck,
  CANCELLED: FiAlertCircle,
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const { id } = useParams();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await orderAPI.getMyOrders();
      const data = res.data.data;
      setOrders(Array.isArray(data) ? data : (data?.orders || []));
    } catch (error) {
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = filter === 'ALL' 
    ? orders 
    : orders.filter(order => order.status === filter);

  if (loading) return <PageLoading />;

  // Single Order View
  if (id) {
    const order = orders.find(o => o._id === id);
    if (!order) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center">
          <h2 className="text-xl font-bold text-gray-900">Order not found</h2>
          <Link to="/orders" className="text-green-600 mt-4">← Back to orders</Link>
        </div>
      );
    }

    return <OrderDetail order={order} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4 md:mb-0">My Orders</h1>
          
          {/* Filter Tabs */}
          <div className="flex gap-2 flex-wrap">
            {['ALL', 'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  filter === status 
                    ? 'bg-green-600 text-white' 
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <FiPackage className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">No orders found</h2>
            <p className="text-gray-500 mb-6">
              {filter === 'ALL' 
                ? "You haven't placed any orders yet" 
                : `No ${filter.toLowerCase()} orders`}
            </p>
            <Link to="/products" className="btn-primary px-8 py-3">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <Link 
                key={order._id} 
                to={`/orders/${order._id}`}
                className="block bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    {/* Order Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-bold text-gray-900">#{order.orderNumber}</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[order.status]}`}>
                          {order.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <FiCalendar className="w-4 h-4" />
                          {new Date(order.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          <FiPackage className="w-4 h-4" />
                          {order.items.length} items
                        </span>
                      </div>
                    </div>

                    {/* Products Preview */}
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {order.items.slice(0, 3).map((item, index) => (
                          <img
                            key={index}
                            src={item.product?.images?.[0] || 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=100'}
                            alt={item.product?.name}
                            className="w-10 h-10 rounded-lg object-cover border-2 border-white"
                          />
                        ))}
                        {order.items.length > 3 && (
                          <div className="w-10 h-10 rounded-lg bg-gray-100 border-2 border-white flex items-center justify-center text-sm font-medium text-gray-600">
                            +{order.items.length - 3}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Total */}
                    <div className="flex items-center justify-between md:flex-col md:items-end gap-2">
                      <span className="text-lg font-bold text-green-600">
                        ₹{order.totalAmount?.toLocaleString('en-IN')}
                      </span>
                      <FiChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function OrderDetail({ order }) {
  const StatusIcon = statusIcons[order.status];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Back Link */}
        <Link to="/orders" className="text-green-600 hover:underline mb-6 inline-block">
          ← Back to orders
        </Link>

        {/* Order Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Order #{order.orderNumber}</h1>
              <p className="text-gray-500">
                Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
            <div className={`px-4 py-2 rounded-full ${statusColors[order.status]} flex items-center gap-2`}>
              <StatusIcon className="w-4 h-4" />
              <span className="font-semibold">{order.status}</span>
            </div>
          </div>
        </div>

        {/* Order Progress */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="font-bold text-gray-900 mb-6">Order Progress</h2>
          <div className="flex items-center justify-between relative">
            {['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'].map((status, index) => {
              const isCompleted = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED']
                .indexOf(order.status) >= index;
              const Icon = statusIcons[status];
              
              return (
                <div key={status} className="flex flex-col items-center relative z-10">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isCompleted ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-400'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`text-xs mt-2 ${isCompleted ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
                    {status}
                  </span>
                </div>
              );
            })}
            {/* Progress Line */}
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 -z-0">
              <div 
                className="h-full bg-green-600 transition-all"
                style={{ 
                  width: `${(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED']
                    .indexOf(order.status) / 4) * 100}%` 
                }}
              />
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="font-bold text-gray-900 mb-4">Order Items</h2>
          <div className="space-y-4">
            {order.items.map((item, index) => (
              <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <img
                  src={item.product?.images?.[0] || 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=100'}
                  alt={item.product?.name}
                  className="w-16 h-16 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{item.product?.name || 'Product'}</h3>
                  <p className="text-sm text-gray-500">
                    ₹{item.price?.toLocaleString('en-IN')} × {item.quantity} {item.product?.unit || 'kg'}
                  </p>
                </div>
                <span className="font-bold text-gray-900">
                  ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>

          {/* Order Totals */}
          <div className="mt-6 pt-6 border-t">
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Subtotal</span>
              <span>₹{order.subtotal?.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">GST (18%)</span>
              <span>₹{order.tax?.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span className="text-green-600">₹{order.totalAmount?.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Invoice Link */}
        {order.invoice && (
          <Link 
            to={`/invoices/${order.invoice}`}
            className="flex items-center justify-between bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <FiFileText className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">View Invoice</h3>
                <p className="text-sm text-gray-500">Download or view invoice details</p>
              </div>
            </div>
            <FiChevronRight className="w-5 h-5 text-gray-400" />
          </Link>
        )}

        {/* Notes */}
        {order.notes && (
          <div className="bg-yellow-50 rounded-xl p-6 mt-6">
            <h3 className="font-bold text-yellow-800 mb-2">Order Notes</h3>
            <p className="text-yellow-700">{order.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
