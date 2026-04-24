import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useOutletContext } from 'react-router-dom';
import { 
  ShoppingCart, Heart, Share2, Check, Truck, Shield, RotateCcw,
  Star, Minus, Plus, ArrowLeft, X, ChevronLeft, ChevronRight,
  ZoomIn, Package, CheckCircle, AlertCircle, Facebook, Twitter, Mail, Link2,
  Ruler, Maximize
} from 'lucide-react';
import productService from '../../services/product.service';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { Product } from '../../types';
import ProductReviews from '../../components/ProductReviews';
import reviewService from '../../services/review.service';

interface ProductDetailProps {
  isModal?: boolean;
  onClose?: () => void;
}

interface OutletContextType {
  onAuthRequired?: (mode: 'login' | 'register') => void;
}

const ProductDetail: React.FC<ProductDetailProps> = ({ isModal = false, onClose }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { user } = useAuth();
  
  const outletContext = useOutletContext<OutletContextType>();
  const onAuthRequired = outletContext?.onAuthRequired;
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState('');
  const [addedToCart, setAddedToCart] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showZoom, setShowZoom] = useState(false);
  const [activeTab, setActiveTab] = useState<'description' | 'reviews'>('description');
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [reviewStats, setReviewStats] = useState({
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: [0, 0, 0, 0, 0]
  });

  useEffect(() => {
    loadProduct();
  }, [id]);

  useEffect(() => {
    if (product) {
      loadRelatedProducts();
    }
  }, [product]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (isModal && e.key === 'Escape' && onClose) onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isModal, onClose]);

  const loadProduct = async () => {
    try {
      const data = await productService.getProductById(Number(id));
      setProduct(data);
      if (data?.colorsVariant?.length) {
        setSelectedColor(data.colorsVariant[0]);
      }
      
      // Load review stats
      try {
        const stats = await reviewService.getReviewStats(Number(id));
        setReviewStats(stats);
      } catch (error) {
        // Keep default stats if review loading fails
        console.warn('Failed to load review stats:', error);
      }
    } catch (error) {
      // Silent fail - error handled by UI
    } finally {
      setLoading(false);
    }
  };

  const loadRelatedProducts = async () => {
    try {
      const allProducts = await productService.getProducts();
      const related = allProducts
        .filter(p => p.categoryId === product?.categoryId && p.id !== product?.id)
        .slice(0, 4);
      setRelatedProducts(related);
    } catch (error) {
      // Silent fail - no related products shown
    }
  };

  const getAllImages = (): string[] => {
    if (!product) return [];
    const images = [product.imageUrl];
    if (product.images) {
      images.push(...product.images.map(img => typeof img === 'string' ? img : img.imageUrl));
    }
    return images.filter(Boolean);
  };

  const handleAddToCart = () => {
    if (!user) {
      if (onAuthRequired) {
        onAuthRequired('login');
      } else {
        navigate('/login', { state: { from: `/products/${id}` } });
      }
      return;
    }

    if (!product) return;
    for (let i = 0; i < quantity; i++) {
      addItem(product);
    }
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const text = `Check out ${product?.name} at Doctama!`;
    switch (platform) {
      case 'facebook': 
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`); 
        break;
      case 'twitter': 
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`); 
        break;
      case 'email': 
        window.location.href = `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(url)}`; 
        break;
      case 'copy': 
        navigator.clipboard.writeText(url); 
        alert('Link copied to clipboard!');
        break;
    }
    setShowShareMenu(false);
  };

  const renderStars = (rating: number = 4.5) => {
    const fullStars = Math.floor(rating);
    return (
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className={`w-4 h-4 ${i < fullStars ? 'text-yellow-400 fill-current' : 'text-gray-200'}`} />
        ))}
        <span className="ml-2 text-sm font-bold text-gray-900">{rating}</span>
      </div>
    );
  };

  if (loading) return (
    <div className={`flex items-center justify-center ${isModal ? 'h-96' : 'min-h-screen'}`}>
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
    </div>
  );

  if (!product) return (
    <div className={`flex items-center justify-center ${isModal ? 'h-96' : 'min-h-screen'}`}>
      <div className="text-center">
        <AlertCircle className="w-16 h-16 text-gray-200 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h2>
        <button onClick={() => isModal && onClose ? onClose() : navigate('/shop')} className="bg-red-600 text-white px-8 py-3 rounded-xl font-bold">Back to Shop</button>
      </div>
    </div>
  );

  const images = getAllImages();
  
  const mainContent = (
    <>
      {/* Left: Image Gallery */}
	      <div className="lg:w-3/5 space-y-4">
	        <div className="relative group rounded-2xl overflow-hidden bg-gray-50 border border-gray-100">
	          <div className="aspect-[4/3] flex items-center justify-center p-6">
	            <img src={images[selectedImage]} alt={product.name} className="max-w-full max-h-full object-contain mix-blend-multiply" />
	          </div>
	          <button onClick={() => setShowZoom(true)} className="absolute top-4 right-4 p-2.5 bg-white/80 backdrop-blur-md rounded-full shadow-sm hover:bg-white transition opacity-0 group-hover:opacity-100">
	            <ZoomIn className="w-4 h-4 text-gray-700" />
	          </button>
          {images.length > 1 && (
            <>
	              <button onClick={() => setSelectedImage(prev => Math.max(0, prev - 1))} className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 bg-white/80 backdrop-blur-md rounded-full shadow-sm hover:bg-white transition opacity-0 group-hover:opacity-100">
	                <ChevronLeft className="w-5 h-5" />
	              </button>
	              <button onClick={() => setSelectedImage(prev => Math.min(images.length - 1, prev + 1))} className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-white/80 backdrop-blur-md rounded-full shadow-sm hover:bg-white transition opacity-0 group-hover:opacity-100">
	                <ChevronRight className="w-5 h-5" />
	              </button>
            </>
          )}
        </div>
	        <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
	          {images.map((img, index) => (
	            <button key={index} onClick={() => setSelectedImage(index)} className={`relative min-w-[88px] h-20 rounded-xl overflow-hidden border-2 transition-all ${selectedImage === index ? 'border-red-600 bg-white' : 'border-transparent bg-gray-50'}`}>
	              <img src={img} alt="" className="w-full h-full object-cover p-2" />
	            </button>
	          ))}
	        </div>
      </div>

      {/* Right: Product Info */}
      <div className="lg:w-2/5 flex flex-col">
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-red-600 mb-3">
            <Package className="w-4 h-4" /> Premium Collection
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-3 leading-tight">{product.name}</h1>
          <div className="flex items-center justify-between py-3 border-y border-gray-100">
            {renderStars(reviewStats.averageRating || 4.5)}
            <span className="text-sm font-medium text-gray-400">{reviewStats.totalReviews} Verified Reviews</span>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-baseline gap-3 mb-2">
            <span className="text-4xl md:text-5xl font-black text-red-600">₱{product.price.toLocaleString()}</span>
            {product.price > 10000 && <span className="text-lg text-gray-300 line-through">₱{(product.price * 1.2).toLocaleString()}</span>}
          </div>
          <div className="inline-flex items-center px-3 py-1 bg-green-50 text-green-700 rounded-full text-[10px] font-bold uppercase tracking-wider">
            <CheckCircle className="w-3 h-3 mr-1" /> {product.stockQuantity > 0 ? 'Ready to ship' : 'Out of Stock'}
          </div>
        </div>

        <p className="text-gray-500 leading-relaxed mb-6 text-sm">{product.description}</p>

        {product.colorsVariant && product.colorsVariant.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">Color: <span className="text-red-600">{selectedColor}</span></h3>
            <div className="flex gap-3">
              {product.colorsVariant.map((color) => (
                <button key={color} onClick={() => setSelectedColor(color)} className={`w-9 h-9 rounded-full border-4 transition-all ${selectedColor === color ? 'border-red-600 scale-110 shadow-lg shadow-red-100' : 'border-white shadow-sm hover:border-gray-200'}`} style={{ backgroundColor: color.toLowerCase() }} />
              ))}
            </div>
          </div>
        )}

        <div className="space-y-5 mb-8">
          <div className="flex items-center gap-4">
            <div className="flex items-center bg-gray-100 rounded-xl p-1">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-2.5 hover:bg-white rounded-lg transition shadow-none hover:shadow-sm"><Minus className="w-4 h-4" /></button>
              <span className="w-10 text-center font-bold text-base">{quantity}</span>
              <button onClick={() => setQuantity(Math.min(product.stockQuantity, quantity + 1))} className="p-2.5 hover:bg-white rounded-lg transition shadow-none hover:shadow-sm"><Plus className="w-4 h-4" /></button>
            </div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-tighter">{product.stockQuantity} items left</div>
          </div>

          <div className="flex gap-3">
            <button 
              onClick={handleAddToCart} 
              disabled={product.stockQuantity === 0} 
              className={`flex-1 py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all ${
                addedToCart 
                  ? 'bg-green-600 text-white' 
                  : 'bg-red-600 text-white hover:bg-red-700 shadow-xl shadow-red-100 active:scale-95'
              }`}
            >
              {addedToCart ? (
                <><Check className="w-6 h-6" /> Added to Cart</>
              ) : (
                <><ShoppingCart className="w-6 h-6" /> Add to Cart</>
              )}
            </button>
            <div className="relative">
              <button onClick={() => setShowShareMenu(!showShareMenu)} className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition">
                <Share2 className="w-6 h-6 text-gray-400" />
              </button>
              {showShareMenu && (
                <div className="absolute right-0 bottom-full mb-4 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 z-20 min-w-[180px] animate-in slide-in-from-bottom-2">
                  {[
                    { id: 'facebook', icon: Facebook, color: 'text-blue-600' },
                    { id: 'twitter', icon: Twitter, color: 'text-sky-500' },
                    { id: 'email', icon: Mail, color: 'text-gray-600' },
                    { id: 'copy', icon: Link2, color: 'text-gray-600' }
                  ].map(plat => (
                    <button key={plat.id} onClick={() => handleShare(plat.id)} className="flex items-center gap-3 w-full px-4 py-3 hover:bg-red-50 rounded-xl text-sm font-bold capitalize">
                      <plat.icon className={`w-4 h-4 ${plat.color}`} /> {plat.id}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 border-t border-gray-100 pt-6">
          {[
            { icon: Truck, label: 'Fast Shipping', sub: '3-5 Days' },
            { icon: Shield, label: 'Warranty', sub: '24 Months' },
            { icon: RotateCcw, label: 'Returns', sub: '30 Days' }
          ].map((item, i) => (
            <div key={i} className="text-center">
              <item.icon className="w-5 h-5 text-red-600 mx-auto mb-2" />
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-900">{item.label}</p>
              <p className="text-[10px] text-gray-400">{item.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );

  return (
    <div className={`min-h-screen ${isModal ? 'bg-transparent' : 'bg-white'}`}>
      {isModal ? (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
          <div className="bg-white rounded-[28px] max-w-7xl w-full max-h-[90vh] overflow-y-auto relative shadow-2xl" onClick={e => e.stopPropagation()}>
            <button onClick={onClose} className="absolute top-6 right-6 z-30 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition">
              <X className="w-6 h-6"/>
            </button>
            <div className="p-8 flex flex-col lg:flex-row gap-10">{mainContent}</div>
          </div>
        </div>
      ) : (
        <div className="container mx-auto px-4 py-8">
          <button onClick={() => navigate(-1)} className="flex items-center text-sm font-black uppercase tracking-widest text-gray-400 hover:text-red-600 mb-10 transition">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Collection
          </button>
          <div className="flex flex-col lg:flex-row gap-10 mb-16">{mainContent}</div>
          
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-10 border-b border-gray-100 mb-8 overflow-x-auto no-scrollbar">
              {['description', 'reviews'].map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab as any)} className={`pb-6 text-sm font-black uppercase tracking-widest transition-all relative whitespace-nowrap ${activeTab === tab ? 'text-red-600' : 'text-gray-300 hover:text-gray-600'}`}>
                  {tab} {tab === 'reviews' && `(${reviewStats.totalReviews})`}
                  {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-1 bg-red-600 rounded-full" />}
                </button>
              ))}
            </div>

            <div className="min-h-[320px]">
              {activeTab === 'description' && (
                <div className="space-y-6">
                  {/* Product Description */}
                  <div className="prose max-w-none text-gray-500 leading-relaxed">
                    <h3 className="text-xl font-black text-gray-900 mb-4">Product Description</h3>
                    <p>{product.description}</p>
                  </div>

                  {/* Dimensions Section - Length, Width, Height only */}
                  <div className="bg-gray-50 rounded-2xl p-6">
                    <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
                      <Ruler className="w-6 h-6 text-red-600" />
                      Product Dimensions
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Length */}
                      <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                        <Maximize className="w-6 h-6 text-red-600 mx-auto mb-2" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Length</p>
                        <p className="text-lg font-black text-gray-900">
                          {product.length || product.length || 75} cm
                        </p>
                      </div>
                      
                      {/* Width */}
                      <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                        <Ruler className="w-6 h-6 text-red-600 mx-auto mb-2" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Width</p>
                        <p className="text-lg font-black text-gray-900">
                          {product.width || 80} cm
                        </p>
                      </div>
                      
                      {/* Height */}
                      <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                        <Maximize className="w-6 h-6 text-red-600 mx-auto mb-2 rotate-90" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Height</p>
                        <p className="text-lg font-black text-gray-900">
                          {product.height || 85} cm
                        </p>
                      </div>
                    </div>
                    
                    {/* Measurement note */}
                    <div className="mt-6 p-4 bg-white rounded-xl border border-gray-100">
                      <p className="text-xs text-gray-500 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                        <span>Measurements are approximate and may vary slightly. Please allow 1-3 cm difference due to manual measurement.</span>
                      </p>
                    </div>
                  </div>

                  {/* Features List */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    {['Sustainably Sourced Materials', 'Premium Quality Craftsmanship', 'Ergonomic Design', 'Durable Construction'].map(feat => (
                      <div key={feat} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <div className="bg-red-600 p-1 rounded-full"><Check className="text-white w-3 h-3" /></div>
                        <span className="font-bold text-gray-900">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'reviews' && (
                <ProductReviews productId={product.id} productName={product.name} />
              )}
            </div>
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <div className="mt-20">
              <h2 className="text-2xl font-black text-gray-900 mb-8">You May Also Like</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {relatedProducts.map(p => (
                  <Link to={`/products/${p.id}`} key={p.id} className="group">
                    <div className="aspect-square bg-gray-50 rounded-2xl overflow-hidden mb-4 border border-transparent group-hover:border-red-100 group-hover:bg-white transition-all duration-500">
                      <img src={p.imageUrl} alt="" className="w-full h-full object-contain p-5 group-hover:scale-105 transition duration-700" />
                    </div>
                    <h3 className="font-bold text-gray-900 group-hover:text-red-600 transition truncate">{p.name}</h3>
                    <p className="text-red-600 font-black">₱{p.price.toLocaleString()}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Fullscreen Zoom */}
      {showZoom && (
        <div className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in duration-300" onClick={() => setShowZoom(false)}>
          <button className="absolute top-10 right-10 text-white hover:rotate-90 transition-transform">
            <X className="w-10 h-10"/>
          </button>
          <img src={images[selectedImage]} alt="" className="max-w-full max-h-full object-contain" />
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
