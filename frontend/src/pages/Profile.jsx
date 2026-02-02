import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiUser, FiMail, FiPhone, FiMapPin, FiEdit2, FiSave, FiLock, FiShoppingBag, FiFileText, FiBriefcase } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { userAPI, authAPI } from '../api';
import { useAuthStore } from '../store';
import { PageLoading, ButtonLoading } from '../components/Loading';

export default function Profile() {
  const { user, setUser } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [profile, setProfile] = useState(null);
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await authAPI.getMe();
      setProfile(res.data.data);
    } catch (error) {
      toast.error('Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('address.')) {
      const field = name.split('.')[1];
      setProfile({
        ...profile,
        address: { ...profile.address, [field]: value },
      });
    } else {
      setProfile({ ...profile, [name]: value });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await userAPI.updateProfile(profile);
      setProfile(res.data.data);
      setUser(res.data.data);
      setEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwords.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setSaving(true);
    try {
      await authAPI.changePassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      toast.success('Password changed successfully');
      setChangingPassword(false);
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoading />;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">My Profile</h1>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Profile Sidebar */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 text-center">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiUser className="w-12 h-12 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">{profile?.ownerName}</h2>
              <p className="text-gray-500">{profile?.shopName}</p>
              <p className="text-sm text-gray-400 mt-2">{profile?.email}</p>
              
              <div className="mt-6 pt-6 border-t">
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                  profile?.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${profile?.isActive ? 'bg-green-600' : 'bg-red-600'}`}></span>
                  {profile?.isActive ? 'Active Account' : 'Account Blocked'}
                </div>
              </div>

              {profile?.role === 'ADMIN' && (
                <div className="mt-4">
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-700">
                    Admin
                  </span>
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
              <h3 className="font-bold text-gray-900 mb-4">Quick Stats</h3>
              <div className="space-y-4">
                <Link to="/orders" className="flex items-center justify-between hover:bg-gray-50 p-2 -mx-2 rounded-lg transition-colors">
                  <div className="flex items-center gap-2 text-gray-600">
                    <FiShoppingBag className="w-4 h-4" />
                    <span>Total Orders</span>
                  </div>
                  <span className="font-bold">{profile?.orderCount || 0}</span>
                </Link>
                <Link to="/invoices" className="flex items-center justify-between hover:bg-gray-50 p-2 -mx-2 rounded-lg transition-colors">
                  <div className="flex items-center gap-2 text-gray-600">
                    <FiFileText className="w-4 h-4" />
                    <span>Invoices</span>
                  </div>
                  <span className="font-bold">{profile?.invoiceCount || 0}</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="md:col-span-2 space-y-6">
            {/* Business Information */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900">Business Information</h2>
                {!editing ? (
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-2 text-green-600 hover:text-green-700"
                  >
                    <FiEdit2 className="w-4 h-4" />
                    Edit
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditing(false);
                        fetchProfile();
                      }}
                      className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="btn-primary flex items-center gap-2"
                    >
                      {saving ? <ButtonLoading /> : <><FiSave className="w-4 h-4" /> Save</>}
                    </button>
                  </div>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FiBriefcase className="inline w-4 h-4 mr-1" /> Shop Name
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      name="shopName"
                      value={profile?.shopName || ''}
                      onChange={handleChange}
                      className="input-field"
                    />
                  ) : (
                    <p className="text-gray-900">{profile?.shopName || '-'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FiUser className="inline w-4 h-4 mr-1" /> Owner Name
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      name="ownerName"
                      value={profile?.ownerName || ''}
                      onChange={handleChange}
                      className="input-field"
                    />
                  ) : (
                    <p className="text-gray-900">{profile?.ownerName || '-'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FiMail className="inline w-4 h-4 mr-1" /> Email
                  </label>
                  <p className="text-gray-900">{profile?.email}</p>
                  <p className="text-xs text-gray-500">Email cannot be changed</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FiPhone className="inline w-4 h-4 mr-1" /> Phone
                  </label>
                  {editing ? (
                    <input
                      type="tel"
                      name="phone"
                      value={profile?.phone || ''}
                      onChange={handleChange}
                      className="input-field"
                    />
                  ) : (
                    <p className="text-gray-900">{profile?.phone || '-'}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">GST Number</label>
                  {editing ? (
                    <input
                      type="text"
                      name="gstNumber"
                      value={profile?.gstNumber || ''}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="27AABCS1234R1Z5"
                    />
                  ) : (
                    <p className="text-gray-900">{profile?.gstNumber || 'Not provided'}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6">
                <FiMapPin className="inline w-5 h-5 mr-2" />
                Address
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Street</label>
                  {editing ? (
                    <input
                      type="text"
                      name="address.street"
                      value={profile?.address?.street || ''}
                      onChange={handleChange}
                      className="input-field"
                    />
                  ) : (
                    <p className="text-gray-900">{profile?.address?.street || '-'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                  {editing ? (
                    <input
                      type="text"
                      name="address.city"
                      value={profile?.address?.city || ''}
                      onChange={handleChange}
                      className="input-field"
                    />
                  ) : (
                    <p className="text-gray-900">{profile?.address?.city || '-'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                  {editing ? (
                    <input
                      type="text"
                      name="address.state"
                      value={profile?.address?.state || ''}
                      onChange={handleChange}
                      className="input-field"
                    />
                  ) : (
                    <p className="text-gray-900">{profile?.address?.state || '-'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pincode</label>
                  {editing ? (
                    <input
                      type="text"
                      name="address.pincode"
                      value={profile?.address?.pincode || ''}
                      onChange={handleChange}
                      className="input-field"
                    />
                  ) : (
                    <p className="text-gray-900">{profile?.address?.pincode || '-'}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Change Password */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900">
                  <FiLock className="inline w-5 h-5 mr-2" />
                  Security
                </h2>
                {!changingPassword && (
                  <button
                    onClick={() => setChangingPassword(true)}
                    className="text-green-600 hover:text-green-700"
                  >
                    Change Password
                  </button>
                )}
              </div>

              {changingPassword ? (
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                    <input
                      type="password"
                      value={passwords.currentPassword}
                      onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                      required
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                    <input
                      type="password"
                      value={passwords.newPassword}
                      onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                      required
                      minLength={6}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                    <input
                      type="password"
                      value={passwords.confirmPassword}
                      onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                      required
                      className="input-field"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setChangingPassword(false);
                        setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
                      }}
                      className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="btn-primary flex items-center gap-2"
                    >
                      {saving ? <ButtonLoading /> : 'Update Password'}
                    </button>
                  </div>
                </form>
              ) : (
                <p className="text-gray-500">
                  Password last changed: {profile?.passwordChangedAt 
                    ? new Date(profile.passwordChangedAt).toLocaleDateString('en-IN')
                    : 'Never'}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
