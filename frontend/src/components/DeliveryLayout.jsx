import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { 
  FiHome, FiPackage, FiDollarSign, FiUser, FiLogOut, FiMenu, FiX, 
  FiTruck, FiToggleLeft, FiToggleRight
} from 'react-icons/fi';
import { useState, useEffect } from 'react';
import { useDeliveryAuthStore } from '../store/deliveryAuthStore';
import { deliveryAPI } from '../api';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const BASE_URL = API_URL.replace('/api', '');

export default function DeliveryLayout() {
  const navigate = useNavigate();
  const { deliveryPerson, logout, updateProfile, refreshProfile } = useDeliveryAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    refreshProfile();
  }, []);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const toggleAvailability = async () => {
    setToggling(true);
    try {
      const newStatus = !deliveryPerson?.isAvailable;
      await deliveryAPI.updateAvailability(newStatus);
      updateProfile({ isAvailable: newStatus });
      toast.success(newStatus ? 'You are now available for deliveries' : 'You are now offline');
    } catch (error) {
      toast.error('Failed to update status');
    } finally {
      setToggling(false);
    }
  };

  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${BASE_URL}${path}`;
  };

  const navLinks = [
    { path: '/delivery/dashboard', icon: FiHome, label: 'Dashboard' },
    { path: '/delivery/orders', icon: FiPackage, label: 'My Orders' },
    { path: '/delivery/earnings', icon: FiDollarSign, label: 'Earnings' },
    { path: '/delivery/profile', icon: FiUser, label: 'Profile' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <header className="lg:hidden bg-white shadow-sm sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 py-3">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <FiMenu className="text-xl" />
          </button>
          <div className="flex items-center gap-2">
            <FiTruck className="text-green-600 text-xl" />
            <span className="font-bold text-gray-900">LBR Delivery</span>
          </div>
          <button
            onClick={toggleAvailability}
            disabled={toggling}
            className={`p-2 rounded-lg ${
              deliveryPerson?.isAvailable 
                ? 'bg-green-100 text-green-600' 
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            {deliveryPerson?.isAvailable ? <FiToggleRight size={24} /> : <FiToggleLeft size={24} />}
          </button>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-72 bg-white shadow-lg z-50 transform transition-transform duration-300
        lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="p-4 border-b">
            <div className="flex items-center justify-between lg:justify-center">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <FiTruck className="text-2xl text-green-600" />
                </div>
                <div>
                  <h1 className="font-bold text-gray-900">LBR Delivery</h1>
                  <p className="text-xs text-gray-500">Delivery Portal</p>
                </div>
              </div>
              <button 
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
              >
                <FiX />
              </button>
            </div>
          </div>

          {/* User Profile Card */}
          <div className="p-4 border-b">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                {deliveryPerson?.profilePhoto ? (
                  <img 
                    src={getImageUrl(deliveryPerson.profilePhoto)} 
                    alt={deliveryPerson.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <FiUser className="text-xl text-gray-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{deliveryPerson?.name}</p>
                <p className="text-sm text-gray-500 truncate">{deliveryPerson?.phone}</p>
              </div>
            </div>
            
            {/* Availability Toggle */}
            <button
              onClick={toggleAvailability}
              disabled={toggling}
              className={`w-full mt-3 py-2 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
                deliveryPerson?.isAvailable 
                  ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {deliveryPerson?.isAvailable ? (
                <>
                  <FiToggleRight /> Available
                </>
              ) : (
                <>
                  <FiToggleLeft /> Offline
                </>
              )}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <ul className="space-y-1">
              {navLinks.map(link => (
                <li key={link.path}>
                  <NavLink
                    to={link.path}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) => `
                      flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                      ${isActive 
                        ? 'bg-green-100 text-green-700 font-medium' 
                        : 'text-gray-600 hover:bg-gray-100'
                      }
                    `}
                  >
                    <link.icon />
                    <span>{link.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          {/* Earnings Summary */}
          <div className="p-4 border-t">
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 text-white">
              <p className="text-sm opacity-80">Pending Earnings</p>
              <p className="text-2xl font-bold">₹{deliveryPerson?.pendingAmount?.toLocaleString() || 0}</p>
            </div>
          </div>

          {/* Logout */}
          <div className="p-4 border-t">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <FiLogOut /> Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-72 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}
