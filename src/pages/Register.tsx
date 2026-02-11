import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState('');

  const { register } = useAuth();
  const navigate = useNavigate();

  const checkPasswordStrength = (password: string) => {
    if (password.length < 6) return 'Weak';
    if (password.length < 8) return 'Fair';
    if (/[A-Z]/.test(password) && /[0-9]/.test(password)) {
      return 'Strong';
    }
    return 'Good';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (name === 'password') {
      setPasswordStrength(checkPasswordStrength(value));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    console.log("📤 Registration attempt:", formData);

    setLoading(true);

    try {
      await register(formData.email, formData.password, formData.fullName);
      console.log("✅ Registration successful");
      navigate('/');
    } catch (err: any) {
      console.error("❌ Registration error details:", {
      message: err.message,
      response: err.response?.data,
      status: err.response?.status
    });
      setError(err.response?.data?.message || 'Failed to register. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const passwordStrengthColor = () => {
    switch (passwordStrength) {
      case 'Weak': return 'bg-red-500';
      case 'Fair': return 'bg-yellow-500';
      case 'Good': return 'bg-green-500';
      case 'Strong': return 'bg-blue-500';
      default: return 'bg-gray-300';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <span className="text-2xl">👤</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Create Account</h1>
          <p className="text-gray-600 mt-2">Join Doctama today</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="fullName" className="block text-gray-700 text-sm font-medium mb-2">
              Full Name
            </label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="John Doe"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-gray-700 text-sm font-medium mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="you@example.com"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-gray-700 text-sm font-medium mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="••••••••"
              required
              disabled={loading}
            />
            
            {formData.password && (
              <div className="mt-3">
                <div className="flex justify-between items-center mb-1">
                  <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${passwordStrengthColor()}`}
                      style={{
                        width: passwordStrength === 'Weak' ? '25%' : 
                               passwordStrength === 'Fair' ? '50%' : 
                               passwordStrength === 'Good' ? '75%' : '100%',
                      }}
                    ></div>
                  </div>
                </div>
                <div className="text-sm font-medium text-gray-600">
                  Password strength: <span className={
                    passwordStrength === 'Weak' ? 'text-red-600' :
                    passwordStrength === 'Fair' ? 'text-yellow-600' :
                    passwordStrength === 'Good' ? 'text-green-600' :
                    'text-blue-600'
                  }>{passwordStrength}</span>
                </div>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-gray-700 text-sm font-medium mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="••••••••"
              required
              disabled={loading}
            />
            
            {formData.confirmPassword && (
              <div className={`mt-2 text-sm font-medium ${
                formData.password === formData.confirmPassword ? 'text-green-600' : 'text-red-600'
              }`}>
                {formData.password === formData.confirmPassword ? '✅ Passwords match' : '❌ Passwords do not match'}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></span>
                Creating Account...
              </span>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
            Sign in here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;