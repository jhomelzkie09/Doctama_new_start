import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
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
} from 'lucide-react';

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
        { title: 'Categories', path: '/admin/categories' }
      ]
    },
    {
      title: 'Orders',
      path: '/admin/orders',
      icon: <ShoppingCart className="w-5 h-5" />,
      submenu: [
        { title: 'All Orders', path: '/admin/orders' },
        { title: 'Pending', path: '/admin/orders/pending' },
        { title: 'Processing', path: '/admin/orders/processing' },
        { title: 'Completed', path: '/admin/orders/completed' }
      ]
    },
    {
      title: 'Customers',
      path: '/admin/users',
      icon: <Users className="w-5 h-5" />,
      submenu: [
        { title: 'All Customers', path: '/admin/users' },
        { title: 'New Customers', path: '/admin/users/new' }
      ]
    },
    {
      title: 'Categories',
      path: '/admin/categories',
      icon: <FolderTree className="w-5 h-5" />
    },
    {
      title: 'Analytics',
      path: '/admin/analytics',
      icon: <BarChart3 className="w-5 h-5" />,
      submenu: [
        { title: 'Sales Report', path: '/admin/analytics/sales' },
        { title: 'Inventory Report', path: '/admin/analytics/inventory' },
        { title: 'Customer Report', path: '/admin/analytics/customers' }
      ]
    },
    {
      title: 'Promotions',
      path: '/admin/promotions',
      icon: <Tag className="w-5 h-5" />,
      submenu: [
        { title: 'Discount Codes', path: '/admin/promotions' },
        { title: 'Flash Sales', path: '/admin/promotions/flash-sales' }
      ]
    },
    {
      title: 'Shipping',
      path: '/admin/shipping',
      icon: <Truck className="w-5 h-5" />,
      submenu: [
        { title: 'Shipping Zones', path: '/admin/shipping/zones' },
        { title: 'Shipping Rates', path: '/admin/shipping/rates' }
      ]
    },
    {
      title: 'Payments',
      path: '/admin/payments',
      icon: <CreditCard className="w-5 h-5" />,
      submenu: [
        { title: 'Payment Methods', path: '/admin/payments/methods' },
        { title: 'Transactions', path: '/admin/payments/transactions' }
      ]
    },
    {
      title: 'Settings',
      path: '/admin/settings',
      icon: <Settings className="w-5 h-5" />,
      submenu: [
        { title: 'General Settings', path: '/admin/settings/general' },
        { title: 'Store Settings', path: '/admin/settings/store' },
        { title: 'Email Settings', path: '/admin/settings/email' }
      ]
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
        className={`fixed top-0 left-0 z-30 h-full w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">F</span>
            </div>
            <span className="font-bold text-xl text-gray-900">Furniture Admin</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-semibold">
                {user?.fullName?.charAt(0) || user?.email?.charAt(0) || 'A'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.fullName || user?.email}
              </p>
              <p className="text-xs text-gray-500">Administrator</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-8rem)]">
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
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                  isActive(item.path)
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className={isActive(item.path) ? 'text-blue-600' : 'text-gray-500'}>
                    {item.icon}
                  </span>
                  <span className="text-sm font-medium">{item.title}</span>
                </div>
                {item.submenu && (
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${
                      openSubmenu === item.title ? 'rotate-180' : ''
                    }`}
                  />
                )}
              </button>
              
              {/* Submenu */}
              {item.submenu && openSubmenu === item.title && (
                <div className="ml-8 mt-1 space-y-1">
                  {item.submenu.map((sub) => (
                    <button
                      key={sub.path}
                      onClick={() => {
                        navigate(sub.path);
                        setSidebarOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        location.pathname === sub.path
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-gray-600 hover:bg-gray-100'
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
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors mt-4"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Top Header */}
        <header className="h-16 bg-white shadow-sm border-b border-gray-200 fixed top-0 right-0 left-0 lg:left-64 z-10">
          <div className="h-full px-4 flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Search Bar */}
            <div className="hidden md:flex items-center flex-1 max-w-md ml-4">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Right Icons */}
            <div className="flex items-center space-x-4">
              <button className="relative p-2 hover:bg-gray-100 rounded-lg">
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <button className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-lg">
                <Home className="w-5 h-5 text-gray-600" />
                <span className="text-sm text-gray-600 hidden md:inline">View Store</span>
              </button>
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