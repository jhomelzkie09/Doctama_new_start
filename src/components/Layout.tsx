import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { Menu, X, ShoppingCart, User, LogOut, ChevronRight } from 'lucide-react';
import AuthSidebar from './AuthSidebar';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { user, logout } = useAuth();
  const { state } = useCart();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authSidebarOpen, setAuthSidebarOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

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

  // Pass the handleAuthRequired function to children via context or props
  const childrenWithProps = React.Children.map(children, child => {
    // Check if the child is a valid React element
    if (React.isValidElement(child)) {
      // Pass the onAuthRequired prop to all children
      // The child component can choose to use it or ignore it
      return React.cloneElement(child, { 
        onAuthRequired: handleAuthRequired 
      } as Partial<unknown>);
    }
    return child;
  });

  return (
    <>
      {/* Navbar */}
      <nav className="bg-white shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">F</span>
              </div>
              <span className="font-bold text-xl text-gray-900">FurnitureStore</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/" className="text-gray-700 hover:text-blue-600 transition">Home</Link>
              <Link to="/shop" className="text-gray-700 hover:text-blue-600 transition">Shop</Link>
              <Link to="/about" className="text-gray-700 hover:text-blue-600 transition">About</Link>
              <Link to="/contact" className="text-gray-700 hover:text-blue-600 transition">Contact</Link>
            </div>

            {/* Right Icons */}
            <div className="flex items-center space-x-4">
              {/* Cart */}
              <Link 
                to="/cart" 
                className="relative p-2 hover:bg-gray-100 rounded-lg transition"
                onClick={handleAddToCartClick}
              >
                <ShoppingCart className="w-5 h-5 text-gray-700" />
                {state.items.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                    {state.items.length}
                  </span>
                )}
              </Link>

              {/* User Menu */}
              {user ? (
                <div className="relative group">
                  <button className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-lg">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold">
                        {user.fullName?.charAt(0) || user.email?.charAt(0)}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-500 group-hover:rotate-90 transition" />
                  </button>
                  
                  {/* Dropdown */}
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition">
                    <Link to="/account" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">My Account</Link>
                    <Link to="/account/orders" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">Orders</Link>
                    <button
                      onClick={logout}
                      className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 flex items-center"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => handleAuthRequired('login')}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <User className="w-4 h-4" />
                  <span>Sign In</span>
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

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t">
              <Link to="/" className="block py-2 text-gray-700 hover:text-blue-600">Home</Link>
              <Link to="/shop" className="block py-2 text-gray-700 hover:text-blue-600">Shop</Link>
              <Link to="/about" className="block py-2 text-gray-700 hover:text-blue-600">About</Link>
              <Link to="/contact" className="block py-2 text-gray-700 hover:text-blue-600">Contact</Link>
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

      {/* Main Content - Render children with injected props */}
      <main>{childrenWithProps}</main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">About Us</h3>
              <p className="text-gray-400">Quality furniture for your home since 2024.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><Link to="/about" className="text-gray-400 hover:text-white">About</Link></li>
                <li><Link to="/contact" className="text-gray-400 hover:text-white">Contact</Link></li>
                <li><Link to="/shop" className="text-gray-400 hover:text-white">Shop</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact</h3>
              <p className="text-gray-400">Email: info@furniturestore.com</p>
              <p className="text-gray-400">Phone: (555) 123-4567</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Follow Us</h3>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white">FB</a>
                <a href="#" className="text-gray-400 hover:text-white">IG</a>
                <a href="#" className="text-gray-400 hover:text-white">TW</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Layout;