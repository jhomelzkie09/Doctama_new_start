import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, Eye, EyeOff, LogIn, UserPlus, CheckCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ForgotPasswordModal from './ForgotPasswordModal';

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
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    confirmPassword: ''
  });

  const { login, register } = useAuth();

  const getPasswordStrength = (password: string): { score: number; label: string; color: string } => {
    if (!password) return { score: 0, label: '', color: 'bg-gray-200' };
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    const labels = ['Weak', 'Fair', 'Good', 'Strong'];
    const colors = ['bg-red-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];
    return {
      score,
      label: labels[score] || '',
      color: colors[score] || 'bg-gray-200'
    };
  };

  const handleModeChange = (newMode: 'login' | 'register') => {
    setMode(newMode);
    onModeChange(newMode);
    setError('');
    setSuccess('');
  };

  const validateForm = (): boolean => {
    if (mode === 'register') {
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return false;
      }
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters');
        return false;
      }
      if (!formData.fullName.trim()) {
        setError('Full name is required');
        return false;
      }
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!formData.password.trim()) {
      setError('Password is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!validateForm()) return;
    setLoading(true);

    try {
      if (mode === 'login') {        
        await login(formData.email, formData.password);
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          onClose();
          if (user.roles?.includes('Admin')) {
            window.location.href = '/admin';
          } else {
            window.location.href = '/';
          }
        }
      } else {
        await register({
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName
        });
        setSuccess('Account created successfully! You can now sign in.');
        setFormData({ email: '', password: '', fullName: '', confirmPassword: '' });
        setTimeout(() => { handleModeChange('login'); }, 2000);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 transition-all"
            onClick={onClose}
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full md:w-[400px] bg-white shadow-2xl z-50 flex flex-col"
          >
            <div className="px-6 py-6 border-b border-gray-50 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
                  {mode === 'login' ? <LogIn size={22} /> : <UserPlus size={22} />}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 leading-tight">
                    {mode === 'login' ? 'Sign In' : 'Join Us'}
                  </h2>
                  <p className="text-xs text-gray-500 font-medium">To continue to your account</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              <div className="relative flex p-1 bg-gray-100 rounded-xl">
                <motion.div
                  className="absolute inset-y-1 bg-white rounded-lg shadow-sm w-[calc(50%-4px)]"
                  animate={{ x: mode === 'login' ? 0 : '100%' }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
                <button
                  onClick={() => handleModeChange('login')}
                  className={`relative z-10 flex-1 py-2 text-sm font-bold transition-colors ${mode === 'login' ? 'text-red-600' : 'text-gray-500'}`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => handleModeChange('register')}
                  className={`relative z-10 flex-1 py-2 text-sm font-bold transition-colors ${mode === 'register' ? 'text-red-600' : 'text-gray-500'}`}
                >
                  Register
                </button>
              </div>

              <AnimatePresence mode="wait">
                {success && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start gap-3"
                  >
                    <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                    <p className="text-sm text-emerald-700 leading-snug">{success}</p>
                  </motion.div>
                )}
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-red-50 border border-red-100 rounded-xl"
                  >
                    <p className="text-sm text-red-600 font-medium">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'register' && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Full Name</label>
                    <div className="relative group">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-red-500 transition-colors" size={18} />
                      <input
                        type="text"
                        required
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all text-sm"
                        placeholder="John Doe"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Email Address</label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-red-500 transition-colors" size={18} />
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all text-sm"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between px-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Password</label>
                    {mode === 'login' && (
                      <button 
                        type="button" 
                        onClick={() => setShowForgotPassword(true)}
                        className="text-xs font-bold text-red-600 hover:text-red-700 transition"
                      >
                        Forgot?
                      </button>
                    )}
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-red-500 transition-colors" size={18} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all text-sm"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  {mode === 'register' && formData.password && (
                    <div className="pt-1 px-1">
                      <div className="flex space-x-1 mb-1">
                        {[0, 1, 2, 3].map((index) => (
                          <div key={index} className={`h-1 flex-1 rounded-full ${index < passwordStrength.score ? passwordStrength.color : 'bg-gray-100'}`} />
                        ))}
                      </div>
                      <p className={`text-[10px] font-bold uppercase ${passwordStrength.color.replace('bg-', 'text-')}`}>
                        {passwordStrength.label} Password
                      </p>
                    </div>
                  )}
                </div>

                {mode === 'register' && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Confirm Password</label>
                    <div className="relative group">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-red-500 transition-colors" size={18} />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        className={`w-full pl-10 pr-10 py-3 border rounded-xl outline-none transition-all text-sm ${
                          formData.confirmPassword && formData.password !== formData.confirmPassword
                            ? 'border-red-300 bg-red-50'
                            : 'bg-gray-50 border-gray-200 focus:bg-white focus:ring-4 focus:ring-red-500/10 focus:border-red-500'
                        }`}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                )}

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-red-600 text-white rounded-xl shadow-lg shadow-red-600/20 hover:bg-red-700 transition-all font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2 group"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>{mode === 'login' ? 'Sign In' : 'Create Account'}</span>
                      <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </motion.button>
              </form>

              {mode === 'register' && (
                <div className="pt-6 border-t border-gray-50">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4 text-center">Exclusive Perks</p>
                  <div className="grid grid-cols-1 gap-3">
                    {['Track your orders', 'Faster checkout', 'Save your favorites'].map((item) => (
                      <div key={item} className="flex items-center space-x-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">
                        <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                          <CheckCircle className="w-3 h-3 text-green-600" />
                        </div>
                        <span className="font-medium">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Forgot Password Modal */}
          <ForgotPasswordModal
            isOpen={showForgotPassword}
            onClose={() => setShowForgotPassword(false)}
            onSwitchToLogin={() => {
              setShowForgotPassword(false);
              setMode('login');
            }}
          />
        </>
      )}
    </AnimatePresence>
  );
};

export default AuthSidebar;