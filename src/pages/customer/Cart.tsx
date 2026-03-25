import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Minus, 
  Plus, 
  Trash2, 
  ShoppingBag, 
  ArrowLeft,
  ChevronRight,
  Truck,
  Shield,
  Clock,
  CreditCard,
  AlertCircle,
  Tag,
  Heart,
  X,
  Check,
  Percent,
  Gift,
  Package,
  Loader,
  Palette
} from 'lucide-react';
import { useCart } from '../../contexts/CartContext';

// Extended CartItem interface to include selected color
interface CartItemWithColor {
  id: number;
  name: string;
  description: string;
  price: number;
  quantity: number;
  imageUrl: string;
  selectedColor?: string;
  [key: string]: any;
}

const Cart = () => {
  const { state, updateQuantity, removeItem } = useCart();
  const navigate = useNavigate();
  
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError, setPromoError] = useState('');
  const [savedForLater, setSavedForLater] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  // Mock promo codes
  const validPromos = {
    'WELCOME10': 10,
    'FURNITURE20': 20,
    'FREESHIP': 0
  };

  const handleApplyPromo = () => {
    if (!promoCode.trim()) {
      setPromoError('Please enter a promo code');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const discount = validPromos[promoCode.toUpperCase() as keyof typeof validPromos];
      if (discount !== undefined) {
        setPromoApplied(true);
        setPromoError('');
      } else {
        setPromoError('Invalid promo code');
        setPromoApplied(false);
      }
      setLoading(false);
    }, 500);
  };

  const handleSaveForLater = (productId: number) => {
    setSavedForLater(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const calculateSubtotal = () => {
    return state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const calculateDiscount = () => {
    if (!promoApplied) return 0;
    const subtotal = calculateSubtotal();
    const discountPercent = validPromos[promoCode.toUpperCase() as keyof typeof validPromos] || 0;
    return (subtotal * discountPercent) / 100;
  };

  const calculateTotal = () => {
    return calculateSubtotal() - calculateDiscount();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  // Helper function to get color display name
  const getColorDisplayName = (color: string) => {
    const colorNames: Record<string, string> = {
      'red': 'Red',
      'blue': 'Blue',
      'green': 'Green',
      'yellow': 'Yellow',
      'black': 'Black',
      'white': 'White',
      'gray': 'Gray',
      'brown': 'Brown',
      'beige': 'Beige',
      'navy': 'Navy Blue',
      'teal': 'Teal',
      'maroon': 'Maroon',
      'purple': 'Purple',
      'pink': 'Pink',
      'orange': 'Orange'
    };
    return colorNames[color.toLowerCase()] || color;
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
            className="inline-flex items-center px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition font-semibold group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition" />
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header with breadcrumb */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <button onClick={() => navigate('/')} className="hover:text-red-600">Home</button>
            <ChevronRight className="w-4 h-4" />
            <button onClick={() => navigate('/shop')} className="hover:text-red-600">Shop</button>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900">Cart</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
          <p className="text-gray-600 mt-1">{state.items.length} item{state.items.length !== 1 ? 's' : ''}</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Cart Items */}
          <div className="flex-1">
            <div className="bg-white rounded-xl shadow-sm divide-y">
              {state.items.map((item) => (
                <div key={item.id} className="p-6 hover:bg-gray-50 transition group">
                  <div className="flex gap-6">
                    {/* Product Image */}
                    <div className="relative">
                      <img
                        src={item.imageUrl || 'https://via.placeholder.com/100'}
                        alt={item.name}
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                      {item.quantity > 1 && (
                        <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold">
                          {item.quantity}
                        </span>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="flex-1">
                      <div className="flex justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900 hover:text-red-600 transition">
                            <Link to={`/products/${item.id}`}>{item.name}</Link>
                          </h3>
                          <p className="text-sm text-gray-500 mt-1 line-clamp-1">{item.description}</p>
                          
                          {/* Display selected color if available */}
                          {(item as CartItemWithColor).selectedColor && (
                            <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                              <Palette className="w-3 h-3" />
                              <span>Color: </span>
                              <div className="flex items-center gap-1">
                                <div 
                                  className="w-3 h-3 rounded-full border border-gray-300"
                                  style={{ backgroundColor: (item as CartItemWithColor).selectedColor?.toLowerCase() }}
                                />
                                <span className="font-medium text-gray-700">
                                  {getColorDisplayName((item as CartItemWithColor).selectedColor!)}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                        <p className="font-bold text-red-600 text-lg">
                          {formatCurrency(item.price * item.quantity)}
                        </p>
                      </div>

                      {/* Price per unit */}
                      <p className="text-sm text-gray-500 mb-3">
                        ₱{item.price.toLocaleString()} each
                      </p>

                      {/* Quantity Controls */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            className="p-2 hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-12 text-center font-medium">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-2 hover:bg-gray-100 transition"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Save for Later */}
                          <button
                            onClick={() => handleSaveForLater(item.id)}
                            className={`p-2 rounded-lg transition ${
                              savedForLater.includes(item.id)
                                ? 'text-red-600 bg-red-50'
                                : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                            }`}
                            title={savedForLater.includes(item.id) ? 'Remove from saved' : 'Save for later'}
                          >
                            <Heart className={`w-5 h-5 ${savedForLater.includes(item.id) ? 'fill-current' : ''}`} />
                          </button>

                          {/* Remove */}
                          <button
                            onClick={() => removeItem(item.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Remove item"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Continue Shopping Link */}
            <div className="mt-6">
              <button
                onClick={() => navigate('/shop')}
                className="text-red-600 hover:text-red-700 font-medium inline-flex items-center group"
              >
                <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition" />
                Continue Shopping
              </button>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:w-96">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>

              {/* Promo Code */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Promo Code
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="Enter code"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    disabled={promoApplied}
                  />
                  <button
                    onClick={promoApplied ? () => {
                      setPromoApplied(false);
                      setPromoCode('');
                    } : handleApplyPromo}
                    disabled={loading}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      promoApplied
                        ? 'bg-green-500 text-white hover:bg-green-600'
                        : 'bg-red-600 text-white hover:bg-red-700'
                    } disabled:opacity-50`}
                  >
                    {loading ? (
                      <Loader className="w-5 h-5 animate-spin" />
                    ) : promoApplied ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      'Apply'
                    )}
                  </button>
                </div>
                {promoError && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {promoError}
                  </p>
                )}
                {promoApplied && (
                  <p className="mt-1 text-sm text-green-600 flex items-center">
                    <Check className="w-4 h-4 mr-1" />
                    Promo applied successfully!
                  </p>
                )}

                {/* Sample promo codes */}
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full flex items-center">
                    <Tag className="w-3 h-3 mr-1" />
                    WELCOME10
                  </span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full flex items-center">
                    <Tag className="w-3 h-3 mr-1" />
                    FURNITURE20
                  </span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full flex items-center">
                    <Gift className="w-3 h-3 mr-1" />
                    FREESHIP
                  </span>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatCurrency(calculateSubtotal())}</span>
                </div>
                
                {promoApplied && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(calculateDiscount())}</span>
                  </div>
                )}
                
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className="text-green-600 font-medium">Free</span>
                </div>

                {/* Estimated delivery */}
                <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                  <Clock className="w-4 h-4" />
                  <span>Estimated delivery: 3-5 business days</span>
                </div>

                <div className="border-t pt-3 flex justify-between font-bold text-gray-900 text-lg">
                  <span>Total</span>
                  <span className="text-red-600">{formatCurrency(calculateTotal())}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={() => navigate('/checkout')}
                className="w-full py-4 bg-red-600 text-white rounded-xl hover:bg-red-700 transition font-semibold text-lg flex items-center justify-center group mb-3"
              >
                Proceed to Checkout
                <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition" />
              </button>

              {/* Payment Methods */}
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-3">We accept:</p>
                <div className="flex justify-center gap-3">
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <CreditCard className="w-4 h-4" />
                    <span>Visa</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <CreditCard className="w-4 h-4" />
                    <span>Mastercard</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <CreditCard className="w-4 h-4" />
                    <span>GCash</span>
                  </div>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="mt-6 pt-6 border-t">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Truck className="w-4 h-4 text-red-600" />
                    <span>Free Shipping</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Shield className="w-4 h-4 text-red-600" />
                    <span>Secure Payment</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4 text-red-600" />
                    <span>30 Day Returns</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Package className="w-4 h-4 text-red-600" />
                    <span>2 Year Warranty</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* You Might Also Like Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">You Might Also Like</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="bg-white rounded-lg p-4 hover:shadow-md transition cursor-pointer">
                <div className="h-32 bg-gray-100 rounded-lg mb-3"></div>
                <h3 className="font-medium text-sm mb-1">Modern Side Table</h3>
                <p className="text-red-600 font-bold text-sm">₱3,999</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;