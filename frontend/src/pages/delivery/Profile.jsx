import { useState, useEffect, useRef } from 'react';
import { 
  FiUser, FiPhone, FiMail, FiTruck, FiCreditCard, FiCamera, 
  FiSave, FiStar, FiPackage, FiCalendar, FiEdit2
} from 'react-icons/fi';
import { useDeliveryAuthStore } from '../../store/deliveryAuthStore';
import { PageLoading, ButtonLoading } from '../../components/Loading';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const BASE_URL = API_URL.replace('/api', '');

const transportLabels = {
  BIKE: '🏍️ Bike',
  SCOOTER: '🛵 Scooter',
  AUTO: '🛺 Auto Rickshaw',
  MINI_TRUCK: '🚐 Mini Truck',
  TRUCK: '🚛 Truck',
  VAN: '🚐 Van'
};

export default function DeliveryProfile() {
  const { deliveryPerson, refreshProfile } = useDeliveryAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    refreshProfile().finally(() => setLoading(false));
  }, []);

  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${BASE_URL}${path}`;
  };

  if (loading) return <PageLoading />;

  const successRate = deliveryPerson?.totalDeliveries > 0
    ? ((deliveryPerson.successfulDeliveries / deliveryPerson.totalDeliveries) * 100).toFixed(1)
    : 0;

  return (
    <div className="p-4 lg:p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h1>

      {/* Profile Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
            {deliveryPerson?.profilePhoto ? (
              <img 
                src={getImageUrl(deliveryPerson.profilePhoto)} 
                alt={deliveryPerson.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <FiUser className="text-4xl text-gray-400" />
            )}
          </div>
          <div className="text-center md:text-left flex-1">
            <h2 className="text-2xl font-bold text-gray-900">{deliveryPerson?.name}</h2>
            <p className="text-gray-500">{deliveryPerson?.email}</p>
            <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-3">
              <span className={`px-3 py-1 rounded-full text-sm ${
                deliveryPerson?.isActive 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-red-100 text-red-700'
              }`}>
                {deliveryPerson?.isActive ? 'Active' : 'Inactive'}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm ${
                deliveryPerson?.isAvailable 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {deliveryPerson?.isAvailable ? 'Available' : 'Offline'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm text-center">
          <FiPackage className="mx-auto text-2xl text-blue-500 mb-2" />
          <p className="text-2xl font-bold text-gray-900">{deliveryPerson?.totalDeliveries || 0}</p>
          <p className="text-sm text-gray-500">Total Deliveries</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm text-center">
          <FiStar className="mx-auto text-2xl text-yellow-500 mb-2" />
          <p className="text-2xl font-bold text-gray-900">{deliveryPerson?.rating?.toFixed(1) || 'N/A'}</p>
          <p className="text-sm text-gray-500">Rating</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm text-center">
          <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-green-100 flex items-center justify-center">
            <span className="text-green-600 font-bold">%</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{successRate}%</p>
          <p className="text-sm text-gray-500">Success Rate</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm text-center">
          <FiCalendar className="mx-auto text-2xl text-purple-500 mb-2" />
          <p className="text-2xl font-bold text-gray-900">
            {deliveryPerson?.createdAt 
              ? new Date(deliveryPerson.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
              : 'N/A'}
          </p>
          <p className="text-sm text-gray-500">Member Since</p>
        </div>
      </div>

      {/* Personal Details */}
      <div className="bg-white rounded-xl shadow-sm mb-6">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-gray-900">Personal Details</h3>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <FiUser className="text-gray-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Full Name</p>
              <p className="font-medium text-gray-900">{deliveryPerson?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <FiMail className="text-gray-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium text-gray-900">{deliveryPerson?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <FiPhone className="text-gray-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="font-medium text-gray-900">{deliveryPerson?.phone}</p>
            </div>
          </div>
          {deliveryPerson?.address && (
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <FiTruck className="text-gray-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Address</p>
                <p className="font-medium text-gray-900">{deliveryPerson.address}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Vehicle & License Details */}
      <div className="bg-white rounded-xl shadow-sm mb-6">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-gray-900">Vehicle & License</h3>
        </div>
        <div className="p-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-lg">
                    {deliveryPerson?.transportType === 'BIKE' ? '🏍️' :
                     deliveryPerson?.transportType === 'SCOOTER' ? '🛵' :
                     deliveryPerson?.transportType === 'AUTO' ? '🛺' :
                     deliveryPerson?.transportType === 'TRUCK' ? '🚛' : '🚐'}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Transport Type</p>
                  <p className="font-medium text-gray-900">
                    {transportLabels[deliveryPerson?.transportType] || deliveryPerson?.transportType}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <FiTruck className="text-gray-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Vehicle Number</p>
                  <p className="font-medium text-gray-900 uppercase">{deliveryPerson?.vehicleNumber}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <FiCreditCard className="text-gray-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">License Number</p>
                  <p className="font-medium text-gray-900">{deliveryPerson?.licenseNumber}</p>
                </div>
              </div>
              {deliveryPerson?.licenseExpiry && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <FiCalendar className="text-gray-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">License Expiry</p>
                    <p className={`font-medium ${
                      new Date(deliveryPerson.licenseExpiry) < new Date()
                        ? 'text-red-600'
                        : 'text-gray-900'
                    }`}>
                      {new Date(deliveryPerson.licenseExpiry).toLocaleDateString()}
                      {new Date(deliveryPerson.licenseExpiry) < new Date() && ' (Expired)'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Documents Preview */}
            <div className="space-y-4">
              {deliveryPerson?.licensePhoto && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">License Photo</p>
                  <img 
                    src={getImageUrl(deliveryPerson.licensePhoto)}
                    alt="License"
                    className="w-full max-h-40 object-cover rounded-lg"
                  />
                </div>
              )}
              {deliveryPerson?.vehiclePhoto && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Vehicle Photo</p>
                  <img 
                    src={getImageUrl(deliveryPerson.vehiclePhoto)}
                    alt="Vehicle"
                    className="w-full max-h-40 object-cover rounded-lg"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Earnings Summary */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
        <h3 className="font-semibold mb-4">Earnings Summary</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-green-100 text-sm">Total Earned</p>
            <p className="text-2xl font-bold">₹{deliveryPerson?.totalEarnings?.toLocaleString() || 0}</p>
          </div>
          <div>
            <p className="text-green-100 text-sm">Paid</p>
            <p className="text-2xl font-bold">₹{deliveryPerson?.paidAmount?.toLocaleString() || 0}</p>
          </div>
          <div>
            <p className="text-green-100 text-sm">Pending</p>
            <p className="text-2xl font-bold">₹{deliveryPerson?.pendingAmount?.toLocaleString() || 0}</p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-white/20">
          <p className="text-sm text-green-100">
            Per Delivery Rate: <span className="font-bold text-white">₹{deliveryPerson?.perDeliveryRate || 0}</span>
          </p>
        </div>
      </div>

      {/* Contact Admin Note */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
        <p className="text-sm text-blue-800">
          <strong>Need to update your details?</strong><br />
          Please contact the admin to update your profile information, vehicle details, or documents.
        </p>
      </div>
    </div>
  );
}
