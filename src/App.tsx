import React, { useEffect } from 'react';

function App() {
  useEffect(() => {
    // Test API directly
    fetch('https://doctamaapisimple-production.up.railway.app/api/products')
      .then(response => {
        console.log('API Response status:', response.status);
        return response.json();
      })
      .then(data => console.log('API Data:', data))
      .catch(error => console.error('API Error:', error));
    
    // Log environment
    console.log('API URL:', process.env.REACT_APP_API_URL);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Doctama Frontend</h1>
        <p className="text-gray-600 mb-2">Check browser console for API test results</p>
        <p className="text-sm text-gray-500">API URL: {process.env.REACT_APP_API_URL}</p>
      </div>
    </div>
  );
}

export default App;