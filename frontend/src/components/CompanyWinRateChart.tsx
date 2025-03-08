import React, { useEffect, useState } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

interface CompanyWinRateChartProps {
  companyName: string;
  winRate: number;
  totalBids: number;
  wins: number;
}

const CompanyWinRateChart: React.FC<CompanyWinRateChartProps> = ({ 
  companyName, 
  winRate, 
  totalBids, 
  wins 
}) => {
  const [chartOptions, setChartOptions] = useState<Highcharts.Options>({});

  useEffect(() => {
    // Calculate the loss count
    const losses = totalBids - wins;
    
    // Determine colors based on win rate
    let winColor = '#34D399'; // Default good color (green)
    
    if (winRate < 25) {
      winColor = '#F87171'; // Red for low win rate
    } else if (winRate < 50) {
      winColor = '#FBBF24'; // Yellow for medium win rate
    }
    
    const options: Highcharts.Options = {
      chart: {
        type: 'pie',
        height: 300,
        backgroundColor: 'transparent',
        spacingTop: 10,
        spacingBottom: 10,
        spacingLeft: 10,
        spacingRight: 10
      },
      title: {
        text: undefined // Removing the title as we have it outside the chart
      },
      tooltip: {
        useHTML: true,
        headerFormat: '<div style="font-size: 12px; font-weight: bold; padding-bottom: 5px;">{point.key}</div>',
        pointFormat: '<div style="font-size: 11px; padding: 2px 0;"><b>{point.y}</b> bids ({point.percentage:.1f}%)</div>' +
                    '<div style="font-size: 10px; color: #777;">Out of {series.name} total bids</div>',
        borderWidth: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#E0E0E0',
        shadow: true
      },
      credits: {
        enabled: false
      },
      plotOptions: {
        pie: {
          allowPointSelect: true,
          cursor: 'pointer',
          dataLabels: {
            enabled: true,
            format: '<b>{point.name}</b>: {point.y} ({point.percentage:.1f}%)',
            style: {
              fontWeight: 'normal',
              textOutline: 'none',
              fontSize: '12px'
            },
            distance: -35,
            filter: {
              property: 'percentage',
              operator: '>',
              value: 10
            }
          },
          showInLegend: true,
          borderWidth: 0,
          center: ['50%', '50%'],
          size: '80%' // Making the pie chart a bit smaller to fit labels
        }
      },
      legend: {
        enabled: true,
        layout: 'horizontal',
        align: 'center',
        verticalAlign: 'bottom',
        itemStyle: {
          fontSize: '12px',
          fontWeight: 'normal'
        },
        symbolRadius: 0,
        itemDistance: 30
      },
      series: [{
        name: totalBids.toString(),
        colorByPoint: true,
        type: 'pie',
        data: [{
          name: 'Wins',
          y: wins,
          color: winColor,
          sliced: true,
          selected: true
        }, {
          name: 'Losses',
          y: losses,
          color: '#6B7280' // Gray for losses
        }]
      } as any] // Type assertion to fix TypeScript errors
    };

    setChartOptions(options);
  }, [companyName, winRate, totalBids, wins]);

  // Format percentage for display
  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <div className="win-rate-chart-container">
      <div className="win-rate-details">
        <div className="win-rate-stat">
          <span className="win-rate-value">{formatPercentage(winRate)}</span>
          <span className="win-rate-label">Win Rate</span>
        </div>
        <div className="win-rate-breakdown">
          <div className="breakdown-item">
            <span className="breakdown-value win-color">{wins}</span>
            <span className="breakdown-label">Wins</span>
          </div>
          <div className="breakdown-item">
            <span className="breakdown-value loss-color">{totalBids - wins}</span>
            <span className="breakdown-label">Losses</span>
          </div>
        </div>
      </div>
      <div className="win-rate-chart">
        <HighchartsReact highcharts={Highcharts} options={chartOptions} />
      </div>
    </div>
  );
};

export default CompanyWinRateChart;