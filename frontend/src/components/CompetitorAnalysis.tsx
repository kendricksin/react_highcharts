import React, { useState, useMemo } from 'react';
import CompetitorProjectsTable from './CompetitorProjectsTable';
import CompetitorBidChart from './CompetitorBidChart';

interface AdjacentCompany {
  tin: string;
  company: string;
  common_bids: number;
  total_bids: number;
  wins: number;
  win_rate: number;
}

interface ProjectBidData {
  project_id: string;
  winner: string;
  winner_tin: string;
  project_name: string;
  sum_price_agree: number;
  price_build: number;
  transaction_date?: string;
  contract_date?: string;
  company_tin: string;
  company_name: string;
  bid: number;
  price_cut: number;
  is_winner: boolean;
}

interface CompetitorAnalysisProps {
  analysisData: ProjectBidData[];
  mainCompanyName: string;
  mainCompanyTin: string;
  competitors: AdjacentCompany[];
}

const CompetitorAnalysis: React.FC<CompetitorAnalysisProps> = ({
  analysisData,
  mainCompanyName,
  mainCompanyTin,
  competitors
}) => {
  const [chartMetric, setChartMetric] = useState<'count' | 'value' | 'price_cut'>('count');
  
  // Calculate company names map for displaying in the table
  const companyNamesMap = useMemo(() => {
    const map = new Map<string, string>();
    map.set(mainCompanyTin, mainCompanyName);
    
    competitors.forEach(comp => {
      map.set(comp.tin, comp.company);
    });
    
    // Also add any company names from the analysis data
    // This ensures we have mappings even if the API returns companies
    // that weren't in our original selection
    analysisData.forEach(project => {
      if (project.company_name && project.company_tin) {
        map.set(project.company_tin, project.company_name);
      }
    });
    
    return map;
  }, [mainCompanyTin, mainCompanyName, competitors, analysisData]);
  
  // Prepare chart data
  const chartData = useMemo(() => {
    const data: any[] = [];
    
    // Group projects by company
    const companiesData = new Map<string, {
      tin: string,
      name: string,
      projects: ProjectBidData[],
      isMain: boolean
    }>();
    
    // Initialize with default values for all companies
    companyNamesMap.forEach((name, tin) => {
      companiesData.set(tin, {
        tin,
        name,
        projects: [],
        isMain: tin === mainCompanyTin
      });
    });
    
    // Group projects by company
    analysisData.forEach(project => {
      const companyData = companiesData.get(project.company_tin);
      if (companyData) {
        companyData.projects.push(project);
      }
    });
    
    // Calculate metrics for each company
    companiesData.forEach((companyData) => {
      const { tin, name, projects, isMain } = companyData;
      
      if (projects.length === 0) return;
      
      const totalProjects = projects.length;
      const wins = projects.filter(p => p.is_winner).length;
      const totalValue = projects.reduce((sum, p) => sum + p.sum_price_agree, 0);
      const avgPriceCut = projects.reduce((sum, p) => sum + (p.price_cut || 0), 0) / totalProjects;
      
      let value: number;
      
      switch (chartMetric) {
        case 'count':
          value = totalProjects;
          break;
        case 'value':
          value = totalValue;
          break;
        case 'price_cut':
          value = avgPriceCut;
          break;
        default:
          value = totalProjects;
      }
      
      data.push({
        name,
        y: value,
        isMain,
        totalProjects,
        totalValue,
        avgPriceCut,
        wins
      });
    });
    
    return data;
  }, [analysisData, chartMetric, companyNamesMap, mainCompanyTin]);
  
  // Handle changing the chart metric
  const handleChartMetricChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setChartMetric(e.target.value as 'count' | 'value' | 'price_cut');
  };
  
  return (
    <div className="competitor-analysis">
      <div className="analysis-header">
        <h2 className="analysis-title">Competitor Analysis</h2>
        <p className="analysis-subtitle">
          Comparing {mainCompanyName} with {competitors.length} selected competitors
        </p>
      </div>
      
      {/* Charts and metrics section */}
      <div className="analysis-charts">
        <div className="chart-header">
          <h3 className="chart-title">Comparative Metrics</h3>
          <div className="chart-controls">
            <label htmlFor="chart-metric">Compare by:</label>
            <select
              id="chart-metric"
              value={chartMetric}
              onChange={handleChartMetricChange}
              className="metric-select"
            >
              <option value="count">Project Count</option>
              <option value="value">Total Value</option>
              <option value="price_cut">Avg. Price Cut</option>
            </select>
          </div>
        </div>
        
        <div className="chart-container">
          <CompetitorBidChart
            data={chartData}
            metric={chartMetric}
            mainCompanyName={mainCompanyName}
          />
        </div>
      </div>
      
      {/* Projects table */}
      <CompetitorProjectsTable
        projectsData={analysisData}
        companyNamesMap={companyNamesMap}
        mainCompanyTin={mainCompanyTin}
      />
    </div>
  );
};

export default CompetitorAnalysis;