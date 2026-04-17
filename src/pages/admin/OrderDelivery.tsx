// pages/admin/OrderDelivery.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Truck,
  Package,
  CheckCircle,
  Clock,
  MapPin,
  User,
  Calendar,
  Search,
  Loader,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  X,
  Eye,
  Box
} from 'lucide-react';
import { showSuccess, showError, showLoading, dismissToast } from '../../utils/toast';
import api from '../../api/config';

interface DeliveryOrder {
  orderId: number;
  orderNumber: string;
  orderStatus: string;
  orderDate: string;
  customerName: string;
  customerEmail: string;
  shippingAddress: string;
  totalAmount: number;
  shippedAt: string | null;
  deliveredAt: string | null;
  trackingNumber: string | null;
  courier: string | null;
  deliveryNotes: string | null;
  deliveredBy: string | null;
  isShipped: boolean;
  isDelivered: boolean;
  daysSinceOrder: number | null;
  daysInTransit: number | null;
}

interface DeliveryStats {
  totalPending: number;
  totalShipped: number;
  deliveredToday: number;
  deliveredThisWeek: number;
  deliveredThisMonth: number;
  totalDeliveredValue: number;
}

interface PendingDeliveriesResponse {
  shipped: DeliveryOrder[];
  processing: DeliveryOrder[];
  stats: DeliveryStats;
}

const OrderDelivery: React.FC = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [shippedOrders, setShippedOrders] = useState<DeliveryOrder[]>([]);
  const [processingOrders, setProcessingOrders] = useState<DeliveryOrder[]>([]);
  const [stats, setStats] = useState<DeliveryStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'shipped' | 'processing'>('shipped');
  const [selectedOrder, setSelectedOrder] = useState<DeliveryOrder | null>(null);
  const [showShipModal, setShowShipModal] = useState(false);
  const [showDeliverModal, setShowDeliverModal] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);
  
  // Form states
  const [trackingNumber, setTrackingNumber] = useState('');
  const [courier, setCourier] = useState('');
  const [shipNotes, setShipNotes] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
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
      const response = await api.get<PendingDeliveriesResponse>('/orders/delivery/pending');
      setShippedOrders(response.data.shipped);
      setProcessingOrders(response.data.processing);
      setStats(response.data.stats);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load deliveries');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkShipped = async () => {
    if (!selectedOrder) return;
    
    setSubmitting(true);
    const loadingToast = showLoading('Marking as shipped...');
    
    try {
      await api.put(`/orders/delivery/${selectedOrder.orderId}/ship`, {
        trackingNumber,
        courier,
        notes: shipNotes
      });
      
      dismissToast(loadingToast);
      showSuccess(`Order #${selectedOrder.orderNumber} marked as shipped!`);
      
      setShowShipModal(false);
      setSelectedOrder(null);
      setTrackingNumber('');
      setCourier('');
      setShipNotes('');
      
      await loadDeliveries();
    } catch (err: any) {
      dismissToast(loadingToast);
      showError(err.response?.data?.message || 'Failed to mark as shipped');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelivery = async () => {
    if (!selectedOrder) return;
    
    setSubmitting(true);
    const loadingToast = showLoading('Confirming delivery...');
    
    try {
      await api.put(`/orders/delivery/${selectedOrder.orderId}/deliver`, {
        deliveryNotes,
        sendNotification: true
      });
      
      dismissToast(loadingToast);
      showSuccess(`✅ Order #${selectedOrder.orderNumber} delivered successfully!`);
      
      setShowDeliverModal(false);
      setSelectedOrder(null);
      setDeliveryNotes('');
      
      await loadDeliveries();
    } catch (err: any) {
      dismissToast(loadingToast);
      showError(err.response?.data?.message || 'Failed to confirm delivery');
    } finally {
      setSubmitting(false);
    }
  };

  const openShipModal = (order: DeliveryOrder) => {
    setSelectedOrder(order);
    setTrackingNumber(order.trackingNumber || '');
    setCourier(order.courier || '');
    setShipNotes('');
    setShowShipModal(true);
  };

  const openDeliverModal = (order: DeliveryOrder) => {
    setSelectedOrder(order);
    setDeliveryNotes('');
    setShowDeliverModal(true);
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

  const formatCurrency = (amount: number) =>
    `₱${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const getStatusBadge = (order: DeliveryOrder) => {
    if (order.isDelivered) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-50 text-emerald-700">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          Delivered
        </span>
      );
    }
    if (order.isShipped) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-700">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
          In Transit
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-amber-50 text-amber-700">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
        Processing
      </span>
    );
  };

  const filteredShipped = shippedOrders.filter(o =>
    o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.trackingNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredProcessing = processingOrders.filter(o =>
    o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.customerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayOrders = activeTab === 'shipped' ? filteredShipped : filteredProcessing;

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
          <p className="text-xs font-medium tracking-[0.15em] uppercase text-stone-400 mb-1">Orders</p>
          <h1 className="text-3xl font-light text-stone-900 tracking-tight flex items-center gap-3">
            <Truck className="w-7 h-7 text-stone-600" />
            Order Delivery Tracking
          </h1>
          <p className="text-sm text-stone-500 mt-1">Manage shipments and confirm deliveries</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="bg-white border border-stone-200 rounded-2xl p-5">
              <p className="text-xs text-stone-400 uppercase tracking-wider mb-2">Pending Processing</p>
              <p className="text-3xl font-light text-amber-600">{stats.totalPending}</p>
            </div>
            <div className="bg-white border border-stone-200 rounded-2xl p-5">
              <p className="text-xs text-stone-400 uppercase tracking-wider mb-2">In Transit</p>
              <p className="text-3xl font-light text-blue-600">{stats.totalShipped}</p>
            </div>
            <div className="bg-white border border-emerald-200 rounded-2xl p-5">
              <p className="text-xs text-stone-400 uppercase tracking-wider mb-2">Delivered Today</p>
              <p className="text-3xl font-light text-emerald-600">{stats.deliveredToday}</p>
            </div>
            <div className="bg-white border border-stone-200 rounded-2xl p-5">
              <p className="text-xs text-stone-400 uppercase tracking-wider mb-2">Delivered This Month</p>
              <p className="text-3xl font-light text-stone-800">{stats.deliveredThisMonth}</p>
            </div>
          </div>
        )}

        {/* Tabs and Search */}
        <div className="bg-white border border-stone-200 rounded-2xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('shipped')}
                className={`px-4 py-2 text-sm font-medium rounded-xl transition ${
                  activeTab === 'shipped'
                    ? 'bg-stone-900 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                <Truck className="w-4 h-4 inline mr-2" />
                In Transit ({filteredShipped.length})
              </button>
              <button
                onClick={() => setActiveTab('processing')}
                className={`px-4 py-2 text-sm font-medium rounded-xl transition ${
                  activeTab === 'processing'
                    ? 'bg-stone-900 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                <Package className="w-4 h-4 inline mr-2" />
                Processing ({filteredProcessing.length})
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
                      <p className="text-sm text-stone-600">{formatDate(order.orderDate)}</p>
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
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-stone-400 mb-1">Shipping Address</p>
                        <p className="text-sm text-stone-700 whitespace-pre-line">{order.shippingAddress}</p>
                      </div>
                      <div>
                        <p className="text-xs text-stone-400 mb-1">Customer Contact</p>
                        <p className="text-sm text-stone-700">{order.customerEmail}</p>
                      </div>
                    </div>

                    {order.isShipped && (
                      <div className="bg-blue-50 rounded-lg p-3 mb-4">
                        <p className="text-xs font-medium text-blue-700 mb-2">Shipping Information</p>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-blue-600">Shipped:</span>{' '}
                            {formatDate(order.shippedAt)}
                          </div>
                          <div>
                            <span className="text-blue-600">Courier:</span>{' '}
                            {order.courier || '—'}
                          </div>
                          <div>
                            <span className="text-blue-600">Tracking:</span>{' '}
                            <span className="font-mono">{order.trackingNumber || '—'}</span>
                          </div>
                        </div>
                        {order.daysInTransit && (
                          <p className="text-xs text-blue-500 mt-2">
                            In transit for {order.daysInTransit} day{order.daysInTransit !== 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      {!order.isShipped && (
                        <button
                          onClick={() => openShipModal(order)}
                          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
                        >
                          <Truck className="w-4 h-4 inline mr-2" />
                          Mark as Shipped
                        </button>
                      )}
                      {order.isShipped && !order.isDelivered && (
                        <button
                          onClick={() => openDeliverModal(order)}
                          className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition"
                        >
                          <CheckCircle className="w-4 h-4 inline mr-2" />
                          Confirm Delivery
                        </button>
                      )}
                      {order.isDelivered && (
                        <div className="text-emerald-600 text-sm flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          Delivered on {formatDate(order.deliveredAt)}
                          {order.deliveredBy && ` by ${order.deliveredBy}`}
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

      {/* Mark as Shipped Modal */}
      {showShipModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/20 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl">
            <div className="px-6 py-5 border-b border-stone-100 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-stone-900">Mark as Shipped</h2>
              <button onClick={() => setShowShipModal(false)} className="p-2 hover:bg-stone-50 rounded-xl">
                <X className="w-4 h-4 text-stone-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-sm text-stone-600">
                Order #{selectedOrder.orderNumber} - {selectedOrder.customerName}
              </p>
              
              <div>
                <label className="block text-xs text-stone-400 mb-1">Courier</label>
                <input
                  type="text"
                  value={courier}
                  onChange={e => setCourier(e.target.value)}
                  placeholder="e.g., LBC, J&T, Ninja Van"
                  className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg"
                />
              </div>
              
              <div>
                <label className="block text-xs text-stone-400 mb-1">Tracking Number</label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={e => setTrackingNumber(e.target.value)}
                  placeholder="Enter tracking number"
                  className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg font-mono"
                />
              </div>
              
              <div>
                <label className="block text-xs text-stone-400 mb-1">Notes (Optional)</label>
                <textarea
                  value={shipNotes}
                  onChange={e => setShipNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg"
                  placeholder="Any additional notes..."
                />
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-stone-100 flex gap-3">
              <button
                onClick={() => setShowShipModal(false)}
                className="flex-1 px-4 py-2 border border-stone-200 rounded-xl text-sm text-stone-600 hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                onClick={handleMarkShipped}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? <Loader className="w-4 h-4 animate-spin mx-auto" /> : 'Confirm Shipment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delivery Modal */}
      {showDeliverModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/20 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl">
            <div className="px-6 py-5 border-b border-stone-100 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-stone-900">Confirm Delivery</h2>
              <button onClick={() => setShowDeliverModal(false)} className="p-2 hover:bg-stone-50 rounded-xl">
                <X className="w-4 h-4 text-stone-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3">
                <p className="text-sm text-emerald-700">
                  Confirm that order #{selectedOrder.orderNumber} has been successfully delivered to:
                </p>
                <p className="text-sm font-medium text-stone-800 mt-2">{selectedOrder.customerName}</p>
                <p className="text-xs text-stone-500 mt-1 whitespace-pre-line">{selectedOrder.shippingAddress}</p>
              </div>
              
              <div>
                <label className="block text-xs text-stone-400 mb-1">Delivery Notes (Optional)</label>
                <textarea
                  value={deliveryNotes}
                  onChange={e => setDeliveryNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg"
                  placeholder="e.g., Received by guard, Left at reception..."
                />
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
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
              >
                {submitting ? <Loader className="w-4 h-4 animate-spin mx-auto" /> : 'Confirm Delivery'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDelivery;