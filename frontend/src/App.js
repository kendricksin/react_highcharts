// App.js
import React, { useState, useEffect } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import axios from 'axios';
import './App.css';

function App() {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [year, setYear] = useState('');
  const [availableYears, setAvailableYears] = useState([]);

  // Function to fetch data from API
  const fetchData = async (selectedYear = null) => {
    setLoading(true);
    try {
      const endpoint = `http://localhost:8000/api/data${selectedYear ? `?year=${selectedYear}` : ''}`;
      const response = await axios.get(endpoint);
      
      // Process data for chart
      const months = response.data.map(item => `${item.month} ${item.year}`);
      const values = response.data.map(item => item.total_sum_price_agree);
      const counts = response.data.map(item => item.count);

      // Get unique years for filter
      const years = [...new Set(response.data.map(item => item.year))];
      setAvailableYears(years.sort((a, b) => a - b));
      
      // Configure chart options
      const options = {
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
            formatter: function () {
              return this.value.toLocaleString('th-TH');
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
          formatter: function() {
            let tooltip = '<b>' + this.x + '</b><br/>';
            this.points.forEach(point => {
              const name = point.series.name;
              const value = name === 'Number of Projects' 
                ? point.y 
                : point.y.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
              tooltip += name + ': ' + value + (name === 'Number of Projects' ? '' : ' THB') + '<br/>';
            });
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
        }]
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
  const handleYearChange = (e) => {
    const selectedYear = e.target.value;
    setYear(selectedYear);
    fetchData(selectedYear === '' ? null : selectedYear);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Project Agreements Dashboard</h1>
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
      </header>
      
      <main className="App-main">
        {loading ? (
          <div className="loading">Loading data...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : (
          <div className="chart-container">
            <HighchartsReact highcharts={Highcharts} options={chartData} />
          </div>
        )}
      </main>
      
      <footer className="App-footer">
        <p>Data visualization created with React and Highcharts</p>
      </footer>
    </div>
  );
}

export default App;
