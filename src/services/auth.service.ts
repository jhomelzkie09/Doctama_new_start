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
  // Login method - NOW USING SESSIONSTORAGE
  login: async (credentials: LoginCredentials): Promise<{
    token: string;
    roles: string[];
    userId: string;
    email: string;
    fullName?: string;
  }> => {
    try {
      console.log('🌐 Calling API:', `${API_URL}/auth/login`);
      const response = await axios.post(`${API_URL}/auth/login`, credentials, {
        headers: { 'Content-Type': 'application/json' }
      });
      const data = response.data;
      
      console.log('📦 Raw API response:', data);
      
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
      
      console.log('💾 Storing user data in sessionStorage:', userData);
      
      // 🔥 CHANGE: Use sessionStorage instead of localStorage
      sessionStorage.setItem('token', data.token);
      sessionStorage.setItem('user', JSON.stringify(userData));
      
      return {
        ...data,
        fullName: userData.fullName
      };
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  },

  // Register method - NOW USING SESSIONSTORAGE
  register: async (userData: RegisterData): Promise<any> => {
    try {
      console.log('📤 Registering user with data:', userData);
      
      const response = await axios.post(`${API_URL}/auth/register`, {
        email: userData.email,
        password: userData.password,
        fullName: userData.fullName
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Registration response:', response.data);
      const data = response.data;
      
      if (data.token) {
        // 🔥 CHANGE: Use sessionStorage instead of localStorage
        sessionStorage.setItem('token', data.token);
        sessionStorage.setItem('user', JSON.stringify({
          id: data.userId,
          email: data.email,
          fullName: data.fullName || userData.fullName,
          roles: data.roles || []
        }));
      }
      
      return data;
    } catch (error: any) {
      console.error('❌ Registration error:', error.response?.data || error.message);
      
      // Extract and format error message
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

  // Get current user - NOW READING FROM SESSIONSTORAGE
  getCurrentUser: (): User | null => {
    try {
      // 🔥 CHANGE: Read from sessionStorage instead of localStorage
      const userStr = sessionStorage.getItem('user');
      if (!userStr) return null;
      
      console.log('📖 Raw user from sessionStorage:', userStr);
      
      const storedUser: StoredUser = JSON.parse(userStr);
      
      console.log('📖 Parsed stored user:', storedUser);
      
      // Return a complete User object with default values for missing fields
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
      
      console.log('👤 Final user object:', fullUser);
      console.log('👑 User roles:', fullUser.roles);
      
      return fullUser;
    } catch (error) {
      console.error('Error parsing user:', error);
      return null;
    }
  },
  
  // Get minimal user data - NOW READING FROM SESSIONSTORAGE
  getStoredUser: (): StoredUser | null => {
    try {
      // 🔥 CHANGE: Read from sessionStorage instead of localStorage
      const userStr = sessionStorage.getItem('user');
      if (!userStr) return null;
      
      return JSON.parse(userStr);
    } catch (error) {
      console.error('Error parsing user:', error);
      return null;
    }
  },

  // Logout method - NOW CLEARING SESSIONSTORAGE
  logout: (): void => {
    // 🔥 CHANGE: Remove from sessionStorage instead of localStorage
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
  },

  // Check if user is authenticated - NOW CHECKING SESSIONSTORAGE
  isAuthenticated: (): boolean => {
    // 🔥 CHANGE: Check sessionStorage instead of localStorage
    return !!sessionStorage.getItem('token');
  },

  // Get auth token - NOW READING FROM SESSIONSTORAGE
  getToken: (): string | null => {
    // 🔥 CHANGE: Read from sessionStorage instead of localStorage
    return sessionStorage.getItem('token');
  },

  // Check if user has admin role - NOW READING FROM SESSIONSTORAGE
  isAdmin: (): boolean => {
    const user = authService.getStoredUser();
    return user?.roles?.some(role => 
      role.toLowerCase() === 'admin' || role.toLowerCase() === 'administrator'
    ) || false;
  },

  // Update user in storage - NOW WRITING TO SESSIONSTORAGE
  updateStoredUser: (updates: Partial<StoredUser>): void => {
    try {
      const currentUser = authService.getStoredUser();
      if (currentUser) {
        const updatedUser = { ...currentUser, ...updates };
        // 🔥 CHANGE: Store in sessionStorage instead of localStorage
        sessionStorage.setItem('user', JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error('Error updating stored user:', error);
    }
  }
};

export default authService;