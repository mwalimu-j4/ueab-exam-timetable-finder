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
  // Comprehensive data validation
  if (!data) {
    console.warn('[AnalyticsChart] Data is undefined');
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
        No visitor data available
      </div>
    );
  }

  if (!Array.isArray(data)) {
    console.error('[AnalyticsChart] Data is not an array:', typeof data, data);
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
        Invalid data format
      </div>
    );
  }

  if (data.length === 0) {
    console.log('[AnalyticsChart] Data array is empty');
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
        No visitor data for selected range
      </div>
    );
  }

  // Validate and transform data for Recharts
  const chartData = data
    .filter((item) => {
      // Filter out invalid items
      if (!item || typeof item !== 'object') {
        console.warn('[AnalyticsChart] Invalid item:', item);
        return false;
      }
      if (!item.date || typeof item.date !== 'string') {
        console.warn('[AnalyticsChart] Invalid date:', item);
        return false;
      }
      return true;
    })
    .map((item, index) => {
      try {
        // Parse and format date safely
        const dateObj = parseISO(item.date);
        if (isNaN(dateObj.getTime())) {
          throw new Error('Invalid date');
        }
        
        return {
          date: format(dateObj, 'MMM dd'),
          fullDate: item.date,
          count: typeof item.count === 'number' ? item.count : 0,
          index, // Unique key for React
        };
      } catch (error) {
        console.warn('[AnalyticsChart] Date parsing error:', item.date, error);
        // Return fallback with raw date
        return {
          date: item.date?.slice(5, 10) || `Day ${index + 1}`,
          fullDate: item.date || '',
          count: typeof item.count === 'number' ? item.count : 0,
          index,
        };
      }
    });

  // Final validation - ensure we have valid chart data
  if (!chartData || chartData.length === 0) {
    console.warn('[AnalyticsChart] No valid chart data after transformation');
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
        Unable to display chart data
      </div>
    );
  }

  console.log('[AnalyticsChart] Rendering chart with', chartData.length, 'data points');

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
            allowDataOverflow={false}
          />
          <YAxis 
            allowDecimals={false}
            tick={{ fontSize: 12 }}
            tickLine={false}
            allowDataOverflow={false}
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
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
