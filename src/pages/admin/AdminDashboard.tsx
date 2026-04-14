import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import orderService from '../../services/order.service';
import productService from '../../services/product.service';
import userService from '../../services/user.service';
import deliveryService from '../../services/delivery.service';
import { 
  ShoppingCart, Users, Package, DollarSign, Eye, RefreshCw,
  TrendingUp, CheckCircle, Clock, XCircle, AlertCircle,
  Search, ShoppingBag, Truck, Loader, Folder, 
  ChevronRight, Calendar, Award, Crown, Inbox, Activity,
  BarChart3, Filter, ChevronLeft, ChevronRight as ChevronRightIcon,
  Star, Zap, ArrowUp, ArrowDown, Receipt, CreditCard
} from 'lucide-react';
import { Order, Product, User, OrderItem } from '../../types';

interface DashboardStats {
  totalSales: number;
  totalOrders: number;
  totalUsers: number;
  totalProducts: number;
  pendingOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  averageOrderValue: number;
  conversionRate: number;
  todaySales: number;
  weekSales: number;
  monthSales: number;
  todayOrders: number;
  lowStockCount: number;
  pendingDeliveries: number;
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

interface DeliveryWithDetails {
  id: number;
  deliveryNumber: string;
  supplierName: string;
  expectedDate: string;
  status: string;
  totalItems: number;
  totalQuantity: number;
}

type TimeRange = 'today' | 'week' | 'month' | 'year';

const AdminDashboard = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState<DashboardStats>({
    totalSales: 0, totalOrders: 0, totalUsers: 0, totalProducts: 0,
    pendingOrders: 0, deliveredOrders: 0, cancelledOrders: 0,
    averageOrderValue: 0, conversionRate: 0, todaySales: 0,
    weekSales: 0, monthSales: 0, todayOrders: 0, lowStockCount: 0,
    pendingDeliveries: 0
  });

  const [recentOrders, setRecentOrders] = useState<OrderWithDetails[]>([]);
  const [topProducts, setTopProducts] = useState<ProductWithStats[]>([]);
  const [recentDeliveries, setRecentDeliveries] = useState<DeliveryWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage] = useState(5);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [ordersResponse, products, users, deliveries] = await Promise.all([
        orderService.getMyOrders(1, 100).catch(() => ({ orders: [] })),
        productService.getProducts().catch(() => []),
        userService.getAllUsers().catch(() => []),
        deliveryService.getAllDeliveries().catch(() => [])
      ]);

      const orders = (ordersResponse as { orders: Order[] })?.orders || [];
      const today = new Date().toDateString();
      const thisWeek = new Date();
      thisWeek.setDate(thisWeek.getDate() - 7);
      const thisMonth = new Date();
      thisMonth.setMonth(thisMonth.getMonth() - 1);
      
      const totalOrders = orders.length;
      const totalSales = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
      const todaySales = orders
        .filter(order => new Date(order.orderDate).toDateString() === today)
        .reduce((sum, order) => sum + (order.totalAmount || 0), 0);
      const weekSales = orders
        .filter(order => new Date(order.orderDate) >= thisWeek)
        .reduce((sum, order) => sum + (order.totalAmount || 0), 0);
      const monthSales = orders
        .filter(order => new Date(order.orderDate) >= thisMonth)
        .reduce((sum, order) => sum + (order.totalAmount || 0), 0);
      
      const pendingOrders = orders.filter(order => order.status?.toLowerCase() === 'pending').length;
      const deliveredOrders = orders.filter(order => order.status?.toLowerCase() === 'delivered').length;
      const cancelledOrders = orders.filter(order => order.status?.toLowerCase() === 'cancelled').length;
      const todayOrders = orders.filter(order => new Date(order.orderDate).toDateString() === today).length;
      
      const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
      const lowStockCount = products.filter(p => p.stockQuantity > 0 && p.stockQuantity < 10).length;
      const pendingDeliveries = deliveries.filter(d => d.status === 'pending').length;

      // Product sales map
      const productSales = new Map<string, number>();
      orders.forEach(order => {
        order.items?.forEach((item: OrderItem) => {
          const productId = item.productId.toString();
          productSales.set(productId, (productSales.get(productId) || 0) + item.quantity);
        });
      });

      const sortedProducts = products
        .map(p => ({ 
          ...p, 
          salesCount: productSales.get(p.id.toString()) || 0, 
          revenue: (productSales.get(p.id.toString()) || 0) * p.price 
        }))
        .sort((a, b) => b.salesCount - a.salesCount)
        .slice(0, 10);

      const ordersWithDetails = orders.slice(0, 50).map(order => {
        const customer = users.find((u: User) => u.id === order.userId);
        return {
          ...order,
          customerName: customer?.fullName || 'Guest Customer',
          customerEmail: customer?.email || 'guest@example.com',
          itemCount: order.items?.length || 0
        };
      });

      const deliveriesWithDetails = deliveries.slice(0, 10).map(delivery => ({
        id: delivery.id,
        deliveryNumber: delivery.deliveryNumber,
        supplierName: delivery.supplierName,
        expectedDate: delivery.expectedDate,
        status: delivery.status,
        totalItems: delivery.totalItems,
        totalQuantity: delivery.totalQuantity
      }));

      setStats({
        totalSales, totalOrders, totalUsers: users.length, totalProducts: products.length,
        pendingOrders, deliveredOrders, cancelledOrders, averageOrderValue,
        conversionRate: users.length > 0 ? (totalOrders / users.length) * 100 : 0,
        todaySales, weekSales, monthSales, todayOrders, lowStockCount, pendingDeliveries
      });
      setRecentOrders(ordersWithDetails);
      setTopProducts(sortedProducts);
      setRecentDeliveries(deliveriesWithDetails);
    } catch (err: any) {
      setError('Failed to load dashboard data. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  // Filter orders by search
  const filteredOrders = useMemo(() => {
    if (!searchQuery) return recentOrders;
    const query = searchQuery.toLowerCase();
    return recentOrders.filter(order => 
      order.orderNumber?.toLowerCase().includes(query) ||
      order.customerName?.toLowerCase().includes(query) ||
      order.id.toString().includes(query)
    );
  }, [recentOrders, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * ordersPerPage,
    currentPage * ordersPerPage
  );

  const getStatusStyles = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'delivered': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'shipped': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'processing': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'cancelled': return 'bg-rose-50 text-rose-700 border-rose-100';
      case 'pending': return 'bg-yellow-50 text-yellow-700 border-yellow-100';
      default: return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  const getDeliveryStatusStyles = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'received': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'partial': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'pending': return 'bg-yellow-50 text-yellow-700 border-yellow-100';
      case 'cancelled': return 'bg-rose-50 text-rose-700 border-rose-100';
      default: return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  const getPaymentStatusStyles = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid': return 'bg-emerald-50 text-emerald-700';
      case 'pending': return 'bg-yellow-50 text-yellow-700';
      case 'failed': return 'bg-rose-50 text-rose-700';
      case 'refunded': return 'bg-purple-50 text-purple-700';
      default: return 'bg-slate-50 text-slate-700';
    }
  };

  const formatCurrency = (amount: number) => `₱${amount.toLocaleString()}`;
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-PH');

  const getSalesByTimeRange = () => {
    switch(timeRange) {
      case 'today': return formatCurrency(stats.todaySales);
      case 'week': return formatCurrency(stats.weekSales);
      case 'month': return formatCurrency(stats.monthSales);
      default: return formatCurrency(stats.totalSales);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8FAFC]">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
          <Activity className="w-6 h-6 text-indigo-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
        </div>
        <p className="mt-4 text-slate-500 font-bold tracking-widest text-xs uppercase">Loading Dashboard</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Dashboard</h1>
            <p className="text-slate-500 font-medium">Welcome back, {user?.fullName?.split(' ')[0] || 'Admin'}</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="bg-white border border-slate-200 rounded-2xl px-4 py-2.5 shadow-sm flex items-center gap-3">
              <Calendar className="w-4 h-4 text-indigo-500" />
              <select 
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as TimeRange)}
                className="text-sm font-bold text-slate-700 focus:outline-none bg-transparent cursor-pointer"
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">All Time</option>
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

        {/* Stats Cards - Sales focused */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {[
            { label: 'Total Sales', value: formatCurrency(stats.totalSales), sub: `${timeRange}: ${getSalesByTimeRange()}`, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: '+12%' },
            { label: 'Total Orders', value: stats.totalOrders, sub: `${stats.pendingOrders} Pending`, icon: ShoppingBag, color: 'text-amber-600', bg: 'bg-amber-50', trend: '+8%' },
            { label: 'Active Customers', value: stats.totalUsers, sub: `${stats.conversionRate.toFixed(1)}% Converted`, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50', trend: '+5%' },
            { label: 'Pending Deliveries', value: stats.pendingDeliveries, sub: `From suppliers`, icon: Truck, color: 'text-rose-600', bg: 'bg-rose-50', trend: stats.pendingDeliveries > 0 ? 'Needs attention' : 'All good' },
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 group">
              <div className="flex justify-between items-start mb-4">
                <div className={`${stat.bg} ${stat.color} p-3 rounded-2xl group-hover:scale-110 transition-transform`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                {stat.trend && (
                  <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                    <ArrowUp className="w-3 h-3" /> {stat.trend}
                  </span>
                )}
              </div>
              <p className="text-slate-500 text-sm font-bold uppercase tracking-wider">{stat.label}</p>
              <p className="text-3xl font-black text-slate-900 mt-1">{stat.value}</p>
              <p className="text-xs font-bold text-slate-400 mt-3">{stat.sub}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Orders Table - Expanded */}
          <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-xl font-black text-slate-900">Recent Transactions</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search by ID or customer..." 
                  className="pl-9 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Date & Order</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Customer</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Payment</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Status</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {paginatedOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer" onClick={() => navigate(`/admin/orders/${order.id}`)}>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-xs font-bold text-slate-900">#{order.orderNumber?.slice(-8) || order.id.slice(-8)}</p>
                          <p className="text-[10px] font-bold text-slate-400 mt-0.5">{formatDate(order.orderDate)}</p>
                        </div>
                       </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-black text-xs">
                            {order.customerName?.substring(0,2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">{order.customerName}</p>
                            <p className="text-[10px] text-slate-400">{order.customerEmail}</p>
                          </div>
                        </div>
                       </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-bold text-slate-700 capitalize">{order.paymentMethod}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block w-fit ${getPaymentStatusStyles(order.paymentStatus)}`}>
                            {order.paymentStatus}
                          </span>
                        </div>
                       </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${getStatusStyles(order.status || '')}`}>
                          {order.status}
                        </span>
                       </td>
                      <td className="px-6 py-4 text-right">
                        <p className="text-sm font-black text-slate-900">{formatCurrency(order.totalAmount || 0)}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{order.itemCount} items</p>
                       </td>
                     </tr>
                  ))}
                </tbody>
              </table>
              {paginatedOrders.length === 0 && (
                <div className="py-20 text-center">
                  <Inbox className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                  <p className="text-slate-400 font-bold">No orders found</p>
                </div>
              )}
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-slate-200 disabled:opacity-50 hover:bg-slate-50 transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-medium text-slate-600">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-slate-200 disabled:opacity-50 hover:bg-slate-50 transition"
                >
                  <ChevronRightIcon className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-8">
            {/* Best Sellers - Highlighted */}
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-3xl p-6 border border-amber-200 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-amber-500 rounded-xl">
                  <Crown className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-lg font-black text-amber-900">Top Performers</h2>
                <span className="ml-auto text-xs font-bold text-amber-600 bg-amber-200 px-2 py-1 rounded-full">Best Sellers</span>
              </div>
              <div className="space-y-4">
                {topProducts.slice(0, 5).map((product, idx) => (
                  <div 
                    key={product.id} 
                    className="flex items-center gap-4 group cursor-pointer bg-white/60 rounded-2xl p-3 hover:bg-white transition-all"
                    onClick={() => navigate(`/admin/products/edit/${product.id}`)}
                  >
                    <div className="relative">
                      <img src={product.imageUrl} className="w-12 h-12 rounded-xl object-cover shadow-sm group-hover:scale-105 transition-transform" alt="" />
                      <div className={`absolute -top-2 -left-2 w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-black border-2 border-white ${
                        idx === 0 ? 'bg-amber-500' : idx === 1 ? 'bg-slate-400' : idx === 2 ? 'bg-amber-600' : 'bg-slate-500'
                      }`}>
                        {idx + 1}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{product.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <TrendingUp className="w-3 h-3 text-emerald-600" />
                        <p className="text-[10px] font-black text-emerald-600">{product.salesCount} units sold</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-amber-700">{formatCurrency(product.price)}</p>
                      <p className="text-[10px] text-slate-400">{formatCurrency(product.revenue)} revenue</p>
                    </div>
                  </div>
                ))}
              </div>
              {topProducts.length > 5 && (
                <button 
                  onClick={() => navigate('/admin/reports/products')}
                  className="mt-4 w-full text-center text-sm font-bold text-amber-700 hover:text-amber-800 transition"
                >
                  View All Products →
                </button>
              )}
            </div>

            {/* Recent Deliveries */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-indigo-500" />
                  Incoming Deliveries
                </h2>
                <button 
                  onClick={() => navigate('/admin/deliveries')}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
                >
                  View All →
                </button>
              </div>
              <div className="space-y-3">
                {recentDeliveries.slice(0, 5).map((delivery) => (
                  <div key={delivery.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition cursor-pointer" onClick={() => navigate(`/admin/deliveries`)}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                        <Package className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{delivery.deliveryNumber}</p>
                        <p className="text-[10px] text-slate-500">{delivery.supplierName}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${getDeliveryStatusStyles(delivery.status)}`}>
                        {delivery.status}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-1">{delivery.totalQuantity} units</p>
                    </div>
                  </div>
                ))}
                {recentDeliveries.length === 0 && (
                  <div className="text-center py-8">
                    <Truck className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                    <p className="text-xs text-slate-400">No pending deliveries</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Stats Summary */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ShoppingBag className="w-4 h-4 text-emerald-600" />
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Avg Order</p>
                </div>
                <p className="text-xl font-black text-slate-900">{formatCurrency(stats.averageOrderValue)}</p>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="w-4 h-4 text-rose-600" />
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Low Stock</p>
                </div>
                <p className="text-xl font-black text-rose-600">{stats.lowStockCount}</p>
                <p className="text-[10px] text-slate-400">items need restock</p>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Pending Orders</p>
                </div>
                <p className="text-xl font-black text-amber-600">{stats.pendingOrders}</p>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Completed</p>
                </div>
                <p className="text-xl font-black text-emerald-600">{stats.deliveredOrders}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;