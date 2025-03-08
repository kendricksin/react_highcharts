import React from 'react';
import './App.css';
import CompanyDashboard from './components/CompanyDashboard';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      
      <main>
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <CompanyDashboard />
        </div>
      </main>
    </div>
  );
};

export default App;