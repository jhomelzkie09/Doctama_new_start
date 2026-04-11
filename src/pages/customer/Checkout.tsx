import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import PhilippineAddressAutocomplete from '../../components/PhilippineAddressAutocomplete';
import qrCode from '../../qr/qr_gcash.png';
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
  Heart,
  Star,
  Gift,
  Sparkles
} from 'lucide-react';
import orderService from '../../services/order.service';
import uploadService from '../../services/upload.service';
import { PaymentMethod } from '../../types';
import { showError, showSuccess, showLoading, dismissToast } from '../../utils/toast';
import paymaya_logo from '../../assets/paymaya_logo.png';
import gcash_logo from '../../assets/gcash_logo.png';

// Shop payment details
const SHOP_PAYMENT_DETAILS = {
  gcash: {
    name: 'GCash',
    accountName: 'Doctama Marketing',
    accountNumber: '09123456789',
    qrCode: qrCode,
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
    qrCode: qrCode,
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

// Shipping fee calculation based on location
const calculateShippingFee = (city: string, barangay: string): number => {
  const freeShippingAreas = [
    'Sorsogon City',
    'Sorsogon',
    'Bacon',
    'Sorsogon City Capital'
  ];
  
  // Check if the location qualifies for free shipping
  const isFreeShipping = freeShippingAreas.some(area => 
    city.toLowerCase().includes(area.toLowerCase()) || 
    barangay.toLowerCase().includes(area.toLowerCase())
  );
  
  if (isFreeShipping) {
    return 0;
  }
  
  // Other municipalities in Sorsogon province
  const municipalities = [
    'Casiguran', 'Magallanes', 'Bulan', 'Barcelona', 'Bulusan', 
    'Castilla', 'Donsol', 'Gubat', 'Irosin', 'Juban', 'Matnog', 
    'Pilar', 'Prieto Diaz', 'Santa Magdalena'
  ];
  
  // Check if the location is in Sorsogon province but outside free areas
  const isSorsogonMunicipality = municipalities.some(muni => 
    city.toLowerCase().includes(muni.toLowerCase())
  );
  
  if (isSorsogonMunicipality) {
    return 1500; // ₱1,500 for other municipalities
  }
  
  // For locations outside Sorsogon province (e.g., Metro Manila, etc.)
  // This would require a more complex calculation based on distance
  // For now, set a base rate
  return 2000;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
              {paymentMethod === 'gcash' ? (
                <img 
                    src={gcash_logo} 
                    alt="GCash" 
                    className="h-6 w-auto object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
              ) : (
                <img 
                  src={paymaya_logo} 
                  alt="PayMaya" 
                  className="h-6 w-auto object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
            </div>
            <h2 className="text-xl font-bold text-gray-900">Pay with {details.name}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* QR Code */}
          <div className="text-center bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-100">
            <div className="bg-white p-4 rounded-xl shadow-lg inline-block">
              <img 
                src={details.qrCode} 
                alt={`${details.name} QR Code`} 
                className="w-48 h-48 mx-auto"
              />
            </div>
            <p className="text-xs text-gray-500 mt-3">Scan QR code to pay</p>
          </div>

          {/* Account Details */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-5 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-gray-200">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Account Name</p>
                <p className="font-semibold text-gray-900 text-lg">{details.accountName}</p>
              </div>
              <button
                onClick={() => copyToClipboard(details.accountName)}
                className="p-2 bg-white rounded-lg shadow-sm text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Account Number</p>
                <p className="font-mono font-bold text-xl text-gray-900">{details.accountNumber}</p>
              </div>
              <button
                onClick={() => copyToClipboard(details.accountNumber)}
                className="p-2 bg-white rounded-lg shadow-sm text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition"
              >
                {copied ? <CheckCheck className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Instructions */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                <Info className="w-3 h-3 text-blue-600" />
              </div>
              <span>How to Pay</span>
            </h3>
            <div className="space-y-3">
              {details.instructions.map((instruction, idx) => (
                <div key={idx} className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded-lg transition">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600 flex-shrink-0">
                    {idx + 1}
                  </div>
                  <span className="text-sm text-gray-700">{instruction}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Important Note */}
          <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-800">Important</p>
                <p className="text-xs text-amber-700 mt-1">
                  Please upload a clear screenshot of your payment confirmation. Orders without valid proof will be cancelled within 24 hours.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition shadow-lg shadow-blue-200"
          >
            I Understand, Proceed
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
  
  // Shipping fee state
  const [shippingFee, setShippingFee] = useState(0);
  
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

  // Calculate shipping fee when city or barangay changes
  useEffect(() => {
    if (shippingInfo.city || shippingInfo.barangay) {
      const fee = calculateShippingFee(shippingInfo.city, shippingInfo.barangay);
      setShippingFee(fee);
    }
  }, [shippingInfo.city, shippingInfo.barangay]);

  const getTotalWithShipping = () => {
    return state.total + shippingFee;
  };

  const validateShipping = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!shippingInfo.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!shippingInfo.address.trim()) newErrors.address = 'Street address is required';
    if (!shippingInfo.barangay.trim()) newErrors.barangay = 'Barangay is required';
    if (!shippingInfo.city.trim()) newErrors.city = 'City is required';
    if (!shippingInfo.province.trim()) newErrors.province = 'Province is required';
    if (!shippingInfo.zipCode.trim()) newErrors.zipCode = 'ZIP code is required';
    if (!shippingInfo.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!shippingInfo.email.trim()) newErrors.email = 'Email is required';
    
    const phoneRegex = /^(09|\+639)\d{9}$/;
    if (shippingInfo.phone && !phoneRegex.test(shippingInfo.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Enter a valid Philippine mobile number (e.g., 09171234567)';
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (shippingInfo.email && !emailRegex.test(shippingInfo.email)) {
      newErrors.email = 'Enter a valid email address';
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

  const isShippingValid = (): boolean => {
    return !!(
      shippingInfo.fullName.trim() &&
      shippingInfo.address.trim() &&
      shippingInfo.barangay.trim() &&
      shippingInfo.city.trim() &&
      shippingInfo.province.trim() &&
      shippingInfo.zipCode.trim() &&
      shippingInfo.phone.trim() &&
      shippingInfo.email.trim()
    );
  };

  const isPaymentValid = (): boolean => {
    if (paymentMethod === 'cod') {
      return true;
    }
    return !!(
      receiptFile &&
      referenceNumber.trim() &&
      senderName.trim() &&
      paymentDate &&
      agreedToPay
    );
  };

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateShipping()) {
      setStep(2);
      window.scrollTo(0, 0);
    } else {
      // Scroll to first error
      const firstError = document.querySelector('.border-rose-500');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  const handleAddressSelect = (address: string, components?: any) => {
    setShippingInfo(prev => ({
      ...prev,
      address: address,
      barangay: components?.barangay || prev.barangay,
      city: components?.city || prev.city,
      province: components?.province || prev.province,
      zipCode: components?.zipCode || prev.zipCode
    }));
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
      // Clear receipt error when file is uploaded
      if (errors.receipt) {
        setErrors({ ...errors, receipt: '' });
      }
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
    if (!validatePaymentDetails()) {
      // Scroll to payment section
      const paymentSection = document.querySelector('.border-t.border-gray-200');
      if (paymentSection) {
        paymentSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setLoading(true);
    setUploadProgress(0);
    setUploadStatus('uploading');

    const loadingToast = showLoading('Placing your order...');

    try {
      let receiptImageUrl = '';
      if (receiptFile && paymentMethod !== 'cod') {
        const uploadedUrls = await uploadService.uploadImages([receiptFile]);
        receiptImageUrl = uploadedUrls[0];
        setUploadProgress(100);
        setUploadStatus('success');
      }

      const orderData: any = {
        totalAmount: getTotalWithShipping(),
        shippingAddress: `${shippingInfo.address}, ${shippingInfo.barangay}, ${shippingInfo.city}, ${shippingInfo.province} ${shippingInfo.zipCode}`,
        paymentMethod: paymentMethod,
        paymentStatus: paymentMethod === 'cod' ? 'pending' : 'pending',
        customerName: shippingInfo.fullName,
        customerEmail: shippingInfo.email,
        customerPhone: shippingInfo.phone,
        items: state.items.map(item => ({
          productId: item.id,
          productName: item.name,
          quantity: item.quantity,
          unitPrice: item.price,
          imageUrl: item.imageUrl || ''
        })),
        shippingFee: shippingFee
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
      
      const order = await orderService.createOrder(orderData);
      
      dismissToast(loadingToast);
      showSuccess('Order placed successfully!');
      
      localStorage.removeItem('checkout_shipping');
      
      clearCart();
      navigate(`/account/orders/${order.id}?success=true`);
      
    } catch (error: any) {
      console.error('❌ Order failed:', error);
      dismissToast(loadingToast);
      showError(error.response?.data?.message || 'Failed to place order. Please try again.');
      setUploadStatus('error');
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-32 h-32 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <ShoppingBag className="w-16 h-16 text-rose-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
          <p className="text-gray-500 mb-8">Looks like you haven't added any items to your cart yet.</p>
          <button
            onClick={() => navigate('/shop')}
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-rose-600 to-rose-700 text-white rounded-xl hover:from-rose-700 hover:to-rose-800 transition shadow-lg shadow-rose-200"
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => navigate(-1)}
              className="group flex items-center text-gray-500 hover:text-rose-600 mb-4 transition"
            >
              <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition" />
              Back
            </button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
                <p className="text-gray-500 mt-1">Complete your purchase securely</p>
              </div>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="flex mb-8 bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
            {[1, 2, 3].map((s) => (
              <React.Fragment key={s}>
                <div className="flex-1 flex items-center">
                  <div className={`flex items-center ${step >= s ? 'text-rose-600' : 'text-gray-400'}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                      step >= s 
                        ? 'bg-rose-600 text-white shadow-lg shadow-rose-200' 
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {step > s ? <Check className="w-5 h-5" /> : s}
                    </div>
                    <div className="hidden sm:block ml-3">
                      <p className="text-sm font-medium">
                        {s === 1 ? 'Shipping' : s === 2 ? 'Payment' : 'Review'}
                      </p>
                      <p className="text-xs text-gray-400">
                        {s === 1 ? 'Delivery address' : s === 2 ? 'Payment method' : 'Confirm order'}
                      </p>
                    </div>
                  </div>
                </div>
                {s < 3 && (
                  <div className="flex items-center px-4">
                    <ChevronRight className={`w-5 h-5 ${step > s ? 'text-rose-600' : 'text-gray-300'}`} />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Main Content */}
            <div className="flex-1">
              {step === 1 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                    <div className="w-8 h-8 bg-rose-100 rounded-xl flex items-center justify-center mr-3">
                      <Truck className="w-4 h-4 text-rose-600" />
                    </div>
                    Shipping Information
                  </h2>
                  <form onSubmit={handleShippingSubmit}>
                    <div className="space-y-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Full Name <span className="text-rose-600">*</span>
                          </label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                              type="text"
                              value={shippingInfo.fullName}
                              onChange={(e) => setShippingInfo({...shippingInfo, fullName: e.target.value})}
                              className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent transition ${
                                errors.fullName ? 'border-rose-500 bg-rose-50' : 'border-gray-200'
                              }`}
                              placeholder="Juan Dela Cruz"
                            />
                          </div>
                          {errors.fullName && <p className="mt-1 text-sm text-rose-600">{errors.fullName}</p>}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email Address <span className="text-rose-600">*</span>
                          </label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                              type="email"
                              value={shippingInfo.email}
                              onChange={(e) => setShippingInfo({...shippingInfo, email: e.target.value})}
                              className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent transition ${
                                errors.email ? 'border-rose-500 bg-rose-50' : 'border-gray-200'
                              }`}
                              placeholder="juan@example.com"
                            />
                          </div>
                          {errors.email && <p className="mt-1 text-sm text-rose-600">{errors.email}</p>}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Phone Number <span className="text-rose-600">*</span>
                          </label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                              type="tel"
                              value={shippingInfo.phone}
                              onChange={(e) => setShippingInfo({...shippingInfo, phone: e.target.value})}
                              className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent transition ${
                                errors.phone ? 'border-rose-500 bg-rose-50' : 'border-gray-200'
                              }`}
                              placeholder="0917 123 4567"
                            />
                          </div>
                          {errors.phone && <p className="mt-1 text-sm text-rose-600">{errors.phone}</p>}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            ZIP Code <span className="text-rose-600">*</span>
                          </label>
                          <input
                            type="text"
                            value={shippingInfo.zipCode}
                            onChange={(e) => setShippingInfo({...shippingInfo, zipCode: e.target.value})}
                            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent transition ${
                              errors.zipCode ? 'border-rose-500 bg-rose-50' : 'border-gray-200'
                            }`}
                            placeholder="1200"
                          />
                          {errors.zipCode && <p className="mt-1 text-sm text-rose-600">{errors.zipCode}</p>}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Street Address <span className="text-rose-600">*</span>
                        </label>
                        <PhilippineAddressAutocomplete
                          value={shippingInfo.address}
                          onChange={handleAddressSelect}
                          placeholder="Start typing your address..."
                          error={errors.address}
                        />
                        <p className="text-xs text-gray-400 mt-1">Start typing to see address suggestions</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Barangay <span className="text-rose-600">*</span>
                          </label>
                          <input
                            type="text"
                            value={shippingInfo.barangay}
                            onChange={(e) => setShippingInfo({...shippingInfo, barangay: e.target.value})}
                            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent transition ${
                              errors.barangay ? 'border-rose-500 bg-rose-50' : 'border-gray-200'
                            }`}
                            placeholder="Barangay San Lorenzo"
                          />
                          {errors.barangay && <p className="mt-1 text-sm text-rose-600">{errors.barangay}</p>}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            City <span className="text-rose-600">*</span>
                          </label>
                          <input
                            type="text"
                            value={shippingInfo.city}
                            onChange={(e) => setShippingInfo({...shippingInfo, city: e.target.value})}
                            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent transition ${
                              errors.city ? 'border-rose-500 bg-rose-50' : 'border-gray-200'
                            }`}
                            placeholder="Makati City"
                          />
                          {errors.city && <p className="mt-1 text-sm text-rose-600">{errors.city}</p>}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Province <span className="text-rose-600">*</span>
                        </label>
                        <input
                          type="text"
                          value={shippingInfo.province}
                          onChange={(e) => setShippingInfo({...shippingInfo, province: e.target.value})}
                          className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent transition ${
                            errors.province ? 'border-rose-500 bg-rose-50' : 'border-gray-200'
                          }`}
                          placeholder="Metro Manila"
                        />
                        {errors.province && <p className="mt-1 text-sm text-rose-600">{errors.province}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Delivery Instructions (Optional)
                        </label>
                        <textarea
                          value={shippingInfo.deliveryInstructions}
                          onChange={(e) => setShippingInfo({...shippingInfo, deliveryInstructions: e.target.value})}
                          rows={3}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent transition"
                          placeholder="e.g., Leave at gate, call upon arrival, etc."
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="mt-8 w-full px-6 py-4 bg-gradient-to-r from-rose-600 to-rose-700 text-white rounded-xl hover:from-rose-700 hover:to-rose-800 transition font-semibold text-lg flex items-center justify-center group shadow-lg shadow-rose-200"
                    >
                      Continue to Payment
                      <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition" />
                    </button>
                  </form>
                </div>
              )}

              {step === 2 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                    <div className="w-8 h-8 bg-rose-100 rounded-xl flex items-center justify-center mr-3">
                      <CreditCard className="w-4 h-4 text-rose-600" />
                    </div>
                    Payment Method
                  </h2>
                  
                  <div className="space-y-4">
                    {/* Cash on Delivery */}
                    <label className={`flex items-start p-5 border-2 rounded-xl cursor-pointer transition-all ${
                      paymentMethod === 'cod' 
                        ? 'border-green-500 bg-green-50 shadow-md' 
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
                        <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mr-4">
                          <DollarSign className="w-7 h-7 text-green-600" />
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

                    {/* GCash */}
                    <div className={`border-2 rounded-xl transition-all ${
                      paymentMethod === 'gcash' 
                        ? 'border-blue-500 bg-blue-50 shadow-md' 
                        : 'border-gray-200'
                    }`}>
                      <label className="flex items-start p-5 cursor-pointer">
                        <input
                          type="radio"
                          name="payment"
                          value="gcash"
                          checked={paymentMethod === 'gcash'}
                          onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                          className="mt-1 mr-4 w-5 h-5 text-blue-600"
                        />
                        <div className="flex items-center flex-1">
                          <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mr-4">
                            <img 
                                src={gcash_logo} 
                                alt="GCash" 
                                className="h-auto w-auto object-contain"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                            />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-lg">GCash</span>
                            </div>
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

                    {/* PayMaya */}
                    <div className={`border-2 rounded-xl transition-all ${
                        paymentMethod === 'paymaya' 
                          ? 'border-purple-500 bg-purple-50 shadow-md' 
                          : 'border-gray-200'
                      }`}>
                      <label className="flex items-start p-5 cursor-pointer">
                        <input
                          type="radio"
                          name="payment"
                          value="paymaya"
                          checked={paymentMethod === 'paymaya'}
                          onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                          className="mt-1 mr-4 w-5 h-5 text-purple-600"
                        />
                        <div className="flex items-center flex-1">
                          <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mr-4">
                            <img 
                                src={paymaya_logo} 
                                alt="PayMaya" 
                                className="h-auto w-auto object-contain"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-lg">PayMaya</span>
                            </div>
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

                    {/* Receipt Upload Section */}
                    {paymentMethod !== 'cod' && (
                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <Receipt className="w-5 h-5 text-rose-600" />
                          Upload Payment Proof
                        </h3>
                        
                        <div className="space-y-5">
                          {/* Agreement Checkbox */}
                          <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                            <input
                              type="checkbox"
                              id="agreeToPay"
                              checked={agreedToPay}
                              onChange={(e) => setAgreedToPay(e.target.checked)}
                              className="mt-1 w-5 h-5 text-rose-600 rounded border-gray-300 focus:ring-rose-500"
                            />
                            <label htmlFor="agreeToPay" className="text-sm text-gray-700">
                              I confirm that I have read and understood the payment instructions and will upload a valid payment proof.
                            </label>
                          </div>
                          {errors.agreement && <p className="text-sm text-rose-600">{errors.agreement}</p>}
                          
                          {/* Receipt Upload */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Screenshot of Payment Receipt <span className="text-rose-600">*</span>
                            </label>
                            {!receiptPreview ? (
                              <div 
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-rose-500 hover:bg-rose-50 transition group"
                              >
                                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-rose-100 transition">
                                  <Camera className="w-10 h-10 text-gray-400 group-hover:text-rose-600" />
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
                                    <div className="bg-white rounded-full h-2 overflow-hidden shadow">
                                      <div 
                                        className="bg-rose-600 h-full transition-all duration-300"
                                        style={{ width: `${uploadProgress}%` }}
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                            {errors.receipt && <p className="mt-1 text-sm text-rose-600">{errors.receipt}</p>}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Reference Number <span className="text-rose-600">*</span>
                              </label>
                              <input
                                type="text"
                                value={referenceNumber}
                                onChange={(e) => setReferenceNumber(e.target.value)}
                                placeholder="e.g., 1234 5678 9012"
                                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent transition ${
                                  errors.reference ? 'border-rose-500 bg-rose-50' : 'border-gray-200'
                                }`}
                              />
                              {errors.reference && <p className="mt-1 text-sm text-rose-600">{errors.reference}</p>}
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Sender Name <span className="text-rose-600">*</span>
                              </label>
                              <input
                                type="text"
                                value={senderName}
                                onChange={(e) => setSenderName(e.target.value)}
                                placeholder="Name on the transaction"
                                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent transition ${
                                  errors.sender ? 'border-rose-500 bg-rose-50' : 'border-gray-200'
                                }`}
                              />
                              {errors.sender && <p className="mt-1 text-sm text-rose-600">{errors.sender}</p>}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Payment Date <span className="text-rose-600">*</span>
                              </label>
                              <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                  type="date"
                                  value={paymentDate}
                                  onChange={(e) => setPaymentDate(e.target.value)}
                                  className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent transition ${
                                    errors.paymentDate ? 'border-rose-500 bg-rose-50' : 'border-gray-200'
                                  }`}
                                />
                              </div>
                              {errors.paymentDate && <p className="mt-1 text-sm text-rose-600">{errors.paymentDate}</p>}
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Additional Notes (Optional)
                              </label>
                              <textarea
                                value={paymentNotes}
                                onChange={(e) => setPaymentNotes(e.target.value)}
                                rows={1}
                                placeholder="Any additional information"
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent transition"
                              />
                            </div>
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
                      disabled={!isPaymentValid()}
                      className={`flex-1 px-6 py-3 rounded-xl font-semibold flex items-center justify-center group transition ${
                        isPaymentValid()
                          ? 'bg-gradient-to-r from-rose-600 to-rose-700 text-white hover:from-rose-700 hover:to-rose-800 shadow-lg shadow-rose-200'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      Review Order
                      <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition" />
                    </button>
                  </div>
                  
                  {/* Validation Summary for Payment */}
                  {!isPaymentValid() && paymentMethod !== 'cod' && (
                    <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-200">
                      <p className="text-xs text-amber-700 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        Please complete all required payment details before proceeding
                      </p>
                    </div>
                  )}
                </div>
              )}

              {step === 3 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Review Your Order</h2>
                  
                  {/* Order Items */}
                  <div className="space-y-4 mb-6">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <Package className="w-5 h-5 text-rose-600" />
                      Order Items ({state.items.length})
                    </h3>
                    {state.items.map((item) => (
                      <div key={item.id} className="flex gap-4 py-4 border-b last:border-0 hover:bg-gray-50 rounded-xl p-3 transition">
                        <img
                          src={item.imageUrl || 'https://via.placeholder.com/80'}
                          alt={item.name}
                          className="w-20 h-20 object-cover rounded-xl shadow-sm"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{item.name}</h4>
                          {item.selectedColor && (
                            <p className="text-sm text-gray-500 mt-1">Color: {item.selectedColor}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2">
                            <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                            <p className="text-sm text-gray-500">₱{item.price.toLocaleString()} each</p>
                          </div>
                        </div>
                        <p className="font-bold text-rose-600 text-lg">
                          {formatCurrency(item.price * item.quantity)}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Shipping Info */}
                  <div className="bg-gradient-to-r from-gray-50 to-white p-5 rounded-xl mb-4 border border-gray-100">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-rose-600" />
                      Shipping Address
                    </h3>
                    <div className="space-y-1 text-gray-600">
                      <p className="font-medium">{shippingInfo.fullName}</p>
                      <p>{shippingInfo.address}, {shippingInfo.barangay}</p>
                      <p>{shippingInfo.city}, {shippingInfo.province} {shippingInfo.zipCode}</p>
                      <p className="text-sm">📞 {shippingInfo.phone}</p>
                      <p className="text-sm">✉️ {shippingInfo.email}</p>
                    </div>
                    {shippingInfo.deliveryInstructions && (
                      <div className="mt-3 p-3 bg-white rounded-lg border border-gray-100">
                        <p className="text-sm text-gray-500">📝 {shippingInfo.deliveryInstructions}</p>
                      </div>
                    )}
                  </div>

                  {/* Payment Info */}
                  <div className="bg-gradient-to-r from-gray-50 to-white p-5 rounded-xl mb-6 border border-gray-100">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-rose-600" />
                      Payment Method
                    </h3>
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        paymentMethod === 'cod' ? 'bg-green-100' : 
                        paymentMethod === 'gcash' ? 'bg-blue-100' : 'bg-purple-100'
                      }`}>
                        {paymentMethod === 'cod' && <DollarSign className="w-6 h-6 text-green-600" />}
                        {paymentMethod === 'gcash' && (
                          <img 
                            src={gcash_logo} 
                            alt="GCash" 
                            className="w-8 h-8 object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                              const parent = (e.target as HTMLImageElement).parentElement;
                              if (parent) {
                                const fallback = document.createElement('div');
                                fallback.className = 'w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center';
                                fallback.innerHTML = '<span class="text-white text-xs font-bold">G</span>';
                                parent.appendChild(fallback);
                              }
                            }}
                          />
                        )}
                        {paymentMethod === 'paymaya' && (
                          <img 
                            src={paymaya_logo} 
                            alt="PayMaya" 
                            className="w-8 h-8 object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                              const parent = (e.target as HTMLImageElement).parentElement;
                              if (parent) {
                                const fallback = document.createElement('div');
                                fallback.className = 'w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center';
                                fallback.innerHTML = '<span class="text-white text-xs font-bold">P</span>';
                                parent.appendChild(fallback);
                              }
                            }}
                          />
                        )}
                      </div>
                      <span className="font-medium text-gray-900">
                        {paymentMethod === 'cod' ? 'Cash on Delivery' : 
                        paymentMethod === 'gcash' ? 'GCash' : 'PayMaya'}
                      </span>
                    </div>

                    {/* Payment Proof Summary */}
                    {paymentMethod !== 'cod' && receiptPreview && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Payment Proof Provided:</h4>
                        <div className="flex items-start gap-3">
                          <img 
                            src={receiptPreview} 
                            alt="Receipt" 
                            className="w-20 h-20 object-cover rounded-xl border-2 border-green-500 shadow-sm"
                          />
                          <div className="text-sm space-y-1">
                            <p><span className="text-gray-500">Reference:</span> <span className="font-mono">{referenceNumber}</span></p>
                            <p><span className="text-gray-500">Sender:</span> {senderName}</p>
                            <p><span className="text-gray-500">Date:</span> {new Date(paymentDate).toLocaleDateString()}</p>
                            {paymentNotes && <p className="text-gray-500 mt-1">{paymentNotes}</p>}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Order Summary with Shipping Fee */}
                  <div className="border-t pt-4">
                    <div className="space-y-2">
                      <div className="flex justify-between py-2">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="font-medium">{formatCurrency(state.total)}</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-gray-600">Shipping Fee</span>
                        {shippingFee === 0 ? (
                          <span className="text-green-600 font-medium">Free</span>
                        ) : (
                          <span className="font-medium">{formatCurrency(shippingFee)}</span>
                        )}
                      </div>
                      <div className="flex justify-between py-3 border-t text-lg">
                        <span className="font-bold">Total</span>
                        <span className="font-bold text-rose-600 text-2xl">{formatCurrency(getTotalWithShipping())}</span>
                      </div>
                    </div>
                  </div>

                  {/* Shipping Fee Note */}
                  {shippingFee > 0 && (
                    <div className="mt-3 text-xs text-gray-500 text-center">
                      <p>Shipping fee applied based on your location</p>
                    </div>
                  )}

                  {/* Status Note */}
                  {paymentMethod !== 'cod' && (
                    <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-amber-800">Pending Verification</p>
                          <p className="text-xs text-amber-700 mt-1">
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
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-rose-600 to-rose-700 text-white rounded-xl hover:from-rose-700 hover:to-rose-800 transition font-semibold disabled:opacity-50 flex items-center justify-center shadow-lg shadow-rose-200"
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
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900 text-lg">Order Summary</h3>
                  <button
                    onClick={() => navigate('/cart')}
                    className="text-rose-600 hover:text-rose-700 text-sm flex items-center gap-1"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                </div>
                
                <div className="flex items-center justify-between mb-4 text-sm text-gray-500 bg-gray-50 p-3 rounded-xl">
                  <span>{state.items.length} {state.items.length === 1 ? 'item' : 'items'}</span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Subtotal</span>
                    <span>{formatCurrency(state.total)}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Shipping</span>
                    {shippingFee === 0 ? (
                      <span className="text-green-600">Free</span>
                    ) : (
                      <span>{formatCurrency(shippingFee)}</span>
                    )}
                  </div>
                  <div className="flex justify-between py-2 border-t border-b">
                    <span className="font-semibold">Total</span>
                    <span className="font-bold text-rose-600">{formatCurrency(getTotalWithShipping())}</span>
                  </div>
                </div>

                <div className="pt-2">
                  <p className="text-xs text-gray-400">VAT included</p>
                  {shippingFee > 0 && (
                    <p className="text-xs text-gray-400 mt-1">Shipping fee calculated based on location</p>
                  )}
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-500 p-3 bg-green-50 rounded-xl mt-4">
                  <Lock className="w-4 h-4 text-green-600" />
                  <span className="text-green-700">Secure checkout</span>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-xs text-gray-400 justify-center">
                    <Shield className="w-3 h-3" />
                    <span>Protected by SSL Encryption</span>
                  </div>
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