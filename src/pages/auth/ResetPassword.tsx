// pages/auth/ResetPassword.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Lock, Loader, CheckCircle, AlertCircle, Eye, EyeOff, Shield } from 'lucide-react';
import api from '../../api/config';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);

  useEffect(() => {
    const emailParam = searchParams.get('email');
    const tokenParam = searchParams.get('token');
    
    if (!emailParam || !tokenParam) {
      setError('Invalid or missing reset link parameters.');
      setValidating(false);
    } else {
      setEmail(emailParam);
      setToken(tokenParam);
      validateToken(emailParam, tokenParam);
    }
  }, [searchParams]);

  const validateToken = async (email: string, token: string) => {
    try {
      const response = await api.get('/auth/validate-reset-token', {
        params: { email, token }
      });
      
      if (response.data.valid) {
        setTokenValid(true);
      } else {
        setError('The password reset link has expired or is invalid.');
      }
    } catch (err) {
      setError('Unable to validate reset link. Please request a new one.');
    } finally {
      setValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPassword || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await api.post('/auth/reset-password', {
        email,
        token,
        newPassword,
        confirmPassword
      });
      
      setSuccess(true);
      
      // Redirect to home after 3 seconds
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (password: string): { label: string; color: string } => {
    if (password.length === 0) return { label: '', color: '' };
    if (password.length < 6) return { label: 'Weak', color: 'text-red-500' };
    if (password.length < 8) return { label: 'Fair', color: 'text-yellow-500' };
    if (password.length < 10) return { label: 'Good', color: 'text-blue-500' };
    return { label: 'Strong', color: 'text-green-500' };
  };

  const passwordStrength = getPasswordStrength(newPassword);

  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader className="w-8 h-8 animate-spin text-rose-600" />
      </div>
    );
  }

  if (error && !tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Invalid Link</h2>
          <p className="text-gray-600 mb-6">{error || 'The password reset link is invalid or has expired.'}</p>
          <Link
            to="/"
            className="inline-block px-6 py-3 bg-rose-600 text-white rounded-xl font-medium hover:bg-rose-700 transition"
          >
            Back to Home
          </Link>
          <p className="mt-4 text-sm text-gray-500">
            Need help?{' '}
            <Link to="/contact" className="text-rose-600 hover:text-rose-700 font-medium">
              Contact Support
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-rose-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Create New Password</h2>
          <p className="text-gray-600 mt-2">Enter a new password for your account</p>
          <p className="text-sm text-gray-500 mt-1 bg-gray-100 px-3 py-1 rounded-full inline-block">
            {email}
          </p>
        </div>

        {success ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Password Reset Successful!</h3>
            <p className="text-sm text-gray-600 mb-6">
              Your password has been changed successfully. Redirecting to home...
            </p>
            <div className="flex justify-center">
              <Loader className="w-5 h-5 animate-spin text-rose-600" />
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {newPassword && (
                <p className={`text-xs mt-1 ${passwordStrength.color}`}>
                  Password strength: {passwordStrength.label}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent transition"
                />
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
              )}
            </div>

            {/* Password Requirements */}
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs font-medium text-gray-700 mb-2">Password must contain:</p>
              <ul className="text-xs text-gray-500 space-y-1">
                <li className={`flex items-center gap-1 ${newPassword.length >= 6 ? 'text-green-600' : ''}`}>
                  <div className={`w-1 h-1 rounded-full ${newPassword.length >= 6 ? 'bg-green-600' : 'bg-gray-400'}`} />
                  At least 6 characters
                </li>
                <li className="flex items-center gap-1">
                  <div className="w-1 h-1 rounded-full bg-gray-400" />
                  Mix of letters and numbers recommended
                </li>
              </ul>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-rose-600 text-white rounded-xl font-medium hover:bg-rose-700 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-rose-200"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Resetting...
                </>
              ) : (
                'Reset Password'
              )}
            </button>

            <p className="text-center text-sm text-gray-500">
              <Link to="/" className="text-rose-600 hover:text-rose-700 font-medium">
                Back to Home
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;