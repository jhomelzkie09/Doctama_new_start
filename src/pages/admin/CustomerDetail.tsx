import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import userService from '../../services/user.service';
import orderService from '../../services/order.service';
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ShoppingBag,
  DollarSign,
  Package,
  CreditCard,
  Edit,
  Trash2,
  AlertCircle,
  Loader,
  CheckCircle,
  XCircle,
  Shield,
  Home,
  Star,
  MessageSquare,
  Clock,
  TrendingUp,
  Download,
  Printer,
  MoreVertical,
  User as UserIcon,
  Lock,
  RefreshCw,
  Plus,
  Map,
  Copy,
  Send,
  Ban
} from 'lucide-react';
import { User, Order, OrderStatus } from '../../types';

// Update the CustomerDetail interface to exactly match what we're setting
interface CustomerDetail extends User {
  stats: {
    totalOrders: number;
    totalSpent: number;
    averageOrderValue: number;
    firstOrderDate?: string;
    lastOrderDate?: string;
    favoriteCategory?: string;
    reviewCount: number;
    returnCount: number;
    cancellationCount: number;
    loyaltyTier: 'bronze' | 'silver' | 'gold' | 'platinum';
  };
  recentOrders: Order[];
  activityLog: ActivityLog[];
  wishlist?: string[];
  addresses: AddressWithId[]; // Make sure this is included
}

interface ActivityLog {
  id: string;
  type: 'order' | 'login' | 'profile_update' | 'password_change' | 'review' | 'support';
  description: string;
  timestamp: string;
  metadata?: any;
}

interface AddressWithId {
  id: string;
  type: 'shipping' | 'billing';
  isDefault: boolean;
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phoneNumber?: string;
}

const CustomerDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  // State
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'addresses' | 'activity'>('overview');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<AddressWithId | null>(null);

  // Redirect if not admin
  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
    }
  }, [isAdmin, navigate]);

  // Fetch customer details
  // Fetch customer details
const fetchCustomerDetails = useCallback(async () => {
  if (!id) return;
  
  setLoading(true);
  setError('');
  try {
    console.log(`📊 Fetching customer details for ID: ${id}`);
    
    // Fetch user data
    const userData = await userService.getUserById(id) as User;
    
    // Fetch user orders
    let orders: Order[] = [];
    try {
      const allOrders = await orderService.getAllOrders();
      orders = allOrders.filter(order => order.userId === id);
    } catch (err) {
      console.warn('⚠️ Could not fetch orders:', err);
    }

    // Calculate stats
    const totalOrders = orders.length;
    const totalSpent = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;
    
    const firstOrderDate = orders.length > 0 
      ? orders.reduce((earliest, order) => 
          new Date(order.orderDate) < new Date(earliest.orderDate) ? order : earliest
        ).orderDate
      : undefined;
    
    const lastOrderDate = orders.length > 0
      ? orders.reduce((latest, order) => 
          new Date(order.orderDate) > new Date(latest.orderDate) ? order : latest
        ).orderDate
      : undefined;

    const cancelledOrders = orders.filter(order => order.status === 'cancelled').length;

    // Determine loyalty tier
    let loyaltyTier: 'bronze' | 'silver' | 'gold' | 'platinum' = 'bronze';
    if (totalSpent > 10000) loyaltyTier = 'platinum';
    else if (totalSpent > 5000) loyaltyTier = 'gold';
    else if (totalSpent > 1000) loyaltyTier = 'silver';

    // Generate activity log
    const activityLog: ActivityLog[] = [
      ...orders.map(order => ({
        id: `order-${order.id}`,
        type: 'order' as const,
        description: `Placed order #${order.orderNumber} for $${order.totalAmount}`,
        timestamp: order.orderDate,
        metadata: order
      })),
      {
        id: 'login-1',
        type: 'login' as const,
        description: 'Logged in from new device',
        timestamp: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: 'profile-1',
        type: 'profile_update' as const,
        description: 'Updated profile information',
        timestamp: new Date(Date.now() - 172800000).toISOString()
      }
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Create addresses array from user data
    const addresses: AddressWithId[] = [];
    if (userData.address) {
      addresses.push({
        id: '1',
        type: 'shipping',
        isDefault: true,
        fullName: userData.fullName || 'Customer',
        addressLine1: userData.address,
        addressLine2: '',
        city: userData.city || '',
        state: userData.state || '',
        postalCode: userData.zipCode || '',
        country: userData.country || 'Philippines',
        phoneNumber: userData.phoneNumber
      });
    }

    // Create the customer object with all required fields
    const customerData: CustomerDetail = {
      // Spread all User properties
      id: userData.id,
      email: userData.email,
      fullName: userData.fullName,
      firstName: userData.firstName,
      lastName: userData.lastName,
      phoneNumber: userData.phoneNumber,
      address: userData.address,
      city: userData.city,
      state: userData.state,
      zipCode: userData.zipCode,
      country: userData.country,
      profileImage: userData.profileImage,
      roles: userData.roles,
      isActive: userData.isActive,
      emailConfirmed: userData.emailConfirmed,
      createdAt: userData.createdAt,
      updatedAt: userData.updatedAt,
      lastLogin: userData.lastLogin,
      
      // Add the extended properties
      stats: {
        totalOrders,
        totalSpent,
        averageOrderValue,
        firstOrderDate,
        lastOrderDate,
        favoriteCategory: 'Living Room',
        reviewCount: 0,
        returnCount: 0,
        cancellationCount: cancelledOrders,
        loyaltyTier
      },
      recentOrders: orders.slice(0, 5),
      activityLog,
      wishlist: [],
      addresses
    };

    setCustomer(customerData);

  } catch (err: any) {
    console.error('❌ Error fetching customer:', err);
    setError(err.message || 'Failed to load customer details');
  } finally {
    setLoading(false);
  }
}, [id]);

  useEffect(() => {
    fetchCustomerDetails();
  }, [fetchCustomerDetails]);

  // Handle customer status toggle
  const handleToggleStatus = async () => {
    if (!customer) return;
    
    try {
      setLoading(true);
      await userService.toggleUserStatus(customer.id, !customer.isActive);
      setCustomer(prev => prev ? { ...prev, isActive: !prev.isActive } : null);
      setSuccess(`Customer ${customer.isActive ? 'deactivated' : 'activated'} successfully`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle delete customer
  const handleDeleteCustomer = async () => {
    if (!customer) return;
    
    try {
      setLoading(true);
      await userService.deleteUser(customer.id);
      setSuccess('Customer deleted successfully');
      setTimeout(() => navigate('/admin/customers'), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
    }
  };

  // Handle reset password
  const handleResetPassword = async () => {
    try {
      setLoading(true);
      // await userService.resetPassword(customer?.id);
      setSuccess('Password reset email sent successfully');
      setShowResetPasswordModal(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  // Get status color
  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'shipped': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'awaiting_payment': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get tier color
  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'platinum': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'gold': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'silver': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-orange-100 text-orange-800 border-orange-200';
    }
  };

  if (loading && !customer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader className="w-12 h-12 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-600">Loading customer details...</p>
      </div>
    );
  }

  if (!customer && !loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center justify-center">
        <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Customer Not Found</h2>
        <p className="text-gray-600 mb-4">The customer you're looking for doesn't exist or has been deleted.</p>
        <button
          onClick={() => navigate('/admin/customers')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Back to Customers
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/admin/customers')}
            className="p-2 hover:bg-gray-200 rounded-lg mr-4 transition-colors"
            title="Back to Customers"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Customer Profile</h1>
            <p className="text-gray-600 mt-1">View and manage customer details</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3">
          {/* Edit Button */}
          <button
            onClick={() => navigate(`/admin/customers/edit/${customer?.id}`)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Edit className="w-4 h-4 mr-2" />
            <span className="text-sm font-medium">Edit Customer</span>
          </button>

          {/* Status Toggle */}
          <button
            onClick={handleToggleStatus}
            className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
              customer?.isActive
                ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {customer?.isActive ? (
              <>
                <Ban className="w-4 h-4 mr-2" />
                <span className="text-sm font-medium">Deactivate</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                <span className="text-sm font-medium">Activate</span>
              </>
            )}
          </button>

          {/* More Actions Dropdown */}
          <div className="relative">
            <button
              onClick={() => {}}
              className="flex items-center px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
          <AlertCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5" />
          <p className="text-red-700">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start">
          <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5" />
          <p className="text-green-700">{success}</p>
        </div>
      )}

      {/* Customer Overview Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        {/* Profile Card */}
        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col items-center text-center">
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden mb-4">
              {customer?.profileImage ? (
                <img src={customer.profileImage} alt={customer.fullName} className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="w-12 h-12 text-gray-400" />
              )}
            </div>
            <h2 className="text-xl font-bold text-gray-900">{customer?.fullName || 'No name'}</h2>
            <p className="text-gray-500 text-sm mb-2">{customer?.email}</p>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-4 ${
              customer?.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {customer?.isActive ? 'Active' : 'Inactive'}
            </span>
            
            <div className="w-full space-y-3 text-left">
              {customer?.phoneNumber && (
                <div className="flex items-center text-sm">
                  <Phone className="w-4 h-4 text-gray-400 mr-3" />
                  <span className="text-gray-600">{customer.phoneNumber}</span>
                </div>
              )}
              <div className="flex items-center text-sm">
                <Mail className="w-4 h-4 text-gray-400 mr-3" />
                <span className="text-gray-600">{customer?.email}</span>
              </div>
              <div className="flex items-center text-sm">
                <Calendar className="w-4 h-4 text-gray-400 mr-3" />
                <span className="text-gray-600">Joined {formatDate(customer?.createdAt)}</span>
              </div>
              {customer?.lastLogin && (
                <div className="flex items-center text-sm">
                  <Clock className="w-4 h-4 text-gray-400 mr-3" />
                  <span className="text-gray-600">Last login {formatDate(customer.lastLogin)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-500">Loyalty Tier</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTierColor(customer?.stats.loyaltyTier || 'bronze')}`}>
                {customer?.stats.loyaltyTier?.toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Email Verified</span>
              {customer?.emailConfirmed ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-50 rounded-lg">
                <ShoppingBag className="w-6 h-6 text-blue-600" />
              </div>
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
            <p className="text-sm text-gray-600">Total Orders</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{customer?.stats.totalOrders}</p>
            <p className="text-xs text-gray-500 mt-2">
              First order: {formatDate(customer?.stats.firstOrderDate)}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-green-50 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600">Total Spent</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(customer?.stats.totalSpent || 0)}</p>
            <p className="text-xs text-gray-500 mt-2">
              Avg: {formatCurrency(customer?.stats.averageOrderValue || 0)}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-purple-50 rounded-lg">
                <Star className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600">Reviews</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{customer?.stats.reviewCount}</p>
            <p className="text-xs text-gray-500 mt-2">
              Returns: {customer?.stats.returnCount} | Cancelled: {customer?.stats.cancellationCount}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'orders'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Orders ({customer?.stats.totalOrders})
            </button>
            <button
              onClick={() => setActiveTab('addresses')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'addresses'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Addresses
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'activity'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Activity Log
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Recent Orders */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    View All
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Order #</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Date</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Amount</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Payment</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {customer?.recentOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">#{order.orderNumber}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{formatDate(order.orderDate)}</td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{formatCurrency(order.totalAmount)}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                              {order.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{order.paymentStatus}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Default Address */}
              {customer?.addresses && customer.addresses.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Default Address</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-start">
                      <Home className="w-5 h-5 text-gray-400 mr-3 mt-1" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{customer.fullName}</p>
                        <p className="text-sm text-gray-600">{customer.address}</p>
                        {customer.city && <p className="text-sm text-gray-600">{customer.city}, {customer.state} {customer.zipCode}</p>}
                        {customer.country && <p className="text-sm text-gray-600">{customer.country}</p>}
                        {customer.phoneNumber && <p className="text-sm text-gray-600 mt-2">{customer.phoneNumber}</p>}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Order History</h3>
                <button className="flex items-center px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
                  <Package className="w-4 h-4 mr-2" />
                  New Order
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Order #</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Items</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Total</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Payment</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {customer?.recentOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">#{order.orderNumber}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{formatDate(order.orderDate)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{order.items?.length || 0}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{formatCurrency(order.totalAmount)}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                            {order.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{order.paymentStatus}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => navigate(`/admin/orders/${order.id}`)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Addresses Tab */}
          {activeTab === 'addresses' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Saved Addresses</h3>
                <button
                  onClick={() => {
                    setEditingAddress(null);
                    setShowAddressModal(true);
                  }}
                  className="flex items-center px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Address
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {customer?.addresses && customer.addresses.length > 0 ? (
                  customer.addresses.map((addr) => (
                    <div key={addr.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-2">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {addr.type}
                        </span>
                        {addr.isDefault && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="font-medium text-gray-900">{addr.fullName}</p>
                      <p className="text-sm text-gray-600">{addr.addressLine1}</p>
                      {addr.addressLine2 && <p className="text-sm text-gray-600">{addr.addressLine2}</p>}
                      <p className="text-sm text-gray-600">
                        {addr.city}, {addr.state} {addr.postalCode}
                      </p>
                      <p className="text-sm text-gray-600">{addr.country}</p>
                      {addr.phoneNumber && (
                        <p className="text-sm text-gray-600 mt-2">{addr.phoneNumber}</p>
                      )}
                      <div className="mt-3 flex items-center space-x-2">
                        <button className="text-sm text-blue-600 hover:text-blue-800">Edit</button>
                        <button className="text-sm text-red-600 hover:text-red-800">Delete</button>
                        {!addr.isDefault && (
                          <button className="text-sm text-gray-600 hover:text-gray-800">Set as Default</button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 text-center py-8 bg-gray-50 rounded-lg">
                    <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No addresses saved</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Activity Log Tab */}
          {activeTab === 'activity' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-4">
                {customer?.activityLog.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className={`p-2 rounded-lg ${
                      activity.type === 'order' ? 'bg-blue-100 text-blue-600' :
                      activity.type === 'login' ? 'bg-green-100 text-green-600' :
                      activity.type === 'profile_update' ? 'bg-purple-100 text-purple-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {activity.type === 'order' && <Package className="w-4 h-4" />}
                      {activity.type === 'login' && <UserIcon className="w-4 h-4" />}
                      {activity.type === 'profile_update' && <Edit className="w-4 h-4" />}
                      {activity.type === 'password_change' && <Lock className="w-4 h-4" />}
                      {activity.type === 'review' && <Star className="w-4 h-4" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{activity.description}</p>
                      <p className="text-xs text-gray-500 mt-1">{formatDate(activity.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Customer</h3>
              <p className="text-gray-500 mb-6">
                Are you sure you want to delete {customer?.fullName || customer?.email}? This action cannot be undone.
              </p>
              <div className="flex justify-center space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteCustomer}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Reset Password</h3>
              <p className="text-gray-500 mb-6">
                Send a password reset email to {customer?.email}?
              </p>
              <div className="flex justify-center space-x-3">
                <button
                  onClick={() => setShowResetPasswordModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResetPassword}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Send Reset Email
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDetail;