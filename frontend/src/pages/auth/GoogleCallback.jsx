import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../store';
import toast from 'react-hot-toast';
import { authAPI } from '../../api';

export default function GoogleCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuthStore();

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get('token');
      const error = searchParams.get('error');

      if (error) {
        toast.error('Google login failed. Please try again.');
        navigate('/login');
        return;
      }

      if (token) {
        try {
          // Store token
          localStorage.setItem('token', token);
          
          // Fetch user data
          const res = await authAPI.getMe();
          const user = res.data.data;
          
          // Store user and set auth state
          login(user, token);
          
          toast.success(`Welcome, ${user.ownerName}!`);
          
          // Redirect based on role
          if (user.role === 'ADMIN') {
            navigate('/admin/dashboard');
          } else {
            navigate('/');
          }
        } catch (error) {
          console.error('Error fetching user:', error);
          toast.error('Failed to complete login');
          localStorage.removeItem('token');
          navigate('/login');
        }
      } else {
        toast.error('No authentication token received');
        navigate('/login');
      }
    };

    handleCallback();
  }, [searchParams, navigate, login]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing Google sign-in...</p>
      </div>
    </div>
  );
}
