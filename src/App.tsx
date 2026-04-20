import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { OrderProvider } from './contexts/OrderContext';
import { PromoCodeProvider } from './contexts/PromoCodeContext';
import Layout from './components/Layout';

// Pages
import Home from './pages/customer/Home';
import Shop from './pages/customer/Shop';
import About from './pages/customer/About';
import Contact from './pages/customer/Contact';
import ProductDetail from './pages/customer/ProductDetail';
import Cart from './pages/customer/Cart';
import Checkout from './pages/customer/Checkout';
import AccountDashboard from './pages/customer/Account/Dashboard';
import AccountOrders from './pages/customer/Account/Orders';
import AccountProfile from './pages/customer/Account/Profile';
import AccountAddresses from './pages/customer/Account/Addresses';
import AccountOrderDetails from './pages/customer/Account/OrderDetail';
import ResetPassword from './pages/auth/ResetPassword';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ProductsManagement from './pages/admin/ProductManagement';
import ProductForm from './pages/admin/ProductForm';
import CategoriesManagement from './pages/admin/CategoryManagement';
import AdminRoute from './components/admin/AdminRoute';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './components/admin/AdminLayout';
import Orders from './pages/admin/AdminOrders';
import CustomerManagement from './pages/admin/CustomerManagement'; 
import CustomerDetail from './pages/admin/CustomerDetail';
import AdminManagement from './pages/admin/AdminManagement';
import SalesReport from './pages/admin/SalesReport';
import OrdersReport from './pages/admin/OrdersReport';
import ProductsReport from './pages/admin/ProductsReport';
import PromoCodeManagement from './pages/admin/PromoCodeManagement';
import StockDelivery from './pages/admin/StockDelivery';
import CreateDelivery from './pages/admin/CreateDelivery';
import OrderDelivery from './pages/admin/OrderDelivery';

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <OrderProvider>
            <PromoCodeProvider>
              {/* Toast Notifications */}
              <Toaster 
                position="top-right"
                toastOptions={{
                  duration: 3000,
                  style: {
                    background: '#363636',
                    color: '#fff',
                    borderRadius: '12px',
                    padding: '12px 20px',
                    fontSize: '14px',
                    fontWeight: '500',
                  },
                  success: {
                    duration: 3000,
                    iconTheme: {
                      primary: '#10b981',
                      secondary: '#fff',
                    },
                    style: {
                      background: '#10b981',
                      color: '#fff',
                    },
                  },
                  error: {
                    duration: 4000,
                    iconTheme: {
                      primary: '#ef4444',
                      secondary: '#fff',
                    },
                    style: {
                      background: '#ef4444',
                      color: '#fff',
                    },
                  },
                  loading: {
                    duration: 2000,
                    style: {
                      background: '#6366f1',
                      color: '#fff',
                    },
                  },
                }}
              />
              <Routes>
                {/* ========== PUBLIC ROUTES ========== */}
                <Route path="/reset-password" element={<ResetPassword />} />
                
                {/* ========== PUBLIC ROUTES with Layout ========== */}
                <Route element={<Layout />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/shop" element={<Shop />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/products/:id" element={<ProductDetail />} />
                  
                  {/* ========== PROTECTED CUSTOMER ROUTES ========== */}
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/checkout" element={
                    <ProtectedRoute>
                      <Checkout />
                    </ProtectedRoute>
                  } />
                  <Route path="/account" element={
                    <ProtectedRoute>
                      <AccountDashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/account/orders" element={
                    <ProtectedRoute>
                      <AccountOrders />
                    </ProtectedRoute>
                  } />
                  <Route path="/account/orders/:id" element={
                    <ProtectedRoute>
                      <AccountOrderDetails />
                    </ProtectedRoute>
                  } />
                  <Route path="/account/profile" element={
                    <ProtectedRoute>
                      <AccountProfile />
                    </ProtectedRoute>
                  } />
                  <Route path="/account/addresses" element={
                    <ProtectedRoute>
                      <AccountAddresses />
                    </ProtectedRoute>
                  } />
                </Route>
                
                {/* ========== ADMIN ROUTES ========== */}
                <Route path="/admin" element={<AdminRoute />}>
                  <Route element={<AdminLayout />}>
                    <Route index element={<AdminDashboard />} />
                    <Route path="products" element={<ProductsManagement />} />
                    <Route path="products/new" element={<ProductForm />} />
                    <Route path="products/edit/:id" element={<ProductForm />} />
                    <Route path="categories" element={<CategoriesManagement />} />
                    <Route path="orders" element={<Orders />} />
                    <Route path="admins" element={<AdminManagement />} />
                    <Route path="customers" element={<CustomerManagement />} />
                    <Route path="customers/new" element={<CustomerManagement />} />
                    <Route path="customers/:id" element={<CustomerDetail />} />
                    <Route path="customers/edit/:id" element={<CustomerManagement />} />
                    <Route path="reports/sales" element={<SalesReport />} />
                    <Route path="reports/orders" element={<OrdersReport />} />
                    <Route path="reports/products" element={<ProductsReport />} />
                    <Route path="promo-codes" element={<PromoCodeManagement />} />
                    <Route path="deliveries" element={<StockDelivery />} />
                    <Route path="deliveries/new" element={<CreateDelivery />} />
                    <Route path="deliveries/orders" element={<OrderDelivery />} />
                  </Route>
                </Route>
                
                {/* ========== CATCH ALL ========== */}
                <Route path="*" element={<Home />} />
              </Routes>
            </PromoCodeProvider>
          </OrderProvider>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;