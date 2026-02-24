import React, { useState, useEffect } from 'react';
import { X, Mail, Lock, User, Eye, EyeOff, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface AuthSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode: 'login' | 'register';
  onModeChange: (mode: 'login' | 'register') => void;
}

const AuthSidebar: React.FC<AuthSidebarProps> = ({
  isOpen,
  onClose,
  initialMode,
  onModeChange
}) => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    confirmPassword: ''
  });

  const { login, register, user } = useAuth();

  // Effect to handle successful login and redirect
  useEffect(() => {
    if (user && !loading && isOpen) {
      console.log('✅ User authenticated, checking roles:', user.roles);
      
      // Small delay to ensure state is stable
      setTimeout(() => {
        // Close the sidebar
        onClose();
        
        // Check if user is admin and redirect accordingly
        if (user.roles?.includes('Admin')) {
          console.log('👑 Admin detected, redirecting to /admin');
          navigate('/admin', { replace: true });
        } else {
          console.log('👤 Regular user, staying on current page');
          // Stay on same page - no redirect needed
        }
      }, 100);
    }
  }, [user, loading, isOpen, onClose, navigate]);

  const handleModeChange = (newMode: 'login' | 'register') => {
    setMode(newMode);
    onModeChange(newMode);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        console.log('🔐 Attempting login with:', formData.email);
        await login(formData.email, formData.password);
        // Don't close immediately - let the useEffect handle it
      } else {
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }
        console.log('📝 Attempting registration for:', formData.email);
        await register({
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName
        });
        // Don't close immediately - let the useEffect handle it
      }
    } catch (err: any) {
      console.error('❌ Auth error:', err);
      setError(err.message || 'Authentication failed');
      setLoading(false);
    }
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-full md:w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="h-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {mode === 'login' ? (
              <LogIn className="w-6 h-6" />
            ) : (
              <UserPlus className="w-6 h-6" />
            )}
            <h2 className="text-xl font-semibold">
              {mode === 'login' ? 'Welcome Back!' : 'Create Account'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 h-[calc(100%-5rem)] overflow-y-auto">
          {/* Mode Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
            <button
              onClick={() => handleModeChange('login')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition ${
                mode === 'login'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => handleModeChange('register')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition ${
                mode === 'register'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Register
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="John Doe"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            )}

            {mode === 'login' && (
              <div className="flex justify-end">
                <button
                  type="button"
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Forgot Password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Processing...
                </div>
              ) : mode === 'login' ? (
                'Sign In'
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Benefits */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Why join us?</h3>
            <ul className="space-y-3">
              <li className="flex items-center text-sm text-gray-600">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-2" />
                Track your orders
              </li>
              <li className="flex items-center text-sm text-gray-600">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-2" />
                Faster checkout
              </li>
              <li className="flex items-center text-sm text-gray-600">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-2" />
                Save your favorites
              </li>
              <li className="flex items-center text-sm text-gray-600">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-2" />
                Exclusive offers
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
};

export default AuthSidebar;