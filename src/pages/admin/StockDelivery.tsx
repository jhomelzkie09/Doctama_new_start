import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import productService from '../../services/product.service';
import deliveryService, { DeliveryOrder, DeliveryItem, DeliveryStats } from '../../services/delivery.service';
import {
  Package,
  Truck,
  Plus,
  Search,
  X,
  AlertCircle,
  Loader,
  Calendar,
  Eye,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  CheckCircle,
  DollarSign,
  TrendingUp,
  Edit3
} from 'lucide-react';
import { showSuccess, showError, showLoading, dismissToast } from '../../utils/toast';
import { Product } from '../../types';

type TimeFilter = 'all' | 'today' | 'yesterday' | 'this_week' | 'last_week' | 'this_month' | 'last_month' | 'this_year';

const TIME_FILTER_OPTIONS: { value: TimeFilter; label: string }[] = [
  { value: 'all', label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'this_week', label: 'This Week' },
  { value: 'last_week', label: 'Last Week' },
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'this_year', label: 'This Year' },
];

// Extended interface for receive items with price update option
interface ReceiveItemWithPriceUpdate extends DeliveryItem {
  updateSellingPrice: boolean;
  newSellingPrice?: number;
  currentSellingPrice?: number;
  suggestedSellingPrice?: number;
}

const StockDelivery = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const [deliveries, setDeliveries] = useState<DeliveryOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryOrder | null>(null);
  const [stats, setStats] = useState<DeliveryStats>({
    pendingDeliveries: 0,
    receivedThisMonth: 0,
    totalItemsReceived: 0,
    totalValue: 0,
    totalDeliveries: 0,
    averageOrderValue: 0
  });

  const itemsPerPage = 10;

  useEffect(() => {
    if (!isAdmin) { navigate('/'); return; }
    loadData();
  }, [isAdmin, navigate]);

  const getDateRange = (filter: TimeFilter): { start: Date | null; end: Date | null } => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    switch (filter) {
      case 'all': return { start: null, end: null };
      case 'today': return { start: today, end: now };
      case 'yesterday': {
        const y = new Date(today); y.setDate(y.getDate() - 1);
        const ye = new Date(today); ye.setDate(ye.getDate() - 1); ye.setHours(23, 59, 59, 999);
        return { start: y, end: ye };
      }
      case 'this_week': {
        const s = new Date(today); s.setDate(today.getDate() - today.getDay()); s.setHours(0,0,0,0);
        return { start: s, end: now };
      }
      case 'last_week': {
        const s = new Date(today); s.setDate(today.getDate() - today.getDay() - 7); s.setHours(0,0,0,0);
        const e = new Date(s); e.setDate(s.getDate() + 6); e.setHours(23,59,59,999);
        return { start: s, end: e };
      }
      case 'this_month': return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: now };
      case 'last_month': {
        const s = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const e = new Date(now.getFullYear(), now.getMonth(), 0); e.setHours(23,59,59,999);
        return { start: s, end: e };
      }
      case 'this_year': return { start: new Date(now.getFullYear(), 0, 1), end: now };
      default: return { start: null, end: null };
    }
  };

  const filterDeliveriesByDate = (deliveries: DeliveryOrder[], filter: TimeFilter): DeliveryOrder[] => {
    if (filter === 'all') return deliveries;
    const { start, end } = getDateRange(filter);
    if (!start || !end) return deliveries;
    return deliveries.filter(d => {
      const date = new Date(d.deliveryDate);
      return date >= start && date <= end;
    });
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [productsData, deliveriesData, statsData] = await Promise.all([
        productService.getProducts(),
        deliveryService.getAllDeliveries(),
        deliveryService.getDeliveryStats()
      ]);
      setProducts(productsData);
      // Filter to only show deliveries that have been fully received
      const receivedDeliveries = deliveriesData.filter(d => d.status === 'received');
      setDeliveries(receivedDeliveries);
      setStats(statsData);
    } catch (err) {
      setError('Failed to load delivery data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleString('en-PH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const formatCurrency = (amount: number) =>
    `₱${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'received': return { label: 'Received', dot: 'bg-emerald-400', text: 'text-emerald-700', bg: 'bg-emerald-50', icon: CheckCircle };
      default:         return { label: status,     dot: 'bg-gray-400',    text: 'text-gray-600',   bg: 'bg-gray-50',   icon: Package };
    }
  };

  const dateFilteredDeliveries = filterDeliveriesByDate(deliveries, timeFilter);
  const filteredDeliveries = dateFilteredDeliveries.filter(d => {
    const matchesSearch =
      d.deliveryNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.supplierName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.purchaseOrderNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const totalPages = Math.ceil(filteredDeliveries.length / itemsPerPage);
  const paginatedDeliveries = filteredDeliveries.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const filteredStats = {
    totalDeliveries: dateFilteredDeliveries.length,
    totalQuantity: dateFilteredDeliveries.reduce((sum, d) => sum + d.totalQuantity, 0),
    totalValue: dateFilteredDeliveries.reduce((sum, d) => sum + d.items.reduce((s, i) => s + (i.receivedQuantity * i.unitPrice), 0), 0),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-stone-50">
        <div className="flex flex-col items-center gap-3">
          <Loader className="w-6 h-6 animate-spin text-stone-400" />
          <p className="text-sm text-stone-400 tracking-wide">Loading deliveries…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50" style={{ fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
        .delivery-row { transition: background 0.15s ease; }
        .delivery-row:hover { background: #fafaf9; }
        .btn-primary { transition: all 0.15s ease; }
        .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(0,0,0,0.12); }
        .stat-card { transition: all 0.2s ease; }
        .stat-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.06); }
        .action-btn { transition: all 0.15s ease; }
        .action-btn:hover { transform: scale(1.1); }
        select { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%239ca3af' d='M6 8L1 3h10z'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; padding-right: 32px !important; }
      `}</style>

      <div className="max-w-7xl mx-auto px-6 py-10">

        {/* ── Header ── */}
        <div className="flex items-start justify-between mb-10">
          <div>
            <p className="text-xs font-medium tracking-[0.15em] uppercase text-stone-400 mb-1">Inventory</p>
            <h1 className="text-3xl font-light text-stone-900 tracking-tight">Stock Deliveries</h1>
          </div>
          <button
            onClick={() => navigate('/admin/deliveries/new')}
            className="btn-primary flex items-center gap-2 px-5 py-2.5 bg-stone-900 text-white text-sm font-medium rounded-xl"
          >
            <Plus className="w-4 h-4" />
            Record Delivery
          </button>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            {
              label: 'Total Deliveries',
              value: filteredStats.totalDeliveries,
              sub: TIME_FILTER_OPTIONS.find(t => t.value === timeFilter)?.label.toLowerCase() ?? 'all time',
              accent: 'border-stone-200',
              valueColor: 'text-stone-800',
              icon: Truck,
              iconColor: 'text-stone-400 bg-stone-100'
            },
            {
              label: 'Total Units',
              value: filteredStats.totalQuantity,
              sub: 'items received',
              accent: 'border-emerald-200',
              valueColor: 'text-emerald-600',
              icon: Package,
              iconColor: 'text-emerald-400 bg-emerald-50'
            },
            {
              label: 'Total Value',
              value: formatCurrency(filteredStats.totalValue),
              sub: 'inventory cost',
              accent: 'border-stone-200',
              valueColor: 'text-stone-800',
              icon: DollarSign,
              iconColor: 'text-stone-400 bg-stone-100'
            }
          ].map(({ label, value, sub, accent, valueColor, icon: Icon, iconColor }) => (
            <div key={label} className={`stat-card bg-white border ${accent} rounded-2xl p-6`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-3">{label}</p>
                  <p className={`text-4xl font-light ${valueColor}`}>{value}</p>
                  <p className="text-xs text-stone-400 mt-1">{sub}</p>
                </div>
                <div className={`p-2.5 rounded-xl ${iconColor}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Filters ── */}
        <div className="bg-white border border-stone-200 rounded-2xl p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-300 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by inventory number or supplier…"
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-xl text-stone-800 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-200 focus:border-stone-300"
              />
            </div>

            <select
              value={timeFilter}
              onChange={e => { setTimeFilter(e.target.value as TimeFilter); setCurrentPage(1); }}
              className="py-2.5 pl-3 text-sm bg-stone-50 border border-stone-200 rounded-xl text-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-200 min-w-[130px]"
            >
              {TIME_FILTER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>

            <button
              onClick={loadData}
              className="p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-500 hover:bg-stone-100 transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {timeFilter !== 'all' && (
            <div className="mt-3 pt-3 border-t border-stone-100 flex items-center gap-1.5 text-xs text-stone-400">
              <Calendar className="w-3.5 h-3.5" />
              <span>Filtered by <span className="font-medium text-stone-600">{TIME_FILTER_OPTIONS.find(t => t.value === timeFilter)?.label}</span></span>
              {filteredDeliveries.length > 0 && <span className="ml-1">· {filteredDeliveries.length} result{filteredDeliveries.length !== 1 ? 's' : ''}</span>}
            </div>
          )}
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="mb-6 px-4 py-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-2 text-sm text-rose-600">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* ── Table ── */}
        <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
          {paginatedDeliveries.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  <thead>
                    <tr className="border-b border-stone-100">
                      {['Inventory #', 'Supplier', 'Date Received', 'Items', 'Total Cost', ''].map(h => (
                        <th key={h} className="px-6 py-4 text-left text-xs font-medium text-stone-400 uppercase tracking-wider whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-50">
                    {paginatedDeliveries.map(delivery => {
                      const deliveryTotal = delivery.items.reduce((sum, i) => sum + (i.receivedQuantity * i.unitPrice), 0);
                      
                      return (
                        <tr key={delivery.id} className="delivery-row">
                          <td className="px-6 py-4">
                            <span className="font-mono text-xs text-stone-600 bg-stone-50 px-2 py-1 rounded-lg">
                              {delivery.deliveryNumber}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm font-medium text-stone-800">{delivery.supplierName}</p>
                            {delivery.supplierContact && (
                              <p className="text-xs text-stone-400 mt-0.5">{delivery.supplierContact}</p>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {delivery.receivedAt ? (
                              <div>
                                <p className="text-sm text-stone-600">{formatDate(delivery.receivedAt)}</p>
                                <p className="text-xs text-stone-400 mt-0.5">
                                  {new Date(delivery.receivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            ) : (
                              <span className="text-stone-300">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-stone-700">{delivery.totalItems} items</p>
                            <p className="text-xs text-stone-400 mt-0.5">{delivery.totalQuantity} units</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm font-medium text-stone-700 font-mono">{formatCurrency(deliveryTotal)}</p>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => { setSelectedDelivery(delivery); setShowDeliveryModal(true); }}
                              className="action-btn p-2 text-stone-400 hover:bg-stone-50 rounded-lg"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-stone-100 flex items-center justify-between">
                  <p className="text-xs text-stone-400">
                    Page {currentPage} of {totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-1.5 border border-stone-200 rounded-lg text-stone-500 hover:bg-stone-50 disabled:opacity-30 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-1.5 border border-stone-200 rounded-lg text-stone-500 hover:bg-stone-50 disabled:opacity-30 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Empty State */
            <div className="text-center py-20">
              <div className="w-14 h-14 bg-stone-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Truck className="w-7 h-7 text-stone-300" />
              </div>
              <h3 className="text-base font-medium text-stone-700 mb-1">No deliveries found</h3>
              <p className="text-sm text-stone-400 mb-6 max-w-xs mx-auto">
                {timeFilter !== 'all'
                  ? `No deliveries for ${TIME_FILTER_OPTIONS.find(t => t.value === timeFilter)?.label.toLowerCase()}`
                  : 'Record deliveries as they arrive to track inventory'}
              </p>
              <button
                onClick={() => navigate('/admin/deliveries/new')}
                className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 bg-stone-900 text-white text-sm font-medium rounded-xl"
              >
                <Plus className="w-4 h-4" />
                Record New Delivery
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Delivery Details Modal ── */}
      {showDeliveryModal && selectedDelivery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/20 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl border border-stone-100">
            <div className="sticky top-0 bg-white border-b border-stone-100 px-6 py-5 flex justify-between items-center rounded-t-2xl">
              <div>
                <h2 className="text-lg font-semibold text-stone-900">Delivery Details</h2>
                <p className="text-xs text-stone-400 mt-0.5" style={{ fontFamily: 'DM Mono, monospace' }}>
                  Inventory #{selectedDelivery.deliveryNumber}
                </p>
              </div>
              <button onClick={() => setShowDeliveryModal(false)} className="p-2 hover:bg-stone-50 rounded-xl transition">
                <X className="w-4 h-4 text-stone-500" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-stone-50 rounded-xl p-4">
                  <p className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-2">Supplier</p>
                  <p className="font-medium text-stone-900 text-sm">{selectedDelivery.supplierName}</p>
                  {selectedDelivery.supplierContact && <p className="text-xs text-stone-500 mt-1">{selectedDelivery.supplierContact}</p>}
                  {selectedDelivery.supplierEmail && <p className="text-xs text-stone-500">{selectedDelivery.supplierEmail}</p>}
                  {selectedDelivery.supplierPhone && <p className="text-xs text-stone-500">{selectedDelivery.supplierPhone}</p>}
                </div>
                <div className="bg-stone-50 rounded-xl p-4">
                  <p className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-2">Delivery Info</p>
                  <p className="text-xs text-stone-600 font-mono">Ref: {selectedDelivery.purchaseOrderNumber}</p>
                  <p className="text-xs text-stone-500 mt-1">Received: {formatDate(selectedDelivery.receivedAt || selectedDelivery.deliveryDate)}</p>
                  {selectedDelivery.trackingNumber && (
                    <p className="text-xs text-stone-500">Tracking: {selectedDelivery.trackingNumber}</p>
                  )}
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-3">Received Items</p>
                <div className="border border-stone-100 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-stone-50 border-b border-stone-100">
                      <tr>
                        {['Product', 'Quantity', 'Unit Cost', 'Total'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-medium text-stone-400">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-50">
                      {selectedDelivery.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-stone-50/50">
                          <td className="px-4 py-3 text-sm font-medium text-stone-800">{item.productName}</td>
                          <td className="px-4 py-3">
                            <span className="text-sm font-medium text-emerald-600">
                              {item.receivedQuantity}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-stone-500 font-mono">{formatCurrency(item.unitPrice)}</td>
                          <td className="px-4 py-3 text-sm text-stone-700 font-mono">{formatCurrency(item.receivedQuantity * item.unitPrice)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-stone-50 border-t border-stone-100">
                      <tr>
                        <td colSpan={3} className="px-4 py-3 text-right text-xs font-medium text-stone-500">Total:</td>
                        <td className="px-4 py-3 text-sm font-medium text-stone-800 font-mono">
                          {formatCurrency(selectedDelivery.items.reduce((sum, i) => sum + (i.receivedQuantity * i.unitPrice), 0))}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {selectedDelivery.notes && (
                <div className="bg-stone-50 rounded-xl p-4">
                  <p className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-1">Notes</p>
                  <p className="text-sm text-stone-600">{selectedDelivery.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockDelivery;