// src/components/CompanyDashboard.tsx
import React, { useState, useEffect } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import axios from 'axios';
import CompanySearch from './CompanySearch';
import { CompanyProject, HeadToHeadCompetitor, BidStrategyResponse } from '../types';

// Define tooltip formatter interface
interface HighchartsTooltipFormatterContextObject {
  x: string;
  points: Array<{
    series: { name: string };
    y: number;
  }>;
}

const CompanyDashboard: React.FC = () => {
  const [selectedCompanyTin, setSelectedCompanyTin] = useState<string>('');
  const [selectedCompanyName, setSelectedCompanyName] = useState<string>('');
  const [companyProjects, setCompanyProjects] = useState<CompanyProject[]>([]);
  const [headToHeadData, setHeadToHeadData] = useState<HeadToHeadCompetitor[]>([]);
  const [bidStrategy, setBidStrategy] = useState<BidStrategyResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Handle company selection from search
  const handleCompanySelect = (tin: string, companyName: string) => {
    setSelectedCompanyTin(tin);
    setSelectedCompanyName(companyName);
  };

  // Fetch all data for the selected company
  useEffect(() => {
    if (!selectedCompanyTin) return;

    const fetchCompanyData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch projects
        const projectsResponse = await axios.get<CompanyProject[]>(
          `http://localhost:8000/api/company-projects/${selectedCompanyTin}`
        );
        setCompanyProjects(projectsResponse.data);

        // Fetch head-to-head data
        const h2hResponse = await axios.get(
          `http://localhost:8000/api/head-to-head?company_tin=${selectedCompanyTin}`
        );
        setHeadToHeadData(h2hResponse.data.competitors);

        // Fetch bid strategy data
        const strategyResponse = await axios.get<BidStrategyResponse>(
          `http://localhost:8000/api/bid-strategy?company_tin=${selectedCompanyTin}`
        );
        setBidStrategy(strategyResponse.data);

        setLoading(false);
      } catch (err) {
        console.error('Error fetching company data:', err);
        setError('Failed to load company data. Please try again later.');
        setLoading(false);
      }
    };

    fetchCompanyData();
  }, [selectedCompanyTin]);

  // Chart options for company projects by year
  const getProjectsChartOptions = (): Highcharts.Options => {
    // Process data
    const projectsByYear = companyProjects.reduce((acc, project) => {
      const year = project.contract_date 
        ? new Date(project.contract_date).getFullYear() 
        : (project.transaction_date 
            ? new Date(project.transaction_date).getFullYear() 
            : 'Unknown');
      
      if (!acc[year]) {
        acc[year] = {
          count: 0,
          value: 0,
          projects: []
        };
      }
      
      acc[year].count += 1;
      acc[year].value += project.sum_price_agree;
      acc[year].projects.push(project);
      
      return acc;
    }, {} as Record<string | number, { count: number; value: number; projects: CompanyProject[] }>);

    const years = Object.keys(projectsByYear).sort();
    const values = years.map(year => projectsByYear[year].value);
    const counts = years.map(year => projectsByYear[year].count);

    return {
      chart: {
        type: 'column'
      },
      title: {
        text: `${selectedCompanyName} Projects by Year`
      },
      xAxis: {
        categories: years,
        title: {
          text: 'Year'
        }
      },
      yAxis: [{
        title: {
          text: 'Total Value (THB)'
        },
        labels: {
          formatter: function(): string {
            const value = this.value as number;
            if (value >= 1000000000) {
              return (value / 1000000000).toFixed(1) + 'B';
            } else if (value >= 1000000) {
              return (value / 1000000).toFixed(1) + 'M';
            } else if (value >= 1000) {
              return (value / 1000).toFixed(1) + 'K';
            }
            return value.toString();
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
          const self = this as unknown as HighchartsTooltipFormatterContextObject;
          const year = self.x;
          const yearData = projectsByYear[year];
          
          let tooltip = `<b>Year: ${year}</b><br/>`;
          tooltip += `Total Projects: ${yearData.count}<br/>`;
          tooltip += `Total Value: ${Highcharts.numberFormat(yearData.value, 0, '.', ',')} THB<br/><br/>`;
          
          if (yearData.projects.length > 0) {
            tooltip += '<b>Projects:</b><br/>';
            
            // Show up to 5 projects
            const projectsToShow = yearData.projects.slice(0, 5);
            projectsToShow.forEach(project => {
              tooltip += `• ${project.project_name.substring(0, 30)}${project.project_name.length > 30 ? '...' : ''}: `;
              tooltip += `${Highcharts.numberFormat(project.sum_price_agree, 0, '.', ',')} THB<br/>`;
            });
            
            if (yearData.projects.length > 5) {
              tooltip += `• ...and ${yearData.projects.length - 5} more projects<br/>`;
            }
          }
          
          return tooltip;
        }
      },
      series: [{
        name: 'Project Value',
        type: 'column',
        data: values,
        color: '#4285F4',
        yAxis: 0
      }, {
        name: 'Number of Projects',
        type: 'line',
        data: counts,
        yAxis: 1,
        color: '#EA4335'
      }]
    };
  };

  // Chart options for head-to-head competition
  const getHeadToHeadChartOptions = (): Highcharts.Options => {
    if (!headToHeadData || headToHeadData.length === 0) {
      return { title: { text: 'No head-to-head data available' } };
    }
    
    const competitors = headToHeadData.map(item => item.competitor);
    const winRates = headToHeadData.map(item => item.win_rate_vs_competitor);
    const encounters = headToHeadData.map(item => item.encounters);
    
    return {
      chart: {
        type: 'column'
      },
      title: {
        text: `${selectedCompanyName}'s Performance vs. Competitors`
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
        formatter: function(): string {
          const self = this as unknown as HighchartsTooltipFormatterContextObject;
          const competitor = headToHeadData.find(c => c.competitor === self.x);
          
          if (!competitor) return '';
          
          let tooltip = `<b>${competitor.competitor}</b><br/>`;
          tooltip += `Win Rate: ${competitor.win_rate_vs_competitor.toFixed(1)}%<br/>`;
          tooltip += `Encounters: ${competitor.encounters}<br/>`;
          tooltip += `Company Wins: ${competitor.company_wins}<br/>`;
          tooltip += `Competitor Wins: ${competitor.competitor_wins}<br/>`;
          
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

  // Chart options for bid strategy by department
  const getDepartmentChartOptions = (): Highcharts.Options => {
    if (!bidStrategy || !bidStrategy.department_analysis || bidStrategy.department_analysis.length === 0) {
      return { title: { text: 'No department data available' } };
    }
    
    const departments = bidStrategy.department_analysis.map(item => item.dept_name);
    const winRates = bidStrategy.department_analysis.map(item => item.win_rate);
    const bidCounts = bidStrategy.department_analysis.map(item => item.bids);
    
    return {
      chart: {
        type: 'column'
      },
      title: {
        text: `${selectedCompanyName}'s Performance by Department`
      },
      xAxis: {
        categories: departments,
        title: {
          text: 'Department'
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
          const self = this as unknown as HighchartsTooltipFormatterContextObject;
          const dept = bidStrategy?.department_analysis.find(d => d.dept_name === self.x);
          
          if (!dept) return '';
          
          let tooltip = `<b>${dept.dept_name}</b><br/>`;
          tooltip += `Win Rate: ${dept.win_rate.toFixed(1)}%<br/>`;
          tooltip += `Bids: ${dept.bids}<br/>`;
          tooltip += `Wins: ${dept.wins}<br/>`;
          tooltip += `Avg. Bid Ratio: ${dept.avg_bid_ratio.toFixed(3)}<br/>`;
          
          return tooltip;
        }
      },
      series: [{
        name: 'Win Rate',
        type: 'column',
        data: winRates,
        color: '#4285F4',
        yAxis: 0
      }, {
        name: 'Number of Bids',
        type: 'line',
        data: bidCounts,
        yAxis: 1,
        color: '#FBBC05'
      }]
    };
  };

  return (
    <div className="company-dashboard">
      <div className="dashboard-header">
        <CompanySearch onCompanySelect={handleCompanySelect} />
      </div>
      
      {selectedCompanyTin ? (
        loading ? (
          <div className="loading">Loading company data...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : (
          <div className="dashboard-content">
            <div className="company-info-panel">
              <h2>{selectedCompanyName}</h2>
              <div className="company-stats">
                <div className="stat-item">
                  <span className="stat-label">Projects:</span>
                  <span className="stat-value">{companyProjects.length}</span>
                </div>
                {bidStrategy && (
                  <>
                    <div className="stat-item">
                      <span className="stat-label">Win Rate:</span>
                      <span className="stat-value">{(bidStrategy.bid_ratio_stats.avg_winning_bid_ratio || 0).toFixed(1)}%</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Total Value:</span>
                      <span className="stat-value">
                        {Highcharts.numberFormat(companyProjects.reduce((sum, p) => sum + p.sum_price_agree, 0), 0, '.', ',')} THB
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            <div className="charts-grid">
              <div className="chart-container">
                <HighchartsReact highcharts={Highcharts} options={getProjectsChartOptions()} />
              </div>
              
              <div className="chart-container">
                <HighchartsReact highcharts={Highcharts} options={getHeadToHeadChartOptions()} />
              </div>
              
              <div className="chart-container">
                <HighchartsReact highcharts={Highcharts} options={getDepartmentChartOptions()} />
              </div>
            </div>
            
            {bidStrategy && (
              <div className="bid-strategy-panel">
                <h3>Bid Strategy Analysis</h3>
                <div className="bid-ratio-stats">
                  <div className="stat-group">
                    <div className="stat-item">
                      <span className="stat-label">Average Bid Ratio:</span>
                      <span className="stat-value">{bidStrategy.bid_ratio_stats.avg_bid_ratio.toFixed(3)}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Minimum Bid Ratio:</span>
                      <span className="stat-value">{bidStrategy.bid_ratio_stats.min_bid_ratio.toFixed(3)}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Maximum Bid Ratio:</span>
                      <span className="stat-value">{bidStrategy.bid_ratio_stats.max_bid_ratio.toFixed(3)}</span>
                    </div>
                  </div>
                  
                  <div className="stat-group">
                    <div className="stat-item">
                      <span className="stat-label">Winning Bid Ratio:</span>
                      <span className="stat-value">
                        {bidStrategy.bid_ratio_stats.avg_winning_bid_ratio 
                          ? bidStrategy.bid_ratio_stats.avg_winning_bid_ratio.toFixed(3) 
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Losing Bid Ratio:</span>
                      <span className="stat-value">
                        {bidStrategy.bid_ratio_stats.avg_losing_bid_ratio 
                          ? bidStrategy.bid_ratio_stats.avg_losing_bid_ratio.toFixed(3) 
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Market Percentile:</span>
                      <span className="stat-value">
                        {bidStrategy.bid_ratio_stats.percentile 
                          ? `${bidStrategy.bid_ratio_stats.percentile.toFixed(1)}%` 
                          : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {companyProjects.length > 0 && (
              <div className="projects-table-panel">
                <h3>Recent Projects</h3>
                <table className="projects-table">
                  <thead>
                    <tr>
                      <th>Project Name</th>
                      <th>Value (THB)</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companyProjects.slice(0, 10).map((project, index) => (
                      <tr key={index}>
                        <td>{project.project_name}</td>
                        <td className="value-cell">{Highcharts.numberFormat(project.sum_price_agree, 0, '.', ',')}</td>
                        <td>{project.contract_date || project.transaction_date || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {companyProjects.length > 10 && (
                  <div className="table-footer">
                    Showing 10 of {companyProjects.length} projects
                  </div>
                )}
              </div>
            )}
          </div>
        )
      ) : (
        <div className="dashboard-placeholder">
          <div className="placeholder-message">
            <h3>Search for a company to view detailed analysis</h3>
            <p>Enter a company name or tax identification number (TIN) in the search bar above.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyDashboard;