import React, { createContext, useState, useContext, useEffect } from 'react';
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

  // Compute role-based values using imported utilities
  const isAdmin = checkIsAdmin(user);
  const isCustomerValue = isCustomer(user);
  const isManagerValue = isManager(user);

  useEffect(() => {
    // Get user from sessionStorage on mount
    const currentUser = authService.getCurrentUser();
    console.log('🏁 Initial user from sessionStorage:', currentUser);
    setUser(currentUser);
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      await authService.login({ email, password });
      
      // Get the updated user from sessionStorage
      const currentUser = authService.getCurrentUser();
      console.log('🔑 User after login:', currentUser);
      setUser(currentUser);
      
    } catch (err: any) {
      setError(err.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    console.log('👋 User logged out, sessionStorage cleared');
  };

  const register = async (data: RegisterData) => {
    try {
      setLoading(true);
      setError(null);
      
      await authService.register(data);
      
      const currentUser = authService.getCurrentUser();
      setUser(currentUser);
      
    } catch (err: any) {
      setError(err.message || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAdmin,
        isCustomer: isCustomerValue,
        isManager: isManagerValue,
        login,
        logout,
        register,
        loading,
        error
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};