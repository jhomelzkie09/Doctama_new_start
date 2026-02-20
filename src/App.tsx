import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import AdminLayout from './components/admin/AdminLayout';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Products from './pages/Products';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ProductsManagement from './pages/admin/ProductsManagement'; // 👈 CHANGE THIS
import ProductForm from './pages/admin/ProductForm';
import CategoriesManagement from './pages/admin/CategoryManagement';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            {/* Public Routes - Make login the default */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected User Routes */}
            <Route path="/products" element={
              <ProtectedRoute>
                <Products />
              </ProtectedRoute>
            } />
            
            {/* Admin Routes with Layout */}
            <Route path="/admin" element={<AdminRoute />}>
              <Route element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="products" element={<ProductsManagement />} /> {/* 👈 USE THE NEW COMPONENT */}
                <Route path="products/new" element={<ProductForm />} />
                <Route path="products/edit/:id" element={<ProductForm />} />
                <Route path="categories" element={<CategoriesManagement />} />
                <Route path="orders" element={<div>Orders Page (Coming Soon)</div>} />
                <Route path="users" element={<div>Users Page (Coming Soon)</div>} />
                <Route path="analytics" element={<div>Analytics Page (Coming Soon)</div>} />
                <Route path="promotions" element={<div>Promotions Page (Coming Soon)</div>} />
                <Route path="shipping" element={<div>Shipping Page (Coming Soon)</div>} />
                <Route path="payments" element={<div>Payments Page (Coming Soon)</div>} />
                <Route path="settings" element={<div>Settings Page (Coming Soon)</div>} />
              </Route>
            </Route>
            
            {/* Redirect unknown routes to login */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;