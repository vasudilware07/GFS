import { useState, useEffect } from 'react';
import { FiUser, FiCheck, FiX, FiEye, FiAlertCircle, FiPhone, FiMail, FiMapPin, FiFileText, FiChevronLeft } from 'react-icons/fi';
import { kycAPI } from '../../api';
import { PageLoading } from '../../components/Loading';
import toast from 'react-hot-toast';

const statusColors = {
  PENDING: 'bg-gray-100 text-gray-800',
  SUBMITTED: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
};

const businessTypeLabels = {
  RETAILER: 'Retail Shop',
  WHOLESALER: 'Wholesaler',
  HOTEL_RESTAURANT: 'Hotel / Restaurant',
  CATERER: 'Caterer',
  SUPERMARKET: 'Supermarket',
  OTHER: 'Other',
};

export default function KYCManagement() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('SUBMITTED');
  const [selectedUser, setSelectedUser] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchSubmissions();
    fetchPendingCount();
  }, [filter]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const params = filter !== 'ALL' ? { status: filter } : {};
      const res = await kycAPI.getAll(params);
      setSubmissions(res.data.data.submissions);
    } catch (error) {
      toast.error('Failed to fetch KYC submissions');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingCount = async () => {
    try {
      const res = await kycAPI.getPendingCount();
      setPendingCount(res.data.data.count);
    } catch (error) {
      console.error('Failed to fetch pending count');
    }
  };

  const fetchUserDetails = async (userId) => {
    try {
      const res = await kycAPI.getDetails(userId);
      setSelectedUser(res.data.data);
    } catch (error) {
      toast.error('Failed to fetch user details');
    }
  };

  const handleApprove = async (userId) => {
    if (!confirm('Are you sure you want to approve this KYC?')) return;
    
    setActionLoading(true);
    try {
      await kycAPI.approve(userId);
      toast.success('KYC approved successfully');
      fetchSubmissions();
      fetchPendingCount();
      setSelectedUser(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve KYC');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    
    setActionLoading(true);
    try {
      await kycAPI.reject(selectedUser._id, rejectionReason);
      toast.success('KYC rejected');
      setShowRejectModal(false);
      setRejectionReason('');
      fetchSubmissions();
      fetchPendingCount();
      setSelectedUser(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject KYC');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && !selectedUser) return <PageLoading />;

  // User Detail View
  if (selectedUser) {
    return (
      <div className="space-y-6">
        {/* Back Button */}
        <button
          onClick={() => setSelectedUser(null)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <FiChevronLeft className="w-5 h-5" />
          Back to list
        </button>

        {/* User Info Card */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <FiUser className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedUser.shopName}</h2>
                <p className="text-gray-600">{selectedUser.ownerName}</p>
                <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${statusColors[selectedUser.kyc?.status]}`}>
                  {selectedUser.kyc?.status}
                </span>
              </div>
            </div>
            
            {selectedUser.kyc?.status === 'SUBMITTED' && (
              <div className="flex gap-3">
                <button
                  onClick={() => handleApprove(selectedUser._id)}
                  disabled={actionLoading}
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  <FiCheck className="w-4 h-4" />
                  Approve
                </button>
                <button
                  onClick={() => setShowRejectModal(true)}
                  disabled={actionLoading}
                  className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  <FiX className="w-4 h-4" />
                  Reject
                </button>
              </div>
            )}
          </div>

          {/* Contact Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <FiMail className="w-5 h-5 text-gray-400" />
              <span className="text-gray-700">{selectedUser.email}</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <FiPhone className="w-5 h-5 text-gray-400" />
              <span className="text-gray-700">{selectedUser.phone}</span>
            </div>
            {selectedUser.gstNumber && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <FiFileText className="w-5 h-5 text-gray-400" />
                <span className="text-gray-700">GST: {selectedUser.gstNumber}</span>
              </div>
            )}
          </div>

          {/* Address */}
          {selectedUser.address && (
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg mb-6">
              <FiMapPin className="w-5 h-5 text-gray-400 mt-0.5" />
              <div className="text-gray-700">
                {selectedUser.address.street && <p>{selectedUser.address.street}</p>}
                <p>
                  {[selectedUser.address.city, selectedUser.address.state, selectedUser.address.pincode]
                    .filter(Boolean).join(', ')}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Business Details */}
        {selectedUser.kyc?.businessDetails && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-4">Business Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Business Type</p>
                <p className="font-medium text-gray-900">
                  {businessTypeLabels[selectedUser.kyc.businessDetails.businessType] || 'N/A'}
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Years in Business</p>
                <p className="font-medium text-gray-900">
                  {selectedUser.kyc.businessDetails.yearsInBusiness || 'N/A'} years
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Avg Monthly Purchase</p>
                <p className="font-medium text-gray-900">
                  ₹{selectedUser.kyc.businessDetails.averageMonthlyPurchase?.toLocaleString('en-IN') || 'N/A'}
                </p>
              </div>
            </div>
            
            {selectedUser.kyc.businessDetails.referenceContact?.name && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-600 font-medium mb-2">Reference Contact</p>
                <p className="text-gray-700">
                  {selectedUser.kyc.businessDetails.referenceContact.name} 
                  ({selectedUser.kyc.businessDetails.referenceContact.relation})
                  - {selectedUser.kyc.businessDetails.referenceContact.phone}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Addresses */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-4">Addresses</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Business Address */}
            {selectedUser.kyc?.businessAddress && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <FiMapPin className="w-4 h-4 text-blue-600" />
                  <p className="font-medium text-blue-800">Business Address</p>
                </div>
                <p className="text-gray-700">
                  {selectedUser.kyc.businessAddress.street}<br />
                  {selectedUser.kyc.businessAddress.city}, {selectedUser.kyc.businessAddress.state}<br />
                  {selectedUser.kyc.businessAddress.pincode}
                </p>
              </div>
            )}
            
            {/* Delivery Address */}
            {selectedUser.kyc?.deliveryAddress && (
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <FiMapPin className="w-4 h-4 text-purple-600" />
                  <p className="font-medium text-purple-800">
                    Delivery Address
                    {selectedUser.kyc.sameAsBusinessAddress && (
                      <span className="text-xs ml-2 text-purple-600">(Same as Business)</span>
                    )}
                  </p>
                </div>
                <p className="text-gray-700">
                  {selectedUser.kyc.deliveryAddress.street}<br />
                  {selectedUser.kyc.deliveryAddress.city}, {selectedUser.kyc.deliveryAddress.state}<br />
                  {selectedUser.kyc.deliveryAddress.pincode}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Documents */}
        {selectedUser.kyc?.documents && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-4">Uploaded Documents</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {Object.entries(selectedUser.kyc.documents).map(([key, url]) => {
                if (!url) return null;
                const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
                const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;
                return (
                  <a
                    key={key}
                    href={fullUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <div className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                      {url.endsWith('.pdf') ? (
                        <div className="h-32 bg-gray-100 flex items-center justify-center">
                          <FiFileText className="w-12 h-12 text-gray-400" />
                        </div>
                      ) : (
                        <img
                          src={fullUrl}
                          alt={key}
                          className="w-full h-32 object-cover"
                        />
                      )}
                      <p className="text-xs text-center py-2 text-gray-600 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </p>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {/* Rejection Reason (if rejected) */}
        {selectedUser.kyc?.status === 'REJECTED' && selectedUser.kyc?.rejectionReason && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <FiAlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h3 className="font-bold text-red-800">Rejection Reason</h3>
                <p className="text-red-600 mt-1">{selectedUser.kyc.rejectionReason}</p>
              </div>
            </div>
          </div>
        )}

        {/* Reject Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Reject KYC</h3>
              <p className="text-gray-600 mb-4">Please provide a reason for rejection:</p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g., Documents are not clear, Information mismatch..."
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 h-32"
              />
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectionReason('');
                  }}
                  className="flex-1 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={actionLoading || !rejectionReason.trim()}
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {actionLoading ? 'Rejecting...' : 'Reject KYC'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">KYC Management</h1>
          <p className="text-gray-600">Review and approve customer verifications</p>
        </div>
        
        {pendingCount > 0 && (
          <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg flex items-center gap-2">
            <FiAlertCircle className="w-5 h-5" />
            <span className="font-medium">{pendingCount} pending reviews</span>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {['SUBMITTED', 'APPROVED', 'REJECTED', 'ALL'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === status
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            {status === 'ALL' ? 'All' : status}
          </button>
        ))}
      </div>

      {/* Submissions List */}
      {loading ? (
        <PageLoading />
      ) : submissions.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <FiUser className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No KYC Submissions</h3>
          <p className="text-gray-600">No submissions found for the selected filter.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-4 px-6 font-semibold text-gray-600">Shop</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-600">Owner</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-600">Business Type</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-600">Submitted</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-600">Status</th>
                <th className="text-right py-4 px-6 font-semibold text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {submissions.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50">
                  <td className="py-4 px-6">
                    <p className="font-medium text-gray-900">{user.shopName}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </td>
                  <td className="py-4 px-6 text-gray-700">{user.ownerName}</td>
                  <td className="py-4 px-6 text-gray-700">
                    {businessTypeLabels[user.kyc?.businessDetails?.businessType] || '-'}
                  </td>
                  <td className="py-4 px-6 text-gray-500 text-sm">
                    {user.kyc?.submittedAt
                      ? new Date(user.kyc.submittedAt).toLocaleDateString('en-IN')
                      : '-'}
                  </td>
                  <td className="py-4 px-6">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${statusColors[user.kyc?.status]}`}>
                      {user.kyc?.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button
                      onClick={() => fetchUserDetails(user._id)}
                      className="text-green-600 hover:text-green-800 font-medium flex items-center gap-1 ml-auto"
                    >
                      <FiEye className="w-4 h-4" />
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
