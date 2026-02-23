import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AdminRoute = () => {
  const { user, isAdmin } = useAuth();
  const location = useLocation();

  console.log('🔐 AdminRoute check at:', location.pathname);
  console.log('   User object:', user);
  console.log('   User email:', user?.email);
  console.log('   User roles:', user?.roles);
  console.log('   isAdmin from context:', isAdmin);
  
  const userIsAdmin = user?.roles?.some(role => 
    role.toLowerCase() === 'admin' || role.toLowerCase() === 'administrator'
  ) || false;
  
  console.log('   userIsAdmin calculated:', userIsAdmin);

  if (!user) {
    console.log('❌ No user, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAdmin && !userIsAdmin) {
    console.log('❌ Not admin, redirecting to home');
    return <Navigate to="/" replace />;
  }

  console.log('✅ Admin access granted, rendering outlet');
  return <Outlet />;
};

export default AdminRoute;