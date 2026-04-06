import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import userService, { UpdateProfileData, UserProfile } from '../../../services/user.service';
import { 
  User, Mail, Phone, MapPin, Save, Loader, Camera, 
  Check, AlertCircle, Edit2, Globe, Calendar, Award,
  ShoppingBag, Heart, Package, Clock, TrendingUp,
  ChevronRight, CreditCard, Shield, Bell, Moon, Sun,
  Lock, Key, LogOut, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { showSuccess, showError, showLoading, dismissToast } from '../../../utils/toast';

const Profile = () => {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [success, setSuccess] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [formData, setFormData] = useState<UpdateProfileData>({
    fullName: '',
    phoneNumber: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'Philippines'
  });

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    setFetching(true);
    try {
      const profile = await userService.getCurrentUserProfile();
      if (profile) {
        setFormData({
          fullName: profile.fullName || '',
          phoneNumber: profile.phoneNumber || '',
          address: profile.address || '',
          city: profile.city || '',
          state: profile.state || '',
          zipCode: profile.zipCode || '',
          country: profile.country || 'Philippines'
        });
        
        if (profile.profilePicture) {
          setAvatarPreview(profile.profilePicture);
        }
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
      showError('Failed to load profile');
    } finally {
      setFetching(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      showError('Only JPEG, PNG, and WEBP images are allowed');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      showError('File size must be less than 5MB');
      return;
    }

    const loadingToast = showLoading('Uploading profile picture...');
    
    try {
      const result = await userService.uploadProfilePicture(file);
      setAvatarPreview(result.profilePicture);
      showSuccess('Profile picture updated successfully!');
      await refreshUser();
    } catch (error: any) {
      showError(error.response?.data?.message || 'Failed to upload profile picture');
    } finally {
      dismissToast(loadingToast);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const loadingToast = showLoading('Saving changes...');
    
    try {
      await userService.updateProfile(formData);
      setSuccess(true);
      showSuccess('Profile updated successfully!');
      await refreshUser();
      setTimeout(() => setSuccess(false), 3000);
    } catch (error: any) {
      showError(error.response?.data?.message || 'Failed to update profile');
    } finally {
      dismissToast(loadingToast);
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showError('New passwords do not match');
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      showError('Password must be at least 6 characters');
      return;
    }
    
    const loadingToast = showLoading('Changing password...');
    
    try {
      await userService.changePassword(passwordData.currentPassword, passwordData.newPassword);
      showSuccess('Password changed successfully!');
      setShowChangePassword(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      showError(error.response?.data?.message || 'Failed to change password');
    } finally {
      dismissToast(loadingToast);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const stats = [
    { label: 'Total Orders', value: '12', icon: ShoppingBag, color: 'bg-blue-500' },
    { label: 'Reviews', value: '24', icon: Award, color: 'bg-amber-500' },
    { label: 'Member Since', value: user?.createdAt ? new Date(user.createdAt).getFullYear().toString() : '2024', icon: Calendar, color: 'bg-green-500' },
  ];

  const recentActivity = [
    { action: 'Order #1234 delivered', date: '2 days ago', status: 'completed' },
    { action: 'Reviewed Wooden Table', date: '1 week ago', status: 'review' },
  ];

  if (fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-rose-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            My Profile
          </h1>
          <p className="text-gray-500 mt-1">Manage your account information and preferences</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-4">
              {/* Cover Image */}
              <div className="h-24 bg-gradient-to-r from-rose-500 to-amber-500"></div>
              
              {/* Avatar Section */}
              <div className="relative px-6 pb-6">
                <div className="relative -mt-12 flex justify-center">
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-r from-rose-500 to-amber-500 p-1">
                      <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                        {avatarPreview ? (
                          <img src={avatarPreview} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-3xl font-bold text-gray-700">
                            {formData.fullName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={handleAvatarClick}
                      className="absolute bottom-0 right-0 p-1.5 bg-white rounded-full shadow-lg border border-gray-200 hover:bg-gray-50 transition"
                    >
                      <Camera className="w-4 h-4 text-gray-600" />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/jpg,image/webp"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* User Info */}
                <div className="text-center mt-4">
                  <h2 className="text-xl font-bold text-gray-900">
                    {formData.fullName || user?.email?.split('@')[0] || 'Your Name'}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">{user?.email}</p>
                  <div className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 rounded-full mt-3">
                    <Check className="w-3 h-3 text-green-600" />
                    <span className="text-xs text-green-600 font-medium">Verified Account</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 mt-6 pt-6 border-t">
                  {stats.map((stat, index) => (
                    <div key={index} className="text-center">
                      <div className={`w-8 h-8 ${stat.color} bg-opacity-10 rounded-lg flex items-center justify-center mx-auto mb-2`}>
                        <stat.icon className={`w-4 h-4 ${stat.color.replace('bg-', 'text-')}`} />
                      </div>
                      <p className="text-lg font-bold text-gray-900">{stat.value}</p>
                      <p className="text-xs text-gray-500">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="border-t p-4 space-y-2">
                <button 
                  onClick={() => setShowChangePassword(true)}
                  className="w-full flex items-center justify-between px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition"
                >
                  <div className="flex items-center gap-3">
                    <Key className="w-4 h-4" />
                    <span className="text-sm">Change Password</span>
                  </div>
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button className="w-full flex items-center justify-between px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-4 h-4" />
                    <span className="text-sm">Payment Methods</span>
                  </div>
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center justify-between px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                >
                  <div className="flex items-center gap-3">
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm">Sign Out</span>
                  </div>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Edit Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              {/* Success Message */}
              {success && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2">
                  <Check className="w-5 h-5 text-green-600" />
                  <span className="text-green-700">Profile updated successfully!</span>
                </div>
              )}

              {/* Profile Information Section */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-rose-500" />
                  Profile Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        value={formData.fullName || ''}
                        onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent transition"
                        placeholder="Enter your full name"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="email"
                        value={user?.email || ''}
                        disabled
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="tel"
                        value={formData.phoneNumber || ''}
                        onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent transition"
                        placeholder="+63 XXX XXX XXXX"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Address Section */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-rose-500" />
                  Shipping Address
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        value={formData.address || ''}
                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent transition"
                        placeholder="123 Main St"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                    <input
                      type="text"
                      value={formData.city || ''}
                      onChange={(e) => setFormData({...formData, city: e.target.value})}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent transition"
                      placeholder="Manila"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">State/Province</label>
                    <input
                      type="text"
                      value={formData.state || ''}
                      onChange={(e) => setFormData({...formData, state: e.target.value})}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent transition"
                      placeholder="Metro Manila"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code</label>
                    <input
                      type="text"
                      value={formData.zipCode || ''}
                      onChange={(e) => setFormData({...formData, zipCode: e.target.value})}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent transition"
                      placeholder="1000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        value={formData.country || 'Philippines'}
                        onChange={(e) => setFormData({...formData, country: e.target.value})}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent transition"
                        placeholder="Philippines"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-rose-500" />
                  Recent Activity
                </h3>
                <div className="space-y-3">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                        <span className="text-sm text-gray-700">{activity.action}</span>
                      </div>
                      <span className="text-xs text-gray-400">{activity.date}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preferences */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-rose-500" />
                  Preferences
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border border-gray-100 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Moon className="w-5 h-5 text-gray-500" />
                      <span className="text-sm text-gray-700">Dark Mode</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDarkMode(!darkMode)}
                      className={`w-10 h-5 rounded-full transition ${darkMode ? 'bg-rose-500' : 'bg-gray-300'}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white transition transform ${darkMode ? 'translate-x-5' : 'translate-x-0.5'} mt-0.5`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-3 border border-gray-100 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-gray-500" />
                      <span className="text-sm text-gray-700">Email Notifications</span>
                    </div>
                    <button
                      type="button"
                      className="w-10 h-5 rounded-full bg-rose-500 transition"
                    >
                      <div className="w-4 h-4 rounded-full bg-white transition transform translate-x-5 mt-0.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-6 border-t flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-rose-600 to-rose-700 text-white rounded-xl font-medium hover:from-rose-700 hover:to-rose-800 transition-all transform hover:-translate-y-0.5 shadow-lg shadow-rose-200 disabled:opacity-50 disabled:transform-none"
                >
                  {loading ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Saving Changes...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {showChangePassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Change Password</h2>
              <button
                onClick={() => setShowChangePassword(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500"
                  required
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-rose-600 text-white py-2 rounded-lg hover:bg-rose-700 transition"
                >
                  Change Password
                </button>
                <button
                  type="button"
                  onClick={() => setShowChangePassword(false)}
                  className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;