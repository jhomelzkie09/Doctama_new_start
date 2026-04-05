import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowRight, Star, Truck, Shield, Clock, TrendingUp, Eye, 
  ChevronRight, Sparkles, Sofa, Armchair, Lamp, Table, Bed, 
  Package, ShoppingBag, CreditCard, Users, MoveRight, PlayCircle,
  Folder, Home as HomeIcon, Coffee, Utensils, Monitor, Lightbulb, 
  Box, BookOpen, Ruler, Watch, Flower2, Library,
  Shirt, WashingMachine, Car, TreePalm, Music, Tv,
  ChevronLeft, ChevronRight as ChevronRightIcon,
  PenLine, Palette, Maximize2, MessageCircle, CheckCircle2
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useOutletContext } from 'react-router-dom';
import productService from '../../services/product.service';
import categoryService from '../../services/category.service';
import { Product, Category } from '../../types';

interface OutletContextType {
  onAuthRequired?: (mode: 'login' | 'register') => void;
}

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const outletContext = useOutletContext<OutletContextType>();
  const onAuthRequired = outletContext?.onAuthRequired;
  
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'featured' | 'new' | 'bestsellers'>('featured');
  
  // Carousel state
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(6);
  const [isAnimating, setIsAnimating] = useState(false);
  const carouselIntervalRef = useRef<NodeJS.Timeout | null>(null);
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
      
      setProducts(productsData);
      setFeaturedProducts(productsData.slice(0, 4));
      setNewArrivals(productsData.slice(2, 6));
      setBestSellers(productsData.slice(1, 5));
      
      const categoriesWithCounts = categoriesData.map(category => {
        const productCount = productsData.filter(product => product.categoryId === category.id).length;
        return { ...category, productCount };
      });
      
      setCategories(categoriesWithCounts);
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
      if (onAuthRequired) onAuthRequired('login');
      return;
    }
    navigate('/shop', { state: { selectedProduct: product, openModal: true } });
  };

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

  const customSteps = [
    { icon: MessageCircle, step: '01', title: 'Tell Us Your Vision', desc: 'Share your ideas — dimensions, style, materials, and any inspiration you have in mind.' },
    { icon: Palette, step: '02', title: 'Choose Your Finish', desc: 'Pick from our range of premium wood stains, fabrics, and hardware finishes.' },
    { icon: PenLine, step: '03', title: 'We Craft It for You', desc: 'Our Filipino artisans handcraft your piece with meticulous attention to every detail.' },
    { icon: CheckCircle2, step: '04', title: 'Delivered to Your Door', desc: 'Your bespoke furniture arrives white-glove delivered and ready to love.' },
  ];

  const renderStars = (rating: number) => (
    <div className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star key={i} className={`w-3.5 h-3.5 ${i < rating ? 'text-amber-500 fill-amber-500' : 'text-gray-200'}`} />
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

      {/* ─── Hero Section ─── */}
      <section className="relative min-h-[90vh] flex items-center bg-[#F9F8F6] overflow-hidden">
        <div className="absolute inset-0">
          {heroImages.map((image, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                currentHeroImage === index ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <img src={image.url} alt={image.alt} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
            </div>
          ))}
        </div>
        
        <div className="absolute top-0 right-0 w-1/3 h-full bg-rose-950/20 hidden lg:block" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-200/20 rounded-full blur-[100px]" />
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-8 text-white">
              <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1 rounded-full text-white text-sm font-medium">
                <Sparkles className="w-4 h-4" />
                <span>The 2026 Spring Collection is here</span>
              </div>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-serif text-white leading-[1.1] tracking-tight drop-shadow-lg">
                Design for <br />
                <span className="italic text-rose-200">Better Living.</span>
              </h1>
              
              <p className="text-lg text-white/90 max-w-md leading-relaxed drop-shadow-md">
                Experience the harmony of Filipino craftsmanship and modern Scandinavian aesthetics. Elevate your space with pieces that tell a story.
              </p>
              
              <div className="flex flex-wrap gap-5 pt-4">
                <Link to="/shop" className="px-8 py-4 bg-rose-600 text-white rounded-full font-medium hover:bg-rose-700 transition-all transform hover:-translate-y-1 flex items-center shadow-xl shadow-black/20">
                  Shop Collection <MoveRight className="w-5 h-5 ml-2" />
                </Link>
                <button className="flex items-center space-x-3 text-white font-semibold group">
                  <div className="p-3 rounded-full border border-white/30 group-hover:bg-white/10 transition-all">
                    <PlayCircle className="w-6 h-6" />
                  </div>
                  <span>Watch Lookbook</span>
                </button>
              </div>

              <div className="flex items-center space-x-12 pt-10 border-t border-white/20">
                <div>
                  <div className="text-2xl font-bold text-white">12k+</div>
                  <div className="text-sm text-white/70 uppercase tracking-widest font-medium">Installs</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">4.9/5</div>
                  <div className="text-sm text-white/70 uppercase tracking-widest font-medium">Rating</div>
                </div>
              </div>
            </div>
            
            <div className="lg:col-span-6 relative">
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
              <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-rose-300 rounded-full blur-[100px] opacity-30 -z-10" />
            </div>
          </div>
        </div>
        
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/40 rounded-full flex justify-center">
            <div className="w-1 h-2 bg-white/60 rounded-full mt-2 animate-pulse" />
          </div>
        </div>
      </section>

      {/* ─── Trust Bar ─── */}
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

      {/* ─── Categories Carousel ─── */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div className="max-w-xl">
              <h2 className="text-4xl font-serif text-slate-900 mb-4">Shop by Category</h2>
              <p className="text-slate-500">Discover our curated collections flowing through timeless design</p>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/shop" className="text-rose-800 font-bold border-b-2 border-rose-800 pb-1 flex items-center group">
                Browse All <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition" />
              </Link>
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
          
          <div className="relative overflow-hidden">
            <div 
              ref={carouselRef}
              className={`transition-all duration-500 ease-in-out ${isAnimating ? 'opacity-95' : 'opacity-100'}`}
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
                {visibleCategories.map((category, index) => {
                  const IconComponent = getCategoryIcon(category.name);
                  const colorClass = getCategoryColor(category.name, currentCategoryIndex + index);
                  return (
                    <Link 
                      key={category.id} 
                      to={`/shop?category=${category.id}`} 
                      className="group transform transition-all duration-300 hover:-translate-y-2"
                    >
                      <div className="aspect-square bg-white rounded-2xl flex flex-col items-center justify-center p-5 border border-stone-100 shadow-sm group-hover:shadow-xl group-hover:border-transparent transition-all duration-300">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300 ${colorClass}`}>
                          <IconComponent className="w-8 h-8 transition-transform group-hover:scale-110" />
                        </div>
                        <h3 className="font-semibold text-slate-800 text-sm text-center group-hover:text-rose-800 transition-colors">
                          {category.name}
                        </h3>
                        <span className="text-xs text-slate-400 mt-1">
                          {category.productCount || 0} {category.productCount === 1 ? 'item' : 'items'}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {categories.length > itemsPerView && (
            <div className="flex justify-center gap-2 mt-8">
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
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      isActive ? 'w-8 bg-rose-600' : 'w-4 bg-stone-300 hover:bg-stone-400'
                    }`}
                  />
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ─── Trending Now ─── */}
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
                    <Link to={`/products/${product.id}`} className="block w-full h-full">
                      <img 
                        src={product.imageUrl} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                        alt={product.name} 
                      />
                    </Link>
                    <div className="absolute top-4 right-4 flex flex-col gap-2">
                      <button 
                        onClick={(e) => handleAddToCart(e, product)}
                        className="p-3 bg-white/80 backdrop-blur-md rounded-full shadow-lg hover:bg-rose-900 hover:text-white transition-all transform translate-x-12 group-hover:translate-x-0"
                      >
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

      {/* ─── Customize Product Section ─── */}
      <section className="py-24 bg-white overflow-hidden">
        <div className="container mx-auto px-6">

          {/* Section Label */}
          <div className="text-center mb-16">
            <span className="text-rose-800 font-bold tracking-widest text-xs uppercase">Bespoke Service</span>
            <h2 className="text-5xl font-serif text-slate-900 mt-3 mb-4">
              Want a <span className="italic text-rose-700">Customized</span> Product?
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto text-base leading-relaxed">
              Every home is unique — and so should your furniture. Tell us exactly what you want, and our craftsmen will build it by hand, just for you.
            </p>
          </div>

          {/* Main Bento Grid */}
          <div className="grid lg:grid-cols-5 gap-6">

            {/* Left: Hero CTA Card */}
            <div className="lg:col-span-3 relative bg-rose-950 rounded-[2.5rem] overflow-hidden min-h-[520px] flex flex-col justify-between p-10 group">
              {/* Background image */}
              <div className="absolute inset-0">
                <img
                  src="https://images.pexels.com/photos/3932930/pexels-photo-3932930.jpeg?auto=compress&cs=tinysrgb&w=900"
                  alt="Custom Furniture Workshop"
                  className="w-full h-full object-cover opacity-30 group-hover:opacity-40 group-hover:scale-105 transition-all duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-rose-950 via-rose-950/80 to-rose-950/30" />
              </div>

              {/* Top badge */}
              <div className="relative z-10">
                <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 text-rose-200 text-xs font-bold tracking-widest uppercase px-4 py-2 rounded-full">
                  <Sparkles className="w-3.5 h-3.5" />
                  Made to Order
                </span>
              </div>

              {/* Bottom content */}
              <div className="relative z-10 space-y-6">
                <div>
                  <h3 className="text-4xl lg:text-5xl font-serif text-white leading-tight mb-3">
                    Your Vision, <br />
                    <span className="italic text-rose-200">Our Craft.</span>
                  </h3>
                  <p className="text-rose-100/70 text-sm leading-relaxed max-w-sm">
                    From custom dimensions to bespoke finishes — we bring your dream piece to life using premium materials and traditional Filipino joinery.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link
                    to="/contact"
                    className="inline-flex items-center gap-2 px-7 py-3.5 bg-white text-rose-950 rounded-full font-bold text-sm hover:bg-rose-50 transition-all hover:-translate-y-0.5"
                  >
                    Start Your Request <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    to="/shop"
                    className="inline-flex items-center gap-2 px-7 py-3.5 border border-white/30 text-white rounded-full font-bold text-sm hover:bg-white/10 transition-all"
                  >
                    Browse Catalog
                  </Link>
                </div>

                {/* Mini trust signals */}
                <div className="flex items-center gap-6 pt-2 border-t border-white/10">
                  <div className="text-center">
                    <div className="text-xl font-bold text-white">500+</div>
                    <div className="text-rose-300/70 text-xs uppercase tracking-widest">Custom Pieces</div>
                  </div>
                  <div className="w-px h-8 bg-white/10" />
                  <div className="text-center">
                    <div className="text-xl font-bold text-white">4–6 wks</div>
                    <div className="text-rose-300/70 text-xs uppercase tracking-widest">Lead Time</div>
                  </div>
                  <div className="w-px h-8 bg-white/10" />
                  <div className="text-center">
                    <div className="text-xl font-bold text-white">100%</div>
                    <div className="text-rose-300/70 text-xs uppercase tracking-widest">Satisfaction</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Steps Cards */}
            <div className="lg:col-span-2 flex flex-col gap-5">
              {customSteps.map((step, i) => (
                <div
                  key={i}
                  className="group flex items-start gap-5 bg-stone-50 hover:bg-rose-950 rounded-2xl p-6 border border-stone-100 hover:border-transparent transition-all duration-300 cursor-default"
                >
                  <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-white group-hover:bg-white/10 border border-stone-200 group-hover:border-white/20 flex items-center justify-center transition-all duration-300">
                    <step.icon className="w-5 h-5 text-rose-700 group-hover:text-rose-300 transition-colors duration-300" />
                  </div>
                  <div>
                    <div className="text-xs font-bold tracking-widest text-stone-400 group-hover:text-rose-400 uppercase mb-1 transition-colors duration-300">
                      Step {step.step}
                    </div>
                    <h4 className="font-bold text-slate-900 group-hover:text-white text-sm mb-1 transition-colors duration-300">
                      {step.title}
                    </h4>
                    <p className="text-xs text-slate-500 group-hover:text-rose-100/60 leading-relaxed transition-colors duration-300">
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

          </div>

          {/* Bottom: Material Highlights Row */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-5">
            {[
              { label: 'Solid Teak Wood', sub: 'Sustainably sourced', color: 'bg-amber-50 border-amber-100', text: 'text-amber-800', sub_text: 'text-amber-600/70' },
              { label: 'Premium Fabrics', sub: 'Linen, velvet & more', color: 'bg-rose-50 border-rose-100', text: 'text-rose-800', sub_text: 'text-rose-600/70' },
              { label: 'Custom Dimensions', sub: 'Any size, any shape', color: 'bg-emerald-50 border-emerald-100', text: 'text-emerald-800', sub_text: 'text-emerald-600/70' },
              { label: 'Hardware Finishes', sub: 'Brass, matte black & more', color: 'bg-slate-50 border-slate-100', text: 'text-slate-800', sub_text: 'text-slate-500' },
            ].map((item, i) => (
              <div key={i} className={`${item.color} border rounded-2xl px-6 py-5 flex flex-col gap-1`}>
                <Maximize2 className={`w-4 h-4 mb-2 ${item.text}`} />
                <span className={`font-bold text-sm ${item.text}`}>{item.label}</span>
                <span className={`text-xs ${item.sub_text}`}>{item.sub}</span>
              </div>
            ))}
          </div>

        </div>
      </section>
    </div>
  );
};

export default Home;