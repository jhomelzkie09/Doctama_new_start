import React, { useState, useEffect, JSX } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import orderService from '../../services/order.service';
import {
  ShoppingBag, Search, Eye, Truck, CheckCircle, Clock, XCircle, Package,
  ChevronLeft, ChevronRight, RefreshCw, MapPin, CreditCard, Loader, X, 
  Wallet, Smartphone, DollarSign, Receipt, Calendar, TrendingUp, 
  DownloadCloud, Shield, PackageCheck, ZoomIn, Info, AlertTriangle,
  Check, Ban, UserCheck, Palette
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
  trackingNumber?: string;
  shippingCarrier?: string;
  estimatedDelivery?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectionReason?: string;
  deliveredBy?: string;
  deliveredAt?: string;
  deliveryConfirmedBy?: string;
  codPaymentConfirmedAt?: string;
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
  awaitingDeliveryConfirmation: number;
}

// Helper to get color display name and CSS color
const getColorInfo = (color: string): { name: string; cssColor: string; isLight: boolean } => {
  const colorMap: Record<string, string> = {
    'white': '#FFFFFF',
    'natural': '#DEB887',
    'natural wood': '#DEB887',
    'walnut': '#5C4033',
    'dark walnut': '#3E2723',
    'oak': '#D2B48C',
    'mahogany': '#4A0404',
    'black': '#1A1A1A',
    'espresso': '#2C1A14',
    'cherry': '#8B0000',
    'maple': '#F5DEB3',
    'gray': '#808080',
    'grey': '#808080',
    'beige': '#F5F5DC',
    'cream': '#FFFDD0',
    'brown': '#8B4513',
    'light brown': '#A0522D',
    'dark brown': '#3E2723',
    'teak': '#8B6914',
    'acacia': '#D2A679',
    'wenge': '#3A2A1A',
    'ash': '#C4BAA2',
    'beech': '#D4B895',
    'pine': '#E8C07A',
    'rosewood': '#65000B',
    'ebony': '#2C2C2C',
    'red': '#DC2626',
    'blue': '#2563EB',
    'green': '#16A34A',
    'yellow': '#CA8A04',
    'orange': '#EA580C',
    'purple': '#9333EA',
    'pink': '#EC4899',
    'navy': '#1E3A5F',
    'silver': '#C0C0C0',
    'gold': '#D4AF37',
    'ivory': '#FFFFF0',
  };

  const lowerColor = color.toLowerCase().trim();
  const cssColor = colorMap[lowerColor] || '#CCCCCC';

  // Determine if color is light (needs a dark border to be visible)
  const lightColors = ['white', 'natural', 'natural wood', 'maple', 'beige', 'cream', 'ash', 'beech', 'pine', 'ivory', 'silver', 'yellow', 'gold'];
  const isLight = lightColors.includes(lowerColor);

  return { name: color, cssColor, isLight };
};

// ========== COLOR VARIANT BADGE ==========
const ColorVariantBadge: React.FC<{ item: any }> = ({ item }) => {
  const colorRaw: string | undefined = item.color;
  const variantLabel: string | undefined = item.variant || item.variantName;

  if (!colorRaw && !variantLabel) return null;

  if (colorRaw) {
    const { name, cssColor, isLight } = getColorInfo(colorRaw);
    return (
      <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl">
        {/* Color swatch */}
        <span
          className="w-4 h-4 rounded-full flex-shrink-0 shadow-sm"
          style={{
            backgroundColor: cssColor,
            border: isLight ? '1.5px solid #CBD5E1' : '1.5px solid transparent',
          }}
          title={name}
        />
        {/* Label */}
        <span className="text-[11px] font-bold text-slate-600 capitalize">{name}</span>
        {/* Pill tag */}
        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">
          Color
        </span>
      </div>
    );
  }

  // Fallback for non-color variants (e.g. size)
  return (
    <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl">
      <Palette className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
      <span className="text-[11px] font-bold text-slate-600">{variantLabel}</span>
      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">
        Variant
      </span>
    </div>
  );
};

// ========== MOBILE ORDER CARD ==========
const OrderMobileCard: React.FC<{
  order: ExtendedOrder;
  formatCurrency: (amount: number) => string;
  getStatusBadge: (status: OrderStatus) => JSX.Element;
  getPaymentMethodIcon: (method: PaymentMethod) => JSX.Element;
  getPaymentMethodName: (method: PaymentMethod) => string;
  getPaymentStatusBadge: (status: PaymentStatus) => JSX.Element;
  onViewDetails: (order: ExtendedOrder) => void;
}> = ({ order, formatCurrency, getStatusBadge, getPaymentMethodIcon, getPaymentMethodName, getPaymentStatusBadge, onViewDetails }) => (
  <div className="bg-white rounded-2xl border border-slate-100 mb-4 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
    <div className="p-4 border-b border-slate-50 bg-slate-50/30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center border border-indigo-100">
            <Package className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <p className="font-bold text-slate-900 text-sm">#{order.orderNumber?.slice(-8).toUpperCase()}</p>
            <p className="text-[11px] text-slate-500 font-medium">
              {new Date(order.orderDate).toLocaleDateString()}
            </p>
          </div>
        </div>
        {getStatusBadge(order.status)}
      </div>
    </div>
    <div className="p-4 flex justify-between items-center">
      <div>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total</p>
        <p className="text-lg font-black text-indigo-600">{formatCurrency(order.totalAmount)}</p>
      </div>
      <button 
        onClick={() => onViewDetails(order)} 
        className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold transition-transform active:scale-95"
      >
        View Order
      </button>
    </div>
  </div>
);

// ========== STATUS PILL ==========
const StatusPill: React.FC<{ status: OrderStatus }> = ({ status }) => {
  const variants: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700 border-amber-200",
    awaiting_payment: "bg-orange-100 text-orange-700 border-orange-200",
    processing: "bg-blue-100 text-blue-700 border-blue-200",
    shipped: "bg-indigo-100 text-indigo-700 border-indigo-200",
    delivered: "bg-emerald-100 text-emerald-700 border-emerald-200",
    cancelled: "bg-rose-100 text-rose-700 border-rose-200",
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${variants[status] || variants.pending}`}>
      {status.replace('_', ' ')}
    </span>
  );
};

// ========== PAYMENT STATUS PILL ==========
const PaymentStatusPill: React.FC<{ status: PaymentStatus; method: PaymentMethod }> = ({ status, method }) => {
  const isDigitalPayment = method === 'gcash' || method === 'paymaya';
  
  const getVariant = () => {
    if (status === 'paid') return "bg-emerald-100 text-emerald-700 border-emerald-200";
    if (status === 'failed') return "bg-rose-100 text-rose-700 border-rose-200";
    if (status === 'pending') {
      if (isDigitalPayment) return "bg-amber-100 text-amber-700 border-amber-200";
      return "bg-blue-100 text-blue-700 border-blue-200";
    }
    return "bg-slate-100 text-slate-700 border-slate-200";
  };
  
  const getLabel = () => {
    if (status === 'paid') return 'Paid';
    if (status === 'failed') return 'Failed';
    if (status === 'pending') {
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
  const [selectedOrder, setSelectedOrder] = useState<ExtendedOrder | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showDeliveryConfirmModal, setShowDeliveryConfirmModal] = useState(false);
  const [approvalNote, setApprovalNote] = useState('');
  const [cancellationReason, setCancellationReason] = useState('');
  const [orderStats, setOrderStats] = useState<OrderStats>({
    totalSales: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    pendingPayment: 0,
    completedOrders: 0,
    todayOrders: 0,
    pendingApproval: 0,
    approvedToday: 0,
    awaitingDeliveryConfirmation: 0
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
    if (!isAdmin) navigate('/');
    else fetchOrders();
  }, [isAdmin, navigate]);

  useEffect(() => {
    filterOrders();
    calculateStats();
  }, [orders, searchQuery, statusFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await orderService.getAllOrders();
      const ordersWithDetails: ExtendedOrder[] = data.map((order: any) => ({ 
        ...order, 
        itemsCount: order.items?.length || 0,
        paymentProofImage: order.paymentProofImage || null,
        approvedBy: order.approvedBy || null,
        approvedAt: order.approvedAt || null,
        deliveredBy: order.deliveredBy || null,
        deliveredAt: order.deliveredAt || null,
        codPaymentConfirmedAt: order.codPaymentConfirmedAt || null,
      }));
      setOrders(ordersWithDetails);
    } catch (err) {
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const today = new Date().toDateString();
    
    // ONLY count DELIVERED AND PAID orders as "Sales"
    const paidDeliveredOrders = orders.filter(o => 
      o.status === 'delivered' && 
      (o.paymentStatus === 'paid')
    );
    const totalSales = paidDeliveredOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    
    // All orders revenue (for reference)
    const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    
    setOrderStats({
      totalSales,
      totalRevenue,
      averageOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0,
      pendingPayment: orders.filter(o => o.paymentStatus === 'pending').length,
      completedOrders: orders.filter(o => o.status === 'delivered').length,
      todayOrders: orders.filter(o => new Date(o.orderDate).toDateString() === today).length,
      pendingApproval: orders.filter(o => 
        o.paymentStatus === 'pending' && 
        (o.paymentMethod === 'gcash' || o.paymentMethod === 'paymaya') &&
        o.paymentProofImage
      ).length,
      approvedToday: orders.filter(o => o.approvedAt && new Date(o.approvedAt).toDateString() === today).length,
      awaitingDeliveryConfirmation: orders.filter(o => 
        o.status === 'delivered' && 
        o.paymentMethod === 'cod' && 
        o.paymentStatus === 'pending'
      ).length
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
    if (statusFilter !== 'all') filtered = filtered.filter(o => o.status === statusFilter);
    setFilteredOrders(filtered);
    setCurrentPage(1);
  };

  const handleApprovePayment = async (orderId: string) => {
    setUpdatingStatus(true);
    try {
      const adminName = currentUser?.fullName || currentUser?.email || 'Admin';
      await orderService.updateOrderPayment(parseInt(orderId), 'paid', {
        approvedBy: adminName,
        approvedAt: new Date().toISOString(),
        notes: approvalNote
      });
      await fetchOrders();
      setSuccess('Payment approved successfully. Order can now be processed.');
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
    if (!approvalNote) {
      setError('Please provide a reason for rejection');
      return;
    }
    setUpdatingStatus(true);
    try {
      const adminName = currentUser?.fullName || currentUser?.email || 'Admin';
      await orderService.updateOrderPayment(parseInt(orderId), 'failed', {
        rejectedBy: adminName,
        rejectedAt: new Date().toISOString(),
        reason: approvalNote
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
        deliveredBy: adminName,
        deliveredAt: new Date().toISOString(),
        codPaymentConfirmedAt: new Date().toISOString(),
        notes: 'COD payment confirmed upon delivery'
      });
      await fetchOrders();
      setSuccess('COD payment confirmed successfully');
      setShowDeliveryConfirmModal(false);
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
    if (!cancellationReason) {
      setError('Please provide a reason');
      return;
    }
    setUpdatingStatus(true);
    try {
      const adminName = currentUser?.fullName || currentUser?.email || 'Admin';
      
      await orderService.updateOrderStatus(parseInt(orderId), 'cancelled');
      
      const orderToCancel = orders.find(o => o.id === orderId);
      if (orderToCancel?.paymentMethod === 'cod') {
        await orderService.updateOrderPayment(parseInt(orderId), 'failed', {
          rejectedBy: adminName,
          rejectedAt: new Date().toISOString(),
          reason: cancellationReason
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

  const handleStatusUpdate = async (orderId: string, status: string) => {
    const order = orders.find(o => o.id === orderId);
    const isDigitalPayment = order?.paymentMethod === 'gcash' || order?.paymentMethod === 'paymaya';
    
    if ((status === 'shipped' || status === 'processing') && isDigitalPayment && order?.paymentStatus !== 'paid') {
      setError('Payment must be approved before processing this order');
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    setUpdatingStatus(true);
    try {
      await orderService.updateOrderStatus(parseInt(orderId), status);
      await fetchOrders();
      setSuccess(`Order status updated to ${status}`);
      setShowOrderModal(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Update failed');
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
      year: 'numeric',
      month: 'short',
      day: 'numeric'
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
      {/* Toast Notifications */}
      {success && <div className="fixed top-6 right-6 z-[60] bg-emerald-600 text-white px-6 py-3 rounded-2xl shadow-xl animate-in fade-in slide-in-from-top-4">{success}</div>}
      {error && <div className="fixed top-6 right-6 z-[60] bg-rose-600 text-white px-6 py-3 rounded-2xl shadow-xl animate-in fade-in slide-in-from-top-4">{error}</div>}

      <header className="bg-white border-b border-slate-100 sticky top-0 z-40 px-6 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Orders Management</h1>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Administrator Control Panel</p>
          </div>
          <button onClick={fetchOrders} className="p-3 hover:bg-slate-50 border border-slate-200 rounded-2xl transition-all">
            <RefreshCw className="w-5 h-5 text-slate-600" />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 md:px-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: 'Sales (Paid & Delivered)', value: formatCurrency(orderStats.totalSales), icon: CheckCircle, color: 'emerald' },
            { label: 'Pending Approval', value: orderStats.pendingApproval, icon: Clock, color: 'amber' },
            { label: 'Awaiting Delivery', value: orderStats.awaitingDeliveryConfirmation, icon: Truck, color: 'blue' },
            { label: 'Fulfilled', value: orderStats.completedOrders, icon: PackageCheck, color: 'emerald' },
            { label: 'Today', value: orderStats.todayOrders, icon: Calendar, color: 'rose' },
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

        {/* Search & Filter */}
        <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-3xl border border-slate-100">
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
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'].map(f => (
              <button 
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-5 py-3 rounded-2xl text-xs font-bold uppercase transition-all whitespace-nowrap border ${statusFilter === f ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-white text-slate-500 border-slate-200'}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Orders Table */}
        {isMobile ? (
          <div className="space-y-4">
            {paginatedOrders.map(o => (
              <OrderMobileCard 
                key={o.id} 
                order={o} 
                formatCurrency={formatCurrency} 
                getStatusBadge={(status) => <StatusPill status={status} />} 
                getPaymentMethodIcon={getPaymentMethodIcon} 
                getPaymentMethodName={getPaymentMethodName} 
                getPaymentStatusBadge={(status) => <PaymentStatusPill status={status} method={o.paymentMethod} />} 
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
                  <th className="px-6 py-5 text-center text-[10px] font-black uppercase text-slate-400">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paginatedOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-5 font-black text-slate-900">#{order.orderNumber?.slice(-8).toUpperCase()}</td>
                    <td className="px-6 py-5">
                      <p className="text-sm font-bold text-slate-700">{formatDate(order.orderDate)}</p>
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
                      <button 
                        onClick={() => {setSelectedOrder(order); setShowOrderModal(true)}} 
                        className="p-2.5 bg-slate-100 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                      >
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
                  #{selectedOrder.orderNumber} • {formatDate(selectedOrder.orderDate)}
                </p>
              </div>
              <button onClick={() => setShowOrderModal(false)} className="p-3 bg-slate-100 rounded-2xl text-slate-400 hover:text-rose-500 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {selectedOrder.paymentMethod !== 'cod' && selectedOrder.paymentStatus === 'pending' && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-black text-amber-800">Payment Verification Required</p>
                    <p className="text-xs text-amber-700 mt-1">This order requires payment approval before it can be processed for shipping.</p>
                  </div>
                </div>
              )}

              {selectedOrder.paymentMethod === 'cod' && selectedOrder.status === 'delivered' && selectedOrder.paymentStatus === 'pending' && (
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl flex items-start gap-3">
                  <Truck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-black text-blue-800">COD Payment Pending Confirmation</p>
                    <p className="text-xs text-blue-700 mt-1">Confirm that the customer has received the product and payment has been collected.</p>
                  </div>
                </div>
              )}

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

                  {selectedOrder.approvedBy && (
                    <div className="pt-3 border-t border-slate-200">
                      <p className="text-[10px] font-black text-emerald-600 uppercase flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Approved by {selectedOrder.approvedBy}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">{formatDate(selectedOrder.approvedAt || '')}</p>
                    </div>
                  )}

                  {selectedOrder.codPaymentConfirmedAt && (
                    <div className="pt-3 border-t border-slate-200">
                      <p className="text-[10px] font-black text-emerald-600 uppercase flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> COD Payment Confirmed
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">{formatDate(selectedOrder.codPaymentConfirmedAt)}</p>
                    </div>
                  )}

                  {selectedOrder.paymentMethod !== 'cod' && selectedOrder.paymentProofImage && (
                    <div className="pt-4 border-t border-slate-200">
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-3">Proof of Payment</p>
                      <div className="relative group overflow-hidden rounded-2xl border-2 border-indigo-100 cursor-zoom-in" onClick={() => setShowReceiptModal(true)}>
                        <img src={selectedOrder.paymentProofImage} alt="Receipt" className="w-full h-40 object-cover group-hover:scale-105 transition-transform" />
                        <div className="absolute inset-0 bg-indigo-600/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <ZoomIn className="text-white w-8 h-8" />
                        </div>
                      </div>
                      {selectedOrder.paymentProofReference && (
                        <div className="mt-3 p-3 bg-white rounded-xl border border-slate-200">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Reference Number</p>
                          <p className="text-sm font-black text-slate-700">{selectedOrder.paymentProofReference}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </section>

              {/* ========== ORDER ITEMS SECTION (with enhanced Color Variant) ========== */}
              {/* ========== ORDER ITEMS SECTION (with enhanced Color Variant) ========== */}
<section className="space-y-4">
  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
    <Package className="w-4 h-4" /> Order Items
  </h3>
  <div className="space-y-3">
    {selectedOrder.items?.map((item: any, i: number) => {
      // DEBUG: Log the item to see what fields are available
      console.log('Order Item:', item);
      console.log('Item color field:', item.color);
      console.log('Item selectedColor field:', item.selectedColor);
      console.log('Item variant field:', item.variant);
      console.log('All item keys:', Object.keys(item));
      
      // Check all possible color field names
      const itemColor = item.color || item.selectedColor || item.variant || item.variantName;
      const hasVariant = !!itemColor;
      
      console.log('Detected color/variant:', itemColor);

      return (
        <div key={i} className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              {/* Product name */}
              <p className="text-sm font-black text-slate-800 leading-tight">{item.productName}</p>

              {/* ── Color / Variant Badge ── */}
              {hasVariant ? (
                <ColorVariantBadge item={item} />
              ) : (
                <p className="text-[10px] text-slate-400 italic mt-1">No color variant selected</p>
              )}

              {/* Qty × Price */}
              <p className="text-xs font-bold text-indigo-500 mt-2">
                Qty: {item.quantity} × {formatCurrency(item.unitPrice || item.price)}
              </p>
            </div>

            {/* Line total */}
            <p className="font-black text-slate-900 text-sm whitespace-nowrap">
              {formatCurrency((item.unitPrice || item.price) * item.quantity)}
            </p>
          </div>
        </div>
      );
    })}
  </div>

  <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
    <div className="flex justify-between">
      <span className="text-sm font-bold text-slate-600">Total Amount</span>
      <span className="text-lg font-black text-indigo-700">{formatCurrency(selectedOrder.totalAmount)}</span>
    </div>
  </div>
</section>

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

            <div className="p-6 bg-slate-50 border-t border-slate-200 space-y-4">
              {selectedOrder.paymentStatus === 'pending' && 
               selectedOrder.paymentProofImage && 
               (selectedOrder.paymentMethod === 'gcash' || selectedOrder.paymentMethod === 'paymaya') && (
                <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-200 space-y-4">
                  <div className="flex items-center gap-2 text-amber-600 font-black text-[10px] uppercase tracking-tighter">
                    <AlertTriangle className="w-3 h-3" /> Payment Verification Required
                  </div>
                  <textarea 
                    value={approvalNote} 
                    onChange={(e) => setApprovalNote(e.target.value)} 
                    rows={2} 
                    className="w-full p-3 bg-slate-50 border-none rounded-2xl text-xs" 
                    placeholder="Enter verification notes (optional for approval, required for rejection)..."
                  />
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleApprovePayment(selectedOrder.id)} 
                      disabled={updatingStatus} 
                      className="flex-1 py-3 bg-emerald-600 text-white rounded-2xl text-xs font-black uppercase shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4" /> Approve Payment
                    </button>
                    <button 
                      onClick={() => handleRejectPayment(selectedOrder.id)} 
                      disabled={updatingStatus} 
                      className="flex-1 py-3 bg-rose-100 text-rose-600 rounded-2xl text-xs font-black uppercase hover:bg-rose-200 transition-all flex items-center justify-center gap-2"
                    >
                      <Ban className="w-4 h-4" /> Reject
                    </button>
                  </div>
                </div>
              )}

              {selectedOrder.paymentMethod === 'cod' && 
               selectedOrder.status === 'delivered' && 
               selectedOrder.paymentStatus === 'pending' && (
                <button 
                  onClick={() => setShowDeliveryConfirmModal(true)} 
                  className="w-full py-3 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                >
                  <Truck className="w-4 h-4" /> Confirm Delivery & Payment Received
                </button>
              )}

              <div className="grid grid-cols-2 gap-2">
                {['processing', 'shipped', 'delivered'].map(s => {
                  const isDigitalPayment = selectedOrder.paymentMethod === 'gcash' || selectedOrder.paymentMethod === 'paymaya';
                  const isDisabled = 
                    selectedOrder.status === 'cancelled' ||
                    ((s === 'processing' || s === 'shipped') && isDigitalPayment && selectedOrder.paymentStatus !== 'paid');
                  
                  return (
                    <button 
                      key={s} 
                      onClick={() => handleStatusUpdate(selectedOrder.id, s)} 
                      className={`py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${
                        selectedOrder.status === s 
                          ? 'bg-indigo-600 text-white' 
                          : isDisabled
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                      }`}
                      disabled={isDisabled}
                      title={isDisabled ? 'Payment must be approved first' : ''}
                    >
                      Mark as {s}
                    </button>
                  );
                })}
                <button 
                  onClick={() => setShowCancelModal(true)} 
                  className="py-3 bg-rose-50 text-rose-600 rounded-2xl text-[10px] font-black uppercase border border-rose-100"
                  disabled={selectedOrder.status === 'cancelled' || selectedOrder.status === 'delivered'}
                >
                  Cancel Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delivery Confirmation Modal for COD */}
      {showDeliveryConfirmModal && selectedOrder && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => setShowDeliveryConfirmModal(false)} />
          <div className="relative bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-black text-slate-900">Confirm COD Payment</h3>
              <p className="text-slate-500 text-sm mt-2 font-medium">
                Has the customer received the product and payment has been collected?
              </p>
              <div className="mt-4 p-4 bg-slate-50 rounded-2xl">
                <p className="text-xs font-bold text-slate-400 uppercase">Order</p>
                <p className="font-black text-slate-900">#{selectedOrder.orderNumber?.slice(-8)}</p>
                <p className="text-sm text-slate-600 mt-1">{formatCurrency(selectedOrder.totalAmount)}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowDeliveryConfirmModal(false)} 
                className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase text-xs"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleConfirmCODPayment(selectedOrder.id)} 
                disabled={updatingStatus} 
                className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs shadow-xl shadow-emerald-200 flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" /> Confirm Payment
              </button>
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
                {selectedOrder.paymentMethod === 'cod' && (
                  <span className="block text-xs text-amber-600 mt-1">This will also mark the payment as failed.</span>
                )}
              </p>
            </div>
            <textarea 
              value={cancellationReason} 
              onChange={(e) => setCancellationReason(e.target.value)} 
              rows={3} 
              className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-rose-500/20" 
              placeholder="e.g., Out of stock, Customer request..."
            />
            <div className="flex gap-3">
              <button onClick={() => setShowCancelModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase text-xs">Back</button>
              <button onClick={() => handleCancelOrder(selectedOrder.id)} disabled={updatingStatus} className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-black uppercase text-xs shadow-xl shadow-rose-200">Confirm Cancel</button>
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
          <img src={selectedOrder.paymentProofImage} alt="Full Receipt" className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl border border-white/10" />
          <p className="mt-6 text-white/60 font-black uppercase tracking-[0.2em] text-[10px]">Reference: {selectedOrder.paymentProofReference || 'N/A'}</p>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;