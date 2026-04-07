import React, { useState, useEffect, JSX } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import orderService from '../../services/order.service';
import {
  ShoppingBag, Search, Eye, Truck, CheckCircle, Clock, XCircle, Package,
  ChevronLeft, ChevronRight, Download, RefreshCw, User as UserIcon, MapPin,
  CreditCard, AlertCircle, Loader, X, Wallet, Smartphone, DollarSign, ThumbsUp,
  ThumbsDown, Receipt, ZoomIn, Printer, Calendar,
  TrendingUp, DownloadCloud, Shield, PackageCheck, Crown
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
}

interface AdminNote {
  id: string;
  content: string;
  createdAt: string;
  createdBy: string;
  type: 'info' | 'warning' | 'success' | 'note';
}

interface OrderStats {
  totalRevenue: number;
  averageOrderValue: number;
  pendingPayment: number;
  completedOrders: number;
  todayOrders: number;
  pendingApproval: number;
  approvedToday: number;
}

// ========== MOBILE ORDER CARD ==========
interface OrderMobileCardProps {
  order: ExtendedOrder;
  formatCurrency: (amount: number) => string;
  getStatusBadge: (status: OrderStatus) => JSX.Element;
  getPaymentMethodIcon: (method: PaymentMethod) => JSX.Element;
  getPaymentMethodName: (method: PaymentMethod) => string;
  getPaymentStatusBadge: (status: PaymentStatus) => JSX.Element;
  onViewDetails: (order: ExtendedOrder) => void;
}

const OrderMobileCard: React.FC<OrderMobileCardProps> = ({ 
  order, 
  formatCurrency, 
  getStatusBadge, 
  getPaymentMethodIcon, 
  getPaymentMethodName, 
  getPaymentStatusBadge, 
  onViewDetails 
}) => (
  <div className="bg-white rounded-2xl border border-gray-100 mb-3 overflow-hidden shadow-sm active:scale-[0.99] transition-transform">
    <div className="p-4 border-b border-gray-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
            <ShoppingBag className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm">#{order.orderNumber?.slice(-8)}</p>
            <p className="text-xs text-gray-500 mt-0.5">{order.customerName || 'Guest'}</p>
          </div>
        </div>
        <button onClick={() => onViewDetails(order)} className="p-2 bg-gray-50 rounded-xl active:bg-gray-100">
          <Eye className="w-4 h-4 text-gray-600" />
        </button>
      </div>
    </div>
    
    <div className="p-4 space-y-2.5">
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-500">Total</span>
        <span className="text-lg font-bold text-red-600">{formatCurrency(order.totalAmount)}</span>
      </div>
      
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-500">Payment</span>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-xs text-gray-600">
            {getPaymentMethodIcon(order.paymentMethod)}
            {getPaymentMethodName(order.paymentMethod)}
          </span>
          {getPaymentStatusBadge(order.paymentStatus)}
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-500">Status</span>
        {getStatusBadge(order.status)}
      </div>
      
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-500">Date</span>
        <span className="text-xs text-gray-500">{new Date(order.orderDate).toLocaleDateString()}</span>
      </div>
      
      {order.approvedBy && (
        <div className="flex justify-between items-center pt-2 border-t border-gray-50">
          <span className="text-xs text-gray-400">Verified by</span>
          <span className="text-xs font-medium text-green-600">{order.approvedBy}</span>
        </div>
      )}
    </div>
    
    <div className="flex border-t border-gray-50">
      <button onClick={() => onViewDetails(order)} className="flex-1 py-3 text-center text-sm font-medium text-gray-600 hover:text-red-600 active:bg-gray-50 transition">
        View Details
      </button>
      <button className="flex-1 py-3 text-center text-sm font-medium text-gray-600 hover:text-blue-600 active:bg-gray-50 transition">
        <Truck className="w-4 h-4 inline mr-1" />
        Track
      </button>
    </div>
  </div>
);

// ========== STATUS PILL ==========
const StatusPill: React.FC<{ status: OrderStatus }> = ({ status }) => {
  const variants: Record<string, string> = {
    pending: "bg-amber-50 text-amber-700",
    awaiting_payment: "bg-orange-50 text-orange-700",
    processing: "bg-blue-50 text-blue-700",
    shipped: "bg-indigo-50 text-indigo-700",
    delivered: "bg-emerald-50 text-emerald-700",
    cancelled: "bg-rose-50 text-rose-700",
  };
  const displayStatus = status.replace('_', ' ');
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${variants[status] || variants.pending}`}>
      {displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1)}
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
  const [approvalNote, setApprovalNote] = useState('');
  const [cancellationReason, setCancellationReason] = useState('');
  const [orderStats, setOrderStats] = useState<OrderStats>({
    totalRevenue: 0,
    averageOrderValue: 0,
    pendingPayment: 0,
    completedOrders: 0,
    todayOrders: 0,
    pendingApproval: 0,
    approvedToday: 0
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const itemsPerPage = 10;

  // Check for mobile
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
      console.log('📦 Orders from API (RAW):', data);
      
      // Log orders with payment proof
      const ordersWithProof = data.filter((order: any) => order.paymentProofImage);
      console.log(`📸 Orders with payment proof: ${ordersWithProof.length}`);
      if (ordersWithProof.length > 0) {
        console.log('📸 First order with proof:', {
          id: ordersWithProof[0].id,
          paymentMethod: ordersWithProof[0].paymentMethod,
          paymentProofImage: ordersWithProof[0].paymentProofImage?.substring(0, 100) + '...',
          paymentProofReference: ordersWithProof[0].paymentProofReference
        });
      }
      
      // Map the data to include payment proof fields
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
        trackingNumber: order.trackingNumber || null
      }));
      
      setOrders(ordersWithDetails);
    } catch (err) {
      console.error('Failed to load orders:', err);
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const today = new Date().toDateString();
    setOrderStats({
      totalRevenue: orders.reduce((sum, o) => sum + o.totalAmount, 0),
      averageOrderValue: orders.length > 0 ? orders.reduce((sum, o) => sum + o.totalAmount, 0) / orders.length : 0,
      pendingPayment: orders.filter(o => o.paymentStatus === 'pending').length,
      completedOrders: orders.filter(o => o.status === 'delivered').length,
      todayOrders: orders.filter(o => new Date(o.orderDate).toDateString() === today).length,
      pendingApproval: orders.filter(o => o.paymentStatus === 'pending' && o.paymentMethod !== 'cod').length,
      approvedToday: orders.filter(o => o.approvedAt && new Date(o.approvedAt).toDateString() === today).length
    });
  };

  const filterOrders = () => {
    let filtered = [...orders];
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(o =>
        o.orderNumber?.toLowerCase().includes(query) ||
        o.customerName?.toLowerCase().includes(query) ||
        o.customerEmail?.toLowerCase().includes(query)
      );
    }
    if (statusFilter !== 'all') filtered = filtered.filter(o => o.status === statusFilter);
    setFilteredOrders(filtered);
    setCurrentPage(1);
  };

  const handleApprovePayment = async (orderId: string) => {
    setUpdatingStatus(true);
    try {
      await orderService.updateOrderPayment(parseInt(orderId), 'paid', {
        approvedBy: currentUser?.fullName || 'Admin',
        approvedAt: new Date().toISOString(),
        notes: approvalNote
      });
      await fetchOrders();
      setSuccess('Payment approved');
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
    if (!approvalNote) return setError('Please provide a reason');
    setUpdatingStatus(true);
    try {
      await orderService.updateOrderPayment(parseInt(orderId), 'failed', {
        rejectedBy: currentUser?.fullName || 'Admin',
        rejectedAt: new Date().toISOString(),
        reason: approvalNote
      });
      await fetchOrders();
      setSuccess('Payment rejected');
      setApprovalNote('');
      setShowOrderModal(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to reject payment');
      setTimeout(() => setError(''), 3000);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!cancellationReason) return setError('Please provide a reason');
    setUpdatingStatus(true);
    try {
      await orderService.updateOrderStatus(parseInt(orderId), 'cancelled');
      if (selectedOrder?.paymentStatus === 'paid') {
        await orderService.updateOrderPayment(parseInt(orderId), 'refunded', {
          refundedBy: currentUser?.fullName,
          refundedAt: new Date().toISOString(),
          reason: cancellationReason,
          amount: selectedOrder.totalAmount
        });
      }
      await fetchOrders();
      setSuccess('Order cancelled');
      setShowCancelModal(false);
      setShowOrderModal(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to cancel order');
      setTimeout(() => setError(''), 3000);
    } finally {
      setUpdatingStatus(false);
      setCancellationReason('');
    }
  };

  const handleStatusUpdate = async (orderId: string, status: string) => {
    setUpdatingStatus(true);
    try {
      await orderService.updateOrderStatus(parseInt(orderId), status);
      await fetchOrders();
      setSuccess(`Order status updated to ${status}`);
      setShowOrderModal(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to update status');
      setTimeout(() => setError(''), 3000);
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Helper Functions
  const getPaymentMethodIcon = (method: PaymentMethod): JSX.Element => {
    switch (method) {
      case 'cod': return <DollarSign className="w-4 h-4" />;
      case 'gcash': return <Smartphone className="w-4 h-4" />;
      case 'paymaya': return <Wallet className="w-4 h-4" />;
      default: return <CreditCard className="w-4 h-4" />;
    }
  };

  const getPaymentMethodName = (method: PaymentMethod): string => {
    switch (method) {
      case 'cod': return 'COD';
      case 'gcash': return 'GCash';
      case 'paymaya': return 'PayMaya';
      default: return method;
    }
  };

  const getPaymentStatusBadge = (status: PaymentStatus): JSX.Element => {
    const colors: Record<PaymentStatus, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-purple-100 text-purple-800'
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getStatusBadge = (status: OrderStatus): JSX.Element => {
    const variants: Record<string, string> = {
      pending: "bg-amber-50 text-amber-700",
      awaiting_payment: "bg-orange-50 text-orange-700",
      processing: "bg-blue-50 text-blue-700",
      shipped: "bg-indigo-50 text-indigo-700",
      delivered: "bg-emerald-50 text-emerald-700",
      cancelled: "bg-rose-50 text-rose-700",
    };
    const displayStatus = status.replace('_', ' ');
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${variants[status] || variants.pending}`}>
        {displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1)}
      </span>
    );
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);
  };

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const statusCounts = {
    all: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    awaiting_payment: orders.filter(o => o.status === 'awaiting_payment').length,
    processing: orders.filter(o => o.status === 'processing').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
      <div className="relative">
        <div className="w-12 h-12 border-4 border-red-100 border-t-red-600 rounded-full animate-spin"></div>
        <ShoppingBag className="w-5 h-5 text-red-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      </div>
      <p className="mt-3 text-sm text-slate-500">Loading orders...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16">
      {/* Success/Error Messages */}
      {success && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg animate-in slide-in-from-top-2">
          {success}
        </div>
      )}
      {error && (
        <div className="fixed top-4 right-4 z-50 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg animate-in slide-in-from-top-2">
          {error}
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-100 px-4 py-3 md:px-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <div className="bg-red-600 p-1.5 rounded-lg">
                <ShoppingBag className="w-4 h-4 text-white" />
              </div>
              Orders
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">{orders.length} total</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchOrders} className="p-2 bg-gray-50 rounded-xl active:bg-gray-100">
              <RefreshCw className="w-4 h-4 text-gray-600" />
            </button>
            <button className="p-2 bg-gray-50 rounded-xl active:bg-gray-100">
              <DownloadCloud className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>
      </header>

      <main className="px-4 py-4 md:px-6 max-w-7xl mx-auto space-y-5">
        {/* Stats - 4 Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Revenue', value: formatCurrency(orderStats.totalRevenue), icon: TrendingUp, color: 'blue' },
            { label: 'Pending', value: orderStats.pendingApproval.toString(), icon: Shield, color: 'red' },
            { label: 'Delivered', value: orderStats.completedOrders.toString(), icon: PackageCheck, color: 'green' },
            { label: 'Today', value: orderStats.todayOrders.toString(), icon: Calendar, color: 'amber' },
          ].map((stat, i) => (
            <div key={i} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg bg-${stat.color}-50`}>
                  <stat.icon className={`w-4 h-4 text-${stat.color}-600`} />
                </div>
              </div>
              <p className="text-xs text-gray-500">{stat.label}</p>
              <p className="text-base font-bold text-gray-900 mt-0.5">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text"
            placeholder="Search by order number or customer..."
            className="w-full pl-9 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filter Chips */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          <button onClick={() => setStatusFilter('all')} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition ${statusFilter === 'all' ? 'bg-red-600 text-white' : 'bg-white text-gray-600 border border-slate-200'}`}>All ({statusCounts.all})</button>
          <button onClick={() => setStatusFilter('pending')} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${statusFilter === 'pending' ? 'bg-amber-500 text-white' : 'bg-white text-gray-600 border border-slate-200'}`}>Pending ({statusCounts.pending})</button>
          <button onClick={() => setStatusFilter('processing')} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${statusFilter === 'processing' ? 'bg-blue-500 text-white' : 'bg-white text-gray-600 border border-slate-200'}`}>Processing ({statusCounts.processing})</button>
          <button onClick={() => setStatusFilter('shipped')} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${statusFilter === 'shipped' ? 'bg-indigo-500 text-white' : 'bg-white text-gray-600 border border-slate-200'}`}>Shipped ({statusCounts.shipped})</button>
          <button onClick={() => setStatusFilter('delivered')} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${statusFilter === 'delivered' ? 'bg-emerald-500 text-white' : 'bg-white text-gray-600 border border-slate-200'}`}>Delivered ({statusCounts.delivered})</button>
          <button onClick={() => setStatusFilter('cancelled')} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${statusFilter === 'cancelled' ? 'bg-rose-500 text-white' : 'bg-white text-gray-600 border border-slate-200'}`}>Cancelled ({statusCounts.cancelled})</button>
        </div>

        {/* Orders Display */}
        {isMobile ? (
          <div className="space-y-3">
            {paginatedOrders.map((order) => (
              <OrderMobileCard 
                key={order.id}
                order={order}
                formatCurrency={formatCurrency}
                getStatusBadge={getStatusBadge}
                getPaymentMethodIcon={getPaymentMethodIcon}
                getPaymentMethodName={getPaymentMethodName}
                getPaymentStatusBadge={getPaymentStatusBadge}
                onViewDetails={(order: ExtendedOrder) => {
                  setSelectedOrder(order);
                  setShowOrderModal(true);
                }}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Order</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Customer</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Total</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Approved By</th> {/* ADD THIS COLUMN */}
                    <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-5 py-3">
                        <div className="font-medium text-gray-900 text-sm">#{order.orderNumber?.slice(-8)}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{new Date(order.orderDate).toLocaleDateString()}</div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="font-medium text-gray-800 text-sm">{order.customerName || 'Guest'}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{order.customerEmail}</div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="font-bold text-red-600 text-sm">{formatCurrency(order.totalAmount)}</div>
                        <div className="text-xs text-gray-400">{order.items?.length || 0} items</div>
                      </td>
                      <td className="px-5 py-3">
                        <StatusPill status={order.status} />
                      </td>
                      <td className="px-5 py-3"> {/* ADD THIS CELL */}
                        {order.approvedBy ? (
                          <div className="flex flex-col">
                            <span className="text-xs font-medium text-green-600">{order.approvedBy}</span>
                            {order.approvedAt && (
                              <span className="text-[10px] text-gray-400">
                                {new Date(order.approvedAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => {setSelectedOrder(order); setShowOrderModal(true)}}
                            className="p-2 bg-gray-50 rounded-lg hover:bg-red-600 hover:text-white transition"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-2 bg-gray-50 rounded-lg hover:bg-blue-600 hover:text-white transition" title="Print Invoice">
                            <Printer className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredOrders.length === 0 && (
          <div className="text-center py-10 bg-white rounded-xl border border-slate-100">
            <Package className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No orders found</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between gap-3 pt-2">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="flex-1 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium disabled:opacity-30 active:bg-gray-50">
              <ChevronLeft className="w-4 h-4 inline mr-1" /> Previous
            </button>
            <div className="text-sm text-gray-500">
              <span className="text-red-600 font-bold">{currentPage}</span> / {totalPages}
            </div>
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="flex-1 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium disabled:opacity-30 active:bg-gray-50">
              Next <ChevronRight className="w-4 h-4 inline ml-1" />
            </button>
          </div>
        )}
      </main>

      {/* Order Details Modal */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowOrderModal(false)}>
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b px-5 py-4 flex justify-between items-center">
              <h2 className="text-lg font-bold">Order #{selectedOrder.orderNumber?.slice(-8)}</h2>
              <button onClick={() => setShowOrderModal(false)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-5 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-gray-500">Order Date</p><p className="text-sm font-medium">{new Date(selectedOrder.orderDate).toLocaleDateString()}</p></div>
                <div><p className="text-xs text-gray-500">Total</p><p className="text-sm font-bold text-red-600">{formatCurrency(selectedOrder.totalAmount)}</p></div>
              </div>

              <div className="bg-gray-50 p-3 rounded-xl">
                <p className="text-xs font-bold text-gray-500 mb-2">CUSTOMER</p>
                <p className="font-medium">{selectedOrder.customerName || 'Guest'}</p>
                <p className="text-xs text-gray-500 mt-1">{selectedOrder.customerEmail}</p>
                {selectedOrder.customerPhone && <p className="text-xs text-gray-500">{selectedOrder.customerPhone}</p>}
              </div>

              {/* PAYMENT SECTION WITH DEBUG */}
              <div className="bg-gray-50 p-3 rounded-xl">
                <p className="text-xs font-bold text-gray-500 mb-2">PAYMENT</p>
                <div className="flex items-center gap-2 mb-2">
                  {getPaymentMethodIcon(selectedOrder.paymentMethod)}
                  <span className="text-sm capitalize">{selectedOrder.paymentMethod}</span>
                  {getPaymentStatusBadge(selectedOrder.paymentStatus)}
                </div>
                
                {/* DEBUG: Log payment proof data */}
                {(() => {
                  console.log('🔍 DEBUG - Selected Order Payment:', {
                    id: selectedOrder.id,
                    paymentMethod: selectedOrder.paymentMethod,
                    paymentMethodType: typeof selectedOrder.paymentMethod,
                    isNotCOD: selectedOrder.paymentMethod !== 'cod',
                    paymentProofImage: selectedOrder.paymentProofImage,
                    hasPaymentProof: !!selectedOrder.paymentProofImage,
                    paymentProofReference: selectedOrder.paymentProofReference
                  });
                  return null;
                })()}
                
                {/* Show receipt for non-COD orders with payment proof - using case-insensitive check */}
                {selectedOrder.paymentMethod?.toLowerCase() !== 'cod' && selectedOrder.paymentProofImage && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    {/* Debug: Show small preview of the receipt */}
                    <div className="mb-2">
                      <img 
                        src={selectedOrder.paymentProofImage} 
                        alt="Payment Proof" 
                        className="w-16 h-16 object-cover rounded border cursor-pointer hover:opacity-80"
                        onClick={() => setShowReceiptModal(true)}
                        onError={(e) => console.error('❌ Image failed to load:', selectedOrder.paymentProofImage)}
                        onLoad={() => console.log('✅ Image loaded successfully')}
                      />
                    </div>
                    <button 
                      onClick={() => setShowReceiptModal(true)} 
                      className="text-xs text-blue-600 flex items-center gap-1 hover:text-blue-700"
                    >
                      <Receipt className="w-3 h-3" /> View Full Receipt
                    </button>
                    {selectedOrder.paymentProofReference && (
                      <p className="text-xs text-gray-500 mt-1">
                        Ref: {selectedOrder.paymentProofReference}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <p className="text-xs font-bold text-gray-500 mb-2">ITEMS ({selectedOrder.items?.length || 0})</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedOrder.items?.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm py-1 border-b border-gray-100">
                      <span className="flex-1">{item.productName} x{item.quantity}</span>
                      <span className="font-medium ml-4">{formatCurrency((item.unitPrice || item.price) * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {selectedOrder.shippingAddress && (
                <div className="bg-gray-50 p-3 rounded-xl">
                  <p className="text-xs font-bold text-gray-500 mb-2">SHIPPING ADDRESS</p>
                  <p className="text-sm">{selectedOrder.shippingAddress}</p>
                </div>
              )}

              <div className="border-t pt-4 space-y-3">
                {selectedOrder.paymentStatus === 'pending' && selectedOrder.paymentProofImage && selectedOrder.paymentMethod?.toLowerCase() !== 'cod' && (
                  <div className="bg-yellow-50 p-3 rounded-xl">
                    <textarea 
                      value={approvalNote} 
                      onChange={(e) => setApprovalNote(e.target.value)} 
                      rows={2} 
                      className="w-full p-2 border rounded-lg text-sm mb-2" 
                      placeholder="Verification notes..."
                    />
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleApprovePayment(selectedOrder.id)} 
                        disabled={updatingStatus}
                        className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button 
                        onClick={() => handleRejectPayment(selectedOrder.id)} 
                        disabled={updatingStatus}
                        className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-2">
                  {['processing','shipped','delivered','cancelled'].map(s => (
                    <button 
                      key={s} 
                      onClick={() => handleStatusUpdate(selectedOrder.id, s)} 
                      disabled={updatingStatus}
                      className="py-2 bg-gray-100 rounded-lg text-xs font-medium hover:bg-gray-200 disabled:opacity-50"
                    >
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
                
                <button 
                  onClick={() => setShowCancelModal(true)} 
                  className="w-full py-2 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50"
                >
                  Cancel Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5">
            <h3 className="text-lg font-bold mb-3">Cancel Order</h3>
            <textarea 
              value={cancellationReason} 
              onChange={(e) => setCancellationReason(e.target.value)} 
              rows={3} 
              className="w-full p-3 border rounded-xl text-sm mb-4" 
              placeholder="Reason for cancellation..."
            />
            <div className="flex gap-3">
              <button onClick={() => setShowCancelModal(false)} className="flex-1 py-2 border rounded-lg">Back</button>
              <button 
                onClick={() => handleCancelOrder(selectedOrder.id)} 
                disabled={updatingStatus}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg disabled:opacity-50"
              >
                Cancel Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceiptModal && selectedOrder && selectedOrder.paymentProofImage && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setShowReceiptModal(false)}>
          <button className="absolute top-4 right-4 text-white"><X className="w-8 h-8" /></button>
          <img src={selectedOrder.paymentProofImage} alt="Receipt" className="max-w-full max-h-full object-contain" />
        </div>
      )}
    </div>
  );
};

export default AdminOrders;