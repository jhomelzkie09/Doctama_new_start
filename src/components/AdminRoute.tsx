import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Check if user has admin role
  const userIsAdmin = user?.roles?.some(role => 
    role?.toLowerCase() === 'admin'
  );

  console.log("🔐 AdminRoute check:");
  console.log("   User:", user?.email);
  console.log("   Roles:", user?.roles);
  console.log("   isAdmin from context:", isAdmin);
  console.log("   userIsAdmin calculated:", userIsAdmin);

  if (!user) {
    console.log("❌ No user, redirecting to login");
    return <Navigate to="/login" replace />;
  }

  if (!userIsAdmin) {
    console.log("❌ Not admin, redirecting to home");
    return <Navigate to="/" replace />;
  }

  console.log("✅ Admin access granted");
  return <>{children}</>;
};

export default AdminRoute;