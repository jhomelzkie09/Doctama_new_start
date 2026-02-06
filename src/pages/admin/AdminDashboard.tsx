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
  Trash2, 
  RefreshCw,
  TrendingUp,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import { Order, Product } from '../../types';

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalUsers: number;
  totalProducts: number;
  pendingOrders: number;
  deliveredOrders: number;
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
    deliveredOrders: 0
  });

  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      // OPTION 1: If you need to implement getOrderStats, add this to your order.service.ts:
      // getOrderStats: async (): Promise<{totalOrders: number, totalRevenue: number, pendingOrders: number, deliveredOrders: number}> => {
      //   const response = await axios.get(`${API_URL}/orders/stats`);
      //   return response.data;
      // }
      
      // For now, we'll fetch data differently:
      const ordersData = await orderService.getMyOrders(1, 100); // Get more orders to calculate stats
      const products = await productService.getProducts(); // No arguments if your service doesn't accept them
      
      // Calculate stats from the data
      const totalOrders = ordersData.orders?.length || 0;
      const totalRevenue = ordersData.orders?.reduce((sum, order) => sum + (order.totalAmount || 0), 0) || 0;
      const pendingOrders = ordersData.orders?.filter(order => order.status === 'pending').length || 0;
      const deliveredOrders = ordersData.orders?.filter(order => order.status === 'delivered').length || 0;
      
      setStats({
        totalRevenue,
        totalOrders,
        totalUsers: 0, // You'll need to implement userService.getUsersCount()
        totalProducts: products.length || 0,
        pendingOrders,
        deliveredOrders
      });

      // Set recent orders (first 5)
      setRecentOrders(ordersData.orders?.slice(0, 5) || []);
      
      // Set recent products (first 5)
      setRecentProducts(products.slice(0, 5) || []);
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
      case 'shipped': return <Package className="w-4 h-4" />;
      case 'processing': return <Clock className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back, {user?.fullName}</p>
        </div>
        <button
          onClick={fetchDashboardData}
          disabled={loading}
          className="mt-4 md:mt-0 flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Revenue Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                ${stats.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <div className="flex items-center mt-2">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">+12.5%</span>
                <span className="text-sm text-gray-500 ml-2">from last month</span>
              </div>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Orders Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{stats.totalOrders}</p>
              <div className="flex space-x-4 mt-2">
                <div>
                  <p className="text-sm text-gray-500">Pending</p>
                  <p className="text-sm font-medium">{stats.pendingOrders}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Delivered</p>
                  <p className="text-sm font-medium">{stats.deliveredOrders}</p>
                </div>
              </div>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <ShoppingCart className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Users Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{stats.totalUsers}</p>
              <p className="text-sm text-gray-500 mt-2">Registered customers</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Products Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Products</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{stats.totalProducts}</p>
              <p className="text-sm text-gray-500 mt-2">Active in store</p>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <Package className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders and Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Recent Orders */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
              <button
                onClick={() => navigate('/admin/orders')}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                View all →
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order #</th>
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
                      <div className="text-sm font-medium text-gray-900">#{order.orderNumber || order.id.substring(0, 8)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {new Date(order.orderDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        ${order.totalAmount?.toFixed(2) || '0.00'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)}
                          <span className="ml-1">{order.status}</span>
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => navigate(`/admin/orders/${order.id}`)}
                          className="p-1 text-gray-600 hover:text-blue-600"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/admin/orders/edit/${order.id}`)}
                          className="p-1 text-gray-600 hover:text-green-600"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {recentOrders.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No recent orders
              </div>
            )}
          </div>
        </div>

        {/* Recent Products */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recent Products</h2>
              <button
                onClick={() => navigate('/admin/products')}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                View all →
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {product.imageUrl && (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-10 h-10 rounded-md object-cover mr-3"
                          />
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          <div className="text-xs text-gray-500 truncate max-w-xs">{product.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        ${product.price.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs ${product.stockQuantity > 10 ? 'bg-green-100 text-green-800' : product.stockQuantity > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                          {product.stockQuantity} in stock
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => navigate(`/admin/products/${product.id}`)}
                          className="p-1 text-gray-600 hover:text-blue-600"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {/* Handle delete */}}
                          className="p-1 text-gray-600 hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {recentProducts.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No products found
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => navigate('/admin/products/new')}
            className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-colors group"
          >
            <div className="p-3 bg-blue-100 rounded-lg mb-3 group-hover:bg-blue-200">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <span className="font-medium text-gray-900">Add New Product</span>
            <span className="text-sm text-gray-500 mt-1">Create a new listing</span>
          </button>

          <button
            onClick={() => navigate('/admin/orders')}
            className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-green-500 hover:bg-green-50 transition-colors group"
          >
            <div className="p-3 bg-green-100 rounded-lg mb-3 group-hover:bg-green-200">
              <ShoppingCart className="w-6 h-6 text-green-600" />
            </div>
            <span className="font-medium text-gray-900">Manage Orders</span>
            <span className="text-sm text-gray-500 mt-1">View & process orders</span>
          </button>

          <button
            onClick={() => navigate('/admin/users')}
            className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-colors group"
          >
            <div className="p-3 bg-purple-100 rounded-lg mb-3 group-hover:bg-purple-200">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <span className="font-medium text-gray-900">Manage Users</span>
            <span className="text-sm text-gray-500 mt-1">View user accounts</span>
          </button>

          <button
            onClick={() => navigate('/admin/categories')}
            className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-orange-500 hover:bg-orange-50 transition-colors group"
          >
            <div className="p-3 bg-orange-100 rounded-lg mb-3 group-hover:bg-orange-200">
              <Package className="w-6 h-6 text-orange-600" />
            </div>
            <span className="font-medium text-gray-900">Categories</span>
            <span className="text-sm text-gray-500 mt-1">Manage categories</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;