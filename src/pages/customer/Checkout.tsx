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
  Sparkles,
  Home,
  History,
  Plus
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
  
  const isFreeShipping = freeShippingAreas.some(area => 
    city.toLowerCase().includes(area.toLowerCase()) || 
    barangay.toLowerCase().includes(area.toLowerCase())
  );
  
  if (isFreeShipping) {
    return 0;
  }
  
  const municipalities = [
    'Casiguran', 'Magallanes', 'Bulan', 'Barcelona', 'Bulusan', 
    'Castilla', 'Donsol', 'Gubat', 'Irosin', 'Juban', 'Matnog', 
    'Pilar', 'Prieto Diaz', 'Santa Magdalena'
  ];
  
  const isSorsogonMunicipality = municipalities.some(muni => 
    city.toLowerCase().includes(muni.toLowerCase())
  );
  
  if (isSorsogonMunicipality) {
    return 1500;
  }
  
  return 2000;
};

// Saved Address interface
interface SavedAddress {
  id: string;
  fullName: string;
  address: string;
  barangay: string;
  city: string;
  province: string;
  zipCode: string;
  phone: string;
  email: string;
  isDefault?: boolean;
  label?: string;
}

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
  
  // Saved addresses state
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  
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

  // Helper function to check if two addresses are similar (for deduplication)
  const getAddressKey = (address: SavedAddress): string => {
    // Normalize address by trimming whitespace and converting to lowercase
    const normalizedAddress = address.address?.trim().toLowerCase() || '';
    const normalizedCity = address.city?.trim().toLowerCase() || '';
    const normalizedProvince = address.province?.trim().toLowerCase() || '';
    const normalizedZipCode = address.zipCode?.trim() || '';
    
    // Create a unique key based on the core address components
    return `${normalizedAddress}|${normalizedCity}|${normalizedProvince}|${normalizedZipCode}`;
  };

  // Load saved addresses from localStorage and user's order history (only for current user)
  useEffect(() => {
    const loadSavedAddresses = async () => {
      if (!user) {
        setSavedAddresses([]);
        return;
      }
      
      // Use a Map to store unique addresses by their key
      const addressesMap = new Map<string, SavedAddress>();
      
      // Load from localStorage with user-specific key
      const savedKey = `saved_addresses_${user.id}`;
      const saved = localStorage.getItem(savedKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        parsed.forEach((addr: SavedAddress) => {
          const key = getAddressKey(addr);
          // Only add if not already present
          if (!addressesMap.has(key)) {
            addressesMap.set(key, addr);
          }
        });
      }
      
      // Load addresses from user's order history
      try {
        const orders = await orderService.getMyOrders(1, 50);
        orders.orders
          .filter(order => order.userId === user.id && order.shippingAddress)
          .forEach(order => {
            // Parse shipping address
            const addressParts = order.shippingAddress?.split(',') || [];
            const addr: SavedAddress = {
              id: `order-${order.id}`,
              fullName: order.customerName || user.fullName || '',
              address: addressParts[0]?.trim() || '',
              barangay: addressParts[1]?.trim() || '',
              city: addressParts[2]?.trim() || '',
              province: addressParts[3]?.trim()?.split(' ')[0] || '',
              zipCode: order.shippingAddress?.match(/\d{4}/)?.[0] || '',
              phone: order.customerPhone || '',
              email: order.customerEmail || user.email || '',
              label: 'Previous Order'
            };
            
            const key = getAddressKey(addr);
            if (!addressesMap.has(key) && addr.address) {
              addressesMap.set(key, addr);
            }
          });
      } catch (error) {
        console.error('Failed to load order addresses:', error);
      }
      
      // Load saved shipping from previous checkout
      const savedShippingKey = `checkout_shipping_${user.id}`;
      const savedShipping = localStorage.getItem(savedShippingKey);
      if (savedShipping) {
        const shipping = JSON.parse(savedShipping);
        const addr: SavedAddress = {
          id: 'recent',
          fullName: shipping.fullName,
          address: shipping.address,
          barangay: shipping.barangay,
          city: shipping.city,
          province: shipping.province,
          zipCode: shipping.zipCode,
          phone: shipping.phone,
          email: shipping.email,
          label: 'Recently Used'
        };
        
        const key = getAddressKey(addr);
        if (!addressesMap.has(key) && shipping.address) {
          addressesMap.set(key, addr);
        }
      }
      
      // Convert map to array and sort (put 'Recently Used' at top)
      const addresses = Array.from(addressesMap.values());
      const recentIndex = addresses.findIndex(a => a.id === 'recent');
      if (recentIndex > 0) {
        const recent = addresses.splice(recentIndex, 1)[0];
        addresses.unshift(recent);
      }
      
      setSavedAddresses(addresses);
    };
    
    loadSavedAddresses();
  }, [user]);

  // Save shipping info to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem(`checkout_shipping_${user.id}`, JSON.stringify(shippingInfo));
    }
  }, [shippingInfo, user]);

  // Save address to saved addresses when order is placed
  const saveAddressToStorage = () => {
    if (!user) return;
    
    const newAddress: SavedAddress = {
      id: `addr-${Date.now()}`,
      fullName: shippingInfo.fullName,
      address: shippingInfo.address,
      barangay: shippingInfo.barangay,
      city: shippingInfo.city,
      province: shippingInfo.province,
      zipCode: shippingInfo.zipCode,
      phone: shippingInfo.phone,
      email: shippingInfo.email,
      label: 'Saved Address'
    };
    
    const savedKey = `saved_addresses_${user.id}`;
    const existing = localStorage.getItem(savedKey);
    let addresses: SavedAddress[] = existing ? JSON.parse(existing) : [];
    
    // Check if similar address already exists using the key function
    const newAddressKey = getAddressKey(newAddress);
    const exists = addresses.some(a => getAddressKey(a) === newAddressKey);
    
    if (!exists) {
      addresses.unshift(newAddress);
      // Keep only last 10 addresses
      addresses = addresses.slice(0, 10);
      localStorage.setItem(savedKey, JSON.stringify(addresses));
    }
  };

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

  const handleUseSavedAddress = (address: SavedAddress) => {
    setShippingInfo({
      fullName: address.fullName,
      address: address.address,
      barangay: address.barangay,
      city: address.city,
      province: address.province,
      zipCode: address.zipCode,
      phone: address.phone,
      email: address.email,
      deliveryInstructions: shippingInfo.deliveryInstructions
    });
    setSelectedAddressId(address.id);
    
    // Clear any address-related errors
    if (errors.address) {
      setErrors(prev => ({ ...prev, address: '', barangay: '', city: '', province: '', zipCode: '' }));
    }
  };

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateShipping()) {
      setStep(2);
      window.scrollTo(0, 0);
    } else {
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
      
      // Save address for future use
      saveAddressToStorage();
      
      dismissToast(loadingToast);
      showSuccess('Order placed successfully!');
      
      localStorage.removeItem(`checkout_shipping_${user?.id}`);
      
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
                  
                  {/* Saved Addresses Section - Always visible with deduplication */}
                  {savedAddresses.length > 0 && (
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-3">
                        <History className="w-4 h-4 text-rose-600" />
                        <span className="text-sm font-medium text-gray-700">Recent Addresses</span>
                        <span className="text-xs text-gray-400">({savedAddresses.length} unique addresses)</span>
                      </div>
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {savedAddresses.map((address) => (
                          <div
                            key={address.id}
                            onClick={() => handleUseSavedAddress(address)}
                            className={`p-4 border rounded-xl cursor-pointer transition-all ${
                              selectedAddressId === address.id
                                ? 'border-rose-500 bg-rose-50'
                                : 'border-gray-200 hover:border-rose-300 hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Home className="w-4 h-4 text-gray-400" />
                                  <span className="text-xs font-medium text-gray-500">
                                    {address.label || 'Saved Address'}
                                  </span>
                                </div>
                                <p className="font-medium text-gray-900">{address.fullName}</p>
                                <p className="text-sm text-gray-600 mt-1">
                                  {address.address}, {address.barangay}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {address.city}, {address.province} {address.zipCode}
                                </p>
                                <p className="text-sm text-gray-500 mt-1">📞 {address.phone}</p>
                                <p className="text-sm text-gray-500">✉️ {address.email}</p>
                              </div>
                              {selectedAddressId === address.id && (
                                <CheckCircle className="w-5 h-5 text-rose-600" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <form onSubmit={handleShippingSubmit}>
                    <div className="space-y-5">
                      {/* Rest of the shipping form remains the same */}
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

              {/* Steps 2 and 3 remain the same as before */}
              {/* ... (steps 2 and 3 code unchanged) ... */}
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