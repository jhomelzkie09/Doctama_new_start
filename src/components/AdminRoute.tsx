import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AdminRoute = () => {
  const { user, isAdmin } = useAuth();

  console.log('🔐 AdminRoute check:');
  console.log('   User:', user?.email);
  console.log('   Roles:', user?.roles);
  console.log('   isAdmin from context:', isAdmin);
  
  const userIsAdmin = user?.roles?.some(role => 
    role.toLowerCase() === 'admin' || role.toLowerCase() === 'administrator'
  ) || false;
  
  console.log('   userIsAdmin calculated:', userIsAdmin);

  if (!user) {
    console.log('❌ No user, redirecting to login');
    return <Navigate to="/login" />;
  }

  if (!isAdmin && !userIsAdmin) {
    console.log('❌ Not admin, redirecting to home');
    return <Navigate to="/" />;
  }

  console.log('✅ Admin access granted, rendering outlet');
  return <Outlet />;
};

export default AdminRoute;