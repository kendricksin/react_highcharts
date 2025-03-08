import React, { useState, useMemo } from 'react';

interface ProjectData {
  winner: string;
  project_name: string;
  sum_price_agree: number;
  transaction_date?: string;
  contract_date?: string;
}

interface ProjectsTableProps {
  projectsData: ProjectData[];
  limit: number;
  onLimitChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

type SortBy = 'date' | 'value';
type SortDirection = 'asc' | 'desc';

const ProjectsTable: React.FC<ProjectsTableProps> = ({
  projectsData,
  limit,
  onLimitChange
}) => {
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Handle sort change
  const handleSortChange = (column: SortBy) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('desc');
    }
  };

  // Sort projects
  const sortedProjects = useMemo(() => {
    return [...projectsData].sort((a, b) => {
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
  }, [projectsData, sortBy, sortDirection]);

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
    <div className="projects-table-panel">
      <div className="table-header">
        <h3 className="table-title">Recent Projects</h3>
        <div className="table-controls">
          <label htmlFor="table-limit">Show:</label>
          <select 
            id="table-limit" 
            value={limit}
            onChange={onLimitChange}
            className="limit-select"
          >
            <option value={5}>5 projects</option>
            <option value={10}>10 projects</option>
            <option value={15}>15 projects</option>
            <option value={20}>20 projects</option>
          </select>
          
          <label htmlFor="table-sort" className="ml-4">Sort by:</label>
          <select 
            id="table-sort"
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value as SortBy)}
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
            {sortedProjects.slice(0, limit).map((project, index) => (
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
      {projectsData.length > limit && (
        <div className="table-footer">
          <p>Showing {limit} of {projectsData.length} projects</p>
        </div>
      )}
    </div>
  );
};

export default ProjectsTable;