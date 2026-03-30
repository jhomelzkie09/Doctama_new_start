import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, RegisterData } from '../types';
import authService from '../services/auth.service';
import { isAdmin as checkIsAdmin, isCustomer, isManager } from '../utils/roleUtils';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isCustomer: boolean;
  isManager: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (data: RegisterData) => Promise<void>;
  refreshUser: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Compute role-based values using imported utilities
  const isAdmin = checkIsAdmin(user);
  const isCustomerValue = isCustomer(user);
  const isManagerValue = isManager(user);

  useEffect(() => {
    // Get user from localStorage on mount
    const currentUser = authService.getCurrentUser();
    const token = authService.getToken();
    console.log('🏁 Initial user from localStorage:', currentUser);
    console.log('🏁 Initial token exists?', !!token);
    
    if (currentUser && token) {
      setUser(currentUser);
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authService.login({ email, password });
      console.log('✅ Login response:', response);
      
      // Get the updated user from storage
      const currentUser = authService.getCurrentUser();
      const token = authService.getToken();
      
      console.log('🔑 Token after login:', !!token);
      console.log('👤 User after login:', currentUser);
      
      setUser(currentUser);
      
      // Redirect based on role
      if (checkIsAdmin(currentUser)) {
        console.log('👑 Admin logged in, redirecting to /admin');
        navigate('/admin');
      } else {
        console.log('👤 Regular user logged in, redirecting to /');
        navigate('/');
      }
      
    } catch (err: any) {
      console.error('❌ Login error:', err);
      setError(err.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    console.log('👋 Logging out...');
    authService.logout();
    setUser(null);
    // Force a full page reload to ensure header/footer render properly
    window.location.href = '/';
  };

  const register = async (data: RegisterData) => {
    try {
      setLoading(true);
      setError(null);
      
      await authService.register(data);
      
      const currentUser = authService.getCurrentUser();
      setUser(currentUser);
      
      navigate('/');
      
    } catch (err: any) {
      setError(err.message || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Add this function inside the AuthProvider component
const refreshUser = async () => {
  const currentUser = authService.getCurrentUser();
  if (currentUser) {
    setUser(currentUser);
  }
};

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user && !!authService.getToken(),
        isAdmin,
        isCustomer: isCustomerValue,
        isManager: isManagerValue,
        login,
        logout,
        register,
        refreshUser,
        loading,
        error
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};