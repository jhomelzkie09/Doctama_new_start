import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useOutletContext } from 'react-router-dom';
import { 
  ShoppingCart, Heart, Share2, Check, Truck, Shield, RotateCcw,
  Star, Minus, Plus, ArrowLeft, X, ChevronLeft, ChevronRight,
  ZoomIn, Package, CheckCircle, AlertCircle, Facebook, Twitter, Mail, Link2
} from 'lucide-react';
import productService from '../../services/product.service';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { Product } from '../../types';
import ProductReviews from '../../components/ProductReviews';

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
  
  // Get onAuthRequired from outlet context
  const outletContext = useOutletContext<OutletContextType>();
  const onAuthRequired = outletContext?.onAuthRequired;
  
  // States
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState('');
  const [addedToCart, setAddedToCart] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showZoom, setShowZoom] = useState(false);
  const [activeTab, setActiveTab] = useState<'description' | 'specs' | 'reviews'>('description');
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [wishlist, setWishlist] = useState<number[]>([]);

  useEffect(() => {
    loadProduct();
  }, [id]);

  useEffect(() => {
    if (product) {
      loadRelatedProducts();
    }
  }, [product]);

  // Close modal on Escape key
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
    } catch (error) {
      console.error('Failed to load product:', error);
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
      console.error('Failed to load related products:', error);
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

  // Handle Add to Cart with Auth Check
  const handleAddToCart = () => {
    // If user is not logged in, open the auth sidebar
    if (!user) {
      if (onAuthRequired) {
        onAuthRequired('login');
      } else {
        console.warn('onAuthRequired not available, falling back to navigation');
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

  // Handle Wishlist with Auth Check
  const handleToggleWishlist = () => {
    // If user is not logged in, open the auth sidebar
    if (!user) {
      if (onAuthRequired) {
        onAuthRequired('login');
      } else {
        console.warn('onAuthRequired not available, falling back to navigation');
        navigate('/login', { state: { from: `/products/${id}` } });
      }
      return;
    }

    if (!product) return;
    setWishlist(prev => 
      prev.includes(product.id) 
        ? prev.filter(pid => pid !== product.id) 
        : [...prev, product.id]
    );
  };

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const text = `Check out ${product?.name} at Doctama!`;
    switch (platform) {
      case 'facebook': window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`); break;
      case 'twitter': window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`); break;
      case 'email': window.location.href = `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(url)}`; break;
      case 'copy': navigator.clipboard.writeText(url); alert('Link copied to clipboard!'); break;
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
        <div className="relative group rounded-[32px] overflow-hidden bg-gray-50 border border-gray-100">
          <div className="aspect-[4/3] flex items-center justify-center p-8">
            <img src={images[selectedImage]} alt={product.name} className="max-w-full max-h-full object-contain mix-blend-multiply" />
          </div>
          <button onClick={() => setShowZoom(true)} className="absolute top-6 right-6 p-3 bg-white/80 backdrop-blur-md rounded-full shadow-sm hover:bg-white transition opacity-0 group-hover:opacity-100">
            <ZoomIn className="w-5 h-5 text-gray-700" />
          </button>
          {images.length > 1 && (
            <>
              <button onClick={() => setSelectedImage(prev => Math.max(0, prev - 1))} className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/80 backdrop-blur-md rounded-full shadow-sm hover:bg-white transition opacity-0 group-hover:opacity-100">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button onClick={() => setSelectedImage(prev => Math.min(images.length - 1, prev + 1))} className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/80 backdrop-blur-md rounded-full shadow-sm hover:bg-white transition opacity-0 group-hover:opacity-100">
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
          {images.map((img, index) => (
            <button key={index} onClick={() => setSelectedImage(index)} className={`relative min-w-[100px] h-24 rounded-2xl overflow-hidden border-2 transition-all ${selectedImage === index ? 'border-red-600 bg-white' : 'border-transparent bg-gray-50'}`}>
              <img src={img} alt="" className="w-full h-full object-cover p-2" />
            </button>
          ))}
        </div>
      </div>

      {/* Right: Product Info */}
      <div className="lg:w-2/5 flex flex-col">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-red-600 mb-3">
            <Package className="w-4 h-4" /> Premium Collection
          </div>
          <h1 className="text-4xl font-black text-gray-900 mb-4 leading-tight">{product.name}</h1>
          <div className="flex items-center justify-between py-4 border-y border-gray-100">
            {renderStars(4.5)}
            <span className="text-sm font-medium text-gray-400">12 Verified Reviews</span>
          </div>
        </div>

        <div className="mb-8">
          <div className="flex items-baseline gap-4 mb-2">
            <span className="text-5xl font-black text-red-600">₱{product.price.toLocaleString()}</span>
            {product.price > 10000 && <span className="text-xl text-gray-300 line-through">₱{(product.price * 1.2).toLocaleString()}</span>}
          </div>
          <div className="inline-flex items-center px-3 py-1 bg-green-50 text-green-700 rounded-full text-[10px] font-bold uppercase tracking-wider">
            <CheckCircle className="w-3 h-3 mr-1" /> {product.stockQuantity > 0 ? 'Ready to ship' : 'Out of Stock'}
          </div>
        </div>

        <p className="text-gray-500 leading-relaxed mb-8">{product.description}</p>

        {product.colorsVariant && product.colorsVariant.length > 0 && (
          <div className="mb-8">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Color: <span className="text-red-600">{selectedColor}</span></h3>
            <div className="flex gap-4">
              {product.colorsVariant.map((color) => (
                <button key={color} onClick={() => setSelectedColor(color)} className={`w-10 h-10 rounded-full border-4 transition-all ${selectedColor === color ? 'border-red-600 scale-125 shadow-lg shadow-red-100' : 'border-white shadow-sm hover:border-gray-200'}`} style={{ backgroundColor: color.toLowerCase() }} />
              ))}
            </div>
          </div>
        )}

        <div className="space-y-6 mb-10">
          <div className="flex items-center gap-4">
            <div className="flex items-center bg-gray-100 rounded-2xl p-1">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-3 hover:bg-white rounded-xl transition shadow-none hover:shadow-sm"><Minus className="w-4 h-4" /></button>
              <span className="w-12 text-center font-bold text-lg">{quantity}</span>
              <button onClick={() => setQuantity(Math.min(product.stockQuantity, quantity + 1))} className="p-3 hover:bg-white rounded-xl transition shadow-none hover:shadow-sm"><Plus className="w-4 h-4" /></button>
            </div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-tighter">{product.stockQuantity} items left</div>
          </div>

          <div className="flex gap-3">
            <button 
              onClick={handleAddToCart} 
              disabled={product.stockQuantity === 0} 
              className={`flex-1 py-5 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all ${
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
            <button 
              onClick={handleToggleWishlist} 
              className="p-5 border border-gray-200 rounded-2xl hover:bg-gray-50 transition active:scale-90"
            >
              <Heart className={`w-6 h-6 ${wishlist.includes(product.id) ? 'fill-red-600 text-red-600' : 'text-gray-400'}`} />
            </button>
            <div className="relative">
              <button onClick={() => setShowShareMenu(!showShareMenu)} className="p-5 border border-gray-200 rounded-2xl hover:bg-gray-50 transition">
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

        <div className="grid grid-cols-3 gap-3 border-t border-gray-100 pt-8">
          {[
            { icon: Truck, label: 'Fast Shipping', sub: '3-5 Days' },
            { icon: Shield, label: 'Warranty', sub: '24 Months' },
            { icon: RotateCcw, label: 'Returns', sub: '30 Days' }
          ].map((item, i) => (
            <div key={i} className="text-center">
              <item.icon className="w-6 h-6 text-red-600 mx-auto mb-2" />
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
          <div className="bg-white rounded-[48px] max-w-7xl w-full max-h-[90vh] overflow-y-auto relative shadow-2xl" onClick={e => e.stopPropagation()}>
            <button onClick={onClose} className="absolute top-10 right-10 z-30 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition">
              <X className="w-6 h-6"/>
            </button>
            <div className="p-12 flex flex-col lg:flex-row gap-16">{mainContent}</div>
          </div>
        </div>
      ) : (
        <div className="container mx-auto px-4 py-12">
          <button onClick={() => navigate(-1)} className="flex items-center text-sm font-black uppercase tracking-widest text-gray-400 hover:text-red-600 mb-10 transition">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Collection
          </button>
          <div className="flex flex-col lg:flex-row gap-16 mb-24">{mainContent}</div>
          
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-12 border-b border-gray-100 mb-10 overflow-x-auto no-scrollbar">
              {['description', 'specs', 'reviews'].map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab as any)} className={`pb-6 text-sm font-black uppercase tracking-widest transition-all relative whitespace-nowrap ${activeTab === tab ? 'text-red-600' : 'text-gray-300 hover:text-gray-600'}`}>
                  {tab} {tab === 'reviews' && '(12)'}
                  {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-1 bg-red-600 rounded-full" />}
                </button>
              ))}
            </div>

            <div className="min-h-[400px]">
              {activeTab === 'description' && (
                <div className="prose prose-lg max-w-none text-gray-500 leading-relaxed">
                  <h3 className="text-2xl font-black text-gray-900 mb-6">Masterful Design & Comfort</h3>
                  <p>{product.description}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
                    {['Sustainably Sourced Oak', 'Hypoallergenic Fabric', 'Precision Hand-Stitched', 'Ergonomic Support'].map(feat => (
                      <div key={feat} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                        <div className="bg-red-600 p-1 rounded-full"><Check className="text-white w-3 h-3" /></div>
                        <span className="font-bold text-gray-900">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <ProductReviews productId={product.id} productName={product.name} />

              {activeTab === 'specs' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-2">
                  {[
                    { label: 'Overall Dimensions', value: `${product.height}H x ${product.width}W x ${product.length}L cm` },
                    { label: 'Primary Material', value: 'Solid Wood & Premium Upholstery' },
                    { label: 'Net Weight', value: '32.0 kg' },
                    { label: 'Seating Capacity', value: '1 Person' },
                    { label: 'Assembly', value: 'Partial Assembly Required' },
                    { label: 'Country of Origin', value: 'Philippines' }
                  ].map((spec, i) => (
                    <div key={i} className="flex justify-between py-5 border-b border-gray-50">
                      <span className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">{spec.label}</span>
                      <span className="text-gray-900 font-bold">{spec.value}</span>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'reviews' && (
                <div className="space-y-12">
                  <div className="flex flex-col md:flex-row items-center gap-12 p-10 bg-gray-50 rounded-[40px]">
                    <div className="text-center">
                      <div className="text-7xl font-black text-gray-900">4.5</div>
                      <div className="flex justify-center my-3">{renderStars(4.5)}</div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">12 Total Reviews</p>
                    </div>
                    <div className="flex-1 w-full space-y-4">
                      {[5,4,3,2,1].map(r => (
                        <div key={r} className="flex items-center gap-4">
                          <span className="text-[10px] font-black w-4">{r}★</span>
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-red-600" style={{ width: `${r === 5 ? 75 : r === 4 ? 15 : 5}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <div className="mt-32">
              <h2 className="text-3xl font-black text-gray-900 mb-12">Related Products</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {relatedProducts.map(p => (
                  <Link to={`/products/${p.id}`} key={p.id} className="group">
                    <div className="aspect-square bg-gray-50 rounded-[32px] overflow-hidden mb-6 border border-transparent group-hover:border-red-100 group-hover:bg-white transition-all duration-500">
                      <img src={p.imageUrl} alt="" className="w-full h-full object-contain p-8 group-hover:scale-110 transition duration-700" />
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