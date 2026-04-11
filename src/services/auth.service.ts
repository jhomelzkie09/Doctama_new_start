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

const authService = {
  // Login method - FIXED to properly store token
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
      
      // Check for token in different possible locations
      let token = data.token || data.accessToken || data.access_token;
      
      if (!token) {
        console.error('❌ No token found in response:', data);
        throw new Error('Login failed: No token received');
      }
      
      // Get user data from response
      const userId = data.userId || data.user?.id || data.id;
      const email = data.email || data.user?.email;
      const fullName = data.fullName || data.user?.fullName || email?.split('@')[0] || 'User';
      const roles = data.roles || data.user?.roles || [];
      
      // Store user data
      const userData: StoredUser = {
        id: userId,
        email: email,
        fullName: fullName,
        roles: roles
      };
      
      // Store in localStorage
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
        headers: {
          'Content-Type': 'application/json'
        }
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

  // Get current user
  getCurrentUser: (): User | null => {
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      
      if (!token || !userStr) return null;
      
      const storedUser: StoredUser = JSON.parse(userStr);
      
      // Return a complete User object
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