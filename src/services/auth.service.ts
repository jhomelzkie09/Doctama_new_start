import axios from 'axios';
import { API_URL } from '../api/config';
import { LoginCredentials, RegisterData, User } from '../types';

const authService = {
  // Login method
  login: async (credentials: LoginCredentials): Promise<{
    token: string;
    roles: string[];
    userId: string;
    email: string;
  }> => {
    try {
      console.log('🌐 Calling API:', `${API_URL}/auth/login`);
      console.log('🔗 Full URL:', API_URL + '/auth/login');
      const response = await axios.post(`${API_URL}/auth/login`, credentials, {headers: {
        'Content-Type': 'application/json'
      }});
      const data = response.data;
      
      console.log('Login response:', data);
      
      if (!data.token) {
        throw new Error('Login failed: No token received');
      }
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify({
        id: data.userId,
        email: data.email,
        fullName: '',
        roles: data.roles || []
      }));
      
      return data;
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
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify({
          id: data.userId,
          email: data.email,
          fullName: data.fullName || '',
          roles: data.roles || []
        }));
      }
      
      return data;
    } catch (error: any) {
      console.error('Registration error:', error);
      throw error.response?.data || error.message;
    }
  },

  // Get current user from localStorage
  getCurrentUser: (): User | null => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return null;
      
      const userData = JSON.parse(userStr);
      return {
        id: userData.id,
        email: userData.email,
        fullName: userData.fullName || '',
        roles: userData.roles || []
      };
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
  }
};

export default authService;