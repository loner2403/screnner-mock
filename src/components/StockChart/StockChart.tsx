"use client";

import { useState, useEffect, useMemo } from "react";
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Legend
} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { ChevronDown, Bell } from "lucide-react";

interface ChartData {
  date: string;
  price: number;
  volume: number;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  dma50?: number;
  dma200?: number;
}

interface StockChartProps {
  symbol: string;
  className?: string;
}

type TimeFrame = "1M" | "6M" | "1Yr" | "3Yr" | "5Yr" | "10Yr" | "Max";

const TIME_FRAMES: { label: string; value: TimeFrame; apiValue: string }[] = [
  { label: "1M", value: "1M", apiValue: "1M" },
  { label: "6M", value: "6M", apiValue: "6M" },
  { label: "1Yr", value: "1Yr", apiValue: "1Y" },
  { label: "3Yr", value: "3Yr", apiValue: "3Y" },
  { label: "5Yr", value: "5Yr", apiValue: "5Y" },
  { label: "10Yr", value: "10Yr", apiValue: "5Y" },
  { label: "Max", value: "Max", apiValue: "5Y" }
];

const CHART_INDICATORS = [
  { id: "price", label: "Price on NSE", color: "#6366f1", checked: true },
  { id: "dma50", label: "50 DMA", color: "#10b981", checked: false },
  { id: "dma200", label: "200 DMA", color: "#f59e0b", checked: false },
  { id: "volume", label: "Volume", color: "#a855f7", checked: true }
];

// Calculate moving averages - shows values for all data points
const calculateDMA = (data: ChartData[], period: number): number[] => {
  const result: number[] = [];
  
  for (let i = 0; i < data.length; i++) {
    // For early periods, use available data points (minimum 1 point)
    const startIndex = Math.max(0, i - period + 1);
    const dataSlice = data.slice(startIndex, i + 1);
    const sum = dataSlice.reduce((acc, item) => acc + item.close, 0);
    const average = sum / dataSlice.length;
    result.push(average);
  }
  
  return result;
};

// Format currency - always show exact price
const formatCurrency = (value: number): string => {
  return `₹${value.toFixed(2)}`;
};

// Format volume
const formatVolume = (value: number): string => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}k`;
  }
  return value.toString();
};

// Custom tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs">
        <p className="font-medium text-gray-900 mb-2">{new Date(data.timestamp).toLocaleDateString()}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-600">{entry.dataKey === "price" ? "Price" : entry.dataKey === "volume" ? "Volume" : entry.dataKey}</span>
            </div>
            <span className="font-mono font-medium">
              {entry.dataKey === "volume" 
                ? formatVolume(entry.value) 
                : `₹${entry.value?.toFixed(2)}`
              }
            </span>
          </div>
        ))}
      </div>
    );
  }
  
  return null;
};

export default function StockChart({ symbol, className = "" }: StockChartProps) {
  const [selectedTimeFrame, setSelectedTimeFrame] = useState<TimeFrame>("1Yr");
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [indicators, setIndicators] = useState(CHART_INDICATORS);

  // Fetch chart data
  const fetchChartData = async (timeframe: TimeFrame) => {
    setLoading(true);
    setError(null);
    
    try {
      const apiTimeframe = TIME_FRAMES.find(tf => tf.value === timeframe)?.apiValue || "1Y";
      const response = await fetch(`/api/charts/${symbol}?timeframe=${apiTimeframe}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch chart data: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.data || !Array.isArray(result.data)) {
        throw new Error("Invalid chart data format");
      }

      // Transform and enhance data
      const transformedData: ChartData[] = result.data.map((item: any) => {
        const timestamp = item.timestamp;
        const date = new Date(timestamp);
        
        // Format date based on timeframe
        let dateFormat;
        if (["1M", "3M"].includes(selectedTimeFrame)) {
          dateFormat = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        } else if (["6M", "1Yr"].includes(selectedTimeFrame)) {
          dateFormat = date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
        } else {
          dateFormat = date.toLocaleDateString("en-US", { year: "numeric" });
        }
        
        return {
          date: dateFormat,
          price: parseFloat(item.close.toFixed(2)),
          volume: item.volume,
          timestamp: timestamp,
          open: parseFloat(item.open.toFixed(2)),
          high: parseFloat(item.high.toFixed(2)),
          low: parseFloat(item.low.toFixed(2)),
          close: parseFloat(item.close.toFixed(2))
        };
      });

      // Calculate moving averages
      const dma50 = calculateDMA(transformedData, 50);
      const dma200 = calculateDMA(transformedData, 200);

      // Add DMA data - now shows for all data points
      const enhancedData = transformedData.map((item, index) => ({
        ...item,
        dma50: dma50[index],
        dma200: dma200[index]
      }));

      setChartData(enhancedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch chart data");
      console.error("Chart data fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Effect to fetch data when symbol or timeframe changes
  useEffect(() => {
    fetchChartData(selectedTimeFrame);
  }, [symbol, selectedTimeFrame]);

  // Toggle indicator visibility
  const toggleIndicator = (indicatorId: string) => {
    setIndicators(prev => 
      prev.map(indicator => 
        indicator.id === indicatorId 
          ? { ...indicator, checked: !indicator.checked }
          : indicator
      )
    );
  };

  // Calculate price range for secondary Y-axis positioning
  const priceRange = useMemo(() => {
    if (chartData.length === 0) return { min: 0, max: 1000 };
    
    const prices = chartData.map(d => d.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    
    return { min: min * 0.95, max: max * 1.05 };
  }, [chartData]);

  // Chart configuration
  const chartConfig = {
    price: {
      label: "Price on NSE",
      color: "#6366f1",
    },
    volume: {
      label: "Volume",
      color: "#a855f7",
    },
    dma50: {
      label: "50 DMA",
      color: "#10b981",
    },
    dma200: {
      label: "200 DMA",
      color: "#f59e0b",
    },
  };

  if (loading) {
    return (
      <div className={`h-96 flex items-center justify-center ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-500">Loading chart data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`h-96 flex items-center justify-center ${className}`}>
        <div className="text-center">
          <p className="text-red-600 mb-2">Error loading chart</p>
          <p className="text-sm text-gray-500">{error}</p>
          <Button 
            onClick={() => fetchChartData(selectedTimeFrame)}
            variant="outline"
            size="sm"
            className="mt-2"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border ${className}`}>
      {/* Header with time frame selector */}
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center space-x-1">
          {TIME_FRAMES.map((timeFrame) => (
            <Button
              key={timeFrame.value}
              onClick={() => setSelectedTimeFrame(timeFrame.value)}
              variant={selectedTimeFrame === timeFrame.value ? "default" : "ghost"}
              size="sm"
              className={`px-3 py-1 text-xs ${
                selectedTimeFrame === timeFrame.value 
                  ? "bg-blue-600 text-white" 
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {timeFrame.label}
            </Button>
          ))}
        </div>

        <div className="flex items-center space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="text-xs">
                Price <ChevronDown className="ml-1 h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Price</DropdownMenuItem>
              <DropdownMenuItem>PE Ratio</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="text-xs">
                PE Ratio <ChevronDown className="ml-1 h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Sales & Margin</DropdownMenuItem>
              <DropdownMenuItem>EV / EBITDA</DropdownMenuItem>
              <DropdownMenuItem>Price to Book</DropdownMenuItem>
              <DropdownMenuItem>Market Cap / Sales</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="text-xs">
                More <ChevronDown className="ml-1 h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Sales & Margin</DropdownMenuItem>
              <DropdownMenuItem>EV / EBITDA</DropdownMenuItem>
              <DropdownMenuItem>Price to Book</DropdownMenuItem>
              <DropdownMenuItem>Market Cap / Sales</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" size="sm" className="text-xs">
            <Bell className="h-3 w-3 mr-1" />
            Alerts
          </Button>
        </div>
      </div>

      {/* Chart */}
      <div className="p-4">
        <ChartContainer config={chartConfig} className="h-96 w-full">
          <ComposedChart
            data={chartData}
            margin={{
              top: 20,
              right: 100,
              bottom: 30,
              left: 80,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="date" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#666' }}
            />
            <YAxis 
              yAxisId="price"
              orientation="right"
              domain={[priceRange.min, priceRange.max]}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#666' }}
              tickFormatter={(value) => `₹${value.toFixed(2)}`}
            />
            <YAxis 
              yAxisId="volume"
              orientation="left"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#666' }}
              tickFormatter={formatVolume}
            />
            
            <Tooltip content={<CustomTooltip />} />
            
            {/* Volume bars */}
            {indicators.find(i => i.id === "volume")?.checked && (
              <Bar 
                yAxisId="volume"
                dataKey="volume" 
                fill="#a855f7" 
                opacity={0.3}
                name="Volume"
              />
            )}
            
            {/* Price line */}
            {indicators.find(i => i.id === "price")?.checked && (
              <Line 
                yAxisId="price"
                type="monotone" 
                dataKey="price" 
                stroke="#6366f1" 
                strokeWidth={2}
                dot={false}
                name="Price on NSE"
              />
            )}
            
            {/* 50 DMA line */}
            {indicators.find(i => i.id === "dma50")?.checked && (
              <Line 
                yAxisId="price"
                type="monotone" 
                dataKey="dma50" 
                stroke="#10b981" 
                strokeWidth={1}
                dot={false}
                name="50 DMA"
                connectNulls={false}
              />
            )}
            
            {/* 200 DMA line */}
            {indicators.find(i => i.id === "dma200")?.checked && (
              <Line 
                yAxisId="price"
                type="monotone" 
                dataKey="dma200" 
                stroke="#f59e0b" 
                strokeWidth={1}
                dot={false}
                name="200 DMA" 
                connectNulls={false}
              />
            )}
          </ComposedChart>
        </ChartContainer>
      </div>

      {/* Legend/Controls */}
      <div className="px-4 pb-4">
        <div className="flex flex-wrap items-center gap-4">
          {indicators.map((indicator) => (
            <div key={indicator.id} className="flex items-center space-x-2">
              <Checkbox
                id={indicator.id}
                checked={indicator.checked}
                onCheckedChange={() => toggleIndicator(indicator.id)}
              />
              <label
                htmlFor={indicator.id}
                className="text-xs font-medium cursor-pointer flex items-center space-x-1"
              >
                <div 
                  className="w-3 h-0.5 rounded"
                  style={{ backgroundColor: indicator.color }}
                />
                <span>{indicator.label}</span>
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}