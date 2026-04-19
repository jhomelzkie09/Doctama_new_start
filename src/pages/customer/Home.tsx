import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowRight, Star, Truck, Shield, Clock, TrendingUp,  
  ChevronRight, Sparkles, ShoppingBag, CreditCard, MoveRight, PlayCircle,
  ChevronLeft, ChevronRight as ChevronRightIcon
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

// Real category images from Unsplash/Pexels (high quality, free to use)
const categoryImages: Record<string, string> = {
  'Living Room': 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=400',
  'Sofa': 'https://images.pexels.com/photos/1866149/pexels-photo-1866149.jpeg?auto=compress&cs=tinysrgb&w=400',
  'Couch': 'https://images.pexels.com/photos/276551/pexels-photo-276551.jpeg?auto=compress&cs=tinysrgb&w=400',
  'Bedroom': 'https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg?auto=compress&cs=tinysrgb&w=400',
  'Bed': 'https://images.pexels.com/photos/2029722/pexels-photo-2029722.jpeg?auto=compress&cs=tinysrgb&w=400',
  'Mattress': 'https://images.pexels.com/photos/775219/pexels-photo-775219.jpeg?auto=compress&cs=tinysrgb&w=400',
  'Dining Room': 'https://images.pexels.com/photos/1080696/pexels-photo-1080696.jpeg?auto=compress&cs=tinysrgb&w=400',
  'Dining Table': 'https://images.pexels.com/photos/1080721/pexels-photo-1080721.jpeg?auto=compress&cs=tinysrgb&w=400',
  'Office': 'https://images.pexels.com/photos/159839/office-home-house-desk-159839.jpeg?auto=compress&cs=tinysrgb&w=400',
  'Desk': 'https://images.pexels.com/photos/509922/pexels-photo-509922.jpeg?auto=compress&cs=tinysrgb&w=400',
  'Chair': 'https://images.pexels.com/photos/116910/pexels-photo-116910.jpeg?auto=compress&cs=tinysrgb&w=400',
  'Kitchen': 'https://images.pexels.com/photos/1080721/pexels-photo-1080721.jpeg?auto=compress&cs=tinysrgb&w=400',
  'Cabinet': 'https://images.pexels.com/photos/2062426/pexels-photo-2062426.jpeg?auto=compress&cs=tinysrgb&w=400',
  'Outdoor': 'https://images.pexels.com/photos/280221/pexels-photo-280221.jpeg?auto=compress&cs=tinysrgb&w=400',
  'Garden': 'https://images.pexels.com/photos/158028/bellingrath-gardens-alabama-landscape-scenic-158028.jpeg?auto=compress&cs=tinysrgb&w=400',
  'Kids Room': 'https://images.pexels.com/photos/3932930/pexels-photo-3932930.jpeg?auto=compress&cs=tinysrgb&w=400',
  'Bathroom': 'https://images.pexels.com/photos/1910472/pexels-photo-1910472.jpeg?auto=compress&cs=tinysrgb&w=400',
  'Entryway': 'https://images.pexels.com/photos/2635038/pexels-photo-2635038.jpeg?auto=compress&cs=tinysrgb&w=400',
  'Home Decor': 'https://images.pexels.com/photos/1248583/pexels-photo-1248583.jpeg?auto=compress&cs=tinysrgb&w=400',
  'Furniture': 'https://images.pexels.com/photos/276551/pexels-photo-276551.jpeg?auto=compress&cs=tinysrgb&w=400',
  'Lighting': 'https://images.pexels.com/photos/1112598/pexels-photo-1112598.jpeg?auto=compress&cs=tinysrgb&w=400',
  'Lamp': 'https://images.pexels.com/photos/112811/pexels-photo-112811.jpeg?auto=compress&cs=tinysrgb&w=400',
  'Storage': 'https://images.pexels.com/photos/4226783/pexels-photo-4226783.jpeg?auto=compress&cs=tinysrgb&w=400',
  'Shelf': 'https://images.pexels.com/photos/1468390/pexels-photo-1468390.jpeg?auto=compress&cs=tinysrgb&w=400',
  'Rugs': 'https://images.pexels.com/photos/1454806/pexels-photo-1454806.jpeg?auto=compress&cs=tinysrgb&w=400',
  'Carpet': 'https://images.pexels.com/photos/1454806/pexels-photo-1454806.jpeg?auto=compress&cs=tinysrgb&w=400',
  'Mirrors': 'https://images.pexels.com/photos/2050729/pexels-photo-2050729.jpeg?auto=compress&cs=tinysrgb&w=400',
  'Wall Art': 'https://images.pexels.com/photos/1166657/pexels-photo-1166657.jpeg?auto=compress&cs=tinysrgb&w=400',
  'Plants': 'https://images.pexels.com/photos/3094799/pexels-photo-3094799.jpeg?auto=compress&cs=tinysrgb&w=400',
  'Plant': 'https://images.pexels.com/photos/3076899/pexels-photo-3076899.jpeg?auto=compress&cs=tinysrgb&w=400',
  'Accessories': 'https://images.pexels.com/photos/1441122/pexels-photo-1441122.jpeg?auto=compress&cs=tinysrgb&w=400',
  'Table': 'https://images.pexels.com/photos/1080696/pexels-photo-1080696.jpeg?auto=compress&cs=tinysrgb&w=400',
  'Wardrobe': 'https://images.pexels.com/photos/271639/pexels-photo-271639.jpeg?auto=compress&cs=tinysrgb&w=400',
  'Dresser': 'https://images.pexels.com/photos/271639/pexels-photo-271639.jpeg?auto=compress&cs=tinysrgb&w=400',
  'Bookshelf': 'https://images.pexels.com/photos/290595/pexels-photo-290595.jpeg?auto=compress&cs=tinysrgb&w=400',
  'TV Stand': 'https://images.pexels.com/photos/1571459/pexels-photo-1571459.jpeg?auto=compress&cs=tinysrgb&w=400',
  'Coffee Table': 'https://images.pexels.com/photos/1080696/pexels-photo-1080696.jpeg?auto=compress&cs=tinysrgb&w=400',
  'Side Table': 'https://images.pexels.com/photos/1080696/pexels-photo-1080696.jpeg?auto=compress&cs=tinysrgb&w=400',
  'Console Table': 'https://images.pexels.com/photos/2635038/pexels-photo-2635038.jpeg?auto=compress&cs=tinysrgb&w=400',
  'Bench': 'https://images.pexels.com/photos/280221/pexels-photo-280221.jpeg?auto=compress&cs=tinysrgb&w=400',
  'Stool': 'https://images.pexels.com/photos/116910/pexels-photo-116910.jpeg?auto=compress&cs=tinysrgb&w=400',
  'Ottoman': 'https://images.pexels.com/photos/276551/pexels-photo-276551.jpeg?auto=compress&cs=tinysrgb&w=400',
  'default': 'https://images.pexels.com/photos/1571459/pexels-photo-1571459.jpeg?auto=compress&cs=tinysrgb&w=400'
};

const getCategoryImage = (categoryName: string): string => {
  const name = categoryName.toLowerCase();
  
  // Try exact match first
  for (const [key, value] of Object.entries(categoryImages)) {
    if (name === key.toLowerCase()) {
      return value;
    }
  }
  
  // Try partial match
  for (const [key, value] of Object.entries(categoryImages)) {
    if (name.includes(key.toLowerCase()) || key.toLowerCase().includes(name)) {
      return value;
    }
  }
  
  return categoryImages['default'];
};

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const outletContext = useOutletContext<OutletContextType>();
  const onAuthRequired = outletContext?.onAuthRequired;
  
  const [newArrivals, setNewArrivals] = useState<ProductWithDetails[]>([]);
  const [bestSellers, setBestSellers] = useState<ProductWithDetails[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'new' | 'bestsellers'>('new');
  
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(6);
  const [isAnimating, setIsAnimating] = useState(false);
  const carouselIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  const calculateProductSales = async (productId: number): Promise<number> => {
    try {
      const allOrders = await orderService.getAllOrders();
      let totalSold = 0;
      const deliveredOrders = allOrders.filter(order => order.status === 'delivered');
      
      deliveredOrders.forEach(order => {
        order.items?.forEach(item => {
          const itemProductId = typeof item.productId === 'string' ? parseInt(item.productId) : item.productId;
          if (itemProductId === productId) {
            totalSold += item.quantity;
          }
        });
      });
      return totalSold;
    } catch (error) {
      console.error('Failed to calculate product sales:', error);
      return 0;
    }
  };

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

  useEffect(() => { 
    loadData(); 
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) setItemsPerView(2);
      else if (window.innerWidth < 768) setItemsPerView(3);
      else if (window.innerWidth < 1024) setItemsPerView(4);
      else if (window.innerWidth < 1280) setItemsPerView(5);
      else setItemsPerView(6);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (categories.length > itemsPerView && !isAnimating) {
      carouselIntervalRef.current = setInterval(() => {
        setCurrentCategoryIndex(prev => {
          const maxIndex = categories.length - itemsPerView;
          if (prev >= maxIndex) return 0;
          return prev + 1;
        });
      }, 3000);
    }
    return () => {
      if (carouselIntervalRef.current) clearInterval(carouselIntervalRef.current);
    };
  }, [categories.length, itemsPerView, isAnimating]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [productsData, categoriesData] = await Promise.all([
        productService.getProducts(),
        categoryService.getCategories()
      ]);
      
      const activeProducts = productsData.filter(product => 
        product.isActive === true && product.stockQuantity > 0
      );
      
      const productsWithDetails = await Promise.all(activeProducts.map(async (product) => {
        const salesCount = await calculateProductSales(product.id);
        const { averageRating, reviewCount } = await fetchProductReviews(product.id);
        return { 
          ...product, 
          salesCount,
          averageRating,
          reviewCount
        };
      }));
      
      const sortedBySales = [...productsWithDetails].sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0));
      
      setNewArrivals(productsWithDetails.slice(-8).reverse()); // Latest 8 products
      setBestSellers(sortedBySales.slice(0, 8)); // Top 8 best sellers
      
      const categoriesWithCounts = categoriesData.map(category => {
        const productCount = productsWithDetails.filter(product => product.categoryId === category.id).length;
        return { ...category, productCount };
      });
      
      setCategories(categoriesWithCounts);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (e: React.MouseEvent, product: ProductWithDetails) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      if (onAuthRequired) onAuthRequired('login');
      return;
    }
    navigate('/shop', { state: { selectedProduct: product, openModal: true } });
  };

  const restartCarousel = () => {
    setTimeout(() => {
      if (!carouselIntervalRef.current && categories.length > itemsPerView) {
        carouselIntervalRef.current = setInterval(() => {
          setCurrentCategoryIndex(prev => {
            const maxIndex = categories.length - itemsPerView;
            if (prev >= maxIndex) return 0;
            return prev + 1;
          });
        }, 3000);
      }
    }, 5000);
  };

  const handlePrevCategory = () => {
    if (carouselIntervalRef.current) { clearInterval(carouselIntervalRef.current); carouselIntervalRef.current = null; }
    setIsAnimating(true);
    setCurrentCategoryIndex(prev => Math.max(0, prev - 1));
    setTimeout(() => setIsAnimating(false), 500);
    restartCarousel();
  };

  const handleNextCategory = () => {
    if (carouselIntervalRef.current) { clearInterval(carouselIntervalRef.current); carouselIntervalRef.current = null; }
    setIsAnimating(true);
    setCurrentCategoryIndex(prev => Math.min(categories.length - itemsPerView, prev + 1));
    setTimeout(() => setIsAnimating(false), 500);
    restartCarousel();
  };

  const visibleCategories = categories.slice(currentCategoryIndex, currentCategoryIndex + itemsPerView);
  const canScrollPrev = currentCategoryIndex > 0;
  const canScrollNext = currentCategoryIndex + itemsPerView < categories.length;
  const totalSlides = Math.ceil(categories.length / itemsPerView);

  const benefits = [
    { icon: Truck, title: 'Free Shipping', desc: 'Over ₱5,000' },
    { icon: Shield, title: '2-Year Warranty', desc: 'Full coverage' },
    { icon: Clock, title: 'Fast Delivery', desc: '3-day window' },
    { icon: CreditCard, title: 'Flexi-Payment', desc: 'Installments' },
  ];

  const renderStars = (rating: number) => (
    <div className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star key={i} className={`w-3.5 h-3.5 ${i < Math.floor(rating) ? 'text-amber-500 fill-amber-500' : 'text-gray-200'}`} />
      ))}
    </div>
  );

  const heroImages = [
    {
      url: "https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=1200",
      alt: "Modern Scandinavian Living Room",
      title: "Scandinavian Elegance",
      description: "Minimalist design meets comfort"
    },
    {
      url: "https://images.pexels.com/photos/1571459/pexels-photo-1571459.jpeg?auto=compress&cs=tinysrgb&w=1200",
      alt: "Contemporary Interior Design",
      title: "Contemporary Comfort",
      description: "Modern aesthetics for modern living"
    },
    {
      url: "https://images.pexels.com/photos/1571463/pexels-photo-1571463.jpeg?auto=compress&cs=tinysrgb&w=1200",
      alt: "Minimalist Home Decor",
      title: "Minimalist Harmony",
      description: "Less is more, beautifully executed"
    },
    {
      url: "https://images.pexels.com/photos/1571468/pexels-photo-1571468.jpeg?auto=compress&cs=tinysrgb&w=1200",
      alt: "Cozy Living Room",
      title: "Warm & Cozy",
      description: "Create your perfect sanctuary"
    }
  ];
  
  const [currentHeroImage, setCurrentHeroImage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHeroImage((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white selection:bg-rose-100 selection:text-rose-900">

      {/* Hero Section */}
      <section className="relative min-h-[80vh] md:min-h-[90vh] flex items-center bg-[#F9F8F6] overflow-hidden">
        <div className="absolute inset-0">
          {heroImages.map((image, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                currentHeroImage === index ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <img src={image.url} alt={image.alt} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
            </div>
          ))}
        </div>
        
        <div className="container mx-auto px-4 md:px-6 relative z-10 py-12 md:py-0">
          <div className="grid lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-6 space-y-4 md:space-y-8 text-white">
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
            
            <div className="lg:col-span-6 hidden lg:block relative">
              <div className="absolute bottom-4 right-4 z-20 flex gap-2">
                {heroImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentHeroImage(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      currentHeroImage === index ? 'w-6 bg-white' : 'bg-white/50 hover:bg-white/70'
                    }`}
                  />
                ))}
              </div>
              <div className="relative z-10 rounded-[2rem] overflow-hidden shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-700">
                <img 
                  src={heroImages[currentHeroImage].url}
                  alt={heroImages[currentHeroImage].alt}
                  className="w-full h-[500px] lg:h-[600px] object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
                  <p className="text-white text-sm font-medium">{heroImages[currentHeroImage].description}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="absolute bottom-4 md:bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce hidden md:block">
          <div className="w-5 h-8 md:w-6 md:h-10 border-2 border-white/40 rounded-full flex justify-center">
            <div className="w-1 h-2 bg-white/60 rounded-full mt-2 animate-pulse" />
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <div className="py-8 md:py-12 bg-white border-b border-stone-100">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {benefits.map((b, i) => (
              <div key={i} className="flex items-center space-x-3 md:space-x-4">
                <div className="p-2 md:p-3 bg-stone-50 rounded-xl">
                  <b.icon className="w-4 h-4 md:w-6 md:h-6 text-rose-900" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs md:text-sm">{b.title}</h4>
                  <p className="text-[10px] md:text-xs text-slate-500 uppercase tracking-tighter">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Categories Carousel with Real Images */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-12 gap-4 md:gap-6">
            <div className="max-w-xl">
              <h2 className="text-2xl md:text-4xl font-serif text-slate-900 mb-2 md:mb-4">Shop by Category</h2>
              <p className="text-sm md:text-base text-slate-500">Discover our curated collections flowing through timeless design</p>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/shop" className="text-rose-800 font-bold border-b-2 border-rose-800 pb-1 flex items-center group text-sm md:text-base">
                Browse All <ChevronRight className="w-3 h-3 md:w-4 md:h-4 ml-1 group-hover:translate-x-1 transition" />
              </Link>
              {categories.length > itemsPerView && (
                <div className="flex gap-2">
                  <button
                    onClick={handlePrevCategory}
                    disabled={!canScrollPrev}
                    className={`p-1.5 md:p-2 rounded-full border transition-all ${
                      canScrollPrev 
                        ? 'border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300' 
                        : 'border-gray-200 text-gray-300 cursor-not-allowed'
                    }`}
                  >
                    <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
                  </button>
                  <button
                    onClick={handleNextCategory}
                    disabled={!canScrollNext}
                    className={`p-1.5 md:p-2 rounded-full border transition-all ${
                      canScrollNext 
                        ? 'border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300' 
                        : 'border-gray-200 text-gray-300 cursor-not-allowed'
                    }`}
                  >
                    <ChevronRightIcon className="w-4 h-4 md:w-5 md:h-5" />
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <div className="relative overflow-hidden">
            <div 
              ref={carouselRef}
              className={`transition-all duration-500 ease-in-out ${isAnimating ? 'opacity-95' : 'opacity-100'}`}
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-5">
                {visibleCategories.map((category) => {
                  const imageUrl = getCategoryImage(category.name);
                  return (
                    <Link 
                      key={category.id} 
                      to={`/shop?category=${category.id}`} 
                      className="group transform transition-all duration-300 hover:-translate-y-2"
                    >
                      <div className="bg-white rounded-xl md:rounded-2xl overflow-hidden border border-stone-100 shadow-sm group-hover:shadow-xl group-hover:border-transparent transition-all duration-300">
                        <div className="aspect-square overflow-hidden">
                          <img 
                            src={imageUrl} 
                            alt={category.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          />
                        </div>
                        <div className="p-3 md:p-4 text-center">
                          <h3 className="font-semibold text-slate-800 text-xs md:text-sm group-hover:text-rose-800 transition-colors">
                            {category.name}
                          </h3>
                          <span className="text-[10px] md:text-xs text-slate-400 mt-0.5 md:mt-1">
                            {category.productCount || 0} {category.productCount === 1 ? 'item' : 'items'}
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {categories.length > itemsPerView && (
            <div className="flex justify-center gap-1 md:gap-2 mt-4 md:mt-8">
              {Array.from({ length: totalSlides }).map((_, idx) => {
                const startIndex = idx * itemsPerView;
                const isActive = currentCategoryIndex >= startIndex && currentCategoryIndex < startIndex + itemsPerView;
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      if (carouselIntervalRef.current) { clearInterval(carouselIntervalRef.current); carouselIntervalRef.current = null; }
                      setIsAnimating(true);
                      setCurrentCategoryIndex(startIndex);
                      setTimeout(() => setIsAnimating(false), 500);
                      restartCarousel();
                    }}
                    className={`h-1 rounded-full transition-all duration-300 ${
                      isActive ? 'w-4 md:w-8 bg-rose-600' : 'w-2 md:w-4 bg-stone-300 hover:bg-stone-400'
                    }`}
                  />
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Trending Now - New Arrivals & Best Sellers Only */}
      <section className="py-16 md:py-24 bg-[#FBFBFA]">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-8 md:mb-16">
            <span className="text-rose-800 font-bold tracking-widest text-[10px] md:text-xs uppercase">Our Catalog</span>
            <h2 className="text-2xl md:text-5xl font-serif text-slate-900 mt-2 md:mt-4 mb-6 md:mb-10">Trending Now</h2>
            <div className="inline-flex p-1 bg-stone-200/50 backdrop-blur rounded-xl md:rounded-2xl">
              {[
                { id: 'new', label: 'New Arrivals' },
                { id: 'bestsellers', label: 'Best Sellers' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 md:px-8 py-2 md:py-3 rounded-lg md:rounded-xl text-xs md:text-sm font-bold transition-all duration-300 ${
                    activeTab === tab.id ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 lg:gap-10">
            {loading ? (
              <div className="col-span-full py-20 text-center">
                <div className="animate-spin rounded-full h-8 w-8 md:h-10 md:w-10 border-t-2 border-rose-900 mx-auto" />
              </div>
            ) : (
              (activeTab === 'new' ? newArrivals.slice(0, 4) : bestSellers.slice(0, 4)).map((product) => (
                <div key={product.id} className="group">
                  <div className="relative aspect-[4/5] rounded-xl md:rounded-[2rem] overflow-hidden bg-stone-100 mb-3 md:mb-6 shadow-sm">
                    <Link to={`/products/${product.id}`} className="block w-full h-full">
                      <img 
                        src={product.imageUrl} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                        alt={product.name} 
                      />
                    </Link>
                    <div className="absolute top-2 right-2 md:top-4 md:right-4 flex flex-col gap-2">
                      <button 
                        onClick={(e) => handleAddToCart(e, product)}
                        className="p-1.5 md:p-3 bg-white/80 backdrop-blur-md rounded-full shadow-lg hover:bg-rose-900 hover:text-white transition-all transform translate-x-12 group-hover:translate-x-0"
                      >
                        <ShoppingBag className="w-3 h-3 md:w-5 md:h-5" />
                      </button>
                    </div>
                    {product.stockQuantity < 5 && product.stockQuantity > 0 && (
                      <div className="absolute top-2 left-2 md:top-4 md:left-4 bg-amber-500 text-white text-[8px] md:text-xs font-bold px-1.5 py-0.5 md:px-2 md:py-1 rounded-full">
                        Low Stock
                      </div>
                    )}
                    {product.stockQuantity === 0 && (
                      <div className="absolute top-2 left-2 md:top-4 md:left-4 bg-slate-800 text-white text-[8px] md:text-xs font-bold px-1.5 py-0.5 md:px-2 md:py-1 rounded-full">
                        Sold Out
                      </div>
                    )}
                  </div>
                  <div className="px-1 md:px-2">
                    <div className="flex justify-between items-start mb-1 md:mb-2">
                      <h3 className="font-bold text-slate-900 text-xs md:text-lg hover:text-rose-800 transition line-clamp-1">
                        <Link to={`/products/${product.id}`}>{product.name}</Link>
                      </h3>
                      <span className="font-serif text-rose-900 font-bold text-xs md:text-base">₱{product.price.toLocaleString()}</span>
                    </div>
                    
                    <div className="flex items-center gap-1 mb-1 md:mb-2">
                      {renderStars(product.averageRating)}
                      <span className="text-[9px] md:text-xs text-slate-400">
                        ({product.reviewCount})
                      </span>
                    </div>
                    
                    {product.salesCount > 0 && (
                      <div className="flex items-center gap-1 text-[9px] md:text-xs text-emerald-600 mb-1 md:mb-2">
                        <TrendingUp className="w-2.5 h-2.5 md:w-3 md:h-3" />
                        <span className="font-medium">{product.salesCount} sold</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="text-center mt-10 md:mt-16">
            <Link to="/shop" className="inline-flex items-center gap-2 px-5 md:px-8 py-2.5 md:py-4 border-2 border-rose-200 rounded-full font-bold text-rose-800 text-sm md:text-base hover:bg-rose-50 transition-all hover:border-rose-300">
              Discover All Products <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;