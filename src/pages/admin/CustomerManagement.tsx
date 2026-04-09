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
  CreditCard,
  Award,
  Clock,
  BarChart3,
  Activity,
  Zap,
  Crown,
  Heart,
  Gift,
  Sparkles
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
      
      const users = await userService.getAllUsers() as User[];
      console.log('📋 All users from API:', users.map(u => ({ 
        email: u.email, 
        roles: u.roles,
        fullName: u.fullName 
      })));

      // Filter only users with 'user' role (customers)
      const customersOnly = users.filter(user => {
        if (Array.isArray(user.roles)) {
          return user.roles.some(role => 
            role.toLowerCase() === 'user' || 
            role.toLowerCase() === 'customer'
          );
        }
        if (typeof user.roles === 'string') {
          const roleStr = user.roles.toLowerCase();
          return roleStr === 'user' || roleStr === 'customer';
        }
        return false;
      });

      console.log(`📊 Found ${customersOnly.length} customers out of ${users.length} total users`);

      if (customersOnly.length === 0) {
        console.log('⚠️ No users with customer role found, showing all non-admin users');
        const nonAdminUsers = users.filter(user => {
          if (Array.isArray(user.roles)) {
            return !user.roles.some(role => 
              role.toLowerCase() === 'admin' || 
              role.toLowerCase() === 'administrator'
            );
          }
          if (typeof user.roles === 'string') {
            const roleStr = user.roles.toLowerCase();
            return roleStr !== 'admin' && roleStr !== 'administrator';
          }
          return true;
        });
        
        console.log(`📊 Showing ${nonAdminUsers.length} non-admin users as customers`);
        customersOnly.push(...nonAdminUsers);
      }
      
      // Fetch all orders
      let allOrders: Order[] = [];
      try {
        allOrders = await orderService.getAllOrders();
      } catch (err) {
        console.warn('⚠️ Could not fetch orders:', err);
      }
      
      // Process and enhance customer data with stats
      const customersWithStats = await Promise.all(
        customersOnly.map(async (customer) => {
          try {
            const customerOrders = allOrders.filter(order => order.userId === customer.id);
            
            const totalOrders = customerOrders.length;
            const totalSpent = customerOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
            const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;
            
            const cancelledOrders = customerOrders.filter(order => 
              order.status === 'cancelled'
            ).length;
            
            const recentOrders = customerOrders
              .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime())
              .slice(0, 5);
            
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
                favoriteCategory: 'Living Room',
                reviewCount: 0,
                returnCount: 0,
                cancellationCount: cancelledOrders
              },
              recentOrders,
              addressSummary
            };
          } catch (err) {
            console.warn(`⚠️ Error processing customer ${customer.id}:`, err);
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

      let filteredCustomers = customersWithStats;

      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredCustomers = filteredCustomers.filter(c => 
          c.fullName?.toLowerCase().includes(searchLower) ||
          c.email?.toLowerCase().includes(searchLower) ||
          c.phoneNumber?.includes(filters.search)
        );
      }

      if (filters.status !== 'all') {
        filteredCustomers = filteredCustomers.filter(c => 
          filters.status === 'active' ? c.isActive : !c.isActive
        );
      }

      if (filters.verified !== 'all') {
        filteredCustomers = filteredCustomers.filter(c => 
          filters.verified === 'verified' ? c.emailConfirmed : !c.emailConfirmed
        );
      }

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

      const totalCustomers = filteredCustomers.length;
      const activeCustomers = filteredCustomers.filter(c => c.isActive).length;
      const verifiedCustomers = filteredCustomers.filter(c => c.emailConfirmed).length;
      
      const newCustomersToday = filteredCustomers.filter(c => {
        const today = new Date().toDateString();
        return new Date(c.createdAt).toDateString() === today;
      }).length;
      
      const totalRevenue = filteredCustomers.reduce((sum, c) => sum + (c.stats?.totalSpent || 0), 0);
      
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

  const handleFilterChange = (key: keyof CustomerFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1
    }));
  };

  const handleSort = (column: CustomerFilters['sortBy']) => {
    setFilters(prev => ({
      ...prev,
      sortBy: column,
      sortOrder: prev.sortBy === column && prev.sortOrder === 'asc' ? 'desc' : 'asc',
      page: 1
    }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({
      ...prev,
      page: newPage
    }));
  };

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

  const handleExport = async () => {
    try {
      setLoading(true);
      
      const dataToExport = selectedCustomers.length > 0 
        ? customers.filter(c => selectedCustomers.includes(c.id))
        : customers;
      
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

  const getStatusColor = (status: boolean) => {
    return status 
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : 'bg-gray-50 text-gray-500 border-gray-200';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getCustomerTier = (totalSpent: number) => {
    if (totalSpent >= 50000) return { name: 'Diamond', color: 'text-purple-600', bg: 'bg-purple-100', icon: Crown };
    if (totalSpent >= 25000) return { name: 'Platinum', color: 'text-indigo-600', bg: 'bg-indigo-100', icon: Award };
    if (totalSpent >= 10000) return { name: 'Gold', color: 'text-amber-600', bg: 'bg-amber-100', icon: Star };
    if (totalSpent >= 5000) return { name: 'Silver', color: 'text-gray-500', bg: 'bg-gray-100', icon: Heart };
    return { name: 'Bronze', color: 'text-orange-600', bg: 'bg-orange-100', icon: Sparkles };
  };

  if (loading && customers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Users className="w-6 h-6 text-indigo-600" />
          </div>
        </div>
        <p className="mt-4 text-sm text-gray-500">Loading customer data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-100 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-100 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
      </div>

      <div className="relative z-10 p-6 md:p-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Customer Management
                </h1>
              </div>
              <p className="text-gray-500 ml-12">
                Manage your customers, track their activity, and build lasting relationships
              </p>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate('/admin/customers/new')}
                className="group relative px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
              >
                <div className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                  <span className="font-medium">Add Customer</span>
                </div>
              </button>
              
              <button
                onClick={handleExport}
                className="px-5 py-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <DownloadCloud className="w-4 h-4 text-gray-600" />
                  <span className="font-medium text-gray-700">Export</span>
                </div>
              </button>
              
              <button
                onClick={fetchCustomers}
                disabled={loading}
                className="px-5 py-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all duration-200 shadow-sm disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid - Enhanced */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <div className="group bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div className="flex items-center gap-1 px-2 py-1 bg-emerald-50 rounded-full">
                <TrendingUp className="w-3 h-3 text-emerald-600" />
                <span className="text-xs font-medium text-emerald-600">+12%</span>
              </div>
            </div>
            <p className="text-sm text-gray-500 mb-1">Total Customers</p>
            <p className="text-2xl font-bold text-gray-900">{quickStats.totalCustomers}</p>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(quickStats.activeCustomers / quickStats.totalCustomers) * 100}%` }}></div>
              </div>
              <span className="text-xs text-gray-400">{quickStats.activeCustomers} active</span>
            </div>
          </div>

          <div className="group bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-md">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <div className="flex items-center gap-1 px-2 py-1 bg-emerald-50 rounded-full">
                <Zap className="w-3 h-3 text-emerald-600" />
                <span className="text-xs font-medium text-emerald-600">LTV: ${quickStats.averageOrderValue.toFixed(0)}</span>
              </div>
            </div>
            <p className="text-sm text-gray-500 mb-1">Total Revenue</p>
            <p className="text-2xl font-bold text-gray-900">${quickStats.totalRevenue.toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-2">From {quickStats.totalCustomers} customers</p>
          </div>

          <div className="group bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-md">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div className="flex items-center gap-1 px-2 py-1 bg-purple-50 rounded-full">
                <Clock className="w-3 h-3 text-purple-600" />
                <span className="text-xs font-medium text-purple-600">+{quickStats.newCustomersToday} today</span>
              </div>
            </div>
            <p className="text-sm text-gray-500 mb-1">Conversion Rate</p>
            <p className="text-2xl font-bold text-gray-900">{quickStats.conversionRate.toFixed(1)}%</p>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full" style={{ width: `${quickStats.conversionRate}%` }}></div>
              </div>
              <span className="text-xs text-gray-400">of customers buy</span>
            </div>
          </div>

          <div className="group bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-md">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div className="flex items-center gap-1 px-2 py-1 bg-emerald-50 rounded-full">
                <CheckCircle className="w-3 h-3 text-emerald-600" />
                <span className="text-xs font-medium text-emerald-600">Verified</span>
              </div>
            </div>
            <p className="text-sm text-gray-500 mb-1">Verified Rate</p>
            <p className="text-2xl font-bold text-gray-900">{quickStats.verifiedRate.toFixed(1)}%</p>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${quickStats.verifiedRate}%` }}></div>
              </div>
              <span className="text-xs text-gray-400">email confirmed</span>
            </div>
          </div>
        </div>

        {/* Filters Bar - Enhanced */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="px-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              <select
                value={filters.verified}
                onChange={(e) => handleFilterChange('verified', e.target.value)}
                className="px-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              >
                <option value="all">All Verification</option>
                <option value="verified">Verified</option>
                <option value="unverified">Unverified</option>
              </select>

              <select
                value={filters.dateRange}
                onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                className="px-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
                <option value="year">Last Year</option>
              </select>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2.5 border rounded-xl flex items-center gap-2 transition-all ${
                  showFilters 
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-600' 
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <Filter className="w-4 h-4" />
                <span className="text-sm">Filters</span>
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-4 animate-slideDown">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <input
                  type="text"
                  placeholder="City, State, or Country"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Min. Orders</label>
                <input
                  type="number"
                  placeholder="Minimum number of orders"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Min. Spent</label>
                <input
                  type="number"
                  placeholder="Minimum amount spent"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Bulk Actions Bar */}
        {selectedCustomers.length > 0 && (
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-4 mb-6 flex items-center justify-between animate-slideDown">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                <Users className="w-4 h-4 text-indigo-600" />
              </div>
              <span className="text-sm font-medium text-indigo-700">
                {selectedCustomers.length} customer{selectedCustomers.length !== 1 ? 's' : ''} selected
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBulkAction('activate')}
                className="px-3 py-1.5 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Activate
              </button>
              <button
                onClick={() => handleBulkAction('deactivate')}
                className="px-3 py-1.5 bg-amber-600 text-white text-sm rounded-lg hover:bg-amber-700 transition-colors"
              >
                Deactivate
              </button>
              <button
                onClick={() => handleBulkAction('email')}
                className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Send Email
              </button>
              <button
                onClick={() => setSelectedCustomers([])}
                className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 animate-slideDown">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}
        
        {success && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3 animate-slideDown">
            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <p className="text-emerald-700 text-sm">{success}</p>
          </div>
        )}

        {/* Customers Table - Enhanced */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                  <th className="px-6 py-4 text-left">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </th>
                  <th className="px-6 py-4 text-left">
                    <button 
                      onClick={() => handleSort('name')}
                      className="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700 transition-colors"
                    >
                      Customer
                      {filters.sortBy === 'name' && (
                        <ArrowUpDown className={`w-3 h-3 transition-transform ${filters.sortOrder === 'desc' ? 'rotate-180' : ''}`} />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left">
                    <button 
                      onClick={() => handleSort('orders')}
                      className="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700 transition-colors"
                    >
                      Orders
                      {filters.sortBy === 'orders' && (
                        <ArrowUpDown className={`w-3 h-3 transition-transform ${filters.sortOrder === 'desc' ? 'rotate-180' : ''}`} />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left">
                    <button 
                      onClick={() => handleSort('spent')}
                      className="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700 transition-colors"
                    >
                      Total Spent
                      {filters.sortBy === 'spent' && (
                        <ArrowUpDown className={`w-3 h-3 transition-transform ${filters.sortOrder === 'desc' ? 'rotate-180' : ''}`} />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left">
                    <button 
                      onClick={() => handleSort('joined')}
                      className="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700 transition-colors"
                    >
                      Joined
                      {filters.sortBy === 'joined' && (
                        <ArrowUpDown className={`w-3 h-3 transition-transform ${filters.sortOrder === 'desc' ? 'rotate-180' : ''}`} />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Tier
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {customers.map((customer) => {
                  const tier = getCustomerTier(customer.stats?.totalSpent || 0);
                  const TierIcon = tier.icon;
                  
                  return (
                    <tr key={customer.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedCustomers.includes(customer.id)}
                          onChange={() => handleSelectCustomer(customer.id)}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center overflow-hidden">
                              {customer.profileImage ? (
                                <img src={customer.profileImage} alt={customer.fullName} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-lg font-semibold text-indigo-600">
                                  {customer.fullName?.charAt(0).toUpperCase() || customer.email.charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                            {customer.isActive && (
                              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900">
                              {customer.fullName || 'No name'}
                            </div>
                            <div className="text-xs text-gray-400">
                              ID: {customer.id.substring(0, 8)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-700">{customer.email}</div>
                        {customer.phoneNumber && (
                          <div className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                            <Phone className="w-3 h-3" />
                            {customer.phoneNumber}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-gray-900">
                          {customer.stats?.totalOrders || 0}
                        </div>
                        {customer.stats?.totalOrders > 0 && (
                          <div className="text-xs text-gray-400">
                            ${customer.stats?.averageOrderValue.toFixed(0)} avg
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-gray-900">
                          ${customer.stats?.totalSpent.toLocaleString()}
                        </div>
                        {customer.stats?.lastOrderDate && (
                          <div className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(customer.stats.lastOrderDate)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-700">
                          {formatDate(customer.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(customer.isActive)}`}>
                            {customer.isActive ? (
                              <>
                                <CheckCircle className="w-3 h-3" />
                                Active
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3" />
                                Inactive
                              </>
                            )}
                          </span>
                          {customer.emailConfirmed && (
                            <span className="inline-flex items-center gap-1 text-xs text-blue-600">
                              <Shield className="w-3 h-3" />
                              Verified
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${tier.bg} ${tier.color}`}>
                          <TierIcon className="w-3 h-3" />
                          {tier.name}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => navigate(`/admin/customers/${customer.id}`)}
                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/admin/customers/edit/${customer.id}`)}
                            className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-200"
                            title="Edit Customer"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedCustomer(customer);
                              setShowDeleteModal(true);
                            }}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                            title="Delete Customer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {customers.length === 0 && (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No customers found</h3>
              <p className="text-gray-500 mb-6">Try adjusting your filters or add a new customer</p>
              <button
                onClick={() => navigate('/admin/customers/new')}
                className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all"
              >
                <div className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  Add Customer
                </div>
              </button>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to{' '}
                {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of{' '}
                {pagination.totalItems} results
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={!pagination.hasPrevious}
                  className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex gap-1">
                  {(() => {
                    const pageNumbers: number[] = [];
                    const totalPages = pagination.totalPages;
                    const currentPage = pagination.currentPage;
                    
                    if (totalPages <= 5) {
                      for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
                    } else if (currentPage <= 3) {
                      for (let i = 1; i <= 5; i++) pageNumbers.push(i);
                    } else if (currentPage >= totalPages - 2) {
                      for (let i = totalPages - 4; i <= totalPages; i++) pageNumbers.push(i);
                    } else {
                      for (let i = currentPage - 2; i <= currentPage + 2; i++) pageNumbers.push(i);
                    }
                    
                    return pageNumbers.map((pageNum) => (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                          pagination.currentPage === pageNum
                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        {pageNum}
                      </button>
                    ));
                  })()}
                </div>
                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={!pagination.hasNext}
                  className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Customer Details Modal - Keep existing modal code */}
      {/* Delete Confirmation Modal - Keep existing modal code */}
    </div>
  );
};

export default CustomerManagement;