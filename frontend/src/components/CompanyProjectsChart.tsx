// src/components/CompanyProjectsChart.tsx
import React, { useState, useEffect } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

// Define interfaces
interface CompanyProject {
  winner: string;
  project_name: string;
  sum_price_agree: number;
  transaction_date?: string;
  contract_date?: string;
}

interface ProjectInfo {
  name: string;
  value: number;
  date: string;
}

interface CompanyYearInfo {
  total: number;
  projects: ProjectInfo[];
}

// Define tooltip formatter context
interface HighchartsTooltipFormatterContextObject {
  series: {
    name: string;
  };
  point: {
    category: string;
    y: number;
    projects?: ProjectInfo[];
  };
}

interface CompanyProjectsChartProps {
  data: CompanyProject[];
}

const CompanyProjectsChart: React.FC<CompanyProjectsChartProps> = ({ data }) => {
  const [chartOptions, setChartOptions] = useState<Highcharts.Options | null>(null);

  useEffect(() => {
    if (!data || data.length === 0) {
      setChartOptions({
        title: { text: 'No company project data available' }
      });
      return;
    }

    // Process the data for the chart
    const chartData = processData(data);
    setChartOptions(chartData);
  }, [data]);

  const processData = (projectsData: CompanyProject[]): Highcharts.Options => {
    // Group projects by company
    const companyProjectsMap: Record<string, CompanyProject[]> = {};
    const companyTotals: Record<string, number> = {};
    
    // Track all years for legend
    const yearsSet = new Set<number | string>();
    
    // Parse dates and extract years
    projectsData.forEach(project => {
      if (!project.winner) return;
      
      // Extract year from date
      let year: number | string;
      if (project.transaction_date) {
        year = new Date(project.transaction_date).getFullYear();
      } else if (project.contract_date) {
        year = new Date(project.contract_date).getFullYear();
      } else {
        year = 'Unknown';
      }
      
      // Add year to project as a temporary property
      (project as any).year = year;
      
      // Add to years set
      if (year !== 'Unknown') {
        yearsSet.add(year);
      }
      
      // Group by company
      if (!companyProjectsMap[project.winner]) {
        companyProjectsMap[project.winner] = [];
        companyTotals[project.winner] = 0;
      }
      
      companyProjectsMap[project.winner].push(project);
      companyTotals[project.winner] += project.sum_price_agree;
    });
    
    // Sort years for color mapping
    const years = Array.from(yearsSet).sort();
    
    // Create color map for years
    const colorMap: Record<string | number, string> = {};
    const colorPalette = [
      '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', 
      '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf',
      '#aec7e8', '#ffbb78', '#98df8a', '#ff9896', '#c5b0d5'
    ];
    
    years.forEach((year, index) => {
      colorMap[year] = colorPalette[index % colorPalette.length];
    });
    
    // Add 'Unknown' color
    colorMap['Unknown'] = '#cccccc';
    
    // Sort companies by total value and get top 20
    const sortedCompanies = Object.entries(companyTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(entry => entry[0]);
    
    // Create a data structure to organize projects by company and year
    const companyYearData: Record<string, Record<string | number, CompanyYearInfo>> = {};
    
    sortedCompanies.forEach(company => {
      companyYearData[company] = {};
      [...years, 'Unknown'].forEach(year => {
        companyYearData[company][year] = {
          total: 0,
          projects: []
        };
      });
    });
    
    // Fill in the data structure with projects
    sortedCompanies.forEach(company => {
      const projects = companyProjectsMap[company] || [];
      
      projects.forEach(project => {
        const year = (project as any).year;
        
        companyYearData[company][year].total += project.sum_price_agree;
        companyYearData[company][year].projects.push({
          name: project.project_name,
          value: project.sum_price_agree,
          date: project.transaction_date || project.contract_date || 'N/A'
        });
      });
    });
    
    // Create series for each year
    const seriesData: Highcharts.SeriesOptionsType[] = [];
    
    [...years, 'Unknown'].forEach(year => {
      const yearSeries: Highcharts.SeriesColumnOptions = {
        type: 'column',
        name: year === 'Unknown' ? 'Unknown Year' : `${year}`,
        color: colorMap[year],
        legendIndex: year === 'Unknown' ? years.length : Array.from(years).indexOf(year),
        data: Array(sortedCompanies.length).fill(0)
      };
      
      // Add data for each company
      sortedCompanies.forEach((company, companyIndex) => {
        const yearInfo = companyYearData[company][year];
        
        if (yearInfo.total > 0) {
          (yearSeries.data as any)[companyIndex] = {
            y: yearInfo.total,
            projects: yearInfo.projects,
            color: colorMap[year]
          };
        }
      });
      
      seriesData.push(yearSeries);
    });
    
    // Create the chart configuration
    return {
      chart: {
        type: 'bar',
        height: 800
      },
      title: {
        text: 'Top 20 Companies by Project Value'
      },
      subtitle: {
        text: 'Each segment represents projects from a specific year'
      },
      xAxis: {
        categories: sortedCompanies,
        title: {
          text: undefined
        },
        labels: {
          style: {
            fontSize: '10px'
          }
        }
      },
      yAxis: {
        min: 0,
        title: {
          text: 'Project Value (THB)'
        },
        labels: {
          formatter: function(): string {
            const value = this.value as number;
            if (value >= 1000000000) {
              return (value / 1000000000).toFixed(1) + 'B';
            } else if (value >= 1000000) {
              return (value / 1000000).toFixed(1) + 'M';
            } else if (value >= 1000) {
              return (value / 1000).toFixed(1) + 'K';
            }
            return value.toString();
          }
        }
      },
      legend: {
        enabled: true,
        align: 'right',
        verticalAlign: 'top',
        layout: 'vertical',
        x: 0,
        y: 100,
        title: {
          text: 'Project Year'
        }
      },
      plotOptions: {
        series: {
          stacking: 'normal',
          borderWidth: 1,
          borderColor: '#ffffff'
        } as any,
        column: {
          pointPadding: 0.1,
          groupPadding: 0.1
        }
      },
      tooltip: {
        formatter: function(): string | false {
          // Cast this to our custom type
          const ctx = this as unknown as HighchartsTooltipFormatterContextObject;
          if (ctx.point.y > 0) {
            let tooltip = '<b>' + ctx.series.name + ' Projects</b><br>' +
                   'Company: ' + ctx.point.category + '<br>' +
                   'Total Value: ' + Highcharts.numberFormat(ctx.point.y, 0, '.', ',') + ' THB<br><br>';
            
            // If we have project details, list them
            if (ctx.point.projects && ctx.point.projects.length > 0) {
              tooltip += '<b>Projects:</b><br>';
              
              // List up to 5 projects (to keep tooltip manageable)
              const projectsToShow = ctx.point.projects.slice(0, 5);
              projectsToShow.forEach(project => {
                tooltip += '• ' + project.name.substring(0, 30) + 
                           (project.name.length > 30 ? '...' : '') + 
                           ': ' + Highcharts.numberFormat(project.value, 0, '.', ',') + 
                           ' THB (' + project.date + ')<br>';
              });
              
              // If there are more projects, show a count
              if (ctx.point.projects.length > 5) {
                tooltip += '• ... and ' + (ctx.point.projects.length - 5) + ' more projects<br>';
              }
            }
            
            return tooltip;
          }
          return false; // Don't show tooltip for zero values
        }
      },
      credits: {
        enabled: false
      },
      series: seriesData
    };
  };

  if (!chartOptions) {
    return <div className="loading">Preparing chart...</div>;
  }

  return (
    <div className="chart-container">
      <HighchartsReact highcharts={Highcharts} options={chartOptions} />
    </div>
  );
};

export default CompanyProjectsChart;