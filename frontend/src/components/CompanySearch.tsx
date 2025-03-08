// src/components/CompanySearch.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface CompanySearchProps {
  onCompanySelect: (tin: string, companyName: string) => void;
}

interface CompanySearchResult {
  tin: string;
  company: string;
  total_bids?: number;
  win_rate?: number;
}

const CompanySearch: React.FC<CompanySearchProps> = ({ onCompanySelect }) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchResults, setSearchResults] = useState<CompanySearchResult[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Perform search when user submits the form
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchTerm.trim()) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get<CompanySearchResult[]>(
        `http://localhost:8000/api/search-companies?query=${searchTerm}`
      );
      
      setSearchResults(response.data);
      
      if (response.data.length === 0) {
        setError('No companies found matching your search criteria.');
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error searching companies:', err);
      setError('Failed to search companies. Please try again later.');
      setLoading(false);
    }
  };

  // Handle company selection
  const handleCompanySelect = (tin: string, companyName: string) => {
    onCompanySelect(tin, companyName);
    setSearchResults([]); // Clear results after selection
  };

  return (
    <div className="company-search">
      <h3>Search Companies</h3>
      <form onSubmit={handleSearchSubmit} className="search-form">
        <div className="search-input-container">
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Enter company name or TIN..."
            className="search-input"
          />
          <button type="submit" className="search-button" disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>
      
      {error && <div className="search-error">{error}</div>}
      
      {searchResults.length > 0 && (
        <div className="search-results">
          <h4>Search Results</h4>
          <ul className="company-list">
            {searchResults.map((company) => (
              <li key={company.tin} className="company-item">
                <button
                  onClick={() => handleCompanySelect(company.tin, company.company)}
                  className="company-select-button"
                >
                  <span className="company-name">{company.company}</span>
                  <span className="company-tin">TIN: {company.tin}</span>
                  {company.total_bids !== undefined && (
                    <span className="company-bids">Bids: {company.total_bids}</span>
                  )}
                  {company.win_rate !== undefined && (
                    <span className="company-win-rate">Win Rate: {company.win_rate.toFixed(1)}%</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CompanySearch;