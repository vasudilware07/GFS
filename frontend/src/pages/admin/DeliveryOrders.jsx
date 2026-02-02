import { useState, useEffect } from 'react';
import { 
  FiPackage, FiTruck, FiUser, FiClock, FiCheck, FiX, FiRefreshCw,
  FiDollarSign, FiMapPin, FiPhone, FiMail, FiSearch, FiFilter,
  FiAlertCircle, FiCheckCircle
} from 'react-icons/fi';
import { deliveryAPI, orderAPI } from '../../api';
import { PageLoading, ButtonLoading } from '../../components/Loading';
import toast from 'react-hot-toast';

export default function AdminDeliveryOrders() {
  const [tab, setTab] = useState('available');
  const [loading, setLoading] = useState(true);
  const [availableOrders, setAvailableOrders] = useState([]);
  const [orderRequests, setOrderRequests] = useState([]);
  const [paymentRequests, setPaymentRequests] = useState([]);
  const [deliveryPersons, setDeliveryPersons] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(null);
  const [showDirectPayModal, setShowDirectPayModal] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [ordersRes, requestsRes, paymentsRes, personsRes] = await Promise.all([
        deliveryAPI.getAvailableOrders().catch(() => ({ data: { data: [] } })),
        deliveryAPI.getAllOrderRequests().catch(() => ({ data: { data: [] } })),
        deliveryAPI.getAllPaymentRequests().catch(() => ({ data: { data: [] } })),
        deliveryAPI.getAllPersons({ isActive: true }).catch(() => ({ data: { data: [] } }))
      ]);

      setAvailableOrders(ordersRes.data.data || []);
      setOrderRequests(requestsRes.data.data || []);
      setPaymentRequests(paymentsRes.data.data || []);
      setDeliveryPersons(personsRes.data.data || []);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignOrder = async (deliveryPersonId) => {
    if (!selectedOrder || !deliveryPersonId) return;
    
    setAssigning(true);
    try {
      await deliveryAPI.assignOrder(selectedOrder._id, deliveryPersonId);
      toast.success('Order assigned successfully');
      setShowAssignModal(false);
      setSelectedOrder(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to assign order');
    } finally {
      setAssigning(false);
    }
  };

  const handleOrderRequest = async (deliveryPersonId, requestId, action) => {
    setProcessing(true);
    try {
      await deliveryAPI.handleOrderRequest(deliveryPersonId, requestId, { action });
      toast.success(`Request ${action === 'APPROVED' ? 'approved' : 'rejected'}`);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to process request');
    } finally {
      setProcessing(false);
    }
  };

  const handlePaymentRequest = async (id, status, transactionId = '') => {
    setProcessing(true);
    try {
      await deliveryAPI.processPaymentRequest(id, { status, transactionId });
      toast.success(`Payment ${status.toLowerCase()}`);
      setShowPaymentModal(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to process payment');
    } finally {
      setProcessing(false);
    }
  };

  const handleDirectPayment = async (data) => {
    setProcessing(true);
    try {
      await deliveryAPI.directPayment(data);
      toast.success('Payment made successfully');
      setShowDirectPayModal(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to make payment');
    } finally {
      setProcessing(false);
    }
  };

  const openAssignModal = (order) => {
    setSelectedOrder(order);
    setShowAssignModal(true);
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

  if (loading) return <PageLoading />;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Delivery Management</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4">
          <p className="text-2xl font-bold text-blue-600">{availableOrders.length}</p>
          <p className="text-sm text-gray-500">Available Orders</p>
        </div>
        <div className="bg-white rounded-lg p-4">
          <p className="text-2xl font-bold text-orange-600">{orderRequests.length}</p>
          <p className="text-sm text-gray-500">Order Requests</p>
        </div>
        <div className="bg-white rounded-lg p-4">
          <p className="text-2xl font-bold text-purple-600">
            {paymentRequests.filter(p => p.status === 'PENDING').length}
          </p>
          <p className="text-sm text-gray-500">Pending Payments</p>
        </div>
        <div className="bg-white rounded-lg p-4">
          <p className="text-2xl font-bold text-green-600">
            {deliveryPersons.filter(d => d.isAvailable).length}
          </p>
          <p className="text-sm text-gray-500">Available Riders</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm mb-6">
        <div className="border-b">
          <div className="flex flex-wrap">
            <button
              onClick={() => setTab('available')}
              className={`px-6 py-3 font-medium border-b-2 transition-colors ${
                tab === 'available' 
                  ? 'border-green-500 text-green-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Available Orders ({availableOrders.length})
            </button>
            <button
              onClick={() => setTab('requests')}
              className={`px-6 py-3 font-medium border-b-2 transition-colors ${
                tab === 'requests' 
                  ? 'border-green-500 text-green-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Order Requests ({orderRequests.length})
            </button>
            <button
              onClick={() => setTab('payments')}
              className={`px-6 py-3 font-medium border-b-2 transition-colors ${
                tab === 'payments' 
                  ? 'border-green-500 text-green-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Payment Requests ({paymentRequests.filter(p => p.status === 'PENDING').length})
            </button>
            <button
              onClick={() => setTab('pay')}
              className={`px-6 py-3 font-medium border-b-2 transition-colors ${
                tab === 'pay' 
                  ? 'border-green-500 text-green-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <FiDollarSign className="inline mr-1" /> Pay Delivery Person
            </button>
          </div>
        </div>

        <div className="p-4">
          {/* Available Orders Tab */}
          {tab === 'available' && (
            <div>
              {availableOrders.length === 0 ? (
                <div className="text-center py-12">
                  <FiPackage className="mx-auto text-4xl text-gray-300 mb-4" />
                  <p className="text-gray-500">No orders available for delivery assignment</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {availableOrders.map(order => (
                    <div key={order._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-semibold text-gray-900">#{order.orderNumber}</span>
                            {getStatusBadge(order.status)}
                          </div>
                          <p className="text-sm text-gray-500">
                            <FiUser className="inline mr-1" />
                            {order.user?.shopName || order.user?.ownerName || 'Customer'}
                          </p>
                          {order.shippingAddress && (
                            <p className="text-sm text-gray-500 mt-1">
                              <FiMapPin className="inline mr-1" />
                              {order.shippingAddress.city}, {order.shippingAddress.state}
                            </p>
                          )}
                          <p className="text-sm text-gray-500 mt-1">
                            <FiClock className="inline mr-1" />
                            {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900">
                            ₹{order.totalAmount?.toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-500">
                            {order.items?.length || 0} items
                          </p>
                          <button
                            onClick={() => openAssignModal(order)}
                            className="mt-2 btn-primary text-sm"
                          >
                            <FiTruck className="inline mr-1" /> Assign Rider
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Order Requests Tab */}
          {tab === 'requests' && (
            <div>
              {orderRequests.length === 0 ? (
                <div className="text-center py-12">
                  <FiAlertCircle className="mx-auto text-4xl text-gray-300 mb-4" />
                  <p className="text-gray-500">No pending order requests</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orderRequests.map(request => (
                    <div key={request._id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-semibold">#{request.order?.orderNumber}</span>
                            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs">
                              Request Pending
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">
                            <strong>Requested by:</strong> {request.deliveryPerson?.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {request.deliveryPerson?.phone} • {request.deliveryPerson?.transportType}
                          </p>
                          <p className="text-sm text-gray-500 mt-2">
                            <FiClock className="inline mr-1" />
                            Requested: {new Date(request.requestedAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleOrderRequest(request.deliveryPerson?._id, request._id, 'APPROVED')}
                            disabled={processing}
                            className="btn-primary text-sm flex items-center gap-1"
                          >
                            <FiCheck /> Approve
                          </button>
                          <button
                            onClick={() => handleOrderRequest(request.deliveryPerson?._id, request._id, 'REJECTED')}
                            disabled={processing}
                            className="btn-secondary text-sm flex items-center gap-1 text-red-600"
                          >
                            <FiX /> Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Payment Requests Tab */}
          {tab === 'payments' && (
            <div>
              {paymentRequests.length === 0 ? (
                <div className="text-center py-12">
                  <FiDollarSign className="mx-auto text-4xl text-gray-300 mb-4" />
                  <p className="text-gray-500">No payment requests</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {paymentRequests.map(payment => (
                    <div key={payment._id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-semibold">
                              {payment.deliveryPerson?.name}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-xs ${
                              payment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                              payment.status === 'APPROVED' ? 'bg-blue-100 text-blue-700' :
                              payment.status === 'PAID' ? 'bg-green-100 text-green-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {payment.status}
                            </span>
                          </div>
                          <p className="text-2xl font-bold text-gray-900">
                            ₹{payment.amount?.toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            {payment.requestType === 'WITHDRAWAL' ? 'Withdrawal Request' : 'Admin Payment'}
                          </p>
                          <p className="text-sm text-gray-500">
                            Payment Method: {payment.paymentMethod || 'Not specified'}
                          </p>
                          <p className="text-sm text-gray-500">
                            <FiClock className="inline mr-1" />
                            {new Date(payment.createdAt).toLocaleString()}
                          </p>
                        </div>
                        {payment.status === 'PENDING' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => setShowPaymentModal(payment)}
                              className="btn-primary text-sm flex items-center gap-1"
                            >
                              <FiCheck /> Approve & Pay
                            </button>
                            <button
                              onClick={() => handlePaymentRequest(payment._id, 'REJECTED')}
                              disabled={processing}
                              className="btn-secondary text-sm flex items-center gap-1 text-red-600"
                            >
                              <FiX /> Reject
                            </button>
                          </div>
                        )}
                        {payment.status === 'PAID' && payment.transactionId && (
                          <p className="text-sm text-green-600">
                            <FiCheckCircle className="inline mr-1" />
                            Txn: {payment.transactionId}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Pay Delivery Person Tab */}
          {tab === 'pay' && (
            <div>
              <div className="mb-4 flex justify-between items-center">
                <p className="text-gray-600">Select a delivery person to make a direct payment</p>
              </div>
              
              {deliveryPersons.length === 0 ? (
                <div className="text-center py-12">
                  <FiUser className="mx-auto text-4xl text-gray-300 mb-4" />
                  <p className="text-gray-500">No delivery persons found</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {deliveryPersons.map(person => (
                    <div key={person._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-3 mb-3">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          person.isAvailable ? 'bg-green-100' : 'bg-gray-100'
                        }`}>
                          <FiUser className={`text-xl ${person.isAvailable ? 'text-green-600' : 'text-gray-400'}`} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{person.name}</h3>
                          <p className="text-sm text-gray-500">{person.phone}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          person.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {person.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      
                      <div className="bg-gray-50 rounded-lg p-3 mb-3">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-gray-500">Total Earnings</p>
                            <p className="font-semibold text-gray-900">₹{person.totalEarnings?.toLocaleString() || 0}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Pending</p>
                            <p className="font-semibold text-orange-600">₹{person.pendingAmount?.toLocaleString() || 0}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Paid</p>
                            <p className="font-semibold text-green-600">₹{person.paidAmount?.toLocaleString() || 0}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Deliveries</p>
                            <p className="font-semibold text-gray-900">{person.totalDeliveries || 0}</p>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => setShowDirectPayModal(person)}
                        disabled={person.pendingAmount <= 0}
                        className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <FiDollarSign /> Pay Now
                      </button>
                      {person.pendingAmount <= 0 && (
                        <p className="text-xs text-gray-500 text-center mt-2">No pending amount</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Assign Modal */}
      {showAssignModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold">Assign Delivery Person</h2>
                  <p className="text-gray-500">Order #{selectedOrder.orderNumber}</p>
                </div>
                <button 
                  onClick={() => setShowAssignModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <FiX />
                </button>
              </div>

              {/* Order Summary */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Customer:</span>
                  <span className="font-medium">{selectedOrder.user?.shopName || selectedOrder.user?.ownerName}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-medium">₹{selectedOrder.totalAmount?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Delivery:</span>
                  <span className="font-medium">
                    {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state}
                  </span>
                </div>
              </div>

              {/* Available Delivery Persons */}
              <h3 className="font-medium mb-3">Select Delivery Person</h3>
              {deliveryPersons.filter(d => d.isActive).length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No active delivery persons available
                </p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {deliveryPersons.filter(d => d.isActive).map(person => (
                    <button
                      key={person._id}
                      onClick={() => handleAssignOrder(person._id)}
                      disabled={assigning}
                      className="w-full flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          person.isAvailable ? 'bg-green-100' : 'bg-gray-100'
                        }`}>
                          <FiUser className={person.isAvailable ? 'text-green-600' : 'text-gray-400'} />
                        </div>
                        <div className="text-left">
                          <p className="font-medium">{person.name}</p>
                          <p className="text-sm text-gray-500">
                            {person.transportType} • {person.vehicleNumber}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          person.isAvailable ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {person.isAvailable ? 'Available' : 'Busy'}
                        </span>
                        <p className="text-sm text-gray-500 mt-1">
                          {person.totalDeliveries} deliveries
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <button
                onClick={() => setShowAssignModal(false)}
                className="btn-secondary w-full mt-4"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Approval Modal */}
      {showPaymentModal && (
        <PaymentApprovalModal
          payment={showPaymentModal}
          onClose={() => setShowPaymentModal(null)}
          onApprove={handlePaymentRequest}
          processing={processing}
        />
      )}

      {/* Direct Payment Modal */}
      {showDirectPayModal && (
        <DirectPaymentModal
          person={showDirectPayModal}
          onClose={() => setShowDirectPayModal(false)}
          onPay={handleDirectPayment}
          processing={processing}
        />
      )}
    </div>
  );
}

function PaymentApprovalModal({ payment, onClose, onApprove, processing }) {
  const [transactionId, setTransactionId] = useState('');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold mb-4">Approve Payment</h2>
        
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <p className="text-sm text-gray-600">Delivery Person</p>
          <p className="font-medium">{payment.deliveryPerson?.name}</p>
          <p className="text-2xl font-bold text-green-600 mt-2">
            ₹{payment.amount?.toLocaleString()}
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Transaction ID (Optional)
          </label>
          <input
            type="text"
            value={transactionId}
            onChange={(e) => setTransactionId(e.target.value)}
            className="input-field"
            placeholder="Enter transaction reference"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="btn-secondary flex-1"
            disabled={processing}
          >
            Cancel
          </button>
          <button
            onClick={() => onApprove(payment._id, 'PAID', transactionId)}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
            disabled={processing}
          >
            {processing ? <ButtonLoading /> : (
              <>
                <FiCheck /> Confirm Payment
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function DirectPaymentModal({ person, onClose, onPay, processing }) {
  const [amount, setAmount] = useState(person.pendingAmount || 0);
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');
  const [transactionId, setTransactionId] = useState('');
  const [note, setNote] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (amount <= 0) return;
    if (amount > person.pendingAmount) {
      return;
    }
    onPay({
      deliveryPersonId: person._id,
      amount: Number(amount),
      paymentMethod,
      transactionId,
      note
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold">Pay Delivery Person</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <FiX />
          </button>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <FiUser className="text-xl text-green-600" />
            </div>
            <div>
              <p className="font-semibold">{person.name}</p>
              <p className="text-sm text-gray-500">{person.phone}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-gray-500">Pending Amount</p>
              <p className="font-bold text-orange-600">₹{person.pendingAmount?.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-gray-500">Total Paid</p>
              <p className="font-bold text-green-600">₹{person.paidAmount?.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount to Pay *
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              max={person.pendingAmount}
              min={1}
              className="input-field"
              placeholder="Enter amount"
              required
            />
            {amount > person.pendingAmount && (
              <p className="text-red-500 text-sm mt-1">Amount cannot exceed pending amount</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Max: ₹{person.pendingAmount?.toLocaleString()}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Method *
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="input-field"
              required
            >
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="UPI">UPI</option>
              <option value="CASH">Cash</option>
              <option value="CHEQUE">Cheque</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Transaction ID / Reference
            </label>
            <input
              type="text"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              className="input-field"
              placeholder="Enter transaction reference"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Note (Optional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="input-field"
              rows={2}
              placeholder="Add any note..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
              disabled={processing}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1 flex items-center justify-center gap-2"
              disabled={processing || amount <= 0 || amount > person.pendingAmount}
            >
              {processing ? <ButtonLoading /> : (
                <>
                  <FiCheck /> Pay ₹{Number(amount).toLocaleString()}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
