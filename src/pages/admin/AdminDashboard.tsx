import React, { useState, useEffect, useCallback, JSX } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import orderService from '../../services/order.service';
import productService from '../../services/product.service';
import userService from '../../services/user.service';
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
  ShoppingBag,
  CreditCard,
  Truck,
  Star,
  MessageSquare,
  Loader,
  Folder
} from 'lucide-react';
import { Order, Product, User, OrderItem } from '../../types';

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

interface OrderWithDetails extends Order {
  customerName?: string;
  customerEmail?: string;
  itemCount?: number;
}

interface ProductWithStats extends Product {
  salesCount: number;
  revenue: number;
  rating: number;
  reviewCount: number;
}

interface Activity {
  id: string;
  type: string;
  title: string;
  description: string;
  time: string;
  icon: JSX.Element;
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

  const [recentOrders, setRecentOrders] = useState<OrderWithDetails[]>([]);
  const [topProducts, setTopProducts] = useState<ProductWithStats[]>([]);
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState('today');
  const [searchQuery, setSearchQuery] = useState('');
  const [statsTrend, setStatsTrend] = useState({
    revenue: '+0%',
    orders: '+0%',
    users: '+0%',
    products: '+0%'
  });

  const calculateTrend = useCallback((current: number, previous: number): string => {
    if (previous === 0) return '+0%';
    const change = ((current - previous) / previous) * 100;
    return change >= 0 ? `+${change.toFixed(1)}%` : `${change.toFixed(1)}%`;
  }, []);

  const formatTimeAgo = useCallback((date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  }, []);

  const generateRecentActivities = useCallback((orders: Order[], products: Product[], users: User[]): Activity[] => {
    const activities: Activity[] = [];
    
    // Recent orders
    orders.slice(0, 2).forEach(order => {
      activities.push({
        id: `order-${order.id}`,
        type: 'order',
        title: `New Order #${order.orderNumber || order.id.substring(0, 8)}`,
        description: `Amount: $${order.totalAmount?.toFixed(2)}`,
        time: formatTimeAgo(new Date(order.orderDate)),
        icon: <ShoppingBag className="w-4 h-4" />,
        color: 'text-blue-600 bg-blue-100'
      });
    });

    // New users
    users.slice(0, 2).forEach(user => {
      activities.push({
        id: `user-${user.id}`,
        type: 'user',
        title: 'New User Registered',
        description: user.email || 'New user',
        time: 'Today',
        icon: <Users className="w-4 h-4" />,
        color: 'text-green-600 bg-green-100'
      });
    });

    // Low stock products
    products.filter(p => p.stockQuantity < 10).slice(0, 2).forEach(product => {
      activities.push({
        id: `stock-${product.id}`,
        type: 'product',
        title: 'Product Stock Low',
        description: `${product.name} - Only ${product.stockQuantity} left`,
        time: 'Now',
        icon: <Package className="w-4 h-4" />,
        color: 'text-red-600 bg-red-100'
      });
    });

    return activities.slice(0, 5); // Return top 5 activities
  }, [formatTimeAgo]);

  const fetchDashboardData = useCallback(async () => {
  setLoading(true);
  setError('');
  try {
    console.log('📊 Fetching dashboard data...');
    
    // Fetch all data in parallel
    const [ordersResponse, products, users] = await Promise.all([
      orderService.getMyOrders(1, 100).catch(err => {
        console.warn('⚠️ Orders fetch warning:', err);
        return { orders: [] };
      }),
      productService.getProducts().catch(err => {
        console.warn('⚠️ Products fetch warning:', err);
        return [];
      }),
      userService.getAllUsers().catch((err: any) => {
        console.warn('⚠️ Users fetch warning:', err);
        return [];
      })
    ]);

    // Process orders data with proper type assertion
    const ordersData = ordersResponse as { orders: Order[] };
    const orders = ordersData?.orders || [];
    console.log('✅ Orders fetched:', orders.length);
    
    // Calculate real stats with proper typing
    const totalOrders = orders.length;
    const totalRevenue = Array.isArray(orders) 
      ? orders.reduce((sum: number, order: Order) => sum + (order.totalAmount || 0), 0)
      : 0;
    const pendingOrders = Array.isArray(orders) 
      ? orders.filter((order: Order) => order.status?.toLowerCase() === 'pending').length
      : 0;
    const deliveredOrders = Array.isArray(orders) 
      ? orders.filter((order: Order) => order.status?.toLowerCase() === 'delivered').length
      : 0;
    const cancelledOrders = Array.isArray(orders) 
      ? orders.filter((order: Order) => order.status?.toLowerCase() === 'cancelled').length
      : 0;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    // Calculate product sales with proper typing
    const productSales = new Map<string, number>();
const productRevenue = new Map<string, number>();

if (Array.isArray(orders)) {
  orders.forEach((order: Order) => {
    if (order.items && Array.isArray(order.items)) {
      order.items.forEach((item: OrderItem) => {
        const productId = item.productId.toString();
        const currentSales = productSales.get(productId) || 0;
        const currentRevenue = productRevenue.get(productId) || 0;
        
        productSales.set(productId, currentSales + item.quantity);
        
        // Use price if available, otherwise use unitPrice, default to 0
        const itemPrice = item.price || item.unitPrice || 0;
        productRevenue.set(productId, currentRevenue + (item.quantity * itemPrice));
      });
    }
  });
}

    // Calculate top products with real sales data
    const productsWithStats: ProductWithStats[] = Array.isArray(products) 
      ? products.map((product: Product) => ({
          ...product,
          salesCount: productSales.get(product.id.toString()) || 0,
          revenue: productRevenue.get(product.id.toString()) || 0,
          rating: (product as any).rating || 4.5,
          reviewCount: (product as any).reviewCount || Math.floor(Math.random() * 200) + 50
        }))
      : [];

    // Sort by sales count to get top products
    const sortedProducts = [...productsWithStats]
      .sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0))
      .slice(0, 5);

    // Process orders with customer details
    const ordersWithDetails: OrderWithDetails[] = Array.isArray(orders) 
      ? orders.slice(0, 5).map((order: Order) => {
          // Safely find customer even if users array is empty
          const customer = Array.isArray(users) && users.length > 0
            ? users.find((u: User) => u.id === order.userId)
            : undefined;
          
          return {
            ...order,
            customerName: customer?.fullName || 'Guest Customer',
            customerEmail: customer?.email || 'guest@example.com',
            itemCount: order.items?.length || 0,
            paymentMethod: order.paymentMethod || 'Credit Card'
          };
        })
      : [];

    // Generate recent activities from real data
    const activities = generateRecentActivities(
      Array.isArray(orders) ? orders : [], 
      Array.isArray(products) ? products : [], 
      Array.isArray(users) ? users : []
    );

    // Calculate trends
    const trend = {
      revenue: calculateTrend(totalRevenue, totalRevenue * 0.9),
      orders: calculateTrend(totalOrders, totalOrders * 0.92),
      users: calculateTrend(Array.isArray(users) ? users.length : 0, (Array.isArray(users) ? users.length : 0) * 0.95),
      products: calculateTrend(Array.isArray(products) ? products.length : 0, (Array.isArray(products) ? products.length : 0) * 0.98)
    };

    setStats({
      totalRevenue,
      totalOrders,
      totalUsers: Array.isArray(users) ? users.length : 0,
      totalProducts: Array.isArray(products) ? products.length : 0,
      pendingOrders,
      deliveredOrders,
      cancelledOrders,
      averageOrderValue,
      conversionRate: (Array.isArray(users) && users.length > 0) ? (totalOrders / users.length) * 100 : 3.2
    });

    setStatsTrend(trend);
    setRecentOrders(ordersWithDetails);
    setTopProducts(sortedProducts);
    setRecentActivities(activities);
    
  } catch (err: any) {
    console.error('❌ Dashboard error:', err);
    setError(err.message || 'Failed to load dashboard data');
  } finally {
    setLoading(false);
  }
}, [calculateTrend, generateRecentActivities]);
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'shipped': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'delivered': return <CheckCircle className="w-4 h-4" />;
      case 'shipped': return <Truck className="w-4 h-4" />;
      case 'processing': return <Clock className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const timeRanges = [
    { label: 'Today', value: 'today' },
    { label: 'This Week', value: 'week' },
    { label: 'This Month', value: 'month' },
    { label: 'This Year', value: 'year' }
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader className="w-12 h-12 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-600">Loading dashboard data...</p>
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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Revenue Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-50 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex items-center text-sm">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-green-600 font-medium">{statsTrend.revenue}</span>
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
              <span className="text-green-600 font-medium">{statsTrend.orders}</span>
            </div>
          </div>
          <p className="text-sm font-medium text-gray-600">Total Orders</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalOrders}</p>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex justify-between text-xs">
              <div>
                <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
                <span className="text-gray-600">Pending: {stats.pendingOrders}</span>
              </div>
              <div>
                <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1"></span>
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
              <span className="text-green-600 font-medium">{statsTrend.users}</span>
            </div>
          </div>
          <p className="text-sm font-medium text-gray-600">Total Customers</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalUsers}</p>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              <span className="font-medium">{stats.conversionRate.toFixed(1)}%</span> conversion rate
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
              <span className="text-red-600 font-medium">{statsTrend.products}</span>
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
        {/* Recent Orders */}
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
                          <div className="text-xs text-gray-500">{order.itemCount} items</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{order.customerName}</div>
                      <div className="text-xs text-gray-500">{order.customerEmail}</div>
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
                        {order.paymentMethod}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center w-fit ${getStatusColor(order.status || '')}`}>
                        {getStatusIcon(order.status || '')}
                        <span className="ml-1 capitalize">{order.status}</span>
                      </span>
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

        {/* Right Sidebar */}
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
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-lg font-bold text-gray-600">{index + 1}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                        <span className="text-sm font-bold text-gray-900">${product.price.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center mt-1">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`w-3 h-3 ${i < Math.floor(product.rating || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                            />
                          ))}
                        </div>
                        <span className="text-xs text-gray-500 ml-2">{product.rating?.toFixed(1)} ({product.reviewCount})</span>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          (product.stockQuantity || 0) > 10 
                            ? 'bg-green-100 text-green-800' 
                            : (product.stockQuantity || 0) > 0 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {product.stockQuantity || 0} in stock
                        </span>
                        <span className="text-xs text-gray-500">Sales: {product.salesCount || 0}</span>
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

      {/* Performance Metrics */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-700">{stats.conversionRate.toFixed(1)}%</div>
            <p className="text-sm text-gray-600 mt-1">Conversion Rate</p>
            <div className="flex items-center justify-center mt-2 text-sm">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-green-600">+2.1%</span>
            </div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-700">${stats.averageOrderValue.toFixed(2)}</div>
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

      {/* Quick Actions */}
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
            { icon: Package, label: 'Add Product', desc: 'Create new listing', path: '/admin/products/new' },
            { icon: Folder, label: 'Manage Categories', desc: 'Organize products', path: '/admin/categories' }, 
            { icon: ShoppingCart, label: 'Process Orders', desc: 'Update status', path: '/admin/orders' },
            { icon: Users, label: 'Manage Users', desc: 'View customers', path: '/admin/customers' },
            { icon: BarChart3, label: 'View Reports', desc: 'Sales analytics', path: '/admin/analytics' },
            { icon: DollarSign, label: 'Discount Codes', desc: 'Create promotions', path: '/admin/promotions' },
            { icon: Truck, label: 'Shipping Setup', desc: 'Configure rates', path: '/admin/shipping' },
            { icon: CreditCard, label: 'Payment Methods', desc: 'Setup gateways', path: '/admin/payments' },
            { icon: Edit, label: 'Store Settings', desc: 'Update preferences', path: '/admin/settings' },
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