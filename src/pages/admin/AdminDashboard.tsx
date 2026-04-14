import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import orderService from '../../services/order.service';
import productService from '../../services/product.service';
import userService from '../../services/user.service';
import { 
  ShoppingCart, Package, TrendingUp, RefreshCw,
  Search, ShoppingBag, Truck, 
  ChevronRight, ChevronLeft, Calendar, Award, Crown, Inbox, Activity,
  CreditCard, Wallet, Banknote, CheckCircle, Boxes
} from 'lucide-react';
import { Order, Product, User, OrderItem } from '../../types';

interface DashboardStats {
  totalSales: number;
  totalOrders: number;
  totalProducts: number;
  averageOrderValue: number;
  periodSales: number;
  periodOrders: number;
  lowStockCount: number;
  outOfStockCount: number;
  periodDeliveries: number;
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

type TimeFilter = 'today' | 'yesterday' | 'this_week' | 'last_week' | 'this_month' | 'last_month' | 'this_year';

const TIME_FILTER_OPTIONS: { value: TimeFilter; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'this_week', label: 'This Week' },
  { value: 'last_week', label: 'Last Week' },
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'this_year', label: 'This Year' },
];

const ITEMS_PER_PAGE = 8;

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState<DashboardStats>({
    totalSales: 0, totalOrders: 0, totalProducts: 0,
    averageOrderValue: 0, periodSales: 0,
    periodOrders: 0, lowStockCount: 0, outOfStockCount: 0,
    periodDeliveries: 0
  });

  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [periodOrders, setPeriodOrders] = useState<OrderWithDetails[]>([]);
  const [topProducts, setTopProducts] = useState<ProductWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('this_week');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const getDateRange = (filter: TimeFilter): { start: Date; end: Date } => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (filter) {
      case 'today':
        return { start: today, end: now };
      case 'yesterday': {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayEnd = new Date(today);
        yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);
        yesterdayEnd.setHours(23, 59, 59, 999);
        return { start: yesterday, end: yesterdayEnd };
      }
      case 'this_week': {
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        return { start: startOfWeek, end: now };
      }
      case 'last_week': {
        const startOfLastWeek = new Date(today);
        startOfLastWeek.setDate(today.getDate() - today.getDay() - 7);
        startOfLastWeek.setHours(0, 0, 0, 0);
        const endOfLastWeek = new Date(startOfLastWeek);
        endOfLastWeek.setDate(startOfLastWeek.getDate() + 6);
        endOfLastWeek.setHours(23, 59, 59, 999);
        return { start: startOfLastWeek, end: endOfLastWeek };
      }
      case 'this_month': {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return { start: startOfMonth, end: now };
      }
      case 'last_month': {
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        endOfLastMonth.setHours(23, 59, 59, 999);
        return { start: startOfLastMonth, end: endOfLastMonth };
      }
      case 'this_year': {
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        return { start: startOfYear, end: now };
      }
      default:
        return { start: today, end: now };
    }
  };

  const filterOrdersByDate = (orders: Order[], filter: TimeFilter): Order[] => {
    const { start, end } = getDateRange(filter);
    return orders.filter(order => {
      const orderDate = new Date(order.orderDate);
      return orderDate >= start && orderDate <= end;
    });
  };

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [ordersResponse, products, users] = await Promise.all([
        orderService.getMyOrders(1, 500).catch(() => ({ orders: [] })),
        productService.getProducts().catch(() => []),
        userService.getAllUsers().catch(() => [])
      ]);

      const allOrdersData = (ordersResponse as { orders: Order[] })?.orders || [];
      setAllOrders(allOrdersData);
      
      // Filter orders by selected time period
      const filteredPeriodOrders = filterOrdersByDate(allOrdersData, timeFilter);
      const periodSales = filteredPeriodOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
      const periodOrdersCount = filteredPeriodOrders.length;
      
      // Calculate period deliveries
      const periodDeliveries = filteredPeriodOrders.filter(
        order => order.status?.toLowerCase() === 'delivered'
      ).length;
      
      // Total products
      const totalProducts = products.length;
      const lowStockCount = products.filter(p => p.stockQuantity > 0 && p.stockQuantity < 10).length;
      const outOfStockCount = products.filter(p => p.stockQuantity === 0).length;
      
      // Average order value for the period
      const averageOrderValue = periodOrdersCount > 0 ? periodSales / periodOrdersCount : 0;

      // Product sales map for ALL orders (best sellers should show all-time)
      const productSales = new Map<string, number>();
      allOrdersData.forEach(order => {
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
        .slice(0, 5);

      // Build period orders with actual customer details
      const periodOrdersWithDetails = filteredPeriodOrders
        .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime())
        .map(order => {
          const customer = users.find((u: User) => u.id === order.userId);
          return {
            ...order,
            customerName: customer?.fullName || customer?.fullName || `Customer #${order.userId?.substring(0, 8) || 'Unknown'}`,
            customerEmail: customer?.email || 'No email provided',
            itemCount: order.items?.length || 0
          };
        });

      setStats({
        totalSales: allOrdersData.reduce((sum, order) => sum + (order.totalAmount || 0), 0),
        totalOrders: allOrdersData.length,
        totalProducts,
        averageOrderValue,
        periodSales,
        periodOrders: periodOrdersCount,
        lowStockCount,
        outOfStockCount,
        periodDeliveries
      });
      
      setPeriodOrders(periodOrdersWithDetails);
      setTopProducts(sortedProducts);
    } catch (err: any) {
      setError('System synchronization failed. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, [timeFilter]);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  // Reset to page 1 when search query changes
  useEffect(() => { setCurrentPage(1); }, [searchQuery]);

  // Filter and paginate period orders
  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return periodOrders;
    const query = searchQuery.toLowerCase();
    return periodOrders.filter(order => 
      order.id.toLowerCase().includes(query) ||
      order.customerName?.toLowerCase().includes(query) ||
      order.customerEmail?.toLowerCase().includes(query)
    );
  }, [periodOrders, searchQuery]);

  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const getStatusStyles = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'delivered': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'shipped': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'processing': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'cancelled': return 'bg-rose-50 text-rose-700 border-rose-100';
      default: return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  const getPaymentStatusStyles = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid': case 'completed': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'pending': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'failed': case 'refunded': return 'bg-rose-50 text-rose-700 border-rose-100';
      default: return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method?.toLowerCase()) {
      case 'card': case 'credit_card': case 'debit_card': return CreditCard;
      case 'gcash': case 'wallet': case 'ewallet': return Wallet;
      case 'cod': case 'cash': return Banknote;
      default: return CreditCard;
    }
  };

  const formatPaymentMethod = (method: string) => {
    switch (method?.toLowerCase()) {
      case 'cod': return 'Cash on Delivery';
      case 'gcash': return 'GCash';
      case 'card': case 'credit_card': return 'Credit Card';
      case 'debit_card': return 'Debit Card';
      default: return method || 'N/A';
    }
  };

  const formatCurrency = (amount: number) => `₱${amount.toLocaleString()}`;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-PH', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-PH', { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  const getFilterLabel = () => {
    return TIME_FILTER_OPTIONS.find(t => t.value === timeFilter)?.label || '';
  };

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
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Executive Overview</h1>
            <p className="text-slate-500 font-medium">Hello, {user?.fullName?.split(' ')[0] || 'Admin'}. Here is your store activity.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="bg-white border border-slate-200 rounded-2xl px-4 py-2.5 shadow-sm flex items-center gap-3">
              <Calendar className="w-4 h-4 text-indigo-500" />
              <select 
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value as TimeFilter)}
                className="text-sm font-bold text-slate-700 focus:outline-none bg-transparent cursor-pointer"
              >
                {TIME_FILTER_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
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

        {/* Sales Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-3xl p-6 text-white shadow-lg shadow-indigo-200">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-white/20 p-3 rounded-2xl">
                <TrendingUp className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold bg-white/20 px-3 py-1 rounded-full">
                {getFilterLabel()}
              </span>
            </div>
            <p className="text-indigo-200 text-sm font-bold uppercase tracking-wider">Sales</p>
            <p className="text-3xl font-black mt-1">{formatCurrency(stats.periodSales)}</p>
            <p className="text-xs font-bold text-indigo-200 mt-3 flex items-center gap-1">
              <div className="w-1 h-1 rounded-full bg-indigo-300" /> Avg: {formatCurrency(stats.averageOrderValue)}
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-50 transition-all duration-300 group">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-amber-50 text-amber-600 p-3 rounded-2xl group-hover:scale-110 transition-transform">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1 rounded-full">
                {getFilterLabel()}
              </span>
            </div>
            <p className="text-slate-500 text-sm font-bold uppercase tracking-wider">Total Orders</p>
            <p className="text-3xl font-black text-slate-900 mt-1">{stats.periodOrders}</p>
            <p className="text-xs font-bold text-slate-400 mt-3 flex items-center gap-1">
              <div className="w-1 h-1 rounded-full bg-slate-300" /> All-time: {stats.totalOrders}
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-50 transition-all duration-300 group">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-purple-50 text-purple-600 p-3 rounded-2xl group-hover:scale-110 transition-transform">
                <Boxes className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1 rounded-full">
                {getFilterLabel()}
              </span>
            </div>
            <p className="text-slate-500 text-sm font-bold uppercase tracking-wider">Stock Deliveries</p>
            <p className="text-3xl font-black text-slate-900 mt-1">{stats.periodDeliveries}</p>
            <p className="text-xs font-bold text-slate-400 mt-3 flex items-center gap-1">
              <div className="w-1 h-1 rounded-full bg-slate-300" /> 
              {stats.lowStockCount} Low Stock • {stats.outOfStockCount} Out
            </p>
          </div>
        </div>

        {/* Main Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          {/* Recent Transactions Table */}
          <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900">Recent Transactions</h2>
                <p className="text-xs font-bold text-slate-400 mt-0.5">
                  Showing orders for: <span className="text-indigo-600">{getFilterLabel()}</span>
                </p>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search orders..." 
                  className="pl-9 pr-4 py-2 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 w-full sm:w-60"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Customer</th>
                    <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Date</th>
                    <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Payment</th>
                    <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Status</th>
                    <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {paginatedOrders.map((order) => {
                    const PaymentIcon = getPaymentMethodIcon(order.paymentMethod || '');
                    return (
                      <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-black text-xs flex-shrink-0">
                              {order.customerName?.substring(0,2).toUpperCase() || 'CU'}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-slate-900 truncate">{order.customerName}</p>
                              <p className="text-[10px] font-bold text-slate-400">#{order.id.substring(0,8).toUpperCase()}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div>
                            <p className="text-xs font-bold text-slate-700">{formatDate(order.orderDate)}</p>
                            <p className="text-[10px] font-bold text-slate-400">{formatTime(order.orderDate)}</p>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5">
                              <PaymentIcon className="w-3 h-3 text-slate-400" />
                              <span className="text-[10px] font-bold text-slate-600">{formatPaymentMethod(order.paymentMethod || '')}</span>
                            </div>
                            <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${getPaymentStatusStyles(order.paymentStatus || '')}`}>
                              {order.paymentStatus || 'Pending'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${getStatusStyles(order.status || '')}`}>
                            {order.status || 'Pending'}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <p className="text-sm font-black text-slate-900">{formatCurrency(order.totalAmount || 0)}</p>
                          <button 
                            onClick={() => navigate(`/admin/orders/${order.id}`)} 
                            className="text-[10px] font-black text-indigo-600 hover:underline"
                          >
                            DETAILS
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredOrders.length === 0 && (
                <div className="py-20 text-center">
                  <Inbox className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                  <p className="text-slate-400 font-bold">
                    {searchQuery 
                      ? 'No orders match your search' 
                      : `No orders found for ${getFilterLabel().toLowerCase()}`}
                  </p>
                </div>
              )}
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-slate-50 flex items-center justify-between">
                <p className="text-xs font-bold text-slate-400">
                  Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredOrders.length)} of {filteredOrders.length}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum: number;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-8 h-8 rounded-xl text-xs font-black transition-colors ${
                            currentPage === pageNum
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Area - Best Sellers */}
          <div className="space-y-8">
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl shadow-sm border border-amber-100 p-6">
              <h2 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                <div className="bg-gradient-to-br from-amber-400 to-orange-500 p-2 rounded-xl">
                  <Award className="w-5 h-5 text-white" />
                </div>
                Best Sellers (All Time)
              </h2>
              <div className="space-y-4">
                {topProducts.map((product, idx) => (
                  <div 
                    key={product.id} 
                    className={`flex items-center gap-4 group cursor-pointer p-3 rounded-2xl transition-all ${
                      idx === 0 
                        ? 'bg-gradient-to-r from-amber-100 to-orange-100 border-2 border-amber-200 shadow-lg shadow-amber-100' 
                        : 'bg-white/60 hover:bg-white border border-transparent hover:border-slate-100'
                    }`}
                    onClick={() => navigate(`/admin/products/edit/${product.id}`)}
                  >
                    <div className="relative">
                      <img 
                        src={product.imageUrl} 
                        className={`w-14 h-14 rounded-xl object-cover shadow-sm group-hover:scale-105 transition-transform ${
                          idx === 0 ? 'ring-2 ring-amber-300 ring-offset-2' : ''
                        }`} 
                        alt={product.name} 
                      />
                      {idx === 0 ? (
                        <span className="absolute -top-2 -left-2 w-6 h-6 bg-gradient-to-br from-amber-400 to-orange-500 text-white text-[10px] font-black flex items-center justify-center rounded-lg border-2 border-white shadow-md">
                          <Crown className="w-3 h-3" />
                        </span>
                      ) : (
                        <span className="absolute -top-2 -left-2 w-5 h-5 bg-slate-800 text-white text-[10px] font-black flex items-center justify-center rounded-lg border-2 border-white">
                          {idx + 1}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold truncate ${idx === 0 ? 'text-amber-900' : 'text-slate-900'}`}>
                        {product.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${idx === 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                          {product.salesCount} Sales
                        </span>
                        {idx === 0 && (
                          <span className="text-[9px] font-black uppercase tracking-widest text-orange-500 bg-orange-100 px-1.5 py-0.5 rounded">
                            Top
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-black ${idx === 0 ? 'text-amber-700' : 'text-indigo-600'}`}>
                        {formatCurrency(product.price)}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400">
                        {formatCurrency(product.revenue)} rev
                      </p>
                    </div>
                  </div>
                ))}
                {topProducts.length === 0 && (
                  <div className="py-10 text-center">
                    <Package className="w-10 h-10 text-amber-200 mx-auto mb-3" />
                    <p className="text-amber-600 font-bold text-sm">No sales data yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;