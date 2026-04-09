import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import orderService from '../../services/order.service';
import productService from '../../services/product.service';
import userService from '../../services/user.service';
import { 
  ShoppingCart, Users, Package, DollarSign, Eye, RefreshCw,
  TrendingUp, CheckCircle, Clock, XCircle, AlertCircle,
  Search, ShoppingBag, Truck, Loader, Folder, 
  ChevronRight, Calendar, Award, Crown, Inbox, Activity
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
}

interface ProductWithStats extends Product {
  salesCount: number;
  revenue: number;
}

const AdminDashboard = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0, totalOrders: 0, totalUsers: 0, totalProducts: 0,
    pendingOrders: 0, deliveredOrders: 0, cancelledOrders: 0,
    averageOrderValue: 0, conversionRate: 0, todayRevenue: 0,
    todayOrders: 0, lowStockCount: 0, pendingApproval: 0
  });

  const [recentOrders, setRecentOrders] = useState<OrderWithDetails[]>([]);
  const [topProducts, setTopProducts] = useState<ProductWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState('week');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [ordersResponse, products, users] = await Promise.all([
        orderService.getMyOrders(1, 100).catch(() => ({ orders: [] })),
        productService.getProducts().catch(() => []),
        userService.getAllUsers().catch(() => [])
      ]);

      const orders = (ordersResponse as { orders: Order[] })?.orders || [];
      const today = new Date().toDateString();
      
      const totalOrders = orders.length;
      const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
      const todayRevenue = orders
        .filter(order => new Date(order.orderDate).toDateString() === today)
        .reduce((sum, order) => sum + (order.totalAmount || 0), 0);
      
      const pendingOrders = orders.filter(order => order.status?.toLowerCase() === 'pending').length;
      const deliveredOrders = orders.filter(order => order.status?.toLowerCase() === 'delivered').length;
      const todayOrders = orders.filter(order => new Date(order.orderDate).toDateString() === today).length;
      const pendingApproval = orders.filter(order => order.paymentStatus === 'pending' && order.paymentMethod !== 'cod').length;
      
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      const lowStockCount = products.filter(p => p.stockQuantity > 0 && p.stockQuantity < 10).length;

      // Product sales map
      const productSales = new Map<string, number>();
      orders.forEach(order => {
        order.items?.forEach((item: OrderItem) => {
          const productId = item.productId.toString();
          productSales.set(productId, (productSales.get(productId) || 0) + item.quantity);
        });
      });

      const sortedProducts = products
        .map(p => ({ ...p, salesCount: productSales.get(p.id.toString()) || 0, revenue: (productSales.get(p.id.toString()) || 0) * p.price }))
        .sort((a, b) => b.salesCount - a.salesCount)
        .slice(0, 5);

      const ordersWithDetails = orders.slice(0, 6).map(order => {
        const customer = users.find((u: User) => u.id === order.userId);
        return {
          ...order,
          customerName: customer?.fullName || 'Guest Customer',
          customerEmail: customer?.email || 'guest@example.com',
          itemCount: order.items?.length || 0
        };
      });

      setStats({
        totalRevenue, totalOrders, totalUsers: users.length, totalProducts: products.length,
        pendingOrders, deliveredOrders, cancelledOrders: 0, averageOrderValue,
        conversionRate: users.length > 0 ? (totalOrders / users.length) * 100 : 0,
        todayRevenue, todayOrders, lowStockCount, pendingApproval
      });
      setRecentOrders(ordersWithDetails);
      setTopProducts(sortedProducts);
    } catch (err: any) {
      setError('System synchronization failed. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  const getStatusStyles = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'delivered': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'shipped': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'processing': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'cancelled': return 'bg-rose-50 text-rose-700 border-rose-100';
      default: return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  const formatCurrency = (amount: number) => `₱${amount.toLocaleString()}`;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8FAFC]">
        <div className="relative">
            <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
            <Activity className="w-6 h-6 text-indigo-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
        </div>
        <p className="mt-4 text-slate-500 font-bold tracking-widest text-xs uppercase">Initialising Dashboard</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Executive Overview</h1>
            <p className="text-slate-500 font-medium">Hello, {user?.fullName?.split(' ')[0] || 'Admin'}. Here is your store activity.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="bg-white border border-slate-200 rounded-2xl px-4 py-2.5 shadow-sm flex items-center gap-3">
              <Calendar className="w-4 h-4 text-indigo-500" />
              <select 
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="text-sm font-bold text-slate-700 focus:outline-none bg-transparent cursor-pointer"
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>
            <button
              onClick={fetchDashboardData}
              className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm active:scale-90"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {[
            { label: 'Total Revenue', value: formatCurrency(stats.totalRevenue), sub: `Today: ${formatCurrency(stats.todayRevenue)}`, icon: DollarSign, color: 'text-indigo-600', bg: 'bg-indigo-50' },
            { label: 'Total Orders', value: stats.totalOrders, sub: `${stats.pendingOrders} Pending`, icon: ShoppingBag, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Active Customers', value: stats.totalUsers, sub: `${stats.conversionRate.toFixed(1)}% Conversion`, icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Catalog Size', value: stats.totalProducts, sub: `${stats.lowStockCount} Low Stock`, icon: Package, color: 'text-purple-600', bg: 'bg-purple-50' },
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-50 transition-all duration-300 group">
              <div className="flex justify-between items-start mb-4">
                <div className={`${stat.bg} ${stat.color} p-3 rounded-2xl group-hover:scale-110 transition-transform`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <TrendingUp className="w-5 h-5 text-emerald-500" />
              </div>
              <p className="text-slate-500 text-sm font-bold uppercase tracking-wider">{stat.label}</p>
              <p className="text-3xl font-black text-slate-900 mt-1">{stat.value}</p>
              <p className="text-xs font-bold text-slate-400 mt-3 flex items-center gap-1">
                <div className="w-1 h-1 rounded-full bg-slate-300" /> {stat.sub}
              </p>
            </div>
          ))}
        </div>

        {/* Main Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          {/* Recent Orders Table */}
          <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center">
              <h2 className="text-xl font-black text-slate-900">Recent Transactions</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" placeholder="Search ID..." 
                  className="pl-9 pr-4 py-2 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 w-40 md:w-60"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Customer</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Items</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Status</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-black text-xs">
                            {order.customerName?.substring(0,2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">{order.customerName}</p>
                            <p className="text-[10px] font-bold text-slate-400">#{order.id.substring(0,8).toUpperCase()}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold text-slate-600">{order.itemCount} Units</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${getStatusStyles(order.status || '')}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="text-sm font-black text-slate-900">{formatCurrency(order.totalAmount || 0)}</p>
                        <button onClick={() => navigate(`/admin/orders/${order.id}`)} className="text-[10px] font-black text-indigo-600 hover:underline">DETAILS</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {recentOrders.length === 0 && (
                <div className="py-20 text-center">
                    <Inbox className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-400 font-bold">No recent orders found</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Area */}
          <div className="space-y-8">
            {/* Top Products */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
              <h2 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" /> Best Sellers
              </h2>
              <div className="space-y-5">
                {topProducts.map((product, idx) => (
                  <div key={product.id} className="flex items-center gap-4 group cursor-pointer" onClick={() => navigate(`/admin/products/edit/${product.id}`)}>
                    <div className="relative">
                        <img src={product.imageUrl} className="w-12 h-12 rounded-xl object-cover shadow-sm group-hover:scale-105 transition-transform" alt="" />
                        <span className="absolute -top-2 -left-2 w-5 h-5 bg-slate-900 text-white text-[10px] font-black flex items-center justify-center rounded-lg border-2 border-white">
                            {idx + 1}
                        </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{product.name}</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{product.salesCount} Sales</p>
                    </div>
                    <p className="text-sm font-black text-indigo-600">{formatCurrency(product.price)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-indigo-900 rounded-3xl shadow-xl p-6 text-white relative overflow-hidden">
                <div className="relative z-10">
                    <h2 className="text-lg font-black mb-4">Command Center</h2>
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { icon: Package, label: 'Add Item', path: '/admin/products/new' },
                            { icon: Users, label: 'Customers', path: '/admin/customers' },
                            { icon: Folder, label: 'Categories', path: '/admin/categories' },
                            { icon: Crown, label: 'System', path: '/admin/admins' }
                        ].map((btn, i) => (
                            <button 
                                key={i}
                                onClick={() => navigate(btn.path)}
                                className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 p-4 rounded-2xl flex flex-col items-center gap-2 transition-all active:scale-95"
                            >
                                <btn.icon className="w-5 h-5 text-indigo-300" />
                                <span className="text-[10px] font-black uppercase tracking-widest">{btn.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
                {/* Decorative blob */}
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;