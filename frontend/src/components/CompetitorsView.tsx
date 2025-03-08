import React from 'react';

interface AdjacentCompany {
  tin: string;
  company: string;
  common_bids: number;
  total_bids: number;
  wins: number;
  win_rate: number;
}

interface CompetitorsViewProps {
  adjacentCompanies: AdjacentCompany[];
  mainCompanyName: string;
  onCompanySelect: (tin: string, companyName: string) => void;
  onSelectionChange: (selectedTins: string[]) => void;
  selectedTins: string[];
  onAnalyzeCompetitors: () => void;
  isAnalysisLoading: boolean;
}

const CompetitorsView: React.FC<CompetitorsViewProps> = ({
  adjacentCompanies,
  mainCompanyName,
  onCompanySelect,
  onSelectionChange,
  selectedTins,
  onAnalyzeCompetitors,
  isAnalysisLoading
}) => {
  const handleCompanyClick = (tin: string, companyName: string) => {
    onCompanySelect(tin, companyName);
  };

  const handleCheckboxChange = (tin: string, checked: boolean) => {
    const newSelectedTins = checked
      ? [...selectedTins, tin]
      : selectedTins.filter(t => t !== tin);
    
    onSelectionChange(newSelectedTins);
  };

  if (adjacentCompanies.length === 0) {
    return (
      <div className="adjacent-companies-container">
        <div className="adjacent-header">
          <h3>No competitor companies found</h3>
        </div>
        <div className="p-4 text-center">
          <p>No competitor companies found for {mainCompanyName}.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="adjacent-companies-container">
      <div className="adjacent-header">
        <div>
          <h3>Companies that bid with {mainCompanyName}</h3>
          <div className="adjacent-selection-count">
            {selectedTins.length > 0 ? `${selectedTins.length} companies selected` : 'Select companies to analyze'}
          </div>
        </div>
      </div>
      
      <div className="adjacent-companies-grid">
        {adjacentCompanies.map((company) => (
          <div 
            key={company.tin} 
            className={`company-card ${selectedTins.includes(company.tin) ? 'selected' : ''}`}
          >
            <div className="company-card-header">
              <div>
                <h4 className="company-card-title">{company.company}</h4>
                <div className="company-card-tin">TIN: {company.tin}</div>
              </div>
              <input
                type="checkbox"
                checked={selectedTins.includes(company.tin)}
                onChange={(e) => handleCheckboxChange(company.tin, e.target.checked)}
                className="company-card-checkbox"
              />
            </div>
            
            <div className="company-card-details">
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Common Bids</span>
                  <span className="detail-value">{company.common_bids}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Total Bids</span>
                  <span className="detail-value">{company.total_bids}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Wins</span>
                  <span className="detail-value">{company.wins}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Win Rate</span>
                  <span className="detail-value">{company.win_rate.toFixed(1)}%</span>
                </div>
              </div>
            </div>
            
            <div className="company-card-footer">
              <button
                onClick={() => handleCompanyClick(company.tin, company.company)}
                className="view-details-button"
              >
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {selectedTins.length > 0 && (
        <div className="adjacent-footer">
          <div>
            <span>{selectedTins.length} companies selected</span>
          </div>
          <button 
            className="analyze-button"
            onClick={onAnalyzeCompetitors}
            disabled={isAnalysisLoading}
          >
            {isAnalysisLoading ? 'Analyzing...' : 'Analyze Selected Companies'}
          </button>
        </div>
      )}
    </div>
  );
};

export default CompetitorsView;