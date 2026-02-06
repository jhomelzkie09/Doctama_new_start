import React, { useState, useEffect } from 'react';
import api from '../api/config';

const TestApi: React.FC = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [selectedEndpoint, setSelectedEndpoint] = useState('/');

  // REAL endpoints from your backend
  const endpoints = [
    { path: '/', label: 'API Root', method: 'GET' },
    { path: '/test-simple', label: 'Simple Test', method: 'GET' },
    { path: '/debug-connection', label: 'DB Connection', method: 'GET' },
    { path: '/test-db', label: 'Database Test', method: 'GET' },
    { path: '/init-db', label: 'Init Database', method: 'GET' },
    { path: '/test-identity', label: 'Identity Test', method: 'GET' },
    { path: '/debug-controllers', label: 'Debug Controllers', method: 'GET' },
  ];

  const testEndpoint = async (endpoint: string) => {
    setStatus('loading');
    setMessage(`Testing ${endpoint}...`);
    
    try {
      const response = await api.get(endpoint);
      setStatus('success');
      
      // Format the response nicely
      if (typeof response.data === 'string') {
        setMessage(`✅ ${response.status}: ${response.data}`);
      } else {
        const dataStr = JSON.stringify(response.data, null, 2);
        setMessage(`✅ ${response.status}\n${dataStr}`);
      }
    } catch (error: any) {
      setStatus('error');
      if (error.response) {
        setMessage(`❌ ${error.response.status}: ${error.response.statusText}\n${JSON.stringify(error.response.data, null, 2)}`);
      } else if (error.request) {
        setMessage('❌ No response from server');
      } else {
        setMessage(`❌ Error: ${error.message}`);
      }
    }
  };

  useEffect(() => {
    testEndpoint(selectedEndpoint);
  }, [selectedEndpoint]);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Doctama API Connection Test</h1>
          <p className="text-gray-600 mb-6">Testing backend endpoints from your Program.cs</p>
          
          <div className="mb-6">
            <div className="text-sm text-gray-600 mb-1">API Base URL:</div>
            <code className="bg-gray-100 p-3 rounded-lg text-sm block overflow-x-auto">
              {process.env.REACT_APP_API_URL}
            </code>
          </div>

          <div className="mb-6">
            <div className="text-sm text-gray-600 mb-2">Available Endpoints:</div>
            <div className="flex flex-wrap gap-2 mb-4">
              {endpoints.map((ep) => (
                <button
                  key={ep.path}
                  onClick={() => setSelectedEndpoint(ep.path)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    selectedEndpoint === ep.path
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {ep.label}
                </button>
              ))}
            </div>
            
            <div className="text-sm text-gray-600 mb-1">Testing Endpoint:</div>
            <code className="bg-gray-100 p-2 rounded text-sm block overflow-x-auto mb-4">
              {process.env.REACT_APP_API_URL}{selectedEndpoint}
            </code>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm text-gray-600 mb-1">Status:</div>
                <div className={`inline-flex items-center px-4 py-2 rounded-full font-medium ${
                  status === 'loading' ? 'bg-yellow-100 text-yellow-800' :
                  status === 'success' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {status === 'loading' && '🔄 Testing...'}
                  {status === 'success' && '✅ Connected'}
                  {status === 'error' && '❌ Error'}
                </div>
              </div>
              <button
                onClick={() => testEndpoint(selectedEndpoint)}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Test Again
              </button>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="text-sm text-gray-600 mb-2">Response:</div>
              <pre className="text-sm bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto whitespace-pre-wrap">
                {message}
              </pre>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">Backend Analysis:</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">✅ Working Endpoints:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <code>/</code> - API Root
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <code>/test-simple</code> - Simple test
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <code>/test-db</code> - Database test
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <code>/debug-connection</code> - Connection debug
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <code>/debug-controllers</code> - List controllers
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-700 mb-2">🔧 Missing Endpoints:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li className="flex items-center">
                  <span className="text-yellow-500 mr-2">⚠</span>
                  <code>/products</code> - Need ProductsController
                </li>
                <li className="flex items-center">
                  <span className="text-yellow-500 mr-2">⚠</span>
                  <code>/categories</code> - Need CategoriesController
                </li>
                <li className="flex items-center">
                  <span className="text-yellow-500 mr-2">⚠</span>
                  <code>/auth/*</code> - Need AuthController
                </li>
                <li className="flex items-center">
                  <span className="text-yellow-500 mr-2">⚠</span>
                  <code>/cart/*</code> - Need CartController
                </li>
                <li className="flex items-center">
                  <span className="text-yellow-500 mr-2">⚠</span>
                  <code>/orders/*</code> - Need OrdersController
                </li>
              </ul>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-blue-200">
            <h4 className="font-medium text-blue-800 mb-2">Next Steps:</h4>
            <ol className="text-sm text-gray-600 space-y-2">
              <li>1. <strong>Test current endpoints</strong> - They should all work ✅</li>
              <li>2. <strong>Create missing controllers</strong> in your backend</li>
              <li>3. <strong>Or build frontend with mock data</strong> while backend is being built</li>
              <li>4. <strong>Check <code>/debug-controllers</code></strong> to see what controllers exist</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestApi;