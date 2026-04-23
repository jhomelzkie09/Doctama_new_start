import axios from 'axios';

// Get API URL from environment or use default
//const API_URL = process.env.REACT_APP_API_URL || 'https://doctamaapi-simple.onrender.com/api';
const API_URL = process.env.REACT_APP_API_URL || 'https://doctamaapisimple-production.up.railway.app/api';

// Clean up URL if it has spaces
const cleanApiUrl = API_URL?.trim();

// Create axios instance with default config
const api = axios.create({
  baseURL: cleanApiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('❌ Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('❌ Response error:', {
      message: error.message,
      status: error.response?.status,
      url: error.config?.url,
      data: error.response?.data
    });
    
    // Handle 401 errors
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      const isAuthEndpoint = url.includes('/auth/');
      const isCancelEndpoint = url.includes('/cancel');
      
      // DON'T logout on cancel endpoint 401 - just let the component handle it
      if (isCancelEndpoint) {
        console.log('⚠️ Cancel endpoint returned 401 - user not authorized, not logging out');
        // Don't clear token, don't redirect - just pass error to component
        return Promise.reject(error);
      }
      
      if (!isAuthEndpoint) {
        // Token expired or invalid - clear storage and redirect to home
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Redirect to home instead of login
        if (window.location.pathname !== '/') {
          window.location.href = '/';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
export { API_URL };