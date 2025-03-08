import React, { useState, useMemo } from 'react';

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

interface CompetitorProjectsTableProps {
  projectsData: ProjectBidData[];
  companyNamesMap: Map<string, string>;
  mainCompanyTin: string;
}

type SortColumn = 'date' | 'name' | 'company' | 'winner' | 'value' | 'price_build' | 'price_cut';
type SortDirection = 'asc' | 'desc';

const CompetitorProjectsTable: React.FC<CompetitorProjectsTableProps> = ({
  projectsData,
  companyNamesMap,
  mainCompanyTin
}) => {
  const [sortColumn, setSortColumn] = useState<SortColumn>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [winnerFilter, setWinnerFilter] = useState<string>('all');

  // Handle sort change
  const handleSortChange = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  // Get unique companies
  const uniqueCompanies = useMemo(() => {
    const companies = new Set<string>();
    projectsData.forEach(project => {
      const companyName = project.company_name || companyNamesMap.get(project.company_tin) || 'Unknown';
      companies.add(companyName);
    });
    return Array.from(companies).sort();
  }, [projectsData, companyNamesMap]);

  // Get unique winners
  const uniqueWinners = useMemo(() => {
    const winners = new Set<string>();
    projectsData.forEach(project => {
      winners.add(project.winner);
    });
    return Array.from(winners).sort();
  }, [projectsData]);

  // Filter and sort projects
  const filteredAndSortedProjects = useMemo(() => {
    return [...projectsData]
      .filter(project => {
        // Apply text search filter
        if (searchQuery && !project.project_name.toLowerCase().includes(searchQuery.toLowerCase())) {
          return false;
        }
        
        // Apply company filter
        if (companyFilter !== 'all') {
          const companyName = companyNamesMap.get(project.company_tin) || 'Unknown';
          if (companyName !== companyFilter) {
            return false;
          }
        }
        
        // Apply winner filter
        if (winnerFilter !== 'all' && project.winner !== winnerFilter) {
          return false;
        }
        
        return true;
      })
      .sort((a, b) => {
        // Apply sorting
        const multiplier = sortDirection === 'asc' ? 1 : -1;
        
        switch (sortColumn) {
          case 'date':
            const dateA = a.contract_date ? new Date(a.contract_date) : a.transaction_date ? new Date(a.transaction_date) : new Date(0);
            const dateB = b.contract_date ? new Date(b.contract_date) : b.transaction_date ? new Date(b.transaction_date) : new Date(0);
            return multiplier * (dateA.getTime() - dateB.getTime());
          
          case 'name':
            return multiplier * a.project_name.localeCompare(b.project_name);
          
          case 'company':
            const companyA = companyNamesMap.get(a.company_tin) || '';
            const companyB = companyNamesMap.get(b.company_tin) || '';
            return multiplier * companyA.localeCompare(companyB);
          
          case 'winner':
            return multiplier * a.winner.localeCompare(b.winner);
          
          case 'value':
            return multiplier * (a.sum_price_agree - b.sum_price_agree);
          
          case 'price_build':
            return multiplier * (a.price_build - b.price_build);
          
          case 'price_cut':
            return multiplier * (a.price_cut - b.price_cut);
          
          default:
            return 0;
        }
      });
  }, [projectsData, searchQuery, companyFilter, winnerFilter, sortColumn, sortDirection, companyNamesMap]);

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

  // Format the money value
  const formatMoney = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(2)}M THB`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(2)}K THB`;
    } else {
      return `${value.toFixed(2)} THB`;
    }
  };

  // Format the percentage
  const formatPercentage = (value: number) => {
    // Check if value is already in percentage form or decimal form
    // Our API returns price_cut already in decimal form (e.g., -0.05 for 5% discount)
    const percentValue = Math.abs(value) < 1 ? value * 100 : value;
    return `${percentValue.toFixed(2)}%`;
  };

  // Handle search change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Get column header class
  const getColumnHeaderClass = (column: SortColumn) => {
    return `th-${column} ${sortColumn === column ? 'active-sort' : ''}`;
  };

  return (
    <div className="competitor-projects-table-panel">
      <div className="table-header">
        <h3 className="table-title">All Projects</h3>
        <div className="table-filters">
          <div className="filter-item">
            <label htmlFor="project-search">Search:</label>
            <input
              id="project-search"
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Filter by project name..."
              className="search-input"
            />
          </div>
          
          <div className="filter-item">
            <label htmlFor="company-filter">Company:</label>
            <select
              id="company-filter"
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Companies</option>
              {uniqueCompanies.map(company => (
                <option key={company} value={company}>
                  {company}
                </option>
              ))}
            </select>
          </div>
          
          <div className="filter-item">
            <label htmlFor="winner-filter">Winner:</label>
            <select
              id="winner-filter"
              value={winnerFilter}
              onChange={(e) => setWinnerFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Winners</option>
              {uniqueWinners.map(winner => (
                <option key={winner} value={winner}>
                  {winner}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      <div className="table-container">
        <table className="competitor-projects-table">
          <thead>
            <tr>
              <th 
                className={getColumnHeaderClass('date')}
                onClick={() => handleSortChange('date')}
              >
                Date {sortColumn === 'date' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                className={getColumnHeaderClass('name')}
                onClick={() => handleSortChange('name')}
              >
                Project Name {sortColumn === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                className={getColumnHeaderClass('company')}
                onClick={() => handleSortChange('company')}
              >
                Company {sortColumn === 'company' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                className={getColumnHeaderClass('winner')}
                onClick={() => handleSortChange('winner')}
              >
                Winner {sortColumn === 'winner' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                className={getColumnHeaderClass('value')}
                onClick={() => handleSortChange('value')}
              >
                Bid Price {sortColumn === 'value' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                className={getColumnHeaderClass('price_build')}
                onClick={() => handleSortChange('price_build')}
              >
                Price Build {sortColumn === 'price_build' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                className={getColumnHeaderClass('price_cut')}
                onClick={() => handleSortChange('price_cut')}
              >
                Price Cut {sortColumn === 'price_cut' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedProjects.map((project, index) => {
              const companyName = project.company_name || companyNamesMap.get(project.company_tin) || 'Unknown';
              const isMainCompany = project.company_tin === mainCompanyTin;
              const isWinner = project.winner === companyName;
              
              return (
                <tr 
                  key={`${project.company_tin}-${project.project_name}-${index}`} 
                  className={`project-row ${isMainCompany ? 'main-company-row' : ''} ${isWinner ? 'winner-row' : ''}`}
                >
                  <td className="date-cell">
                    {formatDate(project.contract_date || project.transaction_date)}
                  </td>
                  <td className="project-name-cell" title={project.project_name}>
                    <div className="truncated-text">{project.project_name}</div>
                  </td>
                  <td className={`company-cell ${isMainCompany ? 'main-company-cell' : ''}`} title={companyName}>
                    <div className="truncated-text">
                      {companyName}
                      {isMainCompany && <span className="main-company-badge">*</span>}
                    </div>
                  </td>
                  <td className={`winner-cell ${isWinner ? 'is-winner-cell' : ''}`} title={project.winner}>
                    <div className="truncated-text">
                      {project.winner}
                      {isWinner && <span className="winner-badge">✓</span>}
                    </div>
                  </td>
                  <td className="value-cell">
                    {formatMoney(project.sum_price_agree)}
                  </td>
                  <td className="price-build-cell">
                    {formatMoney(project.price_build)}
                  </td>
                  <td className={`price-cut-cell ${project.price_cut < 0 ? 'negative-price-cut' : ''}`}>
                    {formatPercentage(project.price_cut)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      <div className="table-footer">
        <p>
          Showing {filteredAndSortedProjects.length} of {projectsData.length} projects
          {companyFilter !== 'all' && ` for ${companyFilter}`}
          {winnerFilter !== 'all' && ` won by ${winnerFilter}`}
          {searchQuery && ` matching "${searchQuery}"`}
        </p>
      </div>
      <style>{`
      .competitor-projects-table {
        table-layout: fixed;
        width: 100%;
      }

      .competitor-projects-table th,
      .competitor-projects-table td {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .date-cell,
      .value-cell,
      .price-build-cell,
      .price-cut-cell {
        width: 10%;
      }

      .project-name-cell {
        width: 30%;
      }

      .company-cell,
      .winner-cell {
        width: 15%;
      }

      .truncated-text {
        display: block;
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    `}</style>
    </div>
  );
};

export default CompetitorProjectsTable;