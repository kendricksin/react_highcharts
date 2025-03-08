// src/components/CompanyWinRateChart.tsx
import React, { useState, useEffect } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

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

// Define tooltip formatter context
interface HighchartsTooltipFormatterContextObject {
  x: string;
  points: Array<{
    y: number;
    series: {
      name: string;
    };
  }>;
}

interface CompanyWinRateChartProps {
  data: CompanyWinRate[];
}

const CompanyWinRateChart: React.FC<CompanyWinRateChartProps> = ({ data }) => {
  const [chartOptions, setChartOptions] = useState<Highcharts.Options | null>(null);
  const [headToHeadChartOptions, setHeadToHeadChartOptions] = useState<Highcharts.Options | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [minBids, setMinBids] = useState<number>(3);
  const [filteredData, setFilteredData] = useState<CompanyWinRate[]>([]);

  // Process data based on minimum bids filter
  useEffect(() => {
    if (!data || data.length === 0) {
      setFilteredData([]);
      return;
    }

    const filtered = data
      .filter(company => company.total_bids >= minBids)
      .sort((a, b) => b.win_rate - a.win_rate);
    
    setFilteredData(filtered);

    if (filtered.length > 0 && !selectedCompany) {
      setSelectedCompany(filtered[0].tin);
    }
  }, [data, minBids]);

  // Create win rate chart
  useEffect(() => {
    if (!filteredData || filteredData.length === 0) {
      setChartOptions({
        title: { text: 'No win rate data available' }
      });
      return;
    }

    // Create chart configuration
    const chartOptions = getWinRateChartOptions(filteredData);
    setChartOptions(chartOptions);
  }, [filteredData]);

  // Update Head-to-Head chart when selected company changes
  useEffect(() => {
    if (!selectedCompany || filteredData.length === 0) {
      setHeadToHeadChartOptions({
        title: { text: 'No competitor data available' }
      });
      return;
    }

    // In a real implementation, you would fetch head-to-head data from an API
    // For now, create mock data based on the selected company
    const mockHeadToHeadData = createMockHeadToHeadData(selectedCompany);
    
    // Create chart configuration
    const chartOptions = getHeadToHeadChartOptions(mockHeadToHeadData);
    setHeadToHeadChartOptions(chartOptions);
  }, [selectedCompany, filteredData]);

  // Create mock head-to-head data (in a real app, this would come from an API)
  const createMockHeadToHeadData = (companyTin: string): HeadToHeadCompetitor[] => {
    const selectedCompanyData = filteredData.find(c => c.tin === companyTin);
    if (!selectedCompanyData) return [];

    // Generate mock competitors (in a real app, this would come from the API)
    return filteredData
      .filter(c => c.tin !== companyTin)
      .slice(0, 5)
      .map(competitor => {
        const encounters = Math.floor(Math.random() * 20) + 1;
        const companyWins = Math.floor(Math.random() * encounters);
        return {
          competitor_tin: competitor.tin,
          competitor: competitor.company,
          encounters,
          company_wins: companyWins,
          competitor_wins: encounters - companyWins,
          win_rate_vs_competitor: (companyWins / encounters) * 100
        };
      });
  };

  // Create win rate chart options
  const getWinRateChartOptions = (data: CompanyWinRate[]): Highcharts.Options => {
    const displayData = data.slice(0, 15);
    const companies = displayData.map(item => item.company);
    const winRates = displayData.map(item => item.win_rate);
    const bidCounts = displayData.map(item => item.total_bids);
    
    return {
      chart: {
        type: 'bar',
        height: 600
      },
      title: {
        text: 'Company Win Rates'
      },
      subtitle: {
        text: 'Based on Project Bid Data'
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
        formatter: function(): string {
          // Add type assertion for 'this' to include points property
          const self = this as unknown as HighchartsTooltipFormatterContextObject;
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
  const getHeadToHeadChartOptions = (headToHeadData: HeadToHeadCompetitor[]): Highcharts.Options => {
    if (!headToHeadData || headToHeadData.length === 0) {
      return {
        title: {
          text: 'No head-to-head data available'
        }
      };
    }
    
    const competitors = headToHeadData.map(item => item.competitor);
    const winRates = headToHeadData.map(item => item.win_rate_vs_competitor);
    const encounters = headToHeadData.map(item => item.encounters);
    
    const selectedCompanyInfo = filteredData.find(c => c.tin === selectedCompany);
    const companyName = selectedCompanyInfo ? selectedCompanyInfo.company : 'Selected Company';
    
    return {
      chart: {
        type: 'column',
        height: 400
      },
      title: {
        text: `${companyName}'s Performance vs. Competitors`
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
          const self = this as unknown as HighchartsTooltipFormatterContextObject;
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
          
          const competitor = headToHeadData.find(c => c.competitor === self.x);
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

  // Handle company selection change
  const handleCompanyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCompany(e.target.value);
  };

  // Handle min bids change
  const handleMinBidsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value > 0) {
      setMinBids(value);
    }
  };

  if (!chartOptions) {
    return <div className="loading">Preparing chart...</div>;
  }

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
          <label htmlFor="company-select">Select Company for Head-to-Head:</label>
          <select 
            id="company-select" 
            value={selectedCompany} 
            onChange={handleCompanyChange}
            disabled={filteredData.length === 0}
          >
            {filteredData.map(company => (
              <option key={company.tin} value={company.tin}>
                {company.company} ({company.win_rate.toFixed(1)}% win rate)
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="charts-container">
        <div className="chart-wrapper">
          <HighchartsReact highcharts={Highcharts} options={chartOptions} />
        </div>
        
        <div className="chart-wrapper">
          <HighchartsReact highcharts={Highcharts} options={headToHeadChartOptions || {}} />
        </div>
      </div>
    </div>
  );
};

export default CompanyWinRateChart;