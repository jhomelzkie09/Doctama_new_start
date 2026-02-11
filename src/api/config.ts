import axios from 'axios';

// Get API URL from environment or use default
const API_URL = process.env.REACT_APP_API_URL || 'https://doctamaapisimple-production.up.railway.app/api';

console.log('🔧 API Config loaded:', {
  API_URL,
  HasSpace: API_URL?.startsWith(' '),
  Length: API_URL?.length
});

// Clean up URL if it has spaces
const cleanApiUrl = API_URL?.trim();

// Create axios instance with default config
const api = axios.create({
  baseURL: cleanApiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('📤 Request:', config.method?.toUpperCase(), config.url);
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
    console.log('📥 Response:', response.status, response.config.url);
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

export default api;
export { API_URL };