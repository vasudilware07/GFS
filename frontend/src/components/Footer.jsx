import { Link } from 'react-router-dom';
import { FiPhone, FiMail, FiMapPin, FiFacebook, FiInstagram, FiTwitter } from 'react-icons/fi';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-white rounded-lg p-1.5 shadow-md">
                <img src="/logo/lbr-logo.svg" alt="LBR Fruit Suppliers" className="h-14 w-14 object-contain" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">LBR Fruit</h3>
                <p className="text-sm text-green-400 font-medium">Suppliers</p>
              </div>
            </div>
            <p className="text-sm mb-4">
              Rajpur's leading wholesale fruit supplier. Fresh quality fruits delivered to your doorstep at wholesale prices.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-green-600 transition-colors">
                <FiFacebook />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-green-600 transition-colors">
                <FiInstagram />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-green-600 transition-colors">
                <FiTwitter />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/products" className="hover:text-green-400 transition-colors">All Products</Link></li>
              <li><Link to="/products?category=FRUITS" className="hover:text-green-400 transition-colors">Fresh Fruits</Link></li>
              <li><Link to="/products?category=EXOTIC" className="hover:text-green-400 transition-colors">Exotic Fruits</Link></li>
              <li><Link to="/products?category=DRY_FRUITS" className="hover:text-green-400 transition-colors">Dry Fruits</Link></li>
              <li><Link to="/about" className="hover:text-green-400 transition-colors">About Us</Link></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="text-white font-semibold mb-4">Customer Service</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/orders" className="hover:text-green-400 transition-colors">Track Orders</Link></li>
              <li><Link to="/invoices" className="hover:text-green-400 transition-colors">View Invoices</Link></li>
              <li><Link to="/profile" className="hover:text-green-400 transition-colors">My Account</Link></li>
              <li><a href="#" className="hover:text-green-400 transition-colors">Shipping Info</a></li>
              <li><a href="#" className="hover:text-green-400 transition-colors">Terms & Conditions</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-white font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <FiMapPin className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <span>20, Kahar Mohalla, Rajpur, Barwani, M.P, 451447</span>
              </li>
              <li className="flex items-center gap-3">
                <FiPhone className="w-5 h-5 text-green-400" />
                <span>+91 9302588486</span>
              </li>
              <li className="flex items-center gap-3">
                <FiMail className="w-5 h-5 text-green-400" />
                <span>vasudevdilware04@gmail.com</span>
              </li>
            </ul>
            <div className="mt-4 p-3 bg-gray-800 rounded-lg">
              <p className="text-xs text-gray-400">Business Hours</p>
              <p className="text-sm">Mon - Sat: 6:00 AM - 8:00 PM</p>
              <p className="text-sm">Sunday: 6:00 AM - 2:00 PM</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
            <p>© 2026 LBR Fruit Suppliers. All rights reserved.</p>
            <p>Made with ❤️ By VASUDEV SUBHASH DILWARE</p>
            <div className="flex items-center gap-4">
              <span className="text-gray-500">We Accept:</span>
              <span className="bg-gray-800 px-3 py-1 rounded">💳 UPI</span>
              <span className="bg-gray-800 px-3 py-1 rounded">🏦 Bank Transfer</span>
              <span className="bg-gray-800 px-3 py-1 rounded">💵 Cash</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
