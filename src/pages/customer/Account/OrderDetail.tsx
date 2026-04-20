import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import orderService from '../../../services/order.service';
import reviewService from '../../../services/review.service';
import uploadService from '../../../services/upload.service';
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
  MessageCircle,
  ThumbsUp,
  ThumbsDown,
  Star,
  Check,
  X,
  Upload,
  Camera,
  QrCode
} from 'lucide-react';
import { showSuccess, showError, showLoading, dismissToast } from '../../../utils/toast';
import paymaya_logo from '../../../assets/paymaya_logo.png';
import gcash_logo from '../../../assets/gcash_logo.png';
import qrCode from '../../../qr/qr_gcash.png';

interface OrderItemDisplay {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  price: number;
  imageUrl: string;
}

interface OrderDisplay {
  id: number;
  orderNumber: string;
  orderDate: string;
  totalAmount: number;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  shippingAddress: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  items: OrderItemDisplay[];
  trackingNumber?: string;
  paymentProofImage?: string;
  paymentProofReference?: string;
  paymentProofSender?: string;
  paymentProofDate?: string;
  paymentProofNotes?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectionReason?: string;
}

interface RatedProduct {
  productId: number;
  rating: number;
  reviewId?: number;
}

// Shop payment details for display
const SHOP_PAYMENT_DETAILS = {
  gcash: {
    name: 'GCash',
    accountName: 'Doctama Marketing',
    accountNumber: '09123456789',
    qrCode: qrCode,
  },
  paymaya: {
    name: 'PayMaya',
    accountName: 'Doctama Marketing',
    accountNumber: '09123456789',
    qrCode: qrCode,
  }
};

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [order, setOrder] = useState<OrderDisplay | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [ratedProducts, setRatedProducts] = useState<Map<number, RatedProduct>>(new Map());
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<OrderItemDisplay | null>(null);
  const [selectedRating, setSelectedRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [ratingTitle, setRatingTitle] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [existingReviews, setExistingReviews] = useState<Map<number, any>>(new Map());
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [canReview, setCanReview] = useState<{ canReview: boolean; reason?: string } | null>(null);

  // Complete Payment states
  const [showCompletePaymentModal, setShowCompletePaymentModal] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string>('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [senderName, setSenderName] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);

  useEffect(() => {
    if (id) {
      loadOrder();
    } else {
      setError('Invalid order ID');
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (order?.status?.toLowerCase() === 'delivered' && order.items?.length > 0) {
      checkExistingReviews();
    }
  }, [order]);

  const loadOrder = async () => {
    setLoading(true);
    setError('');
    try {
      const orderId = parseInt(id as string);
      
      if (isNaN(orderId)) {
        throw new Error('Invalid order ID format');
      }
      
      const data = await orderService.getOrderById(orderId);
      
      if (!data) {
        setError('Order not found');
      } else {
        const displayOrder: OrderDisplay = {
          id: typeof data.id === 'string' ? parseInt(data.id) : data.id,
          orderNumber: data.orderNumber,
          orderDate: data.orderDate,
          totalAmount: data.totalAmount,
          status: data.status,
          paymentMethod: data.paymentMethod,
          paymentStatus: data.paymentStatus,
          shippingAddress: data.shippingAddress || '',
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          customerPhone: data.customerPhone,
          items: data.items?.map((item: any) => ({
            id: typeof item.id === 'string' ? parseInt(item.id) : (item.id || 0),
            productId: typeof item.productId === 'string' ? parseInt(item.productId) : (item.productId || 0),
            productName: item.productName || '',
            quantity: item.quantity || 0,
            unitPrice: item.unitPrice || item.price || 0,
            price: item.price || item.unitPrice || 0,
            imageUrl: item.imageUrl || ''
          })) || [],
          trackingNumber: (data as any).trackingNumber,
          paymentProofImage: (data as any).paymentProofImage,
          paymentProofReference: (data as any).paymentProofReference,
          paymentProofSender: (data as any).paymentProofSender,
          paymentProofDate: (data as any).paymentProofDate,
          paymentProofNotes: (data as any).paymentProofNotes,
          approvedBy: (data as any).approvedBy,
          approvedAt: (data as any).approvedAt,
          rejectedBy: (data as any).rejectedBy,
          rejectionReason: (data as any).rejectionReason
        };
        setOrder(displayOrder);
      }
    } catch (error: any) {
      console.error('❌ Failed to load order:', error);
      setError(error.message || 'Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  const checkReviewEligibility = async (productId: number) => {
    try {
      const response = await reviewService.canReviewProduct(productId);
      setCanReview(response);
      return response.canReview;
    } catch (error) {
      console.error('Failed to check review eligibility:', error);
      setCanReview({ canReview: false, reason: 'error' });
      return false;
    }
  };

  const checkExistingReviews = async () => {
    if (!order?.items) return;
    
    setLoadingReviews(true);
    const reviewsMap = new Map();
    
    try {
      for (const item of order.items) {
        const reviews = await reviewService.getProductReviews(item.productId);
        const userReview = reviews.find((r: any) => r.userName === order.customerName);
        
        if (userReview) {
          reviewsMap.set(item.productId, userReview);
          ratedProducts.set(item.productId, {
            productId: item.productId,
            rating: userReview.rating,
            reviewId: userReview.id
          });
        }
      }
      setExistingReviews(reviewsMap);
      setRatedProducts(new Map(ratedProducts));
    } catch (error) {
      console.error('Failed to check existing reviews:', error);
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showError('File too large. Maximum size is 5MB.');
      return;
    }

    if (!file.type.startsWith('image/')) {
      showError('Please upload an image file.');
      return;
    }

    setReceiptFile(file);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setReceiptPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeReceipt = () => {
    setReceiptFile(null);
    setReceiptPreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCompletePayment = async () => {
    if (!order) return;
    
    if (!receiptFile) {
      showError('Please upload your payment receipt');
      return;
    }
    
    if (!referenceNumber.trim()) {
      showError('Please enter the reference number');
      return;
    }
    
    if (!senderName.trim()) {
      showError('Please enter the sender name');
      return;
    }
    
    setSubmittingPayment(true);
    const loadingToast = showLoading('Submitting payment proof...');
    
    try {
      const uploadedUrls = await uploadService.uploadImages([receiptFile]);
      const receiptImageUrl = uploadedUrls[0];
      
      await orderService.updateOrderPayment(order.id, 'pending', {
        paymentProofImage: receiptImageUrl,
        paymentProofReference: referenceNumber,
        paymentProofSender: senderName,
        paymentProofDate: paymentDate,
        paymentProofNotes: ''
      });
      
      dismissToast(loadingToast);
      showSuccess('Payment proof submitted! Your payment is now under review.');
      
      setShowCompletePaymentModal(false);
      setReceiptFile(null);
      setReceiptPreview('');
      setReferenceNumber('');
      setSenderName('');
      setPaymentDate(new Date().toISOString().split('T')[0]);
      
      await loadOrder();
    } catch (error: any) {
      dismissToast(loadingToast);
      showError(error.message || 'Failed to submit payment proof');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleRateProduct = async (product: OrderItemDisplay) => {
    const existing = existingReviews.get(product.productId);
    if (existing) {
      showError(`You already reviewed ${product.productName}`);
      return;
    }
    
    // Check if user can review this product
    const canReviewThisProduct = await checkReviewEligibility(product.productId);
    if (!canReviewThisProduct) {
      showError('You are not eligible to review this product');
      return;
    }
    
    setSelectedProduct(product);
    setSelectedRating(ratedProducts.get(product.productId)?.rating || 0);
    setRatingComment('');
    setRatingTitle('');
    setShowRatingModal(true);
  };

  const handleSubmitRating = async () => {
    if (!selectedProduct) return;
    
    if (selectedRating === 0) {
      showError('Please select a rating');
      return;
    }
    
    if (!ratingComment.trim()) {
      showError('Please write a review comment');
      return;
    }
    
    setSubmittingRating(true);
    const loadingToast = showLoading('Submitting review...');
    
    try {
      await reviewService.createReview({
        productId: selectedProduct.productId,
        rating: selectedRating,
        title: ratingTitle,
        comment: ratingComment,
        images: []
      });
      
      dismissToast(loadingToast);
      showSuccess(`Thank you for reviewing ${selectedProduct.productName}!`);
      
      ratedProducts.set(selectedProduct.productId, {
        productId: selectedProduct.productId,
        rating: selectedRating
      });
      setRatedProducts(new Map(ratedProducts));
      
      setShowRatingModal(false);
      setSelectedProduct(null);
      setSelectedRating(0);
      setRatingComment('');
      setRatingTitle('');
      
      checkExistingReviews();
    } catch (error: any) {
      dismissToast(loadingToast);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to submit review';
      console.error('❌ Review submission error:', error.response?.data);
      showError(errorMessage);
    } finally {
      setSubmittingRating(false);
    }
  };

  const renderStars = (rating: number, size: number = 5, interactive: boolean = false, onStarClick?: (rating: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            onClick={() => interactive && onStarClick?.(star)}
            disabled={!interactive}
            className={`${interactive ? 'cursor-pointer hover:scale-110 transition' : 'cursor-default'}`}
          >
            <Star
              className={`w-${size} h-${size} ${
                star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  const getDisplayStatus = () => {
    if (!order) return '';
    
    if (order.rejectedBy && order.paymentStatus === 'failed') {
      return 'PAYMENT FAILED';
    }
    
    if (order.approvedBy && order.paymentStatus === 'paid') {
      return 'PAYMENT APPROVED';
    }
    
    return order.status.replace('_', ' ').toUpperCase();
  };

  const getDisplayStatusColor = () => {
    if (!order) return '';
    
    if (order.rejectedBy && order.paymentStatus === 'failed') {
      return 'bg-red-100 text-red-800 border-red-200';
    }
    
    if (order.approvedBy && order.paymentStatus === 'paid') {
      return 'bg-green-100 text-green-800 border-green-200';
    }
    
    switch(order.status) {
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

  const getStatusStep = (order: OrderDisplay): number => {
    const steps = order.paymentMethod === 'cod' 
      ? ['pending', 'processing', 'shipped', 'delivered']
      : ['pending', 'awaiting_payment', 'processing', 'shipped', 'delivered'];
    
    const currentIndex = steps.indexOf(order.status);
    
    if (order.approvedBy && order.paymentStatus === 'paid' && currentIndex <= 1) {
      return 3;
    }
    
    return currentIndex >= 0 ? currentIndex + 1 : 0;
  };

  const getProgressSteps = (order: OrderDisplay) => {
    if (order.paymentMethod === 'cod') {
      return ['Pending', 'Processing', 'Shipped', 'Delivered'];
    }
    return ['Pending', 'Payment', 'Processing', 'Shipped', 'Delivered'];
  };

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
        message: order.rejectionReason 
          ? `Reason: ${order.rejectionReason}` 
          : 'Your payment was rejected due to invalid or insufficient payment proof.',
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
    
    if (order.status === 'awaiting_payment' || (order.paymentStatus === 'pending' && !order.paymentProofImage)) {
      return {
        type: 'awaiting_payment',
        icon: <Clock className="w-6 h-6 text-orange-600" />,
        title: 'Complete Your Payment',
        message: 'Please complete your payment and upload the receipt to process your order.',
        color: 'bg-orange-50 border-orange-200 text-orange-800',
        action: true
      };
    }
    
    if (order.paymentStatus === 'pending' && order.paymentProofImage) {
      return {
        type: 'verifying',
        icon: <Clock className="w-6 h-6 text-blue-600" />,
        title: 'Payment Under Review',
        message: 'Your payment proof has been submitted and is awaiting verification. This usually takes 5-10 minutes.',
        color: 'bg-blue-50 border-blue-200 text-blue-800'
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
        message: 'Your order has been delivered. We hope you love your items! Please take a moment to rate your products.',
        color: 'bg-green-50 border-green-200 text-green-800'
      };
    }
    
    return null;
  };

  const notification = getNotification();
  const paymentStatusDisplay = getPaymentStatusDisplay(order?.paymentStatus || '', order?.rejectedBy);
  const displayStatus = getDisplayStatus();
  const displayStatusColor = getDisplayStatusColor();
  const needsPayment = order && order.paymentMethod !== 'cod' && 
                       order.paymentStatus === 'pending' && 
                       !order.paymentProofImage;
  const paymentDetails = order ? SHOP_PAYMENT_DETAILS[order.paymentMethod as 'gcash' | 'paymaya'] : null;

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

  const currentStep = getStatusStep(order);
  const progressSteps = getProgressSteps(order);
  const isPaymentFailed = order.rejectedBy && order.paymentStatus === 'failed';
  const isDelivered = order.status?.toLowerCase() === 'delivered';

  return (
    <div className="min-h-screen bg-gray-50 py-8 md:py-12">
      <div className="container mx-auto px-4 max-w-5xl">
        <button
          onClick={() => navigate('/account/orders')}
          className="flex items-center text-gray-500 hover:text-gray-700 mb-6 group"
        >
          <ChevronLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition" />
          Back to Orders
        </button>

        {notification && (
          <div className={`mb-6 p-5 rounded-2xl border ${notification.color} shadow-sm animate-in slide-in-from-top duration-300`}>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                {notification.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-1">{notification.title}</h3>
                <p className="text-sm leading-relaxed">{notification.message}</p>
                {notification.action && needsPayment && (
                  <button
                    onClick={() => setShowCompletePaymentModal(true)}
                    className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
                  >
                    <Upload className="w-4 h-4" />
                    Complete Payment Now
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

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
            <span className={`px-4 py-2 rounded-full text-sm font-semibold border ${displayStatusColor}`}>
              {displayStatus}
            </span>
          </div>

          {/* Order Progress Tracker */}
          <div className="mt-8">
            <div className="flex items-center justify-between">
              {progressSteps.map((step, index) => {
                let stepCompleted = false;
                
                if (order.paymentMethod === 'cod') {
                  const adjustedCurrentStep = currentStep >= 2 ? currentStep - 1 : currentStep;
                  stepCompleted = index < adjustedCurrentStep;
                } else {
                  if (index === 1) {
                    if (isPaymentFailed) {
                      stepCompleted = false;
                    } else if (order.approvedBy && order.paymentStatus === 'paid') {
                      stepCompleted = true;
                    } else if (order.paymentProofImage && order.paymentStatus === 'pending') {
                      stepCompleted = true;
                    } else {
                      stepCompleted = currentStep > 2;
                    }
                  } else {
                    stepCompleted = index < currentStep - 1;
                  }
                }
                
                const isCurrent = (() => {
                  if (order.paymentMethod === 'cod') {
                    const adjustedCurrentStep = currentStep >= 2 ? currentStep - 1 : currentStep;
                    return index === adjustedCurrentStep;
                  }
                  return index === currentStep - 1;
                })();
                
                const isPaymentStepCurrent = order.paymentMethod !== 'cod' && 
                  index === 1 && 
                  order.paymentProofImage && 
                  order.paymentStatus === 'pending' &&
                  !order.approvedBy;
                
                const effectiveIsCurrent = isCurrent || isPaymentStepCurrent;
                
                return (
                  <React.Fragment key={step}>
                    <div className="flex flex-col items-center relative">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        stepCompleted || (isPaymentFailed && index === 1)
                          ? isPaymentFailed && index === 1
                            ? 'bg-red-600 text-white shadow-lg shadow-red-200'
                            : 'bg-red-600 text-white shadow-lg shadow-red-200'
                          : 'bg-gray-200 text-gray-400'
                      } ${effectiveIsCurrent ? 'ring-4 ring-red-100' : ''}`}>
                        {stepCompleted || (isPaymentFailed && index === 1) ? 
                          isPaymentFailed && index === 1 ? <XCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" /> 
                          : index + 1}
                      </div>
                      <span className={`text-xs mt-2 font-medium ${
                        stepCompleted || (isPaymentFailed && index === 1) ? 'text-red-600' : 'text-gray-400'
                      }`}>
                        {step}
                      </span>
                    </div>
                    {index < progressSteps.length - 1 && (
                      <div className={`flex-1 h-1 mx-2 rounded-full ${
                        stepCompleted && !(isPaymentFailed && index === 0) ? 'bg-red-600' : 'bg-gray-200'
                      }`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Package className="w-5 h-5 mr-2 text-red-600" />
                Order Items ({order.items?.length || 0})
              </h2>
              <div className="space-y-4">
                {order.items?.map((item, idx) => {
                  const hasRated = existingReviews.has(item.productId);
                  const userRating = ratedProducts.get(item.productId);
                  
                  return (
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
                        
                        {isDelivered && (
                          <div className="mt-3">
                            {hasRated ? (
                              <div className="flex items-center gap-2">
                                {renderStars(userRating?.rating || 0, 4)}
                                <span className="text-xs text-green-600 flex items-center gap-1">
                                  <Check className="w-3 h-3" />
                                  Rated
                                </span>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleRateProduct(item)}
                                className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700 transition group"
                              >
                                <Star className="w-4 h-4 group-hover:fill-yellow-400 group-hover:text-yellow-400" />
                                Rate this product
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-red-600">
                          {formatCurrency((item.unitPrice || item.price || 0) * item.quantity)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

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

          <div className="space-y-6">
            {needsPayment && paymentDetails && (
              <div className="bg-white rounded-2xl shadow-sm border border-orange-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                    <Clock className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Complete Your Payment</h3>
                    <p className="text-xs text-gray-500">Pay via {paymentDetails.name}</p>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Amount to Pay:</span>
                    <span className="text-xl font-bold text-gray-900">{formatCurrency(order.totalAmount)}</span>
                  </div>
                  <button
                    onClick={() => setShowPaymentDetails(!showPaymentDetails)}
                    className="w-full flex items-center justify-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                  >
                    <QrCode className="w-4 h-4" />
                    {showPaymentDetails ? 'Hide' : 'View'} Payment Details
                    <ChevronRight className={`w-4 h-4 transition ${showPaymentDetails ? 'rotate-90' : ''}`} />
                  </button>
                  
                  {showPaymentDetails && (
                    <div className="mt-4 space-y-3">
                      <div className="text-center">
                        <img src={paymentDetails.qrCode} alt="QR Code" className="w-40 h-40 mx-auto rounded-xl" />
                      </div>
                      <div className="bg-white rounded-lg p-3">
                        <p className="text-xs text-gray-500">Account Name</p>
                        <p className="font-medium">{paymentDetails.accountName}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3">
                        <p className="text-xs text-gray-500">Account Number</p>
                        <p className="font-mono font-medium">{paymentDetails.accountNumber}</p>
                      </div>
                    </div>
                  )}
                </div>
                
                <button
                  onClick={() => setShowCompletePaymentModal(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition"
                >
                  <Upload className="w-4 h-4" />
                  Upload Payment Receipt
                </button>
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <CreditCard className="w-5 h-5 mr-2 text-red-600" />
                Payment Information
              </h3>
              
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl mb-3">
                {getPaymentMethodIcon(order.paymentMethod)}
                <div>
                  <p className="text-sm text-gray-500">Payment Method</p>
                  <p className="font-medium capitalize">{getPaymentMethodName(order.paymentMethod)}</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl mb-3">
                <span className="text-sm text-gray-500">Payment Status</span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${paymentStatusDisplay.color}`}>
                  {paymentStatusDisplay.text}
                </span>
              </div>

              {order.paymentStatus === 'failed' && order.rejectionReason && (
                <div className="mb-3 p-3 bg-red-50 rounded-lg border border-red-100">
                  <p className="text-sm text-red-700">
                    <span className="font-semibold">Reason:</span> {order.rejectionReason}
                  </p>
                </div>
              )}
              
              {order.approvedBy && order.paymentStatus === 'paid' && (
                <div className="mt-3 p-3 bg-green-50 rounded-xl border border-green-200">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-green-800">Payment Approved</p>
                      <p className="text-xs text-green-700 mt-1">
                        Approved by: <span className="font-medium">{order.approvedBy}</span>
                      </p>
                      {order.approvedAt && (
                        <p className="text-xs text-green-600 mt-0.5">
                          Date: {new Date(order.approvedAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {order.rejectedBy && order.paymentStatus === 'failed' && (
                <div className="mt-3 p-4 bg-red-50 rounded-xl border border-red-200">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <XCircle className="w-6 h-6 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-base font-bold text-red-800 mb-2">Payment Rejected</p>
                      
                      <div className="space-y-2 text-sm">
                        {order.rejectionReason && (
                          <div className="flex items-start gap-2">
                            <span className="text-red-600 font-medium min-w-[80px]">Reason:</span>
                            <span className="text-gray-800 bg-white px-3 py-2 rounded-lg border border-red-100 flex-1">
                              {order.rejectionReason}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-3 pt-3 border-t border-red-200">
                        <button
                          onClick={() => setShowCompletePaymentModal(true)}
                          className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                        >
                          <Upload className="w-4 h-4" />
                          Resubmit Payment Proof
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

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
                  {order.paymentProofSender && (
                    <div className="mt-1 p-2 bg-gray-50 rounded-lg text-xs text-gray-500">
                      <span className="font-medium">Sender:</span> {order.paymentProofSender}
                    </div>
                  )}
                </div>
              )}
            </div>

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

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Need Help?</h3>
              <div className="space-y-3">
                {order.status === 'delivered' && (
                  <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition">
                    <Download className="w-4 h-4" />
                    Download Invoice
                  </button>
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

      {/* Complete Payment Modal */}
      {showCompletePaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Complete Payment</h3>
              <button
                onClick={() => setShowCompletePaymentModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
                <p className="text-sm text-orange-800">
                  <span className="font-bold">Amount to Pay:</span> {formatCurrency(order.totalAmount)}
                </p>
                <p className="text-xs text-orange-600 mt-1">
                  Please send the exact amount and upload your receipt below.
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Receipt <span className="text-red-600">*</span>
                </label>
                {!receiptPreview ? (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-orange-500 hover:bg-orange-50 transition"
                  >
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Camera className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-600">Click to upload receipt</p>
                    <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>
                ) : (
                  <div className="relative">
                    <img 
                      src={receiptPreview} 
                      alt="Receipt preview" 
                      className="w-full max-h-48 object-contain bg-gray-50 rounded-xl border-2 border-green-500 p-2"
                    />
                    <button
                      onClick={removeReceipt}
                      className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition shadow-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reference Number <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="e.g., 1234 5678 9012"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sender Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="Name on the transaction"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Date <span className="text-red-600">*</span>
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                />
              </div>
              
              <div className="bg-blue-50 rounded-xl p-3 border border-blue-200">
                <p className="text-xs text-blue-700">
                  Your payment will be reviewed by our team. This usually takes 5-10 minutes.
                </p>
              </div>
              
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleCompletePayment}
                  disabled={submittingPayment}
                  className="flex-1 bg-orange-600 text-white py-2.5 rounded-xl font-medium hover:bg-orange-700 transition disabled:opacity-50"
                >
                  {submittingPayment ? (
                    <Loader className="w-5 h-5 animate-spin mx-auto" />
                  ) : (
                    'Submit Payment Proof'
                  )}
                </button>
                <button
                  onClick={() => setShowCompletePaymentModal(false)}
                  className="px-6 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rating Modal */}
      {showRatingModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Rate Product</h3>
              <button
                onClick={() => setShowRatingModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                  {selectedProduct.imageUrl ? (
                    <img src={selectedProduct.imageUrl} alt={selectedProduct.productName} className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-8 h-8 text-gray-400 m-4" />
                  )}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{selectedProduct.productName}</h4>
                  <p className="text-sm text-gray-500">Quantity: {selectedProduct.quantity}</p>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Your Rating *</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(rating => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setSelectedRating(rating)}
                      className="focus:outline-none transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          rating <= selectedRating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Review Title (Optional)</label>
                <input
                  type="text"
                  value={ratingTitle}
                  onChange={(e) => setRatingTitle(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
                  placeholder="Summarize your experience"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Your Review *</label>
                <textarea
                  rows={4}
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition resize-none"
                  placeholder="Share your thoughts about this product..."
                  required
                />
              </div>
              
              <div className="bg-amber-50 rounded-xl p-3 border border-amber-200">
                <p className="text-xs text-amber-700">
                  Your feedback helps other customers make informed decisions. Thank you for sharing your experience!
                </p>
              </div>
              
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSubmitRating}
                  disabled={submittingRating}
                  className="flex-1 bg-red-600 text-white py-2.5 rounded-xl font-medium hover:bg-red-700 transition disabled:opacity-50"
                >
                  {submittingRating ? 'Submitting...' : 'Submit Review'}
                </button>
                <button
                  onClick={() => setShowRatingModal(false)}
                  className="px-6 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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