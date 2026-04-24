import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams, useOutletContext } from 'react-router-dom';
import { 
  Search, Grid, List, Package, SlidersHorizontal, X, 
  Star, ShoppingBag, ChevronLeft, ChevronRight, 
  Truck, Shield, Clock, Check, Minus, Plus, TrendingUp,
  Sparkles, Filter, Palette
} from 'lucide-react';
import productService from '../../services/product.service';
import categoryService from '../../services/category.service';
import orderService from '../../services/order.service';
import reviewService from '../../services/review.service';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { Product, Category } from '../../types';

interface OutletContextType {
  onAuthRequired?: (mode: 'login' | 'register') => void;
}

// Helper to get color display info
const getColorInfo = (color: string): { name: string; cssColor: string; isLight: boolean } => {
  const colorMap: Record<string, string> = {
    'white': '#FFFFFF', 'natural': '#DEB887', 'natural wood': '#DEB887',
    'walnut': '#5C4033', 'dark walnut': '#3E2723', 'oak': '#D2B48C',
    'mahogany': '#4A0404', 'black': '#1A1A1A', 'espresso': '#2C1A14',
    'cherry': '#8B0000', 'maple': '#F5DEB3', 'gray': '#808080',
    'grey': '#808080', 'beige': '#F5F5DC', 'cream': '#FFFDD0',
    'brown': '#8B4513', 'light brown': '#A0522D', 'dark brown': '#3E2723',
    'teak': '#8B6914', 'acacia': '#D2A679', 'wenge': '#3A2A1A',
    'ash': '#C4BAA2', 'beech': '#D4B895', 'pine': '#E8C07A',
    'rosewood': '#65000B', 'ebony': '#2C2C2C', 'red': '#DC2626',
    'blue': '#2563EB', 'green': '#16A34A', 'yellow': '#CA8A04',
    'orange': '#EA580C', 'purple': '#9333EA', 'pink': '#EC4899',
    'navy': '#1E3A5F', 'silver': '#C0C0C0', 'gold': '#D4AF37', 'ivory': '#FFFFF0',
  };
  const lowerColor = color.toLowerCase().trim();
  const cssColor = colorMap[lowerColor] || '#CCCCCC';
  const lightColors = ['white', 'natural', 'natural wood', 'maple', 'beige', 'cream', 'ash', 'beech', 'pine', 'ivory', 'silver', 'yellow', 'gold'];
  const isLight = lightColors.includes(lowerColor);
  return { name: color, cssColor, isLight };
};

// ─── Quick View Modal ──────────────────────────────────────────────────────────
const ProductQuickViewModal = ({ 
  product, isOpen, onClose, onAddToCart 
}: { 
  product: Product | null; 
  isOpen: boolean; 
  onClose: () => void; 
  onAddToCart: (product: Product, quantity: number, color: string) => void;
}) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState('');
  const [added, setAdded] = useState(false);
  const [mainImage, setMainImage] = useState('');

  useEffect(() => {
    if (product) {
      setMainImage(product.imageUrl || 'https://via.placeholder.com/500');
      if (product.colorsVariant?.length > 0) setSelectedColor(product.colorsVariant[0]);
      setQuantity(1);
      setAdded(false);
    }
  }, [product]);

  const handleAddToCart = () => {
    if (product) {
      onAddToCart(product, quantity, selectedColor);
      setAdded(true);
      setTimeout(() => { setAdded(false); onClose(); }, 1500);
    }
  };

  const renderStars = (rating: number = 4) => (
    <div className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star key={i} className={`w-4 h-4 ${i < Math.floor(rating) ? 'text-amber-500 fill-amber-500' : 'text-gray-200'}`} />
      ))}
    </div>
  );

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-[2rem] max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-stone-100 px-8 py-5 flex justify-between items-center rounded-t-[2rem]">
          <div>
            <p className="text-xs font-bold tracking-widest text-rose-700 uppercase">Quick Add</p>
            <h2 className="text-lg font-bold text-slate-900">{product.name}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-full transition">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-8">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="md:w-1/2">
              <div className="aspect-square bg-stone-50 rounded-2xl overflow-hidden border border-stone-100">
                <img src={mainImage} alt={product.name} className="w-full h-full object-cover" />
              </div>
              {(product.images?.length ?? 0) > 0 && (
                <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
                  <button
                    onClick={() => setMainImage(product.imageUrl || '')}
                    className={`w-16 h-16 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all ${mainImage === product.imageUrl ? 'border-rose-500 ring-2 ring-rose-100' : 'border-stone-100'}`}
                  >
                    <img src={product.imageUrl} alt="" className="w-full h-full object-cover" />
                  </button>
                  {product.images?.slice(0, 3).map((img: any, idx: number) => {
                    const src = typeof img === 'string' ? img : img.imageUrl;
                    return (
                      <button key={idx} onClick={() => setMainImage(src)}
                        className={`w-16 h-16 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all ${mainImage === src ? 'border-rose-500 ring-2 ring-rose-100' : 'border-stone-100'}`}
                      >
                        <img src={src} alt="" className="w-full h-full object-cover" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="md:w-1/2 space-y-5">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  {renderStars(product.rating || 0)}
                  <span className="text-xs text-slate-400">({product.reviewCount || 0} reviews)</span>
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-bold text-rose-900">₱{product.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                {product.stockQuantity < 10 && product.stockQuantity > 0 && (
                  <p className="text-xs text-amber-600 font-semibold mt-1">Only {product.stockQuantity} left in stock</p>
                )}
              </div>

              <p className="text-slate-500 text-sm leading-relaxed">{product.description}</p>

              {product.colorsVariant?.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-3">
                    Color — <span className="text-rose-700">{selectedColor}</span>
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {product.colorsVariant.map((color: string) => {
                      const { cssColor, isLight } = getColorInfo(color);
                      return (
                        <button 
                          key={color} 
                          onClick={() => setSelectedColor(color)}
                          className={`w-9 h-9 rounded-full border-2 transition-all ${selectedColor === color ? 'border-rose-500 ring-2 ring-rose-100 scale-110' : 'border-stone-200 hover:border-stone-300'}`}
                          style={{ backgroundColor: cssColor, borderColor: isLight ? '#CBD5E1' : undefined }}
                          title={color} 
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-3">Quantity</label>
                <div className="flex items-center gap-3">
                  <div className="flex items-center bg-stone-100 rounded-xl overflow-hidden">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-4 py-3 hover:bg-stone-200 transition">
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-10 text-center font-bold text-slate-900">{quantity}</span>
                    <button onClick={() => setQuantity(Math.min(product.stockQuantity, quantity + 1))} disabled={quantity >= product.stockQuantity} className="px-4 py-3 hover:bg-stone-200 transition disabled:opacity-30">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="text-xs text-slate-400">Max: {product.stockQuantity}</span>
                </div>
              </div>

              <div className="bg-stone-50 rounded-xl px-5 py-4 flex justify-between items-center">
                <span className="text-sm text-slate-500 font-medium">Subtotal</span>
                <span className="text-2xl font-bold text-rose-900">₱{(product.price * quantity).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={product.stockQuantity === 0}
                  className={`flex-1 py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                    added ? 'bg-emerald-600 text-white' : 'bg-rose-950 text-white hover:bg-rose-900'
                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  {added ? <><Check className="w-4 h-4" /> Added!</> : <><ShoppingBag className="w-4 h-4" /> Add to Cart</>}
                </button>
                <button onClick={onClose} className="px-5 py-3.5 border border-stone-200 rounded-xl text-sm font-medium hover:bg-stone-50 transition text-slate-600">
                  Keep Browsing
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Shop Component ───────────────────────────────────────────────────────
const Shop: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { addItem } = useCart();
  const outletContext = useOutletContext<OutletContextType>();
  const onAuthRequired = outletContext?.onAuthRequired;

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  
  // Price range
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(150000);
  
  const [selectedCategory, setSelectedCategory] = useState<number | null>(
    searchParams.get('category') ? parseInt(searchParams.get('category')!) : null
  );
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [inStockOnly, setInStockOnly] = useState(false);

  const itemsPerPage = 12;

  const highestPrice = useMemo(() => {
    if (products.length === 0) return 150000;
    return Math.max(...products.map(p => p.price), 150000);
  }, [products]);

  const [priceFilterChanged, setPriceFilterChanged] = useState(false);

  // Paginated fetch for products
  const [productPage, setProductPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [allProducts, setAllProducts] = useState<Product[]>([]);

  // Function to fetch product reviews and calculate average rating
  const fetchProductReviews = async (productId: number): Promise<{ averageRating: number; reviewCount: number }> => {
    try {
      const reviews = await reviewService.getProductReviews(productId);
      const reviewCount = reviews.length;
      const averageRating = reviewCount > 0 
        ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviewCount 
        : 0;
      return { averageRating, reviewCount };
    } catch (error) {
      console.error('Failed to fetch reviews for product:', productId, error);
      return { averageRating: 0, reviewCount: 0 };
    }
  };

  // ✅ NEW: Fetch products with pagination (same as admin)
  const fetchProductsPaginated = async (page: number) => {
    try {
      const productsData = await productService.getProductsPaginated(page, itemsPerPage);
      
      // Calculate sales counts and reviews for each product
      const productsWithDetails = await Promise.all(productsData.map(async (product: Product) => {
        const { averageRating, reviewCount } = await fetchProductReviews(product.id);
        return { 
          ...product, 
          salesCount: product.totalSold || 0,
          rating: averageRating,
          reviewCount
        };
      }));
      
      return productsWithDetails;
    } catch (error) {
      console.error('Failed to fetch products:', error);
      return [];
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const categoriesData = await categoryService.getCategories();
      setCategories(categoriesData);
      
      // Load first page of products
      const firstPageProducts = await fetchProductsPaginated(1);
      setProducts(firstPageProducts);
      setAllProducts(firstPageProducts);
      setHasMore(firstPageProducts.length === itemsPerPage);
      setProductPage(1);
      
      // Set max price
      if (firstPageProducts.length > 0) {
        const maxProdPrice = Math.max(...firstPageProducts.map((p: { price: any; }) => p.price));
        setMaxPrice(maxProdPrice);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreProducts = async () => {
    if (!hasMore || loading) return;
    
    setLoading(true);
    try {
      const nextPage = productPage + 1;
      const newProducts = await fetchProductsPaginated(nextPage);
      
      if (newProducts.length > 0) {
        setProducts(prev => [...prev, ...newProducts]);
        setAllProducts(prev => [...prev, ...newProducts]);
        setProductPage(nextPage);
        setHasMore(newProducts.length === itemsPerPage);
        
        // Update max price if needed
        const newMaxPrice = Math.max(...newProducts.map((p: { price: any; }) => p.price));
        if (newMaxPrice > maxPrice) {
          setMaxPrice(newMaxPrice);
        }
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Failed to load more products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedCategory) params.set('category', selectedCategory.toString());
    if (searchQuery) params.set('q', searchQuery);
    setSearchParams(params);
    setCurrentPage(1);
  }, [selectedCategory, searchQuery, setSearchParams]);

  const handleAddToCartWithOptions = (product: Product, quantity: number, color: string) => {
  // If user is not logged in, prompt login
  if (!user) {
    if (onAuthRequired) {
      onAuthRequired('login');
    }
    return;
  }
  // User is logged in, add to cart
  for (let i = 0; i < quantity; i++) addItem(product, color);
};

  const handleOpenModal = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedProduct(product);
    setShowModal(true);
  };

  // Filter logic - only active products
  const filteredProducts = useMemo(() => {
    return allProducts
      .filter(p => {
        // Filter out inactive/deactivated products
        if (!p.isActive) return false;
        
        // Category filter
        if (selectedCategory && p.categoryId !== selectedCategory) return false;
        
        // Search filter
        if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
            !p.description?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        
        // Price range filter
        if (p.price < minPrice || p.price > maxPrice) return false;
        
        // Rating filter
        if (selectedRating && (p.rating || 0) < selectedRating) return false;
        
        // Stock filter
        if (inStockOnly && p.stockQuantity === 0) return false;
        
        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'price-low': return a.price - b.price;
          case 'price-high': return b.price - a.price;
          case 'name-asc': return a.name.localeCompare(b.name);
          case 'name-desc': return b.name.localeCompare(a.name);
          case 'rating': return (b.rating || 0) - (a.rating || 0);
          case 'best-selling': return (b.totalSold || 0) - (a.totalSold || 0);
          default: return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
        }
      });
  }, [allProducts, selectedCategory, searchQuery, minPrice, maxPrice, selectedRating, inStockOnly, sortBy]);

  const paginatedProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const renderStars = (rating: number = 0) => (
    <div className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star key={i} className={`w-3 h-3 ${i < Math.floor(rating) ? 'text-amber-500 fill-amber-500' : 'text-gray-200'}`} />
      ))}
    </div>
  );

  const activeFilterCount = [
    selectedCategory !== null,
    priceFilterChanged && (minPrice > 0 || maxPrice < highestPrice),
    selectedRating !== null,
    inStockOnly
  ].filter(Boolean).length;

  // ─── Sidebar Filter Content ────────────────────────────────────────────────
  const FilterContent = () => (
    <div className="space-y-8">
      {/* Categories */}
      <div>
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Categories</h3>
        <div className="space-y-1">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition-all font-medium ${
              !selectedCategory ? 'bg-rose-950 text-white' : 'text-slate-600 hover:bg-stone-100'
            }`}
          >
            All Products
            <span className={`ml-2 text-xs ${!selectedCategory ? 'text-rose-200' : 'text-slate-400'}`}>
              ({allProducts.filter(p => p.isActive).length})
            </span>
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition-all font-medium ${
                selectedCategory === cat.id ? 'bg-rose-950 text-white' : 'text-slate-600 hover:bg-stone-100'
              }`}
            >
              {cat.name}
              <span className={`ml-2 text-xs ${selectedCategory === cat.id ? 'text-rose-200' : 'text-slate-400'}`}>
                ({allProducts.filter(p => p.categoryId === cat.id && p.isActive).length})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Price Range</h3>
        
        <div className="flex gap-3 mb-4">
          <div className="flex-1">
            <label className="text-xs text-slate-400 block mb-1">Min (₱)</label>
            <input
              type="number"
              value={minPrice}
              onChange={(e) => {
                setMinPrice(Math.max(0, parseInt(e.target.value) || 0));
                setPriceFilterChanged(true);
              }}
              className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              min={0}
              max={maxPrice}
              step={1000}
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-slate-400 block mb-1">Max (₱)</label>
            <input
              type="number"
              value={maxPrice}
              onChange={(e) => {
                setMaxPrice(Math.min(highestPrice, parseInt(e.target.value) || highestPrice));
                setPriceFilterChanged(true);
              }}
              className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              min={minPrice}
              max={highestPrice}
              step={1000}
            />
          </div>
        </div>

        <div className="relative pt-2">
          <input
            type="range"
            min={0}
            max={highestPrice}
            step={1000}
            value={maxPrice}
            onChange={(e) => {
              setMaxPrice(parseInt(e.target.value));
              setPriceFilterChanged(true);
            }}
            className="w-full accent-rose-700"
          />
          <div className="flex justify-between mt-2 text-xs">
            <span className="text-slate-400">₱0</span>
            <span className="text-rose-800 font-bold">Up to ₱{maxPrice.toLocaleString()}</span>
            <span className="text-slate-400">₱{highestPrice.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Minimum Rating */}
      <div>
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Minimum Rating</h3>
        <div className="space-y-1">
          {[5, 4, 3, 2, 1].map(rating => (
            <button
              key={rating}
              onClick={() => setSelectedRating(selectedRating === rating ? null : rating)}
              className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm transition-all ${
                selectedRating === rating ? 'bg-rose-50 text-rose-800' : 'hover:bg-stone-100 text-slate-600'
              }`}
            >
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-3.5 h-3.5 ${i < rating ? 'text-amber-500 fill-amber-500' : 'text-gray-200'}`} />
                ))}
              </div>
              <span className="text-xs font-medium">& Up</span>
              {selectedRating === rating && <Check className="w-3.5 h-3.5 text-rose-700 ml-auto" />}
            </button>
          ))}
        </div>
      </div>

      {/* In Stock Only */}
      <label className="flex items-center gap-3 cursor-pointer px-4 py-3 border border-stone-100 rounded-xl hover:bg-stone-50 transition">
        <input
          type="checkbox" 
          checked={inStockOnly}
          onChange={(e) => setInStockOnly(e.target.checked)}
          className="w-4 h-4 accent-rose-700 rounded"
        />
        <span className="text-sm font-medium text-slate-700">In Stock Only</span>
      </label>

      {/* Trust Signals */}
      <div className="pt-6 border-t border-stone-100 space-y-3">
        {[
          { icon: Truck, text: 'Free shipping over ₱5,000' },
          { icon: Shield, text: '2-year full warranty' },
          { icon: Clock, text: '3–5 day delivery window' },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-3 text-xs text-slate-500">
            <div className="w-7 h-7 bg-rose-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <item.icon className="w-3.5 h-3.5 text-rose-700" />
            </div>
            {item.text}
          </div>
        ))}
      </div>

      {/* Clear Filters */}
      {activeFilterCount > 0 && (
        <button
          onClick={() => { 
            setSelectedCategory(null); 
            setMinPrice(0);
            setMaxPrice(highestPrice);
            setPriceFilterChanged(false);
            setSelectedRating(null); 
            setInStockOnly(false); 
          }}
          className="w-full py-2.5 text-xs font-bold text-rose-700 border border-rose-200 rounded-xl hover:bg-rose-50 transition"
        >
          Clear All Filters ({activeFilterCount})
        </button>
      )}
    </div>
  );

  if (loading && products.length === 0) return (
    <div className="flex items-center justify-center min-h-screen bg-[#F9F8F6]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-rose-900 mx-auto mb-4" />
        <p className="text-slate-400 text-sm">Loading collection…</p>
      </div>
    </div>
  );

  return (
    <>
      <div className="min-h-screen bg-[#F9F8F6] pb-24 selection:bg-rose-100 selection:text-rose-900">
        {/* Hero Section */}
        <section className="relative bg-rose-950 py-24 overflow-hidden">
          <div className="absolute inset-0">
            <img
              src="https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=1200"
              alt=""
              className="w-full h-full object-cover opacity-10"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-rose-950 via-rose-950/90 to-rose-900/80" />
          </div>

          <div className="container mx-auto px-6 relative z-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-5">
              <div>
                <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-rose-200 text-xs font-bold tracking-widest uppercase px-4 py-2 rounded-full mb-5">
                  <Sparkles className="w-3.5 h-3.5" />
                  2026 Collection
                </div>
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif text-white leading-tight mb-3">
                  Shop the <span className="italic text-rose-200">Collection.</span>
                </h1>
                <p className="text-rose-100/60 text-base max-w-md leading-relaxed">
                  Curated premium furniture crafted for the modern Filipino home.
                </p>
              </div>

              <div className="md:w-80">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search furniture…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-white/15 backdrop-blur border border-white/30 rounded-xl text-white placeholder-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-white/40 focus:bg-white/20 transition"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')} 
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Results Bar */}
        <div className="bg-white border-b border-stone-100 sticky top-0 z-30">
          <div className="container mx-auto px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
            <p className="text-xs text-slate-400 font-medium">
              Showing <span className="text-slate-800 font-bold">{filteredProducts.length}</span> products
              {searchQuery && <> for "<span className="text-rose-700">{searchQuery}</span>"</>}
            </p>

            <div className="flex items-center gap-3">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-xs font-medium text-slate-600 bg-stone-100 border-none rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-rose-200 cursor-pointer appearance-none"
              >
                <option value="newest">Newest First</option>
                <option value="best-selling">Best Selling</option>
                <option value="price-low">Price: Low → High</option>
                <option value="price-high">Price: High → Low</option>
                <option value="rating">Top Rated</option>
                <option value="name-asc">Name A–Z</option>
                <option value="name-desc">Name Z–A</option>
              </select>

              <div className="flex bg-stone-100 p-1 rounded-xl">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition ${viewMode === 'grid' ? 'bg-white shadow-sm text-rose-700' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition ${viewMode === 'list' ? 'bg-white shadow-sm text-rose-700' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => setShowMobileFilters(true)}
                className="lg:hidden flex items-center gap-2 px-4 py-2.5 bg-rose-950 text-white text-xs font-bold rounded-xl"
              >
                <Filter className="w-3.5 h-3.5" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="w-4 h-4 bg-white text-rose-950 rounded-full text-[10px] font-black flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Main Layout */}
        <div className="container mx-auto px-6 pt-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="bg-white rounded-2xl border border-stone-100 p-6 sticky top-[73px]">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-bold text-slate-900 text-sm">Filters</h2>
                  {activeFilterCount > 0 && (
                    <span className="text-xs font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">
                      {activeFilterCount} active
                    </span>
                  )}
                </div>
                <FilterContent />
              </div>
            </aside>

            {/* Product Grid */}
            <main className="flex-1 min-w-0">
              {filteredProducts.length === 0 ? (
                <div className="text-center py-32 bg-white rounded-2xl border border-stone-100">
                  <Package className="w-16 h-16 text-stone-200 mx-auto mb-4" />
                  <h2 className="text-2xl font-serif text-slate-800 mb-2">No products found</h2>
                  <p className="text-slate-400 text-sm mb-6">Try adjusting your search or filters.</p>
                  <button
                    onClick={() => { 
                      setSearchQuery(''); 
                      setSelectedCategory(null); 
                      setMinPrice(0);
                      setMaxPrice(highestPrice);
                      setPriceFilterChanged(false);
                      setSelectedRating(null); 
                      setInStockOnly(false); 
                    }}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-rose-950 text-white rounded-xl text-sm font-bold hover:bg-rose-900 transition"
                  >
                    Clear All Filters
                  </button>
                </div>
              ) : (
                <>
                  <div className={
                    viewMode === 'grid'
                      ? 'grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-3 md:gap-4 lg:gap-6'
                      : 'space-y-3 sm:space-y-4'
                  }>
                    {paginatedProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        viewMode={viewMode}
                        onOpenModal={handleOpenModal}
                        renderStars={renderStars}
                      />
                    ))}
                  </div>

                  {/* Load More Button */}
                  {hasMore && filteredProducts.length === allProducts.length && (
                    <div className="flex justify-center mt-8">
                      <button
                        onClick={loadMoreProducts}
                        disabled={loading}
                        className="px-8 py-3 bg-white border border-stone-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-stone-50 transition flex items-center gap-2"
                      >
                        {loading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                            Loading...
                          </>
                        ) : (
                          <>
                            Load More Products
                            <ChevronRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex justify-center mt-12 gap-2 flex-wrap">
                      <button
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(p => p - 1)}
                        className="p-3 bg-white rounded-xl border border-stone-100 disabled:opacity-30 hover:bg-stone-50 transition"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      {(() => {
                        const pageNumbers: number[] = [];
                        if (totalPages <= 5) {
                          for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
                        } else if (currentPage <= 3) {
                          for (let i = 1; i <= 5; i++) pageNumbers.push(i);
                        } else if (currentPage >= totalPages - 2) {
                          for (let i = totalPages - 4; i <= totalPages; i++) pageNumbers.push(i);
                        } else {
                          for (let i = currentPage - 2; i <= currentPage + 2; i++) pageNumbers.push(i);
                        }
                        return pageNumbers.map((pageNum) => (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`w-11 h-11 rounded-xl font-bold text-sm transition-all ${
                              currentPage === pageNum
                                ? 'bg-rose-950 text-white shadow-lg'
                                : 'bg-white text-slate-600 hover:bg-stone-50 border border-stone-100'
                            }`}
                          >
                            {pageNum}
                          </button>
                        ));
                      })()}
                      <button
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(p => p + 1)}
                        className="p-3 bg-white rounded-xl border border-stone-100 disabled:opacity-30 hover:bg-stone-50 transition"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </>
              )}
            </main>
          </div>
        </div>

        {/* Mobile Filter Drawer */}
        {showMobileFilters && (
          <div className="fixed inset-0 z-[60] lg:hidden">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowMobileFilters(false)} />
            <div className="absolute right-0 top-0 h-full w-full max-w-sm bg-white shadow-2xl overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-stone-100 px-6 py-5 flex justify-between items-center">
                <div>
                  <h2 className="font-bold text-slate-900">Filters</h2>
                  {activeFilterCount > 0 && <p className="text-xs text-rose-700 font-medium">{activeFilterCount} active</p>}
                </div>
                <button onClick={() => setShowMobileFilters(false)} className="p-2 bg-stone-100 rounded-full hover:bg-stone-200 transition">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6">
                <FilterContent />
              </div>
              <div className="sticky bottom-0 bg-white border-t border-stone-100 p-4">
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="w-full py-4 bg-rose-950 text-white rounded-xl font-bold text-sm hover:bg-rose-900 transition"
                >
                  Show {filteredProducts.length} Results
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick View Modal */}
      {user && (
        <ProductQuickViewModal
          product={selectedProduct}
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onAddToCart={handleAddToCartWithOptions}
        />
      )}
    </>
  );
};

// ─── Product Card ──────────────────────────────────────────────────────────────
const ProductCard = ({ product, viewMode, onOpenModal, renderStars }: any) => {
  const isGrid = viewMode === 'grid';

  const reviewCount = product.reviewCount || 0;
  const averageRating = product.rating || 0;
  const salesCount = product.salesCount || 0;
  const isBestSeller = salesCount > 100;
  const isTopRated = averageRating >= 4.5 && reviewCount > 10 && !isBestSeller;

  // List view
  if (!isGrid) {
    return (
      <div className="group bg-white rounded-lg border border-slate-200/70 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 focus-within:ring-2 focus-within:ring-rose-200/60">
        <div className="flex flex-row gap-3 p-3">
          <Link to={`/products/${product.id}`} className="block w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0">
            <img
              src={product.imageUrl || 'https://via.placeholder.com/400'}
              alt={product.name}
              className="w-full h-full object-cover rounded-md"
            />
          </Link>

          <div className="flex-1 flex flex-col">
            <Link to={`/products/${product.id}`}>
              <h3 className="font-bold text-slate-900 text-sm line-clamp-2 hover:text-rose-800 transition-colors">
                {product.name}
              </h3>
            </Link>

            <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mt-1">
              <div className="flex items-center gap-0.5">
                {renderStars(averageRating)}
                <span className="text-[10px] text-slate-400 ml-1">
                  ({reviewCount})
                </span>
              </div>
              {salesCount > 0 && (
                <div className="flex items-center gap-0.5 text-[10px] text-emerald-600">
                  <TrendingUp className="w-2.5 h-2.5" />
                  <span>{salesCount} sold</span>
                </div>
              )}
            </div>

            {/* Color variations */}
            {product.colorsVariant?.length > 0 && (
              <div className="flex items-center gap-1 mt-1">
                <Palette className="w-3 h-3 text-slate-400" />
                <div className="flex gap-0.5">
                  {product.colorsVariant.slice(0, 4).map((color: string) => {
                    const { cssColor, isLight } = getColorInfo(color);
                    return (
                      <span
                        key={color}
                        className="w-3.5 h-3.5 rounded-full border border-stone-200"
                        style={{ backgroundColor: cssColor }}
                        title={color}
                      />
                    );
                  })}
                  {product.colorsVariant.length > 4 && (
                    <span className="text-[9px] text-slate-400 ml-0.5">+{product.colorsVariant.length - 4}</span>
                  )}
                </div>
              </div>
            )}

            {/* Price and Add to Cart - Price on left, Button on right */}
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm font-bold text-rose-900">₱{product.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              
              <button
                disabled={product.stockQuantity === 0}
                onClick={(e) => onOpenModal(e, product)}
                className="p-1.5 bg-rose-950 text-white rounded-md shadow-sm hover:bg-rose-900 disabled:bg-stone-100 disabled:text-stone-300 transition-all active:scale-95"
                title="Add to Cart"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <div className="group bg-white rounded-lg border border-slate-200/70 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 focus-within:ring-2 focus-within:ring-rose-200/60">
      
      {/* Image */}
      <div className="relative overflow-hidden bg-stone-50 aspect-square">
        <Link to={`/products/${product.id}`} className="block w-full h-full">
          <img
            src={product.imageUrl || 'https://via.placeholder.com/400'}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
          />
        </Link>

        {/* Badges */}
        {isBestSeller && (
          <div className="absolute top-2 left-2 bg-amber-500 text-white text-[8px] md:text-[10px] font-bold px-1.5 py-0.5 md:px-2.5 md:py-1 rounded-md shadow-sm">
            Best Seller
          </div>
        )}
        {isTopRated && (
          <div className="absolute top-2 left-2 bg-emerald-500 text-white text-[8px] md:text-[10px] font-bold px-1.5 py-0.5 md:px-2.5 md:py-1 rounded-md shadow-sm">
            Top Rated
          </div>
        )}
        {product.stockQuantity === 0 && (
          <div className="absolute top-2 left-2 bg-slate-800 text-white text-[8px] md:text-[10px] font-bold px-1.5 py-0.5 md:px-2.5 md:py-1 rounded-md shadow-sm">
            Sold Out
          </div>
        )}
        {product.stockQuantity > 0 && product.stockQuantity < 5 && (
          <div className="absolute top-2 left-2 bg-orange-500 text-white text-[8px] md:text-[10px] font-bold px-1.5 py-0.5 md:px-2.5 md:py-1 rounded-md shadow-sm">
            Only {product.stockQuantity} left
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 md:p-5 flex flex-col flex-1">
        <Link to={`/products/${product.id}`}>
          <h3 className="font-bold text-slate-900 text-sm md:text-base mb-0.5 md:mb-1 line-clamp-1 hover:text-rose-800 transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Rating Row */}
        <div className="flex items-center gap-1 md:gap-2 mb-1 md:mb-2">
          {renderStars(averageRating)}
          <span className="text-[10px] md:text-xs text-slate-400">
            {reviewCount > 0 ? `(${reviewCount})` : 'No reviews'}
          </span>
        </div>

        {/* Sales Count */}
        {salesCount > 0 && (
          <div className="flex items-center gap-0.5 md:gap-1 text-[10px] md:text-xs text-emerald-600 mb-2">
            <TrendingUp className="w-2.5 h-2.5 md:w-3 md:h-3" />
            <span className="font-medium">{salesCount} units sold</span>
          </div>
        )}

        {/* Color variations */}
        {product.colorsVariant?.length > 0 && (
          <div className="flex items-center gap-1 mb-2">
            <Palette className="w-3 h-3 text-slate-400 flex-shrink-0" />
            <div className="flex gap-1 flex-wrap">
              {product.colorsVariant.slice(0, 5).map((color: string) => {
                const { cssColor, isLight } = getColorInfo(color);
                return (
                  <span
                    key={color}
                    className="w-4 h-4 rounded-full border shadow-sm"
                    style={{ backgroundColor: cssColor, borderColor: isLight ? '#CBD5E1' : 'transparent' }}
                    title={color}
                  />
                );
              })}
              {product.colorsVariant.length > 5 && (
                <span className="text-[9px] text-slate-400 ml-0.5">+{product.colorsVariant.length - 5}</span>
              )}
            </div>
          </div>
        )}

        {/* Price and Add to Cart - Price on left, Button on right */}
        <div className="flex items-center justify-between mt-auto pt-2 md:pt-3 border-t border-stone-50">
          <span className="text-sm md:text-xl font-bold text-rose-900">₱{product.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>

          <button
            disabled={product.stockQuantity === 0}
            onClick={(e) => onOpenModal(e, product)}
            className="p-1.5 md:p-2.5 bg-rose-950 text-white rounded-md shadow-sm hover:bg-rose-900 disabled:bg-stone-100 disabled:text-stone-300 transition-all active:scale-95"
            title="Add to Cart"
          >
            <ShoppingBag className="w-3 h-3 md:w-4 md:h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
export default Shop;
