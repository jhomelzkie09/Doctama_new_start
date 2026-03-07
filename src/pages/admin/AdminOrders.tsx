import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
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
  User as UserIcon,
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
  MessageSquare,
  Edit,
  Calendar,
  TrendingUp,
  ArrowUpDown,
  DownloadCloud,
  FilterX,
  Phone,
  Home,
  BarChart3,
  RotateCcw,
  Ban,
  CheckSquare,
  Send,
  Archive,
  AlertTriangle,
  Info,
  Shield,
  PackageCheck,
  PackageOpen,
  PackageX,
  History,
  ClipboardList,
  Crown,
  UserCheck
} from 'lucide-react';
import { Order, PaymentMethod, OrderStatus, PaymentStatus, User } from '../../types';

// Extended Order interface with customer details and workflow fields
interface ExtendedOrder extends Order {
  customer?: User;
  itemsCount?: number;
  paymentProofImage?: string;
  paymentProofReference?: string;
  paymentProofSender?: string;
  paymentProofDate?: string;
  paymentProofNotes?: string;
  adminNotes?: AdminNote[];
  cancellationReason?: string;
  cancellationRequested?: boolean;
  cancellationRequestedAt?: string;
  refundStatus?: 'none' | 'requested' | 'processed' | 'completed';
  refundAmount?: number;
  refundDate?: string;
  trackingNumber?: string;
  shippingCarrier?: string;
  estimatedDelivery?: string;
  actualDelivery?: string;
  orderHistory?: OrderHistoryEntry[];
  
  // New fields for approval tracking
  approvedBy?: string;
  approvedById?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
}

interface AdminNote {
  id: string;
  content: string;
  createdAt: string;
  createdBy: string;
  type: 'info' | 'warning' | 'success' | 'note';
}

interface OrderHistoryEntry {
  id: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  timestamp: string;
  updatedBy: string;
  notes?: string;
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
  cancellationRequests: number;
  refundRequests: number;
  shippedOrders: number;
  deliveredToday: number;
  pendingApproval: number;
  approvedToday: number;
}

const AdminOrders = () => {
  const { isAdmin, user: currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [orders, setOrders] = useState<ExtendedOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<ExtendedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [approvalFilter, setApprovalFilter] = useState<string>('all');
  
  // Selected order modal
  const [selectedOrder, setSelectedOrder] = useState<ExtendedOrder | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  
  // Action modals
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showApproversModal, setShowApproversModal] = useState(false);
  
  // Form states
  const [approvalNote, setApprovalNote] = useState('');
  const [cancellationReason, setCancellationReason] = useState('');
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [shippingCarrier, setShippingCarrier] = useState('');
  const [estimatedDelivery, setEstimatedDelivery] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [noteType, setNoteType] = useState<'info' | 'warning' | 'success' | 'note'>('note');
  const [selectedReceipt, setSelectedReceipt] = useState<string>('');
  
  // Bulk actions
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  
  // Stats
  const [showStats, setShowStats] = useState(false);
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
    paymayaCount: 0,
    cancellationRequests: 0,
    refundRequests: 0,
    shippedOrders: 0,
    deliveredToday: 0,
    pendingApproval: 0,
    approvedToday: 0
  });
  
  // Sorting
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Order;
    direction: 'asc' | 'desc';
  }>({ key: 'orderDate', direction: 'desc' });
  
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
  }, [orders, searchQuery, statusFilter, paymentFilter, dateFilter, approvalFilter]);

  useEffect(() => {
    if (selectAll) {
      setSelectedOrders(filteredOrders.map(o => o.id));
    } else {
      setSelectedOrders([]);
    }
  }, [selectAll, filteredOrders]);

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await orderService.getAllOrders();
      console.log('📦 ALL ORDERS FROM API:', data);
      
      // Fetch customer data for each order and enhance with workflow fields
      const ordersWithDetails = await Promise.all(
        data.map(async (order: Order) => {
          try {
            let customer;
            if (order.userId) {
              customer = await userService.getUserById(order.userId);
            }
            
            // Generate order history from available data
            const orderHistory: OrderHistoryEntry[] = [
              {
                id: `history-${order.id}-1`,
                status: order.status,
                paymentStatus: order.paymentStatus,
                timestamp: order.orderDate,
                updatedBy: 'system',
                notes: 'Order created'
              }
            ];
            
            // Add payment approval history if available
            if (order.paymentStatus === 'paid') {
              orderHistory.push({
                id: `history-${order.id}-2`,
                status: order.status,
                paymentStatus: 'paid',
                timestamp: new Date().toISOString(),
                updatedBy: 'admin',
                notes: 'Payment approved'
              });
            }
            
            return { 
              ...order, 
              customer, 
              itemsCount: order.items?.length || 0,
              orderHistory,
              cancellationRequested: false,
              refundStatus: 'none'
            } as ExtendedOrder;
          } catch (err) {
            console.warn(`Could not fetch customer for order ${order.id}`);
            return { 
              ...order, 
              itemsCount: order.items?.length || 0,
              orderHistory: [],
              cancellationRequested: false,
              refundStatus: 'none'
            } as ExtendedOrder;
          }
        })
      );
      
      setOrders(ordersWithDetails);
    } catch (err: any) {
      setError('Failed to load orders: ' + (err.message || 'Unknown error'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const today = new Date().toDateString();
    
    const stats: OrderStats = {
      totalRevenue: orders.reduce((sum, order) => sum + order.totalAmount, 0),
      averageOrderValue: orders.length > 0 
        ? orders.reduce((sum, order) => sum + order.totalAmount, 0) / orders.length 
        : 0,
      pendingPayment: orders.filter(o => o.paymentStatus === 'pending').length,
      completedOrders: orders.filter(o => o.status === 'delivered').length,
      todayOrders: orders.filter(o => {
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
      paymayaCount: orders.filter(o => o.paymentMethod === 'paymaya').length,
      cancellationRequests: orders.filter(o => o.cancellationRequested).length,
      refundRequests: orders.filter(o => o.refundStatus === 'requested').length,
      shippedOrders: orders.filter(o => o.status === 'shipped').length,
      deliveredToday: orders.filter(o => {
        return o.status === 'delivered' && new Date(o.orderDate).toDateString() === today;
      }).length,
      pendingApproval: orders.filter(o => o.paymentStatus === 'pending' && o.paymentMethod !== 'cod').length,
      approvedToday: orders.filter(o => {
        return o.approvedAt && new Date(o.approvedAt).toDateString() === today;
      }).length
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
        order.paymentProofReference?.toLowerCase().includes(query) ||
        order.trackingNumber?.toLowerCase().includes(query) ||
        order.approvedBy?.toLowerCase().includes(query)
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

    // Approval filter
    if (approvalFilter !== 'all') {
      switch (approvalFilter) {
        case 'approved':
          filtered = filtered.filter(order => order.approvedBy);
          break;
        case 'pending':
          filtered = filtered.filter(order => !order.approvedBy && order.paymentStatus === 'pending');
          break;
        case 'rejected':
          filtered = filtered.filter(order => order.rejectedBy);
          break;
      }
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

  // Order approval function
  const handleApproveOrder = async (orderId: string) => {
    setUpdatingStatus(true);
    try {
      await orderService.updateOrderStatus(parseInt(orderId), 'processing');
      await orderService.updateOrderPayment(parseInt(orderId), 'paid', {
        approvedBy: currentUser?.fullName || 'Admin',
        approvedById: currentUser?.id,
        approvedAt: new Date().toISOString(),
        notes: approvalNote || 'Payment approved'
      });
      
      await fetchOrders();
      if (selectedOrder) {
        setSelectedOrder({ 
          ...selectedOrder, 
          status: 'processing', 
          paymentStatus: 'paid',
          approvedBy: currentUser?.fullName,
          approvedAt: new Date().toISOString()
        });
      }
      setSuccess('Order approved successfully');
      setShowOrderModal(false);
    } catch (err: any) {
      setError('Failed to approve order: ' + (err.message || 'Unknown error'));
    } finally {
      setUpdatingStatus(false);
      setApprovalNote('');
    }
  };

    // Single order status update
const handleStatusUpdate = async (orderId: string, status: string) => {
  setUpdatingStatus(true);
  try {
    await orderService.updateOrderStatus(parseInt(orderId), status);
    await fetchOrders();
    if (selectedOrder) {
      setSelectedOrder({ ...selectedOrder, status: status as OrderStatus });
    }
    setSuccess(`Order status updated to ${status}`);
    setShowOrderModal(false);
  } catch (err: any) {
    setError('Failed to update order status: ' + (err.message || 'Unknown error'));
  } finally {
    setUpdatingStatus(false);
  }
};


  // Payment approval function
  const handleApprovePayment = async (orderId: string) => {
    setUpdatingStatus(true);
    try {
      await orderService.updateOrderPayment(parseInt(orderId), 'paid', {
        approvedBy: currentUser?.fullName || 'Admin',
        approvedById: currentUser?.id,
        approvedAt: new Date().toISOString(),
        notes: approvalNote
      });
      await fetchOrders();
      if (selectedOrder) {
        setSelectedOrder({ 
          ...selectedOrder, 
          paymentStatus: 'paid',
          approvedBy: currentUser?.fullName,
          approvedAt: new Date().toISOString()
        });
      }
      setSuccess('Payment approved successfully');
      setApprovalNote('');
    } catch (err: any) {
      setError('Failed to approve payment: ' + (err.message || 'Unknown error'));
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Payment rejection function
  const handleRejectPayment = async (orderId: string) => {
    if (!approvalNote) {
      setError('Please provide a reason for rejection');
      return;
    }
    setUpdatingStatus(true);
    try {
      await orderService.updateOrderPayment(parseInt(orderId), 'failed', {
        rejectedBy: currentUser?.fullName || 'Admin',
        rejectedById: currentUser?.id,
        rejectedAt: new Date().toISOString(),
        reason: approvalNote
      });
      await fetchOrders();
      if (selectedOrder) {
        setSelectedOrder({ 
          ...selectedOrder, 
          paymentStatus: 'failed',
          rejectedBy: currentUser?.fullName,
          rejectedAt: new Date().toISOString(),
          rejectionReason: approvalNote
        });
      }
      setSuccess('Payment rejected');
      setApprovalNote('');
    } catch (err: any) {
      setError('Failed to reject payment: ' + (err.message || 'Unknown error'));
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Order cancellation function
  const handleCancelOrder = async (orderId: string) => {
    if (!cancellationReason) {
      setError('Please provide a reason for cancellation');
      return;
    }
    setUpdatingStatus(true);
    try {
      await orderService.updateOrderStatus(parseInt(orderId), 'cancelled');
      
      // If payment was already made, process refund
      if (selectedOrder?.paymentStatus === 'paid') {
        await orderService.updateOrderPayment(parseInt(orderId), 'refunded', {
          refundedBy: currentUser?.fullName || 'admin',
          refundedAt: new Date().toISOString(),
          reason: cancellationReason,
          amount: selectedOrder.totalAmount
        });
      }
      
      await fetchOrders();
      setSuccess('Order cancelled successfully');
      setShowCancelModal(false);
      setShowOrderModal(false);
    } catch (err: any) {
      setError('Failed to cancel order: ' + (err.message || 'Unknown error'));
    } finally {
      setUpdatingStatus(false);
      setCancellationReason('');
    }
  };

  // Refund processing function
  const handleProcessRefund = async (orderId: string) => {
    if (!refundAmount || refundAmount <= 0) {
      setError('Please enter a valid refund amount');
      return;
    }
    setUpdatingStatus(true);
    try {
      await orderService.updateOrderPayment(parseInt(orderId), 'refunded', {
        refundedBy: currentUser?.fullName || 'admin',
        refundedAt: new Date().toISOString(),
        amount: refundAmount,
        notes: approvalNote
      });
      
      await fetchOrders();
      setSuccess('Refund processed successfully');
      setShowRefundModal(false);
    } catch (err: any) {
      setError('Failed to process refund: ' + (err.message || 'Unknown error'));
    } finally {
      setUpdatingStatus(false);
      setRefundAmount(0);
      setApprovalNote('');
    }
  };

  // Shipping tracking update
  const handleUpdateTracking = async (orderId: string) => {
    if (!trackingNumber) {
      setError('Please enter a tracking number');
      return;
    }
    setUpdatingStatus(true);
    try {
      // Update order with tracking info
      await orderService.updateOrderStatus(parseInt(orderId), 'shipped');
      
      await fetchOrders();
      setSuccess('Shipping information updated');
      setShowTrackingModal(false);
    } catch (err: any) {
      setError('Failed to update tracking: ' + (err.message || 'Unknown error'));
    } finally {
      setUpdatingStatus(false);
      setTrackingNumber('');
      setShippingCarrier('');
      setEstimatedDelivery('');
    }
  };

  // Mark as delivered
  const handleMarkDelivered = async (orderId: string) => {
    setUpdatingStatus(true);
    try {
      await orderService.updateOrderStatus(parseInt(orderId), 'delivered');
      
      await fetchOrders();
      setSuccess('Order marked as delivered');
      setShowOrderModal(false);
    } catch (err: any) {
      setError('Failed to update order: ' + (err.message || 'Unknown error'));
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Bulk status update
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
      setSuccess(`Updated ${selectedOrders.length} orders to ${status}`);
    } catch (err) {
      setError('Failed to update some orders');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Add admin note
  const handleAddAdminNote = async (orderId: string) => {
    if (!adminNote.trim()) return;
    
    try {
      const newNote: AdminNote = {
        id: `note-${Date.now()}`,
        content: adminNote,
        createdAt: new Date().toISOString(),
        createdBy: currentUser?.fullName || 'Admin',
        type: noteType
      };
      
      // Update local state
      if (selectedOrder) {
        setSelectedOrder({
          ...selectedOrder,
          adminNotes: [...(selectedOrder.adminNotes || []), newNote]
        });
      }
      
      setAdminNote('');
      setNoteType('note');
      setShowNoteModal(false);
      setSuccess('Note added successfully');
    } catch (err) {
      setError('Failed to add note');
    }
  };

  // Export orders
  const handleExportOrders = (format: 'csv' | 'pdf' | 'excel') => {
    if (format === 'csv') {
      const headers = ['Order #', 'Date', 'Customer', 'Email', 'Total', 'Status', 'Payment Method', 'Payment Status', 'Tracking #', 'Approved By', 'Approved At'];
      const csvData = filteredOrders.map(order => [
        order.orderNumber,
        new Date(order.orderDate).toLocaleDateString(),
        order.customerName || 'Guest',
        order.customerEmail || '',
        order.totalAmount.toString(),
        order.status,
        order.paymentMethod,
        order.paymentStatus,
        order.trackingNumber || '',
        order.approvedBy || '',
        order.approvedAt ? new Date(order.approvedAt).toLocaleDateString() : ''
      ]);
      
      const csv = [headers, ...csvData].map(row => row.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orders_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      
      setSuccess(`Exported ${filteredOrders.length} orders to CSV`);
    }
    
    setShowExportModal(false);
  };

  // View customer
  const handleViewCustomer = (customerId?: string) => {
    if (customerId) {
      navigate(`/admin/customers/${customerId}`);
    }
  };

  // Print invoice
  const handlePrintInvoice = (order: ExtendedOrder) => {
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
              .status-badge { 
                display: inline-block; 
                padding: 4px 8px; 
                border-radius: 4px; 
                font-size: 12px;
                background-color: ${order.status === 'delivered' ? '#d1fae5' : 
                                 order.status === 'cancelled' ? '#fee2e2' : 
                                 '#dbeafe'};
                color: ${order.status === 'delivered' ? '#065f46' : 
                        order.status === 'cancelled' ? '#991b1b' : 
                        '#1e40af'};
              }
              .approver-info {
                margin-top: 20px;
                padding: 10px;
                background-color: #f3f4f6;
                border-radius: 8px;
                font-size: 12px;
              }
              @media print { body { padding: 0; } }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>INVOICE</h1>
              <h2>Order #${order.orderNumber}</h2>
              <p>Date: ${new Date(order.orderDate).toLocaleDateString()}</p>
              <p class="status-badge">${order.status.replace('_', ' ').toUpperCase()}</p>
            </div>
            <div class="order-info">
              <p><strong>Customer:</strong> ${order.customerName || 'Guest'}</p>
              <p><strong>Email:</strong> ${order.customerEmail || 'N/A'}</p>
              <p><strong>Phone:</strong> ${order.customerPhone || 'N/A'}</p>
              <p><strong>Shipping Address:</strong> ${order.shippingAddress || 'N/A'}</p>
              ${order.trackingNumber ? `<p><strong>Tracking #:</strong> ${order.trackingNumber}</p>` : ''}
            </div>
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
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
              <p>Payment Method: ${order.paymentMethod.toUpperCase()}</p>
              <p>Payment Status: ${order.paymentStatus.toUpperCase()}</p>
            </div>
            ${order.approvedBy ? `
              <div class="approver-info">
                <p><strong>Approved By:</strong> ${order.approvedBy}</p>
                <p><strong>Approved At:</strong> ${order.approvedAt ? new Date(order.approvedAt).toLocaleString() : 'N/A'}</p>
              </div>
            ` : ''}
            ${order.rejectedBy ? `
              <div class="approver-info">
                <p><strong>Rejected By:</strong> ${order.rejectedBy}</p>
                <p><strong>Rejected At:</strong> ${order.rejectedAt ? new Date(order.rejectedAt).toLocaleString() : 'N/A'}</p>
                <p><strong>Reason:</strong> ${order.rejectionReason || 'N/A'}</p>
              </div>
            ` : ''}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Helper functions for UI
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

  const getPaymentStatusBadge = (status: PaymentStatus) => {
    const colors: Record<PaymentStatus, string> = {
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

  const getApprovalBadge = (order: ExtendedOrder) => {
    if (order.approvedBy) {
      return (
        <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
          <CheckCircle className="w-3 h-3 mr-1" />
          Approved
        </span>
      );
    }
    if (order.rejectedBy) {
      return (
        <span className="inline-flex items-center px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
          <XCircle className="w-3 h-3 mr-1" />
          Rejected
        </span>
      );
    }
    return null;
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
        <Loader className="w-8 h-8 animate-spin text-red-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Success/Error Messages */}
      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
            <span className="text-green-700">{success}</span>
          </div>
          <button onClick={() => setSuccess('')} className="text-green-500 hover:text-green-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-red-500 hover:text-red-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Orders Management</h1>
          <p className="text-gray-600 mt-1">Manage, approve payments, process cancellations, and track orders</p>
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
            <TrendingUp className="w-5 h-5 mr-2 text-red-600" />
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
              <p className="text-sm text-orange-600">Pending Approval</p>
              <p className="text-xl font-bold text-orange-700">{orderStats.pendingApproval}</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-3">
              <p className="text-sm text-yellow-600">Today's Orders</p>
              <p className="text-xl font-bold text-yellow-700">{orderStats.todayOrders}</p>
            </div>
            <div className="bg-indigo-50 rounded-lg p-3">
              <p className="text-sm text-indigo-600">Shipped</p>
              <p className="text-xl font-bold text-indigo-700">{orderStats.shippedOrders}</p>
            </div>
            <div className="bg-pink-50 rounded-lg p-3">
              <p className="text-sm text-pink-600">Approved Today</p>
              <p className="text-xl font-bold text-pink-700">{orderStats.approvedToday}</p>
            </div>
            <div className="bg-teal-50 rounded-lg p-3">
              <p className="text-sm text-teal-600">Completed</p>
              <p className="text-xl font-bold text-teal-700">{orderStats.completedOrders}</p>
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
              onChange={(e) => {
                if (e.target.value) {
                  handleBulkStatusUpdate(e.target.value);
                }
              }}
              className="px-3 py-1 border border-blue-300 rounded-lg text-sm bg-white"
            >
              <option value="">Bulk Actions</option>
              <option value="processing">Mark as Processing</option>
              <option value="shipped">Mark as Shipped</option>
              <option value="delivered">Mark as Delivered</option>
              <option value="cancelled">Cancel Orders</option>
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

      {/* Status Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-8 gap-4 mb-6">
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
        <div 
          className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-500 cursor-pointer hover:shadow-md"
          onClick={() => setApprovalFilter('approved')}
        >
          <p className="text-sm text-gray-600 mb-1">Approved</p>
          <p className="text-xl font-bold text-green-600">{orders.filter(o => o.approvedBy).length}</p>
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
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search orders, customers, approvers..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent" 
            />
          </div>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)} 
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
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
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
          >
            <option value="all">All Payments</option>
            <option value="cod">Cash on Delivery</option>
            <option value="gcash">GCash</option>
            <option value="paymaya">PayMaya</option>
          </select>
          <select 
            value={approvalFilter} 
            onChange={(e) => setApprovalFilter(e.target.value)} 
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
          >
            <option value="all">All Approvals</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending Approval</option>
            <option value="rejected">Rejected</option>
          </select>
          <select 
            value={dateFilter} 
            onChange={(e) => setDateFilter(e.target.value)} 
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="year">Last Year</option>
          </select>
        </div>
      </div>

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
                    className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Approved By</th>
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
                      className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center mr-3">
                        <ShoppingBag className="w-4 h-4 text-red-600" />
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
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">{formatDate(order.orderDate)}</div>
                    <div className="text-xs text-gray-400">{formatRelativeTime(order.orderDate)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-red-600">{formatCurrency(order.totalAmount)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center text-sm text-gray-600">
                        {getPaymentMethodIcon(order.paymentMethod)}
                        <span className="ml-1">{getPaymentMethodName(order.paymentMethod)}</span>
                      </div>
                      {getPaymentStatusBadge(order.paymentStatus)}
                    </div>
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(order.status)}</td>
                  <td className="px-6 py-4">
                    {order.approvedBy ? (
                      <div className="flex items-center">
                        <Crown className="w-4 h-4 text-purple-600 mr-1" />
                        <span className="text-sm text-gray-900">{order.approvedBy}</span>
                      </div>
                    ) : order.rejectedBy ? (
                      <div className="flex items-center">
                        <XCircle className="w-4 h-4 text-red-600 mr-1" />
                        <span className="text-sm text-gray-900">{order.rejectedBy}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => { 
                          setSelectedOrder(order); 
                          setShowOrderModal(true); 
                        }} 
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg"
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to{' '}
              {Math.min(currentPage * itemsPerPage, filteredOrders.length)} of{' '}
              {filteredOrders.length} results
            </div>
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                disabled={currentPage === 1} 
                className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-4 py-2 text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                disabled={currentPage === totalPages} 
                className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
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
              {/* Quick Actions */}
              <div className="flex gap-2 pb-4 border-b">
                <button
                  onClick={() => handleApproveOrder(selectedOrder.id)}
                  disabled={updatingStatus || selectedOrder.status !== 'pending'}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4 mr-2" /> Approve Order
                </button>
                <button
                  onClick={() => {
                    setShowCancelModal(true);
                    setShowOrderModal(false);
                  }}
                  disabled={updatingStatus || selectedOrder.status === 'cancelled' || selectedOrder.status === 'delivered'}
                  className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4 mr-2" /> Cancel Order
                </button>
                <button
                  onClick={() => {
                    setShowTrackingModal(true);
                    setShowOrderModal(false);
                  }}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Truck className="w-4 h-4 mr-2" /> Update Tracking
                </button>
              </div>

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
                  <p className="font-bold text-red-600">{formatCurrency(selectedOrder.totalAmount)}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Items</p>
                  <p className="font-medium">{selectedOrder.items?.length || 0}</p>
                </div>
              </div>

              {/* Approval Information Section */}
              {selectedOrder.approvedBy && (
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h4 className="text-sm font-medium text-green-800 mb-2 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Order Approval Information
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-green-600">Approved By</p>
                      <p className="font-medium text-gray-900">{selectedOrder.approvedBy}</p>
                    </div>
                    <div>
                      <p className="text-green-600">Approved At</p>
                      <p className="font-medium text-gray-900">
                        {selectedOrder.approvedAt ? formatDate(selectedOrder.approvedAt) : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {selectedOrder.rejectedBy && (
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <h4 className="text-sm font-medium text-red-800 mb-2 flex items-center">
                    <XCircle className="w-4 h-4 mr-2" />
                    Order Rejection Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-red-600">Rejected By</p>
                        <p className="font-medium text-gray-900">{selectedOrder.rejectedBy}</p>
                      </div>
                      <div>
                        <p className="text-red-600">Rejected At</p>
                        <p className="font-medium text-gray-900">
                          {selectedOrder.rejectedAt ? formatDate(selectedOrder.rejectedAt) : 'N/A'}
                        </p>
                      </div>
                    </div>
                    {selectedOrder.rejectionReason && (
                      <div>
                        <p className="text-red-600">Reason</p>
                        <p className="text-gray-700 bg-white p-2 rounded mt-1">{selectedOrder.rejectionReason}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Payment & Receipt Section */}
              <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-4 border border-red-200">
                <h3 className="font-medium mb-3 flex items-center text-red-800">
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
                  <div className="mt-4 pt-4 border-t border-red-200">
                    <h4 className="text-sm font-medium text-red-800 mb-3 flex items-center">
                      <Receipt className="w-4 h-4 mr-2" /> Payment Proof
                    </h4>
                    
                    <div className="mb-4">
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
                  <UserIcon className="w-4 h-4 mr-2 text-red-600" /> Customer
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
                    className="flex items-center text-sm text-red-600 hover:text-red-800"
                  >
                    <UserIcon className="w-4 h-4 mr-1" />
                    View Customer Profile
                  </button>
                )}
              </div>

              {/* Shipping */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium mb-2 flex items-center">
                  <MapPin className="w-4 h-4 mr-2 text-red-600" /> Shipping
                </h3>
                <p className="text-sm">{selectedOrder.shippingAddress || 'No address provided'}</p>
                {selectedOrder.trackingNumber && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-blue-800">Tracking Information</p>
                    <p className="text-sm">Tracking #: {selectedOrder.trackingNumber}</p>
                    {selectedOrder.shippingCarrier && (
                      <p className="text-sm">Carrier: {selectedOrder.shippingCarrier}</p>
                    )}
                    {selectedOrder.estimatedDelivery && (
                      <p className="text-sm">Estimated Delivery: {formatDate(selectedOrder.estimatedDelivery)}</p>
                    )}
                  </div>
                )}
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
                      <p className="font-bold text-red-600">
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
                  <span className="font-bold text-red-600 text-lg">{formatCurrency(selectedOrder.totalAmount)}</span>
                </div>
              </div>

              {/* Payment Verification */}
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
                          ? 'bg-red-600 text-white' 
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

      {/* Cancel Order Modal */}
      {showCancelModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold mb-4">Cancel Order #{selectedOrder.orderNumber}</h3>
            <p className="text-gray-600 mb-4">Please provide a reason for cancellation:</p>
            <textarea
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border rounded-lg mb-4"
              placeholder="Reason for cancellation..."
            />
            {selectedOrder.paymentStatus === 'paid' && (
              <div className="bg-yellow-50 p-3 rounded-lg mb-4">
                <p className="text-sm text-yellow-800">
                  This order has already been paid. Cancelling will process a refund of {formatCurrency(selectedOrder.totalAmount)}.
                </p>
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => handleCancelOrder(selectedOrder.id)}
                disabled={!cancellationReason.trim() || updatingStatus}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {updatingStatus ? <Loader className="w-4 h-4 animate-spin mx-auto" /> : 'Cancel Order'}
              </button>
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setShowOrderModal(true);
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tracking Modal */}
      {showTrackingModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold mb-4">Update Tracking Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tracking Number *</label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Enter tracking number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Shipping Carrier</label>
                <select
                  value={shippingCarrier}
                  onChange={(e) => setShippingCarrier(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Select carrier</option>
                  <option value="J&T">J&T Express</option>
                  <option value="LBC">LBC</option>
                  <option value="2GO">2GO</option>
                  <option value="DHL">DHL</option>
                  <option value="FedEx">FedEx</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Delivery Date</label>
                <input
                  type="date"
                  value={estimatedDelivery}
                  onChange={(e) => setEstimatedDelivery(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => handleUpdateTracking(selectedOrder.id)}
                  disabled={!trackingNumber.trim() || updatingStatus}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {updatingStatus ? <Loader className="w-4 h-4 animate-spin mx-auto" /> : 'Update Tracking'}
                </button>
                <button
                  onClick={() => {
                    setShowTrackingModal(false);
                    setShowOrderModal(true);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
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
            <p className="text-sm text-gray-600 mb-4">
              Export {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''} as:
            </p>
            <div className="space-y-3">
              <button
                onClick={() => handleExportOrders('csv')}
                className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center"
              >
                <Download className="w-4 h-4 mr-2" /> Export as CSV
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