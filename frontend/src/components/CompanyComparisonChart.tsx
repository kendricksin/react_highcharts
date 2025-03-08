import React, { useEffect, useState } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

interface CompanyData {
  tin: string;
  company: string;
  total_bids: number;
  wins: number;
  win_rate: number;
}

interface CompanyComparisonChartProps {
  companies: CompanyData[];
  mainCompanyTin: string;
}

const CompanyComparisonChart: React.FC<CompanyComparisonChartProps> = ({ 
  companies, 
  mainCompanyTin 
}) => {
  const [chartOptions, setChartOptions] = useState<Highcharts.Options>({});
  const [chartType, setChartType] = useState<'win-rate' | 'total-bids' | 'wins'>('win-rate');

  useEffect(() => {
    if (!companies || companies.length === 0) {
      setChartOptions({
        title: { text: 'No company data available for comparison' }
      });
      return;
    }

    const sortedCompanies = [...companies].sort((a, b) => {
      // Put main company first, then sort by relevant metric
      if (a.tin === mainCompanyTin) return -1;
      if (b.tin === mainCompanyTin) return 1;
      
      if (chartType === 'win-rate') {
        return b.win_rate - a.win_rate;
      } else if (chartType === 'total-bids') {
        return b.total_bids - a.total_bids;
      } else {
        return b.wins - a.wins;
      }
    });

    // Limit to top 10 for readability
    const limitedCompanies = sortedCompanies.slice(0, 10);
    
    // Prepare data for chart
    const companyNames = limitedCompanies.map(company => {
      const name = company.company;
      // Truncate long names and add marker for main company
      const displayName = (name.length > 20 ? name.substring(0, 17) + '...' : name) +
                          (company.tin === mainCompanyTin ? ' ★' : '');
      return displayName;
    });
    
    let values: number[] = [];
    let chartTitle = '';
    
    // Set values and title based on chart type
    if (chartType === 'win-rate') {
      values = limitedCompanies.map(company => company.win_rate);
      chartTitle = 'Company Win Rate Comparison';
    } else if (chartType === 'total-bids') {
      values = limitedCompanies.map(company => company.total_bids);
      chartTitle = 'Total Bids Comparison';
    } else {
      values = limitedCompanies.map(company => company.wins);
      chartTitle = 'Total Wins Comparison';
    }
    
    // Create colors with main company highlighted
    const colors = limitedCompanies.map(company => 
      company.tin === mainCompanyTin ? '#4A7AFF' : '#94A3B8'
    );
    
    const options: Highcharts.Options = {
      chart: {
        type: 'bar',
        height: 400
      },
      title: {
        text: chartTitle,
        style: {
          fontSize: '16px'
        }
      },
      xAxis: {
        categories: companyNames,
        title: {
          text: null
        }
      },
      yAxis: {
        title: {
          text: chartType === 'win-rate' ? 'Win Rate (%)' : 'Count',
          align: 'high'
        },
        labels: {
          formatter: function() {
            return chartType === 'win-rate' 
              ? `${this.value}%` 
              : Highcharts.numberFormat(this.value as number, 0, '.', ',');
          }
        }
      },
      tooltip: {
        formatter: function() {
          // Get the point index safely
          const index = this.index !== undefined ? this.index : 0;
          const company = limitedCompanies[index];
                      
          return `<b>${company.company}</b><br/>
                 ${chartType === 'win-rate' ? 'Win Rate' : chartType === 'total-bids' ? 'Total Bids' : 'Wins'}: 
                 ${chartType === 'win-rate' ? `${company.win_rate}%` : this.y}<br/>
                 TIN: ${company.tin}`;
        }
      },
      plotOptions: {
        bar: {
          dataLabels: {
            enabled: true,
            formatter: function() {
              return chartType === 'win-rate' 
                ? `${this.y}%` 
                : this.y?.toString();
            }
          },
          colorByPoint: true,
          colors: colors
        }
      },
      legend: {
        enabled: false
      },
      credits: {
        enabled: false
      },
      series: [{
        name: chartType === 'win-rate' ? 'Win Rate' : chartType === 'total-bids' ? 'Total Bids' : 'Wins',
        type: 'bar',
        data: values
      }]
    };
    
    setChartOptions(options);
  }, [companies, mainCompanyTin, chartType]);
  
  const handleChartTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setChartType(e.target.value as 'win-rate' | 'total-bids' | 'wins');
  };

  if (!companies || companies.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-4 flex justify-center items-center h-64">
        <p className="text-gray-500">No company data available for comparison</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Company Comparison</h3>
        <div className="flex items-center">
          <label htmlFor="chart-type-select" className="mr-2 text-sm">Compare:</label>
          <select 
            id="chart-type-select"
            value={chartType}
            onChange={handleChartTypeChange}
            className="border rounded p-1 text-sm"
          >
            <option value="win-rate">Win Rate</option>
            <option value="total-bids">Total Bids</option>
            <option value="wins">Wins</option>
          </select>
        </div>
      </div>
      <HighchartsReact highcharts={Highcharts} options={chartOptions} />
      <p className="text-sm text-gray-500 mt-2">★ Indicates main company</p>
    </div>
  );
};

export default CompanyComparisonChart;