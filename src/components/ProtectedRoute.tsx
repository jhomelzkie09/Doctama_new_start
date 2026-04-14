import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader } from 'lucide-react';

const ProtectedRoute = () => {
  const { user, isAuthenticated, loading } = useAuth();

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-rose-600" />
      </div>
    );
  }

  // Only redirect to login if NOT authenticated AND NOT loading
  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />;  // Redirect to home, not login!
  }

  return <Outlet />;
};

export default ProtectedRoute;