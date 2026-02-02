import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiTruck, FiLogIn } from 'react-icons/fi';
import { useDeliveryAuthStore } from '../../store/deliveryAuthStore';
import { ButtonLoading } from '../../components/Loading';
import toast from 'react-hot-toast';

export default function DeliveryLogin() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useDeliveryAuthStore();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  if (isAuthenticated) {
    navigate('/delivery/dashboard', { replace: true });
    return null;
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await login(formData.email, formData.password);
      toast.success('Login successful!');
      navigate('/delivery/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiTruck className="text-4xl text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Delivery Portal</h1>
          <p className="text-gray-500 mt-1">LBR Fruit Suppliers</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                placeholder="Enter your password"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <ButtonLoading /> : (
              <>
                <FiLogIn /> Sign In
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t text-center">
          <p className="text-sm text-gray-500">
            This portal is for authorized delivery personnel only.
          </p>
          <a 
            href="/" 
            className="text-green-600 hover:text-green-700 text-sm font-medium mt-2 inline-block"
          >
            ← Back to Main Site
          </a>
        </div>
      </div>
    </div>
  );
}
