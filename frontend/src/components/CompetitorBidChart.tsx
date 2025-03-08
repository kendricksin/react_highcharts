import React, { useEffect, useState } from 'react';
import HighchartsReact from 'highcharts-react-official';
import * as Highcharts from 'highcharts';

declare module 'highcharts' {
  // Extend Point interface with ALL your custom properties
  interface Point {
    name: string;
    isMain: boolean;
    totalProjects: number;
    totalValue: number;
    avgPriceCut: number;
    wins: number;
    wonValue?: number; // Added optional properties
    lostValue?: number;
  }
}

interface CompetitorBidChartProps {
  data: Highcharts.Point[];
  metric: 'count' | 'value' | 'price_cut';
  mainCompanyName: string;
}

const CompetitorBidChart: React.FC<CompetitorBidChartProps> = ({
  data,
  metric,
  mainCompanyName
}) => {
  const [chartOptions, setChartOptions] = useState<Highcharts.Options>({});
  
  useEffect(() => {
    if (!data || data.length === 0) {
      setChartOptions({
        title: {
          text: 'No data available for comparison'
        }
      });
      return;
    }
    
    // Sort data with main company first, then by value descending
    const sortedData = [...data].sort((a, b) => {
      if (a.isMain) return -1;
      if (b.isMain) return 1;
      return (b.y ?? 0) - (a.y ?? 0);
    });
    
    // Generate colors with main company highlighted
    const mainColor = '#4A7AFF';
    const otherColor = '#94A3B8';
    const winColor = '#34D399';
    const lossColor = '#F87171';
    
    // Set chart title based on metric
    let chartTitle = '';
    let yAxisTitle = '';
    let tooltipFormatter: Highcharts.TooltipFormatterCallbackFunction;
    let series: any[];
    
    switch (metric) {
      case 'count':
        chartTitle = 'Projects and Win Rate By Company';
        yAxisTitle = 'Number of Projects';
        
        // Prepare data for stacked bar chart (wins and losses)
        series = [
          {
            name: 'Wins',
            type: 'column',
            data: sortedData.map(item => ({
                name: item.name,
                y: item.wins,
                color: item.isMain ? '#3367d6' : winColor,
                isMain: item.isMain,
                totalProjects: item.totalProjects, // All required props
                totalValue: item.totalValue,
                avgPriceCut: item.avgPriceCut,
                wins: item.wins
            })),
            stack: 'projects'
          },
          {
            name: 'Losses',
            type: 'column',
            data: sortedData.map(item => ({
              name: item.name,
              y: item.totalProjects - item.wins,
              color: item.isMain ? '#6E8FE9' : lossColor,
              isMain: item.isMain,
              totalProjects: item.totalProjects,
              totalValue: item.totalValue,
              avgPriceCut: item.avgPriceCut,
              wins: item.wins
            })),
            stack: 'projects'
          }
        ];
        
        tooltipFormatter = function() {
            const win_rate = (this.wins / this.totalProjects * 100).toFixed(1);
            const seriesName = this.series.name;
            let content = `<b>${this.name}</b><br>`;
            content += `Total Projects: <b>${this.totalProjects}</b><br>`;
            content += `Wins: <b>${this.wins}</b> (${win_rate}%)<br>`;
            content += `Losses: <b>${this.totalProjects - this.wins}</b><br>`;
            content += `Total Value: <b>${Highcharts.numberFormat(this.totalValue, 0, '.', ',')} THB</b><br>`;
            content += `Avg. Price Cut: <b>${(this.avgPriceCut * 100).toFixed(2)}%</b><br>`;
            if (seriesName === 'Wins') {
              content += `<span style="color:${winColor}">■</span> This segment: <b>${this.y}</b> wins<br>`;
            } else {
              content += `<span style="color:${lossColor}">■</span> This segment: <b>${this.y}</b> losses<br>`;
            }
            return content;
          };
        break;
        
      case 'value':
        chartTitle = 'Total Project Value By Company';
        yAxisTitle = 'Total Value (THB)';
        
        // For value, let's show total value and won value as stacked
        series = [
          {
            name: 'Won Value',
            type: 'column',
            data: sortedData.map(item => {
              // Calculate approximate won value based on win rate
              const wonValue = item.totalValue * (item.wins / item.totalProjects);
              return {
                name: item.name,
                y: wonValue,
                color: item.isMain ? '#3367d6' : winColor,
                isMain: item.isMain,
                totalProjects: item.totalProjects,
                totalValue: item.totalValue,
                wonValue: wonValue,
                lostValue: item.totalValue - wonValue,
                avgPriceCut: item.avgPriceCut,
                wins: item.wins
              };
            }),
            stack: 'value'
          },
          {
            name: 'Lost Value',
            type: 'column',
            data: sortedData.map(item => {
              const wonValue = item.totalValue * (item.wins / item.totalProjects);
              return {
                name: item.name,
                y: item.totalValue - wonValue,
                color: item.isMain ? '#6E8FE9' : lossColor,
                isMain: item.isMain,
                totalProjects: item.totalProjects,
                totalValue: item.totalValue,
                wonValue: wonValue,
                lostValue: item.totalValue - wonValue,
                avgPriceCut: item.avgPriceCut,
                wins: item.wins
              };
            }),
            stack: 'value'
          }
        ];
        
        tooltipFormatter = function() {
            const win_rate = (this.wins / this.totalProjects * 100).toFixed(1);
            const seriesName = this.series.name;
            let content = `<b>${this.name}</b><br>`;
            content += `Total Projects: <b>${this.totalProjects}</b><br>`;
            content += `Wins: <b>${this.wins}</b> (${win_rate}%)<br>`;
            content += `Losses: <b>${this.totalProjects - this.wins}</b><br>`;
            content += `Total Value: <b>${Highcharts.numberFormat(this.totalValue, 0, '.', ',')} THB</b><br>`;
            content += `Avg. Price Cut: <b>${(this.avgPriceCut * 100).toFixed(2)}%</b><br>`;
            if (seriesName === 'Wins') {
              content += `<span style="color:${winColor}">■</span> This segment: <b>${this.y}</b> wins<br>`;
            } else {
              content += `<span style="color:${lossColor}">■</span> This segment: <b>${this.y}</b> losses<br>`;
            }
            return content;
          };
        break;
        
      case 'price_cut':
        chartTitle = 'Average Price Cut By Company';
        yAxisTitle = 'Price Cut (%)';
        
        // For price cut, use a simple column chart (no stacking)
        series = [{
          name: 'Price Cut',
          type: 'column',
          data: sortedData.map(item => ({
            name: item.name,
            y: item.avgPriceCut * 100, // Convert to percentage
            color: item.isMain ? mainColor : 
                  (item.avgPriceCut < -0.1 ? '#34D399' : // Good price cut (more than 10%)
                   item.avgPriceCut < -0.05 ? '#FBBF24' : // Medium price cut (5-10%)
                   '#F87171'), // Poor price cut (< 5%)
            isMain: item.isMain,
            totalProjects: item.totalProjects,
            totalValue: item.totalValue,
            avgPriceCut: item.avgPriceCut * 100,
            wins: item.wins
          }))
        }];
        
        tooltipFormatter = function() {
          const win_rate = (this.wins / this.totalProjects * 100).toFixed(1);
          
          let content = `<b>${this.name}</b><br>`;
          content += `Avg. Price Cut: <b>${this.avgPriceCut.toFixed(2)}%</b><br>`;
          content += `Total Projects: <b>${this.totalProjects}</b><br>`;
          content += `Win Rate: <b>${win_rate}%</b><br>`;
          content += `Total Value: <b>${Highcharts.numberFormat(this.totalValue, 0, '.', ',')} THB</b><br>`;
          
          return content;
        };
        break;
        
      default:
        series = [{
          name: 'Companies',
          type: 'column',
          data: sortedData
        }];
        
        tooltipFormatter = function() {
          return `<b>${this.name}</b>: ${this.y}`;
        };
    }
    
    const options: Highcharts.Options = {
      chart: {
        type: 'column',
        height: 400
      },
      title: {
        text: chartTitle,
        style: {
          fontSize: '16px'
        }
      },
      xAxis: {
        categories: sortedData.map(item => {
          const displayName = item.name.length > 20 
            ? item.name.substring(0, 17) + '...' 
            : item.name;
          return item.isMain ? `${displayName} ★` : displayName;
        }),
        title: {
          text: 'Company'
        },
        labels: {
          rotation: -45,
          style: {
            fontSize: '11px'
          }
        }
      },
      yAxis: {
        title: {
          text: yAxisTitle
        },
        labels: {
          formatter: function() {
            if (metric === 'value') {
              const value = this.value as number;
              if (value >= 1000000) {
                return `${(value / 1000000).toFixed(1)}M`;
              } else if (value >= 1000) {
                return `${(value / 1000).toFixed(1)}K`;
              }
              return value.toString();
            } else if (metric === 'price_cut') {
              return `${this.value}%`;
            }
            return this.value.toString();
          }
        }
      },
      legend: {
        enabled: true,
        align: 'center',
        verticalAlign: 'bottom',
        layout: 'horizontal'
      },
      plotOptions: {
        column: {
          borderRadius: 3,
          dataLabels: {
            enabled: false
          },
          stacking: metric === 'price_cut' ? undefined : 'normal',
          pointPadding: 0.2,
          groupPadding: 0.1,
          borderWidth: 0
        }
      },
      tooltip: {
        formatter: tooltipFormatter,
        useHTML: true,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        shadow: true
      },
      credits: {
        enabled: false
      },
      series: series
    };
    
    setChartOptions(options);
  }, [data, metric, mainCompanyName]);
  
  if (!data || data.length === 0) {
    return (
      <div className="no-data-message">
        <p>No comparison data available</p>
      </div>
    );
  }
  
  return (
    <div className="competitor-bid-chart">
      <HighchartsReact highcharts={Highcharts} options={chartOptions} />
      <div className="chart-legend">
        <div className="legend-item">
          <span className="legend-color legend-main"></span>
          <span className="legend-text">{mainCompanyName} (Main Company)</span>
        </div>
        {metric === 'count' && (
          <>
            <div className="legend-item">
              <span className="legend-color legend-win"></span>
              <span className="legend-text">Wins</span>
            </div>
            <div className="legend-item">
              <span className="legend-color legend-loss"></span>
              <span className="legend-text">Losses</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CompetitorBidChart;