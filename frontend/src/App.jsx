import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store';

// Layouts
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';

// Public Pages
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import GoogleCallback from './pages/auth/GoogleCallback';

// Protected Customer Pages
import Cart from './pages/Cart';
import Orders from './pages/Orders';
import Invoices from './pages/Invoices';
import Profile from './pages/Profile';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminProducts from './pages/admin/Products';
import ProductForm from './pages/admin/ProductForm';
import AdminOrders from './pages/admin/Orders';
import AdminUsers from './pages/admin/Users';
import AdminInvoices from './pages/admin/Invoices';
import AdminPayments from './pages/admin/Payments';
import AdminReports from './pages/admin/Reports';
import KYCManagement from './pages/admin/KYCManagement';

// KYC Page
import KYCForm from './pages/KYCForm';

// Protected Route Component
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

// KYC Protected Route - requires completed KYC for orders/cart
function KYCProtectedRoute({ children }) {
  const { isAuthenticated, user } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Admin users don't need KYC
  if (user?.role === 'ADMIN') {
    return children;
  }
  
  // Check if KYC is complete (approved)
  if (!user?.kyc?.isComplete || user?.kyc?.status !== 'APPROVED') {
    return <Navigate to="/kyc" replace />;
  }
  
  return children;
}

// Admin Route Component
function AdminRoute({ children }) {
  const { isAuthenticated, user } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (user?.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }
  
  return children;
}

// Guest Route Component (redirect if logged in)
function GuestRoute({ children }) {
  const { isAuthenticated } = useAuthStore();
  
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#333',
            color: '#fff',
          },
          success: {
            iconTheme: {
              primary: '#22c55e',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      
      <Routes>
        {/* Google OAuth Callback - must be outside Layout */}
        <Route path="/auth/google/callback" element={<GoogleCallback />} />
        
        {/* Public Routes with Layout */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="products" element={<Products />} />
          <Route path="products/:id" element={<ProductDetail />} />
          
          {/* Guest Only Routes */}
          <Route path="login" element={
            <GuestRoute>
              <Login />
            </GuestRoute>
          } />
          <Route path="register" element={
            <GuestRoute>
              <Register />
            </GuestRoute>
          } />
          
          {/* Protected Customer Routes */}
          <Route path="kyc" element={
            <ProtectedRoute>
              <KYCForm />
            </ProtectedRoute>
          } />
          <Route path="cart" element={
            <ProtectedRoute>
              <Cart />
            </ProtectedRoute>
          } />
          <Route path="orders" element={
            <KYCProtectedRoute>
              <Orders />
            </KYCProtectedRoute>
          } />
          <Route path="orders/:id" element={
            <ProtectedRoute>
              <Orders />
            </ProtectedRoute>
          } />
          <Route path="invoices" element={
            <KYCProtectedRoute>
              <Invoices />
            </KYCProtectedRoute>
          } />
          <Route path="invoices/:id" element={
            <KYCProtectedRoute>
              <Invoices />
            </KYCProtectedRoute>
          } />
          <Route path="profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }>
          <Route index element={<AdminDashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="products/new" element={<ProductForm />} />
          <Route path="products/:id" element={<ProductForm />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="orders/:id" element={<AdminOrders />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="users/:id" element={<AdminUsers />} />
          <Route path="invoices" element={<AdminInvoices />} />
          <Route path="invoices/:id" element={<AdminInvoices />} />
          <Route path="payments" element={<AdminPayments />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="kyc" element={<KYCManagement />} />
        </Route>

        {/* 404 Fallback */}
        <Route path="*" element={
          <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="text-center">
              <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
              <p className="text-xl text-gray-600 mb-6">Page not found</p>
              <a href="/" className="btn-primary">Go Home</a>
            </div>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App
