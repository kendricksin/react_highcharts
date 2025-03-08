import React, { useState, useEffect } from 'react';
import CompanySearch from './CompanySearch';
import CompanyWinRateChart from './CompanyWinRateChart';
import BiddingHistoryChart from './BiddingHistoryChart';
import AdjacentCompaniesCard from './AdjacentCompaniesCard';

interface CompanyData {
  tin: string;
  company: string;
  total_bids: number;
  wins: number;
  win_rate: number;
}

interface AdjacentCompany {
  tin: string;
  company: string;
  common_bids: number;
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

const CompanyDashboard: React.FC = () => {
  const [selectedCompanyTin, setSelectedCompanyTin] = useState<string>('');
  const [selectedCompanyName, setSelectedCompanyName] = useState<string>('');
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [projectsData, setProjectsData] = useState<ProjectData[]>([]);
  const [adjacentCompanies, setAdjacentCompanies] = useState<AdjacentCompany[]>([]);
  const [selectedAdjacentTins, setSelectedAdjacentTins] = useState<string[]>([]);
  const [showingAdjacent, setShowingAdjacent] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [projectLimit, setProjectLimit] = useState<number>(10);
  const [sortBy, setSortBy] = useState<string>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Fetch company data
  useEffect(() => {
    if (!selectedCompanyTin) return;

    const fetchCompanyData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch company data
        const response = await fetch(`http://localhost:8000/api/search-companies?query=${selectedCompanyTin}`);
        const data = await response.json();
        
        if (data && data.length > 0) {
          // Find the exact match
          const matchedCompany = data.find((c: any) => c.tin === selectedCompanyTin);
          if (matchedCompany) {
            setCompanyData(matchedCompany);
          }
        }
        
        // Fetch company projects
        const projectsResponse = await fetch(`http://localhost:8000/api/company-projects/${selectedCompanyTin}`);
        const projectsData = await projectsResponse.json();
        setProjectsData(projectsData || []);
        
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching company data:', err);
        setError('Failed to load company data');
        setLoading(false);
      }
    };

    fetchCompanyData();
  }, [selectedCompanyTin]);

  // Handle company selection from search
  const handleCompanySelect = (tin: string, companyName: string) => {
    setSelectedCompanyTin(tin);
    setSelectedCompanyName(companyName);
    setShowingAdjacent(false);
    setAdjacentCompanies([]);
    setSelectedAdjacentTins([]);
  };

  // Find adjacent companies
  const handleFindAdjacentCompanies = async () => {
    if (!selectedCompanyTin) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch adjacent companies
      const response = await fetch(`http://localhost:8000/api/adjacent-companies/${selectedCompanyTin}`);
      const data = await response.json();
      
      setAdjacentCompanies(data || []);
      setShowingAdjacent(true);
      setLoading(false);
    } catch (err: any) {
      console.error('Error finding adjacent companies:', err);
      setError('Failed to find adjacent companies');
      setLoading(false);
    }
  };

  // Handle selection change in adjacent companies
  const handleAdjacentSelectionChange = (selectedTins: string[]) => {
    setSelectedAdjacentTins(selectedTins);
    console.log('Selected companies:', selectedTins);
  };

  // Return to main company view
  const handleBackToMainCompany = () => {
    setShowingAdjacent(false);
  };

  // Handle project limit change
  const handleProjectLimitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setProjectLimit(parseInt(e.target.value, 10));
  };

  // Handle sort change
  const handleSortChange = (column: string) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('desc');
    }
  };

  // Sort projects
  const sortedProjects = [...projectsData].sort((a, b) => {
    if (sortBy === 'value') {
      return sortDirection === 'asc' 
        ? a.sum_price_agree - b.sum_price_agree 
        : b.sum_price_agree - a.sum_price_agree;
    } else if (sortBy === 'date') {
      const dateA = a.contract_date ? new Date(a.contract_date) : a.transaction_date ? new Date(a.transaction_date) : new Date(0);
      const dateB = b.contract_date ? new Date(b.contract_date) : b.transaction_date ? new Date(b.transaction_date) : new Date(0);
      return sortDirection === 'asc' 
        ? dateA.getTime() - dateB.getTime() 
        : dateB.getTime() - dateA.getTime();
    } else {
      return 0;
    }
  });

  // Format the date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format the value
  const formatValue = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(2)}M THB`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(2)}K THB`;
    } else {
      return `${value.toFixed(2)} THB`;
    }
  };

  return (
    <div className="company-dashboard">
      {/* Page title */}
      <div className="dashboard-header">
        <h1 className="dashboard-title">Thai Project Agreements Dashboard</h1>
      </div>

      {/* Company search section */}
      <div className="search-container">
        <CompanySearch onCompanySelect={handleCompanySelect} />
      </div>
      
      {/* Main content */}
      <div className="dashboard-content">
        {loading ? (
          <div className="loading">
            <p>Loading data...</p>
          </div>
        ) : error ? (
          <div className="error">
            <p>{error}</p>
          </div>
        ) : selectedCompanyTin && !showingAdjacent ? (
          <>
            {/* Company info card */}
            <div className="company-info-panel">
              <h2 className="company-name">{selectedCompanyName}</h2>
              <div className="company-stats">
                <div className="stat-item">
                  <div className="stat-label">TIN</div>
                  <div className="stat-value">{selectedCompanyTin}</div>
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
                    onClick={handleFindAdjacentCompanies}
                    className="find-adjacent-button"
                    disabled={loading}
                  >
                    {loading ? 'Loading...' : 'Find Adjacent Companies'}
                  </button>
                </div>
              </div>
            </div>
            
            {/* Charts section - using a better grid layout */}
            <div className="charts-container">
              <div className="charts-grid">
                {companyData && (
                  <div className="chart-wrapper win-rate-chart">
                    <h3 className="chart-title">Bid Win Rate</h3>
                    <CompanyWinRateChart 
                      companyName={selectedCompanyName}
                      winRate={companyData.win_rate}
                      totalBids={companyData.total_bids}
                      wins={companyData.wins}
                    />
                    <div className="chart-footer">
                      <p>Win rate for {selectedCompanyName}</p>
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
                    companyName={selectedCompanyName}
                  />
                </div>
              </div>
            </div>
            
            {/* Projects table - now with enhanced interactive features */}
            <div className="projects-table-panel">
              <div className="table-header">
                <h3 className="table-title">Recent Projects</h3>
                <div className="table-controls">
                  <label htmlFor="table-sort">Sort by:</label>
                  <select 
                    id="table-sort"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="sort-select"
                  >
                    <option value="date">Date</option>
                    <option value="value">Value</option>
                  </select>
                  <button 
                    onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                    className="sort-direction-button"
                    title={`Sort ${sortDirection === 'asc' ? 'Ascending' : 'Descending'}`}
                  >
                    {sortDirection === 'asc' ? '↑' : '↓'}
                  </button>
                </div>
              </div>
              <div className="table-container">
                <table className="projects-table">
                  <thead>
                    <tr>
                      <th className="project-name-column">Project Name</th>
                      <th 
                        className={`value-column ${sortBy === 'value' ? 'active-sort' : ''}`}
                        onClick={() => handleSortChange('value')}
                      >
                        Value {sortBy === 'value' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      <th 
                        className={`date-column ${sortBy === 'date' ? 'active-sort' : ''}`}
                        onClick={() => handleSortChange('date')}
                      >
                        Date {sortBy === 'date' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedProjects.slice(0, projectLimit).map((project, index) => (
                      <tr key={index} className="project-row">
                        <td className="project-name">
                          <div className="project-name-text">{project.project_name}</div>
                        </td>
                        <td className="value-cell">
                          <div className="value-text">{formatValue(project.sum_price_agree)}</div>
                        </td>
                        <td className="date-cell">
                          <div className="date-text">
                            {formatDate(project.contract_date || project.transaction_date)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {projectsData.length > projectLimit && (
                <div className="table-footer">
                  <p>Showing {projectLimit} of {projectsData.length} projects</p>
                </div>
              )}
            </div>
          </>
        ) : showingAdjacent ? (
          <AdjacentCompaniesCard
            companies={adjacentCompanies}
            onCompanySelect={handleCompanySelect}
            onSelectionChange={handleAdjacentSelectionChange}
            mainCompanyName={selectedCompanyName}
            onBackToMainCompany={handleBackToMainCompany}
          />
        ) : (
          <div className="dashboard-placeholder">
            <div className="placeholder-message">
              <h3>Welcome to Thai Project Tracker</h3>
              <p>
                Search for a company above to view detailed analytics and find related companies.
                This dashboard provides insights into government project agreements, including win rates,
                project history, and connections between companies.
              </p>
            </div>
          </div>
        )}
      </div>
      
      <div className="dashboard-footer">
        <p>Data visualization created with React and Highcharts</p>
      </div>
    </div>
  );
};

export default CompanyDashboard;