import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, 
  Heart, 
  Share2, 
  Check, 
  Truck, 
  Shield, 
  RotateCcw,
  Star,
  Minus,
  Plus,
  ArrowLeft,
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  Package,
  Clock,
  Award,
  ThumbsUp,
  MessageCircle,
  Facebook,
  Twitter,
  Mail,
  Link2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import productService from '../../services/product.service';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { Product } from '../../types';

interface ProductDetailProps {
  isModal?: boolean;
  onClose?: () => void;
}

const ProductDetail: React.FC<ProductDetailProps> = ({ isModal = false, onClose }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { user } = useAuth();
  
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

  useEffect(() => {
    loadProduct();
  }, [id]);

  useEffect(() => {
    if (product) {
      loadRelatedProducts();
    }
  }, [product]);

  // Handle escape key for modal
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (isModal && e.key === 'Escape' && onClose) {
        onClose();
      }
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
      images.push(...product.images.map(img => 
        typeof img === 'string' ? img : img.imageUrl
      ));
    }
    return images.filter(Boolean);
  };

  const handleAddToCart = () => {
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
    const hasHalfStar = rating % 1 !== 0;
    
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => {
          if (i < fullStars) {
            return <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />;
          } else if (i === fullStars && hasHalfStar) {
            return (
              <div key={i} className="relative">
                <Star className="w-5 h-5 text-gray-300" />
                <div className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
                  <Star className="w-5 h-5 text-yellow-400 fill-current" />
                </div>
              </div>
            );
          } else {
            return <Star key={i} className="w-5 h-5 text-gray-300" />;
          }
        })}
        <span className="ml-2 text-sm text-gray-600">({rating})</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center ${isModal ? 'h-96' : 'min-h-screen'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className={`flex items-center justify-center ${isModal ? 'h-96' : 'min-h-screen'}`}>
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h2>
          <button
            onClick={() => isModal && onClose ? onClose() : navigate('/shop')}
            className="text-red-600 hover:text-red-700 font-medium"
          >
            Back to Shop
          </button>
        </div>
      </div>
    );
  }

  const images = getAllImages();
  const mainContent = (
    <>
      {/* Image Gallery Section */}
      <div className="lg:w-1/2">
        {/* Main Image */}
        <div className="relative group">
          <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden mb-4">
            <img
              src={images[selectedImage] || 'https://via.placeholder.com/600'}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* Zoom button */}
          <button
            onClick={() => setShowZoom(true)}
            className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition opacity-0 group-hover:opacity-100"
          >
            <ZoomIn className="w-5 h-5 text-gray-700" />
          </button>

          {/* Navigation arrows for images */}
          {images.length > 1 && (
            <>
              <button
                onClick={() => setSelectedImage(prev => Math.max(0, prev - 1))}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition opacity-0 group-hover:opacity-100"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setSelectedImage(prev => Math.min(images.length - 1, prev + 1))}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition opacity-0 group-hover:opacity-100"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="grid grid-cols-5 gap-2">
            {images.map((img, index) => (
              <button
                key={index}
                onClick={() => setSelectedImage(index)}
                className={`aspect-square rounded-lg overflow-hidden border-2 transition ${
                  selectedImage === index ? 'border-red-600 ring-2 ring-red-200' : 'border-transparent hover:border-gray-300'
                }`}
              >
                <img
                  src={img}
                  alt={`${product.name} ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Product Info Section */}
      <div className="lg:w-1/2">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <button onClick={() => navigate('/shop')} className="hover:text-red-600">Shop</button>
          <span>/</span>
          <span className="text-gray-900">{product.name}</span>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
        
        {/* Rating */}
        <div className="flex items-center justify-between mb-4">
          {renderStars(4.5)}
          <button className="text-sm text-gray-500 hover:text-red-600">
            12 Reviews
          </button>
        </div>

        {/* Price */}
        <div className="mb-6">
          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-bold text-red-600">
              ₱{product.price.toLocaleString()}
            </span>
            {product.price > 10000 && (
              <>
                <span className="text-lg text-gray-400 line-through">
                  ₱{(product.price * 1.2).toLocaleString()}
                </span>
                <span className="text-sm text-green-600 bg-green-50 px-2 py-1 rounded-full">
                  Save 20%
                </span>
              </>
            )}
          </div>
          
          {/* Stock status */}
          <div className="mt-2 flex items-center">
            {product.stockQuantity > 0 ? (
              <>
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                <span className="text-green-600 font-medium">In Stock</span>
                {product.stockQuantity < 10 && (
                  <span className="ml-3 text-sm text-red-600">
                    Only {product.stockQuantity} left!
                  </span>
                )}
              </>
            ) : (
              <>
                <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                <span className="text-red-600 font-medium">Out of Stock</span>
              </>
            )}
          </div>
        </div>

        {/* Short Description */}
        <p className="text-gray-600 mb-6 leading-relaxed">{product.description}</p>

        {/* Colors */}
        {product.colorsVariant && product.colorsVariant.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Color: {selectedColor}</h3>
            <div className="flex gap-3">
              {product.colorsVariant.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`w-12 h-12 rounded-full border-2 transition-all transform hover:scale-110 ${
                    selectedColor === color 
                      ? 'border-red-600 ring-4 ring-red-100 scale-110' 
                      : 'border-gray-200 hover:border-gray-400'
                  }`}
                  style={{ backgroundColor: color.toLowerCase() }}
                  title={color}
                />
              ))}
            </div>
          </div>
        )}

        {/* Quantity */}
        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">Quantity</h3>
          <div className="flex items-center">
            <div className="flex items-center border border-gray-300 rounded-lg mr-4">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-3 hover:bg-gray-100 transition rounded-l-lg"
                disabled={product.stockQuantity === 0}
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-16 text-center font-medium">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(product.stockQuantity, quantity + 1))}
                className="p-3 hover:bg-gray-100 transition rounded-r-lg"
                disabled={product.stockQuantity === 0}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <span className="text-sm text-gray-500">
              Max: {product.stockQuantity}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mb-8">
          <button
            onClick={handleAddToCart}
            disabled={product.stockQuantity === 0}
            className={`flex-1 flex items-center justify-center px-6 py-4 rounded-xl font-semibold transition transform hover:scale-105 ${
              addedToCart
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-red-600 text-white hover:bg-red-700'
            } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
          >
            {addedToCart ? (
              <>
                <Check className="w-5 h-5 mr-2" />
                Added to Cart!
              </>
            ) : (
              <>
                <ShoppingCart className="w-5 h-5 mr-2" />
                Add to Cart
              </>
            )}
          </button>
          <button 
            onClick={() => user ? setWishlist(prev => prev.includes(product.id) ? prev : [...prev, product.id]) : null}
            className="p-4 border border-gray-300 rounded-xl hover:bg-gray-50 transition relative group"
            title="Add to Wishlist"
          >
            <Heart className="w-5 h-5" />
          </button>
          <div className="relative">
            <button
              onClick={() => setShowShareMenu(!showShareMenu)}
              className="p-4 border border-gray-300 rounded-xl hover:bg-gray-50 transition"
              title="Share"
            >
              <Share2 className="w-5 h-5" />
            </button>
            
            {/* Share menu */}
            {showShareMenu && (
              <div className="absolute right-0 mt-2 bg-white rounded-lg shadow-xl border p-2 z-10">
                <button
                  onClick={() => handleShare('facebook')}
                  className="flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-50 rounded-lg"
                >
                  <Facebook className="w-4 h-4 text-blue-600" />
                  <span className="text-sm">Facebook</span>
                </button>
                <button
                  onClick={() => handleShare('twitter')}
                  className="flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-50 rounded-lg"
                >
                  <Twitter className="w-4 h-4 text-sky-500" />
                  <span className="text-sm">Twitter</span>
                </button>
                <button
                  onClick={() => handleShare('email')}
                  className="flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-50 rounded-lg"
                >
                  <Mail className="w-4 h-4 text-gray-600" />
                  <span className="text-sm">Email</span>
                </button>
                <button
                  onClick={() => handleShare('copy')}
                  className="flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-50 rounded-lg"
                >
                  <Link2 className="w-4 h-4 text-gray-600" />
                  <span className="text-sm">Copy Link</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="text-center p-4 bg-gray-50 rounded-xl">
            <Truck className="w-6 h-6 text-red-600 mx-auto mb-2" />
            <p className="text-sm font-medium">Free Shipping</p>
            <p className="text-xs text-gray-500">On orders ₱5k+</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-xl">
            <Shield className="w-6 h-6 text-red-600 mx-auto mb-2" />
            <p className="text-sm font-medium">2 Year Warranty</p>
            <p className="text-xs text-gray-500">Full coverage</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-xl">
            <RotateCcw className="w-6 h-6 text-red-600 mx-auto mb-2" />
            <p className="text-sm font-medium">30 Day Returns</p>
            <p className="text-xs text-gray-500">Money back</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-4">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('description')}
              className={`pb-4 font-medium transition ${
                activeTab === 'description'
                  ? 'text-red-600 border-b-2 border-red-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Description
            </button>
            <button
              onClick={() => setActiveTab('specs')}
              className={`pb-4 font-medium transition ${
                activeTab === 'specs'
                  ? 'text-red-600 border-b-2 border-red-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Specifications
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`pb-4 font-medium transition ${
                activeTab === 'reviews'
                  ? 'text-red-600 border-b-2 border-red-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Reviews (12)
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="mb-8">
          {activeTab === 'description' && (
            <div className="prose max-w-none">
              <p className="text-gray-600 leading-relaxed">{product.description}</p>
              <p className="text-gray-600 leading-relaxed mt-4">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.
              </p>
              <ul className="list-disc list-inside text-gray-600 mt-4 space-y-2">
                <li>Premium quality materials</li>
                <li>Expert craftsmanship</li>
                <li>Easy assembly</li>
                <li>Eco-friendly production</li>
              </ul>
            </div>
          )}

          {activeTab === 'specs' && (
            <div className="space-y-4">
              <div className="flex justify-between py-3 border-b">
                <span className="text-gray-600">Dimensions</span>
                <span className="font-medium">{product.height}cm x {product.width}cm x {product.length}cm</span>
              </div>
              <div className="flex justify-between py-3 border-b">
                <span className="text-gray-600">Material</span>
                <span className="font-medium">Solid Wood</span>
              </div>
              <div className="flex justify-between py-3 border-b">
                <span className="text-gray-600">Weight</span>
                <span className="font-medium">25 kg</span>
              </div>
              <div className="flex justify-between py-3 border-b">
                <span className="text-gray-600">Assembly</span>
                <span className="font-medium">Required (tools included)</span>
              </div>
              <div className="flex justify-between py-3 border-b">
                <span className="text-gray-600">Warranty</span>
                <span className="font-medium">2 Years</span>
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-6">
              {/* Review summary */}
              <div className="flex items-center gap-8 p-4 bg-gray-50 rounded-xl">
                <div className="text-center">
                  <div className="text-4xl font-bold text-gray-900">4.5</div>
                  <div className="flex mt-1">
                    {renderStars(4.5)}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">12 reviews</p>
                </div>
                <div className="flex-1 space-y-2">
                  {[5,4,3,2,1].map(rating => (
                    <div key={rating} className="flex items-center gap-2">
                      <span className="text-sm w-8">{rating}★</span>
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-yellow-400 rounded-full"
                          style={{ width: `${rating === 5 ? 60 : rating === 4 ? 25 : rating === 3 ? 10 : 5}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-500">
                        {rating === 5 ? 7 : rating === 4 ? 3 : rating === 3 ? 1 : 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Review list */}
              <div className="space-y-4">
                {[1,2,3].map(review => (
                  <div key={review} className="border-b pb-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium">JD</span>
                        </div>
                        <div>
                          <p className="font-medium">Juan Dela Cruz</p>
                          <p className="text-xs text-gray-500">2 days ago</p>
                        </div>
                      </div>
                      {renderStars(5)}
                    </div>
                    <p className="text-gray-600 text-sm">
                      Great quality! The furniture looks exactly like the picture and was easy to assemble.
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );

  // If modal mode, render in a modal overlay
  if (isModal) {
    return (
      <>
        {/* Modal Backdrop */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          {/* Modal Content */}
          <div 
            className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="sticky top-4 float-right z-10 m-4 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="p-6">
              <div className="flex flex-col lg:flex-row gap-8">
                {mainContent}
              </div>
            </div>
          </div>
        </div>

        {/* Zoom Modal */}
        {showZoom && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-90 z-[60] flex items-center justify-center p-4"
            onClick={() => setShowZoom(false)}
          >
            <button
              onClick={() => setShowZoom(false)}
              className="absolute top-4 right-4 text-white hover:text-gray-300"
            >
              <X className="w-8 h-8" />
            </button>
            <img
              src={images[selectedImage]}
              alt={product.name}
              className="max-w-full max-h-full object-contain"
            />
          </div>
        )}
      </>
    );
  }

  // Full page mode for mobile/tablet
  return (
    <div className="min-h-screen bg-white">
      {/* Back button - mobile only */}
      <div className="lg:hidden sticky top-0 bg-white border-b z-10 px-4 py-3">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Shop
        </button>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="hidden lg:block mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Shop
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {mainContent}
        </div>

        {/* Related Products - only in full page mode */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">You May Also Like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map(product => (
                <div
                  key={product.id}
                  onClick={() => navigate(`/products/${product.id}`)}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition cursor-pointer group"
                >
                  <div className="h-48 overflow-hidden">
                    <img
                      src={product.imageUrl || 'https://via.placeholder.com/400x300'}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">{product.name}</h3>
                    <p className="text-red-600 font-bold">₱{product.price.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Zoom Modal (same as above) */}
      {showZoom && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setShowZoom(false)}
        >
          <button
            onClick={() => setShowZoom(false)}
            className="absolute top-4 right-4 text-white hover:text-gray-300"
          >
            <X className="w-8 h-8" />
          </button>
          <img
            src={images[selectedImage]}
            alt={product.name}
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}
    </div>
  );
};

export default ProductDetail;

function setWishlist(arg0: (prev: any) => any): void {
  throw new Error('Function not implemented.');
}
