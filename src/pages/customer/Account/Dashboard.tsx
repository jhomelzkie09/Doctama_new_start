import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import orderService from '../../../services/order.service';
import {
  Package,
  User,
  MapPin,
  Heart,
  Settings,
  ChevronRight,
  ShoppingBag,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  AlertCircle
} from 'lucide-react';

const AccountDashboard = () => {
  const { user } = useAuth();
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    deliveredOrders: 0,
    wishlistCount: 0
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const orders = await orderService.getMyOrders(1, 5);
      setRecentOrders(orders.orders || []);
      
      // Calculate stats
      const allOrders = await orderService.getMyOrders(1, 100);
      const orderList = allOrders.orders || [];
      setStats({
        totalOrders: orderList.length,
        pendingOrders: orderList.filter((o: any) => o.status === 'pending' || o.status === 'awaiting_payment').length,
        deliveredOrders: orderList.filter((o: any) => o.status === 'delivered').length,
        wishlistCount: 0 // You'll implement wishlist later
      });
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'delivered': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'shipped': return <Truck className="w-4 h-4 text-blue-500" />;
      case 'processing': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'pending': return <Clock className="w-4 h-4 text-gray-500" />;
      case 'cancelled': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Package className="w-4 h-4 text-gray-500" />;
    }
  };

  const quickActions = [
    { icon: ShoppingBag, label: 'Shop Again', path: '/shop', color: 'blue' },
    { icon: Package, label: 'Track Orders', path: '/account/orders', color: 'green' },
    { icon: Heart, label: 'Wishlist', path: '/account/wishlist', color: 'red' },
    { icon: User, label: 'My Profile', path: '/account/profile', color: 'purple' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Welcome back, {user?.fullName || user?.email}!
          </h1>
          <p className="text-gray-600 mt-1">
            Manage your account, track orders, and view your wishlist
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
            <p className="text-sm text-gray-600 mb-1">Total Orders</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-yellow-500">
            <p className="text-sm text-gray-600 mb-1">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.pendingOrders}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
            <p className="text-sm text-gray-600 mb-1">Delivered</p>
            <p className="text-2xl font-bold text-green-600">{stats.deliveredOrders}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-red-500">
            <p className="text-sm text-gray-600 mb-1">Wishlist</p>
            <p className="text-2xl font-bold text-red-600">{stats.wishlistCount}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Link
                key={index}
                to={action.path}
                className={`bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition group`}
              >
                <div className={`w-12 h-12 bg-${action.color}-100 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition`}>
                  <Icon className={`w-6 h-6 text-${action.color}-600`} />
                </div>
                <h3 className="font-semibold text-gray-900">{action.label}</h3>
                <p className="text-sm text-gray-500 mt-1">Click to continue</p>
              </Link>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Orders */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
                <Link to="/account/orders" className="text-sm text-blue-600 hover:text-blue-700 flex items-center">
                  View All <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
              
              <div className="divide-y divide-gray-200">
                {recentOrders.length === 0 ? (
                  <div className="p-8 text-center">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">No orders yet</p>
                    <Link
                      to="/shop"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Start Shopping
                    </Link>
                  </div>
                ) : (
                  recentOrders.map((order) => (
                    <Link
                      key={order.id}
                      to={`/account/orders/${order.id}`}
                      className="block p-6 hover:bg-gray-50 transition"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-gray-900">{order.orderNumber}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(order.orderDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center">
                          {getStatusIcon(order.status)}
                          <span className="ml-2 text-sm capitalize">{order.status}</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center mt-3">
                        <p className="text-sm text-gray-600">
                          {order.items?.length || 0} items
                        </p>
                        <p className="font-bold text-blue-600">
                          ₱{order.totalAmount?.toLocaleString()}
                        </p>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Account Menu */}
          <div>
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Account Settings</h2>
              </div>
              <div className="divide-y divide-gray-200">
                <Link to="/account/profile" className="flex items-center justify-between p-4 hover:bg-gray-50">
                  <div className="flex items-center">
                    <User className="w-5 h-5 text-gray-400 mr-3" />
                    <span>Profile Information</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </Link>
                <Link to="/account/addresses" className="flex items-center justify-between p-4 hover:bg-gray-50">
                  <div className="flex items-center">
                    <MapPin className="w-5 h-5 text-gray-400 mr-3" />
                    <span>Saved Addresses</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </Link>
                <Link to="/account/wishlist" className="flex items-center justify-between p-4 hover:bg-gray-50">
                  <div className="flex items-center">
                    <Heart className="w-5 h-5 text-gray-400 mr-3" />
                    <span>Wishlist</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </Link>
                <Link to="/account/settings" className="flex items-center justify-between p-4 hover:bg-gray-50">
                  <div className="flex items-center">
                    <Settings className="w-5 h-5 text-gray-400 mr-3" />
                    <span>Account Settings</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </Link>
              </div>
            </div>

            {/* Support Card */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-sm p-6 mt-6 text-white">
              <h3 className="font-semibold text-lg mb-2">Need Help?</h3>
              <p className="text-sm text-blue-100 mb-4">
                Contact our support team for assistance with your orders or account.
              </p>
              <Link
                to="/contact"
                className="inline-flex items-center px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition"
              >
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountDashboard;