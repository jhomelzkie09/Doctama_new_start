import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Construction } from 'lucide-react';

const PlaceholderPage = ({ title }: { title: string }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <button
        onClick={() => navigate('/admin')}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Dashboard
      </button>
      
      <div className="bg-white rounded-lg shadow-sm p-12 text-center">
        <Construction className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
        <p className="text-gray-500 mb-6">
          This page is under construction. Check back soon!
        </p>
        <button
          onClick={() => navigate('/admin')}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  );
};

export default PlaceholderPage;