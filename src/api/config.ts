import axios from 'axios';

// Get API URL from environment or use default
//const API_URL = process.env.REACT_APP_API_URL || 'https://doctamaapisimple-production.up.railway.app/api';

const API_URL = process.env.REACT_APP_API_URL || 'https://doctamaapi-simple.onrender.com/api';

// Clean up URL if it has spaces
const cleanApiUrl = API_URL?.trim();

// Create axios instance with default config
const api = axios.create({
  baseURL: cleanApiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 10 second timeout
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
    
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Request interceptor - add more logging
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn('⚠️ No token found for request:', config.url);
    }
    return config;
  },
  (error) => {
    console.error('❌ Request error:', error);
    return Promise.reject(error);
  }
);

export default api;
export { API_URL };