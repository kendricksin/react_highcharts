import React, { useState } from 'react';
import CompanyWinRateChart from './CompanyWinRateChart';
import BiddingHistoryChart from './BiddingHistoryChart';
import ProjectsTable from './ProjectsTable';

interface CompanyData {
  tin: string;
  company: string;
  total_bids: number;
  wins: number;
  win_rate: number;
}

interface ProjectData {
  winner: string;
  project_name: string;
  sum_price_agree: number;
  transaction_date?: string;
  contract_date?: string;
}

interface CompanyOverviewProps {
  companyData: CompanyData | null;
  projectsData: ProjectData[];
  companyName: string;
  companyTin: string;
  onFindAdjacentCompanies: () => void;
}

const CompanyOverview: React.FC<CompanyOverviewProps> = ({
  companyData,
  projectsData,
  companyName,
  companyTin,
  onFindAdjacentCompanies
}) => {
  const [projectLimit, setProjectLimit] = useState<number>(10);

  // Handle project limit change
  const handleProjectLimitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setProjectLimit(parseInt(e.target.value, 10));
  };

  return (
    <>
      {/* Company info card */}
      <div className="company-info-panel">
        <h2 className="company-name">{companyName}</h2>
        <div className="company-stats">
          <div className="stat-item">
            <div className="stat-label">TIN</div>
            <div className="stat-value">{companyTin}</div>
          </div>
          {companyData && (
            <>
              <div className="stat-item">
                <div className="stat-label">Total Bids</div>
                <div className="stat-value">{companyData.total_bids}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Wins</div>
                <div className="stat-value">{companyData.wins}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Win Rate</div>
                <div className="stat-value">{companyData.win_rate.toFixed(1)}%</div>
              </div>
            </>
          )}
          <div className="stat-action">
            <button 
              onClick={onFindAdjacentCompanies}
              className="find-adjacent-button"
            >
              Find Competitors
            </button>
          </div>
        </div>
      </div>
      
      {/* Charts section */}
      <div className="charts-container">
        <div className="charts-grid">
          {companyData && (
            <div className="chart-wrapper win-rate-chart">
              <h3 className="chart-title">Bid Win Rate</h3>
              <CompanyWinRateChart 
                companyName={companyName}
                winRate={companyData.win_rate}
                totalBids={companyData.total_bids}
                wins={companyData.wins}
              />
              <div className="chart-footer">
                <p>Win rate for {companyName}</p>
              </div>
            </div>
          )}
          
          <div className="chart-wrapper history-chart">
            <div className="chart-header">
              <h3 className="chart-title">Project History</h3>
              <div className="chart-controls">
                <label htmlFor="project-limit">Show:</label>
                <select 
                  id="project-limit" 
                  value={projectLimit}
                  onChange={handleProjectLimitChange}
                  className="limit-select"
                >
                  <option value={5}>5 projects</option>
                  <option value={10}>10 projects</option>
                  <option value={15}>15 projects</option>
                  <option value={20}>20 projects</option>
                </select>
              </div>
            </div>
            <BiddingHistoryChart 
              projectsData={projectsData}
              companyName={companyName}
            />
          </div>
        </div>
      </div>
      
      {/* Projects table */}
      <ProjectsTable 
        projectsData={projectsData}
        limit={projectLimit}
        onLimitChange={handleProjectLimitChange}
      />
    </>
  );
};

export default CompanyOverview;