import React, { useState, useEffect } from 'react';
import api from '../api/config';

const TestApi: React.FC = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const testConnection = async () => {
      try {
        const response = await api.get('/health');
        setStatus('success');
        setMessage(`API Connected: ${response.data.message}`);
      } catch (error: any) {
        setStatus('error');
        setMessage(`API Error: ${error.message}`);
      }
    };

    testConnection();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">API Connection Test</h1>
        
        <div className="mb-4">
          <div className="text-sm text-gray-600 mb-1">API URL:</div>
          <code className="bg-gray-100 p-2 rounded text-sm block overflow-x-auto">
            {process.env.REACT_APP_API_URL}
          </code>
        </div>

        <div className="mb-6">
          <div className="text-sm text-gray-600 mb-1">Status:</div>
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            status === 'loading' ? 'bg-yellow-100 text-yellow-800' :
            status === 'success' ? 'bg-green-100 text-green-800' :
            'bg-red-100 text-red-800'
          }`}>
            {status === 'loading' && '⏳ Loading...'}
            {status === 'success' && '✅ Connected'}
            {status === 'error' && '❌ Error'}
          </div>
        </div>

        <div className="mb-6">
          <div className="text-sm text-gray-600 mb-1">Message:</div>
          <div className="bg-gray-50 p-3 rounded text-sm">{message || 'Testing connection...'}</div>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition"
        >
          Test Again
        </button>
      </div>
    </div>
  );
};

export default TestApi;