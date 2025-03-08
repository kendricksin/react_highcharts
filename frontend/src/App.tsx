// src/App.tsx
import React, { useState, useEffect } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import axios from 'axios';
import './App.css';
import CompanyProjectsChart from './components/CompanyProjectsChart';
import CompanyWinRateChart from './components/CompanyWinRateChart';
import CompanyDashboard from './components/CompanyDashboard';
import { ProjectData } from './types';

// Define our own tooltip formatter context object
interface TooltipFormatterContextObject {
  x?: string;
  y?: number;
  points?: Array<{
    y: number;
    series: {
      name: string;
    };
  }>;
}

const App: React.FC = () => {
  const [chartData, setChartData] = useState<Highcharts.Options | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [year, setYear] = useState<string>('');
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [activeChart, setActiveChart] = useState<'monthly' | 'companies' | 'winrates' | 'dashboard'>('dashboard');

  // Function to fetch data from API
  const fetchData = async (selectedYear: string | null = null): Promise<void> => {
    setLoading(true);
    try {
      const endpoint = `http://localhost:8000/api/data${selectedYear ? `?year=${selectedYear}` : ''}`;
      const response = await axios.get<ProjectData[]>(endpoint);
      
      // Process data for chart
      const months = response.data.map(item => `${item.month} ${item.year}`);
      const values = response.data.map(item => item.total_sum_price_agree);
      const counts = response.data.map(item => item.count);

      // Get unique years for filter - fix for Set iteration
      const yearsSet = new Set<number>();
      response.data.forEach(item => yearsSet.add(item.year));
      const years = Array.from(yearsSet).sort((a, b) => a - b);
      setAvailableYears(years);
      
      // Configure chart options
      const options: Highcharts.Options = {
        title: {
          text: 'Total Project Value by Month'
        },
        subtitle: {
          text: 'Source: Projects Data'
        },
        xAxis: {
          categories: months,
          title: {
            text: 'Month'
          }
        },
        yAxis: [{
          title: {
            text: 'Total Value (THB)'
          },
          labels: {
            formatter: function(): string {
              return (this.value as number).toLocaleString('th-TH');
            }
          }
        }, {
          title: {
            text: 'Number of Projects'
          },
          opposite: true
        }],
        tooltip: {
          shared: true,
          formatter: function(): string {
            let tooltip = '<b>' + this.x + '</b><br/>';
            // Cast this to our custom type
            const ctx = this as unknown as TooltipFormatterContextObject;
            if (ctx.points) {
              ctx.points.forEach(point => {
                const name = point.series.name;
                const value = name === 'Number of Projects' 
                  ? point.y 
                  : point.y.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                tooltip += name + ': ' + value + (name === 'Number of Projects' ? '' : ' THB') + '<br/>';
              });
            }
            return tooltip;
          }
        },
        legend: {
          enabled: true
        },
        credits: {
          enabled: false
        },
        series: [{
          name: 'Total Value',
          type: 'column',
          data: values,
          color: '#4285F4'
        }, {
          name: 'Number of Projects',
          type: 'line',
          data: counts,
          yAxis: 1,
          color: '#EA4335'
        }] as Highcharts.SeriesOptionsType[]
      };
      
      setChartData(options);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data. Please try again later.');
      setLoading(false);
    }
  };

  // Initial data load
  useEffect(() => {
    fetchData();
  }, []);

  // Handle year change
  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    const selectedYear = e.target.value;
    setYear(selectedYear);
    fetchData(selectedYear === '' ? null : selectedYear);
  };

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
        
        {activeChart === 'monthly' && (
          <div className="filter-container">
            <label htmlFor="year-filter">Filter by Year:</label>
            <select 
              id="year-filter" 
              value={year} 
              onChange={handleYearChange}
            >
              <option value="">All Years</option>
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        )}
      </header>
      
      <main className="App-main">
        {activeChart === 'dashboard' ? (
          // Company dashboard with search
          <CompanyDashboard />
        ) : activeChart === 'monthly' ? (
          // Monthly chart
          loading ? (
            <div className="loading">Loading data...</div>
          ) : error ? (
            <div className="error">{error}</div>
          ) : (
            <div className="chart-container">
              <HighchartsReact highcharts={Highcharts} options={chartData} />
            </div>
          )
        ) : activeChart === 'companies' ? (
          // Company projects chart
          <CompanyProjectsChart />
        ) : (
          // Company win rates chart
          <CompanyWinRateChart />
        )}
      </main>
      
      <footer className="App-footer">
        <p>Data visualization created with React and Highcharts</p>
      </footer>
    </div>
  );
};

export default App;