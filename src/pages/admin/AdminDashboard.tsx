import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import orderService from '../../services/order.service';
import productService from '../../services/product.service';
import { 
  ShoppingCart, 
  Users, 
  Package, 
  DollarSign, 
  Eye, 
  Edit, 
  RefreshCw,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  BarChart3,
  Download,
  Filter,
  Search,
  MoreVertical,
  ShoppingBag,
  CreditCard,
  Truck,
  Star,
  MessageSquare
} from 'lucide-react';
import { Order, Product } from '../../types';

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalUsers: number;
  totalProducts: number;
  pendingOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  averageOrderValue: number;
  conversionRate: number;
}

interface RecentActivity {
  id: string;
  type: 'order' | 'user' | 'product' | 'review';
  title: string;
  description: string;
  time: string;
  icon: React.ReactNode;
  color: string;
}

const AdminDashboard = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  
  // Redirect if not admin
  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
    }
  }, [isAdmin, navigate]);

  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalProducts: 0,
    pendingOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
    averageOrderValue: 0,
    conversionRate: 0
  });

  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [topProducts, setTopProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState('today');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch orders
      const ordersData = await orderService.getMyOrders(1, 100);
      const products = await productService.getProducts();
      
      // Calculate stats
      const totalOrders = ordersData.orders?.length || 0;
      const totalRevenue = ordersData.orders?.reduce((sum, order) => sum + (order.totalAmount || 0), 0) || 0;
      const pendingOrders = ordersData.orders?.filter(order => order.status === 'pending').length || 0;
      const deliveredOrders = ordersData.orders?.filter(order => order.status === 'delivered').length || 0;
      const cancelledOrders = ordersData.orders?.filter(order => order.status === 'cancelled').length || 0;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      
      // Mock user count (you'll need to implement this)
      const totalUsers = 42; // Replace with actual userService.getUsersCount()
      
      // Simulate top products (sort by price for demo)
      const sortedProducts = [...products].sort((a, b) => b.price - a.price).slice(0, 3);
      
      setStats({
        totalRevenue,
        totalOrders,
        totalUsers,
        totalProducts: products.length || 0,
        pendingOrders,
        deliveredOrders,
        cancelledOrders,
        averageOrderValue,
        conversionRate: 3.2 // Mock conversion rate
      });

      // Set recent data
      setRecentOrders(ordersData.orders?.slice(0, 5) || []);
      setTopProducts(sortedProducts);
      
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'shipped': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered': return <CheckCircle className="w-4 h-4" />;
      case 'shipped': return <Truck className="w-4 h-4" />;
      case 'processing': return <Clock className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const recentActivities: RecentActivity[] = [
    {
      id: '1',
      type: 'order',
      title: 'New Order #ORD-78912',
      description: 'Customer: John Doe • Amount: $129.99',
      time: '2 minutes ago',
      icon: <ShoppingBag className="w-4 h-4" />,
      color: 'text-blue-600 bg-blue-100'
    },
    {
      id: '2',
      type: 'user',
      title: 'New User Registered',
      description: 'Email: sarah@example.com',
      time: '15 minutes ago',
      icon: <Users className="w-4 h-4" />,
      color: 'text-green-600 bg-green-100'
    },
    {
      id: '3',
      type: 'review',
      title: 'New Product Review',
      description: 'Wireless Headphones • Rating: 5 stars',
      time: '1 hour ago',
      icon: <Star className="w-4 h-4" />,
      color: 'text-yellow-600 bg-yellow-100'
    },
    {
      id: '4',
      type: 'product',
      title: 'Product Stock Low',
      description: 'iPhone Case • Only 3 items left',
      time: '3 hours ago',
      icon: <Package className="w-4 h-4" />,
      color: 'text-red-600 bg-red-100'
    }
  ];

  const timeRanges = [
    { label: 'Today', value: 'today' },
    { label: 'This Week', value: 'week' },
    { label: 'This Month', value: 'month' },
    { label: 'This Year', value: 'year' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Header with Search and Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-600 mt-1">Welcome back, {user?.fullName || user?.email}</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          {/* Time Range Selector */}
          <div className="flex items-center space-x-2 bg-white rounded-lg border border-gray-200 px-3 py-2">
            <BarChart3 className="w-4 h-4 text-gray-500" />
            <select 
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="bg-transparent text-sm focus:outline-none"
            >
              {timeRanges.map(range => (
                <option key={range.value} value={range.value}>{range.label}</option>
              ))}
            </select>
          </div>
          
          {/* Export Button */}
          <button className="flex items-center justify-center px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4 mr-2" />
            <span className="text-sm font-medium">Export</span>
          </button>
          
          {/* Refresh Button */}
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium">Refresh</span>
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
          <AlertCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5" />
          <div>
            <p className="text-red-700 font-medium">Error loading dashboard</p>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Stats Grid - Enhanced */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Revenue Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-50 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex items-center text-sm">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-green-600 font-medium">+12.5%</span>
            </div>
          </div>
          <p className="text-sm font-medium text-gray-600">Total Revenue</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            ${stats.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500">Average Order: ${stats.averageOrderValue.toFixed(2)}</p>
          </div>
        </div>

        {/* Orders Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-50 rounded-lg">
              <ShoppingCart className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex items-center text-sm">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-green-600 font-medium">+8.2%</span>
            </div>
          </div>
          <p className="text-sm font-medium text-gray-600">Total Orders</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalOrders}</p>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex justify-between text-xs">
              <div>
                <div className="w-2 h-2 bg-blue-500 rounded-full inline-block mr-1"></div>
                <span className="text-gray-600">Pending: {stats.pendingOrders}</span>
              </div>
              <div>
                <div className="w-2 h-2 bg-green-500 rounded-full inline-block mr-1"></div>
                <span className="text-gray-600">Delivered: {stats.deliveredOrders}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Users Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex items-center text-sm">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-green-600 font-medium">+5.7%</span>
            </div>
          </div>
          <p className="text-sm font-medium text-gray-600">Total Customers</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalUsers}</p>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              <span className="font-medium">{stats.conversionRate}%</span> conversion rate
            </p>
          </div>
        </div>

        {/* Products Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-orange-50 rounded-lg">
              <Package className="w-6 h-6 text-orange-600" />
            </div>
            <div className="flex items-center text-sm">
              <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
              <span className="text-red-600 font-medium">-2.3%</span>
            </div>
          </div>
          <p className="text-sm font-medium text-gray-600">Total Products</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalProducts}</p>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              <span className="font-medium">{topProducts.length}</span> top sellers
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Recent Orders (2/3 width on large screens) */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
              <p className="text-sm text-gray-500 mt-1">Latest customer orders</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50">
                <Filter className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center mr-3">
                          <ShoppingBag className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            #{order.orderNumber || order.id.substring(0, 8)}
                          </div>
                          <div className="text-xs text-gray-500">2 items</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">John Doe</div>
                      <div className="text-xs text-gray-500">john@example.com</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {new Date(order.orderDate).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(order.orderDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        ${order.totalAmount?.toFixed(2) || '0.00'}
                      </div>
                      <div className="text-xs text-gray-500">
                        <CreditCard className="w-3 h-3 inline mr-1" />
                        Credit Card
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)}
                          <span className="ml-1 capitalize">{order.status}</span>
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => navigate(`/admin/orders/${order.id}`)}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/admin/orders/edit/${order.id}`)}
                          className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Edit Order"
                        >
                          <Edit className="w-4 h-4" />
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
            {recentOrders.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No recent orders</p>
                <button 
                  onClick={() => navigate('/admin/orders')}
                  className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  View all orders →
                </button>
              </div>
            ) : (
              <div className="p-4 border-t border-gray-200">
                <button 
                  onClick={() => navigate('/admin/orders')}
                  className="w-full py-2 text-center text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  View all orders →
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Recent Activity & Top Products */}
        <div className="space-y-6">
          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
              <p className="text-sm text-gray-500 mt-1">Latest system activities</p>
            </div>
            <div className="p-4">
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className={`p-2 rounded-lg ${activity.color}`}>
                      {activity.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                      <p className="text-xs text-gray-500 mt-1">{activity.description}</p>
                      <p className="text-xs text-gray-400 mt-2">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 py-2 text-center text-blue-600 hover:text-blue-800 text-sm font-medium">
                View all activities →
              </button>
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Top Products</h2>
              <p className="text-sm text-gray-500 mt-1">Best selling items</p>
            </div>
            <div className="p-4">
              <div className="space-y-4">
                {topProducts.map((product, index) => (
                  <div key={product.id} className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <span className="text-lg font-bold text-gray-600">{index + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                        <span className="text-sm font-bold text-gray-900">${product.price.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center mt-1">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-3 h-3 text-yellow-400 fill-current" />
                          ))}
                        </div>
                        <span className="text-xs text-gray-500 ml-2">4.8 (128)</span>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          product.stockQuantity > 10 
                            ? 'bg-green-100 text-green-800' 
                            : product.stockQuantity > 0 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {product.stockQuantity} in stock
                        </span>
                        <span className="text-xs text-gray-500">Sales: 1,234</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button 
                onClick={() => navigate('/admin/products')}
                className="w-full mt-4 py-2 text-center text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                View all products →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-700">{stats.conversionRate}%</div>
            <p className="text-sm text-gray-600 mt-1">Conversion Rate</p>
            <div className="flex items-center justify-center mt-2 text-sm">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-green-600">+2.1%</span>
            </div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-700">{stats.averageOrderValue.toFixed(2)}</div>
            <p className="text-sm text-gray-600 mt-1">Avg. Order Value</p>
            <div className="flex items-center justify-center mt-2 text-sm">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-green-600">+5.3%</span>
            </div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-700">24h</div>
            <p className="text-sm text-gray-600 mt-1">Avg. Delivery Time</p>
            <div className="flex items-center justify-center mt-2 text-sm">
              <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
              <span className="text-red-600">-1.2h</span>
            </div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-700">96%</div>
            <p className="text-sm text-gray-600 mt-1">Customer Satisfaction</p>
            <div className="flex items-center justify-center mt-2 text-sm">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-green-600">+0.8%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions - Enhanced */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
            <p className="text-sm text-gray-500 mt-1">Common admin tasks</p>
          </div>
          <MessageSquare className="w-5 h-5 text-gray-400" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Package, label: 'Add Product', desc: 'Create new listing', color: 'blue', path: '/admin/products/new' },
            { icon: ShoppingCart, label: 'Process Orders', desc: 'Update status', color: 'green', path: '/admin/orders' },
            { icon: Users, label: 'Manage Users', desc: 'View customers', color: 'purple', path: '/admin/users' },
            { icon: BarChart3, label: 'View Reports', desc: 'Sales analytics', color: 'orange', path: '/admin/analytics' },
            { icon: DollarSign, label: 'Discount Codes', desc: 'Create promotions', color: 'red', path: '/admin/promotions' },
            { icon: Truck, label: 'Shipping Setup', desc: 'Configure rates', color: 'indigo', path: '/admin/shipping' },
            { icon: CreditCard, label: 'Payment Methods', desc: 'Setup gateways', color: 'pink', path: '/admin/payments' },
            { icon: Edit, label: 'Store Settings', desc: 'Update preferences', color: 'gray', path: '/admin/settings' },
          ].map((action) => (
            <button
              key={action.label}
              onClick={() => navigate(action.path)}
              className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all hover:scale-[1.02] group"
            >
              <div className="p-3 bg-blue-100 rounded-lg mb-3 group-hover:bg-blue-200 transition-colors">
                <action.icon className="w-6 h-6 text-blue-600" />
              </div>
              <span className="font-medium text-gray-900 text-sm">{action.label}</span>
              <span className="text-xs text-gray-500 mt-1">{action.desc}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;