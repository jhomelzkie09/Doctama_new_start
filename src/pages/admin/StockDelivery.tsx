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
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Filter
} from 'lucide-react';
import { showSuccess, showError, showLoading, dismissToast } from '../../utils/toast';
import { Product } from '../../types';

// Time filter types
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

const StockDelivery = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  
  const [deliveries, setDeliveries] = useState<DeliveryOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryOrder | null>(null);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [updatingStock, setUpdatingStock] = useState(false);
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
    if (!isAdmin) {
      navigate('/');
      return;
    }
    loadData();
  }, [isAdmin, navigate]);

  // Helper function to get date range based on filter
  const getDateRange = (filter: TimeFilter): { start: Date | null; end: Date | null } => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (filter) {
      case 'all':
        return { start: null, end: null };
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
        return { start: null, end: null };
    }
  };

  // Filter deliveries by date range
  const filterDeliveriesByDate = (deliveries: DeliveryOrder[], filter: TimeFilter): DeliveryOrder[] => {
    if (filter === 'all') return deliveries;
    
    const { start, end } = getDateRange(filter);
    if (!start || !end) return deliveries;
    
    return deliveries.filter(delivery => {
      const deliveryDate = new Date(delivery.deliveryDate);
      return deliveryDate >= start && deliveryDate <= end;
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
      setDeliveries(deliveriesData);
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load delivery data');
    } finally {
      setLoading(false);
    }
  };

  const handleReceiveDelivery = (delivery: DeliveryOrder) => {
    setSelectedDelivery(delivery);
    setShowReceiveModal(true);
  };

  const handleConfirmReceive = async (delivery: DeliveryOrder, receivedItems: DeliveryItem[]) => {
    setUpdatingStock(true);
    const loadingToast = showLoading('Processing delivery...');
    
    try {
      const itemsToReceive = receivedItems.map(item => ({
        productId: item.productId,
        receivedQuantity: item.receivedQuantity
      }));
      
      await deliveryService.receiveDelivery(delivery.id, itemsToReceive);
      
      dismissToast(loadingToast);
      showSuccess('Delivery received successfully! Stock updated.');
      setShowReceiveModal(false);
      setSelectedDelivery(null);
      
      await loadData();
    } catch (error) {
      dismissToast(loadingToast);
      showError('Failed to process delivery');
      console.error('Error processing delivery:', error);
    } finally {
      setUpdatingStock(false);
    }
  };

  const handleCreateDelivery = () => {
    navigate('/admin/deliveries/new');
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return `₱${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'received':
        return { label: 'Received', className: 'bg-green-100 text-green-800', icon: CheckCircle };
      case 'pending':
        return { label: 'Pending', className: 'bg-yellow-100 text-yellow-800', icon: Clock };
      case 'partial':
        return { label: 'Partial', className: 'bg-orange-100 text-orange-800', icon: AlertTriangle };
      case 'cancelled':
        return { label: 'Cancelled', className: 'bg-red-100 text-red-800', icon: XCircle };
      default:
        return { label: status, className: 'bg-gray-100 text-gray-800', icon: Package };
    }
  };

  // Apply filters: date filter first, then search and status
  const dateFilteredDeliveries = filterDeliveriesByDate(deliveries, timeFilter);
  
  const filteredDeliveries = dateFilteredDeliveries.filter(delivery => {
    const matchesSearch = delivery.deliveryNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         delivery.supplierName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         delivery.purchaseOrderNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || delivery.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredDeliveries.length / itemsPerPage);
  const paginatedDeliveries = filteredDeliveries.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Calculate stats for filtered period
  const filteredStats = {
    totalDeliveries: dateFilteredDeliveries.length,
    pendingCount: dateFilteredDeliveries.filter(d => d.status === 'pending').length,
    receivedCount: dateFilteredDeliveries.filter(d => d.status === 'received').length,
    partialCount: dateFilteredDeliveries.filter(d => d.status === 'partial').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Truck className="w-6 h-6 text-indigo-600" />
            Stock Delivery Management
          </h1>
          <p className="text-gray-600 mt-1">Manage incoming stock deliveries and inventory</p>
        </div>
        <button
          onClick={handleCreateDelivery}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Delivery Order
        </button>
      </div>

      {/* Stats Cards - Removed Total Value */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending Deliveries</p>
              <p className="text-2xl font-bold text-gray-900">{filteredStats.pendingCount}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500 opacity-75" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Received Deliveries</p>
              <p className="text-2xl font-bold text-gray-900">{filteredStats.receivedCount}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500 opacity-75" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Deliveries</p>
              <p className="text-2xl font-bold text-gray-900">{filteredStats.totalDeliveries}</p>
            </div>
            <Package className="w-8 h-8 text-blue-500 opacity-75" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by PO number, delivery number or supplier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          {/* Time Filter Dropdown */}
          <div className="relative">
            <select
              value={timeFilter}
              onChange={(e) => {
                setTimeFilter(e.target.value as TimeFilter);
                setCurrentPage(1);
              }}
              className="pl-4 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 appearance-none bg-white"
            >
              {TIME_FILTER_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <Filter className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
          </div>
          
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="received">Received</option>
            <option value="partial">Partial</option>
            <option value="cancelled">Cancelled</option>
          </select>
          
          <button
            onClick={loadData}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        
        {/* Filter Summary */}
        {timeFilter !== 'all' && (
          <div className="mt-3 text-sm text-gray-500 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>
              Showing deliveries for: <strong>{TIME_FILTER_OPTIONS.find(t => t.value === timeFilter)?.label}</strong>
              {filteredDeliveries.length > 0 && ` (${filteredDeliveries.length} deliveries)`}
            </span>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
          <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {/* Deliveries Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Delivery #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">PO #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Delivery Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date Received</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedDeliveries.map((delivery) => {
                const status = getStatusBadge(delivery.status);
                const StatusIcon = status.icon;
                const isOverdue = delivery.status === 'pending' && new Date(delivery.expectedDate) < new Date();
                
                return (
                  <tr key={delivery.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-mono text-sm text-gray-900">{delivery.deliveryNumber}</td>
                    <td className="px-6 py-4 font-mono text-sm text-gray-600">{delivery.purchaseOrderNumber}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{delivery.supplierName}</div>
                      {delivery.supplierContact && (
                        <div className="text-xs text-gray-500">{delivery.supplierContact}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-600' : 'text-gray-600'}`}>
                        <Calendar className="w-4 h-4" />
                        {formatDate(delivery.expectedDate)}
                      </div>
                      {isOverdue && <span className="text-xs text-red-500 mt-1 block">Overdue</span>}
                    </td>
                    <td className="px-6 py-4">
                      {delivery.receivedAt ? (
                        <div className="text-gray-600">
                          <div className="flex items-center gap-1">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            {formatDate(delivery.receivedAt)}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {new Date(delivery.receivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{delivery.totalItems} items / {delivery.totalQuantity} units</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${status.className}`}>
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {delivery.status !== 'received' && delivery.status !== 'cancelled' && (
                          <button
                            onClick={() => handleReceiveDelivery(delivery)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Receive Delivery"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setSelectedDelivery(delivery);
                            setShowDeliveryModal(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {paginatedDeliveries.length === 0 && (
          <div className="text-center py-12">
            <Truck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No delivery orders found</h3>
            <p className="text-gray-500 mb-6">
              {timeFilter !== 'all' 
                ? `No deliveries found for ${TIME_FILTER_OPTIONS.find(t => t.value === timeFilter)?.label.toLowerCase()}`
                : 'Get started by creating a new delivery order'}
            </p>
            <button
              onClick={handleCreateDelivery}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Delivery Order
            </button>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t flex items-center justify-between bg-gray-50">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex items-center px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </button>
            <span className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        )}
      </div>

      {/* Delivery Details Modal */}
      {showDeliveryModal && selectedDelivery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Delivery Details</h2>
                <p className="text-sm text-gray-500">Delivery #{selectedDelivery.deliveryNumber}</p>
              </div>
              <button
                onClick={() => setShowDeliveryModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Supplier</p>
                  <p className="font-medium text-gray-900">{selectedDelivery.supplierName}</p>
                  <p className="text-sm text-gray-600">{selectedDelivery.supplierContact}</p>
                  {selectedDelivery.supplierEmail && <p className="text-sm text-gray-600">{selectedDelivery.supplierEmail}</p>}
                  {selectedDelivery.supplierPhone && <p className="text-sm text-gray-600">{selectedDelivery.supplierPhone}</p>}
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Order Details</p>
                  <p className="font-medium text-gray-900">PO: {selectedDelivery.purchaseOrderNumber}</p>
                  <p className="text-sm text-gray-600">Delivery Date: {formatDate(selectedDelivery.deliveryDate)}</p>
                  <p className="text-sm text-gray-600">Expected: {formatDate(selectedDelivery.expectedDate)}</p>
                  {selectedDelivery.trackingNumber && (
                    <p className="text-sm text-gray-600">Tracking: {selectedDelivery.trackingNumber}</p>
                  )}
                </div>
              </div>

              {/* Received Date Display in Modal */}
              {selectedDelivery.receivedAt && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-600 font-medium">Date Received</p>
                  <p className="text-green-700">{formatDateTime(selectedDelivery.receivedAt)}</p>
                  {selectedDelivery.receivedBy && (
                    <p className="text-sm text-green-600 mt-1">Received by: {selectedDelivery.receivedBy}</p>
                  )}
                </div>
              )}

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Order Items</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left">Product</th>
                        <th className="px-4 py-2 text-center">Ordered</th>
                        <th className="px-4 py-2 text-center">Received</th>
                        <th className="px-4 py-2 text-right">Unit Price</th>
                        <th className="px-4 py-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {selectedDelivery.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-2 font-medium">{item.productName}</td>
                          <td className="px-4 py-2 text-center">{item.orderedQuantity}</td>
                          <td className="px-4 py-2 text-center">
                            <span className={item.receivedQuantity === item.orderedQuantity ? 'text-green-600' : 'text-orange-600'}>
                              {item.receivedQuantity}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-right">{formatCurrency(item.unitPrice)}</td>
                          <td className="px-4 py-2 text-right">{formatCurrency(item.totalPrice)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {selectedDelivery.notes && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Notes</p>
                  <p className="text-gray-700">{selectedDelivery.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Receive Delivery Modal */}
      {showReceiveModal && selectedDelivery && (
        <ReceiveDeliveryModal
          delivery={selectedDelivery}
          onClose={() => {
            setShowReceiveModal(false);
            setSelectedDelivery(null);
          }}
          onConfirm={handleConfirmReceive}
          products={products}
          loading={updatingStock}
        />
      )}
    </div>
  );
};

// Receive Delivery Modal Component
interface ReceiveDeliveryModalProps {
  delivery: DeliveryOrder;
  onClose: () => void;
  onConfirm: (delivery: DeliveryOrder, items: DeliveryItem[]) => void;
  products: Product[];
  loading: boolean;
}

const ReceiveDeliveryModal: React.FC<ReceiveDeliveryModalProps> = ({ delivery, onClose, onConfirm, products, loading }) => {
  const [receivedItems, setReceivedItems] = useState<DeliveryItem[]>(delivery.items);

  const updateReceivedQuantity = (index: number, quantity: number) => {
    const updated = [...receivedItems];
    const newQuantity = Math.min(quantity, updated[index].orderedQuantity);
    updated[index] = {
      ...updated[index],
      receivedQuantity: newQuantity,
      status: newQuantity === updated[index].orderedQuantity ? 'received' : newQuantity > 0 ? 'partial' : 'pending'
    };
    setReceivedItems(updated);
  };

  const handleConfirm = () => {
    onConfirm(delivery, receivedItems);
  };

  const totalOrdered = receivedItems.reduce((sum, item) => sum + item.orderedQuantity, 0);
  const totalReceived = receivedItems.reduce((sum, item) => sum + item.receivedQuantity, 0);

  const formatCurrency = (amount: number) => {
    return `₱${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Receive Delivery</h2>
            <p className="text-sm text-gray-500">PO #{delivery.purchaseOrderNumber} from {delivery.supplierName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-800">Enter the actual quantities received for each item. Stock will be updated automatically.</p>
          </div>

          <div className="space-y-4">
            {receivedItems.map((item, idx) => (
              <div key={idx} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{item.productName}</h3>
                    <p className="text-sm text-gray-500">Ordered: {item.orderedQuantity} units</p>
                  </div>
                  <p className="font-medium text-gray-900">{formatCurrency(item.unitPrice)} each</p>
                </div>
                <div className="flex items-center gap-4">
                  <label className="text-sm text-gray-600">Received Quantity:</label>
                  <input
                    type="number"
                    min="0"
                    max={item.orderedQuantity}
                    value={item.receivedQuantity}
                    onChange={(e) => updateReceivedQuantity(idx, parseInt(e.target.value) || 0)}
                    className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-500">/ {item.orderedQuantity} units</span>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-gray-50 p-4 rounded-lg flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">Total Summary</p>
              <p className="text-lg font-bold text-gray-900">{totalReceived} / {totalOrdered} units received</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Total Value</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(receivedItems.reduce((sum, item) => sum + (item.receivedQuantity * item.unitPrice), 0))}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading || totalReceived === 0}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
            >
              {loading ? <Loader className="w-4 h-4 animate-spin mx-auto" /> : 'Confirm Receipt'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockDelivery;