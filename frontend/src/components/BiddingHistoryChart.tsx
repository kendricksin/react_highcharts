import React, { useEffect, useState } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

interface ProjectData {
  project_name: string;
  sum_price_agree: number;
  transaction_date?: string;
  contract_date?: string;
}

interface BiddingHistoryChartProps {
  projectsData: ProjectData[];
  companyName: string;
}

const BiddingHistoryChart: React.FC<BiddingHistoryChartProps> = ({ 
  projectsData, 
  companyName 
}) => {
  const [chartOptions, setChartOptions] = useState<Highcharts.Options>({});
  const [limit, setLimit] = useState<number>(10);

  useEffect(() => {
    if (!projectsData || projectsData.length === 0) {
      setChartOptions({
        title: { text: 'No project data available' }
      });
      return;
    }
    
    // Sort projects by date (newest first)
    const sortedProjects = [...projectsData].sort((a, b) => {
      const dateA = a.contract_date ? new Date(a.contract_date) : new Date(a.transaction_date || 0);
      const dateB = b.contract_date ? new Date(b.contract_date) : new Date(b.transaction_date || 0);
      return dateB.getTime() - dateA.getTime();
    });
    
    // Get only the most recent 'limit' projects
    const recentProjects = sortedProjects.slice(0, limit);
    
    // Format data for chart
    const projectNames = recentProjects.map(project => {
      // Truncate long project names
      const name = project.project_name;
      return name.length > 30 ? name.substring(0, 27) + '...' : name;
    });
    
    const projectValues = recentProjects.map(project => project.sum_price_agree);
    
    // Generate gradient colors based on value
    const colors = recentProjects.map((project, index) => ({
      project: project,
      value: project.sum_price_agree,
      color: generateColor(project.sum_price_agree, Math.max(...projectValues))
    }));
    
    const options: Highcharts.Options = {
      chart: {
        type: 'bar',
        height: 400,
        backgroundColor: 'transparent',
        spacingBottom: 20
      },
      title: {
        text: undefined // We have a title outside the chart
      },
      xAxis: {
        categories: projectNames,
        title: {
          text: null
        },
        labels: {
          style: {
            fontSize: '11px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif'
          },
          formatter: function() {
            const str = this.value as string;
            // Truncate long names and add ellipsis
            return str.length > 30 ? str.substring(0, 27) + '...' : str;
          }
        }
      },
      yAxis: {
        title: {
          text: 'Value (THB)',
          align: 'high',
          rotation: 0,
          y: -15,
          offset: -10
        },
        labels: {
          formatter: function() {
            // Format numbers with M/K suffix
            const num = this.value as number;
            if (num >= 1000000) {
              return Highcharts.numberFormat(num / 1000000, 1) + 'M';
            } else if (num >= 1000) {
              return Highcharts.numberFormat(num / 1000, 1) + 'K';
            }
            return Highcharts.numberFormat(num, 0);
          },
          style: {
            fontSize: '11px'
          }
        }
      },
      tooltip: {
        useHTML: true,
        headerFormat: '<div style="font-size: 12px; font-weight: bold; padding-bottom: 5px;">{point.key}</div>',
        pointFormatter: function() {
          const project = recentProjects[this.index || 0];
          const date = formatDate(project.contract_date || project.transaction_date);
          
          // Calculate how this project compares to the average
          const average = projectValues.reduce((sum, val) => sum + val, 0) / projectValues.length;
          const percentDiff = ((project.sum_price_agree - average) / average) * 100;
          const compareText = percentDiff > 0 
            ? `<span style="color: #F87171">${percentDiff.toFixed(1)}% above average</span>` 
            : `<span style="color: #34D399">${Math.abs(percentDiff).toFixed(1)}% below average</span>`;
          
          return `
            <div style="font-size: 11px; padding: 5px 0;">
              <div><b>Value:</b> ${Highcharts.numberFormat(project.sum_price_agree, 0, '.', ',')} THB</div>
              <div><b>Date:</b> ${date}</div>
              <div style="margin-top: 5px; font-size: 10px;">${compareText}</div>
            </div>
          `;
        },
        borderWidth: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#E0E0E0',
        shadow: true
      },
      plotOptions: {
        bar: {
          dataLabels: {
            enabled: true,
            formatter: function() {
              // Format to millions/thousands with 1 decimal
              const value = this.y as number;
              if (value >= 1000000) {
                return Highcharts.numberFormat(value / 1000000, 1) + 'M';
              } else if (value >= 1000) {
                return Highcharts.numberFormat(value / 1000, 1) + 'K';
              }
              return Highcharts.numberFormat(value, 0);
            },
            style: {
              fontSize: '11px',
              fontWeight: 'normal',
              textOutline: 'none',
              color: '#333'
            }
          },
          colorByPoint: true,
          colors: colors.map(c => c.color),
          borderRadius: 3,
          pointPadding: 0.2,
          groupPadding: 0.1,
          borderWidth: 0
        }
      },
      legend: {
        enabled: false
      },
      credits: {
        enabled: false
      },
      series: [{
        name: 'Project Value',
        type: 'bar',
        data: projectValues
      }]
    };
    
    setChartOptions(options);
  }, [projectsData, limit, companyName]);
  
  // Function to generate gradient color based on value
  const generateColor = (value: number, maxValue: number) => {
    // Calculate how significant this project is compared to the max
    const ratio = value / maxValue;
    
    // Generate color gradient from light blue to dark blue
    // Higher values get darker color
    const baseColor = ratio > 0.8 ? [26, 86, 219] : // very dark blue for top 20%
                     ratio > 0.6 ? [37, 99, 235] : // dark blue
                     ratio > 0.4 ? [59, 130, 246] : // medium blue
                     ratio > 0.2 ? [96, 165, 250] : // medium-light blue
                     [147, 197, 253]; // light blue
    
    return `rgb(${baseColor[0]}, ${baseColor[1]}, ${baseColor[2]})`;
  };

  // Helper to format date nicely
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { 
      year: 'numeric',
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Update limit
  const handleLimitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLimit(parseInt(e.target.value, 10));
  };

  if (!projectsData || projectsData.length === 0) {
    return (
      <div className="no-data-message">
        <p>No project data available for {companyName}</p>
      </div>
    );
  }

  return (
    <div className="bidding-history-container">
      <div className="chart-options">
        <select 
          value={limit}
          onChange={handleLimitChange}
          className="limit-select"
        >
          <option value={5}>5 projects</option>
          <option value={10}>10 projects</option>
          <option value={15}>15 projects</option>
          <option value={20}>20 projects</option>
        </select>
      </div>
      <div className="chart-wrapper">
        <HighchartsReact highcharts={Highcharts} options={chartOptions} />
      </div>
      <div className="chart-legend">
        <div className="legend-item">
          <span className="color-swatch high-value"></span>
          <span className="legend-text">High value</span>
        </div>
        <div className="legend-item">
          <span className="color-swatch medium-value"></span>
          <span className="legend-text">Medium value</span>
        </div>
        <div className="legend-item">
          <span className="color-swatch low-value"></span>
          <span className="legend-text">Low value</span>
        </div>
      </div>
    </div>
  );
};

export default BiddingHistoryChart;