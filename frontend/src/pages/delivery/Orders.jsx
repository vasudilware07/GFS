import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  FiPackage, FiTruck, FiCheck, FiX, FiMapPin, FiPhone, FiUser,
  FiClock, FiCamera, FiKey, FiRefreshCw, FiChevronRight, FiAlertCircle
} from 'react-icons/fi';
import { useDeliveryAuthStore } from '../../store/deliveryAuthStore';
import { deliveryAPI } from '../../api';
import { PageLoading, ButtonLoading } from '../../components/Loading';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const BASE_URL = API_URL.replace('/api', '');

export default function DeliveryOrders() {
  const [searchParams] = useSearchParams();
  const { refreshProfile } = useDeliveryAuthStore();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [availableOrders, setAvailableOrders] = useState([]);
  const [tab, setTab] = useState('assigned');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Verification state
  const [otp, setOtp] = useState('');
  const [proofPhoto, setProofPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    const orderId = searchParams.get('id');
    if (orderId && orders.length > 0) {
      const order = orders.find(o => o._id === orderId);
      if (order) {
        setSelectedOrder(order);
      }
    }
  }, [searchParams, orders]);

  const fetchOrders = async () => {
    try {
      const [myOrdersRes, availableRes] = await Promise.all([
        deliveryAPI.getMyOrders(),
        deliveryAPI.getAvailableOrders().catch(() => ({ data: { data: [] } }))
      ]);
      setOrders(myOrdersRes.data.data || []);
      setAvailableOrders(availableRes.data.data || []);
    } catch (error) {
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOrder = async (orderId) => {
    setProcessing(true);
    try {
      await deliveryAPI.requestOrder(orderId);
      toast.success('Order requested! Waiting for admin approval.');
      fetchOrders();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to request order');
    } finally {
      setProcessing(false);
    }
  };

  const handleMarkOutForDelivery = async (orderId) => {
    setProcessing(true);
    try {
      await deliveryAPI.markOutForDelivery(orderId);
      toast.success('Order marked as out for delivery');
      fetchOrders();
      setSelectedOrder(prev => prev ? { ...prev, status: 'OUT_FOR_DELIVERY' } : null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    } finally {
      setProcessing(false);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('Photo must be less than 5MB');
      return;
    }

    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setProofPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleVerifyDelivery = async () => {
    if (!otp || otp.length !== 6) {
      toast.error('Please enter valid 6-digit OTP');
      return;
    }

    if (!proofPhoto) {
      toast.error('Please upload delivery proof photo');
      return;
    }

    setProcessing(true);
    try {
      const formData = new FormData();
      formData.append('otp', otp);
      formData.append('deliveryProof', proofPhoto);

      await deliveryAPI.verifyDelivery(selectedOrder._id, formData);
      
      toast.success('Delivery verified successfully!');
      setShowVerifyModal(false);
      resetVerificationState();
      fetchOrders();
      refreshProfile();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Verification failed');
    } finally {
      setProcessing(false);
    }
  };

  const resetVerificationState = () => {
    setOtp('');
    setProofPhoto(null);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(null);
  };

  const openVerifyModal = (order) => {
    setSelectedOrder(order);
    setShowVerifyModal(true);
  };

  const getStatusBadge = (status) => {
    const styles = {
      PENDING: 'bg-yellow-100 text-yellow-700',
      CONFIRMED: 'bg-blue-100 text-blue-700',
      PROCESSING: 'bg-purple-100 text-purple-700',
      SHIPPED: 'bg-indigo-100 text-indigo-700',
      OUT_FOR_DELIVERY: 'bg-orange-100 text-orange-700',
      DELIVERED: 'bg-green-100 text-green-700',
      CANCELLED: 'bg-red-100 text-red-700'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
        {status?.replace(/_/g, ' ')}
      </span>
    );
  };

  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${BASE_URL}${path}`;
  };

  if (loading) return <PageLoading />;

  const assignedOrders = orders.filter(o => ['SHIPPED', 'OUT_FOR_DELIVERY'].includes(o.status));
  const completedOrders = orders.filter(o => o.status === 'DELIVERED');

  return (
    <div className="p-4 lg:p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Orders</h1>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm mb-6 overflow-hidden">
        <div className="flex border-b">
          <button
            onClick={() => setTab('assigned')}
            className={`flex-1 px-4 py-3 font-medium transition-colors ${
              tab === 'assigned' 
                ? 'border-b-2 border-green-500 text-green-600 bg-green-50' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Assigned ({assignedOrders.length})
          </button>
          <button
            onClick={() => setTab('available')}
            className={`flex-1 px-4 py-3 font-medium transition-colors ${
              tab === 'available' 
                ? 'border-b-2 border-green-500 text-green-600 bg-green-50' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Available ({availableOrders.length})
          </button>
          <button
            onClick={() => setTab('completed')}
            className={`flex-1 px-4 py-3 font-medium transition-colors ${
              tab === 'completed' 
                ? 'border-b-2 border-green-500 text-green-600 bg-green-50' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Completed ({completedOrders.length})
          </button>
        </div>

        <div className="p-4">
          {/* Assigned Orders */}
          {tab === 'assigned' && (
            <div>
              {assignedOrders.length === 0 ? (
                <div className="text-center py-12">
                  <FiPackage className="mx-auto text-4xl text-gray-300 mb-4" />
                  <p className="text-gray-500">No assigned orders</p>
                  <p className="text-sm text-gray-400">Check available orders to request deliveries</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {assignedOrders.map(order => (
                    <OrderCard 
                      key={order._id}
                      order={order}
                      onMarkOutForDelivery={handleMarkOutForDelivery}
                      onVerify={openVerifyModal}
                      processing={processing}
                      getStatusBadge={getStatusBadge}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Available Orders */}
          {tab === 'available' && (
            <div>
              {availableOrders.length === 0 ? (
                <div className="text-center py-12">
                  <FiTruck className="mx-auto text-4xl text-gray-300 mb-4" />
                  <p className="text-gray-500">No available orders</p>
                  <p className="text-sm text-gray-400">Check back later for new orders</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {availableOrders.map(order => (
                    <div key={order._id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold">#{order.orderNumber}</span>
                            {getStatusBadge(order.status)}
                          </div>
                          <p className="text-sm text-gray-600">
                            <FiUser className="inline mr-1" />
                            {order.user?.shopName || order.user?.ownerName}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            <FiMapPin className="inline mr-1" />
                            {order.shippingAddress?.city}, {order.shippingAddress?.state}
                          </p>
                          <p className="text-sm text-gray-500">
                            <FiClock className="inline mr-1" />
                            {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">₹{order.totalAmount?.toLocaleString()}</p>
                          <p className="text-sm text-gray-500">{order.items?.length} items</p>
                          <button
                            onClick={() => handleRequestOrder(order._id)}
                            disabled={processing}
                            className="mt-2 btn-primary text-sm"
                          >
                            Request Order
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Completed Orders */}
          {tab === 'completed' && (
            <div>
              {completedOrders.length === 0 ? (
                <div className="text-center py-12">
                  <FiCheck className="mx-auto text-4xl text-gray-300 mb-4" />
                  <p className="text-gray-500">No completed deliveries yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {completedOrders.map(order => (
                    <div key={order._id} className="border rounded-lg p-4 bg-green-50/30">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold">#{order.orderNumber}</span>
                            {getStatusBadge(order.status)}
                          </div>
                          <p className="text-sm text-gray-600">
                            {order.user?.shopName || order.user?.ownerName}
                          </p>
                          <p className="text-sm text-gray-500">
                            Delivered: {new Date(order.deliveredAt || order.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">
                            +₹{order.deliveryEarning || 0}
                          </p>
                          {order.deliveryProofPhoto && (
                            <a 
                              href={getImageUrl(order.deliveryProofPhoto)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline"
                            >
                              View Proof
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Verify Delivery Modal */}
      {showVerifyModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold">Verify Delivery</h2>
                  <p className="text-gray-500">Order #{selectedOrder.orderNumber}</p>
                </div>
                <button 
                  onClick={() => {
                    setShowVerifyModal(false);
                    resetVerificationState();
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <FiX />
                </button>
              </div>

              <div className="space-y-6">
                {/* OTP Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FiKey className="inline mr-2" />
                    Enter OTP from Customer
                  </label>
                  <p className="text-sm text-gray-500 mb-2">
                    Ask customer for the 6-digit OTP sent to their registered mobile/email
                  </p>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="input-field text-center text-2xl tracking-widest font-mono"
                    placeholder="000000"
                    maxLength={6}
                  />
                </div>

                {/* Photo Upload Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FiCamera className="inline mr-2" />
                    Upload Delivery Proof Photo
                  </label>
                  <p className="text-sm text-gray-500 mb-2">
                    Take a photo of the delivered items with the customer
                  </p>
                  
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed rounded-lg p-4 cursor-pointer hover:border-green-500 transition-colors"
                  >
                    {photoPreview ? (
                      <div className="relative">
                        <img 
                          src={photoPreview} 
                          alt="Delivery proof"
                          className="max-h-48 mx-auto rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            resetVerificationState();
                          }}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full"
                        >
                          <FiX size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <FiCamera className="mx-auto text-4xl text-gray-300 mb-2" />
                        <p className="text-gray-500">Tap to take or upload photo</p>
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePhotoChange}
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowVerifyModal(false);
                      resetVerificationState();
                    }}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleVerifyDelivery}
                    disabled={processing || !otp || !proofPhoto}
                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                  >
                    {processing ? <ButtonLoading /> : (
                      <>
                        <FiCheck /> Verify & Complete
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function OrderCard({ order, onMarkOutForDelivery, onVerify, processing, getStatusBadge }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border rounded-lg overflow-hidden">
      <div 
        onClick={() => setExpanded(!expanded)}
        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
      >
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-semibold">#{order.orderNumber}</span>
              {getStatusBadge(order.status)}
            </div>
            <p className="text-sm text-gray-600">
              <FiUser className="inline mr-1" />
              {order.user?.shopName || order.user?.ownerName}
            </p>
            <p className="text-sm text-gray-500">
              <FiMapPin className="inline mr-1" />
              {order.shippingAddress?.city}, {order.shippingAddress?.state}
            </p>
          </div>
          <div className="text-right flex items-center gap-2">
            <div>
              <p className="font-bold">₹{order.totalAmount?.toLocaleString()}</p>
              <p className="text-sm text-gray-500">{order.items?.length} items</p>
            </div>
            <FiChevronRight className={`transition-transform ${expanded ? 'rotate-90' : ''}`} />
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t bg-gray-50 p-4">
          {/* Customer Details */}
          <div className="mb-4">
            <h4 className="font-medium text-gray-900 mb-2">Customer Details</h4>
            <p className="text-sm text-gray-600">
              {order.shippingAddress?.fullName || order.user?.ownerName}
            </p>
            {order.shippingAddress?.phone && (
              <a 
                href={`tel:${order.shippingAddress.phone}`}
                className="text-sm text-green-600 flex items-center gap-1 mt-1"
              >
                <FiPhone /> {order.shippingAddress.phone}
              </a>
            )}
            <p className="text-sm text-gray-500 mt-1">
              {order.shippingAddress?.address}, {order.shippingAddress?.city}
            </p>
            <p className="text-sm text-gray-500">
              {order.shippingAddress?.state} - {order.shippingAddress?.pincode}
            </p>
          </div>

          {/* Items */}
          <div className="mb-4">
            <h4 className="font-medium text-gray-900 mb-2">Order Items</h4>
            <div className="space-y-2">
              {order.items?.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span>{item.product?.name || item.name} × {item.quantity}</span>
                  <span className="text-gray-600">₹{item.subtotal?.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {order.status === 'SHIPPED' && (
              <button
                onClick={() => onMarkOutForDelivery(order._id)}
                disabled={processing}
                className="btn-primary flex-1 text-sm"
              >
                <FiTruck className="inline mr-1" /> Mark Out for Delivery
              </button>
            )}
            {order.status === 'OUT_FOR_DELIVERY' && (
              <button
                onClick={() => onVerify(order)}
                disabled={processing}
                className="btn-primary flex-1 text-sm bg-green-600 hover:bg-green-700"
              >
                <FiCheck className="inline mr-1" /> Complete Delivery
              </button>
            )}
          </div>

          {/* OTP Reminder */}
          {order.status === 'OUT_FOR_DELIVERY' && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800 flex items-center gap-2">
                <FiAlertCircle />
                Remember to collect OTP from customer to complete delivery
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
