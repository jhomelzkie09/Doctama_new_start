// pages/admin/OrderDelivery.tsx
import React, { useState, useEffect } from 'react';
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
  MapPin
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

const OrderDelivery: React.FC = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingOrders, setPendingOrders] = useState<DeliveryOrder[]>([]);
  const [outForDeliveryOrders, setOutForDeliveryOrders] = useState<DeliveryOrder[]>([]);
  const [deliveredTodayOrders, setDeliveredTodayOrders] = useState<DeliveryOrder[]>([]);
  const [stats, setStats] = useState<DeliveryStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'pending' | 'outForDelivery' | 'deliveredToday'>('pending');
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
      
      // Categorize orders based on orderStatus
      const allOrders = response.data.pending;
      
      const pending = allOrders.filter(o => 
        o.orderStatus?.toLowerCase() !== 'shipped' && 
        o.orderStatus?.toLowerCase() !== 'outfordelivery' &&
        o.orderStatus?.toLowerCase() !== 'delivered' &&
        o.orderStatus?.toLowerCase() !== 'cancelled'
      );
      
      const outForDelivery = allOrders.filter(o => 
        o.orderStatus?.toLowerCase() === 'shipped' || 
        o.orderStatus?.toLowerCase() === 'outfordelivery'
      );
      
      const deliveredToday = response.data.deliveredToday || [];
      
      setPendingOrders(pending);
      setOutForDeliveryOrders(outForDelivery);
      setDeliveredTodayOrders(deliveredToday);
      setStats(response.data.stats);
    } catch (err: any) {
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
      
      // Update local state immediately
      setPendingOrders(prev => prev.filter(o => o.orderId !== order.orderId));
      setOutForDeliveryOrders(prev => [...prev, { ...order, orderStatus: 'OutForDelivery' }]);
      
      // Refresh from server
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
      // Upload proof image if provided
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
      
      // Update local state immediately
      setOutForDeliveryOrders(prev => prev.filter(o => o.orderId !== selectedOrder.orderId));
      setDeliveredTodayOrders(prev => [{ 
        ...selectedOrder, 
        deliveryStatus: 'Delivered', 
        isDelivered: true,
        deliveredAt: new Date().toISOString(),
        recipientName: recipientName || selectedOrder.customerName
      }, ...prev]);
      
      setShowDeliverModal(false);
      setSelectedOrder(null);
      setRecipientName('');
      setDeliveryNotes('');
      setProofImage(null);
      setProofImagePreview('');
      
      // Refresh from server
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
    // Check deliveryStatus first, then fall back to orderStatus
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
    if (activeTab === 'pending') orders = pendingOrders;
    else if (activeTab === 'outForDelivery') orders = outForDeliveryOrders;
    else orders = deliveredTodayOrders;

    return orders.filter(o =>
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.shippingAddress.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const displayOrders = getFilteredOrders();

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
        {stats && (
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="bg-white border border-stone-200 rounded-2xl p-5">
              <p className="text-xs text-stone-400 uppercase tracking-wider mb-2">Pending</p>
              <p className="text-3xl font-light text-amber-600">{stats.pendingCount}</p>
            </div>
            <div className="bg-white border border-stone-200 rounded-2xl p-5">
              <p className="text-xs text-stone-400 uppercase tracking-wider mb-2">Out for Delivery</p>
              <p className="text-3xl font-light text-blue-600">{stats.outForDeliveryCount}</p>
            </div>
            <div className="bg-white border border-emerald-200 rounded-2xl p-5">
              <p className="text-xs text-stone-400 uppercase tracking-wider mb-2">Delivered Today</p>
              <p className="text-3xl font-light text-emerald-600">{stats.deliveredToday}</p>
            </div>
            <div className="bg-white border border-stone-200 rounded-2xl p-5">
              <p className="text-xs text-stone-400 uppercase tracking-wider mb-2">This Month</p>
              <p className="text-3xl font-light text-stone-800">{stats.deliveredThisMonth}</p>
            </div>
          </div>
        )}

        {/* Tabs and Search */}
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
                Pending ({pendingOrders.length})
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
                Out for Delivery ({outForDeliveryOrders.length})
              </button>
              <button
                onClick={() => setActiveTab('deliveredToday')}
                className={`px-4 py-2 text-sm font-medium rounded-xl transition ${
                  activeTab === 'deliveredToday'
                    ? 'bg-stone-900 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                <CheckCircle className="w-4 h-4 inline mr-2" />
                Delivered Today ({deliveredTodayOrders.length})
              </button>
            </div>
            
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
              <p className="text-stone-500">No orders found</p>
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
                      {/* Show "Mark Out for Delivery" if order is pending/processing */}
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
                      
                      {/* Show "Confirm Delivery" if order is out for delivery */}
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
                      
                      {/* Show delivered status */}
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