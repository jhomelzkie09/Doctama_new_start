import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import orderService from '../../../services/order.service';
import { ApiOrder, Order } from '../../../types';
import {
  Package,
  Search,
  Filter,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  AlertCircle,
  Loader,
  Download,
  Eye,
  ShoppingBag,
  Calendar,
  DollarSign,
  ThumbsUp,
  ThumbsDown,
  Info,
  RefreshCw
} from 'lucide-react';
import { showSuccess, showError } from '../../../utils/toast';

// Helper function to convert Order (string id) to ApiOrder (number id)
const convertToApiOrder = (order: Order): ApiOrder => {
  console.log(`Converting order ${order.id}: status=${order.status}, paymentStatus=${order.paymentStatus}`);
  return {
    id: parseInt(order.id),
    orderNumber: order.orderNumber,
    orderDate: order.orderDate,
    totalAmount: order.totalAmount,
    status: order.status,  // Make sure this is passed
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,  // Make sure this is passed
    shippingAddress: order.shippingAddress || '',
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone,
    items: order.items?.map(item => ({
      id: item.id ? parseInt(item.id) : 0,
      productId: parseInt(item.productId),
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice || item.price,
      price: item.price,
      imageUrl: item.imageUrl
    })),
    trackingNumber: (order as any).trackingNumber,
    paymentProofImage: (order as any).paymentProofImage,
    paymentProofReference: (order as any).paymentProofReference,
    paymentProofSender: (order as any).paymentProofSender,
    paymentProofDate: (order as any).paymentProofDate,
    paymentProofNotes: (order as any).paymentProofNotes,
    approvedBy: (order as any).approvedBy,
    approvedAt: (order as any).approvedAt,
    rejectedBy: (order as any).rejectedBy,
    rejectionReason: (order as any).rejectionReason
  };
};

const Orders = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<ApiOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Check for success param on page load (when coming back from order detail)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('success') === 'true') {
      showSuccess('Order placed successfully!');
      // Remove the success param from URL
      navigate('/account/orders', { replace: true });
    }
    loadOrders();
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadOrders(true);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchQuery, statusFilter, dateFilter]);

  const loadOrders = async (silent: boolean = false) => {
    if (!silent) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    try {
      const response = await orderService.getMyOrders(1, 50);
      console.log('📦 Orders API Response:', response);
      
      const ordersData = response.orders || [];
      console.log('📦 Raw orders from API:', ordersData);
      
      // Log each order's status from the raw API response
      ordersData.forEach((order: Order) => {
        console.log(`Raw order ${order.id}: status = "${order.status}", paymentStatus = "${order.paymentStatus}"`);
      });
      
      const convertedOrders = ordersData.map(convertToApiOrder);
      console.log('📦 Converted orders:', convertedOrders);
      
      // Log each converted order's status
      convertedOrders.forEach(order => {
        console.log(`Converted order ${order.id}: status = "${order.status}", paymentStatus = "${order.paymentStatus}"`);
      });
      
      setOrders(convertedOrders);
      setLastUpdated(new Date());
      
      if (silent) {
        // Check if any order status changed
        const oldStatuses = orders.map(o => `${o.id}:${o.status}`);
        const newStatuses = convertedOrders.map(o => `${o.id}:${o.status}`);
        if (JSON.stringify(oldStatuses) !== JSON.stringify(newStatuses)) {
          showSuccess('Order status updated!');
        }
      }
    } catch (error) {
      console.error('Failed to load orders:', error);
      if (!silent) {
        showError('Failed to load orders');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleManualRefresh = () => {
    loadOrders(false);
  };

  const filterOrders = () => {
    let filtered = [...orders];

    if (searchQuery) {
      filtered = filtered.filter(order =>
        order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    if (dateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const thisWeek = new Date(now.setDate(now.getDate() - 7));
      const thisMonth = new Date(now.setMonth(now.getMonth() - 1));

      filtered = filtered.filter(order => {
        const orderDate = new Date(order.orderDate);
        switch (dateFilter) {
          case 'today': return orderDate >= today;
          case 'week': return orderDate >= thisWeek;
          case 'month': return orderDate >= thisMonth;
          default: return true;
        }
      });
    }

    setFilteredOrders(filtered);
  };

  const handleViewOrder = (orderId: number) => {
    console.log(`🔍 Navigating to order details for order ID: ${orderId}`);
    navigate(`/account/orders/${orderId}`);
  };

  // Rest of your component remains the same...
  const getStatusIcon = (status: string, paymentStatus?: string, approvedBy?: string, rejectedBy?: string) => {
    if (approvedBy && paymentStatus === 'paid') {
      return <ThumbsUp className="w-5 h-5 text-green-500" />;
    }
    if (rejectedBy && paymentStatus === 'failed') {
      return <ThumbsDown className="w-5 h-5 text-red-500" />;
    }
    
    switch(status) {
      case 'delivered': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'shipped': return <Truck className="w-5 h-5 text-blue-500" />;
      case 'processing': return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'pending': return <Clock className="w-5 h-5 text-gray-500" />;
      case 'awaiting_payment': return <Clock className="w-5 h-5 text-orange-500" />;
      case 'cancelled': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <Package className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string, paymentStatus?: string, approvedBy?: string, rejectedBy?: string) => {
    if (approvedBy && paymentStatus === 'paid') {
      return 'bg-green-100 text-green-800 border-green-200';
    }
    if (rejectedBy && paymentStatus === 'failed') {
      return 'bg-red-100 text-red-800 border-red-200';
    }
    
    switch(status) {
      case 'delivered': return 'bg-green-100 text-green-800 border-green-200';
      case 'shipped': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'processing': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'pending': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'awaiting_payment': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string, paymentStatus?: string, approvedBy?: string, rejectedBy?: string) => {
    if (approvedBy && paymentStatus === 'paid') {
      return 'Payment Approved';
    }
    if (rejectedBy && paymentStatus === 'failed') {
      return 'Payment Failed';
    }
    
    switch(status) {
      case 'delivered': return 'Delivered';
      case 'shipped': return 'Shipped';
      case 'processing': return 'Processing';
      case 'pending': return 'Pending';
      case 'awaiting_payment': return 'Awaiting Payment';
      case 'cancelled': return 'Cancelled';
      default: return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-red-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 md:py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header with Refresh Button */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">My Orders</h1>
            <p className="text-gray-600 mt-1">Track and manage your orders</p>
          </div>
          <button
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="text-sm">Refresh</span>
          </button>
        </div>

        {/* Last updated time */}
        <div className="text-right text-xs text-gray-400 mb-2">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </div>

        {/* Filters - same as before */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by order number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="awaiting_payment">Awaiting Payment</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
            <button
              onClick={filterOrders}
              className="flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition"
            >
              <Filter className="w-4 h-4 mr-2" />
              Apply Filters
            </button>
          </div>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-500 mb-6">
              {searchQuery || statusFilter !== 'all' || dateFilter !== 'all'
                ? 'Try adjusting your filters'
                : "You haven't placed any orders yet"}
            </p>
            <Link
              to="/shop"
              className="inline-flex items-center px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition"
            >
              Start Shopping
              <ChevronRight className="w-5 h-5 ml-2" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition">
                {/* Order Header */}
                <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">Order Number</p>
                      <p className="font-bold text-gray-900">{order.orderNumber}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">Placed on</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <p className="font-medium text-gray-900">{formatDate(order.orderDate)}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">Total Amount</p>
                      <p className="font-bold text-red-600 text-lg">{formatCurrency(order.totalAmount)}</p>
                    </div>
                    <div>
                      <span className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 ${getStatusColor(order.status, order.paymentStatus, order.approvedBy, order.rejectedBy)}`}>
                        {getStatusIcon(order.status, order.paymentStatus, order.approvedBy, order.rejectedBy)}
                        {getStatusText(order.status, order.paymentStatus, order.approvedBy, order.rejectedBy)}
                      </span>
                    </div>
                  </div>
                  
                  {/* Rejection reason for failed payments */}
                  {order.rejectedBy && order.paymentStatus === 'failed' && order.rejectionReason && (
                    <div className="mt-3 flex items-start gap-2 text-xs text-red-600 bg-red-50 p-2 rounded-lg">
                      <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span className="flex-1">{order.rejectionReason}</span>
                    </div>
                  )}
                </div>

                {/* Order Items Preview */}
                <div className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    {order.items?.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="w-16 h-16 bg-gray-100 rounded-xl overflow-hidden">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-8 h-8 text-gray-400 m-4" />
                        )}
                      </div>
                    ))}
                    {(order.items?.length || 0) > 3 && (
                      <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center text-sm font-bold text-gray-600">
                        +{order.items!.length - 3}
                      </div>
                    )}
                    <div className="flex-1 text-right">
                      <p className="text-sm text-gray-500">
                        {order.items?.length || 0} item(s)
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={() => handleViewOrder(order.id)}
                      className="flex items-center px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </button>
                    {order.status === 'delivered' && (
                      <button className="flex items-center px-4 py-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition">
                        <Download className="w-4 h-4 mr-2" />
                        Download Invoice
                      </button>
                    )}
                    {order.status === 'pending' && (
                      <button className="flex items-center px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition">
                        <XCircle className="w-4 h-4 mr-2" />
                        Cancel Order
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;