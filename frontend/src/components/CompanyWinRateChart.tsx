// src/components/CompanyWinRateChart.tsx
import React, { useState, useEffect } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import axios from 'axios';

// Define interfaces
interface CompanyWinRate {
  tin: string;
  company: string;
  total_bids: number;
  wins: number;
  win_rate: number;
  total_bid_value: number;
  avg_bid: number;
  avg_bid_ratio: number;
}

interface HeadToHeadCompetitor {
  competitor_tin: string;
  competitor: string;
  encounters: number;
  company_wins: number;
  competitor_wins: number;
  win_rate_vs_competitor: number;
}

interface HeadToHeadResponse {
  company: string;
  competitors: HeadToHeadCompetitor[];
}

const CompanyWinRateChart: React.FC = () => {
  const [winRateData, setWinRateData] = useState<CompanyWinRate[]>([]);
  const [headToHeadData, setHeadToHeadData] = useState<HeadToHeadResponse | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [minBids, setMinBids] = useState<number>(3);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch win rate data
  const fetchWinRateData = async (): Promise<void> => {
    setLoading(true);
    try {
      const response = await axios.get<CompanyWinRate[]>(`http://localhost:8000/api/company-win-rates?min_bids=${minBids}`);
      setWinRateData(response.data);
      
      // If there's data and no company selected yet, select the first one
      if (response.data.length > 0 && !selectedCompany) {
        setSelectedCompany(response.data[0].tin);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching win rate data:', err);
      setError('Failed to load win rate data. Please try again later.');
      setLoading(false);
    }
  };

  // Function to fetch head-to-head data
  const fetchHeadToHeadData = async (companyTin: string): Promise<void> => {
    if (!companyTin) return;
    
    try {
      const response = await axios.get<HeadToHeadResponse>(`http://localhost:8000/api/head-to-head?company_tin=${companyTin}`);
      setHeadToHeadData(response.data);
    } catch (err) {
      console.error('Error fetching head-to-head data:', err);
      setHeadToHeadData(null);
    }
  };

  // Initial data load
  useEffect(() => {
    fetchWinRateData();
  }, [minBids]);

  // Fetch head-to-head data when selected company changes
  useEffect(() => {
    if (selectedCompany) {
      fetchHeadToHeadData(selectedCompany);
    }
  }, [selectedCompany]);

  // Handle company selection change
  const handleCompanyChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    setSelectedCompany(e.target.value);
  };

  // Handle min bids change
  const handleMinBidsChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value > 0) {
      setMinBids(value);
    }
  };

  // Create win rate chart options
  const getWinRateChartOptions = (): Highcharts.Options => {
    const companies = winRateData.slice(0, 15).map(item => item.company);
    const winRates = winRateData.slice(0, 15).map(item => item.win_rate);
    const bidCounts = winRateData.slice(0, 15).map(item => item.total_bids);
    
    return {
      chart: {
        type: 'bar',
        height: 600
      },
      title: {
        text: 'Company Win Rates'
      },
      subtitle: {
        text: 'Source: Project Bid Data'
      },
      xAxis: {
        categories: companies,
        title: {
          text: 'Company'
        }
      },
      yAxis: [{
        min: 0,
        max: 100,
        title: {
          text: 'Win Rate (%)'
        }
      }, {
        min: 0,
        title: {
          text: 'Number of Bids'
        },
        opposite: true
      }],
      tooltip: {
        shared: true,
        formatter: function() {
          // Add type assertion for 'this' to include points property
          const self = this as unknown as { x: string; points: Array<{ series: { name: string }; y: number }> };
          const points = self.points || [];
          let tooltip = `<b>${self.x}</b><br/>`;
          
          points.forEach(point => {
            const seriesName = point.series.name;
            const value = point.y;
            tooltip += `${seriesName}: ${seriesName === 'Win Rate' ? value.toFixed(2) + '%' : value}<br/>`;
          });
          
          return tooltip;
        }
      },
      legend: {
        shadow: false
      },
      plotOptions: {
        bar: {
          dataLabels: {
            enabled: true,
            formatter: function() {
              return this.series.name === 'Win Rate' ? this.y!.toFixed(1) + '%' : this.y;
            }
          }
        }
      },
      series: [{
        name: 'Win Rate',
        type: 'bar',
        data: winRates,
        color: '#4285F4'
      }, {
        name: 'Total Bids',
        type: 'line',
        data: bidCounts,
        yAxis: 1,
        color: '#EA4335'
      }]
    };
  };

  // Create head-to-head chart options
  const getHeadToHeadChartOptions = (): Highcharts.Options => {
    if (!headToHeadData || headToHeadData.competitors.length === 0) {
      return {
        title: {
          text: 'No head-to-head data available'
        }
      };
    }
    
    const competitors = headToHeadData.competitors.map(item => item.competitor);
    const winRates = headToHeadData.competitors.map(item => item.win_rate_vs_competitor);
    const encounters = headToHeadData.competitors.map(item => item.encounters);
    
    return {
      chart: {
        type: 'column',
        height: 400
      },
      title: {
        text: `${headToHeadData.company}'s Performance vs. Competitors`
      },
      xAxis: {
        categories: competitors,
        crosshair: true
      },
      yAxis: [{
        min: 0,
        max: 100,
        title: {
          text: 'Win Rate (%)'
        }
      }, {
        min: 0,
        title: {
          text: 'Number of Encounters'
        },
        opposite: true
      }],
      tooltip: {
        shared: true,
        formatter: function() {
          // Add type assertion for 'this' to include points property
          const self = this as unknown as { x: string; points: Array<{ series: { name: string }; y: number }> };
          const points = self.points || [];
          let tooltip = `<b>${self.x}</b><br/>`;
          
          points.forEach(point => {
            const seriesName = point.series.name;
            const value = point.y;
            
            if (seriesName === 'Win Rate vs. Competitor') {
              tooltip += `${seriesName}: ${value!.toFixed(2)}%<br/>`;
            } else {
              tooltip += `${seriesName}: ${value}<br/>`;
            }
          });
          
          const competitor = headToHeadData.competitors.find(c => c.competitor === self.x);
          if (competitor) {
            tooltip += `<br/>Company Wins: ${competitor.company_wins}<br/>`;
            tooltip += `Competitor Wins: ${competitor.competitor_wins}<br/>`;
          }
          
          return tooltip;
        }
      },
      plotOptions: {
        column: {
          pointPadding: 0.2,
          borderWidth: 0
        }
      },
      series: [{
        name: 'Win Rate vs. Competitor',
        type: 'column',
        data: winRates,
        color: '#4285F4',
        yAxis: 0
      }, {
        name: 'Encounters',
        type: 'line',
        data: encounters,
        color: '#34A853',
        yAxis: 1
      }]
    };
  };

  return (
    <div className="company-win-rate-container">
      <div className="filter-container">
        <div className="filter-item">
          <label htmlFor="min-bids">Minimum Bids:</label>
          <input 
            type="number" 
            id="min-bids" 
            value={minBids} 
            onChange={handleMinBidsChange}
            min="1"
          />
        </div>
        
        <div className="filter-item">
          <label htmlFor="company-select">Select Company:</label>
          <select 
            id="company-select" 
            value={selectedCompany} 
            onChange={handleCompanyChange}
            disabled={loading || winRateData.length === 0}
          >
            {winRateData.map(company => (
              <option key={company.tin} value={company.tin}>
                {company.company} ({company.win_rate.toFixed(1)}% win rate)
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {loading ? (
        <div className="loading">Loading data...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : (
        <div className="charts-container">
          <div className="chart-wrapper">
            <HighchartsReact highcharts={Highcharts} options={getWinRateChartOptions()} />
          </div>
          
          <div className="chart-wrapper">
            <HighchartsReact highcharts={Highcharts} options={getHeadToHeadChartOptions()} />
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyWinRateChart;