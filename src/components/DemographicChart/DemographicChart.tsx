import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const demoData = [
  { ageGroup: '0-14', male: 10, female: 9 },
  { ageGroup: '15-24', male: 12, female: 11 },
  { ageGroup: '25-34', male: 15, female: 14 },
  { ageGroup: '35-44', male: 13, female: 14 },
  { ageGroup: '45-54', male: 11, female: 12 },
  { ageGroup: '55-64', male: 8, female: 9 },
  { ageGroup: '65+', male: 7, female: 9 },
];

interface DemographicChartProps {
  title?: string;
  data?: Array<{ ageGroup: string; male: number; female: number }>;
  className?: string;
}

const DemographicChart: React.FC<DemographicChartProps> = ({
  title = 'Population Demographics',
  data = demoData,
  className = '',
}) => {
  return (
    <div className={`bg-white p-4 rounded-lg shadow-md ${className}`}>
      <h3 className="text-xl font-semibold text-gem-dark mb-4">{title}</h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="ageGroup" type="category" />
            <Tooltip formatter={value => `${value}%`} />
            <Legend />
            <Bar dataKey="male" name="Male" fill="#115740" />
            <Bar dataKey="female" name="Female" fill="#28a745" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DemographicChart;
