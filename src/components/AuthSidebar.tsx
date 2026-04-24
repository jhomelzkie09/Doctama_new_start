import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, Eye, EyeOff, CheckCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ForgotPasswordModal from './ForgotPasswordModal';
import logo from '../assets/logo.png';

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
            className="fixed top-0 right-0 h-full w-full md:w-[420px] bg-white shadow-2xl z-50 flex flex-col"
          >
            <div className="px-6 py-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-b from-white to-slate-50/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white border border-slate-200/70 shadow-sm flex items-center justify-center overflow-hidden">
                  <img src={logo} alt="Doctama's Marketing" className="w-8 h-8 object-contain" />
                </div>
                <div className="leading-tight">
                  <p className="text-[11px] font-bold tracking-[0.22em] text-rose-700 uppercase">
                    Doctama&apos;s Marketing
                  </p>
                  <h2 className="text-lg font-black text-slate-900">
                    {mode === 'login' ? 'Welcome back' : 'Create your account'}
                  </h2>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              <div className="relative flex p-1 bg-slate-100 rounded-lg">
                <motion.div
                  className="absolute inset-y-1 bg-white rounded-md shadow-sm w-[calc(50%-4px)]"
                  animate={{ x: mode === 'login' ? 0 : '100%' }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
                <button
                  onClick={() => handleModeChange('login')}
                  className={`relative z-10 flex-1 py-2 text-sm font-bold transition-colors ${mode === 'login' ? 'text-rose-700' : 'text-slate-500'}`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => handleModeChange('register')}
                  className={`relative z-10 flex-1 py-2 text-sm font-bold transition-colors ${mode === 'register' ? 'text-rose-700' : 'text-slate-500'}`}
                >
                  Register
                </button>
              </div>

              <AnimatePresence mode="wait">
                {success && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-emerald-50 border border-emerald-100 rounded-lg flex items-start gap-3"
                  >
                    <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                    <p className="text-sm text-emerald-700 leading-snug">{success}</p>
                  </motion.div>
                )}
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-rose-50 border border-rose-100 rounded-lg"
                  >
                    <p className="text-sm text-rose-700 font-medium">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'register' && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Full Name</label>
                    <div className="relative group">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-rose-700 transition-colors" size={18} />
                      <input
                        type="text"
                        required
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-4 focus:ring-rose-500/10 focus:border-rose-600 outline-none transition-all text-sm"
                        placeholder="John Doe"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Email Address</label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-rose-700 transition-colors" size={18} />
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-4 focus:ring-rose-500/10 focus:border-rose-600 outline-none transition-all text-sm"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between px-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Password</label>
                    {mode === 'login' && (
                      <button 
                        type="button" 
                        onClick={() => setShowForgotPassword(true)}
                        className="text-xs font-bold text-rose-700 hover:text-rose-800 transition"
                      >
                        Forgot?
                      </button>
                    )}
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-rose-700 transition-colors" size={18} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-4 focus:ring-rose-500/10 focus:border-rose-600 outline-none transition-all text-sm"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
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
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Confirm Password</label>
                    <div className="relative group">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-rose-700 transition-colors" size={18} />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        className={`w-full pl-10 pr-10 py-3 border rounded-lg outline-none transition-all text-sm ${
                          formData.confirmPassword && formData.password !== formData.confirmPassword
                            ? 'border-rose-300 bg-rose-50'
                            : 'bg-slate-50 border-slate-200 focus:bg-white focus:ring-4 focus:ring-rose-500/10 focus:border-rose-600'
                        }`}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
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
                  className="w-full py-3.5 bg-rose-700 text-white rounded-lg shadow-lg shadow-rose-700/20 hover:bg-rose-800 transition-all font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2 group"
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
                      <div key={item} className="flex items-center space-x-3 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
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
