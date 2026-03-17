import React, { useState } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { 
  Menu, 
  X, 
  ShoppingCart, 
  User, 
  LogOut, 
  ChevronRight,
  Home,
  Store,
  Info,
  Phone,
  Heart,
  Search,
  Facebook,
  Instagram,
  Twitter,
  Mail,
  Phone as PhoneIcon,
  MapPin,
  Package,
  Shield,
  Truck
} from 'lucide-react';
import AuthSidebar from './AuthSidebar';

const Layout = () => {
  const { user, logout } = useAuth();
  const { state } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authSidebarOpen, setAuthSidebarOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  // Function to handle auth requirement from child components
  const handleAuthRequired = (mode: 'login' | 'register' = 'login') => {
    setAuthMode(mode);
    setAuthSidebarOpen(true);
  };

  const handleAddToCartClick = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault();
      handleAuthRequired('login');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?q=${encodeURIComponent(searchQuery)}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  // Check if link is active
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navLinks = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/shop', label: 'Shop', icon: Store },
    { path: '/about', label: 'About', icon: Info },
    { path: '/contact', label: 'Contact', icon: Phone },
  ];

  return (
    <>
      {/* Top Bar - Promo Banner */}
      <div className="bg-red-600 text-white py-2 text-sm">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span className="hidden sm:flex items-center gap-1">
              <Truck className="w-4 h-4" />
              Free Shipping on ₱5,000+
            </span>
            <span className="hidden sm:flex items-center gap-1">
              <Shield className="w-4 h-4" />
              2-Year Warranty
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a href="tel:+639985868888" className="hover:text-red-200 transition flex items-center gap-1">
              <PhoneIcon className="w-4 h-4" />
              <span className="hidden sm:inline">(63) 998 586 8888</span>
            </a>
            <a href="mailto:support@doctama.com" className="hover:text-red-200 transition flex items-center gap-1">
              <Mail className="w-4 h-4" />
              <span className="hidden sm:inline">support@doctama.com</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <nav className="bg-white shadow-lg sticky top-0 z-40">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center group-hover:bg-red-700 transition transform group-hover:scale-105">
                <span className="text-white font-bold text-2xl">D</span>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-xl text-gray-900 leading-tight">Doctama's</span>
                <span className="text-sm text-red-600 font-medium -mt-1">Marketing</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {navLinks.map(({ path, label, icon: Icon }) => (
                <Link
                  key={path}
                  to={path}
                  className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                    isActive(path)
                      ? 'text-red-600 bg-red-50'
                      : 'text-gray-700 hover:text-red-600 hover:bg-red-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              ))}
            </div>

            {/* Right Icons */}
            <div className="flex items-center space-x-2">
              {/* Search - Desktop */}
              <div className="hidden md:block relative">
                <form onSubmit={handleSearch}>
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-64 px-4 py-2 pl-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                </form>
              </div>

              {/* Search - Mobile Toggle */}
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
              >
                <Search className="w-5 h-5 text-gray-700" />
              </button>

              {/* Wishlist */}
              <Link
                to="/wishlist"
                className="hidden md:flex p-2 hover:bg-red-50 rounded-lg transition relative group"
              >
                <Heart className="w-5 h-5 text-gray-700 group-hover:text-red-600" />
              </Link>

              {/* Cart */}
              <Link
                to="/cart"
                className="relative p-2 hover:bg-red-50 rounded-lg transition group"
                onClick={handleAddToCartClick}
              >
                <ShoppingCart className="w-5 h-5 text-gray-700 group-hover:text-red-600" />
                {state.items.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                    {state.items.length}
                  </span>
                )}
              </Link>

              {/* User Menu */}
              {user ? (
                <div className="relative group">
                  <button className="flex items-center space-x-2 p-1 hover:bg-red-50 rounded-lg transition">
                    <div className="w-9 h-9 bg-red-100 rounded-full flex items-center justify-center">
                      <span className="text-red-600 font-semibold">
                        {user.fullName?.charAt(0) || user.email?.charAt(0)}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-500 group-hover:rotate-90 transition-transform" />
                  </button>
                  
                  {/* Dropdown */}
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all border border-gray-100">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{user.fullName || 'User'}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                    <Link to="/account" className="block px-4 py-2 text-gray-700 hover:bg-red-50 hover:text-red-600 transition">My Account</Link>
                    <Link to="/account/orders" className="block px-4 py-2 text-gray-700 hover:bg-red-50 hover:text-red-600 transition">My Orders</Link>
                    <Link to="/wishlist" className="block px-4 py-2 text-gray-700 hover:bg-red-50 hover:text-red-600 transition md:hidden">Wishlist</Link>
                    <div className="border-t border-gray-100 my-1"></div>
                    <button
                      onClick={logout}
                      className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 flex items-center transition"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => handleAuthRequired('login')}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
                >
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">Sign In</span>
                </button>
              )}

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Search Bar */}
          {searchOpen && (
            <div className="md:hidden py-3 border-t">
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 pl-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  autoFocus
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </form>
            </div>
          )}

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t">
              {navLinks.map(({ path, label, icon: Icon }) => (
                <Link
                  key={path}
                  to={path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 py-3 px-2 rounded-lg transition ${
                    isActive(path)
                      ? 'text-red-600 bg-red-50'
                      : 'text-gray-700 hover:text-red-600 hover:bg-red-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {label}
                </Link>
              ))}
              <div className="border-t my-2"></div>
              <div className="py-2 px-2">
                <p className="text-sm text-gray-500 mb-2">Contact us:</p>
                <a href="tel:+639171234567" className="flex items-center gap-3 py-2 text-gray-700 hover:text-red-600">
                  <PhoneIcon className="w-5 h-5" />
                  (63) 917 123 4567
                </a>
                <a href="mailto:support@doctama.com" className="flex items-center gap-3 py-2 text-gray-700 hover:text-red-600">
                  <Mail className="w-5 h-5" />
                  support@doctama.com
                </a>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Auth Sidebar */}
      <AuthSidebar
        isOpen={authSidebarOpen}
        onClose={() => setAuthSidebarOpen(false)}
        initialMode={authMode}
        onModeChange={setAuthMode}
      />

      {/* Main Content - with Outlet and context */}
      <main className="min-h-screen bg-gray-50">
        <Outlet context={{ onAuthRequired: handleAuthRequired }} />
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white pt-16 pb-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {/* Company Info */}
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-2xl">D</span>
                </div>
                <div>
                  <span className="font-bold text-xl text-white">Doctama's</span>
                  <span className="block text-sm text-red-400">Marketing</span>
                </div>
              </div>
              <p className="text-gray-400 mb-4">
                Your trusted partner for quality furniture since 2024. We bring comfort and style to your home.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-red-600 transition">
                  <Facebook className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-red-600 transition">
                  <Instagram className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-red-600 transition">
                  <Twitter className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-semibold mb-6 text-white">Quick Links</h3>
              <ul className="space-y-3">
                <li>
                  <Link to="/" className="text-gray-400 hover:text-red-400 transition flex items-center">
                    <ChevronRight className="w-4 h-4 mr-2" />
                    Home
                  </Link>
                </li>
                <li>
                  <Link to="/shop" className="text-gray-400 hover:text-red-400 transition flex items-center">
                    <ChevronRight className="w-4 h-4 mr-2" />
                    Shop
                  </Link>
                </li>
                <li>
                  <Link to="/about" className="text-gray-400 hover:text-red-400 transition flex items-center">
                    <ChevronRight className="w-4 h-4 mr-2" />
                    About Us
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="text-gray-400 hover:text-red-400 transition flex items-center">
                    <ChevronRight className="w-4 h-4 mr-2" />
                    Contact
                  </Link>
                </li>
                <li>
                  <Link to="/account/orders" className="text-gray-400 hover:text-red-400 transition flex items-center">
                    <ChevronRight className="w-4 h-4 mr-2" />
                    My Orders
                  </Link>
                </li>
              </ul>
            </div>

            {/* Categories */}
            <div>
              <h3 className="text-lg font-semibold mb-6 text-white">Shop by Category</h3>
              <ul className="space-y-3">
                <li>
                  <Link to="/shop?category=living" className="text-gray-400 hover:text-red-400 transition flex items-center">
                    <ChevronRight className="w-4 h-4 mr-2" />
                    Living Room
                  </Link>
                </li>
                <li>
                  <Link to="/shop?category=bedroom" className="text-gray-400 hover:text-red-400 transition flex items-center">
                    <ChevronRight className="w-4 h-4 mr-2" />
                    Bedroom
                  </Link>
                </li>
                <li>
                  <Link to="/shop?category=dining" className="text-gray-400 hover:text-red-400 transition flex items-center">
                    <ChevronRight className="w-4 h-4 mr-2" />
                    Dining
                  </Link>
                </li>
                <li>
                  <Link to="/shop?category=office" className="text-gray-400 hover:text-red-400 transition flex items-center">
                    <ChevronRight className="w-4 h-4 mr-2" />
                    Office
                  </Link>
                </li>
                <li>
                  <Link to="/shop?category=lighting" className="text-gray-400 hover:text-red-400 transition flex items-center">
                    <ChevronRight className="w-4 h-4 mr-2" />
                    Lighting
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h3 className="text-lg font-semibold mb-6 text-white">Contact Us</h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-400">123 Rizal St., Makati City, Metro Manila, Philippines</span>
                </li>
                <li className="flex items-center gap-3">
                  <PhoneIcon className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <a href="tel:+639171234567" className="text-gray-400 hover:text-red-400 transition">
                    (63) 917 123 4567
                  </a>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <a href="mailto:support@doctama.com" className="text-gray-400 hover:text-red-400 transition">
                    support@doctama.com
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-800 pt-8 mt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 text-sm mb-4 md:mb-0">
                © 2024 Doctama's Marketing. All rights reserved.
              </p>
              <div className="flex items-center gap-6">
                <Link to="/privacy" className="text-gray-400 hover:text-red-400 text-sm">Privacy Policy</Link>
                <Link to="/terms" className="text-gray-400 hover:text-red-400 text-sm">Terms of Service</Link>
                <Link to="/returns" className="text-gray-400 hover:text-red-400 text-sm">Returns Policy</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Layout;