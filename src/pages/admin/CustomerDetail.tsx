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
  Copy,
  Send,
  Ban,
  Filter,
  Eye,
  Save,
  Award,
  Heart,
  LogOut,
  Smartphone,
  Globe,
  Map as MapIcon,
  FileText,
  MailPlus,
  Settings,
  Bell,
  Tag,
  Truck,
  Archive,
  ThumbsUp
} from 'lucide-react';
import { User, Order, OrderStatus } from '../../types';

// Update the CustomerDetail interface
interface CustomerDetail extends User {
  stats: {
    totalOrders: number;
    totalSpent: number;
    averageOrderValue: number;
    firstOrderDate?: string;
    lastOrderDate?: string;
    favoriteCategory?: string;
    favoriteProduct?: string;
    reviewCount: number;
    returnCount: number;
    cancellationCount: number;
    loyaltyTier: 'bronze' | 'silver' | 'gold' | 'platinum';
  };
  recentOrders: Order[];
  activityLog: ActivityLog[];
  wishlist?: WishlistItem[];
  addresses: AddressWithId[];
  paymentMethods?: PaymentMethod[];
  notes?: AdminNote[];
}

interface ActivityLog {
  id: string;
  type: 'order' | 'login' | 'profile_update' | 'password_change' | 'review' | 'support' | 'email' | 'note';
  description: string;
  timestamp: string;
  metadata?: any;
  user?: string;
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

interface WishlistItem {
  id: string;
  productId: number;
  productName: string;
  productImage: string;
  price: number;
  addedAt: string;
  inStock: boolean;
}

interface PaymentMethod {
  id: string;
  type: 'card' | 'gcash' | 'paymaya';
  last4?: string;
  expiryDate?: string;
  isDefault: boolean;
  name?: string;
}

interface AdminNote {
  id: string;
  content: string;
  createdAt: string;
  createdBy: string;
  isPrivate: boolean;
}

interface OrderFilters {
  status: string;
  dateRange: string;
  search: string;
  paymentStatus: string;
}

const CustomerDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser, isAdmin } = useAuth();

  // State
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'addresses' | 'activity' | 'wishlist' | 'notes'>('overview');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<AddressWithId | null>(null);
  const [newNote, setNewNote] = useState('');
  const [noteIsPrivate, setNoteIsPrivate] = useState(true);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [orderFilters, setOrderFilters] = useState<OrderFilters>({
    status: 'all',
    dateRange: 'all',
    search: '',
    paymentStatus: 'all'
  });
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    email: ''
  });

  // Redirect if not admin
  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
    }
  }, [isAdmin, navigate]);

  // Fetch customer details
  const fetchCustomerDetails = useCallback(async () => {
    if (!id) return;
    
    setLoading(true);
    setError('');
    try {
      console.log(`📊 Fetching customer details for ID: ${id}`);
      
      // Fetch user data
      const userData = await userService.getUserById(id) as User;

      console.log('📋 User roles:', userData.roles);
      
      // Check if this user has the 'user' role
      //if (!userData.roles || !userData.roles.includes('user')) {
      //  setError('This user is not a customer');
      //  setLoading(false);
      //  return;
      //}

      if (!userData.roles || (Array.isArray(userData.roles) && userData.roles.length === 0)) {
        setError('User has no roles assigned');
        setLoading(false);
        return;
      }

      console.log('👤 User roles:', userData.roles);
      
      // Fetch all orders and filter for this customer
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
      const deliveredOrders = orders.filter(order => order.status === 'delivered').length;

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
          description: `Placed order #${order.orderNumber} for ${formatCurrency(order.totalAmount)}`,
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

      // Mock wishlist items
      const wishlist: WishlistItem[] = [
        {
          id: '1',
          productId: 1,
          productName: 'Modern Sofa',
          productImage: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc',
          price: 12999,
          addedAt: new Date(Date.now() - 604800000).toISOString(),
          inStock: true
        },
        {
          id: '2',
          productId: 2,
          productName: 'Dining Table Set',
          productImage: 'https://images.unsplash.com/photo-1617806118233-18e1de247200',
          price: 15999,
          addedAt: new Date(Date.now() - 1209600000).toISOString(),
          inStock: true
        },
        {
          id: '3',
          productId: 3,
          productName: 'Bed Frame',
          productImage: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85',
          price: 18999,
          addedAt: new Date(Date.now() - 1814400000).toISOString(),
          inStock: false
        }
      ];

      // Mock payment methods
      const paymentMethods: PaymentMethod[] = [
        {
          id: 'pm1',
          type: 'gcash',
          name: 'GCash',
          isDefault: true
        },
        {
          id: 'pm2',
          type: 'card',
          last4: '4242',
          expiryDate: '12/25',
          isDefault: false
        }
      ];

      // Mock admin notes
      const notes: AdminNote[] = [
        {
          id: 'note1',
          content: 'Customer requested follow-up on order #12345',
          createdAt: new Date(Date.now() - 172800000).toISOString(),
          createdBy: 'Admin User',
          isPrivate: true
        },
        {
          id: 'note2',
          content: 'Offered 10% discount on next purchase',
          createdAt: new Date(Date.now() - 259200000).toISOString(),
          createdBy: 'Admin User',
          isPrivate: false
        }
      ];

      // Create the customer object
      const customerData: CustomerDetail = {
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
        
        stats: {
          totalOrders,
          totalSpent,
          averageOrderValue,
          firstOrderDate,
          lastOrderDate,
          favoriteCategory: 'Living Room',
          favoriteProduct: 'Modern Sofa',
          reviewCount: 3,
          returnCount: 1,
          cancellationCount: cancelledOrders,
          loyaltyTier
        },
        recentOrders: orders.slice(0, 5),
        activityLog,
        wishlist,
        addresses,
        paymentMethods,
        notes
      };

      setCustomer(customerData);
      setFilteredOrders(orders);
      
      // Set edit form values
      setEditForm({
        fullName: userData.fullName || '',
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        phoneNumber: userData.phoneNumber || '',
        email: userData.email
      });

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

  // Filter orders
  useEffect(() => {
    if (!customer?.recentOrders) return;
    
    let filtered = [...customer.recentOrders];
    
    // Filter by status
    if (orderFilters.status !== 'all') {
      filtered = filtered.filter(order => order.status === orderFilters.status);
    }
    
    // Filter by payment status
    if (orderFilters.paymentStatus !== 'all') {
      filtered = filtered.filter(order => order.paymentStatus === orderFilters.paymentStatus);
    }
    
    // Filter by date range
    if (orderFilters.dateRange !== 'all') {
      const now = new Date();
      const cutoff = new Date();
      
      switch (orderFilters.dateRange) {
        case 'today':
          cutoff.setHours(0, 0, 0, 0);
          break;
        case 'week':
          cutoff.setDate(now.getDate() - 7);
          break;
        case 'month':
          cutoff.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          cutoff.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      filtered = filtered.filter(order => new Date(order.orderDate) >= cutoff);
    }
    
    // Filter by search
    if (orderFilters.search) {
      const searchLower = orderFilters.search.toLowerCase();
      filtered = filtered.filter(order => 
        order.orderNumber.toLowerCase().includes(searchLower) ||
        order.totalAmount.toString().includes(searchLower)
      );
    }
    
    setFilteredOrders(filtered);
  }, [customer?.recentOrders, orderFilters]);

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

  // Handle add note
  const handleAddNote = () => {
    if (!newNote.trim() || !customer) return;
    
    const note: AdminNote = {
      id: `note-${Date.now()}`,
      content: newNote,
      createdAt: new Date().toISOString(),
      createdBy: currentUser?.fullName || 'Admin',
      isPrivate: noteIsPrivate
    };
    
    const activityEntry: ActivityLog = {
      id: `activity-${Date.now()}`,
      type: 'note',
      description: `Admin note: ${newNote.substring(0, 50)}${newNote.length > 50 ? '...' : ''}`,
      timestamp: new Date().toISOString(),
      user: currentUser?.fullName || 'Admin'
    };
    
    setCustomer({
      ...customer,
      notes: [...(customer.notes || []), note],
      activityLog: [activityEntry, ...customer.activityLog]
    });
    
    setNewNote('');
    setShowNoteModal(false);
    setSuccess('Note added successfully');
  };

  // Handle send email
  const handleSendEmail = () => {
    if (!emailSubject.trim() || !emailMessage.trim() || !customer) return;
    
    const activityEntry: ActivityLog = {
      id: `email-${Date.now()}`,
      type: 'email',
      description: `Email sent: ${emailSubject}`,
      timestamp: new Date().toISOString(),
      user: currentUser?.fullName || 'Admin',
      metadata: { subject: emailSubject }
    };
    
    setCustomer({
      ...customer,
      activityLog: [activityEntry, ...customer.activityLog]
    });
    
    setEmailSubject('');
    setEmailMessage('');
    setShowEmailModal(false);
    setSuccess('Email sent successfully');
  };

  // Handle save edit
  const handleSaveEdit = async () => {
    if (!customer) return;
    
    try {
      setLoading(true);
      
      const updatedCustomer = {
        ...customer,
        fullName: editForm.fullName,
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        phoneNumber: editForm.phoneNumber,
        email: editForm.email
      };
      
      // await userService.updateUser(customer.id, updatedCustomer);
      
      setCustomer(updatedCustomer);
      setIsEditing(false);
      setSuccess('Customer updated successfully');
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

  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return formatDate(dateString);
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

  // Get payment status color
  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'refunded': return 'bg-purple-100 text-purple-800';
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

  // Get activity icon
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'order': return <Package className="w-4 h-4" />;
      case 'login': return <LogOut className="w-4 h-4" />;
      case 'profile_update': return <Edit className="w-4 h-4" />;
      case 'password_change': return <Lock className="w-4 h-4" />;
      case 'review': return <Star className="w-4 h-4" />;
      case 'email': return <Mail className="w-4 h-4" />;
      case 'note': return <FileText className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
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
          {/* Quick Actions Dropdown */}
          <div className="relative">
            <button
              className="flex items-center px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">Actions</span>
              <MoreVertical className="w-4 h-4 ml-2" />
            </button>
          </div>

          {/* Email Button */}
          <button
            onClick={() => setShowEmailModal(true)}
            className="flex items-center px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Mail className="w-4 h-4 mr-2" />
            <span className="text-sm font-medium">Email</span>
          </button>

          {/* Add Note Button */}
          <button
            onClick={() => setShowNoteModal(true)}
            className="flex items-center px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FileText className="w-4 h-4 mr-2" />
            <span className="text-sm font-medium">Add Note</span>
          </button>

          {/* Edit Button */}
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">Edit</span>
            </button>
          ) : (
            <button
              onClick={handleSaveEdit}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Save className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">Save</span>
            </button>
          )}

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
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-red-50 hover:border-red-200 transition-colors text-red-600"
              title="Delete Customer"
            >
              <Trash2 className="w-4 h-4" />
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
          {!isEditing ? (
            <>
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
                <div className="flex items-center space-x-2 mb-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    customer?.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {customer?.isActive ? 'Active' : 'Inactive'}
                  </span>
                  {customer?.emailConfirmed && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      <Shield className="w-3 h-3 mr-1" />
                      Verified
                    </span>
                  )}
                </div>
                
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
                      <span className="text-gray-600">Last login {formatRelativeTime(customer.lastLogin)}</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Edit Customer</h3>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Full Name</label>
                <input
                  type="text"
                  value={editForm.fullName}
                  onChange={(e) => setEditForm({...editForm, fullName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">First Name</label>
                  <input
                    type="text"
                    value={editForm.firstName}
                    onChange={(e) => setEditForm({...editForm, firstName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={editForm.lastName}
                    onChange={(e) => setEditForm({...editForm, lastName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={editForm.phoneNumber}
                  onChange={(e) => setEditForm({...editForm, phoneNumber: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          )}

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
            {customer?.paymentMethods && customer.paymentMethods.length > 0 && (
              <div className="mt-4">
                <span className="text-sm text-gray-500">Payment Methods</span>
                <div className="mt-2 space-y-2">
                  {customer.paymentMethods.map(method => (
                    <div key={method.id} className="flex items-center text-sm">
                      {method.type === 'gcash' && <Smartphone className="w-4 h-4 text-blue-500 mr-2" />}
                      {method.type === 'card' && <CreditCard className="w-4 h-4 text-gray-500 mr-2" />}
                      {method.type === 'paymaya' && <CreditCard className="w-4 h-4 text-red-500 mr-2" />}
                      <span className="text-gray-600">
                        {method.type === 'gcash' && 'GCash'}
                        {method.type === 'paymaya' && 'PayMaya'}
                        {method.type === 'card' && `Card ending in ${method.last4}`}
                      </span>
                      {method.isDefault && (
                        <span className="ml-2 text-xs text-green-600">(Default)</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
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
                <Award className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600">Customer Since</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{formatDate(customer?.createdAt)}</p>
            <p className="text-xs text-gray-500 mt-2">
              Reviews: {customer?.stats.reviewCount} | Returns: {customer?.stats.returnCount}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="border-b border-gray-200 overflow-x-auto">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-6 text-sm font-medium border-b-2 whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`py-4 px-6 text-sm font-medium border-b-2 whitespace-nowrap ${
                activeTab === 'orders'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Orders ({customer?.stats.totalOrders})
            </button>
            <button
              onClick={() => setActiveTab('addresses')}
              className={`py-4 px-6 text-sm font-medium border-b-2 whitespace-nowrap ${
                activeTab === 'addresses'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Addresses ({customer?.addresses.length})
            </button>
            <button
              onClick={() => setActiveTab('wishlist')}
              className={`py-4 px-6 text-sm font-medium border-b-2 whitespace-nowrap ${
                activeTab === 'wishlist'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Wishlist ({customer?.wishlist?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`py-4 px-6 text-sm font-medium border-b-2 whitespace-nowrap ${
                activeTab === 'activity'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Activity Log
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`py-4 px-6 text-sm font-medium border-b-2 whitespace-nowrap ${
                activeTab === 'notes'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Notes ({customer?.notes?.length || 0})
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
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {customer?.recentOrders.slice(0, 3).map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">#{order.orderNumber}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{formatDate(order.orderDate)}</td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{formatCurrency(order.totalAmount)}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                              {order.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(order.paymentStatus)}`}>
                              {order.paymentStatus}
                            </span>
                          </td>
                          <td className="px-4 py-3">
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

              {/* Favorite Products */}
              {customer?.stats.favoriteProduct && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Favorite Product</h3>
                  <div className="bg-gray-50 p-4 rounded-lg flex items-center">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg mr-4"></div>
                    <div>
                      <p className="font-medium text-gray-900">{customer.stats.favoriteProduct}</p>
                      <p className="text-sm text-gray-500">Category: {customer.stats.favoriteCategory}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h3 className="text-lg font-semibold text-gray-900">Order History</h3>
                
                {/* Filters */}
                <div className="flex flex-wrap gap-3">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search orders..."
                      value={orderFilters.search}
                      onChange={(e) => setOrderFilters({...orderFilters, search: e.target.value})}
                      className="pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <Filter className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
                  </div>
                  
                  <select
                    value={orderFilters.status}
                    onChange={(e) => setOrderFilters({...orderFilters, status: e.target.value})}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="awaiting_payment">Awaiting Payment</option>
                  </select>
                  
                  <select
                    value={orderFilters.paymentStatus}
                    onChange={(e) => setOrderFilters({...orderFilters, paymentStatus: e.target.value})}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Payment</option>
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="failed">Failed</option>
                    <option value="refunded">Refunded</option>
                  </select>
                  
                  <select
                    value={orderFilters.dateRange}
                    onChange={(e) => setOrderFilters({...orderFilters, dateRange: e.target.value})}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">Last 7 Days</option>
                    <option value="month">Last 30 Days</option>
                    <option value="year">Last Year</option>
                  </select>
                </div>
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
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Method</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredOrders.map((order) => (
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
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(order.paymentStatus)}`}>
                            {order.paymentStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 capitalize">{order.paymentMethod}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => navigate(`/admin/orders/${order.id}`)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium mr-3"
                          >
                            View
                          </button>
                          <button
                            onClick={() => navigate(`/admin/orders/edit/${order.id}`)}
                            className="text-gray-600 hover:text-gray-800 text-sm font-medium"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredOrders.length === 0 && (
                <div className="text-center py-12">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No orders found matching your filters</p>
                </div>
              )}
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
                      <div className="mt-3 flex items-center space-x-3">
                        <button className="text-sm text-blue-600 hover:text-blue-800">Edit</button>
                        <button className="text-sm text-red-600 hover:text-red-800">Delete</button>
                        {!addr.isDefault && (
                          <button className="text-sm text-gray-600 hover:text-gray-800">Set as Default</button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 text-center py-12 bg-gray-50 rounded-lg">
                    <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No addresses saved</p>
                    <button
                      onClick={() => setShowAddressModal(true)}
                      className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Add Address
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Wishlist Tab */}
          {activeTab === 'wishlist' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Wishlist Items</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {customer?.wishlist && customer.wishlist.length > 0 ? (
                  customer.wishlist.map((item) => (
                    <div key={item.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                      <div className="h-40 bg-gray-100 relative">
                        <img 
                          src={item.productImage} 
                          alt={item.productName}
                          className="w-full h-full object-cover"
                        />
                        {!item.inStock && (
                          <span className="absolute top-2 right-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                            Out of Stock
                          </span>
                        )}
                      </div>
                      <div className="p-4">
                        <h4 className="font-medium text-gray-900 mb-1">{item.productName}</h4>
                        <p className="text-lg font-bold text-gray-900 mb-2">{formatCurrency(item.price)}</p>
                        <p className="text-xs text-gray-500 mb-3">Added {formatRelativeTime(item.addedAt)}</p>
                        <div className="flex space-x-2">
                          <button className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
                            Add to Cart
                          </button>
                          <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50">
                            <Heart className="w-4 h-4 text-red-500 fill-current" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-3 text-center py-12 bg-gray-50 rounded-lg">
                    <Heart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No items in wishlist</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Activity Log Tab */}
          {activeTab === 'activity' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Log</h3>
              <div className="space-y-4">
                {customer?.activityLog.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className={`p-2 rounded-lg ${
                      activity.type === 'order' ? 'bg-blue-100 text-blue-600' :
                      activity.type === 'login' ? 'bg-green-100 text-green-600' :
                      activity.type === 'email' ? 'bg-purple-100 text-purple-600' :
                      activity.type === 'note' ? 'bg-yellow-100 text-yellow-600' :
                      activity.type === 'profile_update' ? 'bg-indigo-100 text-indigo-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-900">{activity.description}</p>
                        {activity.user && (
                          <span className="text-xs text-gray-500">by {activity.user}</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{formatRelativeTime(activity.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes Tab */}
          {activeTab === 'notes' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Admin Notes</h3>
                <button
                  onClick={() => setShowNoteModal(true)}
                  className="flex items-center px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Note
                </button>
              </div>
              <div className="space-y-4">
                {customer?.notes && customer.notes.length > 0 ? (
                  customer.notes.map((note) => (
                    <div key={note.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center">
                          <FileText className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm font-medium text-gray-900">{note.createdBy}</span>
                          {note.isPrivate && (
                            <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                              Private
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">{formatRelativeTime(note.createdAt)}</span>
                      </div>
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">{note.content}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No notes yet</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Note Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">Add Note</h3>
            </div>
            <div className="p-6">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Enter your note..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              />
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  id="privateNote"
                  checked={noteIsPrivate}
                  onChange={(e) => setNoteIsPrivate(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                />
                <label htmlFor="privateNote" className="text-sm text-gray-600">
                  Private note (only visible to admins)
                </label>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowNoteModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddNote}
                  disabled={!newNote.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Add Note
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Send Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">Send Email to {customer?.email}</h3>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Email subject..."
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Type your message here..."
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowEmailModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendEmail}
                  disabled={!emailSubject.trim() || !emailMessage.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Send Email
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                Are you sure you want to delete <span className="font-semibold">{customer?.fullName || customer?.email}</span>? 
                This action cannot be undone and will remove all customer data including orders and history.
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
                  Delete Customer
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
                Send a password reset email to <span className="font-semibold">{customer?.email}</span>?
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