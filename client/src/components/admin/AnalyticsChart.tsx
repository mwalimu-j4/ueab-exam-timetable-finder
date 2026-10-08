import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { format, parseISO } from 'date-fns';

interface AnalyticsChartProps {
  data: Array<{ date: string; count: number }>;
}

export function AnalyticsChart({ data }: AnalyticsChartProps) {
  // Handle undefined or empty data
  if (!data || data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
        No visitor data for selected range
      </div>
    );
  }

  // Format data for chart with safe date handling
  const chartData = data.map((item) => {
    try {
      const dateObj = parseISO(item.date);
      return {
        date: format(dateObj, 'MMM dd'),
        fullDate: item.date,
        count: item.count || 0,
      };
    } catch (error) {
      // Fallback for invalid dates
      return {
        date: item.date || 'Invalid',
        fullDate: item.date || '',
        count: item.count || 0,
      };
    }
  });

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart 
          data={chartData}
          margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="date"
            tick={{ fontSize: 12 }}
            tickLine={false}
          />
          <YAxis 
            allowDecimals={false}
            tick={{ fontSize: 12 }}
            tickLine={false}
            label={{ 
              value: 'Visitors', 
              angle: -90, 
              position: 'insideLeft',
              style: { fontSize: 12 }
            }}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              padding: '0.5rem',
            }}
            labelFormatter={(value) => {
              const item = chartData.find(d => d.date === value);
              return item?.fullDate || value;
            }}
          />
          <Legend 
            wrapperStyle={{ fontSize: 12 }}
            iconType="line"
          />
          <Line
            type="monotone"
            dataKey="count"
            name="Unique Visitors"
            stroke="#8A3FD8"
            strokeWidth={2}
            dot={{ fill: '#8A3FD8', r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
