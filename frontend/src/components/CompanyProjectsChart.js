// CompanyProjectsChart.js
import React, { useState, useEffect } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import axios from 'axios';

function CompanyProjectsChart() {
  const [chartOptions, setChartOptions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Call the new API endpoint that returns company projects
      const response = await axios.get('http://localhost:8000/api/company-projects');
      const projectsData = response.data;
      
      // Process the data for the chart
      const chartOptions = processData(projectsData);
      setChartOptions(chartOptions);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data. Please try again later.');
      setLoading(false);
    }
  };

  const processData = (projectsData) => {
    try {
      // Group projects by company
      const companyProjectsMap = {};
      const companyTotals = {};
      
      // Track all years for legend
      const yearsSet = new Set();
      
      // Parse dates and extract years
      projectsData.forEach(project => {
        // Extract year from date
        let year;
        if (project.transaction_date) {
          year = new Date(project.transaction_date).getFullYear();
        } else if (project.contract_date) {
          year = new Date(project.contract_date).getFullYear();
        } else {
          year = 'Unknown';
        }
        
        // Add year to project
        project.year = year;
        
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
      const colorMap = {};
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
      const companyYearData = {};
      
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
          const year = project.year;
          
          companyYearData[company][year].total += project.sum_price_agree;
          companyYearData[company][year].projects.push({
            name: project.project_name,
            value: project.sum_price_agree,
            date: project.transaction_date || project.contract_date || 'N/A'
          });
        });
      });
      
      // Create series for each year
      const seriesData = [];
      
      [...years, 'Unknown'].forEach(year => {
        const yearSeries = {
          name: year === 'Unknown' ? 'Unknown Year' : `${year}`,
          color: colorMap[year],
          legendIndex: year === 'Unknown' ? years.length : years.indexOf(year),
          data: Array(sortedCompanies.length).fill(0)
        };
        
        // Add data for each company
        sortedCompanies.forEach((company, companyIndex) => {
          const yearInfo = companyYearData[company][year];
          
          if (yearInfo.total > 0) {
            yearSeries.data[companyIndex] = {
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
            text: null
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
            formatter: function() {
              if (this.value >= 1000000000) {
                return (this.value / 1000000000).toFixed(1) + 'B';
              } else if (this.value >= 1000000) {
                return (this.value / 1000000).toFixed(1) + 'M';
              } else if (this.value >= 1000) {
                return (this.value / 1000).toFixed(1) + 'K';
              }
              return this.value;
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
            pointPadding: 0.1,
            groupPadding: 0.1,
            borderWidth: 1,
            borderColor: '#ffffff'
          }
        },
        tooltip: {
          formatter: function() {
            if (this.point.y > 0) {
              let tooltip = '<b>' + this.series.name + ' Projects</b><br>' +
                     'Company: ' + this.point.category + '<br>' +
                     'Total Value: ' + Highcharts.numberFormat(this.point.y, 0, '.', ',') + ' THB<br><br>';
              
              // If we have project details, list them
              if (this.point.projects && this.point.projects.length > 0) {
                tooltip += '<b>Projects:</b><br>';
                
                // List up to 5 projects (to keep tooltip manageable)
                const projectsToShow = this.point.projects.slice(0, 5);
                projectsToShow.forEach(project => {
                  tooltip += '• ' + project.name.substring(0, 30) + 
                             (project.name.length > 30 ? '...' : '') + 
                             ': ' + Highcharts.numberFormat(project.value, 0, '.', ',') + 
                             ' THB (' + project.date + ')<br>';
                });
                
                // If there are more projects, show a count
                if (this.point.projects.length > 5) {
                  tooltip += '• ... and ' + (this.point.projects.length - 5) + ' more projects<br>';
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
    } catch (err) {
      console.error('Error processing data:', err);
      throw err;
    }
  };

  return (
    <div className="chart-container">
      {loading ? (
        <div className="loading">Loading data...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : (
        <HighchartsReact highcharts={Highcharts} options={chartOptions} />
      )}
    </div>
  );
}

export default CompanyProjectsChart;