import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiSearch, FiDownload, FiMail, FiFileText, FiCalendar, FiDollarSign, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { invoiceAPI } from '../../api';
import { PageLoading } from '../../components/Loading';
import toast from 'react-hot-toast';

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  SENT: 'bg-blue-100 text-blue-800',
  PAID: 'bg-green-100 text-green-800',
  OVERDUE: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
};

export default function AdminInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [sending, setSending] = useState(null);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const res = await invoiceAPI.getAll({ limit: 100 });
      const data = res.data.data;
      setInvoices(Array.isArray(data) ? data : (data?.invoices || []));
    } catch (error) {
      toast.error('Failed to fetch invoices');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (invoiceId, newStatus) => {
    try {
      await invoiceAPI.updateStatus(invoiceId, newStatus);
      setInvoices(invoices.map(i => 
        i._id === invoiceId ? { ...i, status: newStatus } : i
      ));
      toast.success('Invoice status updated');
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const sendEmail = async (invoiceId) => {
    setSending(invoiceId);
    try {
      await invoiceAPI.resend(invoiceId);
      toast.success('Invoice sent to customer email!');
      setInvoices(invoices.map(i => 
        i._id === invoiceId ? { ...i, status: 'SENT', emailSent: true } : i
      ));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send email');
    } finally {
      setSending(null);
    }
  };

  const handleDownload = async (invoiceId) => {
    try {
      const res = await invoiceAPI.download(invoiceId);
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoiceId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Invoice downloaded');
    } catch (error) {
      toast.error('Failed to download invoice');
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchSearch = 
      invoice.invoiceNumber?.toLowerCase().includes(search.toLowerCase()) ||
      invoice.customer?.shopName?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = status === 'ALL' || invoice.status === status;
    return matchSearch && matchStatus;
  });

  // Calculate totals
  const totalAmount = invoices.reduce((sum, i) => sum + (i.totalAmount || 0), 0);
  const paidAmount = invoices.filter(i => i.status === 'PAID').reduce((sum, i) => sum + (i.totalAmount || 0), 0);
  const pendingAmount = invoices.filter(i => ['PENDING', 'SENT'].includes(i.status)).reduce((sum, i) => sum + (i.totalAmount || 0), 0);
  const overdueAmount = invoices.filter(i => i.status === 'OVERDUE').reduce((sum, i) => sum + (i.totalAmount || 0), 0);

  if (loading) return <PageLoading />;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Invoices</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FiFileText className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">₹{totalAmount.toLocaleString('en-IN')}</p>
          <p className="text-sm text-gray-500">Total Invoiced</p>
        </div>
        <div className="bg-white rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <FiCheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-green-600">₹{paidAmount.toLocaleString('en-IN')}</p>
          <p className="text-sm text-gray-500">Paid</p>
        </div>
        <div className="bg-white rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <FiDollarSign className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-yellow-600">₹{pendingAmount.toLocaleString('en-IN')}</p>
          <p className="text-sm text-gray-500">Pending</p>
        </div>
        <div className="bg-white rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <FiAlertCircle className="w-5 h-5 text-red-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-red-600">₹{overdueAmount.toLocaleString('en-IN')}</p>
          <p className="text-sm text-gray-500">Overdue</p>
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
              placeholder="Search by invoice number or customer..."
              className="input-field pl-10"
            />
          </div>
          <div className="flex gap-2">
            {['ALL', 'PENDING', 'SENT', 'PAID', 'OVERDUE'].map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  status === s 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {filteredInvoices.length === 0 ? (
          <div className="text-center py-12">
            <FiFileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No invoices found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-gray-600">Invoice</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-600">Customer</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-600">Date</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-600">Due Date</th>
                  <th className="text-right py-4 px-6 font-semibold text-gray-600">Amount</th>
                  <th className="text-center py-4 px-6 font-semibold text-gray-600">Status</th>
                  <th className="text-center py-4 px-6 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredInvoices.map((invoice) => {
                  const isOverdue = new Date(invoice.dueDate) < new Date() && invoice.status !== 'PAID';
                  return (
                    <tr key={invoice._id} className="hover:bg-gray-50">
                      <td className="py-4 px-6">
                        <Link to={`/admin/invoices/${invoice._id}`} className="font-bold text-green-600 hover:underline">
                          {invoice.invoiceNumber}
                        </Link>
                        <p className="text-sm text-gray-500">Order: #{invoice.order?.orderNumber}</p>
                      </td>
                      <td className="py-4 px-6">
                        <p className="font-medium text-gray-900">{invoice.customer?.shopName}</p>
                        <p className="text-sm text-gray-500">{invoice.customer?.email}</p>
                      </td>
                      <td className="py-4 px-6 text-gray-600">
                        {new Date(invoice.invoiceDate).toLocaleDateString('en-IN')}
                      </td>
                      <td className="py-4 px-6">
                        <span className={isOverdue ? 'text-red-600 font-medium' : 'text-gray-600'}>
                          {new Date(invoice.dueDate).toLocaleDateString('en-IN')}
                          {isOverdue && <FiAlertCircle className="inline ml-1" />}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right font-bold text-gray-900">
                        ₹{invoice.totalAmount?.toLocaleString('en-IN')}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <select
                          value={invoice.status}
                          onChange={(e) => updateStatus(invoice._id, e.target.value)}
                          className={`px-3 py-1 rounded-full text-xs font-semibold border-0 ${statusColors[invoice.status]}`}
                        >
                          {['PENDING', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED'].map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => sendEmail(invoice._id)}
                            disabled={sending === invoice._id}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-50"
                            title="Send Email"
                          >
                            <FiMail className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDownload(invoice._id)}
                            className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg"
                            title="Download PDF"
                          >
                            <FiDownload className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
