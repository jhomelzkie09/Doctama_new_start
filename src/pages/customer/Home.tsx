import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, Star, Truck, Shield, Clock, TrendingUp, Heart, Eye, 
  ChevronRight, Sparkles, Sofa, Armchair, Lamp, Table, Bed, 
  Package, ShoppingBag, CreditCard, Users, MoveRight, PlayCircle,
  Folder, Home as HomeIcon, Coffee, Utensils, Monitor, Lightbulb, 
  Box, BookOpen, Ruler, Watch, Flower2, Library,
  Shirt, WashingMachine, Car, TreePalm, Music, Tv,
  ChevronLeft, ChevronRight as ChevronRightIcon, Pause, Play
} from 'lucide-react';
import productService from '../../services/product.service';
import categoryService from '../../services/category.service';
import { Product, Category } from '../../types';

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'featured' | 'new' | 'bestsellers'>('featured');
  
  // Carousel state
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(6);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const autoPlayIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

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

  // Auto-play logic
  useEffect(() => {
    if (isAutoPlaying && categories.length > itemsPerView) {
      autoPlayIntervalRef.current = setInterval(() => {
        setCurrentCategoryIndex(prev => {
          const maxIndex = categories.length - itemsPerView;
          if (prev >= maxIndex) {
            return 0;
          }
          return prev + itemsPerView;
        });
      }, 5000); // Change slide every 5 seconds
    }

    return () => {
      if (autoPlayIntervalRef.current) {
        clearInterval(autoPlayIntervalRef.current);
      }
    };
  }, [isAutoPlaying, categories.length, itemsPerView]);

  // Pause auto-play on hover
  const handleMouseEnter = () => {
    if (autoPlayIntervalRef.current) {
      clearInterval(autoPlayIntervalRef.current);
      autoPlayIntervalRef.current = null;
    }
  };

  const handleMouseLeave = () => {
    if (isAutoPlaying && categories.length > itemsPerView) {
      autoPlayIntervalRef.current = setInterval(() => {
        setCurrentCategoryIndex(prev => {
          const maxIndex = categories.length - itemsPerView;
          if (prev >= maxIndex) {
            return 0;
          }
          return prev + itemsPerView;
        });
      }, 5000);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [productsData, categoriesData] = await Promise.all([
        productService.getProducts(),
        categoryService.getCategories()
      ]);
      
      setFeaturedProducts(productsData.slice(0, 4));
      setNewArrivals(productsData.slice(2, 6));
      setBestSellers(productsData.slice(1, 5));
      setCategories(categoriesData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Enhanced icon mapping with valid lucide-react icons
  const getCategoryIcon = (categoryName: string) => {
    const name = categoryName.toLowerCase();
    
    if (name.includes('living') || name.includes('sofa') || name.includes('couch')) return Sofa;
    if (name.includes('armchair') || name.includes('lounge')) return Armchair;
    if (name.includes('bed') || name.includes('bedroom')) return Bed;
    if (name.includes('dresser') || name.includes('wardrobe')) return HomeIcon;
    if (name.includes('dining') || name.includes('table')) return Table;
    if (name.includes('kitchen') || name.includes('utensil')) return Utensils;
    if (name.includes('office') || name.includes('desk') || name.includes('work')) return Monitor;
    if (name.includes('light') || name.includes('lamp')) return Lightbulb;
    if (name.includes('storage') || name.includes('cabinet')) return Package;
    if (name.includes('shelf') || name.includes('bookcase')) return Library;
    if (name.includes('decor') || name.includes('art')) return Sparkles;
    if (name.includes('rug') || name.includes('carpet')) return Ruler;
    if (name.includes('mirror')) return Watch;
    if (name.includes('vase')) return Flower2;
    if (name.includes('plant')) return TreePalm;
    if (name.includes('outdoor') || name.includes('garden')) return TreePalm;
    if (name.includes('tv') || name.includes('media')) return Tv;
    if (name.includes('audio') || name.includes('speaker')) return Music;
    if (name.includes('furniture')) return Sofa;
    if (name.includes('home')) return HomeIcon;
    
    return Folder;
  };

  const getCategoryColor = (categoryName: string, index: number) => {
    const colors = [
      'bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white',
      'bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white',
      'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white',
      'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white',
      'bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white',
      'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white',
      'bg-pink-50 text-pink-600 group-hover:bg-pink-600 group-hover:text-white',
      'bg-teal-50 text-teal-600 group-hover:bg-teal-600 group-hover:text-white',
    ];
    return colors[index % colors.length];
  };

  const handlePrevCategory = () => {
    // Pause auto-play temporarily
    if (autoPlayIntervalRef.current) {
      clearInterval(autoPlayIntervalRef.current);
      autoPlayIntervalRef.current = null;
    }
    setCurrentCategoryIndex(prev => Math.max(0, prev - itemsPerView));
    // Resume auto-play after 10 seconds of inactivity
    if (isAutoPlaying) {
      setTimeout(() => {
        if (isAutoPlaying && !autoPlayIntervalRef.current) {
          autoPlayIntervalRef.current = setInterval(() => {
            setCurrentCategoryIndex(prev => {
              const maxIndex = categories.length - itemsPerView;
              if (prev >= maxIndex) {
                return 0;
              }
              return prev + itemsPerView;
            });
          }, 5000);
        }
      }, 10000);
    }
  };

  const handleNextCategory = () => {
    // Pause auto-play temporarily
    if (autoPlayIntervalRef.current) {
      clearInterval(autoPlayIntervalRef.current);
      autoPlayIntervalRef.current = null;
    }
    setCurrentCategoryIndex(prev => Math.min(categories.length - itemsPerView, prev + itemsPerView));
    // Resume auto-play after 10 seconds of inactivity
    if (isAutoPlaying) {
      setTimeout(() => {
        if (isAutoPlaying && !autoPlayIntervalRef.current) {
          autoPlayIntervalRef.current = setInterval(() => {
            setCurrentCategoryIndex(prev => {
              const maxIndex = categories.length - itemsPerView;
              if (prev >= maxIndex) {
                return 0;
              }
              return prev + itemsPerView;
            });
          }, 5000);
        }
      }, 10000);
    }
  };

  const toggleAutoPlay = () => {
    setIsAutoPlaying(!isAutoPlaying);
    if (!isAutoPlaying) {
      // Start auto-play
      autoPlayIntervalRef.current = setInterval(() => {
        setCurrentCategoryIndex(prev => {
          const maxIndex = categories.length - itemsPerView;
          if (prev >= maxIndex) {
            return 0;
          }
          return prev + itemsPerView;
        });
      }, 5000);
    } else {
      // Stop auto-play
      if (autoPlayIntervalRef.current) {
        clearInterval(autoPlayIntervalRef.current);
        autoPlayIntervalRef.current = null;
      }
    }
  };

  const goToSlide = (index: number) => {
    // Pause auto-play temporarily
    if (autoPlayIntervalRef.current) {
      clearInterval(autoPlayIntervalRef.current);
      autoPlayIntervalRef.current = null;
    }
    setCurrentCategoryIndex(index);
    // Resume auto-play after 10 seconds of inactivity
    if (isAutoPlaying) {
      setTimeout(() => {
        if (isAutoPlaying && !autoPlayIntervalRef.current) {
          autoPlayIntervalRef.current = setInterval(() => {
            setCurrentCategoryIndex(prev => {
              const maxIndex = categories.length - itemsPerView;
              if (prev >= maxIndex) {
                return 0;
              }
              return prev + itemsPerView;
            });
          }, 5000);
        }
      }, 10000);
    }
  };

  const benefits = [
    { icon: Truck, title: 'Free Shipping', desc: 'Over ₱5,000' },
    { icon: Shield, title: '2-Year Warranty', desc: 'Full coverage' },
    { icon: Clock, title: 'Fast Delivery', desc: '3-day window' },
    { icon: CreditCard, title: 'Flexi-Payment', desc: 'Installments' },
  ];

  const renderStars = (rating: number) => (
    <div className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star key={i} className={`w-3.5 h-3.5 ${i < rating ? 'text-amber-500 fill-amber-500' : 'text-gray-200'}`} />
      ))}
    </div>
  );

  const visibleCategories = categories.slice(currentCategoryIndex, currentCategoryIndex + itemsPerView);
  const canScrollPrev = currentCategoryIndex > 0;
  const canScrollNext = currentCategoryIndex + itemsPerView < categories.length;
  const totalSlides = Math.ceil(categories.length / itemsPerView);
  const currentSlide = Math.floor(currentCategoryIndex / itemsPerView);

  return (
    <div className="bg-white selection:bg-rose-100 selection:text-rose-900">
      {/* Hero Section - Luxury Minimalist */}
      <section className="relative min-h-[90vh] flex items-center bg-[#F9F8F6] overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-rose-950/5 hidden lg:block" />
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-8">
              <div className="inline-flex items-center space-x-2 bg-rose-50 border border-rose-100 px-3 py-1 rounded-full text-rose-700 text-sm font-medium">
                <Sparkles className="w-4 h-4" />
                <span>The 2026 Spring Collection is here</span>
              </div>
              
              <h1 className="text-6xl lg:text-8xl font-serif text-slate-900 leading-[1.1] tracking-tight">
                Design for <br />
                <span className="italic text-rose-800">Better Living.</span>
              </h1>
              
              <p className="text-lg text-slate-600 max-w-md leading-relaxed">
                Experience the harmony of Filipino craftsmanship and modern Scandinavian aesthetics. Elevate your space with pieces that tell a story.
              </p>
              
              <div className="flex flex-wrap gap-5 pt-4">
                <Link to="/shop" className="px-8 py-4 bg-rose-950 text-white rounded-full font-medium hover:bg-rose-900 transition-all transform hover:-translate-y-1 flex items-center shadow-xl shadow-rose-950/20">
                  Shop Collection <MoveRight className="w-5 h-5 ml-2" />
                </Link>
                <button className="flex items-center space-x-3 text-slate-900 font-semibold group">
                  <div className="p-3 rounded-full border border-slate-200 group-hover:bg-white group-hover:shadow-md transition-all">
                    <PlayCircle className="w-6 h-6 text-rose-800" />
                  </div>
                  <span>Watch Lookbook</span>
                </button>
              </div>

              <div className="flex items-center space-x-12 pt-10 border-t border-slate-200">
                <div>
                  <div className="text-2xl font-bold text-slate-900">12k+</div>
                  <div className="text-sm text-slate-500 uppercase tracking-widest font-medium">Installs</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">4.9/5</div>
                  <div className="text-sm text-slate-500 uppercase tracking-widest font-medium">Rating</div>
                </div>
              </div>
            </div>
            
            <div className="lg:col-span-6 relative">
              <div className="relative z-10 rounded-[2rem] overflow-hidden shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-700">
                <img 
                  src="https://images.unsplash.com/photo-1618221195710-dd0b2e9bd5f4?auto=format&fit=crop&w=1000&q=90" 
                  alt="Modern Interior"
                  className="w-full h-[600px] object-cover"
                />
              </div>
              <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-rose-200 rounded-full blur-[100px] opacity-50 -z-10" />
            </div>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <div className="py-12 bg-white border-b border-stone-100">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((b, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="p-3 bg-stone-50 rounded-xl">
                  <b.icon className="w-6 h-6 text-rose-900" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{b.title}</h4>
                  <p className="text-xs text-slate-500 uppercase tracking-tighter">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Categories - Auto-Playing Carousel Section */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div className="max-w-xl">
              <h2 className="text-4xl font-serif text-slate-900 mb-4">Shop by Category</h2>
              <p className="text-slate-500">Find exactly what you're looking for in our curated collections</p>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/shop" className="text-rose-800 font-bold border-b-2 border-rose-800 pb-1 flex items-center group">
                Browse All <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition" />
              </Link>
              
              {/* Auto-Play Toggle Button */}
              {categories.length > itemsPerView && (
                <button
                  onClick={toggleAutoPlay}
                  className={`p-2 rounded-full border transition-all ${
                    isAutoPlaying 
                      ? 'border-rose-200 text-rose-600 hover:bg-rose-50' 
                      : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
                  title={isAutoPlaying ? 'Pause slideshow' : 'Play slideshow'}
                >
                  {isAutoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
              )}
              
              {/* Carousel Navigation Buttons */}
              {categories.length > itemsPerView && (
                <div className="flex gap-2">
                  <button
                    onClick={handlePrevCategory}
                    disabled={!canScrollPrev}
                    className={`p-2 rounded-full border transition-all ${
                      canScrollPrev 
                        ? 'border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300' 
                        : 'border-gray-200 text-gray-300 cursor-not-allowed'
                    }`}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleNextCategory}
                    disabled={!canScrollNext}
                    className={`p-2 rounded-full border transition-all ${
                      canScrollNext 
                        ? 'border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300' 
                        : 'border-gray-200 text-gray-300 cursor-not-allowed'
                    }`}
                  >
                    <ChevronRightIcon className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Carousel Container */}
          <div 
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className="relative overflow-hidden"
          >
            <div 
              ref={carouselRef}
              className="transition-transform duration-500 ease-out"
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
                {visibleCategories.map((category, index) => {
                  const IconComponent = getCategoryIcon(category.name);
                  const colorClass = getCategoryColor(category.name, currentCategoryIndex + index);
                  
                  return (
                    <Link 
                      key={category.id} 
                      to={`/shop?category=${category.id}`} 
                      className="group animate-fadeIn"
                    >
                      <div className="aspect-square bg-white rounded-2xl flex flex-col items-center justify-center p-5 border border-stone-100 shadow-sm group-hover:shadow-xl group-hover:border-transparent transition-all duration-300 hover:-translate-y-1">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300 ${colorClass}`}>
                          <IconComponent className="w-8 h-8 transition-transform group-hover:scale-110" />
                        </div>
                        <h3 className="font-semibold text-slate-800 text-sm text-center group-hover:text-rose-800 transition-colors">
                          {category.name}
                        </h3>
                        <span className="text-xs text-slate-400 mt-1">
                          {category.productCount || 0} items
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Carousel Indicators with Play/Pause indication */}
          {categories.length > itemsPerView && (
            <div className="flex justify-center items-center gap-3 mt-8">
              {Array.from({ length: totalSlides }).map((_, idx) => {
                const startIndex = idx * itemsPerView;
                const isActive = currentCategoryIndex >= startIndex && currentCategoryIndex < startIndex + itemsPerView;
                return (
                  <button
                    key={idx}
                    onClick={() => goToSlide(startIndex)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      isActive 
                        ? 'w-8 bg-rose-600' 
                        : 'w-4 bg-stone-300 hover:bg-stone-400'
                    }`}
                  />
                );
              })}
              {isAutoPlaying && totalSlides > 1 && (
                <span className="text-xs text-rose-500 animate-pulse ml-2">● Auto-playing</span>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Product Section - Refined Cards */}
      <section className="py-24 bg-[#FBFBFA]">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-rose-800 font-bold tracking-widest text-xs uppercase">Our Catalog</span>
            <h2 className="text-5xl font-serif text-slate-900 mt-4 mb-10">Trending Now</h2>
            
            <div className="inline-flex p-1 bg-stone-200/50 backdrop-blur rounded-2xl">
              {['featured', 'new', 'bestsellers'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`px-8 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
                    activeTab === tab ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {loading ? (
              <div className="col-span-full py-20 text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-rose-900 mx-auto" />
              </div>
            ) : (
              (activeTab === 'featured' ? featuredProducts : activeTab === 'new' ? newArrivals : bestSellers).map((product) => (
                <div key={product.id} className="group">
                  <div className="relative aspect-[4/5] rounded-[2rem] overflow-hidden bg-stone-100 mb-6 shadow-sm">
                    <img 
                      src={product.imageUrl} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                      alt={product.name} 
                    />
                    <div className="absolute top-4 right-4 flex flex-col gap-2">
                      <button className="p-3 bg-white/80 backdrop-blur-md rounded-full shadow-lg hover:bg-rose-900 hover:text-white transition-all transform translate-x-12 group-hover:translate-x-0">
                        <Heart className="w-5 h-5" />
                      </button>
                      <button className="p-3 bg-white/80 backdrop-blur-md rounded-full shadow-lg hover:bg-rose-900 hover:text-white transition-all transform translate-x-12 group-hover:translate-x-0 delay-75">
                        <ShoppingBag className="w-5 h-5" />
                      </button>
                    </div>
                    {product.stockQuantity < 5 && product.stockQuantity > 0 && (
                      <div className="absolute top-4 left-4 bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                        Low Stock
                      </div>
                    )}
                    {product.stockQuantity === 0 && (
                      <div className="absolute top-4 left-4 bg-slate-800 text-white text-xs font-bold px-2 py-1 rounded-full">
                        Sold Out
                      </div>
                    )}
                  </div>
                  <div className="px-2">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-slate-900 text-lg hover:text-rose-800 transition">
                        <Link to={`/products/${product.id}`}>{product.name}</Link>
                      </h3>
                      <span className="font-serif text-rose-900 font-bold">₱{product.price.toLocaleString()}</span>
                    </div>
                    {renderStars(4)}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="text-center mt-16">
            <Link to="/shop" className="inline-flex items-center gap-2 px-8 py-4 border-2 border-rose-200 rounded-full font-bold text-rose-800 hover:bg-rose-50 transition-all hover:border-rose-300">
              Discover All Products <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Bento Promo Section */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-6 h-[500px]">
            <div className="md:col-span-2 bg-rose-950 rounded-[3rem] p-12 relative overflow-hidden group">
              <div className="relative z-10 h-full flex flex-col justify-end">
                <span className="text-rose-300 font-bold mb-4 tracking-widest">LIMITED OFFER</span>
                <h3 className="text-5xl font-serif text-white mb-6">Summer Refresh <br /> Up to 40% Off</h3>
                <Link to="/shop" className="w-fit px-8 py-4 bg-white text-rose-950 rounded-full font-bold hover:bg-rose-50 transition-colors">
                  Claim Discount
                </Link>
              </div>
              <div className="absolute top-0 right-0 w-1/2 h-full opacity-40 group-hover:opacity-60 transition-opacity">
                <img src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80" className="w-full h-full object-cover" alt="Promo" />
              </div>
            </div>
            <div className="bg-stone-900 rounded-[3rem] p-12 relative overflow-hidden flex flex-col justify-end">
              <h3 className="text-3xl font-serif text-white mb-4">Eco-Friendly Series</h3>
              <p className="text-stone-400 mb-6">Sustainable teak wood collections.</p>
              <Link to="/shop" className="text-white border-b border-white w-fit pb-1 font-bold">Explore</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter - High Contrast */}
      <section className="py-20 bg-stone-50 border-t border-stone-200">
        <div className="container mx-auto px-6 max-w-4xl text-center">
          <h2 className="text-4xl font-serif text-slate-900 mb-6">Join the Inner Circle</h2>
          <p className="text-slate-500 mb-10 text-lg">Subscribe for early access to sales, interior design tips, and ₱500 off your first order.</p>
          <form className="flex flex-col sm:flex-row gap-4 p-2 bg-white rounded-3xl shadow-xl shadow-stone-200/50 border border-stone-100">
            <input 
              type="email" 
              placeholder="Your email address" 
              className="flex-1 px-6 py-4 rounded-2xl focus:outline-none text-slate-900" 
            />
            <button className="px-10 py-4 bg-rose-950 text-white rounded-2xl font-bold hover:bg-rose-900 transition-colors">
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </div>
  );
};

export default Home;