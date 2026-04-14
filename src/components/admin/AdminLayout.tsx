import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useLocation, Outlet, Link } from 'react-router-dom';
import userService from '../../services/user.service';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  FolderTree,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Bell,
  Search,
  BarChart3,
  Tag,
  Truck,
  CreditCard,
  Home,
  ChevronRight,
  FileText,
  UserCircle,
  Store
} from 'lucide-react';
import logo from '../../assets/logo.png';

interface MenuItem {
  title: string;
  path: string;
  icon: React.ReactNode;
  submenu?: { title: string; path: string }[];
}

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [notifications, setNotifications] = useState(3); // Example count

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

  const menuItems: MenuItem[] = [
    {
      title: 'Dashboard',
      path: '/admin',
      icon: <LayoutDashboard className="w-5 h-5" />
    },
    {
      title: 'Products',
      path: '/admin/products',
      icon: <Package className="w-5 h-5" />,
      submenu: [
        { title: 'All Products', path: '/admin/products' },
        { title: 'Add Product', path: '/admin/products/new' },
        { title: 'Categories', path: '/admin/categories' },
        { title: 'Stock Deliveries', path: '/admin/stock-deliveries' }
      ]
    },
    {
      title: 'Orders',
      path: '/admin/orders',
      icon: <ShoppingCart className="w-5 h-5" />,
      submenu: [
        { title: 'All Orders', path: '/admin/orders' }
      ]
    },
    {
      title: 'Customers',
      path: '/admin/customers',
      icon: <Users className="w-5 h-5" />,
      submenu: [
        { title: 'All Customers', path: '/admin/customers' },
        { title: 'New Customers', path: '/admin/customers/new' }
      ]
    },
    {
      title: 'Admin Management',
      path: '/admin/admins',
      icon: <Users className="w-5 h-5" />,
      submenu: [
        { title: 'All Admins', path: '/admin/admins' },
        { title: 'Add Admin', path: '/admin/admins/new' }
      ]
    },
    {
      title: 'Reports',
      path: '/admin/reports',
      icon: <FileText className="w-5 h-5" />,
      submenu: [
        { title: 'Sales Report', path: '/admin/reports/sales' },
        { title: 'Orders Report', path: '/admin/reports/orders' },
        { title: 'Products Report', path: '/admin/reports/products' }
      ]
    },
    {
      title: 'Promo Codes',
      path: '/admin/promo-codes',
      icon: <Tag className="w-5 h-5" />
    }
  ];

  const toggleSubmenu = (title: string) => {
    setOpenSubmenu(openSubmenu === title ? null : title);
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-30 h-full w-64 bg-gradient-to-b from-white to-gray-50 shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header with Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 bg-white">
          <Link to="/admin" className="flex items-center space-x-2 group">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105">
              <img 
                src={logo} 
                alt="Doctama Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-black text-sm tracking-tight text-gray-900 uppercase">Doctama's</span>
              <span className="text-[8px] font-bold text-rose-600 tracking-[0.1em] uppercase">Admin</span>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Info with Profile Picture */}
        <div className="p-4 border-b border-gray-200 bg-white/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-rose-100 to-amber-100 rounded-full flex items-center justify-center overflow-hidden ring-2 ring-rose-200">
              {profilePicture ? (
                <img 
                  src={profilePicture} 
                  alt={user?.fullName || user?.email}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-rose-600 font-semibold">
                  {user?.fullName?.charAt(0) || user?.email?.charAt(0) || 'A'}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {user?.fullName || user?.email?.split('@')[0] || 'Admin'}
              </p>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                Administrator
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-12rem)]">
          {menuItems.map((item) => (
            <div key={item.title}>
              <button
                onClick={() => {
                  if (item.submenu) {
                    toggleSubmenu(item.title);
                  } else {
                    navigate(item.path);
                    setSidebarOpen(false);
                  }
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200 ${
                  isActive(item.path)
                    ? 'bg-rose-50 text-rose-600 shadow-sm'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-rose-600'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className={isActive(item.path) ? 'text-rose-600' : 'text-gray-500 group-hover:text-rose-600'}>
                    {item.icon}
                  </span>
                  <span className="text-sm font-medium">{item.title}</span>
                </div>
                {item.submenu && (
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${
                      openSubmenu === item.title ? 'rotate-180' : ''
                    }`}
                  />
                )}
              </button>
              
              {/* Submenu */}
              {item.submenu && openSubmenu === item.title && (
                <div className="ml-8 mt-1 space-y-1 animate-in slide-in-from-left-2 duration-200">
                  {item.submenu.map((sub) => (
                    <button
                      key={sub.path}
                      onClick={() => {
                        navigate(sub.path);
                        setSidebarOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors duration-200 ${
                        location.pathname === sub.path
                          ? 'bg-rose-50 text-rose-600 font-medium'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-rose-600'
                      }`}
                    >
                      {sub.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Logout Button */}
          <div className="pt-4 mt-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors duration-200"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </nav>

        {/* Footer Branding */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white/50">
          <p className="text-[10px] text-center text-gray-400">
            © 2026 Doctama's Admin
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Top Header */}
        <header className="h-16 bg-white shadow-sm border-b border-gray-200 fixed top-0 right-0 left-0 lg:left-64 z-10">
          <div className="h-full px-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Breadcrumb Navigation */}
              <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-600">
                <button onClick={() => navigate('/admin')} className="hover:text-rose-600 transition-colors">
                  Dashboard
                </button>
                {location.pathname !== '/admin' && (
                  <>
                    <ChevronRight className="w-4 h-4" />
                    <span className="text-gray-900 font-medium capitalize">
                      {location.pathname.split('/').pop()?.replace(/-/g, ' ')}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Right Icons */}
            <div className="flex items-center space-x-2">
              {/* Search Button */}
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Search className="w-5 h-5 text-gray-600" />
              </button>

              {/* Notifications */}
              <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Bell className="w-5 h-5 text-gray-600" />
                {notifications > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                )}
              </button>

              {/* View Store */}
              <button 
                onClick={() => window.open('/', '_blank')}
                className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Store className="w-5 h-5 text-gray-600" />
                <span className="text-sm text-gray-600 hidden md:inline">View Store</span>
              </button>

              {/* Admin Profile Quick View */}
              <div className="hidden md:flex items-center space-x-2 ml-2 pl-2 border-l border-gray-200">
                <div className="w-8 h-8 bg-gradient-to-r from-rose-100 to-amber-100 rounded-full overflow-hidden">
                  {profilePicture ? (
                    <img 
                      src={profilePicture} 
                      alt={user?.fullName || user?.email}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <UserCircle className="w-5 h-5 text-rose-500" />
                    </div>
                  )}
                </div>
                <div className="hidden xl:block">
                  <p className="text-xs font-medium text-gray-700">
                    {user?.fullName?.split(' ')[0] || 'Admin'}
                  </p>
                  <p className="text-[10px] text-gray-400">Administrator</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="pt-16 min-h-screen bg-gray-50">
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;