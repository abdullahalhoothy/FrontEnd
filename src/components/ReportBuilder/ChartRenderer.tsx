import React from 'react';
import DemographicChart from '../DemographicChart/DemographicChart';
import PopulationPyramid from '../DemographicChart/PopulationPyramid';
import TrendChart from '../DemographicChart/TrendChart';
import DemographicInfoCard from './DemographicInfoCard';

interface ChartMapping {
  [key: string]: React.FC<any>;
}

type ChartDataType = {
  'demographic-chart': Array<{ ageGroup: string; male: number; female: number }>;
  'population-pyramid': Array<{ ageGroup: string; male: number; female: number }>;
  'trend-chart': Array<{ year: number; youth: number; workingAge: number; elderly: number }>;
  'demographic-card': {
    malePercentage: number;
    malePopulation: number;
    totalPopulation: number;
    saudiPercentage: number;
    saudiPopulation: number;
    averageIncome: number;
  };
  [key: string]: any;
};

const chartComponents: ChartMapping = {
  'demographic-chart': DemographicChart,
  'population-pyramid': PopulationPyramid,
  'trend-chart': TrendChart,
  'demographic-card': DemographicInfoCard,
};

const chartData: ChartDataType = {
  'demographic-chart': [
    { ageGroup: '0-14', male: 10, female: 9 },
    { ageGroup: '15-24', male: 12, female: 11 },
    { ageGroup: '25-34', male: 15, female: 14 },
    { ageGroup: '35-44', male: 13, female: 14 },
    { ageGroup: '45-54', male: 11, female: 12 },
    { ageGroup: '55-64', male: 8, female: 9 },
    { ageGroup: '65+', male: 7, female: 9 },
  ],
  'population-pyramid': [
    { ageGroup: '0-14', male: -10, female: 9 },
    { ageGroup: '15-24', male: -12, female: 11 },
    { ageGroup: '25-34', male: -15, female: 14 },
    { ageGroup: '35-44', male: -13, female: 14 },
    { ageGroup: '45-54', male: -11, female: 12 },
    { ageGroup: '55-64', male: -8, female: 9 },
    { ageGroup: '65+', male: -7, female: 9 },
  ],
  'trend-chart': [
    { year: 2000, youth: 25, workingAge: 60, elderly: 15 },
    { year: 2005, youth: 23, workingAge: 62, elderly: 15 },
    { year: 2010, youth: 21, workingAge: 63, elderly: 16 },
    { year: 2015, youth: 20, workingAge: 62, elderly: 18 },
    { year: 2020, youth: 18, workingAge: 60, elderly: 22 },
    { year: 2025, youth: 17, workingAge: 58, elderly: 25 },
  ],
  'demographic-card': {
    malePercentage: 55.7,
    malePopulation: 3.6,
    totalPopulation: 6.5,
    saudiPercentage: 66.5,
    saudiPopulation: 4.3,
    averageIncome: 7.5,
  },
  'scatter-plot': [
    { femalePopulation: 10, malePopulation: 9 },
    { femalePopulation: 12, malePopulation: 11 },
  ],
};

interface ChartRendererProps {
  chartId: string;
  title?: string;
  className?: string;
}

const ChartRenderer: React.FC<ChartRendererProps> = ({ chartId, title, className = '' }) => {
  const chartType = chartId.includes('-')
    ? chartId.split('-').slice(-2).join('-') // Get the last two segments
    : chartId;

  if (!chartComponents[chartType]) {
    console.log();
    return (
      <div className={`p-4 text-center bg-gray-100 rounded ${className}`}>
        Chart type not found: {chartType}
      </div>
    );
  }

  const ChartComponent = chartComponents[chartType];
  const data = chartData[chartType] || [];

  if (chartType === 'demographic-card') {
    return (
      <div className={`chart-container ${className}`}>
        <ChartComponent />
      </div>
    );
  }

  return (
    <div className={`chart-container ${className}`}>
      <ChartComponent data={data} title={title || `${chartType} Chart`} />
    </div>
  );
};

export default ChartRenderer;
export { chartComponents, chartData };
