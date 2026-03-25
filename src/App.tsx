import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
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

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ProductsManagement from './pages/admin/ProductManagement';
import ProductForm from './pages/admin/ProductForm';
import CategoriesManagement from './pages/admin/CategoryManagement';
import AdminRoute from './components/AdminRoute';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './components/admin/AdminLayout';
import Orders from './pages/admin/AdminOrders';
import CustomerManagement from './pages/admin/CustomerManagement'; 
import CustomerDetail from './pages/admin/CustomerDetail';
import AdminManagement from './pages/admin/AdminManagement';

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <Routes>
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
              {/* ✅ ADD THIS DYNAMIC ROUTE FOR INDIVIDUAL ORDER DETAILS */}
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
              {/* Keep the old route for backward compatibility if needed */}
              <Route path="/account/orderdetails" element={
                <ProtectedRoute>
                  <AccountOrderDetails />
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
              </Route>
            </Route>
            
            {/* ========== CATCH ALL - REDIRECT TO HOME ========== */}
            <Route path="*" element={<Home />} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;