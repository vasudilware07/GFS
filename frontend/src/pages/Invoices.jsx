import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FiFileText, FiDownload, FiCalendar, FiDollarSign, FiClock, FiCheckCircle, FiAlertCircle, FiChevronRight } from 'react-icons/fi';
import { invoiceAPI } from '../api';
import { PageLoading } from '../components/Loading';
import toast from 'react-hot-toast';

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  SENT: 'bg-blue-100 text-blue-800',
  PAID: 'bg-green-100 text-green-800',
  OVERDUE: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
};

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const { id } = useParams();

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const res = await invoiceAPI.getMyInvoices();
      const data = res.data.data;
      setInvoices(Array.isArray(data) ? data : (data?.invoices || []));
    } catch (error) {
      toast.error('Failed to fetch invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (invoiceId) => {
    try {
      const res = await invoiceAPI.downloadPDF(invoiceId);
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

  const filteredInvoices = filter === 'ALL' 
    ? invoices 
    : invoices.filter(invoice => invoice.status === filter);

  if (loading) return <PageLoading />;

  // Single Invoice View
  if (id) {
    const invoice = invoices.find(i => i._id === id);
    if (!invoice) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center">
          <h2 className="text-xl font-bold text-gray-900">Invoice not found</h2>
          <Link to="/invoices" className="text-green-600 mt-4">← Back to invoices</Link>
        </div>
      );
    }

    return <InvoiceDetail invoice={invoice} onDownload={handleDownload} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4 md:mb-0">My Invoices</h1>
          
          {/* Filter Tabs */}
          <div className="flex gap-2 flex-wrap">
            {['ALL', 'PENDING', 'SENT', 'PAID', 'OVERDUE'].map((status) => (
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

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatsCard 
            label="Total Invoices" 
            value={invoices.length} 
            icon={FiFileText} 
            color="blue" 
          />
          <StatsCard 
            label="Pending" 
            value={invoices.filter(i => i.status === 'PENDING' || i.status === 'SENT').length} 
            icon={FiClock} 
            color="yellow" 
          />
          <StatsCard 
            label="Paid" 
            value={invoices.filter(i => i.status === 'PAID').length} 
            icon={FiCheckCircle} 
            color="green" 
          />
          <StatsCard 
            label="Overdue" 
            value={invoices.filter(i => i.status === 'OVERDUE').length} 
            icon={FiAlertCircle} 
            color="red" 
          />
        </div>

        {filteredInvoices.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <FiFileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">No invoices found</h2>
            <p className="text-gray-500">
              {filter === 'ALL' 
                ? "You don't have any invoices yet" 
                : `No ${filter.toLowerCase()} invoices`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredInvoices.map((invoice) => (
              <div 
                key={invoice._id}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    {/* Invoice Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-bold text-gray-900">{invoice.invoiceNumber}</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[invoice.status]}`}>
                          {invoice.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <FiCalendar className="w-4 h-4" />
                          {new Date(invoice.invoiceDate).toLocaleDateString('en-IN')}
                        </span>
                        <span className="flex items-center gap-1">
                          <FiClock className="w-4 h-4" />
                          Due: {new Date(invoice.dueDate).toLocaleDateString('en-IN')}
                        </span>
                      </div>
                    </div>

                    {/* Amount & Actions */}
                    <div className="flex items-center gap-4">
                      <span className="text-lg font-bold text-green-600">
                        ₹{invoice.totalAmount?.toLocaleString('en-IN')}
                      </span>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleDownload(invoice._id);
                        }}
                        className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Download PDF"
                      >
                        <FiDownload className="w-5 h-5" />
                      </button>
                      <Link to={`/invoices/${invoice._id}`}>
                        <FiChevronRight className="w-5 h-5 text-gray-400" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatsCard({ label, value, icon: Icon, color }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <div className={`w-10 h-10 rounded-lg ${colorClasses[color]} flex items-center justify-center mb-3`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
}

function InvoiceDetail({ invoice, onDownload }) {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Back Link */}
        <Link to="/invoices" className="text-green-600 hover:underline mb-6 inline-block">
          ← Back to invoices
        </Link>

        {/* Invoice Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{invoice.invoiceNumber}</h1>
              <p className="text-gray-500">
                Order: {invoice.order?.orderNumber}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-4 py-2 rounded-full font-semibold ${statusColors[invoice.status]}`}>
                {invoice.status}
              </span>
              <button
                onClick={() => onDownload(invoice._id)}
                className="btn-primary flex items-center gap-2"
              >
                <FiDownload /> Download PDF
              </button>
            </div>
          </div>
        </div>

        {/* Invoice Details */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* From */}
            <div>
              <h3 className="font-bold text-gray-900 mb-2">From</h3>
              <p className="text-gray-600">
                Ganesh Fruit Suppliers<br />
                APMC Market, Turbhe<br />
                Navi Mumbai - 400703<br />
                GSTIN: 27AABCG1234R1Z5
              </p>
            </div>
            {/* To */}
            <div>
              <h3 className="font-bold text-gray-900 mb-2">To</h3>
              <p className="text-gray-600">
                {invoice.customer?.shopName}<br />
                {invoice.customer?.address?.street}<br />
                {invoice.customer?.address?.city} - {invoice.customer?.address?.pincode}<br />
                {invoice.customer?.gstNumber && `GSTIN: ${invoice.customer?.gstNumber}`}
              </p>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg mb-8">
            <div>
              <p className="text-sm text-gray-500">Invoice Date</p>
              <p className="font-medium">{new Date(invoice.invoiceDate).toLocaleDateString('en-IN')}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Due Date</p>
              <p className="font-medium">{new Date(invoice.dueDate).toLocaleDateString('en-IN')}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Payment Terms</p>
              <p className="font-medium">{invoice.paymentTerms || 'Net 30'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Payment Status</p>
              <p className={`font-medium ${invoice.status === 'PAID' ? 'text-green-600' : 'text-yellow-600'}`}>
                {invoice.status === 'PAID' ? 'Fully Paid' : 'Payment Due'}
              </p>
            </div>
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold">Item</th>
                  <th className="text-center py-3 px-4 font-semibold">Qty</th>
                  <th className="text-right py-3 px-4 font-semibold">Rate</th>
                  <th className="text-right py-3 px-4 font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items?.map((item, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-3 px-4">
                      <p className="font-medium">{item.product?.name || item.name}</p>
                      <p className="text-sm text-gray-500">{item.description}</p>
                    </td>
                    <td className="text-center py-3 px-4">{item.quantity} {item.unit}</td>
                    <td className="text-right py-3 px-4">₹{item.price?.toLocaleString('en-IN')}</td>
                    <td className="text-right py-3 px-4">₹{(item.price * item.quantity).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="mt-6 pt-6 border-t">
            <div className="flex flex-col items-end">
              <div className="w-full md:w-72">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Subtotal</span>
                  <span>₹{invoice.subtotal?.toLocaleString('en-IN')}</span>
                </div>
                {invoice.cgst && (
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">CGST ({invoice.cgstRate || 9}%)</span>
                    <span>₹{invoice.cgst?.toLocaleString('en-IN')}</span>
                  </div>
                )}
                {invoice.sgst && (
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">SGST ({invoice.sgstRate || 9}%)</span>
                    <span>₹{invoice.sgst?.toLocaleString('en-IN')}</span>
                  </div>
                )}
                {invoice.igst && (
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">IGST ({invoice.igstRate || 18}%)</span>
                    <span>₹{invoice.igst?.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <hr className="my-2" />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-green-600">₹{invoice.totalAmount?.toLocaleString('en-IN')}</span>
                </div>
                {invoice.amountPaid > 0 && (
                  <>
                    <div className="flex justify-between mt-2">
                      <span className="text-gray-600">Amount Paid</span>
                      <span className="text-green-600">-₹{invoice.amountPaid?.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>Balance Due</span>
                      <span className="text-red-600">₹{invoice.balanceDue?.toLocaleString('en-IN')}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bank Details */}
        <div className="bg-green-50 rounded-xl p-6">
          <h3 className="font-bold text-green-800 mb-2">Bank Details for Payment</h3>
          <div className="text-green-700 text-sm">
            <p>Bank: State Bank of India</p>
            <p>Account Name: Ganesh Fruit Suppliers</p>
            <p>Account Number: 12345678901234</p>
            <p>IFSC Code: SBIN0001234</p>
          </div>
        </div>
      </div>
    </div>
  );
}
