import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import orderService from '../../services/order.service';
import {
  ShoppingBag,
  Search,
  Filter,
  Eye,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  Package,
  ChevronLeft,
  ChevronRight,
  Download,
  RefreshCw,
  User,
  MapPin,
  CreditCard,
  AlertCircle,
  Loader,
  X,
  Wallet,
  Smartphone,
  DollarSign,
  ThumbsUp,
  ThumbsDown,
  Receipt,
  ZoomIn
} from 'lucide-react';
import { Order, PaymentMethod, OrderStatus } from '../../types';

const AdminOrders = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [approvalNote, setApprovalNote] = useState('');
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<string>('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
      return;
    }
    fetchOrders();
  }, [isAdmin, navigate]);

  useEffect(() => {
    filterOrders();
  }, [orders, searchQuery, statusFilter, paymentFilter]);

  const fetchOrders = async () => {
  setLoading(true);
  try {
    const data = await orderService.getAllOrders();
    console.log('📦 ALL ORDERS FROM API:', data);
    
    // Log the first order's payment proof fields if available
    if (data && data.length > 0) {
      const firstOrder = data[0];
      console.log('🔍 FIRST ORDER STRUCTURE:', {
        id: firstOrder.id,
        orderNumber: firstOrder.orderNumber,
        // Log all properties to see what's available
        allProps: Object.keys(firstOrder),
        // Specifically check for payment proof fields
        paymentProofImage: (firstOrder as any).paymentProofImage,
        paymentProofReference: (firstOrder as any).paymentProofReference,
        paymentProofSender: (firstOrder as any).paymentProofSender,
        paymentProofDate: (firstOrder as any).paymentProofDate,
        paymentProofNotes: (firstOrder as any).paymentProofNotes,
        // Also check if there's a nested paymentProof object
        paymentProof: (firstOrder as any).paymentProof
      });
    }
    
    setOrders(data);
  } catch (err: any) {
    setError('Failed to load orders');
    console.error(err);
  } finally {
    setLoading(false);
  }
};

  const filterOrders = () => {
    let filtered = [...orders];

    if (searchQuery) {
      filtered = filtered.filter(order =>
        order.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customerEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (order as any).paymentProofReference?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    if (paymentFilter !== 'all') {
      filtered = filtered.filter(order => order.paymentMethod === paymentFilter);
    }

    setFilteredOrders(filtered);
    setCurrentPage(1);
  };

  const handleApprovePayment = async (orderId: string) => {
    setUpdatingStatus(true);
    try {
      await orderService.updateOrderPayment(parseInt(orderId), 'paid', {
        approvedBy: 'admin',
        approvedAt: new Date().toISOString(),
        notes: approvalNote
      });
      await fetchOrders();
      if (selectedOrder) {
        setSelectedOrder({ ...selectedOrder, paymentStatus: 'paid' });
      }
      setApprovalNote('');
      alert('Payment approved!');
    } catch (err: any) {
      alert('Failed to approve payment');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleRejectPayment = async (orderId: string) => {
    if (!approvalNote) {
      alert('Please provide a reason for rejection');
      return;
    }
    setUpdatingStatus(true);
    try {
      await orderService.updateOrderPayment(parseInt(orderId), 'failed', {
        rejectedBy: 'admin',
        rejectedAt: new Date().toISOString(),
        reason: approvalNote
      });
      await fetchOrders();
      if (selectedOrder) {
        setSelectedOrder({ ...selectedOrder, paymentStatus: 'failed' });
      }
      setApprovalNote('');
      alert('Payment rejected.');
    } catch (err: any) {
      alert('Failed to reject payment');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleStatusUpdate = async (orderId: string, status: string) => {
    setUpdatingStatus(true);
    try {
      await orderService.updateOrderStatus(parseInt(orderId), status);
      await fetchOrders();
      if (selectedOrder) {
        setSelectedOrder({ ...selectedOrder, status: status as OrderStatus });
      }
      alert(`Order status updated to ${status}`);
    } catch (err: any) {
      alert('Failed to update order status');
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
      case 'paymaya': return 'PayMaya';
      default: return method;
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    const config: Record<string, { color: string; icon: any }> = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      awaiting_payment: { color: 'bg-orange-100 text-orange-800', icon: Receipt },
      processing: { color: 'bg-blue-100 text-blue-800', icon: Package },
      shipped: { color: 'bg-purple-100 text-purple-800', icon: Truck },
      delivered: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle }
    };
    const conf = config[status] || config.pending;
    const Icon = conf.icon;
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${conf.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
      </span>
    );
  };

  const getPaymentStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-purple-100 text-purple-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const statusCounts = {
    all: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    awaiting_payment: orders.filter(o => o.status === 'awaiting_payment').length,
    processing: orders.filter(o => o.status === 'processing').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length
  };

  const paymentMethodCounts = {
    all: orders.length,
    cod: orders.filter(o => o.paymentMethod === 'cod').length,
    gcash: orders.filter(o => o.paymentMethod === 'gcash').length,
    paymaya: orders.filter(o => o.paymentMethod === 'paymaya').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Orders Management</h1>
          <p className="text-gray-600 mt-1">Manage, approve payments, and track customer orders</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchOrders} className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </button>
          <button className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
            <Download className="w-4 h-4 mr-2" /> Export
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-7 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-gray-500">
          <p className="text-sm text-gray-600 mb-1">Total</p>
          <p className="text-xl font-bold text-gray-900">{statusCounts.all}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-yellow-500">
          <p className="text-sm text-gray-600 mb-1">Pending</p>
          <p className="text-xl font-bold text-yellow-600">{statusCounts.pending}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-orange-500">
          <p className="text-sm text-gray-600 mb-1">Awaiting Payment</p>
          <p className="text-xl font-bold text-orange-600">{statusCounts.awaiting_payment}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-500">
          <p className="text-sm text-gray-600 mb-1">Processing</p>
          <p className="text-xl font-bold text-blue-600">{statusCounts.processing}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-purple-500">
          <p className="text-sm text-gray-600 mb-1">Shipped</p>
          <p className="text-xl font-bold text-purple-600">{statusCounts.shipped}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-500">
          <p className="text-sm text-gray-600 mb-1">Delivered</p>
          <p className="text-xl font-bold text-green-600">{statusCounts.delivered}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-red-500">
          <p className="text-sm text-gray-600 mb-1">Cancelled</p>
          <p className="text-xl font-bold text-red-600">{statusCounts.cancelled}</p>
        </div>
      </div>

      {/* Payment Method Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg shadow-sm p-4 border border-green-200">
          <div className="flex justify-between">
            <div><p className="text-sm text-gray-600 mb-1">Cash on Delivery</p><p className="text-2xl font-bold text-green-600">{paymentMethodCounts.cod}</p></div>
            <DollarSign className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg shadow-sm p-4 border border-blue-200">
          <div className="flex justify-between">
            <div><p className="text-sm text-gray-600 mb-1">GCash</p><p className="text-2xl font-bold text-blue-600">{paymentMethodCounts.gcash}</p></div>
            <Smartphone className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg shadow-sm p-4 border border-purple-200">
          <div className="flex justify-between">
            <div><p className="text-sm text-gray-600 mb-1">PayMaya</p><p className="text-2xl font-bold text-purple-600">{paymentMethodCounts.paymaya}</p></div>
            <Wallet className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search by order, customer, or reference..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="w-full pl-10 pr-4 py-2 border rounded-lg" 
            />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2 border rounded-lg">
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="awaiting_payment">Awaiting Payment</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} className="px-4 py-2 border rounded-lg">
            <option value="all">All Payments</option>
            <option value="cod">Cash on Delivery</option>
            <option value="gcash">GCash</option>
            <option value="paymaya">PayMaya</option>
          </select>
          <button onClick={filterOrders} className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Filter className="w-4 h-4 mr-2" /> Apply Filters
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
          <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center mr-3">
                        <ShoppingBag className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium">{order.orderNumber}</div>
                        <div className="text-xs text-gray-500">ID: {order.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">{order.customerName || 'Guest'}</div>
                    <div className="text-xs text-gray-500">{order.customerEmail}</div>
                  </td>
                  <td className="px-6 py-4 text-sm">{formatDate(order.orderDate)}</td>
                  <td className="px-6 py-4 text-sm font-bold text-blue-600">{formatCurrency(order.totalAmount)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <span className="flex items-center text-sm text-gray-600">
                        {getPaymentMethodIcon(order.paymentMethod)}
                        <span className="ml-1">{getPaymentMethodName(order.paymentMethod)}</span>
                      </span>
                      {getPaymentStatusBadge(order.paymentStatus)}
                    </div>
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(order.status)}</td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => { 
                        console.log('Selected order:', order);
                        console.log('Payment proof image:', (order as any).paymentProofImage);
                        console.log('Payment proof reference:', (order as any).paymentProofReference);
                        console.log('Payment proof sender:', (order as any).paymentProofSender);
                        console.log('Payment proof date:', (order as any).paymentProofDate);
                        console.log('Payment proof notes:', (order as any).paymentProofNotes);
                        setSelectedOrder(order); 
                        setShowOrderModal(true); 
                      }} 
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
          </div>
        )}

        {totalPages > 1 && (
          <div className="px-6 py-4 border-t flex items-center justify-between">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p-1))} 
              disabled={currentPage===1} 
              className="flex items-center px-3 py-1 border rounded-lg disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Previous
            </button>
            <span className="text-sm">Page {currentPage} of {totalPages}</span>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} 
              disabled={currentPage===totalPages} 
              className="flex items-center px-3 py-1 border rounded-lg disabled:opacity-50"
            >
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold">Order Details</h2>
              <button onClick={() => setShowOrderModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Order Info */}
              <div className="grid grid-cols-3 gap-4">
                <div><p className="text-xs text-gray-500 mb-1">Order Number</p><p className="font-medium">{selectedOrder.orderNumber}</p></div>
                <div><p className="text-xs text-gray-500 mb-1">Order Date</p><p className="font-medium">{formatDate(selectedOrder.orderDate)}</p></div>
                <div><p className="text-xs text-gray-500 mb-1">Total Amount</p><p className="font-bold text-blue-600">{formatCurrency(selectedOrder.totalAmount)}</p></div>
              </div>

              {/* Payment & Receipt Section */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
                <h3 className="font-medium mb-3 flex items-center text-blue-800">
                  <CreditCard className="w-4 h-4 mr-2" /> Payment Information
                </h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div><p className="text-xs text-gray-500">Method</p><div className="flex items-center mt-1">{getPaymentMethodIcon(selectedOrder.paymentMethod)}<span className="ml-2">{getPaymentMethodName(selectedOrder.paymentMethod)}</span></div></div>
                  <div><p className="text-xs text-gray-500">Status</p><div className="mt-1">{getPaymentStatusBadge(selectedOrder.paymentStatus)}</div></div>
                </div>

                {/* Payment Proof - Using flat fields from database */}
                {(selectedOrder as any).paymentProofImage && (
                  <div className="mt-4 pt-4 border-t border-blue-200">
                    <h4 className="text-sm font-medium text-blue-800 mb-3 flex items-center">
                      <Receipt className="w-4 h-4 mr-2" /> Payment Proof
                    </h4>
                    
                    {/* Receipt Image */}
                    <div className="mb-4">
                      <p className="text-xs text-gray-500 mb-2">Receipt Screenshot</p>
                      <div 
                        className="relative group cursor-pointer" 
                        onClick={() => { 
                          setSelectedReceipt((selectedOrder as any).paymentProofImage); 
                          setShowReceiptModal(true); 
                        }}
                      >
                        <img 
                          src={(selectedOrder as any).paymentProofImage} 
                          alt="Payment receipt" 
                          className="w-full max-h-64 object-contain bg-gray-100 rounded-lg border border-gray-200"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded-lg flex items-center justify-center">
                          <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100" />
                        </div>
                      </div>
                    </div>

                    {/* Receipt Details */}
                    <div className="grid grid-cols-2 gap-4 bg-white p-3 rounded-lg">
                      {(selectedOrder as any).paymentProofReference && (
                        <div>
                          <p className="text-xs text-gray-500">Reference Number</p>
                          <p className="text-sm font-medium">{(selectedOrder as any).paymentProofReference}</p>
                        </div>
                      )}
                      {(selectedOrder as any).paymentProofSender && (
                        <div>
                          <p className="text-xs text-gray-500">Sender Name</p>
                          <p className="text-sm font-medium">{(selectedOrder as any).paymentProofSender}</p>
                        </div>
                      )}
                      {(selectedOrder as any).paymentProofDate && (
                        <div>
                          <p className="text-xs text-gray-500">Payment Date</p>
                          <p className="text-sm font-medium">{(selectedOrder as any).paymentProofDate}</p>
                        </div>
                      )}
                    </div>
                    
                    {(selectedOrder as any).paymentProofNotes && (
                      <div className="mt-2 bg-white p-3 rounded-lg">
                        <p className="text-xs text-gray-500">Notes</p>
                        <p className="text-sm">{(selectedOrder as any).paymentProofNotes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Customer & Shipping */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium mb-3 flex items-center"><User className="w-4 h-4 mr-2 text-blue-600" /> Customer</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div><p className="text-xs text-gray-500">Name</p><p className="font-medium">{selectedOrder.customerName || 'N/A'}</p></div>
                  <div><p className="text-xs text-gray-500">Email</p><p className="font-medium">{selectedOrder.customerEmail || 'N/A'}</p></div>
                  <div><p className="text-xs text-gray-500">Phone</p><p className="font-medium">{selectedOrder.customerPhone || 'N/A'}</p></div>
                </div>
                <h3 className="font-medium mb-2 flex items-center mt-4"><MapPin className="w-4 h-4 mr-2 text-blue-600" /> Shipping</h3>
                <p className="text-sm">{selectedOrder.shippingAddress || 'No address provided'}</p>
              </div>

              {/* Items */}
              <div>
                <h3 className="font-medium mb-3">Items</h3>
                <div className="space-y-3">
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                      <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden">
                        {item.imageUrl ? <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" /> : <Package className="w-8 h-8 text-gray-400 m-4" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{item.productName}</p>
                        <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-bold text-blue-600">{formatCurrency((item.unitPrice || item.price) * item.quantity)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="border-t pt-4">
                <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(selectedOrder.totalAmount)}</span></div>
                <div className="flex justify-between"><span>Shipping</span><span>Free</span></div>
                <div className="flex justify-between font-bold text-lg"><span>Total</span><span className="text-blue-600">{formatCurrency(selectedOrder.totalAmount)}</span></div>
              </div>

              {/* Admin Notes & Actions */}
              <div className="border-t pt-4">
                <textarea 
                  value={approvalNote} 
                  onChange={(e) => setApprovalNote(e.target.value)} 
                  rows={2} 
                  className="w-full px-3 py-2 border rounded-lg mb-4" 
                  placeholder="Admin notes (reason for rejection, etc.)" 
                />
                
                {/* Payment Verification - Show for pending payments with proof */}
                {selectedOrder.paymentStatus === 'pending' && (selectedOrder as any).paymentProofImage && (
                  <div className="bg-yellow-50 p-4 rounded-lg mb-4">
                    <h3 className="font-medium mb-3 text-yellow-800">Payment Verification</h3>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => handleApprovePayment(selectedOrder.id)} 
                        disabled={updatingStatus} 
                        className="flex-1 flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        <ThumbsUp className="w-4 h-4 mr-2" /> Approve
                      </button>
                      <button 
                        onClick={() => handleRejectPayment(selectedOrder.id)} 
                        disabled={updatingStatus} 
                        className="flex-1 flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        <ThumbsDown className="w-4 h-4 mr-2" /> Reject
                      </button>
                    </div>
                  </div>
                )}

                {/* Status Update */}
                <div>
                  <h3 className="font-medium mb-3">Update Order Status</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {['pending','awaiting_payment','processing','shipped','delivered','cancelled'].map(s => (
                      <button 
                        key={s} 
                        onClick={() => handleStatusUpdate(selectedOrder.id, s)} 
                        disabled={updatingStatus || selectedOrder.status === s} 
                        className={`px-3 py-2 rounded-lg text-sm font-medium ${
                          selectedOrder.status === s 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        {s.split('_').map(word => word.charAt(0).toUpperCase()+word.slice(1)).join(' ')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceiptModal && selectedReceipt && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-[60] flex items-center justify-center p-4">
          <button onClick={() => setShowReceiptModal(false)} className="absolute top-4 right-4 text-white hover:text-gray-300">
            <X className="w-8 h-8" />
          </button>
          <img src={selectedReceipt} alt="Receipt full" className="max-w-full max-h-full object-contain" />
        </div>
      )}
    </div>
  );
};

export default AdminOrders;