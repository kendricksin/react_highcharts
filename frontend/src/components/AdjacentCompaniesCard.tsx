import React, { useState } from 'react';

interface CompanyData {
  tin: string;
  company: string;
  common_bids: number;
  total_bids: number;
  wins: number;
  win_rate: number;
}

interface AdjacentCompaniesCardProps {
  companies: CompanyData[];
  onCompanySelect: (tin: string, companyName: string) => void;
  onSelectionChange?: (selectedCompanies: string[]) => void;
  mainCompanyName: string;
  onBackToMainCompany: () => void;
}

const AdjacentCompaniesCard: React.FC<AdjacentCompaniesCardProps> = ({
  companies,
  onCompanySelect,
  onSelectionChange,
  mainCompanyName,
  onBackToMainCompany
}) => {
  const [selectedTins, setSelectedTins] = useState<string[]>([]);

  const handleCompanyClick = (tin: string, companyName: string) => {
    onCompanySelect(tin, companyName);
  };

  const handleCheckboxChange = (tin: string, event: React.ChangeEvent<HTMLInputElement>) => {
    event.stopPropagation();
    
    const newSelectedTins = selectedTins.includes(tin)
      ? selectedTins.filter(t => t !== tin)
      : [...selectedTins, tin];
    
    setSelectedTins(newSelectedTins);
    
    if (onSelectionChange) {
      onSelectionChange(newSelectedTins);
    }
  };

  const handleAnalyzeClick = () => {
    if (onSelectionChange && selectedTins.length > 0) {
      onSelectionChange(selectedTins);
      alert(`Analyzing ${selectedTins.length} selected companies`);
    }
  };

  if (companies.length === 0) {
    return (
      <div className="adjacent-companies-container">
        <div className="adjacent-header">
          <h3>No adjacent companies</h3>
          <button 
            className="back-button"
            onClick={onBackToMainCompany}
          >
            Back to {mainCompanyName}
          </button>
        </div>
        <div className="p-4 text-center">
          <p>No adjacent companies found for {mainCompanyName}.</p>
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
        <button 
          className="back-button"
          onClick={onBackToMainCompany}
        >
          Back
        </button>
      </div>
      
      <div className="adjacent-companies-grid">
        {companies.map((company) => (
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
                onChange={(e) => handleCheckboxChange(company.tin, e)}
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
            onClick={handleAnalyzeClick}
          >
            Analyze Selected Companies
          </button>
        </div>
      )}
    </div>
  );
};

export default AdjacentCompaniesCard;