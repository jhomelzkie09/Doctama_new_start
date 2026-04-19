import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowRight, Star, Truck, Shield, Clock, TrendingUp,  
  ChevronRight, Sparkles, ShoppingBag, CreditCard, MoveRight, PlayCircle,
  Package
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useOutletContext } from 'react-router-dom';
import productService from '../../services/product.service';
import categoryService from '../../services/category.service';
import orderService from '../../services/order.service';
import reviewService from '../../services/review.service';
import { Product, Category } from '../../types';

interface OutletContextType {
  onAuthRequired?: (mode: 'login' | 'register') => void;
}

interface ProductWithDetails extends Product {
  salesCount: number;
  averageRating: number;
  reviewCount: number;
}

// Default placeholder for categories without products
const DEFAULT_CATEGORY_IMAGE = 'https://images.pexels.com/photos/1571459/pexels-photo-1571459.jpeg?auto=compress&cs=tinysrgb&w=400';

// Skeleton loader for category cards
const CategorySkeleton = () => (
  <div className="animate-pulse">
    <div className="bg-white rounded-xl overflow-hidden border border-stone-100">
      <div className="aspect-square bg-stone-200" />
      <div className="p-2 md:p-3 text-center">
        <div className="h-3 md:h-4 bg-stone-200 rounded w-3/4 mx-auto mb-1" />
        <div className="h-2 md:h-3 bg-stone-200 rounded w-1/2 mx-auto" />
      </div>
    </div>
  </div>
);

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const outletContext = useOutletContext<OutletContextType>();
  const onAuthRequired = outletContext?.onAuthRequired;
  
  const [newArrivals, setNewArrivals] = useState<ProductWithDetails[]>([]);
  const [bestSellers, setBestSellers] = useState<ProductWithDetails[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [allProducts, setAllProducts] = useState<ProductWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'new' | 'bestsellers'>('new');

  // Get the first product image for a category
  const getCategoryImage = (categoryId: number): string => {
    const productInCategory = allProducts.find(p => p.categoryId === categoryId && p.imageUrl);
    return productInCategory?.imageUrl || DEFAULT_CATEGORY_IMAGE;
  };

  const calculateProductSales = async (productId: number): Promise<number> => {
    try {
      const allOrders = await orderService.getAllOrders();
      let totalSold = 0;
      const deliveredOrders = allOrders.filter(order => order.status === 'delivered');
      deliveredOrders.forEach(order => {
        order.items?.forEach(item => {
          const itemProductId = typeof item.productId === 'string' ? parseInt(item.productId) : item.productId;
          if (itemProductId === productId) totalSold += item.quantity;
        });
      });
      return totalSold;
    } catch { return 0; }
  };

  const fetchProductReviews = async (productId: number): Promise<{ averageRating: number; reviewCount: number }> => {
    try {
      const reviews = await reviewService.getProductReviews(productId);
      const reviewCount = reviews.length;
      const averageRating = reviewCount > 0 ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviewCount : 0;
      return { averageRating, reviewCount };
    } catch { return { averageRating: 0, reviewCount: 0 }; }
  };

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    setCategoriesLoading(true);
    try {
      const [productsData, categoriesData] = await Promise.all([
        productService.getProducts(),
        categoryService.getCategories()
      ]);
      
      const activeProducts = productsData.filter(p => p.isActive === true && p.stockQuantity > 0);
      
      const productsWithDetails = await Promise.all(activeProducts.map(async (product) => {
        const salesCount = await calculateProductSales(product.id);
        const { averageRating, reviewCount } = await fetchProductReviews(product.id);
        return { ...product, salesCount, averageRating, reviewCount };
      }));
      
      const sortedBySales = [...productsWithDetails].sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0));
      
      setAllProducts(productsWithDetails);
      setNewArrivals(productsWithDetails.slice(-8).reverse());
      setBestSellers(sortedBySales.slice(0, 8));
      
      const categoriesWithCounts = categoriesData.map(category => ({
        ...category,
        productCount: productsWithDetails.filter(p => p.categoryId === category.id).length
      }));
      
      // Only show categories that have products
      const categoriesWithProducts = categoriesWithCounts.filter(c => c.productCount > 0);
      setCategories(categoriesWithProducts);
      setCategoriesLoading(false);
    } catch (error) {
      console.error('Failed to load data:', error);
      setCategoriesLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (e: React.MouseEvent, product: ProductWithDetails) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { onAuthRequired?.('login'); return; }
    navigate('/shop', { state: { selectedProduct: product, openModal: true } });
  };

  const benefits = [
    { icon: Truck, title: 'Free Shipping', desc: 'On orders over ₱5,000' },
    { icon: Shield, title: '2-Year Warranty', desc: 'Full coverage on all furniture' },
    { icon: Clock, title: 'Fast Delivery', desc: '3-5 day delivery window' },
    { icon: CreditCard, title: 'Flexible Payment', desc: 'Installments available' },
  ];

  const renderStars = (rating: number) => (
    <div className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star key={i} className={`w-3.5 h-3.5 ${i < Math.floor(rating) ? 'text-amber-500 fill-amber-500' : 'text-gray-200'}`} />
      ))}
    </div>
  );

  const heroBackground = "https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=1600";

  return (
    <div className="bg-white selection:bg-rose-100 selection:text-rose-900">

      {/* Hero Section */}
      <section className="relative min-h-[80vh] md:min-h-[90vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroBackground} alt="Modern Living Room" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
        </div>
        
        <div className="container mx-auto px-4 md:px-6 relative z-10 py-12 md:py-0">
          <div className="max-w-3xl space-y-4 md:space-y-8 text-white">
            <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1 rounded-full text-white text-xs md:text-sm font-medium">
              <Sparkles className="w-3 h-3 md:w-4 md:h-4" />
              <span>The 2026 Spring Collection is here</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-serif text-white leading-[1.1] tracking-tight drop-shadow-lg">
              Design for <br />
              <span className="italic text-rose-200">Better Living.</span>
            </h1>
            
            <p className="text-sm md:text-lg text-white/90 max-w-md leading-relaxed drop-shadow-md">
              Experience the harmony of Filipino craftsmanship and modern Scandinavian aesthetics.
            </p>
            
            <div className="flex flex-wrap gap-3 md:gap-5 pt-2 md:pt-4">
              <Link to="/shop" className="px-5 md:px-8 py-2.5 md:py-4 bg-rose-600 text-white rounded-full text-sm md:text-base font-medium hover:bg-rose-700 transition-all transform hover:-translate-y-1 flex items-center shadow-xl shadow-black/20">
                Shop Collection <MoveRight className="w-4 h-4 md:w-5 md:h-5 ml-1 md:ml-2" />
              </Link>
              <button className="flex items-center space-x-2 md:space-x-3 text-white font-semibold group">
                <div className="p-2 md:p-3 rounded-full border border-white/30 group-hover:bg-white/10 transition-all">
                  <PlayCircle className="w-4 h-4 md:w-6 md:h-6" />
                </div>
                <span className="text-sm md:text-base">Watch Lookbook</span>
              </button>
            </div>

            <div className="flex items-center space-x-6 md:space-x-12 pt-6 md:pt-10 border-t border-white/20">
              <div>
                <div className="text-xl md:text-2xl font-bold text-white">12k+</div>
                <div className="text-xs md:text-sm text-white/70 uppercase tracking-widest font-medium">Installs</div>
              </div>
              <div>
                <div className="text-xl md:text-2xl font-bold text-white">4.9/5</div>
                <div className="text-xs md:text-sm text-white/70 uppercase tracking-widest font-medium">Rating</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <div className="py-12 md:py-16 bg-white border-b border-stone-100">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {benefits.map((b, i) => (
              <div key={i} className="flex flex-col items-center text-center space-y-3">
                <div className="p-4 md:p-5 bg-stone-50 rounded-2xl">
                  <b.icon className="w-7 h-7 md:w-8 md:h-8 text-rose-900" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm md:text-base">{b.title}</h4>
                  <p className="text-xs md:text-sm text-slate-500">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Categories Grid - Smaller Cards with Skeleton Loader */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-4xl font-serif text-slate-900 mb-3 md:mb-4">Shop by Category</h2>
            <p className="text-sm md:text-base text-slate-500">Discover our curated collections flowing through timeless design</p>
          </div>
          
          {categoriesLoading ? (
            // Skeleton loader grid
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2 md:gap-3">
              {[...Array(8)].map((_, i) => (
                <CategorySkeleton key={i} />
              ))}
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-stone-300 mx-auto mb-3" />
              <p className="text-slate-500">No categories available</p>
            </div>
          ) : (
            // Smaller category cards - 8 columns on xl screens
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2 md:gap-3">
              {categories.slice(0, 16).map((category) => {
                const imageUrl = getCategoryImage(category.id);
                return (
                  <Link 
                    key={category.id} 
                    to={`/shop?category=${category.id}`} 
                    className="group transform transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="bg-white rounded-lg md:rounded-xl overflow-hidden border border-stone-100 shadow-sm group-hover:shadow-md group-hover:border-transparent transition-all duration-300">
                      <div className="aspect-square overflow-hidden bg-stone-100">
                        <img 
                          src={imageUrl} 
                          alt={category.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = DEFAULT_CATEGORY_IMAGE;
                          }}
                        />
                      </div>
                      <div className="p-2 md:p-2.5 text-center">
                        <h3 className="font-medium text-slate-800 text-[10px] md:text-xs group-hover:text-rose-800 transition-colors line-clamp-1">
                          {category.name}
                        </h3>
                        <span className="text-[8px] md:text-[10px] text-slate-400">
                          {category.productCount || 0} items
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
          
          {!categoriesLoading && categories.length > 0 && (
            <div className="text-center mt-8 md:mt-10">
              <Link to="/shop" className="text-rose-800 font-bold border-b-2 border-rose-800 pb-1 inline-flex items-center group text-sm md:text-base">
                Browse All Categories <ChevronRight className="w-3 h-3 md:w-4 md:h-4 ml-1 group-hover:translate-x-1 transition" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Trending Now */}
      <section className="py-16 md:py-24 bg-[#FBFBFA]">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-8 md:mb-12">
            <span className="text-rose-800 font-bold tracking-widest text-[10px] md:text-xs uppercase">Our Catalog</span>
            <h2 className="text-2xl md:text-4xl font-serif text-slate-900 mt-2 mb-6">Trending Now</h2>
            <div className="inline-flex p-1 bg-stone-200/50 backdrop-blur rounded-xl">
              {[
                { id: 'new', label: 'New Arrivals' },
                { id: 'bestsellers', label: 'Best Sellers' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-5 md:px-8 py-2 md:py-2.5 rounded-lg text-xs md:text-sm font-bold transition-all duration-300 ${
                    activeTab === tab.id ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {loading ? (
              <div className="col-span-full py-20 text-center">
                <div className="animate-spin rounded-full h-8 w-8 md:h-10 md:w-10 border-t-2 border-rose-900 mx-auto" />
              </div>
            ) : (
              (activeTab === 'new' ? newArrivals.slice(0, 4) : bestSellers.slice(0, 4)).map((product) => (
                <div key={product.id} className="group">
                  <div className="relative aspect-[4/5] rounded-xl md:rounded-2xl overflow-hidden bg-stone-100 mb-3 shadow-sm">
                    <Link to={`/products/${product.id}`} className="block w-full h-full">
                      <img src={product.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={product.name} />
                    </Link>
                    <div className="absolute top-2 right-2 md:top-4 md:right-4">
                      <button onClick={(e) => handleAddToCart(e, product)} className="p-2 md:p-3 bg-white/90 backdrop-blur rounded-full shadow-lg hover:bg-rose-900 hover:text-white transition-all transform translate-x-12 group-hover:translate-x-0">
                        <ShoppingBag className="w-3 h-3 md:w-4 md:h-4" />
                      </button>
                    </div>
                    {product.stockQuantity < 5 && product.stockQuantity > 0 && (
                      <div className="absolute top-2 left-2 bg-amber-500 text-white text-[8px] md:text-xs font-bold px-2 py-0.5 rounded-full">Low Stock</div>
                    )}
                  </div>
                  <div>
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-bold text-slate-900 text-xs md:text-base hover:text-rose-800 transition line-clamp-1">
                        <Link to={`/products/${product.id}`}>{product.name}</Link>
                      </h3>
                      <span className="font-bold text-rose-900 text-xs md:text-base">₱{product.price.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1 mb-1">
                      {renderStars(product.averageRating)}
                      <span className="text-[10px] md:text-xs text-slate-400">({product.reviewCount})</span>
                    </div>
                    {product.salesCount > 0 && (
                      <div className="flex items-center gap-1 text-[10px] md:text-xs text-emerald-600">
                        <TrendingUp className="w-2.5 h-2.5 md:w-3 md:h-3" />
                        <span className="font-medium">{product.salesCount} sold</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="text-center mt-10 md:mt-12">
            <Link to="/shop" className="inline-flex items-center gap-2 px-6 md:px-8 py-2.5 md:py-3 border-2 border-rose-200 rounded-full font-bold text-rose-800 text-sm md:text-base hover:bg-rose-50 transition-all">
              Discover All Products <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;