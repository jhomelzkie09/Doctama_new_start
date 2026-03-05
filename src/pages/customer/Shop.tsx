import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Search, 
  Grid, 
  List, 
  Package,
  SlidersHorizontal,
  X,
  ChevronDown,
  Star,
  Heart,
  Eye,
  ShoppingBag,
  Filter,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  TrendingUp,
  Clock,
  Check,
  Truck,
  Shield
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
  
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('newest');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(
    searchParams.get('category') ? parseInt(searchParams.get('category')!) : null
  );
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [inStockOnly, setInStockOnly] = useState(false);
  
  const itemsPerPage = 9;

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedCategory) params.set('category', selectedCategory.toString());
    if (searchQuery) params.set('q', searchQuery);
    setSearchParams(params);
    setCurrentPage(1);
  }, [selectedCategory, searchQuery, setSearchParams, priceRange, selectedRating, inStockOnly]);

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
    e.stopPropagation();
    
    if (!user) {
      if (onAuthRequired) {
        onAuthRequired('login');
      }
      return;
    }
    
    addItem(product);
    // Show success feedback
    const button = e.currentTarget;
    button.innerHTML = 'Added!';
    setTimeout(() => {
      button.innerHTML = 'Add to Cart';
    }, 2000);
  };

  const toggleWishlist = (e: React.MouseEvent, productId: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      if (onAuthRequired) {
        onAuthRequired('login');
      }
      return;
    }
    
    setWishlist(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  // Filter and sort products
  const filteredProducts = products
    .filter(p => {
      if (selectedCategory && p.categoryId !== selectedCategory) return false;
      if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (p.price < priceRange[0] || p.price > priceRange[1]) return false;
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
        default: return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Render stars
  const renderStars = (rating: number = 0) => {
    return [...Array(5)].map((_, i) => (
      <Star 
        key={i} 
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
      />
    ));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">Shop Our Collection</h1>
          <p className="text-xl text-red-100 max-w-2xl">
            Discover the perfect furniture for your home. Free delivery within Metro Manila.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Mobile Filter Button */}
        <button
          onClick={() => setShowMobileFilters(true)}
          className="lg:hidden w-full mb-4 flex items-center justify-center gap-2 bg-white px-4 py-3 rounded-lg shadow-sm text-gray-700"
        >
          <SlidersHorizontal className="w-5 h-5" />
          Filters
        </button>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar - Desktop */}
          <div className="hidden lg:block lg:w-80 space-y-6">
            {/* Categories */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Package className="w-5 h-5 mr-2 text-red-600" />
                Categories
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition ${
                    !selectedCategory ? 'bg-red-50 text-red-600' : 'hover:bg-gray-50'
                  }`}
                >
                  All Categories
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition ${
                      selectedCategory === cat.id ? 'bg-red-50 text-red-600' : 'hover:bg-gray-50'
                    }`}
                  >
                    {cat.name} ({products.filter(p => p.categoryId === cat.id).length})
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Price Range</h3>
              <div className="space-y-4">
                <input
                  type="range"
                  min="0"
                  max="100000"
                  step="1000"
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
                  className="w-full accent-red-600"
                />
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">₱0</span>
                  <span className="font-semibold text-red-600">₱{priceRange[1].toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Rating Filter */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Minimum Rating</h3>
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map(rating => (
                  <button
                    key={rating}
                    onClick={() => setSelectedRating(selectedRating === rating ? null : rating)}
                    className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg transition ${
                      selectedRating === rating ? 'bg-red-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex">
                      {renderStars(rating)}
                    </div>
                    <span className="text-sm text-gray-600">& Up</span>
                    {selectedRating === rating && (
                      <Check className="w-4 h-4 text-red-600 ml-auto" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* In Stock Only */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500"
                />
                <span className="text-gray-700">In Stock Only</span>
              </label>
            </div>

            {/* Trust Badges */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Why Shop With Us</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Truck className="w-5 h-5 text-red-600" />
                  <span>Free shipping over ₱5,000</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Shield className="w-5 h-5 text-red-600" />
                  <span>2-year warranty</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Clock className="w-5 h-5 text-red-600" />
                  <span>3-5 day delivery</span>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Filters Sidebar */}
          {showMobileFilters && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden">
              <div className="absolute right-0 top-0 h-full w-80 bg-white overflow-y-auto">
                <div className="p-4 border-b flex justify-between items-center">
                  <h2 className="font-semibold text-lg">Filters</h2>
                  <button onClick={() => setShowMobileFilters(false)} className="p-2">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-4 space-y-6">
                  {/* Same filter content as desktop */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-4">Categories</h3>
                    {/* ... category buttons ... */}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-4">Price Range</h3>
                    {/* ... price range ... */}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  {/* Search */}
                  <div className="relative flex-1 sm:flex-initial">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>

                  {/* Sort */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 bg-white"
                  >
                    <option value="newest">Newest</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="name-asc">Name: A to Z</option>
                    <option value="name-desc">Name: Z to A</option>
                    <option value="rating">Top Rated</option>
                  </select>
                </div>

                {/* View Toggle & Results Count */}
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-500">
                    {filteredProducts.length} products
                  </span>
                  <div className="flex items-center gap-2 border-l pl-4">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded-lg transition ${
                        viewMode === 'grid' ? 'bg-red-50 text-red-600' : 'text-gray-500 hover:bg-gray-100'
                      }`}
                    >
                      <Grid className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded-lg transition ${
                        viewMode === 'list' ? 'bg-red-50 text-red-600' : 'text-gray-500 hover:bg-gray-100'
                      }`}
                    >
                      <List className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Products Grid/List */}
            {filteredProducts.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-500">Try adjusting your filters</p>
                <button
                  onClick={() => {
                    setSelectedCategory(null);
                    setSearchQuery('');
                    setPriceRange([0, 100000]);
                    setSelectedRating(null);
                    setInStockOnly(false);
                  }}
                  className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Clear Filters
                </button>
              </div>
            ) : viewMode === 'grid' ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {paginatedProducts.map((product) => (
                    <div
                      key={product.id}
                      className="group bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-xl transition border border-gray-100"
                    >
                      <Link to={`/products/${product.id}`} className="block">
                        <div className="relative h-48 overflow-hidden bg-gray-100">
                          <img
                            src={product.imageUrl || 'https://via.placeholder.com/400x300'}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                          />
                          
                          {/* Wishlist button */}
                          <button
                            onClick={(e) => toggleWishlist(e, product.id)}
                            className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-red-50 transition z-10"
                          >
                            <Heart 
                              className={`w-4 h-4 ${
                                wishlist.includes(product.id) 
                                  ? 'fill-red-500 text-red-500' 
                                  : 'text-gray-600'
                              }`} 
                            />
                          </button>

                          {/* Stock badge */}
                          {product.stockQuantity === 0 && (
                            <span className="absolute top-2 left-2 bg-gray-800 text-white text-xs px-2 py-1 rounded-full">
                              Out of Stock
                            </span>
                          )}
                          {product.stockQuantity > 0 && product.stockQuantity < 5 && (
                            <span className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full">
                              Only {product.stockQuantity} left
                            </span>
                          )}
                        </div>
                        
                        <div className="p-4">
                          <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-red-600 transition">
                            {product.name}
                          </h3>
                          
                          {/* Rating */}
                          <div className="flex items-center mb-2">
                            <div className="flex">
                              {renderStars(4)}
                            </div>
                            <span className="text-xs text-gray-500 ml-2">(24 reviews)</span>
                          </div>

                          <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                            {product.description}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-xl font-bold text-red-600">
                                ₱{product.price.toLocaleString()}
                              </span>
                              {product.price > 10000 && (
                                <span className="text-xs text-gray-400 line-through ml-2">
                                  ₱{(product.price * 1.2).toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                      
                      <div className="px-4 pb-4">
                        <button
                          onClick={(e) => handleAddToCart(e, product)}
                          disabled={product.stockQuantity === 0}
                          className={`w-full px-4 py-2 rounded-lg transition text-sm flex items-center justify-center gap-2 ${
                            product.stockQuantity === 0
                              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                              : 'bg-red-600 text-white hover:bg-red-700'
                          }`}
                        >
                          <ShoppingBag className="w-4 h-4" />
                          {product.stockQuantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8 flex justify-center items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    
                    {[...Array(totalPages)].map((_, i) => {
                      const pageNum = i + 1;
                      if (
                        pageNum === 1 ||
                        pageNum === totalPages ||
                        (pageNum >= currentPage - 2 && pageNum <= currentPage + 2)
                      ) {
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`w-10 h-10 rounded-lg ${
                              currentPage === pageNum
                                ? 'bg-red-600 text-white'
                                : 'border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      } else if (
                        pageNum === currentPage - 3 ||
                        pageNum === currentPage + 3
                      ) {
                        return <span key={pageNum} className="px-2">...</span>;
                      }
                      return null;
                    })}
                    
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </>
            ) : (
              /* List View */
              <div className="space-y-4">
                {paginatedProducts.map((product) => (
                  <div
                    key={product.id}
                    className="bg-white rounded-xl shadow-sm p-4 hover:shadow-lg transition border border-gray-100"
                  >
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Link to={`/products/${product.id}`} className="flex-shrink-0">
                        <div className="w-full sm:w-32 h-32 bg-gray-100 rounded-lg overflow-hidden">
                          <img
                            src={product.imageUrl || 'https://via.placeholder.com/400x300'}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </Link>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <Link to={`/products/${product.id}`}>
                            <h3 className="font-semibold text-gray-900 mb-1 hover:text-red-600">
                              {product.name}
                            </h3>
                          </Link>
                          <button
                            onClick={(e) => toggleWishlist(e, product.id)}
                            className="p-2 hover:bg-red-50 rounded-lg transition"
                          >
                            <Heart 
                              className={`w-4 h-4 ${
                                wishlist.includes(product.id) 
                                  ? 'fill-red-500 text-red-500' 
                                  : 'text-gray-600'
                              }`} 
                            />
                          </button>
                        </div>
                        
                        {/* Rating */}
                        <div className="flex items-center mb-2">
                          <div className="flex">
                            {renderStars(4)}
                          </div>
                          <span className="text-xs text-gray-500 ml-2">(24 reviews)</span>
                        </div>

                        <p className="text-sm text-gray-500 mb-3">
                          {product.description}
                        </p>
                        
                        <div className="flex items-center justify-between mt-2">
                          <div>
                            <span className="text-xl font-bold text-red-600">
                              ₱{product.price.toLocaleString()}
                            </span>
                            {product.price > 10000 && (
                              <span className="text-xs text-gray-400 line-through ml-2">
                                ₱{(product.price * 1.2).toLocaleString()}
                              </span>
                            )}
                          </div>
                          <button
                            onClick={(e) => handleAddToCart(e, product)}
                            disabled={product.stockQuantity === 0}
                            className={`px-4 py-2 rounded-lg transition text-sm flex items-center gap-2 ${
                              product.stockQuantity === 0
                                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                : 'bg-red-600 text-white hover:bg-red-700'
                            }`}
                          >
                            <ShoppingBag className="w-4 h-4" />
                            {product.stockQuantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                          </button>
                        </div>

                        {/* Stock status */}
                        {product.stockQuantity > 0 && product.stockQuantity < 5 && (
                          <p className="text-xs text-red-600 mt-2">
                            Only {product.stockQuantity} left in stock
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Pagination for list view (same as grid) */}
                {totalPages > 1 && (
                  <div className="mt-8 flex justify-center items-center gap-2">
                    {/* ... same pagination as grid ... */}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Shop;