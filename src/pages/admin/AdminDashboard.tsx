import React, { useState, useEffect, useCallback } from 'react';
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
  RefreshCw,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  BarChart3,
  Download,
  Search,
  ShoppingBag,
  CreditCard,
  Truck,
  Star,
  Loader,
  Folder,
  ChevronRight,
  Calendar,
  Award,
  Crown,
  ArrowUp,
  ArrowDown,
  Percent,
  Wallet,
  Smartphone,
  Zap
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
  todayRevenue: number;
  todayOrders: number;
  lowStockCount: number;
  pendingApproval: number;
}

interface OrderWithDetails extends Order {
  customerName?: string;
  customerEmail?: string;
  itemCount?: number;
  approvedBy?: string;
}

interface ProductWithStats extends Product {
  salesCount: number;
  revenue: number;
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
    conversionRate: 0,
    todayRevenue: 0,
    todayOrders: 0,
    lowStockCount: 0,
    pendingApproval: 0
  });

  const [recentOrders, setRecentOrders] = useState<OrderWithDetails[]>([]);
  const [topProducts, setTopProducts] = useState<ProductWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState('week');
  const [searchQuery, setSearchQuery] = useState('');

  const timeRanges = [
    { label: 'Today', value: 'today' },
    { label: 'This Week', value: 'week' },
    { label: 'This Month', value: 'month' },
    { label: 'This Year', value: 'year' }
  ];

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      console.log('📊 Fetching dashboard data...');
      
      // Fetch all data in parallel
      const [ordersResponse, products, users] = await Promise.all([
        orderService.getMyOrders(1, 100).catch(() => ({ orders: [] })),
        productService.getProducts().catch(() => []),
        userService.getAllUsers().catch(() => [])
      ]);

      const orders = (ordersResponse as { orders: Order[] })?.orders || [];
      const today = new Date().toDateString();
      
      // Calculate real stats
      const totalOrders = orders.length;
      const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
      const todayRevenue = orders
        .filter(order => new Date(order.orderDate).toDateString() === today)
        .reduce((sum, order) => sum + (order.totalAmount || 0), 0);
      
      const pendingOrders = orders.filter(order => order.status?.toLowerCase() === 'pending').length;
      const deliveredOrders = orders.filter(order => order.status?.toLowerCase() === 'delivered').length;
      const cancelledOrders = orders.filter(order => order.status?.toLowerCase() === 'cancelled').length;
      const todayOrders = orders.filter(order => new Date(order.orderDate).toDateString() === today).length;
      const pendingApproval = orders.filter(order => 
        order.paymentStatus === 'pending' && order.paymentMethod !== 'cod'
      ).length;
      
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      const lowStockCount = products.filter(p => p.stockQuantity > 0 && p.stockQuantity < 10).length;
      
      // Calculate product sales
      const productSales = new Map<string, number>();
      const productRevenue = new Map<string, number>();

      orders.forEach(order => {
        if (order.items) {
          order.items.forEach((item: OrderItem) => {
            const productId = item.productId.toString();
            productSales.set(productId, (productSales.get(productId) || 0) + item.quantity);
            const itemPrice = item.price || item.unitPrice || 0;
            productRevenue.set(productId, (productRevenue.get(productId) || 0) + (item.quantity * itemPrice));
          });
        }
      });

      // Calculate top products
      const productsWithStats: ProductWithStats[] = products.map(product => ({
        ...product,
        salesCount: productSales.get(product.id.toString()) || 0,
        revenue: productRevenue.get(product.id.toString()) || 0,
      }));

      const sortedProducts = [...productsWithStats]
        .sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0))
        .slice(0, 5);

      // Process orders with customer details
      const ordersWithDetails: OrderWithDetails[] = orders.slice(0, 5).map(order => {
        const customer = users.find((u: User) => u.id === order.userId);
        return {
          ...order,
          customerName: customer?.fullName || 'Guest Customer',
          customerEmail: customer?.email || order.customerEmail || 'guest@example.com',
          itemCount: order.items?.length || 0,
          paymentMethod: order.paymentMethod || 'Credit Card'
        };
      });

      setStats({
        totalRevenue,
        totalOrders,
        totalUsers: users.length,
        totalProducts: products.length,
        pendingOrders,
        deliveredOrders,
        cancelledOrders,
        averageOrderValue,
        conversionRate: users.length > 0 ? (totalOrders / users.length) * 100 : 0,
        todayRevenue,
        todayOrders,
        lowStockCount,
        pendingApproval
      });

      setRecentOrders(ordersWithDetails);
      setTopProducts(sortedProducts);
      
    } catch (err: any) {
      console.error('❌ Dashboard error:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-PH').format(num);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader className="w-12 h-12 text-red-600 animate-spin mb-4" />
        <p className="text-gray-600">Loading dashboard data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back, {user?.fullName || user?.email}</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="flex items-center space-x-2 bg-white rounded-lg border border-gray-200 px-3 py-2">
            <Calendar className="w-4 h-4 text-gray-500" />
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
          
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
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
            <div className="p-2 bg-red-50 rounded-lg">
              <DollarSign className="w-6 h-6 text-red-600" />
            </div>
            <span className="text-xs text-gray-500">This {timeRange}</span>
          </div>
          <p className="text-sm font-medium text-gray-600">Total Revenue</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {formatCurrency(stats.totalRevenue)}
          </p>
          <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between">
            <p className="text-xs text-gray-500">Today: {formatCurrency(stats.todayRevenue)}</p>
            <p className="text-xs text-gray-500">Avg: {formatCurrency(stats.averageOrderValue)}</p>
          </div>
        </div>

        {/* Orders Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-orange-50 rounded-lg">
              <ShoppingCart className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <p className="text-sm font-medium text-gray-600">Total Orders</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatNumber(stats.totalOrders)}</p>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex justify-between text-xs">
              <div>
                <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full mr-1"></span>
                <span className="text-gray-600">Pending: {stats.pendingOrders}</span>
              </div>
              <div>
                <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                <span className="text-gray-600">Delivered: {stats.deliveredOrders}</span>
              </div>
            </div>
            <div className="flex justify-between text-xs mt-2">
              <div>
                <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
                <span className="text-gray-600">Today: {stats.todayOrders}</span>
              </div>
              <div>
                <span className="inline-block w-2 h-2 bg-purple-500 rounded-full mr-1"></span>
                <span className="text-gray-600">Approval: {stats.pendingApproval}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Customers Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-50 rounded-lg">
              <Users className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="text-sm font-medium text-gray-600">Total Customers</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatNumber(stats.totalUsers)}</p>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              <span className="font-medium text-green-600">{stats.conversionRate.toFixed(1)}%</span> conversion rate
            </p>
          </div>
        </div>

        {/* Products Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <p className="text-sm font-medium text-gray-600">Total Products</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatNumber(stats.totalProducts)}</p>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              <span className="font-medium text-yellow-600">{stats.lowStockCount}</span> low stock items
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
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center mr-3">
                          <ShoppingBag className="w-4 h-4 text-red-600" />
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
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(order.totalAmount || 0)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center w-fit ${getStatusColor(order.status || '')}`}>
                        {getStatusIcon(order.status || '')}
                        <span className="ml-1 capitalize">{order.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => navigate(`/admin/orders/${order.id}`)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {recentOrders.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No recent orders</p>
              </div>
            ) : (
              <div className="p-4 border-t border-gray-200">
                <button 
                  onClick={() => navigate('/admin/orders')}
                  className="w-full py-2 text-center text-red-600 hover:text-red-800 text-sm font-medium flex items-center justify-center"
                >
                  View all orders
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
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
                    <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center font-bold text-red-600">
                      #{index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                        <span className="text-sm font-bold text-gray-900">{formatCurrency(product.price)}</span>
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
                        <span className="text-xs text-gray-500">{product.salesCount} sold</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button 
                onClick={() => navigate('/admin/products')}
                className="w-full mt-4 py-2 text-center text-red-600 hover:text-red-800 text-sm font-medium flex items-center justify-center"
              >
                View all products
                <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-yellow-50 rounded-lg flex items-center justify-center mr-3">
                    <Clock className="w-4 h-4 text-yellow-600" />
                  </div>
                  <span className="text-sm text-gray-600">Pending Approval</span>
                </div>
                <span className="font-semibold text-gray-900">{stats.pendingApproval}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center mr-3">
                    <Package className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-sm text-gray-600">Low Stock Items</span>
                </div>
                <span className="font-semibold text-yellow-600">{stats.lowStockCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center mr-3">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-sm text-gray-600">Conversion Rate</span>
                </div>
                <span className="font-semibold text-green-600">{stats.conversionRate.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { icon: Package, label: 'Add Product', path: '/admin/products/new', color: 'bg-red-50 text-red-600' },
            { icon: Folder, label: 'Categories', path: '/admin/categories', color: 'bg-orange-50 text-orange-600' },
            { icon: ShoppingCart, label: 'Orders', path: '/admin/orders', color: 'bg-green-50 text-green-600' },
            { icon: Users, label: 'Customers', path: '/admin/customers', color: 'bg-blue-50 text-blue-600' },
            { icon: Award, label: 'Analytics', path: '/admin/analytics', color: 'bg-purple-50 text-purple-600' },
            { icon: Crown, label: 'Admins', path: '/admin/admins', color: 'bg-yellow-50 text-yellow-600' },
          ].map((action) => (
            <button
              key={action.label}
              onClick={() => navigate(action.path)}
              className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-xl hover:shadow-md transition-all hover:scale-[1.02] group"
            >
              <div className={`p-3 ${action.color} rounded-lg mb-2 group-hover:scale-110 transition-transform`}>
                <action.icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium text-gray-700">{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;