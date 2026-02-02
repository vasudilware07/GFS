import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { FiSearch, FiFilter, FiEye, FiFileText, FiPackage, FiCalendar, FiTruck, FiMail, FiCheck } from 'react-icons/fi';
import { orderAPI, invoiceAPI } from '../../api';
import { PageLoading, ButtonLoading } from '../../components/Loading';
import toast from 'react-hot-toast';

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  PROCESSING: 'bg-purple-100 text-purple-800',
  SHIPPED: 'bg-indigo-100 text-indigo-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await orderAPI.getAll({ limit: 100 });
      const data = res.data.data;
      setOrders(Array.isArray(data) ? data : (data?.orders || []));
    } catch (error) {
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await orderAPI.updateStatus(orderId, newStatus);
      setOrders(orders.map(o => 
        o._id === orderId ? { ...o, status: newStatus } : o
      ));
      toast.success('Order status updated');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchSearch = order.orderNumber?.toLowerCase().includes(search.toLowerCase()) ||
      order.userId?.shopName?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = status === 'ALL' || order.status === status;
    return matchSearch && matchStatus;
  });

  if (loading) return <PageLoading />;

  // Single Order View
  if (id) {
    const order = orders.find(o => o._id === id);
    if (!order) {
      return (
        <div className="p-6 text-center">
          <h2 className="text-xl font-bold text-gray-900">Order not found</h2>
          <Link to="/admin/orders" className="text-green-600 mt-4 inline-block">← Back to orders</Link>
        </div>
      );
    }
    return <OrderDetail order={order} onStatusUpdate={updateOrderStatus} onOrderUpdate={fetchOrders} />;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Orders</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
        {['ALL', 'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'].map((s) => {
          const count = s === 'ALL' ? orders.length : orders.filter(o => o.status === s).length;
          return (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`p-4 rounded-xl text-left transition-all ${
                status === s 
                  ? 'bg-green-600 text-white shadow-lg' 
                  : 'bg-white hover:shadow-md'
              }`}
            >
              <p className="text-2xl font-bold">{count}</p>
              <p className={`text-sm ${status === s ? 'text-green-100' : 'text-gray-500'}`}>
                {s === 'ALL' ? 'All Orders' : s}
              </p>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order number or customer name..."
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <FiPackage className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No orders found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-gray-600">Order</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-600">Customer</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-600">Date</th>
                  <th className="text-right py-4 px-6 font-semibold text-gray-600">Amount</th>
                  <th className="text-center py-4 px-6 font-semibold text-gray-600">Status</th>
                  <th className="text-center py-4 px-6 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <p className="font-bold text-gray-900">#{order.orderNumber}</p>
                      <p className="text-sm text-gray-500">{order.items?.length} items</p>
                    </td>
                    <td className="py-4 px-6">
                      <p className="font-medium text-gray-900">{order.userId?.shopName}</p>
                      <p className="text-sm text-gray-500">{order.userId?.ownerName}</p>
                    </td>
                    <td className="py-4 px-6 text-gray-600">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-4 px-6 text-right font-bold text-green-600">
                      ₹{order.totalAmount?.toLocaleString('en-IN')}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold border-0 ${statusColors[order.status]}`}
                      >
                        {['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          to={`/admin/orders/${order._id}`}
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="View Details"
                        >
                          <FiEye className="w-4 h-4" />
                        </Link>
                        {order.invoice && (
                          <Link
                            to={`/admin/invoices/${order.invoice}`}
                            className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg"
                            title="View Invoice"
                          >
                            <FiFileText className="w-4 h-4" />
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function OrderDetail({ order, onStatusUpdate, onOrderUpdate }) {
  const navigate = useNavigate();
  const [creatingInvoice, setCreatingInvoice] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [invoiceId, setInvoiceId] = useState(order.invoice || null);

  const handleCreateInvoice = async (sendEmail = true) => {
    setCreatingInvoice(true);
    try {
      const res = await orderAPI.generateInvoice(order._id, { sendEmail });
      setInvoiceId(res.data.data._id);
      toast.success(sendEmail ? 'Invoice created and sent to customer!' : 'Invoice created successfully!');
      onOrderUpdate(); // Refresh orders
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create invoice');
    } finally {
      setCreatingInvoice(false);
    }
  };

  const handleResendInvoice = async () => {
    if (!invoiceId) return;
    setSendingEmail(true);
    try {
      await invoiceAPI.resend(invoiceId);
      toast.success('Invoice sent to customer email!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send invoice');
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <button onClick={() => navigate('/admin/orders')} className="text-green-600 hover:underline mb-6">
        ← Back to orders
      </button>

      {/* Order Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Order #{order.orderNumber}</h1>
            <p className="text-gray-500">
              <FiCalendar className="inline mr-1" />
              {new Date(order.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={order.status}
              onChange={(e) => onStatusUpdate(order._id, e.target.value)}
              className={`px-4 py-2 rounded-lg font-semibold ${statusColors[order.status]}`}
            >
              {['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Customer Info */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-bold text-gray-900 mb-4">Customer Information</h2>
          <div className="space-y-2 text-gray-600">
            <p><strong>Shop:</strong> {order.userId?.shopName}</p>
            <p><strong>Owner:</strong> {order.userId?.ownerName}</p>
            <p><strong>Email:</strong> {order.userId?.email}</p>
            <p><strong>Phone:</strong> {order.userId?.phone}</p>
            {order.userId?.gstNumber && (
              <p><strong>GST:</strong> {order.userId?.gstNumber}</p>
            )}
          </div>
        </div>

        {/* Delivery Address */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-bold text-gray-900 mb-4">
            <FiTruck className="inline mr-2" />
            Delivery Address
          </h2>
          <p className="text-gray-600">
            {order.userId?.address?.street}<br />
            {order.userId?.address?.city}, {order.userId?.address?.state}<br />
            {order.userId?.address?.pincode}
          </p>
        </div>
      </div>

      {/* Order Items */}
      <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
        <h2 className="font-bold text-gray-900 mb-4">Order Items</h2>
        <div className="space-y-4">
          {order.items?.map((item, index) => (
            <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-green-400 to-orange-400 flex items-center justify-center text-white font-bold text-xl">
                {item.name?.charAt(0) || 'P'}
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{item.name || 'Product'}</h3>
                <p className="text-sm text-gray-500">
                  ₹{item.pricePerUnit?.toLocaleString('en-IN')} × {item.quantity} {item.unit || 'kg'}
                </p>
              </div>
              <span className="font-bold">₹{item.totalPrice?.toLocaleString('en-IN')}</span>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-6 border-t">
          <div className="flex justify-end">
            <div className="w-64">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Subtotal</span>
                <span>₹{order.subtotal?.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">GST (18%)</span>
                <span>₹{order.gstAmount?.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-green-600">₹{order.totalAmount?.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Order Notes */}
      {order.notes && (
        <div className="bg-yellow-50 rounded-xl p-6 mt-6">
          <h3 className="font-bold text-yellow-800 mb-2">Order Notes</h3>
          <p className="text-yellow-700">{order.notes}</p>
        </div>
      )}

      {/* Actions */}
      <div className="mt-6 flex flex-wrap gap-4">
        {!invoiceId ? (
          <>
            <button 
              onClick={() => handleCreateInvoice(true)}
              disabled={creatingInvoice}
              className="btn-primary flex items-center gap-2"
            >
              {creatingInvoice ? <ButtonLoading /> : (
                <>
                  <FiFileText /> Create Invoice & Send Email
                </>
              )}
            </button>
            <button 
              onClick={() => handleCreateInvoice(false)}
              disabled={creatingInvoice}
              className="btn-outline flex items-center gap-2"
            >
              <FiFileText /> Create Invoice Only
            </button>
          </>
        ) : (
          <>
            <Link to={`/admin/invoices/${invoiceId}`} className="btn-outline flex items-center gap-2">
              <FiFileText /> View Invoice
            </Link>
            <button 
              onClick={handleResendInvoice}
              disabled={sendingEmail}
              className="btn-primary flex items-center gap-2"
            >
              {sendingEmail ? <ButtonLoading /> : (
                <>
                  <FiMail /> Send Invoice to Customer
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
