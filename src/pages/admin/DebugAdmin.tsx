import React, { useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const DebugAdmin = () => {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('🔍 DebugAdmin mounted');
    console.log('   User:', user);
    console.log('   isAdmin:', isAdmin);
    console.log('   loading:', loading);
    console.log('   roles:', user?.roles);

    // If not admin after 2 seconds, show message
    const timer = setTimeout(() => {
      if (!isAdmin && !loading) {
        console.log('❌ Still not admin after 2 seconds');
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [user, isAdmin, loading]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Not Logged In</h1>
        <button 
          onClick={() => navigate('/login')}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Go to Login
        </button>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
        <p className="mb-4">You don't have admin privileges.</p>
        <p className="mb-2">Your roles: {user?.roles?.join(', ') || 'none'}</p>
        <button 
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Go to Home
        </button>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-green-600 mb-4">✅ Admin Access Granted!</h1>
      <p className="mb-2">Welcome, {user?.fullName || user?.email}</p>
      <p className="mb-4">Your roles: {user?.roles?.join(', ')}</p>
      <button 
        onClick={() => navigate('/admin/dashboard')}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        Go to Dashboard
      </button>
    </div>
  );
};

export default DebugAdmin;