import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, RegisterData } from '../types';
import authService from '../services/auth.service';
import api from '../../src/api/config'; // Import the API instance for token validation
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

  // Check token validity on mount and set up refresh interval
  useEffect(() => {
    const initAuth = async () => {
      const token = authService.getToken();
      const currentUser = authService.getCurrentUser();
      
      if (token && currentUser) {
        // Validate token with backend
        try {
          await api.get('/auth/validate');
          setUser(currentUser);
        } catch (error) {
          // Token invalid, try to refresh
          const newToken = await authService.refreshToken();
          if (newToken) {
            setUser(currentUser);
          } else {
            authService.logout();
            setUser(null);
          }
        }
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
        await authService.refreshToken();
      } catch (error) {
        console.error('Token refresh failed:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes
    
    return () => clearInterval(refreshInterval);
  }, [user]);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      await authService.login({ email, password });
      
      const currentUser = authService.getCurrentUser();
      setUser(currentUser);
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