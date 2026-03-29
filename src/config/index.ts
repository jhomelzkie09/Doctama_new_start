const config = {
  API_URL: process.env.REACT_APP_API_URL?.trim() || 'https://doctamaapi-simple.onrender.com',
  ENVIRONMENT: process.env.REACT_APP_ENVIRONMENT || 'production'
};

// Export for direct use
export const API_URL = config.API_URL;
export const ENVIRONMENT = config.ENVIRONMENT;

export default config;