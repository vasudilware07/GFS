import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiSearch, FiPlus, FiUser, FiPhone, FiTruck, FiEdit2, FiTrash2, 
  FiToggleLeft, FiToggleRight, FiDollarSign, FiPackage, FiStar,
  FiCheck, FiX, FiClock, FiMapPin
} from 'react-icons/fi';
import { deliveryAPI } from '../../api';
import { PageLoading, ButtonLoading } from '../../components/Loading';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const BASE_URL = API_URL.replace('/api', '');

const transportIcons = {
  BIKE: '🏍️',
  SCOOTER: '🛵',
  AUTO: '🛺',
  MINI_TRUCK: '🚐',
  TRUCK: '🚛',
  VAN: '🚐'
};

export default function AdminDeliveryPersons() {
  const [deliveryPersons, setDeliveryPersons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchDeliveryPersons();
  }, []);

  const fetchDeliveryPersons = async () => {
    try {
      const res = await deliveryAPI.getAllPersons({ limit: 100 });
      setDeliveryPersons(res.data.data || []);
    } catch (error) {
      toast.error('Failed to fetch delivery persons');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (person) => {
    try {
      await deliveryAPI.updatePerson(person._id, { isActive: !person.isActive });
      setDeliveryPersons(prev => prev.map(p => 
        p._id === person._id ? { ...p, isActive: !p.isActive } : p
      ));
      toast.success(`Delivery person ${!person.isActive ? 'activated' : 'deactivated'}`);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    setDeleting(true);
    try {
      await deliveryAPI.deletePerson(id);
      setDeliveryPersons(prev => prev.filter(p => p._id !== id));
      toast.success('Delivery person deleted');
      setShowDeleteConfirm(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  const handleViewDetail = (person) => {
    setSelectedPerson(person);
    setShowDetail(true);
  };

  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${BASE_URL}${path}`;
  };

  const filteredPersons = deliveryPersons.filter(person => {
    const matchSearch = 
      person.name?.toLowerCase().includes(search.toLowerCase()) ||
      person.email?.toLowerCase().includes(search.toLowerCase()) ||
      person.phone?.includes(search) ||
      person.vehicleNumber?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = 
      filter === 'ALL' ||
      (filter === 'ACTIVE' && person.isActive) ||
      (filter === 'INACTIVE' && !person.isActive) ||
      (filter === 'AVAILABLE' && person.isAvailable);
    return matchSearch && matchFilter;
  });

  if (loading) return <PageLoading />;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Delivery Persons</h1>
        <Link 
          to="/admin/delivery-persons/new"
          className="btn-primary flex items-center gap-2"
        >
          <FiPlus /> Add Delivery Person
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4">
          <p className="text-2xl font-bold text-gray-900">{deliveryPersons.length}</p>
          <p className="text-sm text-gray-500">Total</p>
        </div>
        <div className="bg-white rounded-lg p-4">
          <p className="text-2xl font-bold text-green-600">
            {deliveryPersons.filter(p => p.isActive).length}
          </p>
          <p className="text-sm text-gray-500">Active</p>
        </div>
        <div className="bg-white rounded-lg p-4">
          <p className="text-2xl font-bold text-blue-600">
            {deliveryPersons.filter(p => p.isAvailable).length}
          </p>
          <p className="text-sm text-gray-500">Available</p>
        </div>
        <div className="bg-white rounded-lg p-4">
          <p className="text-2xl font-bold text-purple-600">
            {deliveryPersons.reduce((sum, p) => sum + (p.totalDeliveries || 0), 0)}
          </p>
          <p className="text-sm text-gray-500">Total Deliveries</p>
        </div>
        <div className="bg-white rounded-lg p-4">
          <p className="text-2xl font-bold text-orange-600">
            ₹{deliveryPersons.reduce((sum, p) => sum + (p.pendingAmount || 0), 0).toLocaleString()}
          </p>
          <p className="text-sm text-gray-500">Pending Payments</p>
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
              placeholder="Search by name, email, phone, or vehicle..."
              className="input-field pl-10"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="input-field md:w-40"
          >
            <option value="ALL">All</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="AVAILABLE">Available Now</option>
          </select>
        </div>
      </div>

      {/* Delivery Persons List */}
      {filteredPersons.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <FiTruck className="mx-auto text-4xl text-gray-300 mb-4" />
          <p className="text-gray-500">No delivery persons found</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPersons.map(person => (
            <div 
              key={person._id}
              className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {person.profilePhoto ? (
                    <img 
                      src={getImageUrl(person.profilePhoto)} 
                      alt={person.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <FiUser className="text-2xl text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 truncate">{person.name}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      person.isActive 
                        ? person.isAvailable ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {person.isActive ? (person.isAvailable ? 'Available' : 'Active') : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 truncate">{person.email}</p>
                  <p className="text-sm text-gray-500">{person.phone}</p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{transportIcons[person.transportType] || '🚗'}</span>
                    <span className="text-gray-600">{person.vehicleNumber}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiPackage className="text-gray-400" />
                    <span className="text-gray-600">{person.totalDeliveries || 0} deliveries</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiStar className="text-yellow-500" />
                    <span className="text-gray-600">{person.rating?.toFixed(1) || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiDollarSign className="text-green-500" />
                    <span className="text-gray-600">₹{person.pendingAmount || 0}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between">
                <button
                  onClick={() => handleViewDetail(person)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  View Details
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleStatus(person)}
                    className={`p-2 rounded-lg transition-colors ${
                      person.isActive 
                        ? 'text-green-600 hover:bg-green-50' 
                        : 'text-gray-400 hover:bg-gray-50'
                    }`}
                    title={person.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {person.isActive ? <FiToggleRight size={20} /> : <FiToggleLeft size={20} />}
                  </button>
                  <Link
                    to={`/admin/delivery-persons/${person._id}`}
                    className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                    title="Edit"
                  >
                    <FiEdit2 />
                  </Link>
                  <button
                    onClick={() => setShowDeleteConfirm(person._id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    title="Delete"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {showDetail && selectedPerson && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl font-bold">Delivery Person Details</h2>
                <button 
                  onClick={() => setShowDetail(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <FiX />
                </button>
              </div>

              {/* Profile Header */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                  {selectedPerson.profilePhoto ? (
                    <img 
                      src={getImageUrl(selectedPerson.profilePhoto)} 
                      alt={selectedPerson.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <FiUser className="text-3xl text-gray-400" />
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-semibold">{selectedPerson.name}</h3>
                  <p className="text-gray-500">{selectedPerson.email}</p>
                  <p className="text-gray-500">{selectedPerson.phone}</p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-gray-900">{selectedPerson.totalDeliveries || 0}</p>
                  <p className="text-xs text-gray-500">Total Deliveries</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-green-600">{selectedPerson.successfulDeliveries || 0}</p>
                  <p className="text-xs text-gray-500">Successful</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-yellow-600">{selectedPerson.rating?.toFixed(1) || 'N/A'}</p>
                  <p className="text-xs text-gray-500">Rating</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {selectedPerson.totalDeliveries > 0 
                      ? ((selectedPerson.successfulDeliveries / selectedPerson.totalDeliveries) * 100).toFixed(0)
                      : 0}%
                  </p>
                  <p className="text-xs text-gray-500">Success Rate</p>
                </div>
              </div>

              {/* Earnings */}
              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 text-white mb-6">
                <h4 className="font-medium mb-3">Earnings Overview</h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold">₹{selectedPerson.totalEarnings?.toLocaleString() || 0}</p>
                    <p className="text-sm opacity-80">Total Earned</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">₹{selectedPerson.paidAmount?.toLocaleString() || 0}</p>
                    <p className="text-sm opacity-80">Paid</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">₹{selectedPerson.pendingAmount?.toLocaleString() || 0}</p>
                    <p className="text-sm opacity-80">Pending</p>
                  </div>
                </div>
              </div>

              {/* Vehicle Details */}
              <div className="mb-6">
                <h4 className="font-medium mb-3">Vehicle Details</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Transport Type</p>
                      <p className="font-medium flex items-center gap-2">
                        <span>{transportIcons[selectedPerson.transportType]}</span>
                        {selectedPerson.transportType}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Vehicle Number</p>
                      <p className="font-medium">{selectedPerson.vehicleNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">License Number</p>
                      <p className="font-medium">{selectedPerson.licenseNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">License Expiry</p>
                      <p className="font-medium">
                        {selectedPerson.licenseExpiry 
                          ? new Date(selectedPerson.licenseExpiry).toLocaleDateString() 
                          : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Per Delivery Rate</p>
                      <p className="font-medium">₹{selectedPerson.perDeliveryRate || 0}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Documents */}
              <div className="mb-6">
                <h4 className="font-medium mb-3">Documents</h4>
                <div className="grid grid-cols-2 gap-4">
                  {selectedPerson.licensePhoto && (
                    <div>
                      <p className="text-sm text-gray-500 mb-2">License Photo</p>
                      <img 
                        src={getImageUrl(selectedPerson.licensePhoto)} 
                        alt="License"
                        className="w-full h-40 object-cover rounded-lg"
                      />
                    </div>
                  )}
                  {selectedPerson.vehiclePhoto && (
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Vehicle Photo</p>
                      <img 
                        src={getImageUrl(selectedPerson.vehiclePhoto)} 
                        alt="Vehicle"
                        className="w-full h-40 object-cover rounded-lg"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Link
                  to={`/admin/delivery-persons/${selectedPerson._id}`}
                  className="btn-primary flex-1 text-center"
                >
                  Edit Details
                </Link>
                <button
                  onClick={() => setShowDetail(false)}
                  className="btn-secondary flex-1"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Delivery Person?</h3>
            <p className="text-gray-600 mb-6">
              This action cannot be undone. The delivery person will lose access and all their data will be removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="btn-secondary flex-1"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="btn-primary bg-red-600 hover:bg-red-700 flex-1 flex items-center justify-center gap-2"
                disabled={deleting}
              >
                {deleting ? <ButtonLoading /> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
