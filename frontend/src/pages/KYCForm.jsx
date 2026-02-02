import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUpload, FiCheck, FiX, FiAlertCircle, FiCamera, FiFileText, FiUser, FiBriefcase, FiMapPin, FiPhone } from 'react-icons/fi';
import { kycAPI } from '../api';
import { PageLoading } from '../components/Loading';
import toast from 'react-hot-toast';

const userTypes = [
  { value: 'BUSINESS', label: 'Business / Shop' },
  { value: 'INDIVIDUAL', label: 'Individual Customer' },
];

const businessTypes = [
  { value: 'RETAILER', label: 'Retail Shop' },
  { value: 'WHOLESALER', label: 'Wholesaler' },
  { value: 'HOTEL_RESTAURANT', label: 'Hotel / Restaurant' },
  { value: 'CATERER', label: 'Caterer' },
  { value: 'SUPERMARKET', label: 'Supermarket' },
  { value: 'INDIVIDUAL', label: 'Individual Customer' },
  { value: 'OTHER', label: 'Other' },
];

const indianStates = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Puducherry', 'Chandigarh'
];

const statusColors = {
  PENDING: 'bg-gray-100 text-gray-800',
  SUBMITTED: 'bg-blue-100 text-blue-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
};

export default function KYCForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [kycStatus, setKycStatus] = useState(null);
  
  const [formData, setFormData] = useState({
    userType: 'BUSINESS',
    phone: '',
    businessType: '',
    yearsInBusiness: '',
    averageMonthlyPurchase: '',
    referenceName: '',
    referencePhone: '',
    referenceRelation: '',
  });
  
  // Address states
  const [businessAddress, setBusinessAddress] = useState({
    street: '',
    city: '',
    state: '',
    pincode: '',
  });
  
  const [deliveryAddress, setDeliveryAddress] = useState({
    street: '',
    city: '',
    state: '',
    pincode: '',
  });
  
  const [sameAsBusinessAddress, setSameAsBusinessAddress] = useState(false);
  
  const [documents, setDocuments] = useState({
    ownerPhoto: null,
    aadharCard: null,
    shopPhoto: null,
    panCard: null,
    gstCertificate: null,
    businessLicense: null,
  });
  
  const [previews, setPreviews] = useState({});

  useEffect(() => {
    fetchKycStatus();
  }, []);

  // Sync delivery address when checkbox changes
  useEffect(() => {
    if (sameAsBusinessAddress) {
      setDeliveryAddress({ ...businessAddress });
    }
  }, [sameAsBusinessAddress, businessAddress]);

  const fetchKycStatus = async () => {
    try {
      const res = await kycAPI.getStatus();
      setKycStatus(res.data.data);
      
      // Pre-fill form if data exists
      if (res.data.data.businessDetails) {
        const bd = res.data.data.businessDetails;
        setFormData(prev => ({
          ...prev,
          userType: res.data.data.userType || 'BUSINESS',
          phone: res.data.data.phone || '',
          businessType: bd.businessType || '',
          yearsInBusiness: bd.yearsInBusiness || '',
          averageMonthlyPurchase: bd.averageMonthlyPurchase || '',
          referenceName: bd.referenceContact?.name || '',
          referencePhone: bd.referenceContact?.phone || '',
          referenceRelation: bd.referenceContact?.relation || '',
        }));
      } else {
        // Pre-fill userType and phone even if no business details
        setFormData(prev => ({
          ...prev,
          userType: res.data.data.userType || 'BUSINESS',
          phone: res.data.data.phone || '',
        }));
      }
      
      // Pre-fill addresses
      if (res.data.data.businessAddress) {
        setBusinessAddress(res.data.data.businessAddress);
      }
      if (res.data.data.deliveryAddress) {
        setDeliveryAddress(res.data.data.deliveryAddress);
      }
      if (res.data.data.sameAsBusinessAddress) {
        setSameAsBusinessAddress(res.data.data.sameAsBusinessAddress);
      }
      
      // Set existing document previews
      if (res.data.data.documents) {
        const docPreviews = {};
        Object.keys(res.data.data.documents).forEach(key => {
          if (res.data.data.documents[key]) {
            docPreviews[key] = `http://localhost:5000${res.data.data.documents[key]}`;
          }
        });
        setPreviews(docPreviews);
      }
    } catch (error) {
      toast.error('Failed to fetch KYC status');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleBusinessAddressChange = (e) => {
    const updated = { ...businessAddress, [e.target.name]: e.target.value };
    setBusinessAddress(updated);
    if (sameAsBusinessAddress) {
      setDeliveryAddress(updated);
    }
  };

  const handleDeliveryAddressChange = (e) => {
    setDeliveryAddress({ ...deliveryAddress, [e.target.name]: e.target.value });
  };

  const handleSameAddressChange = (e) => {
    const checked = e.target.checked;
    setSameAsBusinessAddress(checked);
    if (checked) {
      setDeliveryAddress({ ...businessAddress });
    }
  };

  const handleFileChange = (e, fieldName) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      
      setDocuments({ ...documents, [fieldName]: file });
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews({ ...previews, [fieldName]: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate phone number
    if (!formData.phone || formData.phone.length < 10) {
      toast.error('Please enter a valid phone number');
      return;
    }
    
    // Validate required fields
    if (!formData.businessType) {
      toast.error('Please select business/customer type');
      return;
    }
    
    // Validate business address
    if (!businessAddress.street || !businessAddress.city || !businessAddress.state || !businessAddress.pincode) {
      toast.error('Please fill complete business address');
      return;
    }
    
    // Validate delivery address
    if (!sameAsBusinessAddress) {
      if (!deliveryAddress.street || !deliveryAddress.city || !deliveryAddress.state || !deliveryAddress.pincode) {
        toast.error('Please fill complete delivery address');
        return;
      }
    }
    
    // Check required documents - only ownerPhoto and aadharCard are required
    const requiredDocs = ['ownerPhoto', 'aadharCard'];
    const missingDocs = requiredDocs.filter(doc => !documents[doc] && !previews[doc]);
    
    if (missingDocs.length > 0) {
      const docNames = missingDocs.map(d => d === 'ownerPhoto' ? 'Owner Photo' : 'Aadhar Card');
      toast.error(`Please upload: ${docNames.join(', ')}`);
      return;
    }
    
    setSubmitting(true);
    
    try {
      const submitData = new FormData();
      
      // Add user type and phone
      submitData.append('userType', formData.userType);
      submitData.append('phone', formData.phone);
      
      // Add business details
      submitData.append('businessDetails', JSON.stringify({
        businessType: formData.businessType,
        yearsInBusiness: parseInt(formData.yearsInBusiness) || 0,
        averageMonthlyPurchase: parseInt(formData.averageMonthlyPurchase) || 0,
        referenceContact: {
          name: formData.referenceName,
          phone: formData.referencePhone,
          relation: formData.referenceRelation,
        }
      }));
      
      // Add addresses
      submitData.append('businessAddress', JSON.stringify(businessAddress));
      submitData.append('deliveryAddress', JSON.stringify(sameAsBusinessAddress ? businessAddress : deliveryAddress));
      submitData.append('sameAsBusinessAddress', sameAsBusinessAddress);
      
      // Add documents
      Object.keys(documents).forEach(key => {
        if (documents[key]) {
          submitData.append(key, documents[key]);
        }
      });
      
      const res = await kycAPI.submit(submitData);
      toast.success(res.data.message);
      fetchKycStatus();
      
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit KYC');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <PageLoading />;

  // Show status if already approved
  if (kycStatus?.status === 'APPROVED') {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiCheck className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">KYC Verified!</h1>
            <p className="text-gray-600 mb-6">Your account has been verified. You can now place orders.</p>
            <button
              onClick={() => navigate('/products')}
              className="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700"
            >
              Browse Products
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isDisabled = kycStatus?.status === 'SUBMITTED';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your KYC</h1>
          <p className="text-gray-600">Please verify your identity to start placing orders</p>
          
          {kycStatus?.status && (
            <div className={`inline-block mt-4 px-4 py-2 rounded-full text-sm font-medium ${statusColors[kycStatus.status]}`}>
              Status: {kycStatus.status}
            </div>
          )}
          
          {kycStatus?.status === 'REJECTED' && kycStatus?.rejectionReason && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 text-left max-w-xl mx-auto">
              <div className="flex items-start gap-3">
                <FiAlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-red-800">Your KYC was rejected</p>
                  <p className="text-sm text-red-600 mt-1">{kycStatus.rejectionReason}</p>
                  <p className="text-sm text-red-600 mt-2">Please re-submit with correct documents.</p>
                </div>
              </div>
            </div>
          )}
          
          {kycStatus?.status === 'SUBMITTED' && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4 text-left max-w-xl mx-auto">
              <div className="flex items-start gap-3">
                <FiAlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-800">KYC Under Review</p>
                  <p className="text-sm text-blue-600 mt-1">Your documents are being verified. This usually takes 24-48 hours.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* User Type & Phone Section */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <FiUser className="w-5 h-5 text-purple-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Account Type</h2>
            </div>
            
            {/* User Type Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                I am registering as <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userTypes.map(type => (
                  <label
                    key={type.value}
                    className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      formData.userType === type.value
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    } ${isDisabled ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    <input
                      type="radio"
                      name="userType"
                      value={type.value}
                      checked={formData.userType === type.value}
                      onChange={handleInputChange}
                      disabled={isDisabled}
                      className="w-4 h-4 text-green-600"
                    />
                    <div className="flex items-center gap-2">
                      {type.value === 'BUSINESS' ? (
                        <FiBriefcase className="w-5 h-5 text-gray-600" />
                      ) : (
                        <FiUser className="w-5 h-5 text-gray-600" />
                      )}
                      <span className="font-medium text-gray-900">{type.label}</span>
                    </div>
                  </label>
                ))}
              </div>
              <p className="mt-2 text-sm text-gray-500">
                {formData.userType === 'INDIVIDUAL' 
                  ? 'You can order fruits for personal use without a business registration.'
                  : 'Select this if you own a shop, restaurant, or any business.'}
              </p>
            </div>
            
            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <FiPhone className="w-4 h-4" />
                  Phone Number <span className="text-red-500">*</span>
                </div>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Enter your 10-digit phone number"
                className="w-full md:w-1/2 p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                pattern="[0-9]{10}"
                maxLength={10}
                required
                disabled={isDisabled}
              />
              <p className="mt-1 text-sm text-gray-500">We'll use this to contact you about orders and deliveries.</p>
            </div>
          </div>

          {/* Business Details */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <FiBriefcase className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                {formData.userType === 'INDIVIDUAL' ? 'Customer Details' : 'Business Details'}
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {formData.userType === 'INDIVIDUAL' ? 'Customer Type' : 'Business Type'} <span className="text-red-500">*</span>
                </label>
                <select
                  name="businessType"
                  value={formData.businessType}
                  onChange={handleInputChange}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                  disabled={isDisabled}
                >
                  <option value="">Select type</option>
                  {formData.userType === 'INDIVIDUAL' 
                    ? <option value="INDIVIDUAL">Individual Customer</option>
                    : businessTypes.filter(t => t.value !== 'INDIVIDUAL').map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))
                  }
                </select>
              </div>
              
              {formData.userType === 'BUSINESS' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Years in Business</label>
                  <input
                    type="number"
                    name="yearsInBusiness"
                    value={formData.yearsInBusiness}
                    onChange={handleInputChange}
                    placeholder="e.g., 5"
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    min="0"
                    disabled={isDisabled}
                  />
                </div>
              )}
              
              {formData.userType === 'BUSINESS' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Average Monthly Purchase (₹)
                  </label>
                  <input
                    type="number"
                    name="averageMonthlyPurchase"
                    value={formData.averageMonthlyPurchase}
                    onChange={handleInputChange}
                    placeholder="e.g., 50000"
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    min="0"
                    disabled={isDisabled}
                  />
                </div>
              )}
            </div>
            
            {/* Reference Contact - Only for Business */}
            {formData.userType === 'BUSINESS' && (
              <div className="mt-6 pt-6 border-t">
                <h3 className="font-medium text-gray-900 mb-4">Reference Contact (Optional)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input
                    type="text"
                    name="referenceName"
                    value={formData.referenceName}
                    onChange={handleInputChange}
                    placeholder="Reference Name"
                    className="p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    disabled={isDisabled}
                  />
                  <input
                    type="tel"
                    name="referencePhone"
                    value={formData.referencePhone}
                    onChange={handleInputChange}
                    placeholder="Reference Phone"
                    className="p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    disabled={isDisabled}
                  />
                  <input
                    type="text"
                    name="referenceRelation"
                    value={formData.referenceRelation}
                    onChange={handleInputChange}
                    placeholder="Relation (e.g., Supplier)"
                    className="p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    disabled={isDisabled}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Address */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FiMapPin className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                {formData.userType === 'INDIVIDUAL' ? 'Home Address' : 'Business Address'} <span className="text-red-500">*</span>
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Street Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="street"
                  value={businessAddress.street}
                  onChange={handleBusinessAddressChange}
                  placeholder={formData.userType === 'INDIVIDUAL' ? 'House No., Building, Street' : 'Shop No., Building, Street'}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                  disabled={isDisabled}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="city"
                  value={businessAddress.city}
                  onChange={handleBusinessAddressChange}
                  placeholder="City"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                  disabled={isDisabled}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State <span className="text-red-500">*</span>
                </label>
                <select
                  name="state"
                  value={businessAddress.state}
                  onChange={handleBusinessAddressChange}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                  disabled={isDisabled}
                >
                  <option value="">Select State</option>
                  {indianStates.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pincode <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="pincode"
                  value={businessAddress.pincode}
                  onChange={handleBusinessAddressChange}
                  placeholder="6-digit Pincode"
                  pattern="[0-9]{6}"
                  maxLength="6"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                  disabled={isDisabled}
                />
              </div>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <FiMapPin className="w-5 h-5 text-purple-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Delivery Address <span className="text-red-500">*</span></h2>
              </div>
            </div>
            
            {/* Same as Business Address Checkbox */}
            <label className="flex items-center gap-3 mb-6 cursor-pointer">
              <input
                type="checkbox"
                checked={sameAsBusinessAddress}
                onChange={handleSameAddressChange}
                disabled={isDisabled}
                className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
              />
              <span className="text-gray-700 font-medium">Same as Business Address</span>
            </label>
            
            {!sameAsBusinessAddress && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Street Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="street"
                    value={deliveryAddress.street}
                    onChange={handleDeliveryAddressChange}
                    placeholder="Shop No., Building, Street"
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    required={!sameAsBusinessAddress}
                    disabled={isDisabled}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={deliveryAddress.city}
                    onChange={handleDeliveryAddressChange}
                    placeholder="City"
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    required={!sameAsBusinessAddress}
                    disabled={isDisabled}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="state"
                    value={deliveryAddress.state}
                    onChange={handleDeliveryAddressChange}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    required={!sameAsBusinessAddress}
                    disabled={isDisabled}
                  >
                    <option value="">Select State</option>
                    {indianStates.map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pincode <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="pincode"
                    value={deliveryAddress.pincode}
                    onChange={handleDeliveryAddressChange}
                    placeholder="6-digit Pincode"
                    pattern="[0-9]{6}"
                    maxLength="6"
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    required={!sameAsBusinessAddress}
                    disabled={isDisabled}
                  />
                </div>
              </div>
            )}
            
            {sameAsBusinessAddress && (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-600">
                  <strong>Delivery will be made to:</strong><br />
                  {businessAddress.street}, {businessAddress.city}, {businessAddress.state} - {businessAddress.pincode}
                </p>
              </div>
            )}
          </div>

          {/* Document Upload */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <FiFileText className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Upload Documents</h2>
                <p className="text-sm text-gray-500">Only Owner Photo and Aadhar Card are required</p>
              </div>
            </div>
            
            {/* Required Documents */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">Required Documents</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Owner Photo */}
                <DocumentUpload
                  label="Owner Photo"
                  fieldName="ownerPhoto"
                  required
                  preview={previews.ownerPhoto}
                  onChange={(e) => handleFileChange(e, 'ownerPhoto')}
                  disabled={isDisabled}
                  icon={<FiUser className="w-8 h-8" />}
                />
                
                {/* Aadhar Card */}
                <DocumentUpload
                  label="Aadhar Card"
                  fieldName="aadharCard"
                  required
                  preview={previews.aadharCard}
                  onChange={(e) => handleFileChange(e, 'aadharCard')}
                  disabled={isDisabled}
                />
              </div>
            </div>
            
            {/* Optional Documents */}
            <div className="pt-6 border-t">
              <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">Optional Documents</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Shop Photo */}
                <DocumentUpload
                  label="Shop Photo"
                  fieldName="shopPhoto"
                  preview={previews.shopPhoto}
                  onChange={(e) => handleFileChange(e, 'shopPhoto')}
                  disabled={isDisabled}
                  icon={<FiCamera className="w-6 h-6" />}
                  compact
                />
                
                {/* PAN Card */}
                <DocumentUpload
                  label="PAN Card"
                  fieldName="panCard"
                  preview={previews.panCard}
                  onChange={(e) => handleFileChange(e, 'panCard')}
                  disabled={isDisabled}
                  compact
                />
                
                {/* GST Certificate */}
                <DocumentUpload
                  label="GST Certificate"
                  fieldName="gstCertificate"
                  preview={previews.gstCertificate}
                  onChange={(e) => handleFileChange(e, 'gstCertificate')}
                  disabled={isDisabled}
                  compact
                />
                
                {/* Business License */}
                <DocumentUpload
                  label="Business License"
                  fieldName="businessLicense"
                  preview={previews.businessLicense}
                  onChange={(e) => handleFileChange(e, 'businessLicense')}
                  disabled={isDisabled}
                  compact
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          {kycStatus?.status !== 'SUBMITTED' && (
            <div className="flex justify-center">
              <button
                type="submit"
                disabled={submitting}
                className="bg-green-600 text-white px-12 py-4 rounded-xl font-semibold text-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <FiUpload className="w-5 h-5" />
                    Submit KYC
                  </>
                )}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

// Document Upload Component
function DocumentUpload({ label, fieldName, required, preview, onChange, disabled, icon, compact }) {
  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      <div className={`relative border-2 border-dashed rounded-xl p-4 text-center transition-colors ${
        preview ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-green-400'
      } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}>
        <input
          type="file"
          accept="image/*,.pdf"
          onChange={onChange}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
        
        {preview ? (
          <div className="relative">
            {preview.includes('application/pdf') || preview.endsWith('.pdf') ? (
              <div className={`w-full ${compact ? 'h-20' : 'h-32'} bg-gray-100 rounded-lg flex items-center justify-center`}>
                <FiFileText className={`${compact ? 'w-8 h-8' : 'w-12 h-12'} text-gray-400`} />
              </div>
            ) : (
              <img
                src={preview}
                alt={label}
                className={`w-full ${compact ? 'h-20' : 'h-32'} object-cover rounded-lg`}
              />
            )}
            <div className="absolute top-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <FiCheck className="w-4 h-4 text-white" />
            </div>
          </div>
        ) : (
          <div className={compact ? 'py-2' : 'py-4'}>
            <div className="text-gray-400 mb-2 flex justify-center">
              {icon || <FiUpload className={compact ? 'w-6 h-6' : 'w-8 h-8'} />}
            </div>
            <p className={`text-gray-500 ${compact ? 'text-xs' : 'text-sm'}`}>Click to upload</p>
            {!compact && <p className="text-xs text-gray-400 mt-1">JPG, PNG or PDF (max 10MB)</p>}
          </div>
        )}
      </div>
    </div>
  );
}
