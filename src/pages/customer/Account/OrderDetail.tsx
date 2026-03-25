import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import orderService from '../../../services/order.service';
import { ApiOrder, Order } from '../../../types';
import {
  Package,
  ChevronLeft,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  MapPin,
  User,
  CreditCard,
  Receipt,
  Download,
  AlertCircle,
  Loader,
  ChevronRight,
  Calendar,
  ShoppingBag,
  Phone,
  Mail,
  Smartphone,
  Wallet,
  DollarSign,
  Info,
  MessageCircle,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';

// Helper function to convert Order (string id) to ApiOrder (number id)
const convertToApiOrder = (order: Order): ApiOrder => {
  return {
    id: parseInt(order.id),
    orderNumber: order.orderNumber,
    orderDate: order.orderDate,
    totalAmount: order.totalAmount,
    status: order.status,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
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

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<ApiOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  useEffect(() => {
    if (id) {
      loadOrder();
    } else {
      setError('Invalid order ID');
      setLoading(false);
    }
  }, [id]);

  const loadOrder = async () => {
    setLoading(true);
    setError('');
    try {
      console.log(`📤 Loading order with ID: ${id}`);
      const orderId = parseInt(id as string);
      
      if (isNaN(orderId)) {
        throw new Error('Invalid order ID format');
      }
      
      const data = await orderService.getOrderById(orderId);
      console.log('📦 Order data from API:', data);
      
      if (!data) {
        setError('Order not found');
      } else {
        const convertedOrder = convertToApiOrder(data as Order);
        console.log('📦 Converted order:', convertedOrder);
        setOrder(convertedOrder);
      }
    } catch (error: any) {
      console.error('❌ Failed to load order:', error);
      setError(error.message || 'Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'delivered': return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'shipped': return <Truck className="w-6 h-6 text-blue-500" />;
      case 'processing': return <Clock className="w-6 h-6 text-yellow-500" />;
      case 'pending': return <Clock className="w-6 h-6 text-gray-500" />;
      case 'awaiting_payment': return <Clock className="w-6 h-6 text-orange-500" />;
      case 'cancelled': return <XCircle className="w-6 h-6 text-red-500" />;
      default: return <Package className="w-6 h-6 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
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

  const getPaymentStatusDisplay = (paymentStatus: string, rejectedBy?: string) => {
    if (rejectedBy && paymentStatus === 'failed') {
      return { text: 'FAILED', color: 'bg-red-100 text-red-800' };
    }
    switch(paymentStatus) {
      case 'paid': return { text: 'PAID', color: 'bg-green-100 text-green-800' };
      case 'pending': return { text: 'PENDING', color: 'bg-yellow-100 text-yellow-800' };
      case 'failed': return { text: 'FAILED', color: 'bg-red-100 text-red-800' };
      case 'refunded': return { text: 'REFUNDED', color: 'bg-purple-100 text-purple-800' };
      default: return { text: paymentStatus.toUpperCase(), color: 'bg-gray-100 text-gray-800' };
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch(method) {
      case 'cod': return <DollarSign className="w-5 h-5 text-green-600" />;
      case 'gcash': return <Smartphone className="w-5 h-5 text-blue-600" />;
      case 'paymaya': return <Wallet className="w-5 h-5 text-purple-600" />;
      default: return <CreditCard className="w-5 h-5 text-gray-600" />;
    }
  };

  const getPaymentMethodName = (method: string) => {
    switch(method) {
      case 'cod': return 'Cash on Delivery';
      case 'gcash': return 'GCash';
      case 'paymaya': return 'PayMaya';
      default: return method;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
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

  const getStatusStep = (status: string) => {
    const steps = ['pending', 'awaiting_payment', 'processing', 'shipped', 'delivered'];
    const currentIndex = steps.indexOf(status);
    return currentIndex >= 0 ? currentIndex + 1 : 0;
  };

  // Get simplified notification message
  const getNotification = () => {
    if (!order) return null;
    
    if (order.approvedBy && order.paymentStatus === 'paid') {
      return {
        type: 'approved',
        icon: <ThumbsUp className="w-6 h-6 text-green-600" />,
        title: 'Payment Approved!',
        message: `Your payment has been approved. Your order is now being processed.`,
        color: 'bg-green-50 border-green-200 text-green-800'
      };
    }
    
    if (order.rejectedBy && order.paymentStatus === 'failed') {
      return {
        type: 'rejected',
        icon: <ThumbsDown className="w-6 h-6 text-red-600" />,
        title: 'Payment Rejected',
        message: order.rejectionReason || 'Your payment was rejected due to invalid or insufficient payment proof.',
        color: 'bg-red-50 border-red-200 text-red-800'
      };
    }
    
    if (order.status === 'cancelled') {
      return {
        type: 'cancelled',
        icon: <XCircle className="w-6 h-6 text-red-600" />,
        title: 'Order Cancelled',
        message: order.rejectionReason || 'Your order has been cancelled.',
        color: 'bg-red-50 border-red-200 text-red-800'
      };
    }
    
    if (order.status === 'awaiting_payment') {
      return {
        type: 'pending',
        icon: <Clock className="w-6 h-6 text-orange-600" />,
        title: 'Awaiting Payment Verification',
        message: 'Your payment proof has been submitted and is awaiting verification. This usually takes 5-10 minutes.',
        color: 'bg-orange-50 border-orange-200 text-orange-800'
      };
    }
    
    if (order.status === 'processing') {
      return {
        type: 'processing',
        icon: <Package className="w-6 h-6 text-blue-600" />,
        title: 'Order Processing',
        message: 'Your order is being prepared for shipment.',
        color: 'bg-blue-50 border-blue-200 text-blue-800'
      };
    }
    
    if (order.status === 'shipped') {
      return {
        type: 'shipped',
        icon: <Truck className="w-6 h-6 text-blue-600" />,
        title: 'Order Shipped!',
        message: order.trackingNumber 
          ? `Your order has been shipped. Tracking number: ${order.trackingNumber}`
          : 'Your order has been shipped and is on its way!',
        color: 'bg-blue-50 border-blue-200 text-blue-800'
      };
    }
    
    if (order.status === 'delivered') {
      return {
        type: 'delivered',
        icon: <CheckCircle className="w-6 h-6 text-green-600" />,
        title: 'Order Delivered!',
        message: 'Your order has been delivered. Thank you for shopping with us!',
        color: 'bg-green-50 border-green-200 text-green-800'
      };
    }
    
    return null;
  };

  const notification = getNotification();
  const paymentStatusDisplay = getPaymentStatusDisplay(order?.paymentStatus || '', order?.rejectedBy);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-red-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-12 h-12 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h2>
          <p className="text-gray-600 mb-6">{error || "We couldn't find the order you're looking for."}</p>
          <button
            onClick={() => navigate('/account/orders')}
            className="inline-flex items-center px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition shadow-lg shadow-red-200"
          >
            Back to Orders
            <ChevronRight className="w-5 h-5 ml-2" />
          </button>
        </div>
      </div>
    );
  }

  const statusStep = getStatusStep(order.status);

  return (
    <div className="min-h-screen bg-gray-50 py-8 md:py-12">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Back Button */}
        <button
          onClick={() => navigate('/account/orders')}
          className="flex items-center text-gray-500 hover:text-gray-700 mb-6 group"
        >
          <ChevronLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition" />
          Back to Orders
        </button>

        {/* Notification Banner */}
        {notification && (
          <div className={`mb-6 p-5 rounded-2xl border ${notification.color} shadow-sm animate-in slide-in-from-top duration-300`}>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                {notification.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-1">{notification.title}</h3>
                <p className="text-sm leading-relaxed">{notification.message}</p>
              </div>
            </div>
          </div>
        )}

        {/* Order Header Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex flex-wrap justify-between items-start gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-red-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Order #{order.orderNumber}</h1>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                <Calendar className="w-4 h-4" />
                <span>Placed on {formatDate(order.orderDate)}</span>
              </div>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-semibold border ${getStatusColor(order.status)}`}>
              {order.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>

          {/* Order Progress Tracker */}
          <div className="mt-8">
            <div className="flex items-center justify-between">
              {['Pending', 'Payment', 'Processing', 'Shipped', 'Delivered'].map((step, index) => {
                const stepStatus = index + 1 <= statusStep;
                const isCurrent = index + 1 === statusStep;
                return (
                  <React.Fragment key={step}>
                    <div className="flex flex-col items-center relative">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        stepStatus
                          ? 'bg-red-600 text-white shadow-lg shadow-red-200'
                          : 'bg-gray-200 text-gray-400'
                      } ${isCurrent ? 'ring-4 ring-red-100' : ''}`}>
                        {stepStatus ? <CheckCircle className="w-5 h-5" /> : index + 1}
                      </div>
                      <span className={`text-xs mt-2 font-medium ${
                        stepStatus ? 'text-red-600' : 'text-gray-400'
                      }`}>
                        {step}
                      </span>
                    </div>
                    {index < 4 && (
                      <div className={`flex-1 h-1 mx-2 rounded-full ${
                        index + 1 < statusStep ? 'bg-red-600' : 'bg-gray-200'
                      }`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Order Items */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Package className="w-5 h-5 mr-2 text-red-600" />
                Order Items ({order.items?.length || 0})
              </h2>
              <div className="space-y-4">
                {order.items?.map((item, idx) => (
                  <div key={idx} className="flex gap-4 py-4 border-b last:border-0">
                    <div className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-8 h-8 text-gray-400 m-4" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.productName}</h3>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span>Qty: {item.quantity}</span>
                        <span>₱{(item.unitPrice || item.price || 0).toLocaleString()} each</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-600">
                        {formatCurrency((item.unitPrice || item.price || 0) * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Summary */}
              <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">{formatCurrency(order.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span className="text-green-600 font-medium">Free</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-100">
                    <span>Total</span>
                    <span className="text-red-600">{formatCurrency(order.totalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Order Details */}
          <div className="space-y-6">
            {/* Payment Information */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <CreditCard className="w-5 h-5 mr-2 text-red-600" />
                Payment Information
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                  {getPaymentMethodIcon(order.paymentMethod)}
                  <div>
                    <p className="text-sm text-gray-500">Payment Method</p>
                    <p className="font-medium capitalize">{getPaymentMethodName(order.paymentMethod)}</p>
                  </div>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500">Payment Status</p>
                  <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full mt-1 ${paymentStatusDisplay.color}`}>
                    {paymentStatusDisplay.text}
                  </span>
                </div>
              </div>

              {/* Payment Proof */}
              {order.paymentProofImage && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-500 mb-2">Payment Proof</p>
                  <div 
                    className="relative group cursor-pointer overflow-hidden rounded-xl"
                    onClick={() => setShowReceiptModal(true)}
                  >
                    <img
                      src={order.paymentProofImage}
                      alt="Payment receipt"
                      className="w-full h-32 object-cover rounded-xl border border-gray-200 group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      <Receipt className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  {order.paymentProofReference && (
                    <div className="mt-2 p-2 bg-gray-50 rounded-lg text-xs text-gray-500">
                      <span className="font-medium">Reference:</span> {order.paymentProofReference}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Shipping Information */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-red-600" />
                Shipping Address
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{order.shippingAddress}</p>
              {order.trackingNumber && (
                <div className="mt-4 p-3 bg-blue-50 rounded-xl">
                  <p className="text-xs text-blue-600 font-medium">Tracking Number</p>
                  <p className="text-sm font-medium text-blue-800">{order.trackingNumber}</p>
                </div>
              )}
            </div>

            {/* Customer Information */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2 text-red-600" />
                Customer Details
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700">{order.customerName || 'Guest'}</span>
                </div>
                <div className="flex items-center gap-3 p-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700">{order.customerEmail}</span>
                </div>
                {order.customerPhone && (
                  <div className="flex items-center gap-3 p-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700">{order.customerPhone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Need Help?</h3>
              <div className="space-y-3">
                {order.status === 'delivered' && (
                  <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition">
                    <Download className="w-4 h-4" />
                    Download Invoice
                  </button>
                )}
                {order.paymentStatus === 'pending' && order.paymentMethod !== 'cod' && (
                  <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-yellow-600 text-white rounded-xl hover:bg-yellow-700 transition">
                    <Clock className="w-4 h-4" />
                    Payment Pending
                  </button>
                )}
                {order.paymentStatus === 'failed' && (
                  <Link
                    to="/contact"
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Resubmit Payment
                  </Link>
                )}
                <Link
                  to="/contact"
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition"
                >
                  <AlertCircle className="w-4 h-4" />
                  Contact Support
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Receipt Modal */}
      {showReceiptModal && order.paymentProofImage && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setShowReceiptModal(false)}
        >
          <button
            onClick={() => setShowReceiptModal(false)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 bg-black/50 rounded-full p-2 transition"
          >
            <XCircle className="w-8 h-8" />
          </button>
          <img
            src={order.paymentProofImage}
            alt="Receipt full size"
            className="max-w-full max-h-full object-contain rounded-2xl"
          />
        </div>
      )}
    </div>
  );
};

export default OrderDetail;