import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { 
  CreditCard, 
  Truck, 
  MapPin, 
  ArrowLeft, 
  DollarSign, 
  Smartphone, 
  Wallet, 
  Upload,
  X,
  AlertCircle,
  CheckCircle,
  Shield,
  Clock,
  Package,
  ChevronRight,
  ChevronLeft,
  Info,
  Camera,
  Receipt,
  User,
  Phone,
  Home,
  Mail,
  Calendar,
  FileText,
  Check,
  Loader,
  Lock,
  ShoppingBag,
  Edit,
  QrCode,
  Copy,
  CheckCheck,
  Building2,
  Landmark
} from 'lucide-react';
import orderService from '../../services/order.service';
import uploadService from '../../services/upload.service';
import { PaymentMethod } from '../../types';

// Shop payment details
const SHOP_PAYMENT_DETAILS = {
  gcash: {
    name: 'GCash',
    accountName: 'Doctama Marketing',
    accountNumber: '09123456789',
    qrCode: 'https://via.placeholder.com/200?text=GCash+QR+Code', // Replace with actual QR code URL
    instructions: [
      'Open your GCash app',
      'Tap "Pay QR"',
      'Scan the QR code or enter the number manually',
      'Enter the exact amount',
      'Add your order number as reference',
      'Screenshot the transaction confirmation'
    ]
  },
  paymaya: {
    name: 'PayMaya',
    accountName: 'Doctama Marketing',
    accountNumber: '09123456789',
    qrCode: 'https://via.placeholder.com/200?text=PayMaya+QR+Code', // Replace with actual QR code URL
    instructions: [
      'Open your PayMaya app',
      'Tap "Send Money"',
      'Enter the number or scan QR code',
      'Enter the exact amount',
      'Add your order number as reference',
      'Screenshot the transaction confirmation'
    ]
  }
};

// Payment Details Modal Component
const PaymentDetailsModal = ({ 
  isOpen, 
  onClose, 
  paymentMethod 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  paymentMethod: PaymentMethod;
}) => {
  const [copied, setCopied] = useState(false);
  const details = paymentMethod === 'gcash' ? SHOP_PAYMENT_DETAILS.gcash : SHOP_PAYMENT_DETAILS.paymaya;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-red-600" />
            Pay with {details.name}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* QR Code */}
          <div className="text-center">
            <div className="bg-white p-4 rounded-2xl border border-gray-200 inline-block">
              <img 
                src={details.qrCode} 
                alt={`${details.name} QR Code`} 
                className="w-48 h-48 mx-auto"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">Scan QR code to pay</p>
          </div>

          {/* Account Details */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-500">Account Name</p>
                <p className="font-semibold text-gray-900">{details.accountName}</p>
              </div>
              <button
                onClick={() => copyToClipboard(details.accountName)}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-500">Account Number</p>
                <p className="font-mono font-bold text-lg text-gray-900">{details.accountNumber}</p>
              </div>
              <button
                onClick={() => copyToClipboard(details.accountNumber)}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
              >
                {copied ? <CheckCheck className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Instructions */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Info className="w-4 h-4 text-red-600" />
              How to Pay
            </h3>
            <ol className="space-y-2">
              {details.instructions.map((instruction, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center text-xs font-medium text-gray-600 flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span>{instruction}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Important Note */}
          <div className="bg-yellow-50 rounded-xl p-3 border border-yellow-200">
            <p className="text-xs text-yellow-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>Please upload a clear screenshot of your payment confirmation. Orders without valid proof will be cancelled.</span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition"
          >
            I Understand, Continue
          </button>
        </div>
      </div>
    </div>
  );
};

const Checkout = () => {
  const navigate = useNavigate();
  const { state, clearCart } = useCart();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  
  // Shipping Info
  const [shippingInfo, setShippingInfo] = useState({
    fullName: user?.fullName || '',
    address: '',
    barangay: '',
    city: '',
    province: '',
    zipCode: '',
    phone: '',
    email: user?.email || '',
    deliveryInstructions: ''
  });
  
  // Payment Method
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('gcash');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [agreedToPay, setAgreedToPay] = useState(false);
  
  // Receipt Upload
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string>('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [senderName, setSenderName] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load saved data from localStorage
  useEffect(() => {
    const savedShipping = localStorage.getItem('checkout_shipping');
    if (savedShipping) {
      setShippingInfo(JSON.parse(savedShipping));
    }
  }, []);

  // Save shipping info to localStorage
  useEffect(() => {
    localStorage.setItem('checkout_shipping', JSON.stringify(shippingInfo));
  }, [shippingInfo]);

  const validateShipping = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!shippingInfo.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!shippingInfo.address.trim()) newErrors.address = 'Address is required';
    if (!shippingInfo.barangay.trim()) newErrors.barangay = 'Barangay is required';
    if (!shippingInfo.city.trim()) newErrors.city = 'City is required';
    if (!shippingInfo.province.trim()) newErrors.province = 'Province is required';
    if (!shippingInfo.zipCode.trim()) newErrors.zipCode = 'ZIP code is required';
    if (!shippingInfo.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!shippingInfo.email.trim()) newErrors.email = 'Email is required';
    
    // Phone number validation (Philippines format)
    const phoneRegex = /^(09|\+639)\d{9}$/;
    if (shippingInfo.phone && !phoneRegex.test(shippingInfo.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Please enter a valid Philippine mobile number';
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (shippingInfo.email && !emailRegex.test(shippingInfo.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePaymentDetails = (): boolean => {
    if (paymentMethod === 'cod') {
      return true;
    }

    const newErrors: Record<string, string> = {};
    
    if (!receiptFile) newErrors.receipt = 'Please upload your payment receipt';
    if (!referenceNumber.trim()) newErrors.reference = 'Reference number is required';
    if (!senderName.trim()) newErrors.sender = 'Sender name is required';
    if (!paymentDate) newErrors.paymentDate = 'Payment date is required';
    if (!agreedToPay) newErrors.agreement = 'Please confirm that you understand the payment instructions';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateShipping()) {
      setStep(2);
      window.scrollTo(0, 0);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrors({ ...errors, receipt: 'File too large. Maximum size is 5MB.' });
      return;
    }

    if (!file.type.startsWith('image/')) {
      setErrors({ ...errors, receipt: 'Please upload an image file.' });
      return;
    }

    setUploadStatus('uploading');
    setReceiptFile(file);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setReceiptPreview(reader.result as string);
      setUploadStatus('success');
    };
    reader.readAsDataURL(file);
    
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setUploadProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
      }
    }, 200);
  };

  const removeReceipt = () => {
    setReceiptFile(null);
    setReceiptPreview('');
    setUploadProgress(0);
    setUploadStatus('idle');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePlaceOrder = async () => {
    if (!validatePaymentDetails()) return;

    setLoading(true);
    setUploadProgress(0);
    setUploadStatus('uploading');

    try {
      let receiptImageUrl = '';
      if (receiptFile && paymentMethod !== 'cod') {
        console.log('📤 Uploading receipt...');
        const uploadedUrls = await uploadService.uploadImages([receiptFile]);
        receiptImageUrl = uploadedUrls[0];
        console.log('✅ Receipt uploaded:', receiptImageUrl);
        setUploadProgress(100);
        setUploadStatus('success');
      }

      const orderData: any = {
        totalAmount: state.total,
        shippingAddress: `${shippingInfo.address}, ${shippingInfo.barangay}, ${shippingInfo.city}, ${shippingInfo.province} ${shippingInfo.zipCode}`,
        paymentMethod: paymentMethod,
        paymentStatus: paymentMethod === 'cod' ? 'pending' : 'pending',
        customerName: shippingInfo.fullName,
        customerEmail: shippingInfo.email,
        customerPhone: shippingInfo.phone,
        items: state.items.map(item => ({
          productId: item.id,
          quantity: item.quantity
        }))
      };

      if (shippingInfo.deliveryInstructions) {
        orderData.notes = shippingInfo.deliveryInstructions;
      }

      if (paymentMethod !== 'cod' && receiptImageUrl) {
        orderData.paymentProofImage = receiptImageUrl;
        orderData.paymentProofReference = referenceNumber;
        orderData.paymentProofSender = senderName;
        orderData.paymentProofDate = paymentDate;
        orderData.paymentProofNotes = paymentNotes;
      }

      console.log('📤 Sending order data:', orderData);
      
      const order = await orderService.createOrder(orderData);
      console.log('✅ Order created:', order);
      
      localStorage.removeItem('checkout_shipping');
      
      clearCart();
      navigate(`/account/orders/${order.id}?success=true`);
      
    } catch (error) {
      console.error('❌ Order failed:', error);
      setUploadStatus('error');
      alert('Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  if (state.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-12 h-12 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
          <p className="text-gray-600 mb-8">Looks like you haven't added any items to your cart yet.</p>
          <button
            onClick={() => navigate('/shop')}
            className="px-8 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold inline-flex items-center"
          >
            Continue Shopping
            <ChevronRight className="w-5 h-5 ml-2" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-4 group"
            >
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition" />
              Back
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
            <p className="text-gray-600 mt-1">Complete your purchase</p>
          </div>

          {/* Progress Steps */}
          <div className="flex mb-8 bg-white rounded-lg shadow-sm p-4">
            {[1, 2, 3].map((s) => (
              <React.Fragment key={s}>
                <div className="flex-1 flex items-center">
                  <div className={`flex items-center ${step >= s ? 'text-red-600' : 'text-gray-400'}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                      step >= s 
                        ? 'bg-red-600 text-white shadow-lg shadow-red-200' 
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {step > s ? <Check className="w-5 h-5" /> : s}
                    </div>
                    <div className="hidden sm:block ml-3">
                      <p className="text-sm font-medium">
                        {s === 1 ? 'Shipping' : s === 2 ? 'Payment' : 'Review'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {s === 1 ? 'Delivery address' : s === 2 ? 'Payment method' : 'Confirm order'}
                      </p>
                    </div>
                  </div>
                </div>
                {s < 3 && (
                  <div className="flex items-center px-4">
                    <ChevronRight className={`w-5 h-5 ${step > s ? 'text-red-600' : 'text-gray-300'}`} />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Main Content */}
            <div className="flex-1">
              {step === 1 && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                    <Truck className="w-6 h-6 mr-2 text-red-600" />
                    Shipping Information
                  </h2>
                  <form onSubmit={handleShippingSubmit}>
                    {/* Shipping form fields - same as before */}
                    <div className="space-y-4">
                      {/* Full Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Full Name <span className="text-red-600">*</span>
                        </label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <input
                            type="text"
                            value={shippingInfo.fullName}
                            onChange={(e) => setShippingInfo({...shippingInfo, fullName: e.target.value})}
                            className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                              errors.fullName ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="Juan Dela Cruz"
                          />
                        </div>
                        {errors.fullName && <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>}
                      </div>

                      {/* Email */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email Address <span className="text-red-600">*</span>
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <input
                            type="email"
                            value={shippingInfo.email}
                            onChange={(e) => setShippingInfo({...shippingInfo, email: e.target.value})}
                            className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                              errors.email ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="juan@example.com"
                          />
                        </div>
                        {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                      </div>

                      {/* Phone */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone Number <span className="text-red-600">*</span>
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <input
                            type="tel"
                            value={shippingInfo.phone}
                            onChange={(e) => setShippingInfo({...shippingInfo, phone: e.target.value})}
                            className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                              errors.phone ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="0917 123 4567"
                          />
                        </div>
                        {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                      </div>

                      {/* Address, Barangay, City, Province, ZIP Code fields continue... */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Street Address <span className="text-red-600">*</span>
                        </label>
                        <div className="relative">
                          <Home className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <input
                            type="text"
                            value={shippingInfo.address}
                            onChange={(e) => setShippingInfo({...shippingInfo, address: e.target.value})}
                            className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                              errors.address ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="123 Rizal St"
                          />
                        </div>
                        {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Barangay <span className="text-red-600">*</span>
                        </label>
                        <input
                          type="text"
                          value={shippingInfo.barangay}
                          onChange={(e) => setShippingInfo({...shippingInfo, barangay: e.target.value})}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                            errors.barangay ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Barangay San Lorenzo"
                        />
                        {errors.barangay && <p className="mt-1 text-sm text-red-600">{errors.barangay}</p>}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            City <span className="text-red-600">*</span>
                          </label>
                          <input
                            type="text"
                            value={shippingInfo.city}
                            onChange={(e) => setShippingInfo({...shippingInfo, city: e.target.value})}
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                              errors.city ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="Makati City"
                          />
                          {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city}</p>}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Province <span className="text-red-600">*</span>
                          </label>
                          <input
                            type="text"
                            value={shippingInfo.province}
                            onChange={(e) => setShippingInfo({...shippingInfo, province: e.target.value})}
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                              errors.province ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="Metro Manila"
                          />
                          {errors.province && <p className="mt-1 text-sm text-red-600">{errors.province}</p>}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          ZIP Code <span className="text-red-600">*</span>
                        </label>
                        <input
                          type="text"
                          value={shippingInfo.zipCode}
                          onChange={(e) => setShippingInfo({...shippingInfo, zipCode: e.target.value})}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                            errors.zipCode ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="1200"
                        />
                        {errors.zipCode && <p className="mt-1 text-sm text-red-600">{errors.zipCode}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Delivery Instructions (Optional)
                        </label>
                        <textarea
                          value={shippingInfo.deliveryInstructions}
                          onChange={(e) => setShippingInfo({...shippingInfo, deliveryInstructions: e.target.value})}
                          rows={3}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                          placeholder="e.g., Leave at gate, call upon arrival, etc."
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="mt-8 w-full px-6 py-4 bg-red-600 text-white rounded-xl hover:bg-red-700 transition font-semibold text-lg flex items-center justify-center group"
                    >
                      Continue to Payment
                      <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition" />
                    </button>
                  </form>
                </div>
              )}

              {step === 2 && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                    <CreditCard className="w-6 h-6 mr-2 text-red-600" />
                    Payment Method
                  </h2>
                  
                  <div className="space-y-4">
                    {/* Cash on Delivery */}
                    <label className={`flex items-start p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      paymentMethod === 'cod' 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}>
                      <input
                        type="radio"
                        name="payment"
                        value="cod"
                        checked={paymentMethod === 'cod'}
                        onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                        className="mt-1 mr-4 w-5 h-5 text-green-600"
                      />
                      <div className="flex items-center flex-1">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                          <DollarSign className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-lg">Cash on Delivery</p>
                          <p className="text-sm text-gray-500">Pay when you receive your items</p>
                          <div className="flex items-center mt-2 text-sm text-green-600">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            No additional fees
                          </div>
                        </div>
                      </div>
                    </label>

                    {/* GCash with View Details Button */}
                    <div className={`border-2 rounded-xl transition-all ${
                      paymentMethod === 'gcash' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200'
                    }`}>
                      <label className="flex items-start p-4 cursor-pointer">
                        <input
                          type="radio"
                          name="payment"
                          value="gcash"
                          checked={paymentMethod === 'gcash'}
                          onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                          className="mt-1 mr-4 w-5 h-5 text-blue-600"
                        />
                        <div className="flex items-center flex-1">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                            <Smartphone className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-lg">GCash</p>
                            <p className="text-sm text-gray-500">Pay via GCash and upload receipt</p>
                            <div className="flex items-center mt-2 text-sm text-blue-600">
                              <Shield className="w-4 h-4 mr-1" />
                              Secure payment
                            </div>
                          </div>
                        </div>
                      </label>
                      
                      {paymentMethod === 'gcash' && (
                        <div className="px-4 pb-4 pl-14">
                          <button
                            onClick={() => setShowPaymentModal(true)}
                            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                          >
                            <QrCode className="w-4 h-4" />
                            View GCash Payment Details
                          </button>
                        </div>
                      )}
                    </div>

                    {/* PayMaya with View Details Button */}
                    <div className={`border-2 rounded-xl transition-all ${
                      paymentMethod === 'paymaya' 
                        ? 'border-purple-500 bg-purple-50' 
                        : 'border-gray-200'
                    }`}>
                      <label className="flex items-start p-4 cursor-pointer">
                        <input
                          type="radio"
                          name="payment"
                          value="paymaya"
                          checked={paymentMethod === 'paymaya'}
                          onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                          className="mt-1 mr-4 w-5 h-5 text-purple-600"
                        />
                        <div className="flex items-center flex-1">
                          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                            <Wallet className="w-6 h-6 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-lg">PayMaya</p>
                            <p className="text-sm text-gray-500">Pay via PayMaya and upload receipt</p>
                            <div className="flex items-center mt-2 text-sm text-purple-600">
                              <Shield className="w-4 h-4 mr-1" />
                              Secure payment
                            </div>
                          </div>
                        </div>
                      </label>
                      
                      {paymentMethod === 'paymaya' && (
                        <div className="px-4 pb-4 pl-14">
                          <button
                            onClick={() => setShowPaymentModal(true)}
                            className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 font-medium"
                          >
                            <QrCode className="w-4 h-4" />
                            View PayMaya Payment Details
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Receipt Upload Section - Only for GCash/PayMaya */}
                    {paymentMethod !== 'cod' && (
                      <div className="mt-6 pt-6 border-t">
                        <h3 className="font-semibold text-gray-900 mb-4">Upload Payment Proof</h3>
                        
                        <div className="space-y-4">
                          {/* Agreement Checkbox */}
                          <div className="flex items-start gap-2">
                            <input
                              type="checkbox"
                              id="agreeToPay"
                              checked={agreedToPay}
                              onChange={(e) => setAgreedToPay(e.target.checked)}
                              className="mt-1 w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500"
                            />
                            <label htmlFor="agreeToPay" className="text-sm text-gray-700">
                              I confirm that I have read and understood the payment instructions and will upload a valid payment proof.
                            </label>
                          </div>
                          {errors.agreement && <p className="text-sm text-red-600">{errors.agreement}</p>}
                          
                          {/* Receipt Upload */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Screenshot of Payment Receipt <span className="text-red-600">*</span>
                            </label>
                            {!receiptPreview ? (
                              <div 
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-red-500 hover:bg-red-50 transition group"
                              >
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-red-100 transition">
                                  <Camera className="w-8 h-8 text-gray-400 group-hover:text-red-600" />
                                </div>
                                <p className="text-gray-700 font-medium mb-1">Click to upload receipt</p>
                                <p className="text-sm text-gray-500">PNG, JPG up to 5MB</p>
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
                                  className="w-full max-h-64 object-contain bg-gray-50 rounded-xl border-2 border-green-500 p-2"
                                />
                                <div className="absolute top-2 right-2 flex gap-2">
                                  {uploadStatus === 'success' && (
                                    <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm flex items-center">
                                      <Check className="w-4 h-4 mr-1" />
                                      Uploaded
                                    </div>
                                  )}
                                  <button
                                    onClick={removeReceipt}
                                    className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition shadow-lg"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                                {uploadProgress < 100 && uploadStatus === 'uploading' && (
                                  <div className="absolute bottom-2 left-2 right-2">
                                    <div className="bg-white rounded-full h-2 overflow-hidden">
                                      <div 
                                        className="bg-red-600 h-full transition-all duration-300"
                                        style={{ width: `${uploadProgress}%` }}
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                            {errors.receipt && <p className="mt-1 text-sm text-red-600">{errors.receipt}</p>}
                          </div>

                          {/* Reference Number */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Reference Number <span className="text-red-600">*</span>
                            </label>
                            <input
                              type="text"
                              value={referenceNumber}
                              onChange={(e) => setReferenceNumber(e.target.value)}
                              placeholder="e.g., 1234 5678 9012"
                              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                                errors.reference ? 'border-red-500' : 'border-gray-300'
                              }`}
                            />
                            {errors.reference && <p className="mt-1 text-sm text-red-600">{errors.reference}</p>}
                          </div>

                          {/* Sender Name */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Sender Name <span className="text-red-600">*</span>
                            </label>
                            <input
                              type="text"
                              value={senderName}
                              onChange={(e) => setSenderName(e.target.value)}
                              placeholder="Name on the transaction"
                              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                                errors.sender ? 'border-red-500' : 'border-gray-300'
                              }`}
                            />
                            {errors.sender && <p className="mt-1 text-sm text-red-600">{errors.sender}</p>}
                          </div>

                          {/* Payment Date */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Payment Date <span className="text-red-600">*</span>
                            </label>
                            <input
                              type="date"
                              value={paymentDate}
                              onChange={(e) => setPaymentDate(e.target.value)}
                              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                                errors.paymentDate ? 'border-red-500' : 'border-gray-300'
                              }`}
                            />
                            {errors.paymentDate && <p className="mt-1 text-sm text-red-600">{errors.paymentDate}</p>}
                          </div>

                          {/* Notes */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Additional Notes (Optional)
                            </label>
                            <textarea
                              value={paymentNotes}
                              onChange={(e) => setPaymentNotes(e.target.value)}
                              rows={3}
                              placeholder="Any additional information about your payment"
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 mt-8">
                    <button
                      onClick={() => setStep(1)}
                      className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition font-semibold flex items-center justify-center group"
                    >
                      <ChevronLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition" />
                      Back
                    </button>
                    <button
                      onClick={() => setStep(3)}
                      className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition font-semibold flex items-center justify-center group"
                    >
                      Review Order
                      <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition" />
                    </button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Review Your Order</h2>
                  
                  {/* Order Items */}
                  <div className="space-y-4 mb-6">
                    <h3 className="font-semibold text-gray-900">Items</h3>
                    {state.items.map((item) => (
                      <div key={item.id} className="flex gap-4 py-4 border-b last:border-0">
                        <img
                          src={item.imageUrl || 'https://via.placeholder.com/80'}
                          alt={item.name}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{item.name}</h4>
                          {item.selectedColor && (
                            <p className="text-sm text-gray-500">Color: {item.selectedColor}</p>
                          )}
                          <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                          <p className="text-sm text-gray-500">₱{item.price.toLocaleString()} each</p>
                        </div>
                        <p className="font-bold text-red-600 text-lg">
                          {formatCurrency(item.price * item.quantity)}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Shipping Info */}
                  <div className="bg-gray-50 p-4 rounded-xl mb-4">
                    <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                      <MapPin className="w-5 h-5 mr-2 text-red-600" />
                      Shipping Address
                    </h3>
                    <p className="text-gray-600">
                      {shippingInfo.fullName}<br />
                      {shippingInfo.address}, {shippingInfo.barangay}<br />
                      {shippingInfo.city}, {shippingInfo.province} {shippingInfo.zipCode}<br />
                      {shippingInfo.phone}<br />
                      {shippingInfo.email}
                    </p>
                    {shippingInfo.deliveryInstructions && (
                      <div className="mt-2 p-2 bg-white rounded-lg">
                        <p className="text-sm text-gray-500">📝 {shippingInfo.deliveryInstructions}</p>
                      </div>
                    )}
                  </div>

                  {/* Payment Info */}
                  <div className="bg-gray-50 p-4 rounded-xl mb-6">
                    <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                      <CreditCard className="w-5 h-5 mr-2 text-red-600" />
                      Payment Method
                    </h3>
                    <div className="flex items-center">
                      {paymentMethod === 'cod' && (
                        <>
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-2">
                            <DollarSign className="w-4 h-4 text-green-600" />
                          </div>
                          <span>Cash on Delivery</span>
                        </>
                      )}
                      {paymentMethod === 'gcash' && (
                        <>
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                            <Smartphone className="w-4 h-4 text-blue-600" />
                          </div>
                          <span>GCash</span>
                        </>
                      )}
                      {paymentMethod === 'paymaya' && (
                        <>
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-2">
                            <Wallet className="w-4 h-4 text-purple-600" />
                          </div>
                          <span>PayMaya</span>
                        </>
                      )}
                    </div>

                    {/* Payment Proof Summary */}
                    {paymentMethod !== 'cod' && receiptPreview && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Payment Proof Provided:</h4>
                        <div className="flex items-start gap-3">
                          <img 
                            src={receiptPreview} 
                            alt="Receipt" 
                            className="w-20 h-20 object-cover rounded-lg border-2 border-green-500"
                          />
                          <div className="text-sm">
                            <p><span className="text-gray-500">Reference:</span> {referenceNumber}</p>
                            <p><span className="text-gray-500">Sender:</span> {senderName}</p>
                            <p><span className="text-gray-500">Date:</span> {paymentDate}</p>
                            {paymentNotes && <p className="text-gray-500 mt-1">{paymentNotes}</p>}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Order Summary */}
                  <div className="border-t pt-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="font-medium">{formatCurrency(state.total)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Shipping</span>
                        <span className="text-green-600 font-medium">Free</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t text-lg">
                        <span className="font-bold">Total</span>
                        <span className="font-bold text-red-600">{formatCurrency(state.total)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Note */}
                  {paymentMethod !== 'cod' && (
                    <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                      <div className="flex items-start">
                        <AlertCircle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-yellow-800">Pending Verification</p>
                          <p className="text-xs text-yellow-700 mt-1">
                            Your order will be processed after admin verifies your payment proof. This usually takes 5-10 minutes.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 mt-8">
                    <button
                      onClick={() => setStep(2)}
                      className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition font-semibold flex items-center justify-center group"
                    >
                      <ChevronLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition" />
                      Back
                    </button>
                    <button
                      onClick={handlePlaceOrder}
                      disabled={loading}
                      className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition font-semibold disabled:opacity-50 flex items-center justify-center"
                    >
                      {loading ? (
                        <>
                          <Loader className="w-5 h-5 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        'Place Order'
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:w-80">
              <div className="bg-white rounded-xl shadow-sm p-6 sticky top-4">
                <h3 className="font-bold text-gray-900 mb-4">Order Summary</h3>
                
                <div className="flex items-center justify-between mb-4 text-sm text-gray-600">
                  <span>{state.items.length} items</span>
                  <button
                    onClick={() => navigate('/cart')}
                    className="text-red-600 hover:text-red-700 flex items-center"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </button>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span>{formatCurrency(state.total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span className="text-green-600">Free</span>
                  </div>
                </div>

                <div className="border-t pt-4 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total</span>
                    <span className="text-2xl font-bold text-red-600">
                      {formatCurrency(state.total)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">VAT included</p>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600 p-3 bg-gray-50 rounded-lg">
                  <Lock className="w-4 h-4 text-green-600" />
                  <span>Secure checkout</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Details Modal */}
      <PaymentDetailsModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        paymentMethod={paymentMethod === 'gcash' ? 'gcash' : 'paymaya'}
      />
    </>
  );
};

export default Checkout;