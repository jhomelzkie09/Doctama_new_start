import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import userService from '../../services/user.service';
import orderService from '../../services/order.service';
import { 
  Users, 
  Search, 
  Filter, 
  Download, 
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ShoppingBag,
  DollarSign,
  Star,
  AlertCircle,
  Loader,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  UserPlus,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Shield,
  UserCheck,
  UserX,
  ArrowUpDown,
  DownloadCloud,
  MailPlus,
  Settings,
  Home,
  Package,
  CreditCard
} from 'lucide-react';
import { User, Order, OrderStatus } from '../../types';

// Extended types for customer management
interface CustomerWithStats extends User {
  stats: {
    totalOrders: number;
    totalSpent: number;
    averageOrderValue: number;
    lastOrderDate?: string;
    favoriteCategory?: string;
    reviewCount: number;
    returnCount: number;
    cancellationCount: number;
  };
  recentOrders: Order[];
  addressSummary?: string;
}

interface CustomerFilters {
  search: string;
  status: 'all' | 'active' | 'inactive';
  verified: 'all' | 'verified' | 'unverified';
  dateRange: 'all' | 'today' | 'week' | 'month' | 'year';
  sortBy: 'name' | 'email' | 'orders' | 'spent' | 'joined';
  sortOrder: 'asc' | 'desc';
  page: number;
  limit: number;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

interface QuickStats {
  totalCustomers: number;
  activeCustomers: number;
  newCustomersToday: number;
  totalRevenue: number;
  averageOrderValue: number;
  verifiedRate: number;
  conversionRate: number;
}

const CustomerManagement = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  // Redirect if not admin
  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
    }
  }, [isAdmin, navigate]);

  // State management
  const [customers, setCustomers] = useState<CustomerWithStats[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Filters state
  const [filters, setFilters] = useState<CustomerFilters>({
    search: '',
    status: 'all',
    verified: 'all',
    dateRange: 'all',
    sortBy: 'joined',
    sortOrder: 'desc',
    page: 1,
    limit: 10
  });

  // Pagination state
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
    hasNext: false,
    hasPrevious: false
  });

  // Quick stats
  const [quickStats, setQuickStats] = useState<QuickStats>({
    totalCustomers: 0,
    activeCustomers: 0,
    newCustomersToday: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    verifiedRate: 0,
    conversionRate: 0
  });

  // UI state
  const [showFilters, setShowFilters] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  // Fetch customers with stats
  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      console.log('📊 Fetching customers...');
      
      // Fetch all users
      const users = await userService.getAllUsers() as User[];
      
      // Process and enhance customer data with stats
      const customersWithStats = await Promise.all(
        users.map(async (customer) => {
          try {
            // Fetch customer orders to calculate stats
            const orders = await orderService.getUserOrders(customer.id) as Order[];
            
            // Calculate stats
            const totalOrders = orders.length;
            const totalSpent = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
            const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;
            
            // Count cancellations and returns
            const cancelledOrders = orders.filter(order => 
                order.status === 'cancelled'
            ).length;
            
            // Get recent orders (last 5)
            const recentOrders = orders
              .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime())
              .slice(0, 5);
            
            // Create address summary
            const addressParts = [
              customer.address,
              customer.city,
              customer.state,
              customer.zipCode,
              customer.country
            ].filter(Boolean);
            const addressSummary = addressParts.length > 0 
              ? addressParts.slice(0, 2).join(', ') + (addressParts.length > 2 ? '...' : '')
              : undefined;
            
            return {
              ...customer,
              stats: {
                totalOrders,
                totalSpent,
                averageOrderValue,
                lastOrderDate: recentOrders[0]?.orderDate,
                favoriteCategory: 'Living Room', // This would come from order analysis
                reviewCount: Math.floor(Math.random() * 20), // Placeholder - would come from reviews service
                returnCount: 0, // This would need a returns service
                cancellationCount: cancelledOrders
              },
              recentOrders,
              addressSummary
            };
          } catch (err) {
            console.warn(`⚠️ Error fetching orders for customer ${customer.id}:`, err);
            return {
              ...customer,
              stats: {
                totalOrders: 0,
                totalSpent: 0,
                averageOrderValue: 0,
                reviewCount: 0,
                returnCount: 0,
                cancellationCount: 0
              },
              recentOrders: []
            };
          }
        })
      );

      // Apply filters and sorting
      let filteredCustomers = customersWithStats;

      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredCustomers = filteredCustomers.filter(c => 
          c.fullName?.toLowerCase().includes(searchLower) ||
          c.email?.toLowerCase().includes(searchLower) ||
          c.phoneNumber?.includes(filters.search)
        );
      }

      // Status filter
      if (filters.status !== 'all') {
        filteredCustomers = filteredCustomers.filter(c => 
          filters.status === 'active' ? c.isActive : !c.isActive
        );
      }

      // Verified filter
      if (filters.verified !== 'all') {
        filteredCustomers = filteredCustomers.filter(c => 
          filters.verified === 'verified' ? c.emailConfirmed : !c.emailConfirmed
        );
      }

      // Date range filter
      if (filters.dateRange !== 'all') {
        const now = new Date();
        const cutoff = new Date();
        switch (filters.dateRange) {
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
        filteredCustomers = filteredCustomers.filter(c => 
          new Date(c.createdAt) >= cutoff
        );
      }

      // Sorting
      filteredCustomers.sort((a, b) => {
        let comparison = 0;
        switch (filters.sortBy) {
          case 'name':
            comparison = (a.fullName || '').localeCompare(b.fullName || '');
            break;
          case 'email':
            comparison = (a.email || '').localeCompare(b.email || '');
            break;
          case 'orders':
            comparison = (a.stats?.totalOrders || 0) - (b.stats?.totalOrders || 0);
            break;
          case 'spent':
            comparison = (a.stats?.totalSpent || 0) - (b.stats?.totalSpent || 0);
            break;
          case 'joined':
            comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            break;
        }
        return filters.sortOrder === 'asc' ? comparison : -comparison;
      });

      // Calculate quick stats
      const totalCustomers = filteredCustomers.length;
      const activeCustomers = filteredCustomers.filter(c => c.isActive).length;
      const verifiedCustomers = filteredCustomers.filter(c => c.emailConfirmed).length;
      
      const newCustomersToday = filteredCustomers.filter(c => {
        const today = new Date().toDateString();
        return new Date(c.createdAt).toDateString() === today;
      }).length;
      
      const totalRevenue = filteredCustomers.reduce((sum, c) => sum + (c.stats?.totalSpent || 0), 0);
      
      // Calculate conversion rate (users who have placed at least one order)
      const usersWithOrders = filteredCustomers.filter(c => (c.stats?.totalOrders || 0) > 0).length;
      const conversionRate = totalCustomers > 0 ? (usersWithOrders / totalCustomers) * 100 : 0;

      setQuickStats({
        totalCustomers,
        activeCustomers,
        newCustomersToday,
        totalRevenue,
        averageOrderValue: totalCustomers > 0 ? totalRevenue / totalCustomers : 0,
        verifiedRate: totalCustomers > 0 ? (verifiedCustomers / totalCustomers) * 100 : 0,
        conversionRate
      });

      // Apply pagination
      const start = (filters.page - 1) * filters.limit;
      const end = start + filters.limit;
      const paginatedCustomers = filteredCustomers.slice(start, end);

      setPagination({
        currentPage: filters.page,
        totalPages: Math.ceil(filteredCustomers.length / filters.limit),
        totalItems: filteredCustomers.length,
        itemsPerPage: filters.limit,
        hasNext: end < filteredCustomers.length,
        hasPrevious: start > 0
      });

      setCustomers(paginatedCustomers);
      
    } catch (err: any) {
      console.error('❌ Error fetching customers:', err);
      setError(err.message || 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Handle filter changes
  const handleFilterChange = (key: keyof CustomerFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filters change
    }));
  };

  // Handle sort
  const handleSort = (column: CustomerFilters['sortBy']) => {
    setFilters(prev => ({
      ...prev,
      sortBy: column,
      sortOrder: prev.sortBy === column && prev.sortOrder === 'asc' ? 'desc' : 'asc',
      page: 1
    }));
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({
      ...prev,
      page: newPage
    }));
  };

  // Handle customer selection
  const handleSelectCustomer = (customerId: string) => {
    setSelectedCustomers(prev => {
      if (prev.includes(customerId)) {
        return prev.filter(id => id !== customerId);
      } else {
        return [...prev, customerId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(customers.map(c => c.id));
    }
    setSelectAll(!selectAll);
  };

  // Handle bulk actions
  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'email') => {
    if (selectedCustomers.length === 0) {
      setError('Please select at least one customer');
      return;
    }

    setLoading(true);
    try {
      switch (action) {
        case 'activate':
          await Promise.all(selectedCustomers.map(id => 
            userService.toggleUserStatus(id, true)
          ));
          setSuccess(`Activated ${selectedCustomers.length} customer${selectedCustomers.length !== 1 ? 's' : ''}`);
          break;
        case 'deactivate':
          await Promise.all(selectedCustomers.map(id => 
            userService.toggleUserStatus(id, false)
          ));
          setSuccess(`Deactivated ${selectedCustomers.length} customer${selectedCustomers.length !== 1 ? 's' : ''}`);
          break;
        case 'email':
          // Navigate to email composer with selected customers
          navigate('/admin/email/compose', { 
            state: { 
              recipients: selectedCustomers,
              type: 'bulk'
            } 
          });
          return;
      }
      
      setSelectedCustomers([]);
      setSelectAll(false);
      fetchCustomers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle export
  const handleExport = async () => {
    try {
      setLoading(true);
      
      // Prepare data for export
      const dataToExport = selectedCustomers.length > 0 
        ? customers.filter(c => selectedCustomers.includes(c.id))
        : customers;
      
      // Create CSV
      const headers = ['Name', 'Email', 'Phone', 'Status', 'Verified', 'Total Orders', 'Total Spent', 'Joined', 'Last Login'];
      const csvData = dataToExport.map(c => [
        c.fullName || '',
        c.email,
        c.phoneNumber || '',
        c.isActive ? 'Active' : 'Inactive',
        c.emailConfirmed ? 'Yes' : 'No',
        c.stats?.totalOrders || 0,
        c.stats?.totalSpent || 0,
        new Date(c.createdAt).toLocaleDateString(),
        c.lastLogin ? new Date(c.lastLogin).toLocaleDateString() : 'Never'
      ]);
      
      const csv = [headers, ...csvData].map(row => row.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `customers_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      
      setSuccess(`Exported ${dataToExport.length} customer${dataToExport.length !== 1 ? 's' : ''} successfully`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle delete customer
  const handleDeleteCustomer = async () => {
    if (!selectedCustomer) return;
    
    setLoading(true);
    try {
      await userService.deleteUser(selectedCustomer.id);
      setSuccess('Customer deleted successfully');
      setShowDeleteModal(false);
      setSelectedCustomer(null);
      fetchCustomers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Get status badge color
  const getStatusColor = (status: boolean) => {
    return status 
      ? 'bg-green-100 text-green-800 border-green-200'
      : 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading && customers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader className="w-12 h-12 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-600">Loading customers...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Customer Management</h1>
          <p className="text-gray-600 mt-1">
            Manage your customers, view their details and purchase history
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          {/* Add Customer Button */}
          <button
            onClick={() => navigate('/admin/customers/new')}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            <span className="text-sm font-medium">Add Customer</span>
          </button>
          
          {/* Export Button */}
          <button
            onClick={handleExport}
            className="flex items-center px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            <span className="text-sm font-medium">Export</span>
          </button>
          
          {/* Refresh Button */}
          <button
            onClick={fetchCustomers}
            disabled={loading}
            className="flex items-center justify-center px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Customers</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{quickStats.totalCustomers}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-3 flex items-center text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600 font-medium">+{((quickStats.activeCustomers / quickStats.totalCustomers) * 100).toFixed(1)}%</span>
            <span className="text-gray-500 ml-2">active</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Customers</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{quickStats.activeCustomers}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <UserCheck className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-3">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full" 
                style={{ width: `${(quickStats.activeCustomers / quickStats.totalCustomers) * 100}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {quickStats.verifiedRate.toFixed(1)}% email verified
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                ${quickStats.totalRevenue.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-3 flex items-center text-sm">
            <ShoppingBag className="w-4 h-4 text-blue-500 mr-1" />
            <span className="text-gray-600">Avg: ${quickStats.averageOrderValue.toFixed(2)}</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Conversion Rate</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{quickStats.conversionRate.toFixed(1)}%</p>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-center text-sm">
              <span className="text-gray-600 mr-2">New today:</span>
              <span className="font-medium text-blue-600">+{quickStats.newCustomersToday}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap gap-2">
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <select
              value={filters.verified}
              onChange={(e) => handleFilterChange('verified', e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Verification</option>
              <option value="verified">Verified</option>
              <option value="unverified">Unverified</option>
            </select>

            <select
              value={filters.dateRange}
              onChange={(e) => handleFilterChange('dateRange', e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="year">Last Year</option>
            </select>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 border rounded-lg flex items-center ${
                showFilters ? 'bg-blue-50 border-blue-300 text-blue-600' : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-4 h-4 mr-2" />
              More Filters
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                placeholder="City, State, or Country"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min. Orders</label>
              <input
                type="number"
                placeholder="Minimum number of orders"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min. Spent</label>
              <input
                type="number"
                placeholder="Minimum amount spent"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Bulk Actions Bar */}
      {selectedCustomers.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-sm font-medium text-blue-700">
              {selectedCustomers.length} customer{selectedCustomers.length !== 1 ? 's' : ''} selected
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleBulkAction('activate')}
              className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
            >
              Activate
            </button>
            <button
              onClick={() => handleBulkAction('deactivate')}
              className="px-3 py-1 bg-yellow-600 text-white text-sm rounded-lg hover:bg-yellow-700 transition-colors"
            >
              Deactivate
            </button>
            <button
              onClick={() => handleBulkAction('email')}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              Send Email
            </button>
            <button
              onClick={() => setSelectedCustomers([])}
              className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      )}

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

      {/* Customers Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left">
                  <button 
                    onClick={() => handleSort('name')}
                    className="flex items-center text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                  >
                    Customer
                    {filters.sortBy === 'name' && (
                      <ArrowUpDown className={`w-4 h-4 ml-1 transition-transform ${
                        filters.sortOrder === 'desc' ? 'rotate-180' : ''
                      }`} />
                    )}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left">
                  <button 
                    onClick={() => handleSort('orders')}
                    className="flex items-center text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                  >
                    Orders
                    {filters.sortBy === 'orders' && (
                      <ArrowUpDown className={`w-4 h-4 ml-1 transition-transform ${
                        filters.sortOrder === 'desc' ? 'rotate-180' : ''
                      }`} />
                    )}
                  </button>
                </th>
                <th className="px-6 py-3 text-left">
                  <button 
                    onClick={() => handleSort('spent')}
                    className="flex items-center text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                  >
                    Total Spent
                    {filters.sortBy === 'spent' && (
                      <ArrowUpDown className={`w-4 h-4 ml-1 transition-transform ${
                        filters.sortOrder === 'desc' ? 'rotate-180' : ''
                      }`} />
                    )}
                  </button>
                </th>
                <th className="px-6 py-3 text-left">
                  <button 
                    onClick={() => handleSort('joined')}
                    className="flex items-center text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                  >
                    Joined
                    {filters.sortBy === 'joined' && (
                      <ArrowUpDown className={`w-4 h-4 ml-1 transition-transform ${
                        filters.sortOrder === 'desc' ? 'rotate-180' : ''
                      }`} />
                    )}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {customers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedCustomers.includes(customer.id)}
                      onChange={() => handleSelectCustomer(customer.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                        {customer.profileImage ? (
                          <img src={customer.profileImage} alt={customer.fullName} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-lg font-medium text-gray-600">
                            {customer.fullName?.charAt(0).toUpperCase() || customer.email.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {customer.fullName || 'No name'}
                        </div>
                        <div className="text-xs text-gray-500">
                          ID: {customer.id.substring(0, 8)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{customer.email}</div>
                    {customer.phoneNumber && (
                      <div className="text-xs text-gray-500 mt-1 flex items-center">
                        <Phone className="w-3 h-3 mr-1" />
                        {customer.phoneNumber}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {customer.stats?.totalOrders || 0}
                    </div>
                    {customer.stats?.totalOrders > 0 && (
                      <div className="text-xs text-gray-500">
                        ${customer.stats?.averageOrderValue.toFixed(2)} avg
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-gray-900">
                      ${customer.stats?.totalSpent.toLocaleString()}
                    </div>
                    {customer.stats?.lastOrderDate && (
                      <div className="text-xs text-gray-500">
                        Last: {formatDate(customer.stats.lastOrderDate)}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {formatDate(customer.createdAt)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col space-y-1">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(customer.isActive)}`}>
                        {customer.isActive ? (
                          <>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Active
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 mr-1" />
                            Inactive
                          </>
                        )}
                      </span>
                      {customer.emailConfirmed && (
                        <span className="inline-flex items-center text-xs text-blue-600">
                          <Shield className="w-3 h-3 mr-1" />
                          Verified
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {customer.addressSummary ? (
                      <div className="text-sm text-gray-900 flex items-start">
                        <Home className="w-3 h-3 mr-1 mt-1 flex-shrink-0" />
                        <span>{customer.addressSummary}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">No address</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => navigate(`/admin/customers/${customer.id}`)}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => navigate(`/admin/customers/edit/${customer.id}`)}
                        className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Edit Customer"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedCustomer(customer);
                          setShowDeleteModal(true);
                        }}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Customer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {customers.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No customers found</h3>
            <p className="text-gray-500 mb-4">Try adjusting your filters or add a new customer</p>
            <button
              onClick={() => navigate('/admin/customers/new')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Add Customer
            </button>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to{' '}
              {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of{' '}
              {pagination.totalItems} results
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={!pagination.hasPrevious}
                className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {[...Array(pagination.totalPages)].map((_, i) => {
                const pageNum = i + 1;
                // Show first, last, and pages around current
                if (
                  pageNum === 1 ||
                  pageNum === pagination.totalPages ||
                  (pageNum >= pagination.currentPage - 2 && pageNum <= pagination.currentPage + 2)
                ) {
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-1 rounded-lg ${
                        pagination.currentPage === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                } else if (
                  pageNum === pagination.currentPage - 3 ||
                  pageNum === pagination.currentPage + 3
                ) {
                  return <span key={pageNum} className="px-2">...</span>;
                }
                return null;
              })}
              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={!pagination.hasNext}
                className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Customer Details Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-gray-900">Customer Details</h2>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              {/* Customer Info */}
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                  {selectedCustomer.profileImage ? (
                    <img src={selectedCustomer.profileImage} alt={selectedCustomer.fullName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-medium text-gray-600">
                      {selectedCustomer.fullName?.charAt(0).toUpperCase() || selectedCustomer.email.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {selectedCustomer.fullName || 'No name'}
                  </h3>
                  <p className="text-gray-500">{selectedCustomer.email}</p>
                  {selectedCustomer.phoneNumber && (
                    <p className="text-sm text-gray-500 flex items-center mt-1">
                      <Phone className="w-4 h-4 mr-1" />
                      {selectedCustomer.phoneNumber}
                    </p>
                  )}
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-600 mb-1">Total Orders</p>
                  <p className="text-2xl font-bold text-blue-700">{selectedCustomer.stats?.totalOrders}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-600 mb-1">Total Spent</p>
                  <p className="text-2xl font-bold text-green-700">${selectedCustomer.stats?.totalSpent.toLocaleString()}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-purple-600 mb-1">Avg Order Value</p>
                  <p className="text-2xl font-bold text-purple-700">${selectedCustomer.stats?.averageOrderValue.toFixed(2)}</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <p className="text-sm text-orange-600 mb-1">Member Since</p>
                  <p className="text-2xl font-bold text-orange-700">{formatDate(selectedCustomer.createdAt)}</p>
                </div>
              </div>

              {/* Address */}
              {selectedCustomer.address && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    Address
                  </h4>
                  <p className="text-gray-600">
                    {selectedCustomer.address}
                    {selectedCustomer.city && `, ${selectedCustomer.city}`}
                    {selectedCustomer.state && `, ${selectedCustomer.state}`}
                    {selectedCustomer.zipCode && ` ${selectedCustomer.zipCode}`}
                    {selectedCustomer.country && `, ${selectedCustomer.country}`}
                  </p>
                </div>
              )}

              {/* Recent Orders */}
              {selectedCustomer.recentOrders && selectedCustomer.recentOrders.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <Package className="w-4 h-4 mr-1" />
                    Recent Orders
                  </h4>
                  <div className="space-y-3">
                    {selectedCustomer.recentOrders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-900">#{order.orderNumber}</p>
                          <p className="text-xs text-gray-500">{formatDate(order.orderDate)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-gray-900">${order.totalAmount.toFixed(2)}</p>
                          <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                            order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                            order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => navigate(`/admin/customers/edit/${selectedCustomer.id}`)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Edit Customer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Customer</h3>
              <p className="text-gray-500 mb-6">
                Are you sure you want to delete <span className="font-semibold">{selectedCustomer.fullName || selectedCustomer.email}</span>? 
                This action cannot be undone and will remove all customer data.
              </p>
              <div className="flex justify-center space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedCustomer(null);
                  }}
                  className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteCustomer}
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center"
                >
                  {loading ? <Loader className="w-4 h-4 animate-spin mr-2" /> : null}
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerManagement;