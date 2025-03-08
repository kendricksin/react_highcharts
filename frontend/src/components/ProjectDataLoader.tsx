// src/components/ProjectDataLoader.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CompanySearch from './CompanySearch';
import CompanyProjectsChart from './CompanyProjectsChart';
import CompanyWinRateChart from './CompanyWinRateChart';
import MonthlyAnalysisChart from './MonthlyAnalysisChart';

// Define interfaces for the data
interface ProjectData {
  month: string;
  year: number;
  total_sum_price_agree: number;
  count: number;
}

interface CompanyProject {
  winner: string;
  project_name: string;
  sum_price_agree: number;
  transaction_date?: string;
  contract_date?: string;
  project_id?: string | number;
}

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

// Define bidder interface
interface Bidder {
  tin: string;
  company: string;
  project_id: string | number;
}

// Component props
interface ProjectDataLoaderProps {
  activeChart: 'monthly' | 'companies' | 'winrates' | 'dashboard';
}

const ProjectDataLoader: React.FC<ProjectDataLoaderProps> = ({ activeChart }) => {
  // State for selected company and data
  const [selectedCompanyTin, setSelectedCompanyTin] = useState<string>('');
  const [selectedCompanyName, setSelectedCompanyName] = useState<string>('');
  const [projects, setProjects] = useState<CompanyProject[]>([]);
  const [competitors, setCompetitors] = useState<string[]>([]);
  const [monthlyData, setMonthlyData] = useState<ProjectData[]>([]);
  const [topCompanies, setTopCompanies] = useState<CompanyProject[]>([]);
  const [winRates, setWinRates] = useState<CompanyWinRate[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [apiDetails, setApiDetails] = useState<Record<string, any>>({});

  // Logger function
  const logInfo = (message: string, data?: any) => {
    console.log(`[ProjectDataLoader] ${message}`, data || '');
    // Add to API details for debugging in UI
    setApiDetails(prev => ({
      ...prev,
      [message]: data || 'No data'
    }));
  };

  // Handle company selection from search
  const handleCompanySelect = (tin: string, companyName: string) => {
    logInfo(`Company selected: ${companyName} (${tin})`);
    setSelectedCompanyTin(tin);
    setSelectedCompanyName(companyName);
  };

  // Fetch all projects that the company bid in
  useEffect(() => {
    if (!selectedCompanyTin) return;

    const fetchCompanyBids = async () => {
      setLoading(true);
      setError(null);

      try {
        // Get projects where the company participated in bidding
        logInfo(`Fetching projects for company: ${selectedCompanyTin}`);
        const response = await axios.get(
          `http://localhost:8000/api/company-projects/${selectedCompanyTin}`
        );
        
        logInfo(`Received ${response.data.length} projects`);
        setProjects(response.data);
        
        // Extract project IDs to find competitors
        const projectIds = response.data
          .map((project: CompanyProject) => project.project_id)
          .filter(Boolean);
        
        logInfo(`Extracted ${projectIds.length} project IDs`, projectIds);
        
        if (projectIds.length === 0) {
          logInfo('No project IDs found, cannot fetch competitors');
          setError('No projects found for this company. Cannot load competitor data.');
          setLoading(false);
          return;
        }
        
        await fetchCompetitors(projectIds);
        
        setLoading(false);
      } catch (err: any) {
        const errorMessage = err.response?.data?.detail || err.message || 'Unknown error';
        logInfo(`Error fetching bids: ${errorMessage}`, err);
        setError(`Failed to load company bid data: ${errorMessage}`);
        setLoading(false);
      }
    };

    fetchCompanyBids();
  }, [selectedCompanyTin]);

  // Fetch competitors for the projects
  const fetchCompetitors = async (projectIds: Array<string | number>) => {
    if (!projectIds.length) return;
    
    try {
      logInfo(`Fetching bidders for ${projectIds.length} projects`);
      
      // This would be a custom endpoint to get all companies who bid on these projects
      const response = await axios.get<Bidder[]>(
        `http://localhost:8000/api/project-bidders`, 
        { params: { project_ids: projectIds.join(',') } }
      );
      
      logInfo(`Received ${response.data.length} bidders`);
      
      // Extract unique competitor TINs - with proper type casting
      const bidderTins = response.data.map(bidder => bidder.tin);
      const uniqueTinsSet = new Set(bidderTins);
      const competitorTins = Array.from(uniqueTinsSet) as string[];
      
      logInfo(`Found ${competitorTins.length} unique competitor TINs`, competitorTins);
      setCompetitors(competitorTins);
      
      // Now fetch all projects for these companies
      const allTins = [...competitorTins];
      
      // Only add the selected company if it's not already in the list
      if (!competitorTins.includes(selectedCompanyTin)) {
        allTins.push(selectedCompanyTin);
      }
      
      logInfo(`Fetching projects for ${allTins.length} companies (including selected company)`);
      await fetchAllProjects(allTins);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Unknown error';
      logInfo(`Error fetching competitors: ${errorMessage}`, err);
      setError(`Failed to load competitor data: ${errorMessage}`);
    }
  };

  // Fetch all projects for the company and its competitors
  const fetchAllProjects = async (tins: string[]) => {
    if (!tins.length) return;
    
    try {
      logInfo(`Fetching all projects for ${tins.length} companies`);
      
      // This would be a custom endpoint to get all projects for these companies
      const response = await axios.get<CompanyProject[]>(
        `http://localhost:8000/api/company-projects-bulk`,
        { params: { tins: tins.join(',') } }
      );
      
      logInfo(`Received ${response.data.length} projects total`);
      const allProjects = response.data;
      
      // Check if we have any projects
      if (allProjects.length === 0) {
        logInfo('No projects found for these companies');
        setError('No projects found for the company and its competitors.');
        return;
      }
      
      // Process data for different chart views
      logInfo('Processing data for monthly chart');
      processMonthlyData(allProjects);
      
      logInfo('Processing data for top companies chart');
      processTopCompanies(allProjects);
      
      // Fetch win rates data separately
      logInfo('Fetching win rates');
      await fetchWinRates(tins);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Unknown error';
      logInfo(`Error fetching all projects: ${errorMessage}`, err);
      setError(`Failed to load project data for visualization: ${errorMessage}`);
    }
  };

  // Fetch win rates for companies
  const fetchWinRates = async (tins: string[]) => {
    try {
      logInfo(`Fetching win rates for ${tins.length} companies`);
      
      const response = await axios.get<CompanyWinRate[]>(
        `http://localhost:8000/api/filtered-win-rates`,
        { params: { tins: tins.join(',') } }
      );
      
      logInfo(`Received win rates for ${response.data.length} companies`);
      setWinRates(response.data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Unknown error';
      logInfo(`Error fetching win rates: ${errorMessage}`, err);
      // Don't set error state here, as we don't want to block the other visualizations
      // Just set empty win rates
      setWinRates([]);
    }
  };

  // Process data for Monthly Analysis chart
  const processMonthlyData = (projects: CompanyProject[]) => {
    // Group projects by month and year
    const monthlyMap: Record<string, { total: number, count: number }> = {};
    
    projects.forEach(project => {
      // Use contract_date if available, otherwise transaction_date
      const date = project.contract_date ? new Date(project.contract_date) : 
                  (project.transaction_date ? new Date(project.transaction_date) : null);
      
      if (date) {
        const year = date.getFullYear();
        const month = date.toLocaleString('default', { month: 'long' });
        const key = `${month}-${year}`;
        
        if (!monthlyMap[key]) {
          monthlyMap[key] = { total: 0, count: 0 };
        }
        
        monthlyMap[key].total += project.sum_price_agree;
        monthlyMap[key].count += 1;
      }
    });
    
    // Convert to array for chart
    const monthlyDataArray = Object.entries(monthlyMap).map(([key, data]) => {
      const [month, yearStr] = key.split('-');
      return {
        month,
        year: parseInt(yearStr),
        total_sum_price_agree: data.total,
        count: data.count
      };
    });
    
    // Sort by year and month
    monthlyDataArray.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];
      return months.indexOf(a.month) - months.indexOf(b.month);
    });
    
    logInfo(`Processed ${monthlyDataArray.length} monthly data points`);
    setMonthlyData(monthlyDataArray);
  };

  // Process data for Top Companies chart
  const processTopCompanies = (projects: CompanyProject[]) => {
    // Group projects by company
    const companyProjects: Record<string, CompanyProject[]> = {};
    
    projects.forEach(project => {
      const company = project.winner;
      if (!company) return;
      
      if (!companyProjects[company]) {
        companyProjects[company] = [];
      }
      
      companyProjects[company].push(project);
    });
    
    // Calculate total value for each company
    const companyTotals = Object.entries(companyProjects)
      .map(([company, projects]) => ({
        company,
        total: projects.reduce((sum, p) => sum + p.sum_price_agree, 0),
        projects
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 20);  // Top 20
    
    logInfo(`Found ${companyTotals.length} companies for top companies chart`);
    
    // Flatten the projects for the chart
    const topCompanyProjects = companyTotals.flatMap(item => item.projects);
    
    logInfo(`Processed ${topCompanyProjects.length} projects for top companies chart`);
    setTopCompanies(topCompanyProjects);
  };

  // Render the appropriate chart based on activeChart prop
  const renderActiveChart = () => {
    if (loading) {
      return <div className="loading">Loading data...</div>;
    }
    
    if (error) {
      return (
        <div className="error">
          <h3>Error</h3>
          <p>{error}</p>
          <div className="api-logs">
            <h4>API Request Logs</h4>
            <pre>{JSON.stringify(apiDetails, null, 2)}</pre>
          </div>
        </div>
      );
    }
    
    if (!selectedCompanyTin) {
      return (
        <div className="placeholder-message">
          <h3>Search for a company to view filtered data</h3>
          <p>Enter a company name or tax identification number (TIN) in the search bar above.</p>
        </div>
      );
    }
    
    // Check if we have data for the requested chart
    const hasMonthlyData = monthlyData.length > 0;
    const hasTopCompaniesData = topCompanies.length > 0;
    const hasWinRatesData = winRates.length > 0;
    
    logInfo(`Chart data status: Monthly=${hasMonthlyData}, TopCompanies=${hasTopCompaniesData}, WinRates=${hasWinRatesData}`);
    
    // Render the appropriate chart based on activeChart
    switch (activeChart) {
      case 'monthly':
        return hasMonthlyData ? (
          <MonthlyAnalysisChart data={monthlyData} />
        ) : (
          <div className="no-data">
            <h3>No Monthly Data Available</h3>
            <p>There is no monthly project data to display for this selection.</p>
            <div className="api-logs">
              <h4>API Request Logs</h4>
              <pre>{JSON.stringify(apiDetails, null, 2)}</pre>
            </div>
          </div>
        );
      
      case 'companies':
        return hasTopCompaniesData ? (
          <CompanyProjectsChart data={topCompanies} />
        ) : (
          <div className="no-data">
            <h3>No Company Data Available</h3>
            <p>There is no company project data to display for this selection.</p>
            <div className="api-logs">
              <h4>API Request Logs</h4>
              <pre>{JSON.stringify(apiDetails, null, 2)}</pre>
            </div>
          </div>
        );
      
      case 'winrates':
        return hasWinRatesData ? (
          <CompanyWinRateChart data={winRates} />
        ) : (
          <div className="no-data">
            <h3>No Win Rate Data Available</h3>
            <p>There is no win rate data to display for this selection.</p>
            <div className="api-logs">
              <h4>API Request Logs</h4>
              <pre>{JSON.stringify(apiDetails, null, 2)}</pre>
            </div>
          </div>
        );
      
      default:
        return <div>Select a chart type to view data</div>;
    }
  };

  return (
    <div className="project-data-loader">
      <div className="search-container">
        <CompanySearch onCompanySelect={handleCompanySelect} />
        {selectedCompanyName && (
          <div className="selected-company">
            <h3>Selected Company: {selectedCompanyName}</h3>
          </div>
        )}
      </div>
      
      {renderActiveChart()}
    </div>
  );
};

export default ProjectDataLoader;