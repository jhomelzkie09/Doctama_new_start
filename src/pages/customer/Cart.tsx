import React, { useState, useEffect } from 'react';
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
  Check,
  Gift,
  Package,
  Loader,
  Palette,
  Edit2,
  X,
  Star
} from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { useOutletContext } from 'react-router-dom';
import productService from '../../services/product.service';
import { Product } from '../../types';

interface OutletContextType {
  onAuthRequired?: (mode: 'login' | 'register') => void;
}

// Edit Modal Component
const EditCartItemModal = ({ 
  item, 
  isOpen, 
  onClose, 
  onUpdate 
}: { 
  item: any; 
  isOpen: boolean; 
  onClose: () => void; 
  onUpdate: (uniqueId: string, quantity: number, color: string) => void;
}) => {
  const [quantity, setQuantity] = useState(item?.quantity || 1);
  const [selectedColor, setSelectedColor] = useState(item?.selectedColor || '');
  const [updating, setUpdating] = useState(false);

  React.useEffect(() => {
    if (item) {
      setQuantity(item.quantity);
      setSelectedColor(item.selectedColor || '');
    }
  }, [item]);

  const handleUpdate = () => {
    setUpdating(true);
    onUpdate(item.uniqueId, quantity, selectedColor);
    setTimeout(() => {
      setUpdating(false);
      onClose();
    }, 500);
  };

  const renderStars = () => (
    <div className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star key={i} className={`w-4 h-4 ${i < 4 ? 'text-yellow-400 fill-current' : 'text-gray-200'}`} />
      ))}
    </div>
  );

  if (!isOpen || !item) return null;

  const productColors = item.colorsVariant || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Edit Item</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-1/3">
              <div className="aspect-square bg-gray-50 rounded-2xl overflow-hidden border border-gray-100">
                <img 
                  src={item.imageUrl || 'https://via.placeholder.com/400'} 
                  alt={item.name} 
                  className="w-full h-full object-contain p-4"
                />
              </div>
            </div>
            
            <div className="flex-1 space-y-5">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{item.name}</h3>
                <div className="flex items-center gap-2 mt-2">
                  {renderStars()}
                  <span className="text-sm text-gray-500">(24 reviews)</span>
                </div>
              </div>
              
              <div>
                <span className="text-2xl font-bold text-red-600">₱{item.price.toLocaleString()}</span>
                <p className="text-sm text-gray-500 mt-1">Price per item</p>
              </div>
              
              {productColors && productColors.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Color: <span className="text-red-600 font-semibold">{selectedColor}</span>
                  </label>
                  <div className="flex gap-3">
                    {productColors.map((color: string) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`w-10 h-10 rounded-full border-2 transition-all ${
                          selectedColor === color 
                            ? 'border-red-500 ring-2 ring-red-200 scale-110' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        style={{ backgroundColor: color.toLowerCase() }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                <div className="flex items-center gap-3">
                  <div className="flex items-center bg-gray-100 rounded-xl">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-2 px-3 hover:bg-gray-200 rounded-l-xl transition"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-12 text-center font-medium">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="p-2 px-3 hover:bg-gray-200 rounded-r-xl transition"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="border-t border-gray-100 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Updated Total:</span>
                  <span className="text-2xl font-bold text-red-600">
                    ₱{(item.price * quantity).toLocaleString()}
                  </span>
                </div>
              </div>
              
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleUpdate}
                  disabled={updating}
                  className="flex-1 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all active:scale-95 disabled:opacity-50"
                >
                  {updating ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader className="w-5 h-5 animate-spin" />
                      Updating...
                    </div>
                  ) : (
                    <>
                      <Check className="w-5 h-5 inline mr-2" />
                      Update Item
                    </>
                  )}
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Cart = () => {
  const { state, updateQuantity, removeItem, addItem } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const outletContext = useOutletContext<OutletContextType>();
  const onAuthRequired = outletContext?.onAuthRequired;
  
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError, setPromoError] = useState('');
  const [savedForLater, setSavedForLater] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(true);
  
  // Edit Modal State
  const [editingItem, setEditingItem] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Mock promo codes
  const validPromos = {
    'WELCOME10': 10,
    'FURNITURE20': 20,
    'FREESHIP': 0
  };

  useEffect(() => {
    loadRecommendedProducts();
  }, []);

  const loadRecommendedProducts = async () => {
    setLoadingRecommendations(true);
    try {
      const allProducts = await productService.getProducts();
      // Get products not in cart
      const cartProductIds = state.items.map(item => item.id);
      const filtered = allProducts.filter(p => !cartProductIds.includes(p.id)).slice(0, 4);
      setRecommendedProducts(filtered);
    } catch (error) {
      console.error('Failed to load recommended products:', error);
    } finally {
      setLoadingRecommendations(false);
    }
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

  const handleSaveForLater = (uniqueId: string) => {
    setSavedForLater(prev => 
      prev.includes(uniqueId) 
        ? prev.filter(id => id !== uniqueId)
        : [...prev, uniqueId]
    );
  };

  const handleEditItem = (item: any) => {
    setEditingItem(item);
    setShowEditModal(true);
  };

  const handleUpdateItem = (uniqueId: string, newQuantity: number, newColor: string) => {
    // First, remove the old item
    removeItem(uniqueId);
    
    // Then add the updated item
    const product: Product = {
      id: editingItem.id,
      name: editingItem.name,
      description: editingItem.description,
      price: editingItem.price,
      imageUrl: editingItem.imageUrl,
      categoryId: editingItem.categoryId,
      stockQuantity: editingItem.stockQuantity,
      isActive: editingItem.isActive,
      createdAt: editingItem.createdAt,
      height: editingItem.height,
      width: editingItem.width,
      length: editingItem.length,
      colorsVariant: editingItem.colorsVariant,
    };
    
    // Add the updated item with new quantity and color
    for (let i = 0; i < newQuantity; i++) {
      addItem(product, newColor);
    }
  };

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      if (onAuthRequired) {
        onAuthRequired('login');
      }
      return;
    }
    
    // Add to cart with default options
    addItem(product);
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

  const renderStars = (rating: number = 4) => (
    <div className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star key={i} className={`w-3 h-3 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-200'}`} />
      ))}
    </div>
  );

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
    <>
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
                  <div key={item.uniqueId} className="p-6 hover:bg-gray-50 transition group">
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
                            
                            {item.selectedColor && (
                              <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                                <Palette className="w-3 h-3" />
                                <span>Color: </span>
                                <div className="flex items-center gap-1">
                                  <div 
                                    className="w-3 h-3 rounded-full border border-gray-300"
                                    style={{ backgroundColor: item.selectedColor.toLowerCase() }}
                                  />
                                  <span className="font-medium text-gray-700">
                                    {getColorDisplayName(item.selectedColor)}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                          <p className="font-bold text-red-600 text-lg">
                            {formatCurrency(item.price * item.quantity)}
                          </p>
                        </div>

                        <p className="text-sm text-gray-500 mb-3">
                          ₱{item.price.toLocaleString()} each
                        </p>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                              <button
                                onClick={() => updateQuantity(item.uniqueId, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                                className="p-2 hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="w-12 text-center font-medium">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.uniqueId, item.quantity + 1)}
                                className="p-2 hover:bg-gray-100 transition"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                            
                            <button
                              onClick={() => handleEditItem(item)}
                              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              title="Edit Item"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleSaveForLater(item.uniqueId)}
                              className={`p-2 rounded-lg transition ${
                                savedForLater.includes(item.uniqueId)
                                  ? 'text-red-600 bg-red-50'
                                  : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                              }`}
                              title={savedForLater.includes(item.uniqueId) ? 'Remove from saved' : 'Save for later'}
                            >
                              <Heart className={`w-5 h-5 ${savedForLater.includes(item.uniqueId) ? 'fill-current' : ''}`} />
                            </button>

                            <button
                              onClick={() => removeItem(item.uniqueId)}
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

                  <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                    <Clock className="w-4 h-4" />
                    <span>Estimated delivery: 3-5 business days</span>
                  </div>

                  <div className="border-t pt-3 flex justify-between font-bold text-gray-900 text-lg">
                    <span>Total</span>
                    <span className="text-red-600">{formatCurrency(calculateTotal())}</span>
                  </div>
                </div>

                <button
                  onClick={() => navigate('/checkout')}
                  className="w-full py-4 bg-red-600 text-white rounded-xl hover:bg-red-700 transition font-semibold text-lg flex items-center justify-center group mb-3"
                >
                  Proceed to Checkout
                  <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition" />
                </button>

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

          {/* You Might Also Like Section - With Real Products */}
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">You Might Also Like</h2>
            {loadingRecommendations ? (
              <div className="flex justify-center py-12">
                <Loader className="w-8 h-8 animate-spin text-red-600" />
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {recommendedProducts.map((product) => (
                  <Link
                    key={product.id}
                    to={`/products/${product.id}`}
                    className="group bg-white rounded-xl p-4 hover:shadow-lg transition-all duration-300 border border-gray-100"
                  >
                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-3">
                      <img
                        src={product.imageUrl || 'https://via.placeholder.com/400'}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                    </div>
                    <h3 className="font-medium text-gray-900 text-sm mb-1 line-clamp-1 group-hover:text-red-600 transition">
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-1 mb-2">
                      {renderStars(4)}
                      <span className="text-xs text-gray-400">(24)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-red-600 font-bold text-sm">₱{product.price.toLocaleString()}</p>
                      <button
                        onClick={(e) => handleAddToCart(e, product)}
                        className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition"
                      >
                        <ShoppingBag className="w-4 h-4" />
                      </button>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            {recommendedProducts.length === 0 && !loadingRecommendations && (
              <div className="text-center py-12 bg-white rounded-xl">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No recommendations available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Item Modal */}
      <EditCartItemModal
        item={editingItem}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onUpdate={handleUpdateItem}
      />
    </>
  );
};

export default Cart;