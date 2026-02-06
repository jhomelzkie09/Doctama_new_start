import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import TestApi from './pages/TestApi';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<TestApi />} />
          <Route path="/test-api" element={<TestApi />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;