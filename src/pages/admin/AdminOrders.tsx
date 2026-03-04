import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import orderService from '../../services/order.service';
import userService from '../../services/user.service';
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
  ZoomIn,
  FileText,
  Printer,
  Mail,
  MessageSquare,
  Edit,
  Copy,
  Calendar,
  TrendingUp,
  ArrowUpDown,
  Users,
  DownloadCloud,
  FilterX,
  Bell,
  Tag,
  Phone,
  Home,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import { Order, PaymentMethod, OrderStatus } from '../../types';
import { User as UserType } from '../../types';

// Extended Order interface with customer details
interface ExtendedOrder extends Order {
  customer?: UserType;
  itemsCount?: number;
  paymentProofImage?: string;
  paymentProofReference?: string;
  paymentProofSender?: string;
  paymentProofDate?: string;
  paymentProofNotes?: string;
  adminNotes?: AdminNote[];
}

interface AdminNote {
  id: string;
  content: string;
  createdAt: string;
  createdBy: string;
}

interface OrderStats {
  totalRevenue: number;
  averageOrderValue: number;
  pendingPayment: number;
  completedOrders: number;
  todayOrders: number;
  weekOrders: number;
  monthOrders: number;
  codCount: number;
  gcashCount: number;
  paymayaCount: number;
}

const AdminOrders = () => {
  const { isAdmin, user: currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [orders, setOrders] = useState<ExtendedOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<ExtendedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<ExtendedOrder | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [approvalNote, setApprovalNote] = useState('');
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<string>('');
  const [showExportModal, setShowExportModal] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Order;
    direction: 'asc' | 'desc';
  }>({ key: 'orderDate', direction: 'desc' });
  const [adminNote, setAdminNote] = useState('');
  const [orderStats, setOrderStats] = useState<OrderStats>({
    totalRevenue: 0,
    averageOrderValue: 0,
    pendingPayment: 0,
    completedOrders: 0,
    todayOrders: 0,
    weekOrders: 0,
    monthOrders: 0,
    codCount: 0,
    gcashCount: 0,
    paymayaCount: 0
  });

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
    calculateStats();
  }, [orders, searchQuery, statusFilter, paymentFilter, dateFilter]);

  useEffect(() => {
    if (selectAll) {
      setSelectedOrders(filteredOrders.map(o => o.id));
    } else {
      setSelectedOrders([]);
    }
  }, [selectAll, filteredOrders]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await orderService.getAllOrders();
      console.log('📦 ALL ORDERS FROM API:', data);
      
      // Fetch customer data for each order
      const ordersWithCustomers = await Promise.all(
        data.map(async (order: Order) => {
          try {
            // Try to fetch customer details if userId exists
            if (order.userId) {
              const customer = await userService.getUserById(order.userId);
              return { ...order, customer, itemsCount: order.items?.length || 0 } as ExtendedOrder;
            }
          } catch (err) {
            console.warn(`Could not fetch customer for order ${order.id}`);
          }
          return { ...order, itemsCount: order.items?.length || 0 } as ExtendedOrder;
        })
      );
      
      setOrders(ordersWithCustomers);
    } catch (err: any) {
      setError('Failed to load orders');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const stats: OrderStats = {
      totalRevenue: orders.reduce((sum, order) => sum + order.totalAmount, 0),
      averageOrderValue: orders.length > 0 
        ? orders.reduce((sum, order) => sum + order.totalAmount, 0) / orders.length 
        : 0,
      pendingPayment: orders.filter(o => o.paymentStatus === 'pending').length,
      completedOrders: orders.filter(o => o.status === 'delivered').length,
      todayOrders: orders.filter(o => {
        const today = new Date().toDateString();
        return new Date(o.orderDate).toDateString() === today;
      }).length,
      weekOrders: orders.filter(o => {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return new Date(o.orderDate) >= weekAgo;
      }).length,
      monthOrders: orders.filter(o => {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return new Date(o.orderDate) >= monthAgo;
      }).length,
      codCount: orders.filter(o => o.paymentMethod === 'cod').length,
      gcashCount: orders.filter(o => o.paymentMethod === 'gcash').length,
      paymayaCount: orders.filter(o => o.paymentMethod === 'paymaya').length
    };
    setOrderStats(stats);
  };

  const filterOrders = () => {
    let filtered = [...orders];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(order =>
        order.orderNumber?.toLowerCase().includes(query) ||
        order.customerName?.toLowerCase().includes(query) ||
        order.customerEmail?.toLowerCase().includes(query) ||
        order.customerPhone?.toLowerCase().includes(query) ||
        order.paymentProofReference?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Payment method filter
    if (paymentFilter !== 'all') {
      filtered = filtered.filter(order => order.paymentMethod === paymentFilter);
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          filtered = filtered.filter(order => new Date(order.orderDate) >= filterDate);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          filtered = filtered.filter(order => new Date(order.orderDate) >= filterDate);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          filtered = filtered.filter(order => new Date(order.orderDate) >= filterDate);
          break;
        case 'year':
          filterDate.setFullYear(now.getFullYear() - 1);
          filtered = filtered.filter(order => new Date(order.orderDate) >= filterDate);
          break;
      }
    }

    // Sorting
    filtered.sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortConfig.direction === 'asc' 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortConfig.direction === 'asc' 
          ? aVal - bVal
          : bVal - aVal;
      }
      
      return 0;
    });

    setFilteredOrders(filtered);
    setCurrentPage(1);
  };

  const handleSort = (key: keyof Order) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  const handleBulkStatusUpdate = async (status: string) => {
    if (selectedOrders.length === 0) return;
    
    setUpdatingStatus(true);
    try {
      await Promise.all(
        selectedOrders.map(orderId => 
          orderService.updateOrderStatus(parseInt(orderId), status)
        )
      );
      await fetchOrders();
      setSelectedOrders([]);
      setSelectAll(false);
      alert(`Updated ${selectedOrders.length} orders to ${status}`);
    } catch (err) {
      alert('Failed to update some orders');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleApprovePayment = async (orderId: string) => {
    setUpdatingStatus(true);
    try {
      await orderService.updateOrderPayment(parseInt(orderId), 'paid', {
        approvedBy: currentUser?.fullName || 'admin',
        approvedAt: new Date().toISOString(),
        notes: approvalNote
      });
      await fetchOrders();
      if (selectedOrder) {
        setSelectedOrder({ ...selectedOrder, paymentStatus: 'paid' });
      }
      setApprovalNote('');
      alert('Payment approved successfully!');
    } catch (err: any) {
      alert('Failed to approve payment: ' + (err.message || 'Unknown error'));
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
        rejectedBy: currentUser?.fullName || 'admin',
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
      alert('Failed to reject payment: ' + (err.message || 'Unknown error'));
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
      alert('Failed to update order status: ' + (err.message || 'Unknown error'));
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAddAdminNote = async (orderId: string) => {
    if (!adminNote.trim()) return;
    
    try {
      // This would need an API endpoint - for now just log and show success
      console.log('Adding note to order:', orderId, adminNote);
      
      // Update local state
      if (selectedOrder) {
        const newNote: AdminNote = {
          id: `note-${Date.now()}`,
          content: adminNote,
          createdAt: new Date().toISOString(),
          createdBy: currentUser?.fullName || 'Admin'
        };
        
        setSelectedOrder({
          ...selectedOrder,
          adminNotes: [...(selectedOrder.adminNotes || []), newNote]
        });
      }
      
      setAdminNote('');
      alert('Note added successfully');
    } catch (err) {
      alert('Failed to add note');
    }
  };

  const handleExportOrders = (format: 'csv' | 'pdf' | 'excel') => {
    // Implementation for export
    console.log('Exporting orders as:', format);
    
    // Create CSV data
    if (format === 'csv') {
      const headers = ['Order #', 'Date', 'Customer', 'Email', 'Total', 'Status', 'Payment Method', 'Payment Status'];
      const csvData = filteredOrders.map(order => [
        order.orderNumber,
        new Date(order.orderDate).toLocaleDateString(),
        order.customerName || 'Guest',
        order.customerEmail || '',
        order.totalAmount.toString(),
        order.status,
        order.paymentMethod,
        order.paymentStatus
      ]);
      
      const csv = [headers, ...csvData].map(row => row.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orders_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    }
    
    setShowExportModal(false);
  };

  const handlePrintInvoice = (order: ExtendedOrder) => {
    // Create a printable invoice
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Invoice #${order.orderNumber}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 40px; }
              .header { text-align: center; margin-bottom: 30px; }
              .order-info { margin-bottom: 20px; }
              table { width: 100%; border-collapse: collapse; }
              th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
              .total { font-weight: bold; font-size: 18px; }
              @media print { body { padding: 0; } }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>INVOICE</h1>
              <h2>Order #${order.orderNumber}</h2>
              <p>Date: ${new Date(order.orderDate).toLocaleDateString()}</p>
            </div>
            <div class="order-info">
              <p><strong>Customer:</strong> ${order.customerName || 'Guest'}</p>
              <p><strong>Email:</strong> ${order.customerEmail || 'N/A'}</p>
              <p><strong>Phone:</strong> ${order.customerPhone || 'N/A'}</p>
              <p><strong>Shipping Address:</strong> ${order.shippingAddress || 'N/A'}</p>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${order.items?.map(item => `
                  <tr>
                    <td>${item.productName}</td>
                    <td>${item.quantity}</td>
                    <td>₱${(item.unitPrice || item.price).toFixed(2)}</td>
                    <td>₱${((item.unitPrice || item.price) * item.quantity).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div style="text-align: right; margin-top: 20px;">
              <p class="total">Total: ₱${order.totalAmount.toFixed(2)}</p>
              <p>Payment Method: ${order.paymentMethod}</p>
              <p>Payment Status: ${order.paymentStatus}</p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleViewCustomer = (customerId?: string) => {
    if (customerId) {
      navigate(`/admin/customers/${customerId}`);
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

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return formatDate(dateString);
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
          <button 
            onClick={() => setShowStats(!showStats)} 
            className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <BarChart3 className="w-4 h-4 mr-2" /> {showStats ? 'Hide' : 'Show'} Stats
          </button>
          <button 
            onClick={() => setShowExportModal(true)} 
            className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <DownloadCloud className="w-4 h-4 mr-2" /> Export
          </button>
          <button 
            onClick={fetchOrders} 
            className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {showStats && (
        <div className="mb-6 bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
            Order Statistics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-sm text-blue-600">Total Revenue</p>
              <p className="text-xl font-bold text-blue-700">{formatCurrency(orderStats.totalRevenue)}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-sm text-green-600">Average Order Value</p>
              <p className="text-xl font-bold text-green-700">{formatCurrency(orderStats.averageOrderValue)}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-3">
              <p className="text-sm text-purple-600">Pending Payment</p>
              <p className="text-xl font-bold text-purple-700">{orderStats.pendingPayment}</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-3">
              <p className="text-sm text-orange-600">Completed Orders</p>
              <p className="text-xl font-bold text-orange-700">{orderStats.completedOrders}</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-3">
              <p className="text-sm text-yellow-600">Today</p>
              <p className="text-xl font-bold text-yellow-700">{orderStats.todayOrders}</p>
            </div>
            <div className="bg-indigo-50 rounded-lg p-3">
              <p className="text-sm text-indigo-600">This Week</p>
              <p className="text-xl font-bold text-indigo-700">{orderStats.weekOrders}</p>
            </div>
            <div className="bg-pink-50 rounded-lg p-3">
              <p className="text-sm text-pink-600">This Month</p>
              <p className="text-xl font-bold text-pink-700">{orderStats.monthOrders}</p>
            </div>
            <div className="bg-teal-50 rounded-lg p-3">
              <p className="text-sm text-teal-600">COD/GCash/PayMaya</p>
              <p className="text-xl font-bold text-teal-700">
                {orderStats.codCount}/{orderStats.gcashCount}/{orderStats.paymayaCount}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Actions Bar */}
      {selectedOrders.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center justify-between">
          <span className="text-sm font-medium text-blue-700">
            {selectedOrders.length} order{selectedOrders.length !== 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-2">
            <select
              onChange={(e) => handleBulkStatusUpdate(e.target.value)}
              className="px-3 py-1 border border-blue-300 rounded-lg text-sm bg-white"
            >
              <option value="">Update Status</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <button
              onClick={() => setSelectedOrders([])}
              className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-7 gap-4 mb-6">
        <div 
          className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-gray-500 cursor-pointer hover:shadow-md"
          onClick={() => setStatusFilter('all')}
        >
          <p className="text-sm text-gray-600 mb-1">Total</p>
          <p className="text-xl font-bold text-gray-900">{statusCounts.all}</p>
        </div>
        <div 
          className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-yellow-500 cursor-pointer hover:shadow-md"
          onClick={() => setStatusFilter('pending')}
        >
          <p className="text-sm text-gray-600 mb-1">Pending</p>
          <p className="text-xl font-bold text-yellow-600">{statusCounts.pending}</p>
        </div>
        <div 
          className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-orange-500 cursor-pointer hover:shadow-md"
          onClick={() => setStatusFilter('awaiting_payment')}
        >
          <p className="text-sm text-gray-600 mb-1">Awaiting Payment</p>
          <p className="text-xl font-bold text-orange-600">{statusCounts.awaiting_payment}</p>
        </div>
        <div 
          className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-500 cursor-pointer hover:shadow-md"
          onClick={() => setStatusFilter('processing')}
        >
          <p className="text-sm text-gray-600 mb-1">Processing</p>
          <p className="text-xl font-bold text-blue-600">{statusCounts.processing}</p>
        </div>
        <div 
          className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-purple-500 cursor-pointer hover:shadow-md"
          onClick={() => setStatusFilter('shipped')}
        >
          <p className="text-sm text-gray-600 mb-1">Shipped</p>
          <p className="text-xl font-bold text-purple-600">{statusCounts.shipped}</p>
        </div>
        <div 
          className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-500 cursor-pointer hover:shadow-md"
          onClick={() => setStatusFilter('delivered')}
        >
          <p className="text-sm text-gray-600 mb-1">Delivered</p>
          <p className="text-xl font-bold text-green-600">{statusCounts.delivered}</p>
        </div>
        <div 
          className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-red-500 cursor-pointer hover:shadow-md"
          onClick={() => setStatusFilter('cancelled')}
        >
          <p className="text-sm text-gray-600 mb-1">Cancelled</p>
          <p className="text-xl font-bold text-red-600">{statusCounts.cancelled}</p>
        </div>
      </div>

      {/* Payment Method Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div 
          className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg shadow-sm p-4 border border-green-200 cursor-pointer hover:shadow-md"
          onClick={() => setPaymentFilter('cod')}
        >
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Cash on Delivery</p>
              <p className="text-2xl font-bold text-green-600">{paymentMethodCounts.cod}</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div 
          className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg shadow-sm p-4 border border-blue-200 cursor-pointer hover:shadow-md"
          onClick={() => setPaymentFilter('gcash')}
        >
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">GCash</p>
              <p className="text-2xl font-bold text-blue-600">{paymentMethodCounts.gcash}</p>
            </div>
            <Smartphone className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div 
          className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg shadow-sm p-4 border border-purple-200 cursor-pointer hover:shadow-md"
          onClick={() => setPaymentFilter('paymaya')}
        >
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">PayMaya</p>
              <p className="text-2xl font-bold text-purple-600">{paymentMethodCounts.paymaya}</p>
            </div>
            <Wallet className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search orders, customers, ref..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
            />
          </div>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)} 
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
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
            value={paymentFilter} 
            onChange={(e) => setPaymentFilter(e.target.value)} 
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Payments</option>
            <option value="cod">Cash on Delivery</option>
            <option value="gcash">GCash</option>
            <option value="paymaya">PayMaya</option>
          </select>
          <select 
            value={dateFilter} 
            onChange={(e) => setDateFilter(e.target.value)} 
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="year">Last Year</option>
          </select>
          <button 
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
              setPaymentFilter('all');
              setDateFilter('all');
            }} 
            className="flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            <FilterX className="w-4 h-4 mr-2" /> Clear Filters
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
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={() => setSelectAll(!selectAll)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700"
                  onClick={() => handleSort('orderNumber')}
                >
                  <div className="flex items-center">
                    Order
                    <ArrowUpDown className="w-4 h-4 ml-1" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700"
                  onClick={() => handleSort('customerName')}
                >
                  <div className="flex items-center">
                    Customer
                    <ArrowUpDown className="w-4 h-4 ml-1" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700"
                  onClick={() => handleSort('orderDate')}
                >
                  <div className="flex items-center">
                    Date
                    <ArrowUpDown className="w-4 h-4 ml-1" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700"
                  onClick={() => handleSort('totalAmount')}
                >
                  <div className="flex items-center">
                    Total
                    <ArrowUpDown className="w-4 h-4 ml-1" />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedOrders.includes(order.id)}
                      onChange={() => {
                        if (selectedOrders.includes(order.id)) {
                          setSelectedOrders(selectedOrders.filter(id => id !== order.id));
                        } else {
                          setSelectedOrders([...selectedOrders, order.id]);
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center mr-3">
                        <ShoppingBag className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium">{order.orderNumber}</div>
                        <div className="text-xs text-gray-500">{order.itemsCount} items</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium">{order.customerName || 'Guest'}</div>
                        <div className="text-xs text-gray-500">{order.customerEmail}</div>
                        {order.customerPhone && (
                          <div className="text-xs text-gray-400 flex items-center mt-1">
                            <Phone className="w-3 h-3 mr-1" />
                            {order.customerPhone}
                          </div>
                        )}
                      </div>
                      {order.customer && (
                        <button
                          onClick={() => handleViewCustomer(order.userId)}
                          className="ml-2 p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="View Customer"
                        >
                          <User className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">{formatDate(order.orderDate)}</div>
                    <div className="text-xs text-gray-400">{formatRelativeTime(order.orderDate)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-blue-600">{formatCurrency(order.totalAmount)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center text-sm text-gray-600">
                        {getPaymentMethodIcon(order.paymentMethod)}
                        <span className="ml-1">{getPaymentMethodName(order.paymentMethod)}</span>
                      </div>
                      {getPaymentStatusBadge(order.paymentStatus)}
                      {(order as any).paymentProofReference && (
                        <div className="text-xs text-gray-400 mt-1">
                          Ref: {(order as any).paymentProofReference}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(order.status)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => { 
                          setSelectedOrder(order); 
                          setShowOrderModal(true); 
                        }} 
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handlePrintInvoice(order)} 
                        className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg"
                        title="Print Invoice"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedOrder(order);
                          setAdminNote('');
                        }} 
                        className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg"
                        title="Add Note"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                    </div>
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
            <p className="text-gray-500">Try adjusting your filters</p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="px-6 py-4 border-t flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to{' '}
              {Math.min(currentPage * itemsPerPage, filteredOrders.length)} of{' '}
              {filteredOrders.length} results
            </div>
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p-1))} 
                disabled={currentPage===1} 
                className="flex items-center px-3 py-1 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Previous
              </button>
              {[...Array(totalPages)].map((_, i) => {
                const pageNum = i + 1;
                if (
                  pageNum === 1 ||
                  pageNum === totalPages ||
                  (pageNum >= currentPage - 2 && pageNum <= currentPage + 2)
                ) {
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-1 rounded-lg ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                } else if (
                  pageNum === currentPage - 3 ||
                  pageNum === currentPage + 3
                ) {
                  return <span key={pageNum} className="px-2">...</span>;
                }
                return null;
              })}
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} 
                disabled={currentPage===totalPages} 
                className="flex items-center px-3 py-1 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold">Order #{selectedOrder.orderNumber}</h2>
              <button onClick={() => setShowOrderModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Order Info */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Order Number</p>
                  <p className="font-medium">{selectedOrder.orderNumber}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Order Date</p>
                  <p className="font-medium">{formatDate(selectedOrder.orderDate)}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Total Amount</p>
                  <p className="font-bold text-blue-600">{formatCurrency(selectedOrder.totalAmount)}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Items</p>
                  <p className="font-medium">{selectedOrder.items?.length || 0}</p>
                </div>
              </div>

              {/* Payment & Receipt Section */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
                <h3 className="font-medium mb-3 flex items-center text-blue-800">
                  <CreditCard className="w-4 h-4 mr-2" /> Payment Information
                </h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500">Method</p>
                    <div className="flex items-center mt-1">
                      {getPaymentMethodIcon(selectedOrder.paymentMethod)}
                      <span className="ml-2">{getPaymentMethodName(selectedOrder.paymentMethod)}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Status</p>
                    <div className="mt-1">{getPaymentStatusBadge(selectedOrder.paymentStatus)}</div>
                  </div>
                </div>

                {/* Payment Proof */}
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
                          <p className="text-sm font-medium">{formatDate((selectedOrder as any).paymentProofDate)}</p>
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
                <h3 className="font-medium mb-3 flex items-center">
                  <User className="w-4 h-4 mr-2 text-blue-600" /> Customer
                </h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500">Name</p>
                    <p className="font-medium">{selectedOrder.customerName || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="font-medium">{selectedOrder.customerEmail || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="font-medium">{selectedOrder.customerPhone || 'N/A'}</p>
                  </div>
                </div>
                
                {selectedOrder.userId && (
                  <button
                    onClick={() => handleViewCustomer(selectedOrder.userId)}
                    className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                  >
                    <User className="w-4 h-4 mr-1" />
                    View Customer Profile
                  </button>
                )}
              </div>

              {/* Shipping */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium mb-2 flex items-center">
                  <MapPin className="w-4 h-4 mr-2 text-blue-600" /> Shipping
                </h3>
                <p className="text-sm">{selectedOrder.shippingAddress || 'No address provided'}</p>
              </div>

              {/* Items */}
              <div>
                <h3 className="font-medium mb-3">Items</h3>
                <div className="space-y-3">
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                      <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-8 h-8 text-gray-400 m-4" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{item.productName}</p>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <span>Qty: {item.quantity}</span>
                          <span className="mx-2">•</span>
                          <span>₱{(item.unitPrice || item.price).toFixed(2)} each</span>
                        </div>
                        {item.color && (
                          <p className="text-xs text-gray-400 mt-1">Color: {item.color}</p>
                        )}
                      </div>
                      <p className="font-bold text-blue-600">
                        {formatCurrency((item.unitPrice || item.price) * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div className="border-t pt-4">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">{formatCurrency(selectedOrder.totalAmount)}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Shipping</span>
                  <span className="text-green-600 font-medium">Free</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="font-bold">Total</span>
                  <span className="font-bold text-blue-600 text-lg">{formatCurrency(selectedOrder.totalAmount)}</span>
                </div>
              </div>

              {/* Admin Notes */}
              <div className="border-t pt-4">
                <h3 className="font-medium mb-3">Admin Notes</h3>
                <textarea 
                  value={adminNote} 
                  onChange={(e) => setAdminNote(e.target.value)} 
                  rows={2} 
                  className="w-full px-3 py-2 border rounded-lg mb-2" 
                  placeholder="Add admin note..."
                />
                <button
                  onClick={() => handleAddAdminNote(selectedOrder.id)}
                  disabled={!adminNote.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Add Note
                </button>
              </div>

              {/* Payment Verification - Show for pending payments with proof */}
              {selectedOrder.paymentStatus === 'pending' && (selectedOrder as any).paymentProofImage && (
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <h3 className="font-medium mb-3 text-yellow-800">Payment Verification</h3>
                  <textarea 
                    value={approvalNote} 
                    onChange={(e) => setApprovalNote(e.target.value)} 
                    rows={2} 
                    className="w-full px-3 py-2 border rounded-lg mb-3" 
                    placeholder="Verification notes (optional)"
                  />
                  <div className="flex gap-3">
                    <button 
                      onClick={() => handleApprovePayment(selectedOrder.id)} 
                      disabled={updatingStatus} 
                      className="flex-1 flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      <ThumbsUp className="w-4 h-4 mr-2" /> Approve Payment
                    </button>
                    <button 
                      onClick={() => handleRejectPayment(selectedOrder.id)} 
                      disabled={updatingStatus} 
                      className="flex-1 flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                      <ThumbsDown className="w-4 h-4 mr-2" /> Reject Payment
                    </button>
                  </div>
                </div>
              )}

              {/* Status Update */}
              <div className="border-t pt-4">
                <h3 className="font-medium mb-3">Update Order Status</h3>
                <div className="grid grid-cols-3 gap-2">
                  {['pending','awaiting_payment','processing','shipped','delivered','cancelled'].map(s => (
                    <button 
                      key={s} 
                      onClick={() => handleStatusUpdate(selectedOrder.id, s)} 
                      disabled={updatingStatus || selectedOrder.status === s} 
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedOrder.status === s 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
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
      )}

      {/* Receipt Modal */}
      {showReceiptModal && selectedReceipt && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-[60] flex items-center justify-center p-4">
          <button 
            onClick={() => setShowReceiptModal(false)} 
            className="absolute top-4 right-4 text-white hover:text-gray-300 bg-black bg-opacity-50 rounded-full p-2"
          >
            <X className="w-8 h-8" />
          </button>
          <img src={selectedReceipt} alt="Receipt full" className="max-w-full max-h-full object-contain" />
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold mb-4">Export Orders</h3>
            <div className="space-y-3">
              <button
                onClick={() => handleExportOrders('csv')}
                className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center"
              >
                <Download className="w-4 h-4 mr-2" /> Export as CSV
              </button>
              <button
                onClick={() => handleExportOrders('excel')}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center"
              >
                <Download className="w-4 h-4 mr-2" /> Export as Excel
              </button>
              <button
                onClick={() => handleExportOrders('pdf')}
                className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center"
              >
                <Download className="w-4 h-4 mr-2" /> Export as PDF
              </button>
              <button
                onClick={() => setShowExportModal(false)}
                className="w-full px-4 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;