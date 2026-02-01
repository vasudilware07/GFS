import { Link, useNavigate } from 'react-router-dom';
import { FiShoppingCart, FiUser, FiLogOut, FiMenu, FiSearch, FiPackage } from 'react-icons/fi';
import { useState } from 'react';
import { useAuthStore, useCartStore } from '../store';

export default function Header() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const { user, isAuthenticated, logout, isAdmin } = useAuthStore();
  const { getItemCount } = useCartStore();
  const navigate = useNavigate();
  const cartCount = getItemCount();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${searchQuery}`);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-green-700 text-white sticky top-0 z-50 shadow-lg">
      {/* Top Bar */}
      <div className="bg-green-800 py-1 px-4 text-xs hidden md:block"> 
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <span>🍎 Rajpur's #1 Wholesale Fruit Supplier | Dilware Group of Company </span>
          <span>📞 +91 9302588486 | ✉️ vasudevdilware04@gmail.com</span>
        </div>
      </div>

      {/* Main Header */}
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 flex-shrink-0">
            <div className="bg-white rounded-lg p-1.5 shadow-md">
              <img src="/logo/logo.png" alt="Ganesh Fruit Suppliers" className="h-12 w-12 object-contain" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-2xl font-bold leading-tight tracking-tight">Ganesh Fruit</h1>
              <p className="text-sm text-green-200 font-medium">Suppliers</p>
            </div>
          </Link>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex-1 max-w-2xl hidden md:block">
            <div className="relative">
              <input
                type="text"
                placeholder="Search for fresh fruits, seasonal fruits..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full py-2 px-4 pr-12 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
              <button
                type="submit"
                className="absolute right-0 top-0 h-full px-4 bg-orange-500 hover:bg-orange-600 rounded-r-lg transition-colors"
              >
                <FiSearch className="w-5 h-5" />
              </button>
            </div>
          </form>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            {isAuthenticated ? (
              <>
                {/* User Menu */}
                <div className="relative group">
                  <button className="flex items-center gap-2 hover:bg-green-600 px-3 py-2 rounded-lg transition-colors">
                    <FiUser className="w-5 h-5" />
                    <span className="hidden sm:block text-sm">
                      Hello, {user?.ownerName?.split(' ')[0] || 'User'}
                    </span>
                  </button>
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white text-gray-800 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="p-3 border-b">
                      <p className="font-semibold">{user?.ownerName}</p>
                      <p className="text-xs text-gray-500">{user?.shopName}</p>
                    </div>
                    {isAdmin() ? (
                      <Link to="/admin" className="block px-4 py-2 hover:bg-gray-100">
                        🎛️ Admin Dashboard
                      </Link>
                    ) : (
                      <>
                        <Link to="/orders" className="block px-4 py-2 hover:bg-gray-100">
                          📦 My Orders
                        </Link>
                        <Link to="/invoices" className="block px-4 py-2 hover:bg-gray-100">
                          🧾 My Invoices
                        </Link>
                      </>
                    )}
                    <Link to="/profile" className="block px-4 py-2 hover:bg-gray-100">
                      👤 Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 rounded-b-lg"
                    >
                      <FiLogOut className="inline mr-2" /> Logout
                    </button>
                  </div>
                </div>

                {/* Cart (only for customers) */}
                {!isAdmin() && (
                  <Link
                    to="/cart"
                    className="relative flex items-center gap-1 hover:bg-green-600 px-3 py-2 rounded-lg transition-colors"
                  >
                    <FiShoppingCart className="w-5 h-5" />
                    <span className="hidden sm:block text-sm">Cart</span>
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                        {cartCount}
                      </span>
                    )}
                  </Link>
                )}
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hover:bg-green-600 px-4 py-2 rounded-lg transition-colors text-sm"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded-lg transition-colors text-sm"
                >
                  Register
                </Link>
              </>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 hover:bg-green-600 rounded-lg"
            >
              <FiMenu className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Mobile Search */}
        <form onSubmit={handleSearch} className="mt-3 md:hidden">
          <div className="relative">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full py-2 px-4 pr-12 rounded-lg text-gray-900"
            />
            <button
              type="submit"
              className="absolute right-0 top-0 h-full px-4 bg-orange-500 rounded-r-lg"
            >
              <FiSearch className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>

      {/* Categories Bar */}
      <div className="bg-green-600 hidden md:block">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex items-center gap-6 py-2 text-sm">
            <Link to="/products" className="hover:text-orange-300 transition-colors">All Products</Link>
            <Link to="/products?category=FRUITS" className="hover:text-orange-300 transition-colors">🍎 Fresh Fruits</Link>
            <Link to="/products?category=SEASONAL" className="hover:text-orange-300 transition-colors">🥭 Seasonal</Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
