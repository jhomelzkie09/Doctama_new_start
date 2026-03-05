import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  Star, 
  Truck, 
  Shield, 
  Clock, 
  TrendingUp,
  Heart,
  Eye,
  ChevronRight,
  Sparkles,
  Award,
  Leaf,
  Sofa,
  Armchair,
  Lamp,
  Table,
  Bed,
  Package,
  ShoppingBag,
  Percent,
  Gift,
  CreditCard,
  Zap,
  Users,
  ThumbsUp
} from 'lucide-react';
import productService from '../../services/product.service';
import { Product } from '../../types';

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'featured' | 'new' | 'bestsellers'>('featured');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    const products = await productService.getProducts();
    
    // Mock data - in reality, you'd have proper flags for featured, new, etc.
    setFeaturedProducts(products.slice(0, 4));
    setNewArrivals(products.slice(2, 6));
    setBestSellers(products.slice(1, 5));
    setLoading(false);
  };

  // Category icons mapping
  const categories = [
    { name: 'Living Room', icon: Sofa, color: 'bg-red-50', count: 45 },
    { name: 'Bedroom', icon: Bed, color: 'bg-red-50', count: 32 },
    { name: 'Dining', icon: Table, color: 'bg-red-50', count: 28 },
    { name: 'Office', icon: Armchair, color: 'bg-red-50', count: 23 },
    { name: 'Lighting', icon: Lamp, color: 'bg-red-50', count: 56 },
    { name: 'Storage', icon: Package, color: 'bg-red-50', count: 19 },
  ];

  // Benefits
  const benefits = [
    { icon: Truck, title: 'Free Shipping', desc: 'On orders over ₱5,000', color: 'text-red-600' },
    { icon: Shield, title: '2-Year Warranty', desc: 'On all furniture', color: 'text-red-600' },
    { icon: Clock, title: 'Fast Delivery', desc: 'Metro Manila - 3 days', color: 'text-red-600' },
    { icon: TrendingUp, title: 'Best Prices', desc: 'Price match guarantee', color: 'text-red-600' },
    { icon: CreditCard, title: 'Easy Payment', desc: 'GCash, PayMaya, COD', color: 'text-red-600' },
    { icon: Users, title: '5k+ Happy', desc: 'Customers nationwide', color: 'text-red-600' },
  ];

  // Promo banners
  const promos = [
    {
      title: 'Summer Sale',
      discount: 'Up to 40% Off',
      description: 'On selected living room sets',
      bg: 'bg-gradient-to-r from-red-600 to-red-700',
      textColor: 'text-white',
      cta: 'Shop Now'
    },
    {
      title: 'New Arrivals',
      discount: 'Fresh from the workshop',
      description: 'Modern designs for 2024',
      bg: 'bg-gradient-to-r from-gray-800 to-gray-900',
      textColor: 'text-white',
      cta: 'Explore'
    }
  ];

  // Testimonials
  const testimonials = [
    {
      name: 'Maria Santos',
      location: 'Makati City',
      comment: 'The quality of the furniture exceeded my expectations! Fast delivery and great customer service.',
      rating: 5,
      image: 'https://i.pravatar.cc/100?img=1'
    },
    {
      name: 'Juan Dela Cruz',
      location: 'Quezon City',
      comment: 'Best furniture store in the Philippines. Highly recommended! Will definitely buy again.',
      rating: 5,
      image: 'https://i.pravatar.cc/100?img=2'
    },
    {
      name: 'Anna Reyes',
      location: 'Cebu City',
      comment: 'Beautiful designs and excellent quality. The delivery was quick and hassle-free.',
      rating: 5,
      image: 'https://i.pravatar.cc/100?img=3'
    }
  ];

  // Render stars for ratings
  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, i) => (
      <Star 
        key={i} 
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
      />
    ));
  };

  return (
    <div className="bg-white">
      {/* Hero Section - Red & White Theme */}
      <section className="relative bg-gradient-to-r from-red-600 to-red-700 text-white overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-20 -top-20 w-96 h-96 bg-white rounded-full"></div>
          <div className="absolute -left-20 -bottom-20 w-96 h-96 bg-white rounded-full"></div>
        </div>
        
        <div className="container mx-auto px-4 py-20 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center bg-white/20 rounded-full px-4 py-2 text-sm">
                <Sparkles className="w-4 h-4 mr-2" />
                <span>New Collection 2024</span>
              </div>
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                Modern Furniture for Your <span className="text-yellow-300">Dream Home</span>
              </h1>
              <p className="text-xl text-red-100 max-w-lg">
                Discover our collection of high-quality furniture designed for comfort and style. Free delivery within Metro Manila.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  to="/shop"
                  className="group px-8 py-4 bg-white text-red-600 rounded-lg font-semibold hover:bg-gray-100 transition flex items-center shadow-lg hover:shadow-xl"
                >
                  Shop Now 
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition" />
                </Link>
                <Link
                  to="/about"
                  className="px-8 py-4 border-2 border-white rounded-lg font-semibold hover:bg-white hover:text-red-600 transition flex items-center"
                >
                  Learn More
                </Link>
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-3 gap-8 pt-8">
                <div>
                  <div className="text-3xl font-bold">5k+</div>
                  <div className="text-red-200">Happy Customers</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">500+</div>
                  <div className="text-red-200">Products</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">15+</div>
                  <div className="text-red-200">Showrooms</div>
                </div>
              </div>
            </div>
            
            {/* Hero Image */}
            <div className="relative hidden lg:block">
              <div className="relative z-10 rounded-2xl overflow-hidden shadow-2xl">
                <img 
                  src="https://images.unsplash.com/photo-1618221195710-dd0b2e9bd5f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                  alt="Modern Living Room"
                  className="w-full h-auto"
                />
              </div>
              {/* Floating badge */}
              <div className="absolute -left-10 top-20 bg-white text-red-600 rounded-lg p-4 shadow-xl z-20">
                <div className="text-2xl font-bold">40% OFF</div>
                <div className="text-sm">Summer Sale</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Bar */}
      <section className="bg-gray-50 py-8 border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center justify-center gap-2 text-gray-700">
                <benefit.icon className={`w-5 h-5 ${benefit.color}`} />
                <span className="text-sm font-medium">{benefit.title}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Shop by Category</h2>
              <p className="text-gray-600 mt-2">Find what you're looking for</p>
            </div>
            <Link to="/shop" className="text-red-600 hover:text-red-700 flex items-center font-medium">
              View All <ChevronRight className="w-5 h-5 ml-1" />
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category, index) => (
              <Link
                key={index}
                to={`/shop?category=${category.name.toLowerCase()}`}
                className="group bg-white rounded-xl p-6 text-center hover:shadow-lg transition border border-gray-100"
              >
                <div className="w-16 h-16 mx-auto mb-4 bg-red-50 rounded-full flex items-center justify-center group-hover:bg-red-100 transition">
                  <category.icon className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{category.name}</h3>
                <p className="text-sm text-gray-500">{category.count} items</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Promo Banners */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-6">
            {promos.map((promo, index) => (
              <div key={index} className={`${promo.bg} rounded-2xl p-8 relative overflow-hidden group cursor-pointer`}>
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute -right-10 -top-10 w-40 h-40 bg-white rounded-full"></div>
                  <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-white rounded-full"></div>
                </div>
                <div className="relative z-10">
                  <h3 className={`text-2xl font-bold mb-2 ${promo.textColor}`}>{promo.title}</h3>
                  <p className={`text-4xl font-bold mb-2 ${promo.textColor}`}>{promo.discount}</p>
                  <p className={`mb-4 ${promo.textColor} opacity-90`}>{promo.description}</p>
                  <button className="bg-white text-red-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition group-hover:shadow-lg">
                    {promo.cta}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Products Section with Tabs */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          {/* Section Header */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Products</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Discover our latest collections and best-selling items
            </p>
          </div>

          {/* Tabs */}
          <div className="flex justify-center mb-8">
            <div className="bg-gray-100 p-1 rounded-lg inline-flex">
              <button
                onClick={() => setActiveTab('featured')}
                className={`px-6 py-2 rounded-lg font-medium transition ${
                  activeTab === 'featured' 
                    ? 'bg-red-600 text-white' 
                    : 'text-gray-600 hover:text-red-600'
                }`}
              >
                Featured
              </button>
              <button
                onClick={() => setActiveTab('new')}
                className={`px-6 py-2 rounded-lg font-medium transition ${
                  activeTab === 'new' 
                    ? 'bg-red-600 text-white' 
                    : 'text-gray-600 hover:text-red-600'
                }`}
              >
                New Arrivals
              </button>
              <button
                onClick={() => setActiveTab('bestsellers')}
                className={`px-6 py-2 rounded-lg font-medium transition ${
                  activeTab === 'bestsellers' 
                    ? 'bg-red-600 text-white' 
                    : 'text-gray-600 hover:text-red-600'
                }`}
              >
                Best Sellers
              </button>
            </div>
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {(activeTab === 'featured' ? featuredProducts : 
                activeTab === 'new' ? newArrivals : bestSellers).map((product) => (
                <div
                  key={product.id}
                  className="group bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-xl transition border border-gray-100"
                >
                  {/* Product Image */}
                  <div className="relative h-64 overflow-hidden bg-gray-100">
                    <img
                      src={product.imageUrl || 'https://via.placeholder.com/400x300'}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    
                    {/* Overlay actions */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                      <button className="p-2 bg-white rounded-full hover:bg-red-600 hover:text-white transition">
                        <Heart className="w-5 h-5" />
                      </button>
                      <button className="p-2 bg-white rounded-full hover:bg-red-600 hover:text-white transition">
                        <Eye className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Badges */}
                    <div className="absolute top-4 left-4 flex gap-2">
                      {product.stockQuantity < 10 && (
                        <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full">
                          Low Stock
                        </span>
                      )}
                      {activeTab === 'new' && (
                        <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                          New
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 hover:text-red-600 transition">
                      <Link to={`/products/${product.id}`}>{product.name}</Link>
                    </h3>
                    
                    <div className="flex items-center mb-2">
                      <div className="flex items-center">
                        {renderStars(4)}
                      </div>
                      <span className="text-xs text-gray-500 ml-2">(24 reviews)</span>
                    </div>

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
                      <button className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition">
                        <ShoppingBag className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* View All Link */}
          <div className="text-center mt-12">
            <Link
              to="/shop"
              className="inline-flex items-center text-red-600 hover:text-red-700 font-semibold group"
            >
              View All Products 
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition" />
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">What Our Customers Say</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Join thousands of satisfied customers who love our furniture
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition">
                <div className="flex items-center gap-4 mb-4">
                  <img 
                    src={testimonial.image} 
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                    <p className="text-sm text-gray-500">{testimonial.location}</p>
                  </div>
                </div>
                <div className="flex mb-3">
                  {renderStars(testimonial.rating)}
                </div>
                <p className="text-gray-600">"{testimonial.comment}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16 bg-red-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Stay Updated</h2>
          <p className="text-red-100 mb-8 max-w-lg mx-auto">
            Subscribe to our newsletter for exclusive offers, new arrivals, and design inspiration
          </p>
          <div className="max-w-md mx-auto">
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-white"
              />
              <button className="px-6 py-3 bg-white text-red-600 rounded-lg font-semibold hover:bg-gray-100 transition">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;