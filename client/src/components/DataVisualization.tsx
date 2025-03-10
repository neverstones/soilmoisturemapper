import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { SoilMoistureData } from '@shared/schema';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

interface DataVisualizationProps {
  soilMoistureData?: {
    data: SoilMoistureData[];
    regions: any[];
    trends?: any[];
  };
  isLoading: boolean;
  isError: boolean;
  timeStep: string;
}

const DataVisualization: React.FC<DataVisualizationProps> = ({ 
  soilMoistureData, 
  isLoading, 
  isError,
  timeStep
}) => {
  const [chartTimeRange, setChartTimeRange] = useState('3months');

  // Get status color based on value
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'normal':
        return 'bg-green-100 text-green-800';
      case 'above normal':
        return 'bg-blue-100 text-blue-800';
      case 'moderate drought':
        return 'bg-yellow-100 text-yellow-800';
      case 'severe drought':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get sign and color for change value
  const getChangeDisplay = (change: number) => {
    const sign = change >= 0 ? '+' : '';
    const color = change >= 0 ? 'text-green-600' : 'text-red-600';
    return <span className={color}>{sign}{change.toFixed(2)}</span>;
  };

  // Format trend data for chart based on selected time range
  const getTrendData = () => {
    if (!soilMoistureData?.trends) return [];
    
    // Filter data based on selected time range
    const now = new Date();
    let startDate = new Date();
    
    switch (chartTimeRange) {
      case '3months':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case '6months':
        startDate.setMonth(now.getMonth() - 6);
        break;
      case '1year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(now.getMonth() - 3);
    }
    
    // Return filtered data
    return soilMoistureData.trends.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate >= startDate && itemDate <= now;
    });
  };
  
  // Create mock trend data for demonstration
  const createMockTrendData = () => {
    const data = [];
    const now = new Date();
    let date = new Date();
    date.setMonth(now.getMonth() - 12);
    
    const regions = ['North Region', 'Southern Valley'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Generate monthly data points
    for (let i = 0; i < 12; i++) {
      date.setMonth(date.getMonth() + 1);
      const monthName = months[date.getMonth()];
      
      const dataPoint: any = {
        name: monthName
      };
      
      dataPoint['North Region'] = 0.35 + Math.random() * 0.15;
      dataPoint['Southern Valley'] = 0.2 + Math.random() * 0.15;
      
      data.push(dataPoint);
    }
    
    return data;
  };

  // Use actual trend data from API, fall back to empty array if not available
  const trendData = soilMoistureData?.trends || [];
  
  return (
    <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Statistics Card */}
      <Card className="shadow-md overflow-hidden">
        <CardHeader className="px-4 py-3 border-b border-gray-200">
          <CardTitle className="text-base font-medium text-gray-800">
            Soil Moisture Statistics
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : isError ? (
            <div className="text-center py-6 text-red-500">
              Error loading soil moisture data. Please try again.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Region</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Value</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Average</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Change</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {soilMoistureData && soilMoistureData.data ? (
                    soilMoistureData.data.map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 text-sm text-gray-900">{item.region}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{item.value.toFixed(2)}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{item.average.toFixed(2)}</td>
                        <td className="px-4 py-2 text-sm">
                          {getChangeDisplay(item.value - item.average)}
                        </td>
                        <td className="px-4 py-2 text-sm">
                          <Badge variant="outline" className={`${getStatusColor(item.status)}`}>
                            {item.status}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-4 py-4 text-sm text-center text-gray-500">
                        No data available. Set date range and region parameters and click "Apply".
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Chart Card */}
      <Card className="shadow-md overflow-hidden">
        <CardHeader className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
          <CardTitle className="text-base font-medium text-gray-800">
            Temporal Trend
          </CardTitle>
          <Select 
            value={chartTimeRange} 
            onValueChange={setChartTimeRange}
          >
            <SelectTrigger className="w-[180px] h-8 text-sm">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3months">Last 3 Months</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="1year">Last Year</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="p-4">
          {isLoading ? (
            <Skeleton className="h-[250px] w-full" />
          ) : isError ? (
            <div className="text-center py-8 text-red-500">
              Error loading trend data. Please try again.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart
                data={trendData}
                margin={{
                  top: 10,
                  right: 30,
                  left: 0,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 0.6]} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="North Region"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="Southern Valley"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DataVisualization;
