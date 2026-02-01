import { useState, useEffect } from 'react';
import { FiSearch, FiDollarSign, FiCalendar, FiCreditCard, FiCheckCircle, FiClock, FiMail } from 'react-icons/fi';
import { paymentAPI } from '../../api';
import { PageLoading, ButtonLoading } from '../../components/Loading';
import toast from 'react-hot-toast';

const methodLabels = {
  CASH: 'Cash',
  BANK_TRANSFER: 'Bank Transfer',
  UPI: 'UPI',
  CHEQUE: 'Cheque',
  CREDIT: 'Credit',
};

export default function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [method, setMethod] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [newPayment, setNewPayment] = useState({
    invoiceId: '',
    amount: '',
    method: 'BANK_TRANSFER',
    reference: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const res = await paymentAPI.getAll({ limit: 100 });
      const data = res.data.data;
      setPayments(Array.isArray(data) ? data : (data?.payments || []));
    } catch (error) {
      toast.error('Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await paymentAPI.record({
        invoiceId: newPayment.invoiceId,
        amount: parseFloat(newPayment.amount),
        paymentMode: newPayment.method,
        transactionId: newPayment.reference,
        notes: newPayment.notes,
      });
      toast.success('Payment recorded successfully');
      setShowModal(false);
      setNewPayment({ invoiceId: '', amount: '', method: 'BANK_TRANSFER', reference: '', notes: '' });
      fetchPayments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to record payment');
    } finally {
      setSaving(false);
    }
  };

  const filteredPayments = payments.filter(payment => {
    const matchSearch = 
      payment.invoice?.invoiceNumber?.toLowerCase().includes(search.toLowerCase()) ||
      payment.customer?.shopName?.toLowerCase().includes(search.toLowerCase()) ||
      payment.reference?.toLowerCase().includes(search.toLowerCase());
    const matchMethod = method === 'ALL' || payment.method === method;
    return matchSearch && matchMethod;
  });

  // Calculate totals
  const totalReceived = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const todayPayments = payments.filter(p => 
    new Date(p.createdAt).toDateString() === new Date().toDateString()
  );
  const todayTotal = todayPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

  if (loading) return <PageLoading />;

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4 md:mb-0">Payments</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <FiDollarSign className="inline mr-2" /> Record Payment
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-2">
            <FiDollarSign className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">₹{totalReceived.toLocaleString('en-IN')}</p>
          <p className="text-sm text-gray-500">Total Received</p>
        </div>
        <div className="bg-white rounded-xl p-4">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-2">
            <FiCalendar className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-blue-600">₹{todayTotal.toLocaleString('en-IN')}</p>
          <p className="text-sm text-gray-500">Today's Collection</p>
        </div>
        <div className="bg-white rounded-xl p-4">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-2">
            <FiCheckCircle className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-purple-600">{payments.length}</p>
          <p className="text-sm text-gray-500">Total Transactions</p>
        </div>
        <div className="bg-white rounded-xl p-4">
          <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center mb-2">
            <FiClock className="w-5 h-5 text-yellow-600" />
          </div>
          <p className="text-2xl font-bold text-yellow-600">{todayPayments.length}</p>
          <p className="text-sm text-gray-500">Today's Transactions</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by invoice, customer, or reference..."
              className="input-field pl-10"
            />
          </div>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="input-field md:w-40"
          >
            <option value="ALL">All Methods</option>
            {Object.entries(methodLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {filteredPayments.length === 0 ? (
          <div className="text-center py-12">
            <FiDollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No payments found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-gray-600">Date</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-600">Invoice</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-600">Customer</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-600">Method</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-600">Reference</th>
                  <th className="text-right py-4 px-6 font-semibold text-gray-600">Amount</th>
                  <th className="text-center py-4 px-6 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredPayments.map((payment) => (
                  <PaymentRow key={payment._id} payment={payment} methodLabels={methodLabels} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Record Payment</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Invoice ID *</label>
                <input
                  type="text"
                  required
                  value={newPayment.invoiceId}
                  onChange={(e) => setNewPayment({ ...newPayment, invoiceId: e.target.value })}
                  className="input-field"
                  placeholder="Invoice ID or Number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount (₹) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={newPayment.amount}
                  onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                  className="input-field"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method *</label>
                <select
                  required
                  value={newPayment.method}
                  onChange={(e) => setNewPayment({ ...newPayment, method: e.target.value })}
                  className="input-field"
                >
                  {Object.entries(methodLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reference Number</label>
                <input
                  type="text"
                  value={newPayment.reference}
                  onChange={(e) => setNewPayment({ ...newPayment, reference: e.target.value })}
                  className="input-field"
                  placeholder="Transaction/Cheque number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  value={newPayment.notes}
                  onChange={(e) => setNewPayment({ ...newPayment, notes: e.target.value })}
                  className="input-field"
                  rows="2"
                  placeholder="Optional notes..."
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-outline flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {saving ? <ButtonLoading /> : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Separate component for payment row with send receipt functionality
function PaymentRow({ payment, methodLabels }) {
  const [sending, setSending] = useState(false);

  const handleSendReceipt = async () => {
    setSending(true);
    try {
      await paymentAPI.resendReceipt(payment._id);
      toast.success('Payment receipt sent to customer!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send receipt');
    } finally {
      setSending(false);
    }
  };

  return (
    <tr className="hover:bg-gray-50">
      <td className="py-4 px-6 text-gray-600">
        {new Date(payment.createdAt).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })}
      </td>
      <td className="py-4 px-6">
        <span className="font-medium text-green-600">{payment.invoice?.invoiceNumber}</span>
      </td>
      <td className="py-4 px-6">
        <p className="font-medium text-gray-900">{payment.customer?.shopName}</p>
        <p className="text-sm text-gray-500">{payment.customer?.ownerName}</p>
      </td>
      <td className="py-4 px-6">
        <span className="px-3 py-1 bg-gray-100 rounded-full text-sm">
          {methodLabels[payment.method] || payment.method}
        </span>
      </td>
      <td className="py-4 px-6 text-gray-600">
        {payment.reference || '-'}
      </td>
      <td className="py-4 px-6 text-right font-bold text-green-600">
        ₹{payment.amount?.toLocaleString('en-IN')}
      </td>
      <td className="py-4 px-6 text-center">
        <button
          onClick={handleSendReceipt}
          disabled={sending}
          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          title="Send Receipt to Customer"
        >
          {sending ? <ButtonLoading /> : <FiMail className="w-5 h-5" />}
        </button>
      </td>
    </tr>
  );
}
