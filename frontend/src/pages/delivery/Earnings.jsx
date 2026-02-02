import { useState, useEffect } from 'react';
import { 
  FiDollarSign, FiClock, FiCheck, FiX, FiTrendingUp, FiCalendar,
  FiArrowUpRight, FiArrowDownLeft, FiCreditCard, FiRefreshCw
} from 'react-icons/fi';
import { useDeliveryAuthStore } from '../../store/deliveryAuthStore';
import { deliveryAPI } from '../../api';
import { PageLoading, ButtonLoading } from '../../components/Loading';
import toast from 'react-hot-toast';

export default function DeliveryEarnings() {
  const { deliveryPerson, refreshProfile } = useDeliveryAuthStore();
  const [loading, setLoading] = useState(true);
  const [earnings, setEarnings] = useState(null);
  const [paymentRequests, setPaymentRequests] = useState([]);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestAmount, setRequestAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    fetchEarnings();
  }, []);

  const fetchEarnings = async () => {
    try {
      const res = await deliveryAPI.getMyEarnings();
      setEarnings(res.data.data);
      setPaymentRequests(res.data.data?.paymentRequests || []);
      await refreshProfile();
    } catch (error) {
      toast.error('Failed to fetch earnings');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPayment = async () => {
    const amount = parseFloat(requestAmount);
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (amount > (deliveryPerson?.pendingAmount || 0)) {
      toast.error('Amount exceeds pending balance');
      return;
    }

    setRequesting(true);
    try {
      await deliveryAPI.requestPayment({
        amount,
        paymentMethod
      });
      toast.success('Payment request submitted');
      setShowRequestModal(false);
      setRequestAmount('');
      fetchEarnings();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to request payment');
    } finally {
      setRequesting(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: FiClock },
      APPROVED: { bg: 'bg-blue-100', text: 'text-blue-700', icon: FiCheck },
      PAID: { bg: 'bg-green-100', text: 'text-green-700', icon: FiCheck },
      REJECTED: { bg: 'bg-red-100', text: 'text-red-700', icon: FiX }
    };
    const style = styles[status] || styles.PENDING;
    const Icon = style.icon;
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${style.bg} ${style.text}`}>
        <Icon size={12} /> {status}
      </span>
    );
  };

  if (loading) return <PageLoading />;

  return (
    <div className="p-4 lg:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Earnings</h1>
        <button
          onClick={() => fetchEarnings()}
          className="p-2 hover:bg-gray-100 rounded-lg"
          title="Refresh"
        >
          <FiRefreshCw />
        </button>
      </div>

      {/* Earnings Overview */}
      <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white mb-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-green-100">Total Earnings</p>
            <p className="text-4xl font-bold mt-1">
              ₹{deliveryPerson?.totalEarnings?.toLocaleString() || 0}
            </p>
          </div>
          <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
            <FiTrendingUp className="text-2xl" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white/10 rounded-xl p-3">
            <p className="text-green-100 text-sm">Pending</p>
            <p className="text-xl font-bold">₹{deliveryPerson?.pendingAmount?.toLocaleString() || 0}</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3">
            <p className="text-green-100 text-sm">Paid</p>
            <p className="text-xl font-bold">₹{deliveryPerson?.paidAmount?.toLocaleString() || 0}</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3">
            <p className="text-green-100 text-sm">Per Delivery</p>
            <p className="text-xl font-bold">₹{deliveryPerson?.perDeliveryRate || 0}</p>
          </div>
        </div>
      </div>

      {/* Request Payment Button */}
      {(deliveryPerson?.pendingAmount || 0) > 0 && (
        <button
          onClick={() => setShowRequestModal(true)}
          className="w-full bg-white border-2 border-green-500 text-green-600 hover:bg-green-50 font-semibold py-4 rounded-xl mb-6 flex items-center justify-center gap-2 transition-colors"
        >
          <FiCreditCard className="text-xl" />
          Request Payment
        </button>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FiArrowUpRight className="text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {deliveryPerson?.totalDeliveries || 0}
              </p>
              <p className="text-sm text-gray-500">Total Deliveries</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <FiCheck className="text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {deliveryPerson?.successfulDeliveries || 0}
              </p>
              <p className="text-sm text-gray-500">Successful</p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Requests History */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-gray-900">Payment History</h2>
        </div>

        {paymentRequests.length === 0 ? (
          <div className="p-8 text-center">
            <FiDollarSign className="mx-auto text-4xl text-gray-300 mb-4" />
            <p className="text-gray-500">No payment requests yet</p>
          </div>
        ) : (
          <div className="divide-y">
            {paymentRequests.map((request) => (
              <div key={request._id} className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-semibold ${
                        request.requestType === 'ADMIN_PAYMENT' ? 'text-green-600' : 'text-gray-900'
                      }`}>
                        {request.requestType === 'ADMIN_PAYMENT' ? (
                          <><FiArrowDownLeft className="inline mr-1" /> Admin Payment</>
                        ) : (
                          <><FiArrowUpRight className="inline mr-1" /> Withdrawal Request</>
                        )}
                      </span>
                      {getStatusBadge(request.status)}
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      ₹{request.amount?.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      <FiCalendar className="inline mr-1" />
                      {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                    {request.paymentMethod && (
                      <p className="text-sm text-gray-500">
                        Via {request.paymentMethod}
                      </p>
                    )}
                  </div>
                  {request.status === 'PAID' && request.transactionId && (
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Transaction ID</p>
                      <p className="text-sm font-mono text-gray-700">{request.transactionId}</p>
                    </div>
                  )}
                </div>
                {request.adminNote && (
                  <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-600">
                    Note: {request.adminNote}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Request Payment Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-xl font-bold">Request Payment</h2>
              <button 
                onClick={() => setShowRequestModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <FiX />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-green-700">Available Balance</p>
                <p className="text-2xl font-bold text-green-600">
                  ₹{deliveryPerson?.pendingAmount?.toLocaleString() || 0}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount to Withdraw
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                  <input
                    type="number"
                    value={requestAmount}
                    onChange={(e) => setRequestAmount(e.target.value)}
                    className="input-field pl-8"
                    placeholder="Enter amount"
                    max={deliveryPerson?.pendingAmount || 0}
                  />
                </div>
                <button
                  onClick={() => setRequestAmount(deliveryPerson?.pendingAmount?.toString() || '0')}
                  className="text-sm text-green-600 hover:underline mt-1"
                >
                  Request full amount
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['UPI', 'BANK_TRANSFER', 'CASH'].map(method => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                        paymentMethod === method
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {method.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowRequestModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRequestPayment}
                  disabled={requesting || !requestAmount}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {requesting ? <ButtonLoading /> : (
                    <>
                      <FiCreditCard /> Request Payment
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
