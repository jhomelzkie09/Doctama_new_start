import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, Star, Truck, Shield, Clock, TrendingUp, Heart, Eye, 
  ChevronRight, Sparkles, Sofa, Armchair, Lamp, Table, Bed, 
  Package, ShoppingBag, CreditCard, Users, MoveRight, PlayCircle
} from 'lucide-react';
import productService from '../../services/product.service';
import { Product } from '../../types';

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'featured' | 'new' | 'bestsellers'>('featured');

  useEffect(() => { loadProducts(); }, []);

  const loadProducts = async () => {
    setLoading(true);
    const products = await productService.getProducts();
    setFeaturedProducts(products.slice(0, 4));
    setNewArrivals(products.slice(2, 6));
    setBestSellers(products.slice(1, 5));
    setLoading(false);
  };

  const categories = [
    { name: 'Living Room', icon: Sofa, color: 'bg-stone-100', count: 45 },
    { name: 'Bedroom', icon: Bed, color: 'bg-stone-100', count: 32 },
    { name: 'Dining', icon: Table, color: 'bg-stone-100', count: 28 },
    { name: 'Office', icon: Armchair, color: 'bg-stone-100', count: 23 },
    { name: 'Lighting', icon: Lamp, color: 'bg-stone-100', count: 56 },
    { name: 'Storage', icon: Package, color: 'bg-stone-100', count: 19 },
  ];

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
              {/* Decorative Blur */}
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

      {/* Categories - Grid Style */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div className="max-w-xl">
              <h2 className="text-4xl font-serif text-slate-900 mb-4">Curated Categories</h2>
              <p className="text-slate-500">Explore our vast collection of furniture, each piece selected for its quality and timeless design language.</p>
            </div>
            <Link to="/shop" className="text-rose-800 font-bold border-b-2 border-rose-800 pb-1 flex items-center group">
              View All Categories <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition" />
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {categories.map((cat, i) => (
              <Link key={i} to={`/shop?category=${cat.name.toLowerCase()}`} className="group">
                <div className="aspect-square bg-stone-50 rounded-3xl flex flex-col items-center justify-center p-6 border border-transparent group-hover:border-rose-200 group-hover:bg-white group-hover:shadow-xl transition-all duration-300">
                  <cat.icon className="w-10 h-10 text-slate-400 group-hover:text-rose-800 transition-colors mb-4" />
                  <h3 className="font-bold text-slate-900 text-sm">{cat.name}</h3>
                  <span className="text-xs text-slate-400 mt-1">{cat.count} Pieces</span>
                </div>
              </Link>
            ))}
          </div>
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