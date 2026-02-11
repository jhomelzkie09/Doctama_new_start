import axios from 'axios';
import { API_URL } from '../api/config';
import { LoginCredentials, RegisterData, User, ApiResponse } from '../types';

const authService = {
  login: async (credentials: LoginCredentials): Promise<{
    token: string;
    roles: string[];
    userId: string;
    email: string;
  }> => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, credentials);
      const data = response.data;
      
      console.log('📥 Login response:', data); // Add this for debugging
      
      if (!data.token) {
        throw new Error('Login failed: No token received');
      }
      
      // Store in localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify({
        id: data.userId,
        email: data.email,
        fullName: '', // You might need to get this from backend
        roles: data.roles || [] // CRITICAL!
      }));
      
      return data;
    } catch (error: any) {
      console.error('❌ Login error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  },

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

  getCurrentUser: (): User | null => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return null;
      
      const userData = JSON.parse(userStr);
      return {
        id: userData.id,
        email: userData.email,
        fullName: userData.fullName || '',
        roles: userData.roles || [] // Make sure this exists
      };
    } catch (error) {
      console.error('Error parsing user:', error);
      return null;
    }
  },

  logout: (): void => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('token');
  },

  getToken: (): string | null => {
    return localStorage.getItem('token');
  }
};

export default authService;