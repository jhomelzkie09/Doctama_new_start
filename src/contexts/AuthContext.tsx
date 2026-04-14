import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, RegisterData } from '../types';
import authService from '../services/auth.service';
import api from '../../src/api/config';
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

  const isAdmin = checkIsAdmin(user);
  const isCustomerValue = isCustomer(user);
  const isManagerValue = isManager(user);

  // Check token validity on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = authService.getToken();
      const storedUser = authService.getCurrentUser();
      
      console.log('🔐 Auth init - token exists:', !!token);
      console.log('🔐 Auth init - stored user exists:', !!storedUser);
      
      if (token && storedUser) {
        // Validate token with backend
        try {
          const isValid = await authService.validateToken();
          console.log('🔐 Token validation result:', isValid);
          
          if (isValid) {
            setUser(storedUser);
          } else {
            // Token invalid, try to refresh
            const newToken = await authService.refreshToken();
            if (newToken) {
              setUser(storedUser);
            } else {
              authService.logout();
              setUser(null);
            }
          }
        } catch (error) {
          console.error('Auth validation error:', error);
          authService.logout();
          setUser(null);
        }
      } else {
        console.log('🔐 No token or user found');
      }
      setLoading(false);
    };
    
    initAuth();
  }, []);

  // Set up periodic token refresh (every 5 minutes)
  useEffect(() => {
    if (!user) return;
    
    const refreshInterval = setInterval(async () => {
      try {
        const newToken = await authService.refreshToken();
        if (!newToken) {
          // Refresh failed, logout
          authService.logout();
          setUser(null);
          navigate('/');
        }
      } catch (error) {
        console.error('Token refresh failed:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes
    
    return () => clearInterval(refreshInterval);
  }, [user, navigate]);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      await authService.login({ email, password });
      
      const currentUser = authService.getCurrentUser();
      setUser(currentUser);
      
      // Don't navigate here - let the component handle it
    } catch (err: any) {
      console.error('❌ Login error:', err);
      setError(err.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    navigate('/');
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