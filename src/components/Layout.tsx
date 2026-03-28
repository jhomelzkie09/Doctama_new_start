import React, { useState, useEffect } from 'react';
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
  ChevronDown,
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
  Truck,
  Shield,
  Clock,
  Sparkles,
  ArrowRight,
  UserCircle,
  Settings,
  Package,
  Heart as HeartIcon
} from 'lucide-react';
import AuthSidebar from './AuthSidebar';
import ConfirmationModal from './ConfirmationModal';
import logo from '../../public/logo.png';

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
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  const handleLogoutClick = () => {
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = async () => {
    setLoggingOut(true);
    // Small delay to show loading state
    await new Promise(resolve => setTimeout(resolve, 500));
    logout();
    setShowLogoutModal(false);
    setLoggingOut(false);
  };

  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/shop', label: 'Shop', icon: Store },
    { path: '/about', label: 'About', icon: Info },
    { path: '/contact', label: 'Contact', icon: Phone },
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-900">
      {/* Confirmation Modal for Logout */}
      <ConfirmationModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleConfirmLogout}
        title="Sign Out"
        message="Are you sure you want to sign out? You'll need to log in again to access your account."
        confirmText="Sign Out"
        cancelText="Cancel"
        type="warning"
        loading={loggingOut}
      />

      {/* 1. Refined Announcement Bar */}
      <div className="bg-slate-900 text-slate-300 py-2 border-b border-white/5">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex justify-between items-center text-[11px] font-semibold uppercase tracking-[0.1em]">
            <div className="flex items-center gap-4 md:gap-8">
              <span className="flex items-center gap-1 md:gap-2 hover:text-white transition-colors cursor-default">
                <Truck className="w-3 h-3 md:w-3.5 md:h-3.5 text-rose-500" />
                <span className="hidden xs:inline">Free Shipping Over ₱5,000</span>
                <span className="xs:hidden">Free Shipping</span>
              </span>
              <span className="hidden md:flex items-center gap-2 hover:text-white transition-colors cursor-default">
                <Shield className="w-3.5 h-3.5 text-rose-500" />
                Premium 2-Year Warranty
              </span>
            </div>
            <div className="flex items-center gap-3 md:gap-6">
              <a href="tel:+639985868888" className="hover:text-white transition-colors flex items-center gap-1 md:gap-2">
                <PhoneIcon className="w-3 h-3" />
                <span className="hidden sm:inline">+63 998 586 8888</span>
                <span className="sm:hidden">Call</span>
              </a>
              <span className="w-px h-3 bg-slate-700 hidden sm:block"></span>
              <a href="mailto:support@doctama.com" className="hover:text-white transition-colors flex items-center gap-1 md:gap-2">
                <Mail className="w-3 h-3" />
                <span className="hidden sm:inline">Support</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Sleek Sticky Navbar */}
      <nav className={`sticky top-0 z-50 transition-all duration-500 ${
        scrolled 
          ? 'bg-white/80 backdrop-blur-xl border-b border-slate-200/50 py-2 md:py-3 shadow-sm' 
          : 'bg-white py-3 md:py-5'
      }`}>
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex justify-between items-center">
            
            {/* Elegant Logo Design - Mobile Optimized */}
            <Link to="/" className="group flex items-center gap-2 md:gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center group-hover:rotate-0 transition-transform duration-300">
                <img 
                  src= {logo} 
                  alt="Doctama Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-black text-sm md:text-xl tracking-tight text-slate-900 uppercase">Doctama's</span>
                <span className="text-[8px] md:text-[10px] font-bold text-rose-600 tracking-[0.1em] md:tracking-[0.2em] uppercase">Marketing</span>
              </div>
            </Link>

            {/* Centered Minimal Nav - Desktop Only */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map(({ path, label }) => (
                <Link
                  key={path}
                  to={path}
                  className={`px-5 py-2 text-sm font-semibold rounded-full transition-all duration-300 ${
                    isActive(path)
                      ? 'text-rose-600 bg-rose-50'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {label}
                </Link>
              ))}
            </div>

            {/* Utility Icons - Mobile Optimized */}
            <div className="flex items-center gap-1 md:gap-2">
              {/* Search Icon - Mobile */}
              <button 
                onClick={() => setSearchOpen(!searchOpen)} 
                className="md:hidden p-2 text-slate-500 hover:text-rose-600 transition-colors"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Search Bar - Desktop */}
              <form onSubmit={handleSearch} className="relative hidden md:flex items-center">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-40 focus:w-64 px-4 py-2 pl-10 text-sm bg-slate-100 border-none rounded-full focus:ring-2 focus:ring-rose-500/20 transition-all placeholder:text-slate-400"
                />
                <Search className="absolute left-3.5 w-4 h-4 text-slate-400" />
              </form>

              {/* Wishlist - Desktop Only */}
              <Link to="/wishlist" className="hidden md:flex p-2 text-slate-500 hover:text-rose-600 transition-colors">
                <Heart className="w-5 h-5" />
              </Link>

              {/* Cart */}
              <Link to="/cart" onClick={handleAddToCartClick} className="relative p-2 text-slate-500 hover:text-rose-600 transition-colors">
                <ShoppingCart className="w-5 h-5" />
                {state.items.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                    {state.items.length}
                  </span>
                )}
              </Link>

              {/* User Menu - Mobile & Desktop */}
              {user ? (
                <div className="relative">
                  <button 
                    onClick={() => setUserMenuOpen(!userMenuOpen)} 
                    className="flex items-center gap-1 md:gap-2 group p-1"
                  >
                    <div className="w-8 h-8 md:w-9 md:h-9 bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center overflow-hidden transition-all group-hover:border-rose-300">
                      {user.fullName ? (
                        <span className="text-sm font-bold text-slate-700">{user.fullName.charAt(0).toUpperCase()}</span>
                      ) : <User className="w-4 h-4 text-slate-400" />}
                    </div>
                    <ChevronDown className={`w-3 h-3 md:w-4 md:h-4 text-slate-400 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {/* Dropdown Menu - Mobile & Desktop */}
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-100 rounded-2xl shadow-xl py-2 animate-in fade-in zoom-in-95 duration-200 z-50">
                      <div className="px-4 py-3 border-b border-slate-50">
                        <p className="text-xs text-slate-400 font-medium">Signed in as</p>
                        <p className="text-sm font-bold text-slate-900 truncate">{user.email}</p>
                      </div>
                      <Link to="/account" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition-colors">
                        <UserCircle className="w-4 h-4" /> My Profile
                      </Link>
                      <Link to="/account/orders" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition-colors">
                        <Package className="w-4 h-4" /> My Orders
                      </Link>
                      <Link to="/wishlist" onClick={() => setUserMenuOpen(false)} className="md:hidden flex items-center gap-3 px-4 py-2 text-sm text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition-colors">
                        <HeartIcon className="w-4 h-4" /> Wishlist
                      </Link>
                      <div className="border-t border-slate-100 my-1"></div>
                      <button 
                        onClick={handleLogoutClick} 
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                // Sign In Button - Mobile Optimized
                <button
                  onClick={() => handleAuthRequired('login')}
                  className="ml-1 md:ml-2 flex items-center gap-1 md:gap-2 px-3 md:px-6 py-1.5 md:py-2.5 bg-slate-900 text-white text-xs md:text-sm font-bold rounded-full hover:bg-rose-600 transition-all shadow-md shadow-slate-200 active:scale-95"
                >
                  <User className="w-4 h-4" />
                  <span className="hidden xs:inline">Sign In</span>
                  <span className="xs:hidden">Login</span>
                </button>
              )}

              {/* Mobile menu button */}
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden p-2 ml-1 text-slate-900">
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Search Bar */}
          {searchOpen && (
            <div className="md:hidden py-3 border-t mt-2">
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 pl-10 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                  autoFocus
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </form>
            </div>
          )}
        </div>
      </nav>

      {/* 3. Mobile Navigation Menu - Enhanced */}
      <div className={`fixed inset-0 z-[60] bg-white transition-transform duration-500 lg:hidden ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-5 h-full flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-rose-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-black text-lg italic">D</span>
              </div>
              <div className="flex flex-col">
                <span className="font-black text-sm text-slate-900 uppercase">Doctama's</span>
                <span className="text-[8px] font-bold text-rose-600 uppercase">Marketing</span>
              </div>
            </div>
            <button onClick={() => setMobileMenuOpen(false)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="space-y-4">
            {navLinks.map(({ path, label, icon: Icon }) => (
              <Link 
                key={path} 
                to={path} 
                onClick={() => setMobileMenuOpen(false)} 
                className={`flex items-center gap-4 p-3 rounded-xl transition-all ${
                  isActive(path)
                    ? 'bg-rose-50 text-rose-600'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-lg font-semibold">{label}</span>
              </Link>
            ))}
          </div>

          {/* User Section in Mobile Menu */}
          {user && (
            <div className="mt-8 pt-6 border-t border-slate-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center">
                  <span className="text-lg font-bold text-rose-600">
                    {user.fullName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-bold text-slate-900">{user.fullName || 'User'}</p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Link to="/account" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-xl text-slate-700 hover:bg-slate-50 transition">
                  <UserCircle className="w-5 h-5" />
                  <span>My Account</span>
                </Link>
                <Link to="/account/orders" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-xl text-slate-700 hover:bg-slate-50 transition">
                  <Package className="w-5 h-5" />
                  <span>My Orders</span>
                </Link>
                <Link to="/wishlist" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-xl text-slate-700 hover:bg-slate-50 transition">
                  <HeartIcon className="w-5 h-5" />
                  <span>Wishlist</span>
                </Link>
                <button onClick={handleLogoutClick} className="w-full flex items-center gap-3 p-3 rounded-xl text-red-600 hover:bg-red-50 transition">
                  <LogOut className="w-5 h-5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}

          {/* Contact Info in Mobile Menu */}
          <div className="mt-auto pt-6 border-t border-slate-100">
            <p className="text-xs text-slate-400 mb-3">Need help?</p>
            <a href="tel:+639985868888" className="flex items-center gap-3 p-3 text-slate-700 hover:bg-slate-50 rounded-xl transition">
              <PhoneIcon className="w-5 h-5" />
              <span>+63 998 586 8888</span>
            </a>
            <a href="mailto:support@doctama.com" className="flex items-center gap-3 p-3 text-slate-700 hover:bg-slate-50 rounded-xl transition">
              <Mail className="w-5 h-5" />
              <span>support@doctama.com</span>
            </a>
          </div>
        </div>
      </div>

      <AuthSidebar
        isOpen={authSidebarOpen}
        onClose={() => setAuthSidebarOpen(false)}
        initialMode={authMode}
        onModeChange={setAuthMode}
      />

      <main className="flex-1">
        <Outlet context={{ onAuthRequired: handleAuthRequired }} />
      </main>

      {/* Footer - Mobile Optimized */}
      <footer className="bg-slate-900 text-white pt-12 pb-6">
        <div className="container mx-auto px-4">
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-rose-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">D</span>
                </div>
                <span className="font-black text-lg tracking-tight uppercase">Doctama's</span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                Defining the standard of modern living in the Philippines since 2024.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold mb-4 text-sm uppercase tracking-widest text-rose-500">Shop</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><Link to="/shop" className="hover:text-white transition">New Arrivals</Link></li>
                <li><Link to="/shop" className="hover:text-white transition">Best Sellers</Link></li>
                <li><Link to="/shop" className="hover:text-white transition">Living Room</Link></li>
                <li><Link to="/shop" className="hover:text-white transition">Bedroom</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4 text-sm uppercase tracking-widest text-rose-500">Company</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><Link to="/about" className="hover:text-white transition">Our Story</Link></li>
                <li><Link to="/contact" className="hover:text-white transition">Contact</Link></li>
                <li><Link to="/" className="hover:text-white transition">Showrooms</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4 text-sm uppercase tracking-widest text-rose-500">Visit Us</h4>
              <p className="text-slate-400 text-sm leading-relaxed">
                123 Rizal St., Makati City<br/>
                Metro Manila, PH<br/>
                <span className="text-white block mt-2">+63 917 123 4567</span>
              </p>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800 text-center">
            <p className="text-slate-500 text-xs">© 2026 Doctama's Marketing. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;