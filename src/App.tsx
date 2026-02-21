import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import Layout from './components/Layout';

// Pages
import Home from './pages/customer/Home';
import Shop from './pages/customer/Shop';
//import About from './pages/customer/About';
//import Contact from './pages/customer/Contact';
import ProductDetail from './pages/customer/ProductDetail';
import Cart from './pages/customer/Cart';
import Checkout from './pages/customer/Checkout';
import Login from './pages/Login';
import Register from './pages/Register';
import AccountDashboard from './pages/customer/Account/Dashboard';
import AccountOrders from './pages/customer/Account/Orders';
//import AccountProfile from './pages/customer/Account/Profile';
import AdminDashboard from './pages/admin/AdminDashboard';
import ProductsManagement from './pages/admin/ProductManagement';
import ProductForm from './pages/admin/ProductForm';
import CategoriesManagement from './pages/admin/CategoryManagement';
import AdminRoute from './components/AdminRoute';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './components/admin/AdminLayout';

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <Routes>
            {/* Public routes with Layout */}
            <Route path="/" element={<Layout><Home /></Layout>} />
            <Route path="/shop" element={<Layout><Shop /></Layout>} />
            {/*<Route path="/about" element={<Layout><About /></Layout>} />*/}
            {/*<Route path="/contact" element={<Layout><Contact /></Layout>} />*/}
            <Route path="/products/:id" element={<Layout><ProductDetail /></Layout>} />
            
            {/* Auth routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected customer routes */}
            <Route path="/cart" element={<Layout><Cart /></Layout>} />
            <Route path="/checkout" element={
              <ProtectedRoute>
                <Layout><Checkout /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/account" element={
              <ProtectedRoute>
                <Layout><AccountDashboard /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/account/orders" element={
              <ProtectedRoute>
                <Layout><AccountOrders /></Layout>
              </ProtectedRoute>
            } />
            {/*
            <Route path="/account/profile" element={
              <ProtectedRoute>
                <Layout><AccountProfile /></Layout>
              </ProtectedRoute>
            } />*/}
            
            {/* Admin routes */}
            <Route path="/admin" element={<AdminRoute />}>
              <Route element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="products" element={<ProductsManagement />} />
                <Route path="products/new" element={<ProductForm />} />
                <Route path="products/edit/:id" element={<ProductForm />} />
                <Route path="categories" element={<CategoriesManagement />} />
              </Route>
            </Route>
          </Routes>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;