import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import userService from '../services/user.service';
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
  Search,
  Mail,
  Phone as PhoneIcon,
  MapPin,
  Truck,
  Shield,
  Clock,
  Sparkles,
  ArrowRight,
  UserCircle,
  Package,
  Award,
  Moon,
  Sun,
  Facebook as FacebookIcon,
  Instagram as InstagramIcon,
  Twitter as TwitterIcon,
  Youtube,
  PenTool
} from 'lucide-react';
import AuthSidebar from './AuthSidebar';
import ConfirmationModal from './ConfirmationModal';
import logo from '../assets/logo.png';

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
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Theme (dark mode) initialization + persistence
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const storedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia?.('(prefers-color-scheme: dark)')?.matches;
    const initialTheme: 'light' | 'dark' =
      storedTheme === 'dark' || storedTheme === 'light'
        ? storedTheme
        : systemPrefersDark
          ? 'dark'
          : 'light';

    setTheme(initialTheme);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Load profile picture when user changes
  useEffect(() => {
    const loadProfilePicture = async () => {
      if (user) {
        try {
          const profile = await userService.getCurrentUserProfile();
          if (profile?.profilePicture) {
            setProfilePicture(profile.profilePicture);
          } else {
            setProfilePicture(null);
          }
        } catch (error) {
          console.error('Failed to load profile picture:', error);
          setProfilePicture(null);
        }
      } else {
        setProfilePicture(null);
      }
    };

    loadProfilePicture();
  }, [user]);

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
    await new Promise(resolve => setTimeout(resolve, 500));
    logout();
    setShowLogoutModal(false);
    setLoggingOut(false);
  };

  const handleToggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/shop', label: 'Shop', icon: Store },
    { path: '/contact', label: 'Customize', icon: PenTool },
    { path: '/about', label: 'About', icon: Info },
  ];

  const socialLinks = [
    { icon: FacebookIcon, href: 'https://facebook.com/doctama', label: 'Facebook', color: 'hover:text-blue-500' },
    { icon: InstagramIcon, href: 'https://instagram.com/doctama', label: 'Instagram', color: 'hover:text-pink-500' },
    { icon: TwitterIcon, href: 'https://twitter.com/doctama', label: 'Twitter', color: 'hover:text-sky-500' },
    { icon: Youtube, href: 'https://youtube.com/@doctama', label: 'YouTube', color: 'hover:text-red-600' },
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-900 bg-white dark:bg-slate-950 dark:text-slate-100 transition-colors">
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

      {/* Announcement Bar */}
      <div className="bg-slate-900 text-slate-300 py-2 border-b border-white/5">
        <div className="container mx-auto px-3 sm:px-4 md:px-6">
          <div className="flex justify-between items-center text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.1em]">
            <div className="flex items-center gap-2 sm:gap-4 md:gap-8">
              <span className="flex items-center gap-1 sm:gap-2 hover:text-white transition-colors cursor-default">
                <Truck className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-rose-500" />
                <span className="hidden xs:inline">Free Shipping Over ₱5,000</span>
                <span className="xs:hidden">Free Ship</span>
              </span>
              <span className="hidden md:flex items-center gap-2 hover:text-white transition-colors cursor-default">
                <Shield className="w-3.5 h-3.5 text-rose-500" />
                Premium 2-Year Warranty
              </span>
              <span className="hidden lg:flex items-center gap-2 hover:text-white transition-colors cursor-default">
                <Award className="w-3.5 h-3.5 text-rose-500" />
                Quality Guaranteed
              </span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 md:gap-6">
              <a href="tel:+639985868888" className="hover:text-white transition-colors flex items-center gap-1 sm:gap-2">
                <PhoneIcon className="w-3 h-3" />
                <span className="hidden sm:inline">+63 998 586 8888</span>
                <span className="sm:hidden">Call</span>
              </a>
              <span className="w-px h-3 bg-slate-700 hidden sm:block"></span>
              <a href="mailto:support@doctama.com" className="hover:text-white transition-colors flex items-center gap-1 sm:gap-2">
                <Mail className="w-3 h-3" />
                <span className="hidden sm:inline">Support</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Navbar */}
      <nav className={`sticky top-0 z-50 transition-all duration-500 ${
        scrolled 
          ? 'bg-white/90 dark:bg-slate-950/80 backdrop-blur-lg border-b border-slate-200/50 dark:border-slate-800/60 py-2 shadow-sm' 
          : 'bg-white dark:bg-slate-950 py-2 sm:py-3 md:py-4'
      }`}>
        <div className="container mx-auto px-3 sm:px-4 md:px-6">
          <div className="flex justify-between items-center gap-2">
            
            {/* Logo */}
            <Link to="/" className="group flex items-center gap-2 md:gap-3 flex-shrink-0">
              <div className="w-9 h-9 sm:w-11 sm:h-11 md:w-16 md:h-16 rounded-lg flex items-center justify-center">
                <img 
                  src={logo} 
                  alt="Doctama Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-black text-sm sm:text-base md:text-2xl tracking-tight text-slate-900 dark:text-slate-100 uppercase">Doctama's</span>
                <span className="text-[7px] sm:text-[9px] md:text-[11px] font-bold text-rose-600 tracking-[0.15em] md:tracking-[0.25em] uppercase">Marketing</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map(({ path, label, icon: Icon }) => (
                <Link
                  key={path}
                  to={path}
                  className={`px-4 md:px-5 py-2 text-sm font-semibold rounded-full transition-all duration-300 flex items-center gap-2 ${
                    isActive(path)
                      ? 'text-rose-600 bg-rose-50 dark:bg-rose-500/10'
                      : 'text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-900/40'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              ))}
            </div>

            {/* Utility Icons */}
            <div className="flex items-center gap-1 sm:gap-2">
              <button 
                onClick={() => setSearchOpen(!searchOpen)} 
                className="md:hidden p-1.5 sm:p-2 text-slate-500 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
              >
                <Search className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              <form onSubmit={handleSearch} className="relative hidden md:flex items-center">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-40 focus:w-64 px-4 py-2 pl-10 text-sm bg-slate-100 dark:bg-slate-900/60 dark:text-slate-100 border-none rounded-full focus:ring-2 focus:ring-rose-500/20 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
                <Search className="absolute left-3.5 w-4 h-4 text-slate-400 dark:text-slate-500" />
              </form>

              <Link to="/cart" onClick={handleAddToCartClick} className="relative p-1.5 sm:p-2 text-slate-500 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 transition-colors">
                <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                {state.items.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                    {state.items.length > 9 ? '9+' : state.items.length}
                  </span>
                )}
              </Link>

              {/* User Menu */}
              {user ? (
                <div className="relative">
                  <button 
                    onClick={() => setUserMenuOpen(!userMenuOpen)} 
                    className="flex items-center gap-1 group p-1"
                  >
                    <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full flex items-center justify-center overflow-hidden transition-all group-hover:border-rose-300">
                      {profilePicture ? (
                        <img 
                          src={profilePicture} 
                          alt={user.fullName || user.email}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200">
                          {user.fullName ? user.fullName.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      )}
                    </div>
                    <ChevronDown className={`w-3 h-3 text-slate-400 dark:text-slate-500 transition-transform duration-200 hidden sm:block ${userMenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xl py-2 animate-in fade-in zoom-in-95 duration-200 z-50">
                      <div className="px-4 py-3 border-b border-slate-50 dark:border-slate-800 flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex-shrink-0">
                          {profilePicture ? (
                            <img 
                              src={profilePicture} 
                              alt={user.fullName || user.email}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-rose-100">
                              <span className="text-sm font-bold text-rose-600">
                                {user.fullName ? user.fullName.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase() || 'U'}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                            {user.fullName || user.email?.split('@')[0] || 'User'}
                          </p>
                          <p className="text-xs text-slate-400 dark:text-slate-400 truncate">{user.email}</p>
                        </div>
                      </div>
                      <Link to="/account/profile" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-slate-600 dark:text-slate-200 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-300 transition-colors">
                        <UserCircle className="w-4 h-4" /> My Profile
                      </Link>
                      <Link to="/account/orders" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-slate-600 dark:text-slate-200 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-300 transition-colors">
                        <Package className="w-4 h-4" /> My Orders
                      </Link>
                      <button
                        type="button"
                        onClick={handleToggleTheme}
                        className="w-full flex items-center justify-between gap-3 px-4 py-2 text-sm text-slate-600 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <span className="flex items-center gap-3">
                          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
                        </span>
                        <span
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                            theme === 'dark' ? 'bg-rose-600' : 'bg-slate-300 dark:bg-slate-700'
                          }`}
                          aria-hidden="true"
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              theme === 'dark' ? 'translate-x-4' : 'translate-x-1'
                            }`}
                          />
                        </span>
                      </button>
                      <div className="border-t border-slate-100 dark:border-slate-800 my-1"></div>
                      <button 
                        onClick={handleLogoutClick} 
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                      >
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => handleAuthRequired('login')}
                  className="ml-0 sm:ml-2 flex items-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-6 py-1 sm:py-1.5 md:py-2.5 bg-slate-900 text-white text-[11px] sm:text-xs md:text-sm font-bold rounded-full hover:bg-rose-600 transition-all shadow-md shadow-slate-200 active:scale-95"
                >
                  <User className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden xs:inline text-xs sm:text-sm">Sign In</span>
                  <span className="xs:hidden text-[10px]">Login</span>
                </button>
              )}

              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
                className="lg:hidden p-1.5 sm:p-2 ml-0 sm:ml-1 text-slate-900 dark:text-slate-100"
              >
                {mobileMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Search Bar */}
          {searchOpen && (
            <div className="md:hidden py-2 border-t mt-2">
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 pl-9 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                  autoFocus
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </form>
            </div>
          )}
        </div>
      </nav>

      {/* Mobile Menu */}
      <div className={`fixed inset-0 z-[60] bg-white dark:bg-slate-950 transition-transform duration-500 lg:hidden ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-4 h-full flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center">
                <img src={logo} alt="Doctama Logo" className="w-8 h-8 object-contain" />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-sm text-slate-900 dark:text-slate-100 uppercase">Doctama's</span>
                <span className="text-[8px] font-bold text-rose-600 uppercase tracking-wider">Marketing</span>
              </div>
            </div>
            <button onClick={() => setMobileMenuOpen(false)} className="p-2 bg-slate-100 dark:bg-slate-900 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="space-y-2">
            {navLinks.map(({ path, label, icon: Icon }) => (
              <Link 
                key={path} 
                to={path} 
                onClick={() => setMobileMenuOpen(false)} 
                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                  isActive(path)
                    ? 'bg-rose-50 text-rose-600'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-base font-semibold">{label}</span>
              </Link>
            ))}
          </div>

          {/* Mobile User Section */}
          {user && (
            <div className="mt-6 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-rose-100 rounded-full overflow-hidden flex-shrink-0">
                  {profilePicture ? (
                    <img 
                      src={profilePicture} 
                      alt={user.fullName || user.email}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-rose-100">
                      <span className="text-base font-bold text-rose-600">
                        {user.fullName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-sm">{user.fullName || user.email?.split('@')[0] || 'User'}</p>
                  <p className="text-xs text-slate-500 truncate max-w-[200px]">{user.email}</p>
                </div>
              </div>
              <div className="space-y-1">
                <Link to="/account/profile" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-xl text-slate-700 hover:bg-slate-50 transition">
                  <UserCircle className="w-5 h-5" />
                  <span className="text-sm">My Profile</span>
                </Link>
                <Link to="/account/orders" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-xl text-slate-700 hover:bg-slate-50 transition">
                  <Package className="w-5 h-5" />
                  <span className="text-sm">My Orders</span>
                </Link>
                <button onClick={handleLogoutClick} className="w-full flex items-center gap-3 p-3 rounded-xl text-red-600 hover:bg-red-50 transition">
                  <LogOut className="w-5 h-5" />
                  <span className="text-sm">Sign Out</span>
                </button>
              </div>
            </div>
          )}

          {/* Mobile Contact Info */}
          <div className="mt-auto pt-4 border-t border-slate-100">
            <p className="text-[11px] text-slate-400 mb-2">Need help?</p>
            <a href="tel:+639985868888" className="flex items-center gap-3 p-2 text-slate-700 hover:bg-slate-50 rounded-xl transition text-sm">
              <PhoneIcon className="w-4 h-4" />
              <span>+63 998 586 8888</span>
            </a>
            <a href="mailto:doctamasmarketing@gmail.com" className="flex items-center gap-3 p-2 text-slate-700 hover:bg-slate-50 rounded-xl transition text-sm">
              <Mail className="w-4 h-4" />
              <span>doctamasmarketing@gmail.com</span>
            </a>
            <div className="flex gap-4 justify-center mt-3">
              {socialLinks.map((social, idx) => (
                <a
                  key={idx}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-slate-400 ${social.color} transition-colors`}
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
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

      {/* Footer */}
      <footer className="bg-slate-900 text-white pt-12 pb-6">
        <div className="container mx-auto px-4">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-white-600 rounded-lg flex items-center justify-center">
                  <img src={logo} alt="Doctama Logo" className="w-14 h-14 object-contain" />
                </div>
                <div className="flex flex-col">
                  <span className="font-black text-xl tracking-tight uppercase">Doctama's</span>
                  <span className="text-[10px] font-bold text-rose-500 tracking-wider uppercase">Marketing</span>
                </div>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Defining the standard of modern living in the Philippines since 2024.
              </p>
              <div className="flex gap-4">
                {socialLinks.map((social, idx) => (
                  <a
                    key={idx}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-slate-400 ${social.color} transition-colors`}
                  >
                    <social.icon className="w-5 h-5" />
                  </a>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-bold mb-4 text-sm uppercase tracking-widest text-rose-500">Shop</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><Link to="/shop" className="hover:text-white transition flex items-center gap-2"><ChevronRight className="w-3 h-3" /> New Arrivals</Link></li>
                <li><Link to="/shop" className="hover:text-white transition flex items-center gap-2"><ChevronRight className="w-3 h-3" /> Best Sellers</Link></li>
                <li><Link to="/shop" className="hover:text-white transition flex items-center gap-2"><ChevronRight className="w-3 h-3" /> Living Room</Link></li>
                <li><Link to="/shop" className="hover:text-white transition flex items-center gap-2"><ChevronRight className="w-3 h-3" /> Bedroom</Link></li>
                <li><Link to="/shop" className="hover:text-white transition flex items-center gap-2"><ChevronRight className="w-3 h-3" /> Dining Room</Link></li>
                <li><Link to="/shop" className="hover:text-white transition flex items-center gap-2"><ChevronRight className="w-3 h-3" /> Office</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4 text-sm uppercase tracking-widest text-rose-500">Company</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><Link to="/about" className="hover:text-white transition flex items-center gap-2"><ChevronRight className="w-3 h-3" /> Our Story</Link></li>
                <li><Link to="/contact" className="hover:text-white transition flex items-center gap-2"><ChevronRight className="w-3 h-3" /> Customize</Link></li>
                <li><Link to="/contact" className="hover:text-white transition flex items-center gap-2"><ChevronRight className="w-3 h-3" /> Contact</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4 text-sm uppercase tracking-widest text-rose-500">Visit Us</h4>
              <div className="space-y-3 text-slate-400 text-sm">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0" />
                  <p>Gabao, Bacon, Sorsogon City,<br />Sorsogon, Philippines 4700</p>
                </div>
                <div className="flex items-center gap-3">
                  <PhoneIcon className="w-4 h-4 text-rose-500 flex-shrink-0" />
                  <div>
                    <p>+63 998 586 8888</p>
                    <p className="text-xs text-slate-500">Mon-Sat: 9AM - 7PM</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-rose-500 flex-shrink-0" />
                  <div>
                    <p>doctamasmarketing@gmail.com</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-500 text-xs">© 2026 Doctama's Marketing. All rights reserved.</p>
            <div className="flex gap-6">
              <Link to="/privacy" className="text-slate-500 text-xs hover:text-white transition">Privacy Policy</Link>
              <Link to="/terms" className="text-slate-500 text-xs hover:text-white transition">Terms of Service</Link>
              <Link to="/returns" className="text-slate-500 text-xs hover:text-white transition">Return Policy</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
