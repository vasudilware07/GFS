import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  FiSave, FiX, FiUpload, FiTrash2, FiUser, FiPhone, FiMail, 
  FiTruck, FiHash, FiCalendar, FiDollarSign, FiArrowLeft,
  FiCreditCard, FiImage
} from 'react-icons/fi';
import { deliveryAPI } from '../../api';
import { PageLoading, ButtonLoading } from '../../components/Loading';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const BASE_URL = API_URL.replace('/api', '');

const transportTypes = [
  { value: 'BIKE', label: 'Bike', icon: '🏍️' },
  { value: 'SCOOTER', label: 'Scooter', icon: '🛵' },
  { value: 'AUTO', label: 'Auto Rickshaw', icon: '🛺' },
  { value: 'MINI_TRUCK', label: 'Mini Truck', icon: '🚐' },
  { value: 'TRUCK', label: 'Truck', icon: '🚛' },
  { value: 'VAN', label: 'Van', icon: '🚐' }
];

export default function DeliveryPersonForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  
  const licenseInputRef = useRef(null);
  const vehicleInputRef = useRef(null);
  const profileInputRef = useRef(null);
  
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    licenseNumber: '',
    licenseExpiry: '',
    transportType: 'BIKE',
    vehicleNumber: '',
    perDeliveryRate: '50',
    address: '',
    isActive: true
  });

  // File states
  const [licensePhoto, setLicensePhoto] = useState(null);
  const [vehiclePhoto, setVehiclePhoto] = useState(null);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [licensePreview, setLicensePreview] = useState(null);
  const [vehiclePreview, setVehiclePreview] = useState(null);
  const [profilePreview, setProfilePreview] = useState(null);
  const [existingLicense, setExistingLicense] = useState(null);
  const [existingVehicle, setExistingVehicle] = useState(null);
  const [existingProfile, setExistingProfile] = useState(null);

  useEffect(() => {
    if (isEdit) {
      fetchDeliveryPerson();
    }
  }, [id]);

  useEffect(() => {
    return () => {
      if (licensePreview) URL.revokeObjectURL(licensePreview);
      if (vehiclePreview) URL.revokeObjectURL(vehiclePreview);
      if (profilePreview) URL.revokeObjectURL(profilePreview);
    };
  }, []);

  const fetchDeliveryPerson = async () => {
    try {
      const res = await deliveryAPI.getPerson(id);
      const data = res.data.data;
      setFormData({
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        password: '',
        licenseNumber: data.licenseNumber || '',
        licenseExpiry: data.licenseExpiry ? data.licenseExpiry.split('T')[0] : '',
        transportType: data.transportType || 'BIKE',
        vehicleNumber: data.vehicleNumber || '',
        perDeliveryRate: data.perDeliveryRate?.toString() || '50',
        address: data.address || '',
        isActive: data.isActive !== false
      });
      setExistingLicense(data.licensePhoto);
      setExistingVehicle(data.vehiclePhoto);
      setExistingProfile(data.profilePhoto);
    } catch (error) {
      toast.error('Failed to fetch delivery person');
      navigate('/admin/delivery-persons');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (type, file) => {
    if (!file) return;

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('File size must be less than 5MB');
      return;
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a valid image (JPG, PNG, WEBP)');
      return;
    }

    const previewUrl = URL.createObjectURL(file);

    if (type === 'license') {
      if (licensePreview) URL.revokeObjectURL(licensePreview);
      setLicensePhoto(file);
      setLicensePreview(previewUrl);
      setExistingLicense(null);
    } else if (type === 'vehicle') {
      if (vehiclePreview) URL.revokeObjectURL(vehiclePreview);
      setVehiclePhoto(file);
      setVehiclePreview(previewUrl);
      setExistingVehicle(null);
    } else if (type === 'profile') {
      if (profilePreview) URL.revokeObjectURL(profilePreview);
      setProfilePhoto(file);
      setProfilePreview(previewUrl);
      setExistingProfile(null);
    }
  };

  const removeFile = (type) => {
    if (type === 'license') {
      if (licensePreview) URL.revokeObjectURL(licensePreview);
      setLicensePhoto(null);
      setLicensePreview(null);
      setExistingLicense(null);
    } else if (type === 'vehicle') {
      if (vehiclePreview) URL.revokeObjectURL(vehiclePreview);
      setVehiclePhoto(null);
      setVehiclePreview(null);
      setExistingVehicle(null);
    } else if (type === 'profile') {
      if (profilePreview) URL.revokeObjectURL(profilePreview);
      setProfilePhoto(null);
      setProfilePreview(null);
      setExistingProfile(null);
    }
  };

  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${BASE_URL}${path}`;
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return false;
    }
    if (!formData.email.trim()) {
      toast.error('Email is required');
      return false;
    }
    if (!formData.phone.trim() || formData.phone.length < 10) {
      toast.error('Valid phone number is required');
      return false;
    }
    if (!isEdit && !formData.password) {
      toast.error('Password is required');
      return false;
    }
    if (formData.password && formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return false;
    }
    if (!formData.licenseNumber.trim()) {
      toast.error('License number is required');
      return false;
    }
    if (!formData.vehicleNumber.trim()) {
      toast.error('Vehicle number is required');
      return false;
    }
    if (!isEdit && !licensePhoto && !existingLicense) {
      toast.error('License photo is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    try {
      const submitData = new FormData();
      
      // Add form fields
      Object.keys(formData).forEach(key => {
        if (key === 'password' && !formData[key]) return;
        submitData.append(key, formData[key]);
      });

      // Add files
      if (licensePhoto) submitData.append('licensePhoto', licensePhoto);
      if (vehiclePhoto) submitData.append('vehiclePhoto', vehiclePhoto);
      if (profilePhoto) submitData.append('profilePhoto', profilePhoto);

      if (isEdit) {
        await deliveryAPI.updatePerson(id, submitData);
        toast.success('Delivery person updated successfully');
      } else {
        await deliveryAPI.createPerson(submitData);
        toast.success('Delivery person created successfully');
      }
      
      navigate('/admin/delivery-persons');
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} delivery person`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoading />;

  return (
    <div className="p-6">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => navigate('/admin/delivery-persons')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <FiArrowLeft /> Back to Delivery Persons
        </button>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            {isEdit ? 'Edit Delivery Person' : 'Add New Delivery Person'}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Photo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Profile Photo
              </label>
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                  {(profilePreview || existingProfile) ? (
                    <img 
                      src={profilePreview || getImageUrl(existingProfile)} 
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <FiUser className="text-3xl text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <input
                    type="file"
                    ref={profileInputRef}
                    onChange={(e) => handleFileChange('profile', e.target.files[0])}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => profileInputRef.current?.click()}
                    className="btn-secondary text-sm"
                  >
                    <FiUpload className="mr-2" /> Upload Photo
                  </button>
                  {(profilePreview || existingProfile) && (
                    <button
                      type="button"
                      onClick={() => removeFile('profile')}
                      className="ml-2 text-red-600 text-sm hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Basic Information */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="input-field pl-10"
                    placeholder="Enter full name"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="input-field pl-10"
                    placeholder="Enter email address"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone *
                </label>
                <div className="relative">
                  <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="input-field pl-10"
                    placeholder="Enter phone number"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password {isEdit ? '(leave blank to keep current)' : '*'}
                </label>
                <div className="relative">
                  <FiHash className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="input-field pl-10"
                    placeholder={isEdit ? 'Enter new password' : 'Enter password'}
                    required={!isEdit}
                    minLength={6}
                  />
                </div>
              </div>
            </div>

            {/* License Details */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">License Details</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    License Number *
                  </label>
                  <div className="relative">
                    <FiCreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      name="licenseNumber"
                      value={formData.licenseNumber}
                      onChange={handleChange}
                      className="input-field pl-10"
                      placeholder="Enter license number"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    License Expiry
                  </label>
                  <div className="relative">
                    <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="date"
                      name="licenseExpiry"
                      value={formData.licenseExpiry}
                      onChange={handleChange}
                      className="input-field pl-10"
                    />
                  </div>
                </div>
              </div>

              {/* License Photo Upload */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  License Photo *
                </label>
                <div className="border-2 border-dashed rounded-lg p-4">
                  {(licensePreview || existingLicense) ? (
                    <div className="relative">
                      <img 
                        src={licensePreview || getImageUrl(existingLicense)}
                        alt="License"
                        className="max-h-48 mx-auto rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeFile('license')}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  ) : (
                    <div 
                      onClick={() => licenseInputRef.current?.click()}
                      className="text-center cursor-pointer py-8"
                    >
                      <FiImage className="mx-auto text-4xl text-gray-300 mb-2" />
                      <p className="text-gray-500">Click to upload license photo</p>
                      <p className="text-sm text-gray-400">JPG, PNG up to 5MB</p>
                    </div>
                  )}
                  <input
                    type="file"
                    ref={licenseInputRef}
                    onChange={(e) => handleFileChange('license', e.target.files[0])}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              </div>
            </div>

            {/* Vehicle Details */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Vehicle Details</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Transport Type *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {transportTypes.map(type => (
                      <label 
                        key={type.value}
                        className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                          formData.transportType === type.value
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="transportType"
                          value={type.value}
                          checked={formData.transportType === type.value}
                          onChange={handleChange}
                          className="hidden"
                        />
                        <span className="text-xl">{type.icon}</span>
                        <span className="text-sm">{type.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Vehicle Number *
                    </label>
                    <div className="relative">
                      <FiTruck className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        name="vehicleNumber"
                        value={formData.vehicleNumber}
                        onChange={handleChange}
                        className="input-field pl-10 uppercase"
                        placeholder="MH 12 AB 1234"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Per Delivery Rate (₹)
                    </label>
                    <div className="relative">
                      <FiDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="number"
                        name="perDeliveryRate"
                        value={formData.perDeliveryRate}
                        onChange={handleChange}
                        className="input-field pl-10"
                        placeholder="50"
                        min="0"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Vehicle Photo Upload */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vehicle Photo
                </label>
                <div className="border-2 border-dashed rounded-lg p-4">
                  {(vehiclePreview || existingVehicle) ? (
                    <div className="relative">
                      <img 
                        src={vehiclePreview || getImageUrl(existingVehicle)}
                        alt="Vehicle"
                        className="max-h-48 mx-auto rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeFile('vehicle')}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  ) : (
                    <div 
                      onClick={() => vehicleInputRef.current?.click()}
                      className="text-center cursor-pointer py-8"
                    >
                      <FiTruck className="mx-auto text-4xl text-gray-300 mb-2" />
                      <p className="text-gray-500">Click to upload vehicle photo</p>
                      <p className="text-sm text-gray-400">JPG, PNG up to 5MB</p>
                    </div>
                  )}
                  <input
                    type="file"
                    ref={vehicleInputRef}
                    onChange={(e) => handleFileChange('vehicle', e.target.files[0])}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="border-t pt-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="input-field"
                rows={3}
                placeholder="Enter full address"
              />
            </div>

            {/* Status */}
            <div className="border-t pt-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span className="font-medium text-gray-700">Active (can login and receive orders)</span>
              </label>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-6 border-t">
              <button
                type="button"
                onClick={() => navigate('/admin/delivery-persons')}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {saving ? <ButtonLoading /> : (
                  <>
                    <FiSave /> {isEdit ? 'Update' : 'Create'} Delivery Person
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
