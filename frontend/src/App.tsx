// src/App.tsx
import React, { useState } from 'react';
import './App.css';
import CompanyDashboard from './components/CompanyDashboard';
import ProjectDataLoader from './components/ProjectDataLoader';

const App: React.FC = () => {
  const [activeChart, setActiveChart] = useState<'monthly' | 'companies' | 'winrates' | 'dashboard'>('dashboard');

  // Handle chart type change
  const handleChartChange = (chartType: 'monthly' | 'companies' | 'winrates' | 'dashboard'): void => {
    setActiveChart(chartType);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Project Agreements Dashboard</h1>
        
        <div className="chart-tabs">
          <button 
            className={`tab-button ${activeChart === 'dashboard' ? 'active' : ''}`}
            onClick={() => handleChartChange('dashboard')}
          >
            Company Dashboard
          </button>
          <button 
            className={`tab-button ${activeChart === 'monthly' ? 'active' : ''}`}
            onClick={() => handleChartChange('monthly')}
          >
            Monthly Analysis
          </button>
          <button 
            className={`tab-button ${activeChart === 'companies' ? 'active' : ''}`}
            onClick={() => handleChartChange('companies')}
          >
            Top Companies
          </button>
          <button 
            className={`tab-button ${activeChart === 'winrates' ? 'active' : ''}`}
            onClick={() => handleChartChange('winrates')}
          >
            Company Win Rates
          </button>
        </div>
      </header>
      
      <main className="App-main">
        {activeChart === 'dashboard' ? (
          // Original Company dashboard
          <CompanyDashboard />
        ) : (
          // New filtered data visualization for other tabs
          <ProjectDataLoader activeChart={activeChart} />
        )}
      </main>
      
      <footer className="App-footer">
        <p>Data visualization created with React and Highcharts</p>
      </footer>
    </div>
  );
};

export default App;