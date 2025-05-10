import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const defaultData = [
  { year: 2000, youth: 25, workingAge: 60, elderly: 15 },
  { year: 2005, youth: 23, workingAge: 62, elderly: 15 },
  { year: 2010, youth: 21, workingAge: 63, elderly: 16 },
  { year: 2015, youth: 20, workingAge: 62, elderly: 18 },
  { year: 2020, youth: 18, workingAge: 60, elderly: 22 },
  { year: 2025, youth: 17, workingAge: 58, elderly: 25 },
];

interface TrendChartProps {
  title?: string;
  data?: Array<{ year: number; youth: number; workingAge: number; elderly: number }>;
  className?: string;
}

const TrendChart: React.FC<TrendChartProps> = ({
  title = 'Demographic Trends',
  data = defaultData,
  className = '',
}) => {
  return (
    <div className={`bg-white p-4 rounded-lg shadow-md ${className}`}>
      <h3 className="text-xl font-semibold text-gem-dark mb-4">{title}</h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" type="number" domain={['dataMin', 'dataMax']} tickCount={6} />
            <YAxis
              domain={[0, 100]}
              label={{
                value: 'Percentage (%)',
                angle: -90,
                position: 'insideLeft',
                style: { textAnchor: 'middle' },
              }}
            />
            <Tooltip formatter={(value: number) => `${value}%`} />
            <Legend />
            <Line
              type="monotone"
              dataKey="youth"
              name="Youth (0-14)"
              stroke="#8884d8"
              strokeWidth={2}
              activeDot={{ r: 8 }}
            />
            <Line
              type="monotone"
              dataKey="workingAge"
              name="Working Age (15-64)"
              stroke="#115740"
              strokeWidth={2}
              activeDot={{ r: 8 }}
            />
            <Line
              type="monotone"
              dataKey="elderly"
              name="Elderly (65+)"
              stroke="#ff7300"
              strokeWidth={2}
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="text-sm text-gray-500 mt-2 text-center">
        Population structure changes over time (percentage of total population)
      </p>
    </div>
  );
};

export default TrendChart;
