import axios from 'axios';
import { API_URL } from '../api/config';
import { LoginCredentials, RegisterData, User, ApiResponse, AuthResponse } from '../types';

const authService = {
  // Login method
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      const response = await axios.post<ApiResponse<AuthResponse>>(
        `${API_URL}/auth/login`,
        credentials
      );
      
      const data = response.data;
      
      if (!data.data) {
        throw new Error(data.message || 'Login failed');
      }
      
      // Store the token and user data
      const { user, token } = data.data;
      
      localStorage.setItem('token', token || '');
      localStorage.setItem('user', JSON.stringify({
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        roles: user.roles || ['user']
      }));
      
      return data.data;
    } catch (error: any) {
      console.error('Login error:', error);
      throw error.response?.data || error.message;
    }
  },

  // Register method
  register: async (userData: RegisterData): Promise<AuthResponse> => {
    try {
      const response = await axios.post<ApiResponse<AuthResponse>>(
        `${API_URL}/auth/register`,
        userData
      );
      
      const data = response.data;
      
      if (!data.data) {
        throw new Error(data.message || 'Registration failed');
      }
      
      // Store the token and user data
      const { user, token } = data.data;
      
      localStorage.setItem('token', token || '');
      localStorage.setItem('user', JSON.stringify({
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        roles: user.roles || ['user']
      }));
      
      return data.data;
    } catch (error: any) {
      console.error('Registration error:', error);
      throw error.response?.data || error.message;
    }
  },

  // Get current user from localStorage
  getCurrentUser: (): User | null => {
    try {
      const userStr = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      
      if (!userStr || !token) {
        return null;
      }
      
      const userData = JSON.parse(userStr);
      return {
        id: userData.id,
        email: userData.email,
        fullName: userData.fullName,
        roles: userData.roles || [],
        createdAt: userData.createdAt
      };
    } catch (error) {
      console.error('Error parsing user data:', error);
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

  // Update user data
  updateUser: (userData: Partial<User>): void => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      const updatedUser = { ...currentUser, ...userData };
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  }
};

export default authService;