import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AdminRoute = () => {
  const { user, isAdmin, loading } = useAuth();

  console.log('🔐 AdminRoute check:', { 
    user: user?.email, 
    roles: user?.roles,
    isAdmin,
    loading 
  });

  // Show loading indicator while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    console.log('❌ No user, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    console.log('❌ Not admin, redirecting to home');
    return <Navigate to="/" replace />;
  }

  console.log('✅ Admin access granted');
  return <Outlet />;
};

export default AdminRoute;