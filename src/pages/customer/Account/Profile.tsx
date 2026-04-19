import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import userService, { UpdateProfileData } from '../../../services/user.service';
import { 
  User, Mail, Phone, MapPin, Save, Loader, Camera, 
  Check, AlertCircle, Globe, ShoppingBag, Award, Calendar,
  ChevronRight, CreditCard, Key, LogOut, X, Home, Package as PackageIcon
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { showSuccess, showError, showLoading, dismissToast } from '../../../utils/toast';

const Profile = () => {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [success, setSuccess] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  
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

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      showError('Only JPEG, PNG, and WEBP images are allowed');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showError('File size must be less than 5MB');
      return;
    }

    const loadingToast = showLoading('Uploading profile picture...');
    
    try {
      const result = await userService.uploadProfilePicture(file);
      setAvatarPreview(result.profilePicture);
      showSuccess('Profile picture updated!');
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
    
    setPasswordLoading(true);
    
    try {
      await userService.changePassword(passwordData.currentPassword, passwordData.newPassword);
      showSuccess('Password changed successfully!');
      setShowChangePassword(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      showError(error.response?.data?.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const quickLinks = [
    { label: 'My Orders', icon: PackageIcon, path: '/account/orders', color: 'from-blue-500 to-blue-600' },
    { label: 'Payment Methods', icon: CreditCard, path: '/account/payment-methods', color: 'from-green-500 to-green-600' },
    { label: 'Address Book', icon: Home, path: '/account/addresses', color: 'from-purple-500 to-purple-600' },
    { label: 'Change Password', icon: Key, action: () => setShowChangePassword(true), color: 'from-amber-500 to-amber-600' },
  ];

  if (fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader className="w-8 h-8 animate-spin text-rose-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 md:py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your personal information</p>
        </div>

        <div className="space-y-6">
          {/* Profile Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Cover */}
            <div className="h-20 bg-gradient-to-r from-rose-500 to-amber-500"></div>
            
            <div className="px-6 pb-6">
              {/* Avatar */}
              <div className="relative -mt-10 flex justify-center">
                <div className="relative group">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-r from-rose-500 to-amber-500 p-0.5">
                    <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl font-bold text-gray-700">
                          {formData.fullName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={handleAvatarClick}
                    className="absolute bottom-0 right-0 p-1.5 bg-white rounded-full shadow-md border border-gray-200 hover:bg-gray-50 transition"
                  >
                    <Camera className="w-3.5 h-3.5 text-gray-600" />
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
              <div className="text-center mt-3">
                <h2 className="text-lg font-bold text-gray-900">
                  {formData.fullName || user?.email?.split('@')[0] || 'Your Name'}
                </h2>
                <p className="text-sm text-gray-500">{user?.email}</p>
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-green-50 rounded-full mt-2">
                  <Check className="w-3 h-3 text-green-600" />
                  <span className="text-xs text-green-600 font-medium">Verified</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {quickLinks.map((link, index) => (
              link.path ? (
                <Link
                  key={index}
                  to={link.path}
                  className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition group"
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${link.color} flex items-center justify-center mb-3`}>
                    <link.icon className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                    {link.label}
                  </p>
                  <ChevronRight className="w-4 h-4 text-gray-400 mt-1 group-hover:translate-x-1 transition" />
                </Link>
              ) : (
                <button
                  key={index}
                  onClick={link.action}
                  className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition group text-left"
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${link.color} flex items-center justify-center mb-3`}>
                    <link.icon className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                    {link.label}
                  </p>
                  <ChevronRight className="w-4 h-4 text-gray-400 mt-1 group-hover:translate-x-1 transition" />
                </button>
              )
            ))}
          </div>

          {/* Edit Profile Form */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-5 flex items-center gap-2">
              <User className="w-5 h-5 text-rose-500" />
              Personal Information
            </h3>

            {success && (
              <div className="mb-5 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2 animate-in fade-in">
                <Check className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-700">Profile updated successfully!</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      value={formData.fullName || ''}
                      onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                      className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent transition"
                      placeholder="Your full name"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 text-gray-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="tel"
                      value={formData.phoneNumber || ''}
                      onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                      className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent transition"
                      placeholder="+63 XXX XXX XXXX"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-5">
                <h3 className="text-base font-semibold text-gray-900 mb-5 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-rose-500" />
                  Shipping Address
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Street Address</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        value={formData.address || ''}
                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                        className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent transition"
                        placeholder="House/Unit No., Street"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">City</label>
                    <input
                      type="text"
                      value={formData.city || ''}
                      onChange={(e) => setFormData({...formData, city: e.target.value})}
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent transition"
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Province</label>
                    <input
                      type="text"
                      value={formData.state || ''}
                      onChange={(e) => setFormData({...formData, state: e.target.value})}
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent transition"
                      placeholder="Province"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">ZIP Code</label>
                    <input
                      type="text"
                      value={formData.zipCode || ''}
                      onChange={(e) => setFormData({...formData, zipCode: e.target.value})}
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent transition"
                      placeholder="ZIP Code"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Country</label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        value={formData.country || 'Philippines'}
                        onChange={(e) => setFormData({...formData, country: e.target.value})}
                        className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent transition"
                        placeholder="Philippines"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-rose-600 to-rose-700 text-white rounded-xl text-sm font-medium hover:from-rose-700 hover:to-rose-800 transition shadow-md shadow-rose-200 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-2 px-6 py-2.5 border border-red-200 text-red-600 rounded-xl text-sm font-medium hover:bg-red-50 transition"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {showChangePassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-bold text-gray-900">Change Password</h2>
              <button
                onClick={() => setShowChangePassword(false)}
                className="p-1.5 hover:bg-gray-100 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  New Password
                </label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500"
                  required
                />
              </div>
              
              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowChangePassword(false)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="flex-1 py-2.5 bg-rose-600 text-white rounded-xl text-sm font-medium hover:bg-rose-700 transition disabled:opacity-50"
                >
                  {passwordLoading ? (
                    <Loader className="w-4 h-4 animate-spin mx-auto" />
                  ) : (
                    'Change Password'
                  )}
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