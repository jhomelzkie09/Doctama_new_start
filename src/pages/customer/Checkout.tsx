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
  Sparkles,
  Home,
  History,
  Clock as ClockIcon
} from 'lucide-react';
import orderService from '../../services/order.service';
import uploadService from '../../services/upload.service';
import cartService from '../../services/cart.service';
import { PaymentMethod } from '../../types';
import { showError, showSuccess, showLoading, dismissToast } from '../../utils/toast';
import paymaya_logo from '../../assets/paymaya_logo.png';
import gcash_logo from '../../assets/gcash_logo.png';

// Shop payment details
const SHOP_PAYMENT_DETAILS = {
  gcash: {
    name: 'GCash',
    accountName: 'Doctama Marketing',
    accountNumber: '09917093996',
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
    accountNumber: '09917093996',
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
                  You can complete the payment and upload the receipt later from your account. Orders without payment verification will remain pending.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition shadow-lg shadow-blue-200"
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
  const [agreedToInstructions, setAgreedToInstructions] = useState(false);
  
  // Receipt Upload - NOW OPTIONAL for digital payments
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
    const normalizedAddress = address.address?.trim().toLowerCase() || '';
    const normalizedCity = address.city?.trim().toLowerCase() || '';
    const normalizedProvince = address.province?.trim().toLowerCase() || '';
    const normalizedZipCode = address.zipCode?.trim() || '';
    
    return `${normalizedAddress}|${normalizedCity}|${normalizedProvince}|${normalizedZipCode}`;
  };

  // Load saved addresses from localStorage and user's order history (only for current user)
  useEffect(() => {
    const loadSavedAddresses = async () => {
      if (!user) {
        setSavedAddresses([]);
        return;
      }
      
      const addressesMap = new Map<string, SavedAddress>();
      
      // Load from localStorage with user-specific key
      const savedKey = `saved_addresses_${user.id}`;
      const saved = localStorage.getItem(savedKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        parsed.forEach((addr: SavedAddress) => {
          const key = getAddressKey(addr);
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
    
    const newAddressKey = getAddressKey(newAddress);
    const exists = addresses.some(a => getAddressKey(a) === newAddressKey);
    
    if (!exists) {
      addresses.unshift(newAddress);
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

  const validatePaymentStep = (): boolean => {
    if (paymentMethod === 'cod') {
      return true;
    }
    // For digital payments, only require agreement to instructions
    return agreedToInstructions;
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
    // Digital payments are valid if user agreed to instructions
    return agreedToInstructions;
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

    setReceiptFile(file);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setReceiptPreview(reader.result as string);
      if (errors.receipt) {
        setErrors({ ...errors, receipt: '' });
      }
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

  const handlePlaceOrder = async () => {
    console.log('=== CHECKOUT: Placing order ===');
    console.log('Cart items:', state.items.map(item => ({
      name: item.name,
      selectedColor: item.selectedColor,
      colorType: typeof item.selectedColor
    })));
    
    setLoading(true);

    const loadingToast = showLoading('Placing your order...');

    try {
      let receiptImageUrl = '';
      // Upload receipt if provided (optional)
      if (receiptFile && paymentMethod !== 'cod') {
        const uploadedUrls = await uploadService.uploadImages([receiptFile]);
        receiptImageUrl = uploadedUrls[0];
      }

      const orderData: any = {
        totalAmount: getTotalWithShipping(),
        shippingAddress: `${shippingInfo.address}, ${shippingInfo.barangay}, ${shippingInfo.city}, ${shippingInfo.province} ${shippingInfo.zipCode}`,
        paymentMethod: paymentMethod,
        paymentStatus: 'pending', // All digital payments start as pending
        customerName: shippingInfo.fullName,
        customerEmail: shippingInfo.email,
        customerPhone: shippingInfo.phone,
        items: state.items.map(item => {
          const orderItem: any = {
            productId: item.id,
            productName: item.name,
            quantity: item.quantity,
            unitPrice: item.price,
            imageUrl: item.imageUrl || ''
          };
    
          if (item.selectedColor && item.selectedColor.trim() !== '') {
            orderItem.color = item.selectedColor;
          }
          
          return orderItem;
        }),
        shippingFee: shippingFee
      };

      if (shippingInfo.deliveryInstructions) {
        orderData.notes = shippingInfo.deliveryInstructions;
      }

      // Include payment proof if provided
      if (paymentMethod !== 'cod' && receiptImageUrl) {
        orderData.paymentProofImage = receiptImageUrl;
        orderData.paymentProofReference = referenceNumber;
        orderData.paymentProofSender = senderName;
        orderData.paymentProofDate = paymentDate;
        orderData.paymentProofNotes = paymentNotes;
      }
      
      const order = await orderService.createOrder(orderData);
      
      // Clear backend cart after successful order
      await cartService.clearCart().catch(err => console.error('Failed to clear backend cart:', err));
      
      // Save address for future use
      saveAddressToStorage();
      
      dismissToast(loadingToast);
      
      if (paymentMethod !== 'cod' && !receiptImageUrl) {
        showSuccess('Order placed! Please upload your payment receipt from your account page.');
      } else {
        showSuccess('Order placed successfully!');
      }
      
      localStorage.removeItem(`checkout_shipping_${user?.id}`);
      
      clearCart(); // Clear local cart
      navigate(`/account/orders/${order.id}?success=true`);
      
    } catch (error: any) {
      console.error('❌ Order failed:', error);
      dismissToast(loadingToast);
      
      let errorMessage = 'Failed to place order. ';
      if (error.response?.data?.message) {
        errorMessage += error.response.data.message;
      } else if (error.message) {
        errorMessage += error.message;
      } else {
        errorMessage += 'Please try again.';
      }
      
      showError(errorMessage);
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
                  
                  {/* Saved Addresses Section */}
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

              {/* Step 2 - Payment Method */}
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
                            <p className="text-sm text-gray-500">Pay via GCash (receipt can be uploaded later)</p>
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
                            <p className="text-sm text-gray-500">Pay via PayMaya (receipt can be uploaded later)</p>
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

                    {/* Payment Instructions Agreement */}
                    {paymentMethod !== 'cod' && (
                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200 mb-4">
                          <div className="flex gap-3">
                            <ClockIcon className="w-5 h-5 text-blue-600 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-blue-800">Pay Later Option</p>
                              <p className="text-xs text-blue-700 mt-1">
                                You can complete the payment after placing your order. The order will be on hold until payment is verified.
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                          <input
                            type="checkbox"
                            id="agreeToInstructions"
                            checked={agreedToInstructions}
                            onChange={(e) => setAgreedToInstructions(e.target.checked)}
                            className="mt-1 w-5 h-5 text-rose-600 rounded border-gray-300 focus:ring-rose-500"
                          />
                          <label htmlFor="agreeToInstructions" className="text-sm text-gray-700">
                            I understand that I need to pay the exact amount and upload the receipt from my account page. The order will be processed after payment verification.
                          </label>
                        </div>
                        
                        {/* Optional Receipt Upload */}
                        <div className="mt-4">
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-gray-700">
                              Upload Receipt (Optional)
                            </label>
                            <span className="text-xs text-gray-400">You can also upload later</span>
                          </div>
                          
                          {!receiptPreview ? (
                            <div 
                              onClick={() => fileInputRef.current?.click()}
                              className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-rose-500 hover:bg-rose-50 transition group"
                            >
                              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-rose-100 transition">
                                <Camera className="w-6 h-6 text-gray-400 group-hover:text-rose-600" />
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

                        {/* Optional Reference Fields - only show if receipt is uploaded */}
                        {receiptPreview && (
                          <div className="mt-4 space-y-3">
                            <div>
                              <input
                                type="text"
                                value={referenceNumber}
                                onChange={(e) => setReferenceNumber(e.target.value)}
                                placeholder="Reference Number (Optional)"
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-500"
                              />
                            </div>
                            <div>
                              <input
                                type="text"
                                value={senderName}
                                onChange={(e) => setSenderName(e.target.value)}
                                placeholder="Sender Name (Optional)"
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-500"
                              />
                            </div>
                          </div>
                        )}
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
                        Please confirm that you understand the payment instructions
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Step 3 - Review Order */}
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
                          />
                        )}
                        {paymentMethod === 'paymaya' && (
                          <img 
                            src={paymaya_logo} 
                            alt="PayMaya" 
                            className="w-8 h-8 object-contain"
                          />
                        )}
                      </div>
                      <span className="font-medium text-gray-900">
                        {paymentMethod === 'cod' ? 'Cash on Delivery' : 
                        paymentMethod === 'gcash' ? 'GCash' : 'PayMaya'}
                      </span>
                      {paymentMethod !== 'cod' && !receiptPreview && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                          Receipt to be uploaded later
                        </span>
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
                            className="w-20 h-20 object-cover rounded-xl border-2 border-green-500 shadow-sm"
                          />
                          <div className="text-sm space-y-1">
                            {referenceNumber && <p><span className="text-gray-500">Reference:</span> <span className="font-mono">{referenceNumber}</span></p>}
                            {senderName && <p><span className="text-gray-500">Sender:</span> {senderName}</p>}
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

                  {/* Status Note */}
                  {paymentMethod !== 'cod' && (
                    <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-amber-800">Pending Payment Verification</p>
                          <p className="text-xs text-amber-700 mt-1">
                            {receiptPreview 
                              ? 'Your order will be processed after admin verifies your payment proof. This usually takes 5-10 minutes.'
                              : 'Please upload your payment receipt from your account page. Your order will be processed after verification.'}
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