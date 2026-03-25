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
  UserCircle
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
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

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

  const handleLogout = () => {
    setUserMenuOpen(false);
    logout();
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
      {/* 1. Refined Announcement Bar */}
      <div className="bg-slate-900 text-slate-300 py-2 border-b border-white/5">
        <div className="container mx-auto px-6">
          <div className="flex justify-between items-center text-[11px] font-semibold uppercase tracking-[0.1em]">
            <div className="flex items-center gap-8">
              <span className="flex items-center gap-2 hover:text-white transition-colors cursor-default">
                <Truck className="w-3.5 h-3.5 text-rose-500" />
                Free Shipping Over ₱5,000
              </span>
              <span className="hidden md:flex items-center gap-2 hover:text-white transition-colors cursor-default">
                <Shield className="w-3.5 h-3.5 text-rose-500" />
                Premium 2-Year Warranty
              </span>
            </div>
            <div className="flex items-center gap-6">
              <a href="tel:+639985868888" className="hover:text-white transition-colors flex items-center gap-2">
                <PhoneIcon className="w-3 h-3" />
                <span>+63 998 586 8888</span>
              </a>
              <span className="w-px h-3 bg-slate-700"></span>
              <a href="mailto:support@doctama.com" className="hover:text-white transition-colors flex items-center gap-2">
                <Mail className="w-3 h-3" />
                <span className="hidden sm:inline">Support Center</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Sleek Sticky Navbar */}
      <nav className={`sticky top-0 z-50 transition-all duration-500 ${
        scrolled 
          ? 'bg-white/80 backdrop-blur-xl border-b border-slate-200/50 py-3 shadow-sm' 
          : 'bg-white py-5'
      }`}>
        <div className="container mx-auto px-6">
          <div className="flex justify-between items-center">
            
            {/* Elegant Logo Design */}
            <Link to="/" className="group flex items-center gap-3">
              <div className="w-10 h-10 bg-rose-600 rounded-lg flex items-center justify-center rotate-3 group-hover:rotate-0 transition-transform duration-300 shadow-lg shadow-rose-200">
                <span className="text-white font-black text-xl italic">D</span>
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-black text-xl tracking-tight text-slate-900 uppercase">Doctama's</span>
                <span className="text-[10px] font-bold text-rose-600 tracking-[0.2em] uppercase">Marketing</span>
              </div>
            </Link>

            {/* Centered Minimal Nav */}
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

            {/* Utility Icons */}
            <div className="flex items-center gap-1">
              {/* Expandable Search */}
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

              <Link to="/wishlist" className="p-2.5 text-slate-500 hover:text-rose-600 transition-colors">
                <Heart className="w-5 h-5" />
              </Link>

              <Link to="/cart" onClick={handleAddToCartClick} className="p-2.5 text-slate-500 hover:text-rose-600 relative transition-colors group">
                <ShoppingCart className="w-5 h-5" />
                {state.items.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                    {state.items.length}
                  </span>
                )}
              </Link>

              <div className="h-6 w-px bg-slate-200 mx-2 hidden sm:block"></div>

              {/* User Identity */}
              {user ? (
                <div className="relative ml-2">
                  <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center gap-2 group">
                    <div className="w-9 h-9 bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center overflow-hidden transition-all group-hover:border-rose-300">
                      {user.fullName ? (
                        <span className="text-sm font-bold text-slate-700">{user.fullName.charAt(0)}</span>
                      ) : <User className="w-4 h-4 text-slate-400" />}
                    </div>
                  </button>
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-4 w-56 bg-white border border-slate-100 rounded-2xl shadow-xl py-2 animate-in fade-in zoom-in-95 duration-200">
                      <div className="px-4 py-3 border-b border-slate-50">
                        <p className="text-xs text-slate-400 font-medium">Signed in as</p>
                        <p className="text-sm font-bold text-slate-900 truncate">{user.email}</p>
                      </div>
                      <Link to="/account" className="flex items-center gap-3 px-4 py-2 text-sm text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition-colors">
                        <UserCircle className="w-4 h-4" /> My Profile
                      </Link>
                      <button 
                        onClick={handleLogout} 
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors mt-2"
                      >
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => handleAuthRequired('login')}
                  className="ml-2 hidden sm:flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-full hover:bg-rose-600 transition-all shadow-md shadow-slate-200 active:scale-95"
                >
                  Sign In
                </button>
              )}

              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden p-2 ml-1 text-slate-900">
                {mobileMenuOpen ? <X /> : <Menu />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 3. Mobile Navigation Menu Upgrade */}
      <div className={`fixed inset-0 z-[60] bg-white transition-transform duration-500 lg:hidden ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6 h-full flex flex-col">
          <div className="flex justify-between items-center mb-12">
            <span className="text-2xl font-black italic text-rose-600">D.</span>
            <button onClick={() => setMobileMenuOpen(false)} className="p-2 bg-slate-100 rounded-full"><X /></button>
          </div>
          <div className="space-y-6">
            {navLinks.map(({ path, label, icon: Icon }) => (
              <Link key={path} to={path} onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-between text-3xl font-bold text-slate-900 hover:text-rose-600 transition-colors">
                {label} <ChevronRight className="w-8 h-8 text-slate-200" />
              </Link>
            ))}
          </div>
          <div className="mt-auto pt-10 border-t border-slate-100">
            <p className="text-slate-400 text-sm mb-4">Support & Contact</p>
            <p className="font-bold text-xl">+63 998 586 8888</p>
            <div className="flex gap-4 mt-6">
               <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-white"><Instagram className="w-5 h-5"/></div>
               <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-white"><Facebook className="w-5 h-5"/></div>
            </div>
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

      {/* 4. Architectural Footer */}
      <footer className="bg-slate-900 text-white pt-20 pb-10">
        <div className="container mx-auto px-6">
          {/* Newsletter Box */}
          <div className="bg-rose-600 rounded-[2rem] p-8 md:p-12 flex flex-col lg:flex-row items-center justify-between gap-8 mb-20 relative overflow-hidden">
            <Sparkles className="absolute top-0 right-0 w-64 h-64 text-white/10 -mr-20 -mt-20" />
            <div className="relative z-10 text-center lg:text-left">
              <h3 className="text-3xl md:text-4xl font-black mb-2 tracking-tight">Join the Inner Circle.</h3>
              <p className="text-rose-100 font-medium">Get early access to drops and a 10% discount on your first order.</p>
            </div>
            <form className="relative z-10 w-full lg:w-auto flex bg-white/10 p-2 rounded-2xl backdrop-blur-md">
              <input
                type="email"
                placeholder="email@example.com"
                className="bg-transparent border-none text-white placeholder:text-rose-200 focus:ring-0 px-4 py-3 w-full lg:w-64"
              />
              <button className="bg-white text-rose-600 font-bold px-8 py-3 rounded-xl hover:bg-slate-900 hover:text-white transition-all">
                Subscribe
              </button>
            </form>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12 mb-20">
            <div className="col-span-2">
              <span className="text-2xl font-black tracking-tighter mb-6 block uppercase">Doctama's<span className="text-rose-500">.</span></span>
              <p className="text-slate-400 max-w-sm leading-relaxed mb-8">
                Defining the standard of modern living in the Philippines. We blend artisanal craftsmanship with contemporary design since 2024.
              </p>
              <div className="flex gap-4">
                {[Instagram, Facebook, Twitter].map((Icon, idx) => (
                  <a key={idx} href="#" className="w-10 h-10 rounded-full border border-slate-800 flex items-center justify-center hover:bg-white hover:text-slate-900 transition-all">
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-bold mb-6 text-sm uppercase tracking-widest text-rose-500">Shop</h4>
              <ul className="space-y-4 text-slate-400 text-sm font-medium">
                <li><Link to="/shop" className="hover:text-white transition-colors">New Arrivals</Link></li>
                <li><Link to="/shop" className="hover:text-white transition-colors">Best Sellers</Link></li>
                <li><Link to="/shop" className="hover:text-white transition-colors">Living Room</Link></li>
                <li><Link to="/shop" className="hover:text-white transition-colors">Bedroom</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-6 text-sm uppercase tracking-widest text-rose-500">Company</h4>
              <ul className="space-y-4 text-slate-400 text-sm font-medium">
                <li><Link to="/about" className="hover:text-white transition-colors">Our Story</Link></li>
                <li><Link to="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                <li><Link to="/" className="hover:text-white transition-colors">Showrooms</Link></li>
                <li><Link to="/" className="hover:text-white transition-colors">Careers</Link></li>
              </ul>
            </div>

            <div className="col-span-2 md:col-span-1">
              <h4 className="font-bold mb-6 text-sm uppercase tracking-widest text-rose-500">Visit Us</h4>
              <p className="text-slate-400 text-sm leading-loose">
                123 Rizal St., Makati City<br/>
                Metro Manila, PH<br/>
                <span className="text-white block mt-2">+63 917 123 4567</span>
              </p>
            </div>
          </div>

          <div className="pt-10 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-slate-500 text-xs">© 2026 Doctama's Marketing. Crafted for excellence.</p>
            <div className="flex gap-8 text-[10px] uppercase tracking-widest font-bold text-slate-500">
              <Link to="/privacy" className="hover:text-rose-500 transition-colors">Privacy</Link>
              <Link to="/terms" className="hover:text-rose-500 transition-colors">Terms</Link>
              <Link to="/returns" className="hover:text-rose-500 transition-colors">Shipping</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;