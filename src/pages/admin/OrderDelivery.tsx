// pages/admin/OrderDelivery.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Truck,
  Package,
  CheckCircle,
  Search,
  Loader,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  X,
  Box,
  Camera,
  User as UserIcon,
  Phone,
  MapPin,
  Calendar,
  Filter
} from 'lucide-react';
import { showSuccess, showError, showLoading, dismissToast } from '../../utils/toast';
import api from '../../api/config';

interface DeliveryOrder {
  id: number;
  orderId: number;
  orderNumber: string;
  orderStatus: string;
  deliveryStatus: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  totalAmount: number;
  orderDate: string;
  deliveredAt: string | null;
  deliveredBy: string | null;
  proofImageUrl: string | null;
  recipientName: string | null;
  deliveryNotes: string | null;
  isDelivered: boolean;
}

interface DeliveryStats {
  pendingCount: number;
  outForDeliveryCount: number;
  deliveredToday: number;
  deliveredThisMonth: number;
}

interface PendingDeliveriesResponse {
  pending: DeliveryOrder[];
  outForDelivery: DeliveryOrder[];
  deliveredToday: DeliveryOrder[];
  stats: DeliveryStats;
}

type TimeFilter = 'all' | 'today' | 'this_week' | 'this_month';

const TIME_FILTER_OPTIONS: { value: TimeFilter; label: string }[] = [
  { value: 'all', label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: 'this_week', label: 'This Week' },
  { value: 'this_month', label: 'This Month' },
];

const OrderDelivery: React.FC = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingOrders, setPendingOrders] = useState<DeliveryOrder[]>([]);
  const [outForDeliveryOrders, setOutForDeliveryOrders] = useState<DeliveryOrder[]>([]);
  const [deliveredTodayOrders, setDeliveredTodayOrders] = useState<DeliveryOrder[]>([]);
  const [allDeliveredOrders, setAllDeliveredOrders] = useState<DeliveryOrder[]>([]);
  const [stats, setStats] = useState<DeliveryStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [activeTab, setActiveTab] = useState<'pending' | 'outForDelivery' | 'delivered'>('pending');
  const [selectedOrder, setSelectedOrder] = useState<DeliveryOrder | null>(null);
  const [showDeliverModal, setShowDeliverModal] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);
  
  // Form states
  const [recipientName, setRecipientName] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [proofImage, setProofImage] = useState<File | null>(null);
  const [proofImagePreview, setProofImagePreview] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
      return;
    }
    loadDeliveries();
  }, [isAdmin, navigate]);

  const loadDeliveries = async () => {
    setLoading(true);
    try {
      const response = await api.get<PendingDeliveriesResponse>('/deliveries/pending');
      
      console.log('📦 Delivery data received:', response.data);
      
      const pending = response.data.pending || [];
      const outForDelivery = response.data.outForDelivery || [];
      const deliveredToday = response.data.deliveredToday || [];
      
      setPendingOrders(pending);
      setOutForDeliveryOrders(outForDelivery);
      setDeliveredTodayOrders(deliveredToday);
      
      // Fetch all delivered orders for the "All Delivered" tab
      try {
        const deliveredResponse = await api.get<DeliveryOrder[]>('/deliveries/all-delivered');
        setAllDeliveredOrders(deliveredResponse.data || []);
      } catch {
        // If endpoint doesn't exist, use empty array
        setAllDeliveredOrders([]);
      }
      
      if (response.data.stats) {
        setStats(response.data.stats);
      } else {
        setStats({
          pendingCount: pending.length,
          outForDeliveryCount: outForDelivery.length,
          deliveredToday: deliveredToday.length,
          deliveredThisMonth: 0
        });
      }
      
      setError('');
    } catch (err: any) {
      console.error('Failed to load deliveries:', err);
      setError(err.response?.data?.message || 'Failed to load deliveries');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkOutForDelivery = async (order: DeliveryOrder) => {
    setSubmitting(true);
    const loadingToast = showLoading('Marking out for delivery...');
    
    try {
      await api.post(`/deliveries/${order.orderId}/out-for-delivery`);
      dismissToast(loadingToast);
      showSuccess(`Order #${order.orderNumber} is out for delivery!`);
      
      setPendingOrders(prev => prev.filter(o => o.orderId !== order.orderId));
      setOutForDeliveryOrders(prev => [...prev, { ...order, orderStatus: 'OutForDelivery' }]);
      
      await loadDeliveries();
    } catch (err: any) {
      dismissToast(loadingToast);
      showError(err.response?.data?.message || 'Failed to update status');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelivery = async () => {
    if (!selectedOrder) return;
    
    setSubmitting(true);
    const loadingToast = showLoading('Confirming delivery...');
    
    try {
      let proofImageUrl = '';
      if (proofImage) {
        // TODO: Implement image upload to Cloudinary or your storage
        // proofImageUrl = await uploadImage(proofImage);
      }
      
      await api.post(`/deliveries/${selectedOrder.orderId}/deliver`, {
        recipentName: recipientName || selectedOrder.customerName,
        deliveryNotes,
        proofImageUrl
      });
      
      dismissToast(loadingToast);
      showSuccess(`✅ Order #${selectedOrder.orderNumber} delivered successfully!`);
      
      setOutForDeliveryOrders(prev => prev.filter(o => o.orderId !== selectedOrder.orderId));
      
      const deliveredOrder = { 
        ...selectedOrder, 
        deliveryStatus: 'Delivered', 
        isDelivered: true,
        deliveredAt: new Date().toISOString(),
        recipientName: recipientName || selectedOrder.customerName
      };
      
      setDeliveredTodayOrders(prev => [deliveredOrder, ...prev]);
      setAllDeliveredOrders(prev => [deliveredOrder, ...prev]);
      
      setShowDeliverModal(false);
      setSelectedOrder(null);
      setRecipientName('');
      setDeliveryNotes('');
      setProofImage(null);
      setProofImagePreview('');
      
      await loadDeliveries();
    } catch (err: any) {
      dismissToast(loadingToast);
      showError(err.response?.data?.message || 'Failed to confirm delivery');
    } finally {
      setSubmitting(false);
    }
  };

  const openDeliverModal = (order: DeliveryOrder) => {
    setSelectedOrder(order);
    setRecipientName(order.customerName);
    setDeliveryNotes('');
    setProofImage(null);
    setProofImagePreview('');
    setShowDeliverModal(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProofImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const getDateRange = (filter: TimeFilter): { start: Date; end: Date } => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (filter) {
      case 'today':
        return { start: today, end: now };
      case 'this_week': {
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        return { start: startOfWeek, end: now };
      }
      case 'this_month': {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        startOfMonth.setHours(0, 0, 0, 0);
        return { start: startOfMonth, end: now };
      }
      default:
        return { start: new Date(0), end: now };
    }
  };

  const filterByDate = (orders: DeliveryOrder[], filter: TimeFilter): DeliveryOrder[] => {
    if (filter === 'all') return orders;
    
    const { start, end } = getDateRange(filter);
    
    return orders.filter(order => {
      const orderDate = new Date(order.orderDate);
      return orderDate >= start && orderDate <= end;
    });
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatShortDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) =>
    `₱${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const getStatusBadge = (order: DeliveryOrder) => {
    const effectiveStatus = order.deliveryStatus !== 'Pending' ? order.deliveryStatus : order.orderStatus;
    
    if (order.isDelivered || effectiveStatus?.toLowerCase() === 'delivered') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-50 text-emerald-700">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          Delivered
        </span>
      );
    }
    if (effectiveStatus?.toLowerCase() === 'outfordelivery' || effectiveStatus?.toLowerCase() === 'shipped') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-700">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
          Out for Delivery
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-amber-50 text-amber-700">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
        Pending
      </span>
    );
  };

  const getFilteredOrders = () => {
  let orders: DeliveryOrder[] = [];
  
  if (activeTab === 'pending') {
    orders = pendingOrders;
    orders = filterByDate(orders, timeFilter);
  } else if (activeTab === 'outForDelivery') {
    orders = outForDeliveryOrders;
    orders = filterByDate(orders, timeFilter);
  } else {
    // Delivered tab
    if (timeFilter === 'all') {
      orders = allDeliveredOrders;
    } else {
      // Use whichever has data, then filter by date
      const sourceOrders = allDeliveredOrders.length > 0 ? allDeliveredOrders : deliveredTodayOrders;
      orders = filterByDate(sourceOrders, timeFilter);
    }
  }

  // Apply search filter
  return orders.filter(o =>
    o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.shippingAddress.toLowerCase().includes(searchQuery.toLowerCase())
  );
};

  const displayOrders = getFilteredOrders();

  // Replace the filteredStats useMemo with this corrected version:

const filteredStats = useMemo(() => {
  const filteredPending = filterByDate(pendingOrders, timeFilter);
  const filteredOutForDelivery = filterByDate(outForDeliveryOrders, timeFilter);
  
  // For delivered count, always use the appropriate delivered orders list
  let filteredDelivered: DeliveryOrder[] = [];
  
  if (timeFilter === 'all') {
    // Use allDeliveredOrders for "All Time"
    filteredDelivered = allDeliveredOrders;
  } else {
    // For other filters, check both deliveredToday and allDelivered based on date
    const allDelivered = allDeliveredOrders.length > 0 ? allDeliveredOrders : deliveredTodayOrders;
    filteredDelivered = filterByDate(allDelivered, timeFilter);
  }
  
  return {
    pendingCount: filteredPending.length,
    outForDeliveryCount: filteredOutForDelivery.length,
    deliveredCount: filteredDelivered.length,
  };
}, [pendingOrders, outForDeliveryOrders, deliveredTodayOrders, allDeliveredOrders, timeFilter]);

  const getFilterLabel = () => {
    return TIME_FILTER_OPTIONS.find(t => t.value === timeFilter)?.label || 'All Time';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-stone-50">
        <Loader className="w-6 h-6 animate-spin text-stone-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50" style={{ fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
        select { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%239ca3af' d='M6 8L1 3h10z'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; padding-right: 32px !important; }
      `}</style>

      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-10">
          <p className="text-xs font-medium tracking-[0.15em] uppercase text-stone-400 mb-1">Deliveries</p>
          <h1 className="text-3xl font-light text-stone-900 tracking-tight flex items-center gap-3">
            <Truck className="w-7 h-7 text-stone-600" />
            Delivery Management
          </h1>
          <p className="text-sm text-stone-500 mt-1">Manage outgoing deliveries and confirm completions</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white border border-stone-200 rounded-2xl p-5">
            <p className="text-xs text-stone-400 uppercase tracking-wider mb-2">Pending</p>
            <p className="text-3xl font-light text-amber-600">{filteredStats.pendingCount}</p>
            <p className="text-xs text-stone-400 mt-1">{getFilterLabel()}</p>
          </div>
          <div className="bg-white border border-stone-200 rounded-2xl p-5">
            <p className="text-xs text-stone-400 uppercase tracking-wider mb-2">Out for Delivery</p>
            <p className="text-3xl font-light text-blue-600">{filteredStats.outForDeliveryCount}</p>
            <p className="text-xs text-stone-400 mt-1">{getFilterLabel()}</p>
          </div>
          <div className="bg-white border border-emerald-200 rounded-2xl p-5">
            <p className="text-xs text-stone-400 uppercase tracking-wider mb-2">Delivered</p>
            <p className="text-3xl font-light text-emerald-600">{filteredStats.deliveredCount}</p>
            <p className="text-xs text-stone-400 mt-1">{getFilterLabel()}</p>
          </div>
        </div>

        {/* Tabs, Filter, and Search */}
        <div className="bg-white border border-stone-200 rounded-2xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('pending')}
                className={`px-4 py-2 text-sm font-medium rounded-xl transition ${
                  activeTab === 'pending'
                    ? 'bg-stone-900 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                <Package className="w-4 h-4 inline mr-2" />
                Pending ({filteredStats.pendingCount})
              </button>
              <button
                onClick={() => setActiveTab('outForDelivery')}
                className={`px-4 py-2 text-sm font-medium rounded-xl transition ${
                  activeTab === 'outForDelivery'
                    ? 'bg-stone-900 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                <Truck className="w-4 h-4 inline mr-2" />
                Out for Delivery ({filteredStats.outForDeliveryCount})
              </button>
              <button
                onClick={() => setActiveTab('delivered')}
                className={`px-4 py-2 text-sm font-medium rounded-xl transition ${
                  activeTab === 'delivered'
                    ? 'bg-stone-900 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                <CheckCircle className="w-4 h-4 inline mr-2" />
                Delivered ({filteredStats.deliveredCount})
              </button>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Time Filter Dropdown */}
              <div className="relative">
                <select
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value as TimeFilter)}
                  className="py-2 pl-3 pr-8 text-sm bg-stone-50 border border-stone-200 rounded-xl text-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-200 min-w-[120px]"
                >
                  {TIME_FILTER_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <Calendar className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4 pointer-events-none" />
              </div>
              
              {/* Search */}
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search orders..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl"
                />
              </div>
            </div>
          </div>
          
          {/* Filter Summary */}
          {timeFilter !== 'all' && (
            <div className="mt-3 pt-3 border-t border-stone-100 flex items-center gap-1.5 text-xs text-stone-400">
              <Filter className="w-3.5 h-3.5" />
              <span>Filtered by <span className="font-medium text-stone-600">{getFilterLabel()}</span></span>
              {displayOrders.length > 0 && (
                <span className="ml-1">· {displayOrders.length} result{displayOrders.length !== 1 ? 's' : ''}</span>
              )}
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 px-4 py-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-2 text-sm text-rose-600">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Orders List */}
        <div className="space-y-3">
          {displayOrders.length === 0 ? (
            <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center">
              <Box className="w-12 h-12 text-stone-300 mx-auto mb-3" />
              <p className="text-stone-500">
                {timeFilter !== 'all' 
                  ? `No orders found for ${getFilterLabel().toLowerCase()}` 
                  : 'No orders found'}
              </p>
            </div>
          ) : (
            displayOrders.map(order => (
              <div key={order.orderId} className="bg-white border border-stone-200 rounded-xl overflow-hidden">
                {/* Order Header */}
                <div className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div>
                      <p className="text-xs text-stone-400">Order #</p>
                      <p className="font-mono text-sm font-medium text-stone-800">{order.orderNumber}</p>
                    </div>
                    <div>
                      <p className="text-xs text-stone-400">Customer</p>
                      <p className="text-sm text-stone-700">{order.customerName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-stone-400">Order Date</p>
                      <p className="text-sm text-stone-600">{formatShortDate(order.orderDate)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-stone-400">Total</p>
                      <p className="text-sm font-medium text-stone-800">{formatCurrency(order.totalAmount)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(order)}
                    <button
                      onClick={() => setExpandedOrder(expandedOrder === order.orderId ? null : order.orderId)}
                      className="p-1.5 hover:bg-stone-100 rounded-lg transition"
                    >
                      {expandedOrder === order.orderId ? (
                        <ChevronUp className="w-4 h-4 text-stone-500" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-stone-500" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedOrder === order.orderId && (
                  <div className="px-6 pb-4 border-t border-stone-100 pt-4">
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-stone-400 mb-1">Shipping Address</p>
                        <p className="text-sm text-stone-700 whitespace-pre-line">{order.shippingAddress}</p>
                      </div>
                      <div>
                        <p className="text-xs text-stone-400 mb-1">Contact</p>
                        <p className="text-sm text-stone-700">{order.customerEmail}</p>
                        <p className="text-sm text-stone-700">{order.customerPhone || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-stone-400 mb-1">Delivery Info</p>
                        {order.recipientName && (
                          <p className="text-sm text-stone-700">Recipient: {order.recipientName}</p>
                        )}
                        {order.deliveredAt && (
                          <p className="text-sm text-stone-700">Delivered: {formatDate(order.deliveredAt)}</p>
                        )}
                        {order.deliveredBy && (
                          <p className="text-sm text-stone-700">By: {order.deliveredBy}</p>
                        )}
                      </div>
                    </div>

                    {order.deliveryNotes && (
                      <div className="bg-stone-50 rounded-lg p-3 mb-4">
                        <p className="text-xs text-stone-400 mb-1">Delivery Notes</p>
                        <p className="text-sm text-stone-700">{order.deliveryNotes}</p>
                      </div>
                    )}

                    {order.proofImageUrl && (
                      <div className="mb-4">
                        <p className="text-xs text-stone-400 mb-1">Proof of Delivery</p>
                        <img src={order.proofImageUrl} alt="Proof" className="max-h-40 rounded-lg" />
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      {order.orderStatus?.toLowerCase() !== 'shipped' && 
                       order.orderStatus?.toLowerCase() !== 'outfordelivery' && 
                       order.deliveryStatus?.toLowerCase() !== 'outfordelivery' && 
                       order.deliveryStatus?.toLowerCase() !== 'delivered' && (
                        <button
                          onClick={() => handleMarkOutForDelivery(order)}
                          disabled={submitting}
                          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                        >
                          <Truck className="w-4 h-4 inline mr-2" />
                          Mark Out for Delivery
                        </button>
                      )}
                      
                      {(order.orderStatus?.toLowerCase() === 'shipped' || 
                        order.orderStatus?.toLowerCase() === 'outfordelivery' || 
                        order.deliveryStatus?.toLowerCase() === 'outfordelivery') && 
                       order.deliveryStatus?.toLowerCase() !== 'delivered' && !order.isDelivered && (
                        <button
                          onClick={() => openDeliverModal(order)}
                          className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition"
                        >
                          <CheckCircle className="w-4 h-4 inline mr-2" />
                          Confirm Delivery
                        </button>
                      )}
                      
                      {(order.deliveryStatus?.toLowerCase() === 'delivered' || order.isDelivered) && (
                        <div className="text-emerald-600 text-sm flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          Delivered {order.deliveredBy && `by ${order.deliveredBy}`}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Confirm Delivery Modal */}
      {showDeliverModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/20 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-5 border-b border-stone-100 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-stone-900">Confirm Delivery</h2>
              <button onClick={() => setShowDeliverModal(false)} className="p-2 hover:bg-stone-50 rounded-xl">
                <X className="w-4 h-4 text-stone-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3">
                <p className="text-sm text-emerald-700">
                  Confirm delivery for order #{selectedOrder.orderNumber}
                </p>
                <div className="mt-3 space-y-1">
                  <p className="text-sm font-medium text-stone-800">{selectedOrder.customerName}</p>
                  <p className="text-xs text-stone-500 flex items-start gap-1">
                    <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                    <span className="whitespace-pre-line">{selectedOrder.shippingAddress}</span>
                  </p>
                  {selectedOrder.customerPhone && (
                    <p className="text-xs text-stone-500 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5" />
                      {selectedOrder.customerPhone}
                    </p>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-xs text-stone-400 mb-1">
                  Recipient Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300 w-4 h-4" />
                  <input
                    type="text"
                    value={recipientName}
                    onChange={e => setRecipientName(e.target.value)}
                    placeholder="Who received the package?"
                    className="w-full pl-10 pr-3 py-2 text-sm border border-stone-200 rounded-lg"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs text-stone-400 mb-1">Delivery Notes (Optional)</label>
                <textarea
                  value={deliveryNotes}
                  onChange={e => setDeliveryNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg"
                  placeholder="e.g., Left at guard house, Received by neighbor..."
                />
              </div>
              
              <div>
                <label className="block text-xs text-stone-400 mb-1">Proof of Delivery (Optional)</label>
                <div className="border-2 border-dashed border-stone-200 rounded-lg p-4 text-center">
                  {proofImagePreview ? (
                    <div className="relative">
                      <img src={proofImagePreview} alt="Proof" className="max-h-40 mx-auto rounded-lg" />
                      <button
                        onClick={() => {
                          setProofImage(null);
                          setProofImagePreview('');
                        }}
                        className="absolute top-1 right-1 p-1 bg-white rounded-full shadow"
                      >
                        <X className="w-4 h-4 text-stone-500" />
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <Camera className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                      <p className="text-xs text-stone-400">Click to upload photo proof</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-stone-100 flex gap-3">
              <button
                onClick={() => setShowDeliverModal(false)}
                className="flex-1 px-4 py-2 border border-stone-200 rounded-xl text-sm text-stone-600 hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelivery}
                disabled={submitting || !recipientName.trim()}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Confirm Delivery
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDelivery;