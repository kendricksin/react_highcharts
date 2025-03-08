// src/components/MonthlyAnalysisChart.tsx
import React, { useEffect, useState } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

interface ProjectData {
  month: string;
  year: number;
  total_sum_price_agree: number;
  count: number;
}

interface MonthlyAnalysisChartProps {
  data: ProjectData[];
}

// Define our own tooltip formatter context object
interface TooltipFormatterContextObject {
  x?: string;
  y?: number;
  points?: Array<{
    y: number;
    series: {
      name: string;
    };
  }>;
}

const MonthlyAnalysisChart: React.FC<MonthlyAnalysisChartProps> = ({ data }) => {
  const [chartOptions, setChartOptions] = useState<Highcharts.Options | null>(null);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>('');

  useEffect(() => {
    if (!data || data.length === 0) {
      setChartOptions({
        title: { text: 'No monthly data available' }
      });
      return;
    }

    // Get unique years for filter
    const yearsSet = new Set<number>();
    data.forEach(item => yearsSet.add(item.year));
    const years = Array.from(yearsSet).sort((a, b) => a - b);
    setAvailableYears(years);

    // Filter data by selected year if needed
    const filteredData = selectedYear 
      ? data.filter(item => item.year === parseInt(selectedYear, 10))
      : data;

    // Prepare data for chart
    const months = filteredData.map(item => `${item.month} ${item.year}`);
    const values = filteredData.map(item => item.total_sum_price_agree);
    const counts = filteredData.map(item => item.count);

    // Configure chart
    const options: Highcharts.Options = {
      title: {
        text: 'Total Project Value by Month'
      },
      subtitle: {
        text: 'Based on Selected Company Competition Data'
      },
      xAxis: {
        categories: months,
        title: {
          text: 'Month'
        }
      },
      yAxis: [{
        title: {
          text: 'Total Value (THB)'
        },
        labels: {
          formatter: function(): string {
            return (this.value as number).toLocaleString('th-TH');
          }
        }
      }, {
        title: {
          text: 'Number of Projects'
        },
        opposite: true
      }],
      tooltip: {
        shared: true,
        formatter: function(): string {
          let tooltip = '<b>' + this.x + '</b><br/>';
          // Cast this to our custom type
          const ctx = this as unknown as TooltipFormatterContextObject;
          if (ctx.points) {
            ctx.points.forEach(point => {
              const name = point.series.name;
              const value = name === 'Number of Projects' 
                ? point.y 
                : point.y.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
              tooltip += name + ': ' + value + (name === 'Number of Projects' ? '' : ' THB') + '<br/>';
            });
          }
          return tooltip;
        }
      },
      legend: {
        enabled: true
      },
      credits: {
        enabled: false
      },
      series: [{
        name: 'Total Value',
        type: 'column',
        data: values,
        color: '#4285F4'
      }, {
        name: 'Number of Projects',
        type: 'line',
        data: counts,
        yAxis: 1,
        color: '#EA4335'
      }] as Highcharts.SeriesOptionsType[]
    };

    setChartOptions(options);
  }, [data, selectedYear]);

  // Handle year filter change
  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedYear(e.target.value);
  };

  if (!chartOptions) {
    return <div className="loading">Preparing chart...</div>;
  }

  return (
    <div className="monthly-analysis-chart">
      <div className="filter-container">
        <label htmlFor="year-filter">Filter by Year:</label>
        <select 
          id="year-filter" 
          value={selectedYear} 
          onChange={handleYearChange}
        >
          <option value="">All Years</option>
          {availableYears.map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>
      
      <div className="chart-container">
        <HighchartsReact highcharts={Highcharts} options={chartOptions} />
      </div>
    </div>
  );
};

export default MonthlyAnalysisChart;