import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Search, Grid, List, Package, SlidersHorizontal, X, 
  Star, Heart, ShoppingBag, ChevronLeft, ChevronRight, 
  Truck, Shield, Clock, Check 
} from 'lucide-react';
import productService from '../../services/product.service';
import categoryService from '../../services/category.service';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { Product, Category } from '../../types';

interface ShopProps {
  onAuthRequired?: (mode: 'login' | 'register') => void;
}

const Shop: React.FC<ShopProps> = ({ onAuthRequired }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { addItem } = useCart();
  
  // Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  // UI State
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [wishlist, setWishlist] = useState<number[]>([]);
  
  // Filter State
  const [sortBy, setSortBy] = useState('newest');
  const [priceRange, setPriceRange] = useState<number>(100000);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(
    searchParams.get('category') ? parseInt(searchParams.get('category')!) : null
  );
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [inStockOnly, setInStockOnly] = useState(false);
  
  const itemsPerPage = 9;

  useEffect(() => {
    loadData();
  }, []);

  // Sync state with URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedCategory) params.set('category', selectedCategory.toString());
    if (searchQuery) params.set('q', searchQuery);
    setSearchParams(params);
    setCurrentPage(1);
  }, [selectedCategory, searchQuery, priceRange, selectedRating, inStockOnly]);

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

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    if (!user) return onAuthRequired?.('login');
    addItem(product);
    
    const button = e.currentTarget;
    const originalText = button.innerHTML;
    button.innerHTML = 'Added!';
    setTimeout(() => { button.innerHTML = originalText; }, 2000);
  };

  const toggleWishlist = (e: React.MouseEvent, productId: number) => {
    e.preventDefault();
    if (!user) return onAuthRequired?.('login');
    setWishlist(prev => prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]);
  };

  // Memoized Filtered Products
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
    <div className="flex">
      {[...Array(5)].map((_, i) => (
        <Star key={i} className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
      ))}
    </div>
  );

  // REUSABLE FILTER COMPONENT
  const FilterContent = () => (
    <div className="space-y-6">
      {/* Categories */}
      <div className="bg-white lg:bg-transparent rounded-xl p-0 lg:p-0">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
          <Package className="w-5 h-5 mr-2 text-red-600" /> Categories
        </h3>
        <div className="space-y-1">
          <button onClick={() => setSelectedCategory(null)}
            className={`w-full text-left px-3 py-2 rounded-lg transition ${!selectedCategory ? 'bg-red-50 text-red-600 font-medium' : 'hover:bg-gray-50'}`}>
            All Categories
          </button>
          {categories.map(cat => (
            <button key={cat.id} onClick={() => setSelectedCategory(cat.id)}
              className={`w-full text-left px-3 py-2 rounded-lg transition ${selectedCategory === cat.id ? 'bg-red-50 text-red-600 font-medium' : 'hover:bg-gray-50'}`}>
              {cat.name} <span className="text-gray-400 text-xs ml-1">({products.filter(p => p.categoryId === cat.id).length})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-4">Max Price: ₱{priceRange.toLocaleString()}</h3>
        <input type="range" min="1000" max="150000" step="1000" value={priceRange} 
          onChange={(e) => setPriceRange(parseInt(e.target.value))} className="w-full accent-red-600" />
      </div>

      {/* Ratings */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-4">Minimum Rating</h3>
        {[5, 4, 3, 2, 1].map(rating => (
          <button key={rating} onClick={() => setSelectedRating(selectedRating === rating ? null : rating)}
            className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg transition ${selectedRating === rating ? 'bg-red-50' : 'hover:bg-gray-50'}`}>
            {renderStars(rating)} <span className="text-sm text-gray-600">& Up</span>
            {selectedRating === rating && <Check className="w-4 h-4 text-red-600 ml-auto" />}
          </button>
        ))}
      </div>

      {/* Availability */}
      <label className="flex items-center gap-3 cursor-pointer p-3 border rounded-xl hover:bg-gray-50">
        <input type="checkbox" checked={inStockOnly} onChange={(e) => setInStockOnly(e.target.checked)} className="w-4 h-4 text-red-600 rounded" />
        <span className="text-sm font-medium text-gray-700">In Stock Only</span>
      </label>

      {/* Trust Badges */}
      <div className="pt-6 border-t border-gray-100 hidden lg:block">
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-sm text-gray-600"><Truck className="w-5 h-5 text-red-600" /> <span>Free shipping over ₱5,000</span></div>
          <div className="flex items-center gap-3 text-sm text-gray-600"><Shield className="w-5 h-5 text-red-600" /> <span>2-year warranty</span></div>
        </div>
      </div>
    </div>
  );

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Hero */}
      <div className="bg-gradient-to-r from-red-600 to-red-800 text-white py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-5xl font-extrabold mb-4 tracking-tight">Modern Living.</h1>
          <p className="text-xl text-red-100 max-w-xl">Premium furniture designed for comfort and style. Delivered and assembled in Metro Manila.</p>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Sidebar - Desktop */}
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-24">
              <FilterContent />
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {/* Toolbar */}
            <div className="bg-white rounded-2xl shadow-sm p-4 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input type="text" placeholder="Search furniture..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-red-500" />
              </div>
              
              <div className="flex items-center gap-4 w-full md:w-auto">
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-gray-50 border-none rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-red-500">
                  <option value="newest">Newest Arrivals</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Top Rated</option>
                </select>
                
                <div className="flex bg-gray-50 p-1 rounded-xl">
                  <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-white shadow-sm text-red-600' : 'text-gray-400'}`}><Grid className="w-5 h-5"/></button>
                  <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-white shadow-sm text-red-600' : 'text-gray-400'}`}><List className="w-5 h-5"/></button>
                </div>
                
                <button onClick={() => setShowMobileFilters(true)} className="lg:hidden p-2.5 bg-red-600 text-white rounded-xl"><SlidersHorizontal className="w-5 h-5"/></button>
              </div>
            </div>

            {/* Product Display */}
            {filteredProducts.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl shadow-sm">
                <Package className="w-20 h-20 text-gray-200 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-800">No matches found</h2>
                <p className="text-gray-500">Try adjusting your filters or search query.</p>
              </div>
            ) : (
              <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" : "space-y-4"}>
                {paginatedProducts.map((product) => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    viewMode={viewMode} 
                    isWishlisted={wishlist.includes(product.id)}
                    onToggleWishlist={toggleWishlist}
                    onAddToCart={handleAddToCart}
                    renderStars={renderStars}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-12 gap-2">
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-2 bg-white rounded-xl shadow-sm disabled:opacity-50"><ChevronLeft/></button>
                {[...Array(totalPages)].map((_, i) => (
                  <button key={i} onClick={() => setCurrentPage(i + 1)} className={`w-10 h-10 rounded-xl font-bold transition ${currentPage === i + 1 ? 'bg-red-600 text-white shadow-lg' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>{i + 1}</button>
                ))}
                <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="p-2 bg-white rounded-xl shadow-sm disabled:opacity-50"><ChevronRight/></button>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Sidebar Modal */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowMobileFilters(false)} />
          <div className="absolute right-0 top-0 h-full w-full max-w-xs bg-white shadow-2xl p-6 overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold">Filters</h2>
              <button onClick={() => setShowMobileFilters(false)} className="p-2 bg-gray-100 rounded-full"><X/></button>
            </div>
            <FilterContent />
          </div>
        </div>
      )}
    </div>
  );
};

// Sub-component for Product Card to keep main component clean
const ProductCard = ({ product, viewMode, isWishlisted, onToggleWishlist, onAddToCart, renderStars }: any) => {
  const isGrid = viewMode === 'grid';

  return (
    <div className={`group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 ${!isGrid && 'flex'}`}>
      <div className={`relative overflow-hidden bg-gray-100 ${isGrid ? 'h-64' : 'w-48 h-48 flex-shrink-0'}`}>
        <img src={product.imageUrl || 'https://via.placeholder.com/400'} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
        <button onClick={(e) => onToggleWishlist(e, product.id)} className="absolute top-3 right-3 p-2.5 bg-white/90 backdrop-blur-md rounded-full shadow-sm hover:bg-red-50">
          <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
        </button>
        {product.stockQuantity < 5 && product.stockQuantity > 0 && (
          <div className="absolute top-3 left-3 bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider">Low Stock</div>
        )}
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-red-600 transition truncate">{product.name}</h3>
          <div className="flex items-center gap-2 mb-3">
            {renderStars(4)}
            <span className="text-xs text-gray-400 font-medium">(24)</span>
          </div>
          {isGrid && <p className="text-gray-500 text-sm line-clamp-2 mb-4 leading-relaxed">{product.description}</p>}
        </div>

        <div className="flex items-center justify-between mt-auto">
          <div>
            <span className="text-2xl font-black text-red-600">₱{product.price.toLocaleString()}</span>
          </div>
          <button 
            disabled={product.stockQuantity === 0}
            onClick={(e) => onAddToCart(e, product)}
            className="p-3 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:bg-gray-200 disabled:text-gray-400 transition-colors shadow-lg shadow-red-100"
          >
            <ShoppingBag className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Shop;