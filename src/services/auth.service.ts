import axios from 'axios';
import { API_URL } from '../config';
import { LoginCredentials, RegisterData, User } from '../types';

// Create a type for the stored user data
interface StoredUser {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
}

// Create an axios instance for API calls
const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

// Add interceptor to add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const authService = {
  // Login method
  login: async (credentials: LoginCredentials): Promise<{
    token: string;
    roles: string[];
    userId: string;
    email: string;
    fullName?: string;
  }> => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, credentials, {
        headers: { 'Content-Type': 'application/json' }
      });
      const data = response.data;
      
      let token = data.token || data.accessToken || data.access_token;
      
      if (!token) {
        console.error('❌ No token found in response:', data);
        throw new Error('Login failed: No token received');
      }
      
      const userId = data.userId || data.user?.id || data.id;
      const email = data.email || data.user?.email;
      const fullName = data.fullName || data.user?.fullName || email?.split('@')[0] || 'User';
      const roles = data.roles || data.user?.roles || [];
      
      const userData: StoredUser = {
        id: userId,
        email: email,
        fullName: fullName,
        roles: roles
      };
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      return {
        token,
        roles,
        userId,
        email,
        fullName
      };
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  },

  // Register method
  register: async (userData: RegisterData): Promise<any> => {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        email: userData.email,
        password: userData.password,
        fullName: userData.fullName
      }, {
        headers: { 'Content-Type': 'application/json' }
      });
      const data = response.data;
      
      if (data.token || data.accessToken) {
        const token = data.token || data.accessToken;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify({
          id: data.userId || data.user?.id,
          email: data.email || data.user?.email,
          fullName: data.fullName || userData.fullName,
          roles: data.roles || data.user?.roles || []
        }));
      }
      
      return data;
    } catch (error: any) {
      console.error('❌ Registration error:', error.response?.data || error.message);
      
      if (error.response?.data?.errors) {
        const errorMessages = Object.values(error.response.data.errors).flat();
        throw new Error(errorMessages.join(', '));
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.response?.data) {
        throw new Error(JSON.stringify(error.response.data));
      } else {
        throw new Error('Registration failed. Please try again.');
      }
    }
  },

  // ADD THIS METHOD - Refresh token
  refreshToken: async (): Promise<string | null> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;
      
      const response = await api.post('/auth/refresh-token', {});
      const { token: newToken } = response.data;
      
      if (newToken) {
        localStorage.setItem('token', newToken);
        return newToken;
      }
      return null;
    } catch (error) {
      console.error('Token refresh failed:', error);
      authService.logout();
      return null;
    }
  },

  // ADD THIS METHOD - Validate token
  validateToken: async (): Promise<boolean> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return false;
      
      await api.get('/auth/validate');
      return true;
    } catch (error) {
      console.error('Token validation failed:', error);
      return false;
    }
  },

  // Get current user
  getCurrentUser: (): User | null => {
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      
      if (!token || !userStr) return null;
      
      const storedUser: StoredUser = JSON.parse(userStr);
      
      const fullUser: User = {
        id: storedUser.id,
        email: storedUser.email,
        fullName: storedUser.fullName || storedUser.email?.split('@')[0] || 'User',
        firstName: storedUser.fullName?.split(' ')[0] || '',
        lastName: storedUser.fullName?.split(' ').slice(1).join(' ') || '',
        roles: storedUser.roles || [],
        isActive: true,
        emailConfirmed: true,
        createdAt: new Date().toISOString(),
        phoneNumber: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        country: '',
        profileImage: '',
        updatedAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };
      
      return fullUser;
    } catch (error) {
      console.error('Error parsing user:', error);
      return null;
    }
  },
  
  // Get minimal user data
  getStoredUser: (): StoredUser | null => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return null;
      
      return JSON.parse(userStr);
    } catch (error) {
      console.error('Error parsing user:', error);
      return null;
    }
  },

  // Logout method
  logout: (): void => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    const token = localStorage.getItem('token');
    return !!token;
  },

  // Get auth token
  getToken: (): string | null => {
    const token = localStorage.getItem('token');
    return token;
  },

  // Check if token is expired
  isTokenExpired: (): boolean => {
    const token = localStorage.getItem('token');
    if (!token) return true;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiry = payload.exp * 1000;
      return Date.now() > expiry;
    } catch {
      return true;
    }
  },

  // Check if user has admin role
  isAdmin: (): boolean => {
    const user = authService.getStoredUser();
    const isAdminUser = user?.roles?.some(role => 
      role.toLowerCase() === 'admin' || role.toLowerCase() === 'administrator'
    ) || false;
    return isAdminUser;
  },

  // Update user in storage
  updateStoredUser: (updates: Partial<StoredUser>): void => {
    try {
      const currentUser = authService.getStoredUser();
      if (currentUser) {
        const updatedUser = { ...currentUser, ...updates };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error('Error updating stored user:', error);
    }
  }
};

export default authService;