import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams, useOutletContext } from 'react-router-dom';
import { 
  Search, Grid, List, Package, SlidersHorizontal, X, 
  Star, Heart, ShoppingBag, ChevronLeft, ChevronRight, 
  Truck, Shield, Clock, Check, Minus, Plus, TrendingUp,
  Sparkles, ArrowRight, Filter
} from 'lucide-react';
import productService from '../../services/product.service';
import categoryService from '../../services/category.service';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { Product, Category } from '../../types';

interface OutletContextType {
  onAuthRequired?: (mode: 'login' | 'register') => void;
}

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
        <Star key={i} className={`w-4 h-4 ${i < rating ? 'text-amber-500 fill-amber-500' : 'text-gray-200'}`} />
      ))}
    </div>
  );

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-[2rem] max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Modal Header */}
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
            {/* Image */}
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

            {/* Info */}
            <div className="md:w-1/2 space-y-5">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  {renderStars(4)}
                  <span className="text-xs text-slate-400">(24 reviews)</span>
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-bold text-rose-900">₱{product.price.toLocaleString()}</span>
                  {product.price > 10000 && (
                    <span className="text-sm text-slate-300 line-through">₱{(product.price * 1.2).toLocaleString()}</span>
                  )}
                </div>
                {product.stockQuantity < 10 && product.stockQuantity > 0 && (
                  <p className="text-xs text-amber-600 font-semibold mt-1">Only {product.stockQuantity} left in stock</p>
                )}
              </div>

              <p className="text-slate-500 text-sm leading-relaxed">{product.description}</p>

              {/* Colors */}
              {product.colorsVariant?.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-3">
                    Color — <span className="text-rose-700">{selectedColor}</span>
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {product.colorsVariant.map((color: string) => (
                      <button key={color} onClick={() => setSelectedColor(color)}
                        className={`w-9 h-9 rounded-full border-2 transition-all ${selectedColor === color ? 'border-rose-500 ring-2 ring-rose-100 scale-110' : 'border-stone-200 hover:border-stone-300'}`}
                        style={{ backgroundColor: color.toLowerCase() }} title={color}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity */}
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

              {/* Total */}
              <div className="bg-stone-50 rounded-xl px-5 py-4 flex justify-between items-center">
                <span className="text-sm text-slate-500 font-medium">Subtotal</span>
                <span className="text-2xl font-bold text-rose-900">₱{(product.price * quantity).toLocaleString()}</span>
              </div>

              {/* Actions */}
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
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [priceRange, setPriceRange] = useState<number>(100000);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(
    searchParams.get('category') ? parseInt(searchParams.get('category')!) : null
  );
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [inStockOnly, setInStockOnly] = useState(false);

  const itemsPerPage = 9;

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedCategory) params.set('category', selectedCategory.toString());
    if (searchQuery) params.set('q', searchQuery);
    setSearchParams(params);
    setCurrentPage(1);
  }, [selectedCategory, searchQuery, priceRange, selectedRating, inStockOnly, setSearchParams]);

  const loadData = async () => {
    try {
      const [productsData, categoriesData] = await Promise.all([
        productService.getProducts(),
        categoryService.getCategories()
      ]);
      setProducts(productsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCartWithOptions = (product: Product, quantity: number, color: string) => {
    for (let i = 0; i < quantity; i++) addItem(product, color);
  };

  const handleOpenModal = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { if (onAuthRequired) onAuthRequired('login'); return; }
    setSelectedProduct(product);
    setShowModal(true);
  };

  const toggleWishlist = (e: React.MouseEvent, productId: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { if (onAuthRequired) onAuthRequired('login'); return; }
    setWishlist(prev => prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]);
  };

  const filteredProducts = useMemo(() => {
    return products
      .filter(p => {
        if (selectedCategory && p.categoryId !== selectedCategory) return false;
        if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        if (p.price > priceRange) return false;
        if (selectedRating && (p.rating || 0) < selectedRating) return false;
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
          default: return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
        }
      });
  }, [products, selectedCategory, searchQuery, priceRange, selectedRating, inStockOnly, sortBy]);

  const paginatedProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const renderStars = (rating: number = 0) => (
    <div className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star key={i} className={`w-3.5 h-3.5 ${i < rating ? 'text-amber-500 fill-amber-500' : 'text-gray-200'}`} />
      ))}
    </div>
  );

  const activeFilterCount = [
    selectedCategory !== null,
    priceRange < 100000,
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
              ({products.length})
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
                ({products.filter(p => p.categoryId === cat.id).length})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Price Range</h3>
        <input
          type="range" min="1000" max="150000" step="1000" value={priceRange}
          onChange={(e) => setPriceRange(parseInt(e.target.value))}
          className="w-full accent-rose-700 mb-3"
        />
        <div className="flex justify-between">
          <span className="text-xs text-slate-400 bg-stone-100 px-3 py-1 rounded-lg">₱1,000</span>
          <span className="text-xs font-bold text-rose-800 bg-rose-50 px-3 py-1 rounded-lg">₱{priceRange.toLocaleString()}</span>
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
              {renderStars(rating)}
              <span className="text-xs font-medium">& Up</span>
              {selectedRating === rating && <Check className="w-3.5 h-3.5 text-rose-700 ml-auto" />}
            </button>
          ))}
        </div>
      </div>

      {/* In Stock */}
      <label className="flex items-center gap-3 cursor-pointer px-4 py-3 border border-stone-100 rounded-xl hover:bg-stone-50 transition">
        <input
          type="checkbox" checked={inStockOnly}
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
          onClick={() => { setSelectedCategory(null); setPriceRange(100000); setSelectedRating(null); setInStockOnly(false); }}
          className="w-full py-2.5 text-xs font-bold text-rose-700 border border-rose-200 rounded-xl hover:bg-rose-50 transition"
        >
          Clear All Filters ({activeFilterCount})
        </button>
      )}
    </div>
  );

  if (loading) return (
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

        {/* ─── Hero ─── */}
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

              {/* Search bar in hero */}
              <div className="md:w-80">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search furniture…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-white/10 backdrop-blur border border-white/20 rounded-xl text-white placeholder-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-white/30 transition"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Results Bar ─── */}
        <div className="bg-white border-b border-stone-100 sticky top-0 z-30">
          <div className="container mx-auto px-6 py-3 flex items-center justify-between gap-4">
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
                <option value="price-low">Price: Low → High</option>
                <option value="price-high">Price: High → Low</option>
                <option value="rating">Top Rated</option>
                <option value="name-asc">Name A–Z</option>
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

        {/* ─── Main Layout ─── */}
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
                    onClick={() => { setSearchQuery(''); setSelectedCategory(null); setPriceRange(100000); setSelectedRating(null); setInStockOnly(false); }}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-rose-950 text-white rounded-xl text-sm font-bold hover:bg-rose-900 transition"
                  >
                    Clear All Filters
                  </button>
                </div>
              ) : (
                <>
                  <div className={
                    viewMode === 'grid'
                      ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6'
                      : 'space-y-4'
                  }>
                    {paginatedProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        viewMode={viewMode}
                        isWishlisted={wishlist.includes(product.id)}
                        onToggleWishlist={toggleWishlist}
                        onOpenModal={handleOpenModal}
                        renderStars={renderStars}
                      />
                    ))}
                  </div>

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
                      {[...Array(totalPages)].map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setCurrentPage(i + 1)}
                          className={`w-11 h-11 rounded-xl font-bold text-sm transition-all ${
                            currentPage === i + 1
                              ? 'bg-rose-950 text-white shadow-lg'
                              : 'bg-white text-slate-600 hover:bg-stone-50 border border-stone-100'
                          }`}
                        >
                          {i + 1}
                        </button>
                      ))}
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
const ProductCard = ({ product, viewMode, isWishlisted, onToggleWishlist, onOpenModal, renderStars }: any) => {
  const isGrid = viewMode === 'grid';

  const hasDiscount = product.originalPrice && product.originalPrice > product.price;
  const discountPercent = hasDiscount ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;
  const reviewCount = product.reviewCount || product.reviews?.length || 0;
  const averageRating = product.rating || (reviewCount > 0 ? 4 : 0);
  const salesCount = product.salesCount || 0;
  const isBestSeller = salesCount > 100;
  const isTopRated = averageRating >= 4.5 && !isBestSeller;

  return (
    <div className={`group bg-white rounded-2xl border border-stone-100 overflow-hidden hover:shadow-xl hover:border-transparent hover:-translate-y-1 transition-all duration-300 ${!isGrid && 'flex'}`}>
      
      {/* Image */}
      <div className={`relative overflow-hidden bg-stone-50 ${isGrid ? 'aspect-[4/3]' : 'w-52 flex-shrink-0'}`}>
        <Link to={`/products/${product.id}`} className="block w-full h-full">
          <img
            src={product.imageUrl || 'https://via.placeholder.com/400'}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
        </Link>

        {/* Badges */}
        {isBestSeller && (
          <div className="absolute top-3 left-3 bg-amber-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
            Best Seller
          </div>
        )}
        {isTopRated && (
          <div className="absolute top-3 left-3 bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
            Top Rated
          </div>
        )}
        {hasDiscount && discountPercent > 0 && !isBestSeller && !isTopRated && (
          <div className="absolute top-3 left-3 bg-rose-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
            -{discountPercent}%
          </div>
        )}
        {product.stockQuantity === 0 && (
          <div className="absolute top-3 left-3 bg-slate-800 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
            Sold Out
          </div>
        )}
        {product.stockQuantity > 0 && product.stockQuantity < 5 && (
          <div className="absolute top-3 left-3 bg-orange-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
            Only {product.stockQuantity} left
          </div>
        )}

        {/* Sales count */}
        {salesCount > 0 && (
          <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-md text-white text-[10px] font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            {salesCount}+ sold
          </div>
        )}

        {/* Wishlist button */}
        <button
          onClick={(e) => onToggleWishlist(e, product.id)}
          className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur rounded-full shadow-sm hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100"
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-rose-600 text-rose-600' : 'text-slate-400'}`} />
        </button>

        {/* Add to cart overlay on hover */}
        <div className="absolute bottom-0 inset-x-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <button
            disabled={product.stockQuantity === 0}
            onClick={(e) => onOpenModal(e, product)}
            className="w-full py-2.5 bg-rose-950 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-rose-900 disabled:bg-slate-300 disabled:text-slate-500 transition"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            {product.stockQuantity === 0 ? 'Out of Stock' : 'Add to Cart'}
          </button>
        </div>
      </div>

      {/* Info */}
      <div className={`p-5 flex flex-col flex-1 ${!isGrid && 'justify-center'}`}>
        <Link to={`/products/${product.id}`}>
          <h3 className="font-bold text-slate-900 text-base mb-1 line-clamp-1 hover:text-rose-800 transition-colors">
            {product.name}
          </h3>
        </Link>

        <div className="flex items-center gap-2 mb-3">
          {renderStars(Math.round(averageRating))}
          <span className="text-xs text-slate-400">
            {reviewCount > 0 ? `(${reviewCount})` : 'No reviews'}
          </span>
        </div>

        {isGrid && (
          <p className="text-slate-400 text-xs leading-relaxed line-clamp-2 mb-4">{product.description}</p>
        )}

        <div className="flex items-center justify-between mt-auto pt-4 border-t border-stone-50">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-rose-900">₱{product.price.toLocaleString()}</span>
              {hasDiscount && (
                <span className="text-xs text-slate-300 line-through">₱{Math.round(product.originalPrice).toLocaleString()}</span>
              )}
            </div>
            {hasDiscount && (
              <span className="text-[10px] text-emerald-600 font-bold">Save ₱{(product.originalPrice - product.price).toLocaleString()}</span>
            )}
          </div>

          {/* Mobile-visible cart button (hidden in grid since hover overlay handles it) */}
          <button
            disabled={product.stockQuantity === 0}
            onClick={(e) => onOpenModal(e, product)}
            className={`p-2.5 bg-rose-950 text-white rounded-xl hover:bg-rose-900 disabled:bg-stone-100 disabled:text-stone-300 transition-all active:scale-95 ${isGrid ? 'lg:hidden' : ''}`}
          >
            <ShoppingBag className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Shop;