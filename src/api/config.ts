const config = {
  API_URL: process.env.REACT_APP_API_URL || 'https://doctamaapisimple-production.up.railway.app/api',
  ENVIRONMENT: process.env.REACT_APP_ENVIRONMENT || 'production'
};

console.log('🔧 Config loaded:', {
  API_URL: config.API_URL,
  ENVIRONMENT: config.ENVIRONMENT,
  HasSpace: config.API_URL?.startsWith(' ')
});

// Validate URL
if (!config.API_URL) {
  console.error('❌ API_URL is not defined in environment variables');
}

if (config.API_URL?.includes(' ')) {
  console.error('❌ API_URL contains spaces! Fix your .env file');
  // Clean up the URL
  config.API_URL = config.API_URL.trim();
}

export default config;
export const { API_URL, ENVIRONMENT } = config;