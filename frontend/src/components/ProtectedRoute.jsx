import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store';

// Protected Route - requires authentication
export function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

// Admin Route - requires admin role
export function AdminRoute({ children }) {
  const { isAuthenticated, isAdmin } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAdmin()) {
    return <Navigate to="/" replace />;
  }

  return children;
}

// Guest Route - only for non-authenticated users
export function GuestRoute({ children }) {
  const { isAuthenticated, isAdmin } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to={isAdmin() ? '/admin' : '/'} replace />;
  }

  return children;
}
