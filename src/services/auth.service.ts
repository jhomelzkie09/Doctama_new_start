import axios from 'axios';
import { API_URL } from '../api/config';
import { LoginCredentials, RegisterData, User } from '../types';

// Create a type for the stored user data
interface StoredUser {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
}

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
      console.log('🌐 Calling API:', `${API_URL}/auth/login`);
      console.log('🔗 Full URL:', API_URL + '/auth/login');
      const response = await axios.post(`${API_URL}/auth/login`, credentials, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const data = response.data;
      
      console.log('Login response:', data);
      
      if (!data.token) {
        throw new Error('Login failed: No token received');
      }
      
      // Store user data with fullName if available
      const userData = {
        id: data.userId,
        email: data.email,
        fullName: data.fullName || data.email?.split('@')[0] || 'User',
        roles: data.roles || []
      };
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      return {
        ...data,
        fullName: userData.fullName
      };
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  },

  // Register method
  register: async (userData: RegisterData): Promise<any> => {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, userData);
      const data = response.data;
      
      if (data.token) {
        const userToStore = {
          id: data.userId,
          email: data.email,
          fullName: data.fullName || userData.fullName || data.email?.split('@')[0] || 'User',
          roles: data.roles || []
        };
        
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(userToStore));
      }
      
      return data;
    } catch (error: any) {
      console.error('Registration error:', error);
      throw error.response?.data || error.message;
    }
  },

  // Get current user from localStorage - UPDATED to match User interface
  getCurrentUser: (): User | null => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return null;
      
      const storedUser: StoredUser = JSON.parse(userStr);
      
      // Return a complete User object with default values for missing fields
      const fullUser: User = {
        id: storedUser.id,
        email: storedUser.email,
        fullName: storedUser.fullName || storedUser.email?.split('@')[0] || 'User',
        firstName: storedUser.fullName?.split(' ')[0] || '',
        lastName: storedUser.fullName?.split(' ').slice(1).join(' ') || '',
        roles: storedUser.roles || [],
        isActive: true, // Default value
        emailConfirmed: true, // Default value
        createdAt: new Date().toISOString(), // Default value
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

  // Get minimal user data (useful for contexts that don't need full User)
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
    return !!localStorage.getItem('token');
  },

  // Get auth token
  getToken: (): string | null => {
    return localStorage.getItem('token');
  },

  // Check if user has admin role
  isAdmin: (): boolean => {
    const user = authService.getStoredUser();
    return user?.roles?.some(role => 
      role.toLowerCase() === 'admin' || role.toLowerCase() === 'administrator'
    ) || false;
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