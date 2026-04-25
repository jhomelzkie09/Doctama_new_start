// pages/admin/AdminOrders.tsx
import React, { useState, useEffect, JSX } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import orderService from '../../services/order.service';
import {
  ShoppingBag, Search, Eye, CheckCircle, Clock, XCircle, Package,
  ChevronLeft, ChevronRight, RefreshCw, MapPin, CreditCard, Loader, X, 
  Wallet, Smartphone, DollarSign, Calendar, 
  AlertTriangle, Check, Ban, Filter, ChevronDown, Truck
} from 'lucide-react';
import { Order, PaymentMethod, OrderStatus, PaymentStatus } from '../../types';

// ========== INTERFACES ==========
interface ExtendedOrder extends Order {
  itemsCount?: number;
  paymentProofImage?: string;
  paymentProofReference?: string;
  paymentProofSender?: string;
  paymentProofDate?: string;
  paymentProofNotes?: string;
  adminNotes?: AdminNote[];
  cancellationReason?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectionReason?: string;
  codPaymentConfirmedAt?: string;
  proofImageUrl?: string;
  recipientName?: string;
  deliveryNotes?: string;
  deliveredBy?: string;
  deliveredAt?: string;
  deliveryStatus?: string;
}

interface AdminNote {
  id: string;
  content: string;
  createdAt: string;
  createdBy: string;
  type: 'info' | 'warning' | 'success' | 'note';
}

interface OrderStats {
  totalSales: number;
  totalRevenue: number;
  averageOrderValue: number;
  pendingPayment: number;
  completedOrders: number;
  todayOrders: number;
  pendingApproval: number;
  approvedToday: number;
}

// Helper to get color display name and CSS color
const getColorInfo = (color: string): { name: string; cssColor: string; isLight: boolean } => {
  const colorMap: Record<string, string> = {
    'white': '#FFFFFF', 'natural': '#DEB887', 'natural wood': '#DEB887',
    'walnut': '#5C4033', 'dark walnut': '#3E2723', 'oak': '#D2B48C',
    'mahogany': '#4A0404', 'black': '#1A1A1A', 'espresso': '#2C1A14',
    'cherry': '#8B0000', 'maple': '#F5DEB3', 'gray': '#808080',
    'grey': '#808080', 'beige': '#F5F5DC', 'cream': '#FFFDD0',
    'brown': '#8B4513', 'light brown': '#A0522D', 'dark brown': '#3E2723',
    'teak': '#8B6914', 'acacia': '#D2A679', 'wenge': '#3A2A1A',
    'ash': '#C4BAA2', 'beech': '#D4B895', 'pine': '#E8C07A',
    'rosewood': '#65000B', 'ebony': '#2C2C2C', 'red': '#DC2626',
    'blue': '#2563EB', 'green': '#16A34A', 'yellow': '#CA8A04',
    'orange': '#EA580C', 'purple': '#9333EA', 'pink': '#EC4899',
    'navy': '#1E3A5F', 'silver': '#C0C0C0', 'gold': '#D4AF37', 'ivory': '#FFFFF0',
  };
  const lowerColor = color.toLowerCase().trim();
  const cssColor = colorMap[lowerColor] || '#CCCCCC';
  const lightColors = ['white', 'natural', 'natural wood', 'maple', 'beige', 'cream', 'ash', 'beech', 'pine', 'ivory', 'silver', 'yellow', 'gold'];
  const isLight = lightColors.includes(lowerColor);
  return { name: color, cssColor, isLight };
};

// ========== COLOR VARIANT BADGE ==========
const ColorVariantBadge: React.FC<{ item: any }> = ({ item }) => {
  const colorRaw: string | undefined = item.color && item.color.trim() !== '' ? item.color : undefined;
  const size: string | undefined = item.size && item.size.trim() !== '' ? item.size : undefined;
  if (!colorRaw && !size) return null;

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      {colorRaw && (() => {
        const { name, cssColor, isLight } = getColorInfo(colorRaw);
        return (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="w-4 h-4 rounded-full flex-shrink-0 shadow-sm"
              style={{ backgroundColor: cssColor, border: isLight ? '1.5px solid #CBD5E1' : '1.5px solid transparent' }}
              title={name} />
            <span className="text-[11px] font-bold text-slate-600 capitalize">{name}</span>
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">Color</span>
          </div>
        );
      })()}
      {size && (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl">
          <span className="text-[11px] font-bold text-slate-600">{size}</span>
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">Size</span>
        </div>
      )}
    </div>
  );
};

// Replace the StatusPill component with this fixed version:

// ========== STATUS PILL ==========
const StatusPill: React.FC<{ status: OrderStatus }> = ({ status }) => {
  const getVariant = (): string => {
    const normalizedStatus = status?.toLowerCase() || '';
    
    switch (normalizedStatus) {
      case 'pending':
        return "bg-amber-100 text-amber-700 border-amber-200";
      case 'awaiting_payment':
        return "bg-orange-100 text-orange-700 border-orange-200";
      case 'processing':
        return "bg-blue-100 text-blue-700 border-blue-200";
      case 'shipped':
        return "bg-indigo-100 text-indigo-700 border-indigo-200";
      case 'outfordelivery':
        return "bg-sky-100 text-sky-700 border-sky-200";
      case 'delivered':
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case 'cancelled':
        return "bg-rose-100 text-rose-700 border-rose-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getDisplayText = (): string => {
    const normalizedStatus = status?.toLowerCase() || '';
    
    switch (normalizedStatus) {
      case 'awaiting_payment':
        return 'Awaiting Payment';
      case 'outfordelivery':
        return 'Out for Delivery';
      default:
        return status.replace(/_/g, ' ');
    }
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getVariant()}`}>
      {getDisplayText()}
    </span>
  );
};

const PaymentStatusPill: React.FC<{ status: PaymentStatus; method: PaymentMethod }> = ({ status, method }) => {
  const isDigitalPayment = method === 'gcash' || method === 'paymaya';
  
  const getVariant = () => {
    const normalizedStatus = status?.toLowerCase();
    
    if (normalizedStatus === 'paid') return "bg-emerald-100 text-emerald-700 border-emerald-200";
    if (normalizedStatus === 'failed') return "bg-rose-100 text-rose-700 border-rose-200";
    if (normalizedStatus === 'cancelled') return "bg-gray-100 text-gray-700 border-gray-200";
    if (normalizedStatus === 'pending') {
      if (isDigitalPayment) return "bg-amber-100 text-amber-700 border-amber-200";
      return "bg-blue-100 text-blue-700 border-blue-200";
    }
    return "bg-slate-100 text-slate-700 border-slate-200";
  };
  
  const getLabel = () => {
    const normalizedStatus = status?.toLowerCase();
    
    if (normalizedStatus === 'paid') return 'Paid';
    if (normalizedStatus === 'failed') return 'Failed';
    if (normalizedStatus === 'cancelled') return 'Cancelled';
    if (normalizedStatus === 'pending') {
      if (isDigitalPayment) return 'Awaiting Approval';
      return 'Awaiting Delivery';
    }
    return status;
  };
  
  return (
    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${getVariant()}`}>
      {getLabel()}
    </span>
  );
};

// ========== MOBILE ORDER CARD ==========
const OrderMobileCard: React.FC<{
  order: ExtendedOrder;
  formatCurrency: (amount: number) => string;
  getPaymentMethodIcon: (method: PaymentMethod) => JSX.Element;
  getPaymentMethodName: (method: PaymentMethod) => string;
  onViewDetails: (order: ExtendedOrder) => void;
}> = ({ order, formatCurrency, getPaymentMethodIcon, getPaymentMethodName, onViewDetails }) => (
  <div className="bg-white rounded-2xl border border-slate-100 mb-4 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
    <div className="p-4 border-b border-slate-50 bg-slate-50/30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center border border-indigo-100">
            <Package className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <p className="font-bold text-slate-900 text-sm">#{order.orderNumber?.slice(-8).toUpperCase()}</p>
            <p className="text-[11px] text-slate-500 font-medium">{new Date(order.orderDate).toLocaleDateString()}</p>
          </div>
        </div>
        <StatusPill status={order.status} />
      </div>
    </div>
    <div className="p-4 flex justify-between items-center">
      <div>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total</p>
        <p className="text-lg font-black text-indigo-600">{formatCurrency(order.totalAmount)}</p>
      </div>
      <button onClick={() => onViewDetails(order)} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold transition-transform active:scale-95">
        View Order
      </button>
    </div>
  </div>
);

 const AdminOrders = () => {
  const { isAdmin, user: currentUser } = useAuth();
  const navigate = useNavigate();
  
  // State
  const [orders, setOrders] = useState<ExtendedOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<ExtendedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<ExtendedOrder | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [approvalNote, setApprovalNote] = useState('');
  const [cancellationReason, setCancellationReason] = useState('');
  const [orderStats, setOrderStats] = useState<OrderStats>({
    totalSales: 0, totalRevenue: 0, averageOrderValue: 0, pendingPayment: 0,
    completedOrders: 0, todayOrders: 0, pendingApproval: 0, approvedToday: 0,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const itemsPerPage = 10;

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      navigate('/');
      return;
    }
    
    if (!isAdmin) {
      navigate('/');
      return;
    }
    
    // Only fetch if we're sure user is admin
    fetchOrders();
  }, [isAdmin, navigate]);

  useEffect(() => {
    filterOrders();
    calculateStats();
  }, [orders, searchQuery, statusFilter, paymentFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await orderService.getAllOrders();
      const ordersWithDetails: ExtendedOrder[] = data.map((order: any) => ({ 
        ...order, 
        itemsCount: order.items?.length || 0,
        paymentProofImage: order.paymentProofImage || null,
        paymentProofReference: order.paymentProofReference || null,
        paymentProofSender: order.paymentProofSender || null,
        paymentProofDate: order.paymentProofDate || null,
        paymentProofNotes: order.paymentProofNotes || null,
        approvedBy: order.approvedBy || null,
        approvedAt: order.approvedAt || null,
        rejectedBy: order.rejectedBy || null,
        rejectionReason: order.rejectionReason || null,
        codPaymentConfirmedAt: order.codPaymentConfirmedAt || null,
        proofImageUrl: order.proofImageUrl || null,
        recipientName: order.recipientName || null,
        deliveryNotes: order.deliveryNotes || null,
        deliveredBy: order.deliveredBy || null,
        deliveredAt: order.deliveredAt || null,
        deliveryStatus: order.deliveryStatus || null,
      }));
      setOrders(ordersWithDetails);
      setError('');
    } catch (err: any) {
      // If 401, redirect to home
      if (err?.response?.status === 401) {
        console.log('Not authorized, redirecting to home');
        navigate('/');
      } else {
        setError('Failed to load orders');
      }
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
  const today = new Date().toDateString();
  
  // ✅ FIXED: Case-insensitive filtering for delivered AND paid orders
  const paidDeliveredOrders = orders.filter(o => 
    (o.status?.toLowerCase() === 'delivered') && 
    (o.paymentStatus?.toLowerCase() === 'paid' || o.paymentStatus?.toLowerCase() === 'completed')
  );
  
  // Calculate total sales from delivered + paid orders only
  const totalSales = paidDeliveredOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  
  // Total revenue (all orders, regardless of status)
  const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  
  // Pending approval count
  const pendingApprovalCount = orders.filter(o => {
    const isDigitalPending = (o.paymentMethod === 'gcash' || o.paymentMethod === 'paymaya') &&
      o.paymentStatus?.toLowerCase() === 'pending' && 
      o.paymentProofImage &&
      o.status?.toLowerCase() !== 'delivered' && 
      o.status?.toLowerCase() !== 'cancelled';
    const isCODPending = o.paymentMethod === 'cod' && 
      o.status?.toLowerCase() === 'delivered' && 
      o.paymentStatus?.toLowerCase() === 'pending';
    return isDigitalPending || isCODPending;
  }).length;
  
  // Completed orders (delivered, regardless of payment status)
  const completedOrders = orders.filter(o => 
    o.status?.toLowerCase() === 'delivered'
  ).length;
  
  // Today's orders
  const todayOrders = orders.filter(o => 
    new Date(o.orderDate).toDateString() === today
  ).length;
  
  // Approved today
  const approvedToday = orders.filter(o => 
    o.approvedAt && new Date(o.approvedAt).toDateString() === today
  ).length;
  
  // Debug logging - Fixed: Use Array.from() or manual collection
  console.log('📊 Stats Calculation Debug:');
  console.log('  Total orders:', orders.length);
  console.log('  Delivered + Paid orders:', paidDeliveredOrders.length);
  console.log('  Total Sales:', totalSales);
  console.log('  Completed Orders:', completedOrders);
  console.log('  Pending Approval:', pendingApprovalCount);
  
  // Fixed: Collect unique statuses without Set iteration
  const statuses: string[] = [];
  const paymentStatuses: string[] = [];
  orders.forEach(o => {
    if (o.status && !statuses.includes(o.status)) {
      statuses.push(o.status);
    }
    if (o.paymentStatus && !paymentStatuses.includes(o.paymentStatus)) {
      paymentStatuses.push(o.paymentStatus);
    }
  });
  console.log('  All order statuses:', statuses);
  console.log('  All payment statuses:', paymentStatuses);
  
  setOrderStats({
    totalSales, 
    totalRevenue,
    averageOrderValue: paidDeliveredOrders.length > 0 ? totalSales / paidDeliveredOrders.length : 0,
    pendingPayment: orders.filter(o => o.paymentStatus?.toLowerCase() === 'pending').length,
    completedOrders,
    todayOrders,
    pendingApproval: pendingApprovalCount,
    approvedToday,
  });
};

  const filterOrders = () => {
    let filtered = [...orders];
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(o =>
        o.orderNumber?.toLowerCase().includes(query) ||
        o.customerName?.toLowerCase().includes(query)
      );
    }
    if (paymentFilter !== 'all') {
      filtered = filtered.filter(o => o.paymentMethod === paymentFilter);
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(o => o.status === statusFilter);
    }
    setFilteredOrders(filtered);
    setCurrentPage(1);
  };

  const handleApprovePayment = async (orderId: string) => {
    setUpdatingStatus(true);
    try {
      const adminName = currentUser?.fullName || currentUser?.email || 'Admin';
      await orderService.updateOrderPayment(parseInt(orderId), 'paid', {
        approvedBy: adminName, approvedAt: new Date().toISOString(), notes: approvalNote
      });
      await fetchOrders();
      setSuccess('Payment approved successfully.');
      setApprovalNote('');
      setShowOrderModal(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to approve payment');
      setTimeout(() => setError(''), 3000);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleRejectPayment = async (orderId: string) => {
    if (!approvalNote) { setError('Please provide a reason for rejection'); return; }
    setUpdatingStatus(true);
    try {
      const adminName = currentUser?.fullName || currentUser?.email || 'Admin';
      await orderService.updateOrderPayment(parseInt(orderId), 'failed', {
        rejectedBy: adminName, rejectedAt: new Date().toISOString(), reason: approvalNote
      });
      await fetchOrders();
      setSuccess('Payment rejected');
      setApprovalNote('');
      setShowOrderModal(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to reject order');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleConfirmCODPayment = async (orderId: string) => {
    setUpdatingStatus(true);
    try {
      const adminName = currentUser?.fullName || currentUser?.email || 'Admin';
      await orderService.updateOrderPayment(parseInt(orderId), 'paid', {
        deliveredBy: adminName, deliveredAt: new Date().toISOString(),
        codPaymentConfirmedAt: new Date().toISOString(), notes: 'COD payment confirmed'
      });
      await fetchOrders();
      setSuccess('COD payment confirmed successfully');
      setShowOrderModal(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to confirm payment');
      setTimeout(() => setError(''), 3000);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!cancellationReason) { setError('Please provide a reason'); return; }
    setUpdatingStatus(true);
    try {
      const adminName = currentUser?.fullName || currentUser?.email || 'Admin';
      await orderService.updateOrderStatus(parseInt(orderId), 'cancelled');
      const orderToCancel = orders.find(o => o.id === orderId);
      if (orderToCancel?.paymentMethod === 'cod') {
        await orderService.updateOrderPayment(parseInt(orderId), 'failed', {
          rejectedBy: adminName, rejectedAt: new Date().toISOString(), reason: cancellationReason
        });
      }
      await fetchOrders();
      setSuccess('Order cancelled successfully');
      setShowCancelModal(false);
      setShowOrderModal(false);
      setCancellationReason('');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to cancel order');
      setTimeout(() => setError(''), 3000);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getPaymentMethodIcon = (method: PaymentMethod) => {
    switch (method) {
      case 'cod': return <DollarSign className="w-4 h-4" />;
      case 'gcash': return <Smartphone className="w-4 h-4" />;
      case 'paymaya': return <Wallet className="w-4 h-4" />;
      default: return <CreditCard className="w-4 h-4" />;
    }
  };

  const getPaymentMethodName = (method: PaymentMethod) => {
    switch (method) {
      case 'cod': return 'Cash on Delivery';
      case 'gcash': return 'GCash';
      case 'paymaya': return 'Maya';
      default: return method;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const formatShortDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      <Loader className="w-10 h-10 text-indigo-600 animate-spin" />
      <p className="mt-4 text-slate-400 font-medium">Fetching orders...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDFDFD] pb-20">
      {success && <div className="fixed top-6 right-6 z-[60] bg-emerald-600 text-white px-6 py-3 rounded-2xl shadow-xl animate-in fade-in slide-in-from-top-4">{success}</div>}
      {error && <div className="fixed top-6 right-6 z-[60] bg-rose-600 text-white px-6 py-3 rounded-2xl shadow-xl animate-in fade-in slide-in-from-top-4">{error}</div>}

      <header className="bg-white border-b border-slate-100 sticky top-0 z-40 px-6 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Orders Management</h1>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Payment Approval & Order Review</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/admin/deliveries/orders')} className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl transition-all flex items-center gap-2">
              <Truck className="w-5 h-5" />
              <span className="text-xs font-bold">Delivery Management</span>
            </button>
            <button onClick={fetchOrders} className="p-3 hover:bg-slate-50 border border-slate-200 rounded-2xl transition-all">
              <RefreshCw className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 md:px-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Sales (Paid & Delivered)', value: formatCurrency(orderStats.totalSales), icon: CheckCircle, color: 'emerald' },
            { label: 'Pending Approval', value: orderStats.pendingApproval, icon: Clock, color: 'amber' },
            { label: 'Completed Orders', value: orderStats.completedOrders, icon: Package, color: 'emerald' },
            { label: 'Today\'s Orders', value: orderStats.todayOrders, icon: Calendar, color: 'rose' },
          ].map((stat, i) => (
            <div key={i} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
              <div className={`w-10 h-10 rounded-xl bg-${stat.color}-50 flex items-center justify-center mb-3`}>
                <stat.icon className={`w-5 h-5 text-${stat.color}-600`} />
              </div>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{stat.label}</p>
              <p className="text-xl font-black text-slate-900 mt-1">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-3xl border border-slate-100">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search by order ID or name..." 
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500/20"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="relative min-w-[180px]">
              <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="all">All Payment Methods</option>
                <option value="gcash">GCash</option>
                <option value="paymaya">Maya</option>
                <option value="cod">Cash on Delivery</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>

            <div className="relative min-w-[160px]">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>

            {(statusFilter !== 'all' || paymentFilter !== 'all' || searchQuery) && (
              <button
                onClick={() => { setStatusFilter('all'); setPaymentFilter('all'); setSearchQuery(''); }}
                className="px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors flex items-center gap-1 whitespace-nowrap"
              >
                <X className="w-3 h-3" /> Clear
              </button>
            )}
          </div>
          
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
            <span>Showing {filteredOrders.length} of {orders.length} orders</span>
          </div>
        </div>

        {/* Orders Table */}
        {isMobile ? (
          <div className="space-y-4">
            {paginatedOrders.map(o => (
              <OrderMobileCard 
                key={o.id} order={o} formatCurrency={formatCurrency}
                getPaymentMethodIcon={getPaymentMethodIcon} 
                getPaymentMethodName={getPaymentMethodName} 
                onViewDetails={(order) => { setSelectedOrder(order); setShowOrderModal(true); }} 
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-400">Order #</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-400">Date</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-400">Customer</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-400">Payment</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-400">Total</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-400">Status</th>
                  <th className="px-6 py-5 text-center text-[10px] font-black uppercase text-slate-400">nn</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paginatedOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-5 font-black text-slate-900">#{order.orderNumber?.slice(-8).toUpperCase()}</td>
                    <td className="px-6 py-5">
                      <p className="text-sm font-bold text-slate-700">{formatShortDate(order.orderDate)}</p>
                      <p className="text-[10px] text-slate-400">{new Date(order.orderDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </td>
                    <td className="px-6 py-5 font-bold text-slate-700">{order.customerName}</td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        {getPaymentMethodIcon(order.paymentMethod)}
                        <span className="text-xs font-bold text-slate-600">{getPaymentMethodName(order.paymentMethod)}</span>
                      </div>
                      <div className="mt-1">
                        <PaymentStatusPill status={order.paymentStatus} method={order.paymentMethod} />
                      </div>
                    </td>
                    <td className="px-6 py-5 font-black text-indigo-600">{formatCurrency(order.totalAmount)}</td>
                    <td className="px-6 py-5"><StatusPill status={order.status} /></td>
                    <td className="px-6 py-5 text-center">
                      <button onClick={() => {setSelectedOrder(order); setShowOrderModal(true)}} 
                        className="p-2.5 bg-slate-100 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredOrders.length === 0 && (
              <div className="py-20 text-center">
                <Package className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-400 font-bold">No orders found</p>
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between bg-white p-4 rounded-3xl border border-slate-100">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-2 border rounded-xl disabled:opacity-20"><ChevronLeft className="w-5 h-5" /></button>
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">Page {currentPage} of {totalPages}</span>
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="p-2 border rounded-xl disabled:opacity-20"><ChevronRight className="w-5 h-5" /></button>
          </div>
        )}
      </main>

      {/* Order Details Modal */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center md:justify-end md:p-6" onClick={() => setShowOrderModal(false)}>
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" />
          <div className="relative w-full h-full md:max-w-2xl bg-white md:rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-900">Order Details</h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  #{selectedOrder.orderNumber} • {formatShortDate(selectedOrder.orderDate)}
                </p>
              </div>
              <button onClick={() => setShowOrderModal(false)} className="p-3 bg-slate-100 rounded-2xl text-slate-400 hover:text-rose-500 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Payment Approval Alert */}
              {selectedOrder.paymentMethod !== 'cod' && selectedOrder.paymentStatus === 'pending' && selectedOrder.paymentProofImage && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-black text-amber-800">Payment Verification Required</p>
                    <p className="text-xs text-amber-700 mt-1">This order requires payment approval.</p>
                  </div>
                </div>
              )}

              {/* COD Payment Alert */}
              {selectedOrder.paymentMethod === 'cod' && selectedOrder.status === 'delivered' && selectedOrder.paymentStatus === 'pending' && (
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl flex items-start gap-3">
                  <Truck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-black text-blue-800">COD Payment Pending Confirmation</p>
                    <p className="text-xs text-blue-700 mt-1">Confirm that payment has been collected.</p>
                  </div>
                </div>
              )}

              {/* Payment Information */}
              <section className="space-y-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <CreditCard className="w-4 h-4" /> Payment Information
                </h3>
                <div className="bg-slate-50 p-5 rounded-[2rem] border border-slate-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getPaymentMethodIcon(selectedOrder.paymentMethod)}
                      <span className="font-black text-slate-700 uppercase text-sm">
                        {getPaymentMethodName(selectedOrder.paymentMethod)}
                      </span>
                    </div>
                    <PaymentStatusPill status={selectedOrder.paymentStatus} method={selectedOrder.paymentMethod} />
                  </div>

                  {selectedOrder.paymentStatus === 'failed' && selectedOrder.rejectionReason && (
                    <div className="pt-3 border-t border-slate-200">
                      <p className="text-[10px] font-black text-rose-600 uppercase flex items-center gap-1">
                        <XCircle className="w-3 h-3" /> Rejection Reason
                      </p>
                      <p className="text-xs text-rose-700 mt-1 bg-rose-50 p-2 rounded-lg">{selectedOrder.rejectionReason}</p>
                      {selectedOrder.rejectedBy && <p className="text-[10px] text-slate-400 mt-1">Rejected by {selectedOrder.rejectedBy}</p>}
                    </div>
                  )}

                  {selectedOrder.approvedBy && (
                    <div className="pt-3 border-t border-slate-200">
                      <p className="text-[10px] font-black text-emerald-600 uppercase flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Approved by {selectedOrder.approvedBy}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">{formatShortDate(selectedOrder.approvedAt || '')}</p>
                    </div>
                  )}

                  {selectedOrder.codPaymentConfirmedAt && (
                    <div className="pt-3 border-t border-slate-200">
                      <p className="text-[10px] font-black text-emerald-600 uppercase flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> COD Payment Confirmed
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">{formatShortDate(selectedOrder.codPaymentConfirmedAt)}</p>
                    </div>
                  )}

                  {selectedOrder.paymentMethod !== 'cod' && selectedOrder.paymentProofImage && (
                    <div className="pt-4 border-t border-slate-200">
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-3">Proof of Payment</p>
                      <div className="relative group overflow-hidden rounded-2xl border-2 border-indigo-100 cursor-zoom-in" onClick={() => setShowReceiptModal(true)}>
                        <img src={selectedOrder.paymentProofImage} alt="Receipt" className="w-full h-40 object-cover group-hover:scale-105 transition-transform" />
                        <div className="absolute inset-0 bg-indigo-600/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <span className="text-white text-xs font-bold">Click to enlarge</span>
                        </div>
                      </div>
                      {/* Payment Details */}
                      <div className="mt-3 space-y-1.5">
                        {selectedOrder.paymentProofReference && (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-400 w-20">Reference:</span>
                            <span className="text-xs font-mono text-slate-700">{selectedOrder.paymentProofReference}</span>
                          </div>
                        )}
                        {selectedOrder.paymentProofSender && (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-400 w-20">Sender:</span>
                            <span className="text-xs text-slate-700">{selectedOrder.paymentProofSender}</span>
                          </div>
                        )}
                        {selectedOrder.paymentProofDate && (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-400 w-20">Date:</span>
                            <span className="text-xs text-slate-700">{formatShortDate(selectedOrder.paymentProofDate)}</span>
                          </div>
                        )}
                        {selectedOrder.paymentProofNotes && (
                          <div className="flex items-start gap-2">
                            <span className="text-[10px] font-bold text-slate-400 w-20">Notes:</span>
                            <span className="text-xs text-slate-600">{selectedOrder.paymentProofNotes}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </section>
              
              {/* Order Items */}
              <section className="space-y-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Package className="w-4 h-4" /> Order Items
                </h3>
                <div className="space-y-3">
                  {selectedOrder.items?.map((item: any, i: number) => (
                    <div key={i} className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black text-slate-800 leading-tight">{item.productName}</p>
                          <ColorVariantBadge item={item} />
                          <p className="text-xs font-bold text-indigo-500 mt-2">
                            Qty: {item.quantity} × {formatCurrency(item.unitPrice || item.price)}
                          </p>
                        </div>
                        <p className="font-black text-slate-900 text-sm whitespace-nowrap">
                          {formatCurrency((item.unitPrice || item.price) * item.quantity)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                  <div className="flex justify-between">
                    <span className="text-sm font-bold text-slate-600">Total Amount</span>
                    <span className="text-lg font-black text-indigo-700">{formatCurrency(selectedOrder.totalAmount)}</span>
                  </div>
                </div>
              </section>

              {/* Delivery Address */}
              {selectedOrder.shippingAddress && (
                <section className="space-y-4">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <MapPin className="w-4 h-4" /> Delivery Address
                  </h3>
                  <div className="p-5 bg-indigo-50/50 rounded-[2rem] border border-indigo-100">
                    <p className="text-sm font-bold text-indigo-900 leading-relaxed">{selectedOrder.shippingAddress}</p>
                  </div>
                </section>
              )}
            </div>

            {/* Action Buttons */}
            {/* Action Buttons */}
<div className="p-6 bg-slate-50 border-t border-slate-200 space-y-4">
  {/* Digital Payment Approval */}
  {selectedOrder.paymentMethod !== 'cod' && selectedOrder.paymentStatus === 'pending' && selectedOrder.paymentProofImage && 
  (selectedOrder.paymentMethod === 'gcash' || selectedOrder.paymentMethod === 'paymaya') && (
    <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-200 space-y-4">
      <div className="flex items-center gap-2 text-amber-600 font-black text-[10px] uppercase tracking-tighter">
        <AlertTriangle className="w-3 h-3" /> Payment Verification
      </div>
      <textarea value={approvalNote} onChange={(e) => setApprovalNote(e.target.value)} rows={2}
        className="w-full p-3 bg-slate-50 border-none rounded-2xl text-xs" 
        placeholder="Enter verification notes (required for rejection)..." />
      <div className="flex gap-2">
        <button onClick={() => handleApprovePayment(selectedOrder.id)} disabled={updatingStatus}
          className="flex-1 py-3 bg-emerald-600 text-white rounded-2xl text-xs font-black uppercase shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2">
          <Check className="w-4 h-4" /> Approve
        </button>
        <button onClick={() => handleRejectPayment(selectedOrder.id)} disabled={updatingStatus}
          className="flex-1 py-3 bg-rose-100 text-rose-600 rounded-2xl text-xs font-black uppercase hover:bg-rose-200 transition-all flex items-center justify-center gap-2">
          <Ban className="w-4 h-4" /> Reject
        </button>
      </div>
    </div>
  )}

  {/* COD Payment Confirmation - FIXED: Show when COD order is delivered and payment is pending */}
  {selectedOrder.paymentMethod === 'cod' && 
   (selectedOrder.status === 'delivered' || selectedOrder.status?.toLowerCase() === 'delivered') && 
   (selectedOrder.paymentStatus === 'pending' || selectedOrder.paymentStatus?.toLowerCase() === 'pending') && (
    <button 
      onClick={() => handleConfirmCODPayment(selectedOrder.id)}
      className="w-full py-3 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
    >
      <Truck className="w-4 h-4" /> Confirm COD Payment Received
    </button>
  )}

  {/* Debug info - shows why COD button isn't appearing (remove after testing) */}
  {selectedOrder.paymentMethod === 'cod' && (
    <div className="text-[10px] text-slate-400 p-2 bg-slate-100 rounded-lg">
      COD Order Debug: Status="{selectedOrder.status}", PaymentStatus="{selectedOrder.paymentStatus}"
      {selectedOrder.status !== 'delivered' && selectedOrder.status?.toLowerCase() !== 'delivered' && (
        <span className="block text-amber-600">→ Order not delivered yet</span>
      )}
      {selectedOrder.paymentStatus !== 'pending' && selectedOrder.paymentStatus?.toLowerCase() !== 'pending' && (
        <span className="block text-amber-600">→ Payment already {selectedOrder.paymentStatus}</span>
      )}
    </div>
  )}

  {/* Delivery Proof Section */}
{(selectedOrder as any).proofImageUrl && (
  <section className="space-y-4">
    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
      <Truck className="w-4 h-4" /> Proof of Delivery
    </h3>
    <div className="bg-emerald-50 p-5 rounded-[2rem] border border-emerald-100 space-y-3">
      <div className="relative group overflow-hidden rounded-2xl cursor-zoom-in" 
           onClick={() => {
             setSelectedOrder({...selectedOrder, paymentProofImage: (selectedOrder as any).proofImageUrl});
             setShowReceiptModal(true);
           }}>
        <img 
          src={(selectedOrder as any).proofImageUrl} 
          alt="Proof of Delivery" 
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform" 
        />
        <div className="absolute inset-0 bg-emerald-600/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
          <span className="text-white text-xs font-bold">Click to enlarge</span>
        </div>
      </div>
      {(selectedOrder as any).recipientName && (
        <div className="flex items-center gap-2 text-sm text-emerald-800">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>Received by: <strong>{(selectedOrder as any).recipientName}</strong></span>
        </div>
      )}
      {(selectedOrder as any).deliveredBy && (
        <p className="text-xs text-slate-500">
          Delivered by: {(selectedOrder as any).deliveredBy}
        </p>
      )}
      {(selectedOrder as any).deliveredAt && (
        <p className="text-xs text-slate-400">
          {formatDate((selectedOrder as any).deliveredAt)}
        </p>
      )}
      {(selectedOrder as any).deliveryNotes && (
        <p className="text-xs text-slate-500 bg-white p-3 rounded-xl">
          📝 {(selectedOrder as any).deliveryNotes}
        </p>
      )}
    </div>
  </section>
)}

{/* Delivered Status */}
{(selectedOrder.status?.toLowerCase() === 'delivered' || (selectedOrder as any).deliveryStatus?.toLowerCase() === 'delivered') && !(selectedOrder as any).proofImageUrl && (
  <section className="space-y-4">
    <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200">
      <div className="flex items-center gap-2 text-emerald-700">
        <CheckCircle className="w-5 h-5" />
        <span className="text-sm font-bold">Order Delivered</span>
      </div>
      {(selectedOrder as any).recipientName && (
        <p className="text-xs text-emerald-600 mt-1">Received by: {(selectedOrder as any).recipientName}</p>
      )}
    </div>
  </section>
)}

  {/* Cancel Order Button */}
  {selectedOrder.status !== 'cancelled' && 
   selectedOrder.status?.toLowerCase() !== 'cancelled' && 
   selectedOrder.status !== 'delivered' && 
   selectedOrder.status?.toLowerCase() !== 'delivered' && (
    <button onClick={() => setShowCancelModal(true)}
      className="w-full py-3 bg-rose-50 text-rose-600 rounded-2xl text-xs font-black uppercase border border-rose-100 hover:bg-rose-100 transition-all">
      Cancel Order
    </button>
  )}
</div>
          </div>
        </div>
      )}

      {/* Cancellation Reason Modal */}
      {showCancelModal && selectedOrder && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => setShowCancelModal(false)} />
          <div className="relative bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-rose-600" />
              </div>
              <h3 className="text-xl font-black text-slate-900">Cancel Order?</h3>
              <p className="text-slate-500 text-sm mt-2 font-medium">
                Please provide a reason for cancelling Order #{selectedOrder.orderNumber?.slice(-8)}
              </p>
            </div>
            <textarea value={cancellationReason} onChange={(e) => setCancellationReason(e.target.value)} rows={3}
              className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-rose-500/20" 
              placeholder="e.g., Out of stock, Customer request..." />
            <div className="flex gap-3">
              <button onClick={() => setShowCancelModal(false)}
                className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase text-xs">Back</button>
              <button onClick={() => handleCancelOrder(selectedOrder.id)} disabled={updatingStatus}
                className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-black uppercase text-xs shadow-xl shadow-rose-200">Confirm Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Full Receipt Viewer */}
      {showReceiptModal && selectedOrder?.paymentProofImage && (
        <div className="fixed inset-0 z-[100] bg-slate-950/95 flex flex-col items-center justify-center p-4" onClick={() => setShowReceiptModal(false)}>
          <button className="absolute top-8 right-8 p-4 bg-white/10 rounded-full text-white hover:bg-white/20 transition-all">
            <X className="w-8 h-8" />
          </button>
          <img src={selectedOrder.paymentProofImage} alt="Full Receipt" className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-2xl border border-white/10" />
          <div className="mt-6 space-y-1 text-center">
            {selectedOrder.paymentProofReference && (
              <p className="text-white/80 text-sm font-mono">Reference: {selectedOrder.paymentProofReference}</p>
            )}
            {selectedOrder.paymentProofSender && (
              <p className="text-white/60 text-xs">Sender: {selectedOrder.paymentProofSender}</p>
            )}
            {selectedOrder.paymentProofDate && (
              <p className="text-white/60 text-xs">Date: {formatShortDate(selectedOrder.paymentProofDate)}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
