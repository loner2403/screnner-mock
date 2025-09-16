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

interface PEData {
  date: string;
  pe_ratio: number;
  ttm_eps: number;
  timestamp: number;
  time: number;
  price: number;
  eps: number;
  median_pe?: number;
}

interface StockChartProps {
  symbol: string;
  className?: string;
}

type TimeFrame = "1M" | "6M" | "1Yr" | "3Yr" | "5Yr" | "10Yr" | "Max";
type ChartType = "price" | "pe_ratio";

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
const CustomTooltip = ({ active, payload, label, chartType }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;

    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-2 sm:p-3 text-xs sm:text-sm max-w-xs">
        <p className="font-medium text-gray-900 mb-1 sm:mb-2 text-xs sm:text-sm">
          {new Date(data.timestamp).toLocaleDateString()}
        </p>
        {payload.map((entry: any, index: number) => {
          let displayName = entry.dataKey;
          let formattedValue = entry.value;

          // Format based on data type
          if (entry.dataKey === "price") {
            displayName = "Price";
            formattedValue = `₹${entry.value?.toFixed(2)}`;
          } else if (entry.dataKey === "volume") {
            displayName = "Volume";
            formattedValue = formatVolume(entry.value);
          } else if (entry.dataKey === "pe_ratio") {
            displayName = "PE Ratio";
            formattedValue = entry.value?.toFixed(2);
          } else if (entry.dataKey === "ttm_eps") {
            displayName = "TTM EPS";
            formattedValue = `₹${entry.value?.toFixed(2)}`;
          } else if (typeof entry.dataKey === 'string' && entry.dataKey.includes("dma")) {
            displayName = entry.dataKey.toUpperCase();
            formattedValue = `₹${entry.value?.toFixed(2)}`;
          }

          return (
            <div key={index} className="flex items-center justify-between gap-1 sm:gap-2">
              <div className="flex items-center gap-1">
                <div
                  className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-gray-600 text-xs truncate">
                  {displayName}
                </span>
              </div>
              <span className="font-mono font-medium text-xs sm:text-sm">
                {formattedValue}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  return null;
};

export default function StockChart({ symbol, className = "" }: StockChartProps) {
  const [selectedTimeFrame, setSelectedTimeFrame] = useState<TimeFrame>("1Yr");
  const [chartType, setChartType] = useState<ChartType>("price");
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [peData, setPEData] = useState<PEData[]>([]);
  const [medianPE, setMedianPE] = useState<number>(25.7);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [indicators, setIndicators] = useState(CHART_INDICATORS);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

  // Update window width on resize
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  // Fetch PE data
  const fetchPEData = async (timeframe: TimeFrame) => {
    setLoading(true);
    setError(null);

    try {
      const apiTimeframe = TIME_FRAMES.find(tf => tf.value === timeframe)?.apiValue || "1Y";
      const response = await fetch(`/api/pe-data/${symbol}?timeframe=${apiTimeframe}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch PE data: ${response.status}`);
      }

      const result = await response.json();

      if (!result.data || !Array.isArray(result.data)) {
        throw new Error("Invalid PE data format");
      }

      // Transform and enhance PE data
      const transformedPEData: PEData[] = result.data.map((item: any) => {
        const timestamp = item.timestamp || item.time * 1000; // Handle both formats
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
          pe_ratio: parseFloat((item.pe_ratio || 0).toFixed(2)),
          ttm_eps: parseFloat((item.ttm_eps || item.eps || 0).toFixed(2)),
          timestamp: timestamp,
          time: item.time || Math.floor(timestamp / 1000),
          price: parseFloat((item.price || 0).toFixed(2)),
          eps: parseFloat((item.eps || item.ttm_eps || 0).toFixed(2)),
          median_pe: result.median_pe || 25.7
        };
      });

      setPEData(transformedPEData);
      setMedianPE(result.median_pe || 25.7);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch PE data");
      console.error("PE data fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Effect to fetch data when symbol, timeframe, or chart type changes
  useEffect(() => {
    if (chartType === "price") {
      fetchChartData(selectedTimeFrame);
    } else if (chartType === "pe_ratio") {
      fetchPEData(selectedTimeFrame);
    }
  }, [symbol, selectedTimeFrame, chartType]);

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
    if (chartType === "price") {
      if (chartData.length === 0) return { min: 0, max: 1000 };

      const prices = chartData.map(d => d.price);
      const min = Math.min(...prices);
      const max = Math.max(...prices);

      return { min: min * 0.95, max: max * 1.05 };
    } else {
      if (peData.length === 0) return { min: 0, max: 50 };

      const peValues = peData.map(d => d.pe_ratio);
      const min = Math.min(...peValues);
      const max = Math.max(...peValues);

      return { min: min * 0.9, max: max * 1.1 };
    }
  }, [chartData, peData, chartType]);

  // Responsive chart margins
  const chartMargins = useMemo(() => {
    if (windowWidth < 640) {
      return { top: 15, right: 25, bottom: 15, left: 25 };
    } else if (windowWidth < 1024) {
      return { top: 20, right: 40, bottom: 25, left: 40 };
    } else {
      return { top: 20, right: 60, bottom: 30, left: 50 };
    }
  }, [windowWidth]);

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
      <div className={`h-64 sm:h-80 md:h-96 lg:h-[28rem] flex items-center justify-center ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-xs sm:text-sm text-gray-500">Loading chart data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`h-64 sm:h-80 md:h-96 lg:h-[28rem] flex items-center justify-center ${className}`}>
        <div className="text-center px-4">
          <p className="text-sm sm:text-base text-red-600 mb-2">Error loading chart</p>
          <p className="text-xs sm:text-sm text-gray-500 mb-3">{error}</p>
          <Button
            onClick={() => chartType === "price" ? fetchChartData(selectedTimeFrame) : fetchPEData(selectedTimeFrame)}
            variant="outline"
            size="sm"
            className="text-xs sm:text-sm"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border overflow-hidden ${className}`}>
      {/* Header with time frame selector */}
      <div className="p-3 sm:p-4 border-b">
        {/* Time frame buttons - responsive layout */}
        <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-3 sm:mb-0">
          {TIME_FRAMES.map((timeFrame) => (
            <Button
              key={timeFrame.value}
              onClick={() => setSelectedTimeFrame(timeFrame.value)}
              variant={selectedTimeFrame === timeFrame.value ? "default" : "ghost"}
              size="sm"
              className={`px-2 sm:px-3 py-1 text-xs sm:text-sm ${
                selectedTimeFrame === timeFrame.value
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {timeFrame.label}
            </Button>
          ))}
        </div>

        {/* Controls - responsive layout */}
        <div className="flex flex-wrap items-center gap-1 sm:gap-2 justify-center sm:justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="text-xs sm:text-sm px-2 sm:px-3">
                {chartType === "price" ? "Price" : "PE Ratio"} <ChevronDown className="ml-1 h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setChartType("price")}>Price</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setChartType("pe_ratio")}>PE Ratio</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {chartType === "pe_ratio" && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="text-xs sm:text-sm px-2 sm:px-3">
                  <span className="hidden sm:inline">PE Ratio</span>
                  <span className="sm:hidden">PE</span>
                  <ChevronDown className="ml-1 h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Sales & Margin</DropdownMenuItem>
                <DropdownMenuItem>EV / EBITDA</DropdownMenuItem>
                <DropdownMenuItem>Price to Book</DropdownMenuItem>
                <DropdownMenuItem>Market Cap / Sales</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="text-xs sm:text-sm px-2 sm:px-3">
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

          <Button variant="outline" size="sm" className="text-xs sm:text-sm px-2 sm:px-3">
            <Bell className="h-3 w-3 mr-1" />
            <span className="hidden sm:inline">Alerts</span>
          </Button>
        </div>
      </div>

      {/* Chart */}
      <div className="p-2 sm:p-4">
        <ChartContainer config={chartConfig} className="h-64 sm:h-80 md:h-96 lg:h-[28rem] w-full">
          {chartType === "price" ? (
            <ComposedChart
              data={chartData}
              margin={chartMargins}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: windowWidth < 640 ? 9 : windowWidth < 1024 ? 10 : 11, fill: '#666' }}
                interval={windowWidth < 640 ? 'preserveStartEnd' : 'preserveStart'}
                padding={{ left: 0, right: 0 }}
              />
              <YAxis
                yAxisId="price"
                orientation="right"
                domain={[priceRange.min, priceRange.max]}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: windowWidth < 640 ? 9 : windowWidth < 1024 ? 10 : 11, fill: '#666' }}
                tickFormatter={(value) => windowWidth < 640 ? `₹${value.toFixed(0)}` : `₹${value.toFixed(2)}`}
                width={windowWidth < 640 ? 25 : windowWidth < 1024 ? 40 : 50}
              />
              <YAxis
                yAxisId="volume"
                orientation="left"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: windowWidth < 640 ? 9 : windowWidth < 1024 ? 10 : 11, fill: '#666' }}
                tickFormatter={formatVolume}
                width={windowWidth < 640 ? 25 : windowWidth < 1024 ? 35 : 45}
              />

              <Tooltip content={<CustomTooltip chartType={chartType} />} />

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
          ) : (
            <ComposedChart
              data={peData}
              margin={chartMargins}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: windowWidth < 640 ? 9 : windowWidth < 1024 ? 10 : 11, fill: '#666' }}
                interval={windowWidth < 640 ? 'preserveStartEnd' : 'preserveStart'}
                padding={{ left: 0, right: 0 }}
              />
              <YAxis
                yAxisId="pe"
                orientation="right"
                domain={[priceRange.min, priceRange.max]}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: windowWidth < 640 ? 9 : windowWidth < 1024 ? 10 : 11, fill: '#666' }}
                tickFormatter={(value) => value.toFixed(1)}
                width={windowWidth < 640 ? 25 : windowWidth < 1024 ? 40 : 50}
              />
              <YAxis
                yAxisId="eps"
                orientation="left"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: windowWidth < 640 ? 9 : windowWidth < 1024 ? 10 : 11, fill: '#666' }}
                tickFormatter={(value) => `₹${value.toFixed(0)}`}
                width={windowWidth < 640 ? 25 : windowWidth < 1024 ? 35 : 45}
              />

              <Tooltip content={<CustomTooltip chartType={chartType} />} />

              {/* TTM EPS bars - render first (background) */}
              <Bar
                yAxisId="eps"
                dataKey="ttm_eps"
                fill="#87ceeb"
                opacity={0.6}
                name="TTM EPS"
              />

              {/* PE ratio line - render on top */}
              <Line
                yAxisId="pe"
                type="monotone"
                dataKey="pe_ratio"
                stroke="#6366f1"
                strokeWidth={2}
                dot={false}
                name="PE"
                connectNulls={false}
              />

              {/* Median PE line - rendered as reference line */}
              {peData.length > 0 && (
                <Line
                  yAxisId="pe"
                  type="monotone"
                  dataKey="median_pe"
                  stroke="#9ca3af"
                  strokeWidth={1}
                  strokeDasharray="5 5"
                  dot={false}
                  name={`Median PE = ${medianPE.toFixed(1)}`}
                />
              )}
            </ComposedChart>
          )}
        </ChartContainer>
      </div>

      {/* Legend/Controls */}
      <div className="px-3 sm:px-4 pb-3 sm:pb-4">
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 justify-center sm:justify-start">
          {chartType === "price" ? (
            indicators.map((indicator) => (
              <div key={indicator.id} className="flex items-center space-x-1 sm:space-x-2">
                <Checkbox
                  id={indicator.id}
                  checked={indicator.checked}
                  onCheckedChange={() => toggleIndicator(indicator.id)}
                  className="h-3 w-3 sm:h-4 sm:w-4"
                />
                <label
                  htmlFor={indicator.id}
                  className="text-xs sm:text-sm font-medium cursor-pointer flex items-center space-x-1"
                >
                  <div
                    className="w-2 sm:w-3 h-0.5 rounded"
                    style={{ backgroundColor: indicator.color }}
                  />
                  <span className="whitespace-nowrap">{indicator.label}</span>
                </label>
              </div>
            ))
          ) : (
            <>
              <div className="flex items-center space-x-1 sm:space-x-2">
                <Checkbox id="pe" checked={true} disabled className="h-3 w-3 sm:h-4 sm:w-4" />
                <label className="text-xs sm:text-sm font-medium cursor-pointer flex items-center space-x-1">
                  <div className="w-2 sm:w-3 h-0.5 rounded" style={{ backgroundColor: "#6366f1" }} />
                  <span className="whitespace-nowrap">PE</span>
                </label>
              </div>
              <div className="flex items-center space-x-1 sm:space-x-2">
                <Checkbox id="median_pe" checked={true} disabled className="h-3 w-3 sm:h-4 sm:w-4" />
                <label className="text-xs sm:text-sm font-medium cursor-pointer flex items-center space-x-1">
                  <div className="w-2 sm:w-3 h-0.5 rounded border-dashed" style={{ borderColor: "#9ca3af" }} />
                  <span className="whitespace-nowrap">Median PE = {medianPE.toFixed(1)}</span>
                </label>
              </div>
              <div className="flex items-center space-x-1 sm:space-x-2">
                <Checkbox id="ttm_eps" checked={true} disabled className="h-3 w-3 sm:h-4 sm:w-4" />
                <label className="text-xs sm:text-sm font-medium cursor-pointer flex items-center space-x-1">
                  <div className="w-2 sm:w-3 h-0.5 rounded" style={{ backgroundColor: "#87ceeb" }} />
                  <span className="whitespace-nowrap">TTM EPS</span>
                </label>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}