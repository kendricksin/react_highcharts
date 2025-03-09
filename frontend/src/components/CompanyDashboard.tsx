import React, { useState, useEffect } from 'react';
import CompanySearch from './CompanySearch';
import CompanyOverview from './CompanyOverview';
import CompetitorsView from './CompetitorsView';
import CompetitorAnalysis from './CompetitorAnalysis';
import TabNavigation, { TabId } from './TabNavigation';
import api from '../services/api';

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
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [selectedCompanyTin, setSelectedCompanyTin] = useState<string>('');
  const [selectedCompanyName, setSelectedCompanyName] = useState<string>('');
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [projectsData, setProjectsData] = useState<ProjectData[]>([]);
  const [adjacentCompanies, setAdjacentCompanies] = useState<AdjacentCompany[]>([]);
  const [selectedAdjacentTins, setSelectedAdjacentTins] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisData, setAnalysisData] = useState<any[]>([]);
  const [isAnalysisLoading, setIsAnalysisLoading] = useState<boolean>(false);

  // Fetch company data
  useEffect(() => {
    if (!selectedCompanyTin) return;

    const fetchCompanyData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch company data
        const response = await api.searchCompanies(selectedCompanyTin);
        const data = await response.json();
        
        if (data && data.length > 0) {
          // Find the exact match
          const matchedCompany = data.find((c: any) => c.tin === selectedCompanyTin);
          if (matchedCompany) {
            setCompanyData(matchedCompany);
          }
        }
        
        // Fetch company projects
        const projectsResponse = await api.getCompanyProjectsByTin(selectedCompanyTin);
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
    setAdjacentCompanies([]);
    setSelectedAdjacentTins([]);
    setActiveTab('overview');
  };

  // Find adjacent companies
  const handleFindAdjacentCompanies = async () => {
    if (!selectedCompanyTin) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch adjacent companies
      const response = await api.getAdjacentCompanies(selectedCompanyTin);
      const data = await response.json();
      
      setAdjacentCompanies(data || []);
      setActiveTab('competitors');
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
  };

  // Handle analyze competitors
  const handleAnalyzeCompetitors = async () => {
    if (selectedAdjacentTins.length === 0) return;
    
    setIsAnalysisLoading(true);
    setError(null);
    
    try {
      // Include the main company TIN plus all selected adjacent company TINs
      const allCompanyTins = [selectedCompanyTin, ...selectedAdjacentTins];
      
      // Use API service to call the endpoint
      const response = await api.analyzeCompanyBids(allCompanyTins);
      
      // Set the analysis data for the component to use
      setAnalysisData(response.data);
      
      // Switch to analysis tab
      setActiveTab('analysis');
      setIsAnalysisLoading(false);
    } catch (err: any) {
      console.error('Error analyzing competitors:', err);
      const errorMessage = err.response?.data?.detail || err.message || 'Error analyzing competitors';
      setError(errorMessage);
      setIsAnalysisLoading(false);
    }
  };

  // Available tabs configuration
  const tabs = [
    { id: 'overview' as TabId, label: 'Overview' },
    { 
      id: 'competitors' as TabId, 
      label: 'Competitors', 
      disabled: !selectedCompanyTin
    },
    { 
      id: 'analysis' as TabId, 
      label: 'Analysis', 
      disabled: selectedAdjacentTins.length === 0
    }
  ];

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
      
      {/* Tab navigation */}
      {selectedCompanyTin && (
        <div className="tabs-container">
          <TabNavigation
            activeTab={activeTab}
            onTabChange={setActiveTab}
            tabs={tabs}
          />
        </div>
      )}
      
      {/* Main content based on active tab */}
      <div className="dashboard-content">
        {loading ? (
          <div className="loading">
            <p>Loading data...</p>
          </div>
        ) : error ? (
          <div className="error">
            <p>{error}</p>
          </div>
        ) : !selectedCompanyTin ? (
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
        ) : activeTab === 'overview' ? (
          <CompanyOverview
            companyData={companyData}
            projectsData={projectsData}
            companyName={selectedCompanyName}
            companyTin={selectedCompanyTin}
            onFindAdjacentCompanies={handleFindAdjacentCompanies}
          />
        ) : activeTab === 'competitors' ? (
          <CompetitorsView
            adjacentCompanies={adjacentCompanies}
            mainCompanyName={selectedCompanyName}
            onCompanySelect={handleCompanySelect}
            onSelectionChange={handleAdjacentSelectionChange}
            selectedTins={selectedAdjacentTins}
            onAnalyzeCompetitors={handleAnalyzeCompetitors}
            isAnalysisLoading={isAnalysisLoading}
          />
        ) : activeTab === 'analysis' ? (
          <CompetitorAnalysis
            analysisData={analysisData}
            mainCompanyName={selectedCompanyName}
            mainCompanyTin={selectedCompanyTin}
            competitors={adjacentCompanies.filter(company => 
              selectedAdjacentTins.includes(company.tin)
            )}
          />
        ) : null}
      </div>
      
      <div className="dashboard-footer">
        <p>Data visualization created with React and Highcharts</p>
      </div>
    </div>
  );
};

export default CompanyDashboard;