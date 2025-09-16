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
  Tooltip
} from "recharts";
import { Button } from "@/components/ui/button";
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
  ttm_eps_bar?: number | null;
}

interface MarketCapSalesData {
  date: string;
  market_cap_sales_ratio: number;
  quarterly_sales: number;
  timestamp: number;
  time: number;
  market_cap: number;
  sales: number;
  median_market_cap_sales?: number;
  quarterly_sales_bar?: number | null;
}

interface StockChartProps {
  symbol: string;
  className?: string;
}

type TimeFrame = "1M" | "6M" | "1Yr" | "3Yr" | "5Yr" | "10Yr" | "Max";
type ChartType = "price" | "pe_ratio" | "market_cap_sales";

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
const CustomTooltip = ({ active, payload, chartType }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;

    // Format date consistently across all charts as "01 Aug 25"
    const formatDate = (timestamp: number) => {
      const date = new Date(timestamp);
      return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "2-digit"
      });
    };

    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-2 sm:p-3 text-xs sm:text-sm max-w-xs">
        <p className="font-medium text-gray-900 mb-1 sm:mb-2 text-xs sm:text-sm">
          {formatDate(data.timestamp)}
        </p>
        {/* For PE ratio chart, always show TTM EPS even if no bar on this day */}
        {chartType === "pe_ratio" && data.ttm_eps && (
          <div className="flex items-center justify-between gap-1 sm:gap-2 mb-1">
            <div className="flex items-center gap-1">
              <div
                className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full"
                style={{ backgroundColor: "#87ceeb" }}
              />
              <span className="text-gray-600 text-xs truncate">
                TTM EPS
              </span>
            </div>
            <span className="font-mono font-medium text-xs sm:text-sm">
              ₹{data.ttm_eps.toFixed(2)}
            </span>
          </div>
        )}
        {payload.map((entry: any, index: number) => {
          let displayName = entry.dataKey;
          let formattedValue = entry.value;

          // Skip TTM EPS/Sales entries since we handle them separately above
          if (entry.dataKey === "ttm_eps" || entry.dataKey === "ttm_eps_bar" ||
              entry.dataKey === "quarterly_sales" || entry.dataKey === "quarterly_sales_bar") {
            return null;
          }

          // For market_cap_sales chart, only show the ratio
          if (chartType === "market_cap_sales" && entry.dataKey !== "market_cap_sales_ratio") {
            return null;
          }

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
          } else if (entry.dataKey === "market_cap_sales_ratio") {
            displayName = "Market Cap to Sales";
            formattedValue = entry.value?.toFixed(1);
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
  const [marketCapSalesData, setMarketCapSalesData] = useState<MarketCapSalesData[]>([]);
  const [medianPE, setMedianPE] = useState<number>(25.7);
  const [medianMarketCapSales, setMedianMarketCapSales] = useState<number>(4.3);
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

        // Format date based on timeframe - more helpful labels
        let dateFormat;
        if (selectedTimeFrame === "1M") {
          dateFormat = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        } else if (selectedTimeFrame === "6M") {
          dateFormat = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        } else if (selectedTimeFrame === "1Yr") {
          // Show month and year for 1Y - more helpful than just month-year
          dateFormat = date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
        } else if (selectedTimeFrame === "3Yr") {
          // Show month and year for 3Y view - more helpful than quarters
          dateFormat = date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
        } else if (selectedTimeFrame === "5Yr") {
          // Show years for 5Y view - but full year for clarity
          dateFormat = date.toLocaleDateString("en-US", { year: "numeric" });
        } else {
          // 10Yr, Max - show full years
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

      // Transform and enhance PE data - keep ALL daily data points
      const transformedPEData: PEData[] = result.data.map((item: any) => {
        const timestamp = item.timestamp || item.time * 1000; // Handle both formats
        const date = new Date(timestamp);

        // Format date based on timeframe - more helpful labels
        let dateFormat;
        if (selectedTimeFrame === "1M") {
          dateFormat = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        } else if (selectedTimeFrame === "6M") {
          dateFormat = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        } else if (selectedTimeFrame === "1Yr") {
          // Show month and year for 1Y - more helpful than just month-year
          dateFormat = date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
        } else if (selectedTimeFrame === "3Yr") {
          // Show month and year for 3Y view - more helpful than quarters
          dateFormat = date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
        } else if (selectedTimeFrame === "5Yr") {
          // Show years for 5Y view - but full year for clarity
          dateFormat = date.toLocaleDateString("en-US", { year: "numeric" });
        } else {
          // 10Yr, Max - show full years
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

      // Create quarterly TTM EPS bars data - separate from daily PE data
      const quarterlyTTMData = new Map<string, PEData>();

      transformedPEData.forEach((item) => {
        const date = new Date(item.timestamp);
        const year = date.getFullYear();
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        const quarterKey = `${year}-Q${quarter}`;

        // Keep the latest data point for each quarter (TTM EPS should be same within quarter)
        if (!quarterlyTTMData.has(quarterKey) || date > new Date(quarterlyTTMData.get(quarterKey)!.timestamp)) {
          quarterlyTTMData.set(quarterKey, item);
        }
      });

      // Calculate dynamic median PE from all data
      const allPEValues = transformedPEData.map(d => d.pe_ratio).filter(pe => pe > 0);
      const sortedPE = allPEValues.sort((a, b) => a - b);
      const dynamicMedianPE = sortedPE.length > 0
        ? sortedPE.length % 2 === 0
          ? (sortedPE[sortedPE.length / 2 - 1] + sortedPE[sortedPE.length / 2]) / 2
          : sortedPE[Math.floor(sortedPE.length / 2)]
        : 25.7; // fallback

      // Create enhanced data with quarterly TTM bars
      const enhancedPEData = transformedPEData.map((item) => {
        const date = new Date(item.timestamp);
        const year = date.getFullYear();
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        const quarterKey = `${year}-Q${quarter}`;

        // Get the TTM EPS for this quarter (same value for all days in quarter)
        const quarterData = quarterlyTTMData.get(quarterKey);
        const quarterTTMEPS = quarterData ? quarterData.ttm_eps : item.ttm_eps;

        // Only show TTM EPS bar for the first day of each quarter
        const isQuarterStart = quarterData && Math.abs(item.timestamp - quarterData.timestamp) < 7 * 24 * 60 * 60 * 1000; // Within 7 days

        return {
          ...item,
          // Show TTM EPS bar only for quarter representative points
          ttm_eps_bar: isQuarterStart ? quarterTTMEPS : null,
          // But keep TTM EPS for all days (for tooltip)
          ttm_eps: quarterTTMEPS,
          // Add dynamic median PE
          median_pe: dynamicMedianPE
        };
      });

      setPEData(enhancedPEData as any);
      setMedianPE(dynamicMedianPE);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch PE data");
      console.error("PE data fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Market Cap/Sales data
  const fetchMarketCapSalesData = async (timeframe: TimeFrame) => {
    setLoading(true);
    setError(null);

    try {
      const apiTimeframe = TIME_FRAMES.find(tf => tf.value === timeframe)?.apiValue || "1Y";
      const response = await fetch(`/api/charts/market-cap-sales/${symbol}?timeframe=${apiTimeframe}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch Market Cap/Sales data: ${response.status}`);
      }

      const result = await response.json();

      if (!result.data || !Array.isArray(result.data)) {
        throw new Error("Invalid Market Cap/Sales data format");
      }

      // Transform and enhance Market Cap/Sales data - keep ALL daily data points
      const transformedMarketCapSalesData: MarketCapSalesData[] = result.data.map((item: any) => {
        const timestamp = item.time ? item.time * 1000 : item.timestamp; // Convert time to milliseconds if needed
        const date = new Date(timestamp);

        // Format date based on timeframe - more helpful labels
        let dateFormat;
        if (selectedTimeFrame === "1M") {
          dateFormat = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        } else if (selectedTimeFrame === "6M") {
          dateFormat = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        } else if (selectedTimeFrame === "1Yr") {
          dateFormat = date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
        } else if (selectedTimeFrame === "3Yr") {
          dateFormat = date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
        } else if (selectedTimeFrame === "5Yr") {
          dateFormat = date.toLocaleDateString("en-US", { year: "numeric" });
        } else {
          dateFormat = date.toLocaleDateString("en-US", { year: "numeric" });
        }

        return {
          date: dateFormat,
          market_cap_sales_ratio: parseFloat((item.market_cap_sales_ratio || 0).toFixed(3)),
          quarterly_sales: parseFloat((item.sales_ttm || 0).toFixed(0)), // Use sales_ttm from new API
          timestamp: timestamp,
          time: item.time || Math.floor(timestamp / 1000),
          market_cap: parseFloat(((item.market_cap || 0) / 1000000000).toFixed(2)), // Convert to billions
          sales: parseFloat((item.sales_ttm || 0).toFixed(0)),
          median_market_cap_sales: result.metadata?.median_market_cap_sales || 4.3
        };
      });

      // Create quarterly Sales bars data - separate from daily Market Cap/Sales data
      const quarterlySalesData = new Map<string, MarketCapSalesData>();

      transformedMarketCapSalesData.forEach((item) => {
        const date = new Date(item.timestamp);
        const year = date.getFullYear();
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        const quarterKey = `${year}-Q${quarter}`;

        // Keep the latest data point for each quarter (TTM Sales should be same within quarter)
        if (!quarterlySalesData.has(quarterKey) || date > new Date(quarterlySalesData.get(quarterKey)!.timestamp)) {
          quarterlySalesData.set(quarterKey, item);
        }
      });

      // Create enhanced data with quarterly Sales bars
      const enhancedMarketCapSalesData = transformedMarketCapSalesData.map((item) => {
        const date = new Date(item.timestamp);
        const year = date.getFullYear();
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        const quarterKey = `${year}-Q${quarter}`;

        // Get the quarterly sales for this quarter (same value for all days in quarter)
        const quarterData = quarterlySalesData.get(quarterKey);
        const quarterSales = quarterData ? quarterData.quarterly_sales : item.quarterly_sales;

        // Only show Sales bar for the first day of each quarter
        const isQuarterStart = quarterData && Math.abs(item.timestamp - quarterData.timestamp) < 7 * 24 * 60 * 60 * 1000;

        return {
          ...item,
          // Show Sales bar only for quarter representative points
          quarterly_sales_bar: isQuarterStart ? quarterSales : null,
          // But keep quarterly sales for all days (for tooltip)
          quarterly_sales: quarterSales,
          // Add median Market Cap/Sales
          median_market_cap_sales: result.metadata?.median_market_cap_sales || 4.3
        };
      });

      setMarketCapSalesData(enhancedMarketCapSalesData as any);
      setMedianMarketCapSales(result.metadata?.median_market_cap_sales || 4.3);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch Market Cap/Sales data");
      console.error("Market Cap/Sales data fetch error:", err);
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
    } else if (chartType === "market_cap_sales") {
      fetchMarketCapSalesData(selectedTimeFrame);
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

  // Calculate price/PE/MarketCapSales range for right Y-axis positioning
  const rightAxisRange = useMemo(() => {
    if (chartType === "price") {
      if (chartData.length === 0) return { min: 0, max: 1000 };

      const prices = chartData.map(d => d.price);
      const min = Math.min(...prices);
      const max = Math.max(...prices);

      return { min: min * 0.95, max: max * 1.05 };
    } else if (chartType === "pe_ratio") {
      if (peData.length === 0) return { min: 0, max: 50 };

      const peValues = peData.map(d => d.pe_ratio);
      const min = Math.min(...peValues);
      const max = Math.max(...peValues);

      return { min: min * 0.9, max: max * 1.1 };
    } else if (chartType === "market_cap_sales") {
      if (marketCapSalesData.length === 0) return { min: 0, max: 10 };

      const ratioValues = marketCapSalesData.map(d => d.market_cap_sales_ratio);
      const min = Math.min(...ratioValues);
      const max = Math.max(...ratioValues);

      return { min: min * 0.9, max: max * 1.1 };
    }
    return { min: 0, max: 50 };
  }, [chartData, peData, marketCapSalesData, chartType]);

  // Calculate TTM EPS/Sales range for left Y-axis positioning
  const leftAxisRange = useMemo(() => {
    if (chartType === "pe_ratio" && peData.length > 0) {
      // Get only the TTM EPS values that have bars (quarterly data)
      const ttmEpsValues = peData
        .filter(d => d.ttm_eps_bar !== null && d.ttm_eps_bar !== undefined)
        .map(d => d.ttm_eps_bar as number);

      if (ttmEpsValues.length === 0) {
        // Fallback to all TTM EPS values if no bar data
        const allTtmValues = peData.map(d => d.ttm_eps);
        const min = Math.min(...allTtmValues);
        const max = Math.max(...allTtmValues);
        return { min: min * 0.9, max: max * 1.1 };
      }

      const min = Math.min(...ttmEpsValues);
      const max = Math.max(...ttmEpsValues);

      // Add padding to make the bars more visible
      const padding = (max - min) * 0.2; // 20% padding
      return {
        min: Math.max(0, min - padding), // Don't go below 0
        max: max + padding
      };
    } else if (chartType === "market_cap_sales" && marketCapSalesData.length > 0) {
      // Get only the TTM Sales values that have bars (quarterly data)
      const ttmSalesValues = marketCapSalesData
        .filter(d => d.quarterly_sales_bar !== null && d.quarterly_sales_bar !== undefined)
        .map(d => d.quarterly_sales_bar as number);

      if (ttmSalesValues.length === 0) {
        // Fallback to all TTM Sales values if no bar data
        const allTtmValues = marketCapSalesData.map(d => d.quarterly_sales);
        const min = Math.min(...allTtmValues);
        const max = Math.max(...allTtmValues);
        return { min: min * 0.9, max: max * 1.1 };
      }

      const min = Math.min(...ttmSalesValues);
      const max = Math.max(...ttmSalesValues);

      // Add padding to make the bars more visible
      const padding = (max - min) * 0.2; // 20% padding
      return {
        min: Math.max(0, min - padding), // Don't go below 0
        max: max + padding
      };
    }
    return { min: 0, max: 100 }; // Default range
  }, [peData, marketCapSalesData, chartType]);

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
            onClick={() => {
              if (chartType === "price") {
                fetchChartData(selectedTimeFrame);
              } else if (chartType === "pe_ratio") {
                fetchPEData(selectedTimeFrame);
              } else if (chartType === "market_cap_sales") {
                fetchMarketCapSalesData(selectedTimeFrame);
              }
            }}
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
                {chartType === "price" ? "Price" : chartType === "pe_ratio" ? "PE Ratio" : "Market Cap / Sales"} <ChevronDown className="ml-1 h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setChartType("price")}>Price</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setChartType("pe_ratio")}>PE Ratio</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setChartType("market_cap_sales")}>Market Cap / Sales</DropdownMenuItem>
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
        <div className="h-64 sm:h-80 md:h-96 lg:h-[28rem] w-full">
          <ResponsiveContainer width="100%" height="100%">
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
                interval={(() => {
                  // Dynamic interval based on timeframe and screen size
                  if (windowWidth < 640) {
                    return 'preserveStartEnd';
                  } else if (windowWidth < 1024) {
                    if (selectedTimeFrame === "1M") return 2;
                    if (selectedTimeFrame === "6M") return 10;
                    if (selectedTimeFrame === "1Yr") return 20;
                    if (selectedTimeFrame === "3Yr") return 60; // Show every ~2 months
                    if (selectedTimeFrame === "5Yr") return 120; // Show every ~6 months
                    return 200; // 10Yr, Max - very sparse
                  } else {
                    if (selectedTimeFrame === "1M") return 1;
                    if (selectedTimeFrame === "6M") return 5;
                    if (selectedTimeFrame === "1Yr") return 15;
                    if (selectedTimeFrame === "3Yr") return 30; // Show every month
                    if (selectedTimeFrame === "5Yr") return 60; // Show every ~3 months
                    return 120; // 10Yr, Max - show every ~6 months
                  }
                })()}
                padding={{ left: 0, right: 0 }}
              />
              <YAxis
                yAxisId="price"
                orientation="right"
                domain={[rightAxisRange.min, rightAxisRange.max]}
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
          ) : chartType === "pe_ratio" ? (
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
                interval={(() => {
                  // Dynamic interval based on timeframe and screen size
                  if (windowWidth < 640) {
                    return 'preserveStartEnd';
                  } else if (windowWidth < 1024) {
                    if (selectedTimeFrame === "1M") return 2;
                    if (selectedTimeFrame === "6M") return 10;
                    if (selectedTimeFrame === "1Yr") return 20;
                    if (selectedTimeFrame === "3Yr") return 60; // Show every ~2 months
                    if (selectedTimeFrame === "5Yr") return 120; // Show every ~6 months
                    return 200; // 10Yr, Max - very sparse
                  } else {
                    if (selectedTimeFrame === "1M") return 1;
                    if (selectedTimeFrame === "6M") return 5;
                    if (selectedTimeFrame === "1Yr") return 15;
                    if (selectedTimeFrame === "3Yr") return 30; // Show every month
                    if (selectedTimeFrame === "5Yr") return 60; // Show every ~3 months
                    return 120; // 10Yr, Max - show every ~6 months
                  }
                })()}
                padding={{ left: 0, right: 0 }}
              />
              <YAxis
                yAxisId="pe"
                orientation="right"
                domain={[rightAxisRange.min, rightAxisRange.max]}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: windowWidth < 640 ? 9 : windowWidth < 1024 ? 10 : 11, fill: '#666' }}
                tickFormatter={(value) => value.toFixed(1)}
                width={windowWidth < 640 ? 25 : windowWidth < 1024 ? 40 : 50}
              />
              <YAxis
                yAxisId="eps"
                orientation="left"
                domain={[leftAxisRange.min, leftAxisRange.max]}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: windowWidth < 640 ? 9 : windowWidth < 1024 ? 10 : 11, fill: '#666' }}
                tickFormatter={(value) => `₹${value.toFixed(1)}`}
                width={windowWidth < 640 ? 30 : windowWidth < 1024 ? 40 : 50}
                label={{
                  value: 'TTM EPS',
                  angle: -90,
                  position: 'insideLeft',
                  style: {
                    textAnchor: 'middle',
                    fontSize: windowWidth < 640 ? 10 : 12,
                    fill: '#666'
                  }
                }}
              />

              <Tooltip content={<CustomTooltip chartType={chartType} />} />

              {/* TTM EPS bars - render first (background) - only quarterly */}
              <Bar
                yAxisId="eps"
                dataKey="ttm_eps_bar"
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
          ) : chartType === "market_cap_sales" ? (
            <ComposedChart
              data={marketCapSalesData}
              margin={chartMargins}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: windowWidth < 640 ? 9 : windowWidth < 1024 ? 10 : 11, fill: '#666' }}
                interval={(() => {
                  // Dynamic interval based on timeframe and screen size
                  if (windowWidth < 640) {
                    return 'preserveStartEnd';
                  } else if (windowWidth < 1024) {
                    if (selectedTimeFrame === "1M") return 2;
                    if (selectedTimeFrame === "6M") return 10;
                    if (selectedTimeFrame === "1Yr") return 20;
                    if (selectedTimeFrame === "3Yr") return 60; // Show every ~2 months
                    if (selectedTimeFrame === "5Yr") return 120; // Show every ~6 months
                    return 200; // 10Yr, Max - very sparse
                  } else {
                    if (selectedTimeFrame === "1M") return 1;
                    if (selectedTimeFrame === "6M") return 5;
                    if (selectedTimeFrame === "1Yr") return 15;
                    if (selectedTimeFrame === "3Yr") return 30; // Show every month
                    if (selectedTimeFrame === "5Yr") return 60; // Show every ~3 months
                    return 120; // 10Yr, Max - show every ~6 months
                  }
                })()}
                padding={{ left: 0, right: 0 }}
              />
              <YAxis
                yAxisId="market_cap_sales"
                orientation="right"
                domain={[rightAxisRange.min, rightAxisRange.max]}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: windowWidth < 640 ? 9 : windowWidth < 1024 ? 10 : 11, fill: '#666' }}
                tickFormatter={(value) => value.toFixed(2)}
                width={windowWidth < 640 ? 25 : windowWidth < 1024 ? 40 : 50}
              />
              <YAxis
                yAxisId="sales"
                orientation="left"
                domain={[leftAxisRange.min, leftAxisRange.max]}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: windowWidth < 640 ? 9 : windowWidth < 1024 ? 10 : 11, fill: '#666' }}
                tickFormatter={(value) => `₹${(value / 10000000).toFixed(0)}Cr`}
                width={windowWidth < 640 ? 35 : windowWidth < 1024 ? 45 : 55}
                label={{
                  value: 'TTM Sales',
                  angle: -90,
                  position: 'insideLeft',
                  style: {
                    textAnchor: 'middle',
                    fontSize: windowWidth < 640 ? 10 : 12,
                    fill: '#666'
                  }
                }}
              />

              <Tooltip content={<CustomTooltip chartType={chartType} />} />

              {/* TTM Sales bars - render first (background) - only quarterly */}
              <Bar
                yAxisId="sales"
                dataKey="quarterly_sales_bar"
                fill="#87ceeb"
                opacity={0.6}
                name="TTM Sales"
              />

              {/* Market Cap/Sales ratio line - render on top */}
              <Line
                yAxisId="market_cap_sales"
                type="monotone"
                dataKey="market_cap_sales_ratio"
                stroke="#6366f1"
                strokeWidth={2}
                dot={false}
                name="Market Cap/Sales"
                connectNulls={false}
              />

              {/* Median Market Cap/Sales line - rendered as reference line */}
              {marketCapSalesData.length > 0 && (
                <Line
                  yAxisId="market_cap_sales"
                  type="monotone"
                  dataKey="median_market_cap_sales"
                  stroke="#9ca3af"
                  strokeWidth={1}
                  strokeDasharray="5 5"
                  dot={false}
                  name={`Median Market Cap/Sales = ${medianMarketCapSales.toFixed(2)}`}
                />
              )}
            </ComposedChart>
          ) : (
              <div>No chart available</div>
            )}
          </ResponsiveContainer>
        </div>
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
          ) : chartType === "pe_ratio" ? (
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
          ) : chartType === "market_cap_sales" ? (
            <>
              <div className="flex items-center space-x-1 sm:space-x-2">
                <Checkbox id="market_cap_sales" checked={true} disabled className="h-3 w-3 sm:h-4 sm:w-4" />
                <label className="text-xs sm:text-sm font-medium cursor-pointer flex items-center space-x-1">
                  <div className="w-2 sm:w-3 h-0.5 rounded" style={{ backgroundColor: "#6366f1" }} />
                  <span className="whitespace-nowrap">Market Cap/Sales</span>
                </label>
              </div>
              <div className="flex items-center space-x-1 sm:space-x-2">
                <Checkbox id="median_market_cap_sales" checked={true} disabled className="h-3 w-3 sm:h-4 sm:w-4" />
                <label className="text-xs sm:text-sm font-medium cursor-pointer flex items-center space-x-1">
                  <div className="w-2 sm:w-3 h-0.5 rounded border-dashed" style={{ borderColor: "#9ca3af" }} />
                  <span className="whitespace-nowrap">Median Market Cap/Sales = {medianMarketCapSales.toFixed(2)}</span>
                </label>
              </div>
              <div className="flex items-center space-x-1 sm:space-x-2">
                <Checkbox id="ttm_sales" checked={true} disabled className="h-3 w-3 sm:h-4 sm:w-4" />
                <label className="text-xs sm:text-sm font-medium cursor-pointer flex items-center space-x-1">
                  <div className="w-2 sm:w-3 h-0.5 rounded" style={{ backgroundColor: "#87ceeb" }} />
                  <span className="whitespace-nowrap">TTM Sales</span>
                </label>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}