'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Activity,
  BarChart3,
  LineChart as LineChartIcon,
  CandlestickChart,
  Settings,
  Download,
  Maximize2,
  Info,
  AlertCircle,
  RefreshCw,
  X,
  Minimize2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface StockChartProps {
  symbol: string;
  currentPrice: number;
  className?: string;
}

type TimeRange = '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | '2Y' | '5Y';
type ChartType = 'line' | 'area' | 'candlestick' | 'bar';

interface OHLCVData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  date: string;
}

interface ChartDataPoint extends OHLCVData {
  sma20?: number;
  sma50?: number;
  ema20?: number;
  upperBand?: number;
  lowerBand?: number;
  rsi?: number;
  macd?: number;
  signal?: number;
  benchmarkPrice?: number;
  benchmarkReturn?: number;
}

interface ChartDataResponse {
  symbol: string;
  data: OHLCVData[];
  metadata: {
    exchange: string;
    currency: string;
    timezone: string;
    lastUpdate: string;
  };
}

interface Indicators {
  sma20: boolean;
  sma50: boolean;
  ema20: boolean;
  bollinger: boolean;
  volume: boolean;
  rsi: boolean;
  macd: boolean;
}

interface ChartState {
  data: ChartDataPoint[];
  loading: boolean;
  error: string | null;
  retryCount: number;
}

interface BenchmarkData {
  symbol: string;
  data: OHLCVData[];
}

interface TouchState {
  startX: number;
  startY: number;
  isDragging: boolean;
  lastTouchTime: number;
}

// Technical indicator calculation functions
const calculateSMA = (data: number[], period: number): number[] => {
  const sma: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i >= period - 1) {
      const sum = data.slice(i - period + 1, i + 1).reduce((acc, val) => acc + val, 0);
      sma.push(parseFloat((sum / period).toFixed(2)));
    } else {
      sma.push(NaN);
    }
  }
  return sma;
};

const calculateEMA = (data: number[], period: number): number[] => {
  const ema: number[] = [];
  const multiplier = 2 / (period + 1);

  for (let i = 0; i < data.length; i++) {
    if (i === 0) {
      ema.push(data[i]);
    } else if (i < period - 1) {
      ema.push(NaN);
    } else if (i === period - 1) {
      const sum = data.slice(0, period).reduce((acc, val) => acc + val, 0);
      ema.push(sum / period);
    } else {
      ema.push(parseFloat(((data[i] - ema[i - 1]) * multiplier + ema[i - 1]).toFixed(2)));
    }
  }
  return ema;
};

const calculateRSI = (data: number[], period: number = 14): number[] => {
  const rsi: number[] = [];
  const gains: number[] = [];
  const losses: number[] = [];

  for (let i = 1; i < data.length; i++) {
    const change = data[i] - data[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }

  for (let i = 0; i < gains.length; i++) {
    if (i < period - 1) {
      rsi.push(NaN);
    } else {
      const avgGain = gains.slice(i - period + 1, i + 1).reduce((acc, val) => acc + val, 0) / period;
      const avgLoss = losses.slice(i - period + 1, i + 1).reduce((acc, val) => acc + val, 0) / period;
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      rsi.push(parseFloat((100 - 100 / (1 + rs)).toFixed(2)));
    }
  }

  return [NaN, ...rsi]; // Add NaN for first data point since RSI starts from second
};

const calculateBollingerBands = (data: number[], period: number = 20, stdDev: number = 2): { upper: number[], middle: number[], lower: number[] } => {
  const middle = calculateSMA(data, period);
  const upper: number[] = [];
  const lower: number[] = [];

  for (let i = 0; i < data.length; i++) {
    if (i >= period - 1) {
      const slice = data.slice(i - period + 1, i + 1);
      const mean = middle[i];
      const variance = slice.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / period;
      const standardDeviation = Math.sqrt(variance);

      upper.push(parseFloat((mean + stdDev * standardDeviation).toFixed(2)));
      lower.push(parseFloat((mean - stdDev * standardDeviation).toFixed(2)));
    } else {
      upper.push(NaN);
      lower.push(NaN);
    }
  }

  return { upper, middle, lower };
};

const calculateMACD = (data: number[], fastPeriod: number = 12, slowPeriod: number = 26, signalPeriod: number = 9): { macd: number[], signal: number[], histogram: number[] } => {
  const emaFast = calculateEMA(data, fastPeriod);
  const emaSlow = calculateEMA(data, slowPeriod);

  const macd = emaFast.map((fast, i) => {
    const slow = emaSlow[i];
    return isNaN(fast) || isNaN(slow) ? NaN : parseFloat((fast - slow).toFixed(2));
  });

  const signal = calculateEMA(macd.filter(val => !isNaN(val)), signalPeriod);
  const histogram = macd.map((macdVal, i) => {
    const signalVal = signal[i - (slowPeriod - 1)] || NaN;
    return isNaN(macdVal) || isNaN(signalVal) ? NaN : parseFloat((macdVal - signalVal).toFixed(2));
  });

  return { macd, signal: [...Array(slowPeriod - 1).fill(NaN), ...signal], histogram };
};

// Add technical indicators to chart data
const addTechnicalIndicators = (data: OHLCVData[]): ChartDataPoint[] => {
  const closes = data.map(d => d.close);

  const sma20 = calculateSMA(closes, 20);
  const sma50 = calculateSMA(closes, 50);
  const ema20 = calculateEMA(closes, 20);
  const rsi = calculateRSI(closes);
  const bollinger = calculateBollingerBands(closes);
  const macd = calculateMACD(closes);

  return data.map((point, index) => ({
    ...point,
    sma20: sma20[index],
    sma50: sma50[index],
    ema20: ema20[index],
    rsi: rsi[index],
    upperBand: bollinger.upper[index],
    lowerBand: bollinger.lower[index],
    macd: macd.macd[index],
    signal: macd.signal[index],
  }));
};

const StockChart: React.FC<StockChartProps> = ({
  symbol,
  currentPrice,
  className,
}) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('1Y');
  const [chartType, setChartType] = useState<ChartType>('area');
  const [indicators, setIndicators] = useState<Indicators>({
    sma20: false,
    sma50: false,
    ema20: false,
    bollinger: false,
    volume: true,
    rsi: false,
    macd: false,
  });
  const [compareWith, setCompareWith] = useState<string>('none');
  const [fullscreen, setFullscreen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [chartState, setChartState] = useState<ChartState>({
    data: [],
    loading: true,
    error: null,
    retryCount: 0,
  });
  const [benchmarkData, setBenchmarkData] = useState<BenchmarkData | null>(null);
  const [benchmarkLoading, setBenchmarkLoading] = useState(false);
  const [touchState, setTouchState] = useState<TouchState>({
    startX: 0,
    startY: 0,
    isDragging: false,
    lastTouchTime: 0,
  });

  // Ensure component only renders on client to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch chart data from API
  const fetchChartData = useCallback(async (retryAttempt: number = 0) => {
    if (!symbol) return;

    setChartState(prev => ({
      ...prev,
      loading: true,
      error: retryAttempt === 0 ? null : prev.error,
      retryCount: retryAttempt
    }));

    try {
      const response = await fetch(`/api/charts/${encodeURIComponent(symbol)}?timeframe=${timeRange}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch chart data: ${response.status} ${response.statusText}`);
      }

      const data: ChartDataResponse = await response.json();

      // Validate data structure
      if (!data.data || !Array.isArray(data.data) || data.data.length === 0) {
        throw new Error('No chart data available for this symbol');
      }

      // Validate individual data points
      const validData = data.data.filter(point => {
        return (
          point &&
          typeof point.open === 'number' &&
          typeof point.high === 'number' &&
          typeof point.low === 'number' &&
          typeof point.close === 'number' &&
          typeof point.volume === 'number' &&
          point.date &&
          !isNaN(point.open) &&
          !isNaN(point.high) &&
          !isNaN(point.low) &&
          !isNaN(point.close) &&
          !isNaN(point.volume) &&
          point.high >= point.low &&
          point.high >= Math.max(point.open, point.close) &&
          point.low <= Math.min(point.open, point.close)
        );
      });

      if (validData.length === 0) {
        throw new Error('No valid chart data points found');
      }

      if (validData.length < data.data.length) {
        console.warn(`Filtered out ${data.data.length - validData.length} invalid data points`);
      }

      // Sort data by timestamp to ensure chronological order
      validData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Add technical indicators to the data
      const chartDataWithIndicators = addTechnicalIndicators(validData);

      setChartState({
        data: chartDataWithIndicators,
        loading: false,
        error: null,
        retryCount: 0,
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load chart data';
      console.error('Chart data fetch error:', error);

      setChartState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
        retryCount: retryAttempt,
      }));
    }
  }, [symbol, timeRange]);

  // Retry mechanism with exponential backoff
  const retryFetch = useCallback(() => {
    const nextRetryCount = chartState.retryCount + 1;
    const delay = Math.min(1000 * Math.pow(2, nextRetryCount - 1), 10000); // Max 10 seconds

    setTimeout(() => {
      fetchChartData(nextRetryCount);
    }, delay);
  }, [fetchChartData, chartState.retryCount]);

  // Fetch benchmark data for comparison
  const fetchBenchmarkData = useCallback(async (benchmarkSymbol: string) => {
    if (benchmarkSymbol === 'none') {
      setBenchmarkData(null);
      return;
    }

    setBenchmarkLoading(true);
    try {
      const response = await fetch(`/api/charts/${encodeURIComponent(benchmarkSymbol)}?timeframe=${timeRange}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch benchmark data: ${response.status}`);
      }

      const data: ChartDataResponse = await response.json();
      
      if (data.data && data.data.length > 0) {
        setBenchmarkData({
          symbol: benchmarkSymbol,
          data: data.data
        });
      }
    } catch (error) {
      console.error('Error fetching benchmark data:', error);
      setBenchmarkData(null);
    } finally {
      setBenchmarkLoading(false);
    }
  }, [timeRange]);

  // Combine stock data with benchmark data for comparison
  const combineWithBenchmark = useCallback((stockData: ChartDataPoint[], benchmark: BenchmarkData | null): ChartDataPoint[] => {
    if (!benchmark || !benchmark.data.length) {
      return stockData;
    }

    // Create a map of benchmark data by date for quick lookup
    const benchmarkMap = new Map<string, OHLCVData>();
    benchmark.data.forEach(point => {
      const dateKey = point.date.split('T')[0]; // Use date part only
      benchmarkMap.set(dateKey, point);
    });

    // Calculate initial prices for percentage returns
    const stockInitialPrice = stockData[0]?.close || 1;
    const benchmarkInitialPrice = benchmark.data[0]?.close || 1;

    return stockData.map(point => {
      const dateKey = point.date.split('T')[0];
      const benchmarkPoint = benchmarkMap.get(dateKey);
      
      if (benchmarkPoint) {
        const benchmarkReturn = ((benchmarkPoint.close - benchmarkInitialPrice) / benchmarkInitialPrice) * 100;
        return {
          ...point,
          benchmarkPrice: benchmarkPoint.close,
          benchmarkReturn
        };
      }
      
      return point;
    });
  }, []);

  // Fetch data when symbol or timeRange changes, but only after mounting
  useEffect(() => {
    if (mounted) {
      fetchChartData();
    }
  }, [fetchChartData, mounted]);

  // Fetch benchmark data when compareWith changes
  useEffect(() => {
    if (mounted && compareWith !== 'none') {
      fetchBenchmarkData(compareWith);
    } else {
      setBenchmarkData(null);
    }
  }, [compareWith, mounted, fetchBenchmarkData]);

  // Keyboard support for fullscreen mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && fullscreen) {
        setFullscreen(false);
      } else if (e.key === 'f' || e.key === 'F') {
        setFullscreen(prev => !prev);
      }
    };

    if (mounted) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [fullscreen, mounted]);

  // Get chart data for rendering
  const chartData = useMemo(() => {
    const combinedData = combineWithBenchmark(chartState.data, benchmarkData);
    return combinedData;
  }, [chartState.data, benchmarkData, combineWithBenchmark]);

  // Touch interaction handlers for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchState({
      startX: touch.clientX,
      startY: touch.clientY,
      isDragging: false,
      lastTouchTime: Date.now(),
    });
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchState.startX);
    const deltaY = Math.abs(touch.clientY - touchState.startY);
    
    // Consider it dragging if moved more than 10px
    if (deltaX > 10 || deltaY > 10) {
      setTouchState(prev => ({ ...prev, isDragging: true }));
    }
  }, [touchState.startX, touchState.startY]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const touchEndTime = Date.now();
    const touchDuration = touchEndTime - touchState.lastTouchTime;
    
    // Double tap detection (within 300ms and not dragging)
    if (touchDuration < 300 && !touchState.isDragging) {
      // Toggle fullscreen on double tap
      setFullscreen(prev => !prev);
    }
    
    setTouchState({
      startX: 0,
      startY: 0,
      isDragging: false,
      lastTouchTime: 0,
    });
  }, [touchState.isDragging, touchState.lastTouchTime]);

  const formatXAxisTick = (tickItem: string) => {
    try {
      const date = parseISO(tickItem);
      if (timeRange === '1D' || timeRange === '1W') {
        return format(date, 'MMM dd');
      } else if (timeRange === '1M' || timeRange === '3M') {
        return format(date, 'MMM dd');
      } else {
        return format(date, 'MMM yy');
      }
    } catch (error) {
      return tickItem;
    }
  };

  const formatTooltipLabel = (value: string) => {
    try {
      return format(parseISO(value), 'PPP');
    } catch (error) {
      return value;
    }
  };

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) => {
    if (active && payload && payload.length && label) {
      const data = payload[0].payload;
      const stockInitialPrice = chartData[0]?.close || 1;
      const stockReturn = ((data.close - stockInitialPrice) / stockInitialPrice) * 100;
      
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium">{formatTooltipLabel(label)}</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-xs">
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Open:</span>
              <span className="font-medium">₹{data.open}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">High:</span>
              <span className="font-medium text-green-500">₹{data.high}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Close:</span>
              <span className="font-medium">₹{data.close}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Low:</span>
              <span className="font-medium text-red-500">₹{data.low}</span>
            </div>
            <div className="flex justify-between gap-2 col-span-2">
              <span className="text-muted-foreground">Volume:</span>
              <span className="font-medium">{data.volume.toLocaleString()}</span>
            </div>
            <div className="flex justify-between gap-2 col-span-2">
              <span className="text-muted-foreground">Return:</span>
              <span className={cn("font-medium", stockReturn >= 0 ? "text-green-500" : "text-red-500")}>
                {stockReturn >= 0 ? '+' : ''}{stockReturn.toFixed(2)}%
              </span>
            </div>
            {data.benchmarkPrice && compareWith !== 'none' && (
              <>
                <div className="flex justify-between gap-2 col-span-2 border-t pt-1 mt-1">
                  <span className="text-muted-foreground">{compareWith}:</span>
                  <span className="font-medium">₹{data.benchmarkPrice.toFixed(2)}</span>
                </div>
                {data.benchmarkReturn !== undefined && (
                  <div className="flex justify-between gap-2 col-span-2">
                    <span className="text-muted-foreground">{compareWith} Return:</span>
                    <span className={cn("font-medium", data.benchmarkReturn >= 0 ? "text-green-500" : "text-red-500")}>
                      {data.benchmarkReturn >= 0 ? '+' : ''}{data.benchmarkReturn.toFixed(2)}%
                    </span>
                  </div>
                )}
              </>
            )}
            {data.rsi && indicators.rsi && (
              <div className="flex justify-between gap-2 col-span-2 border-t pt-1 mt-1">
                <span className="text-muted-foreground">RSI:</span>
                <span className="font-medium">{data.rsi}</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    // Prevent hydration mismatch by showing loading state until mounted
    if (!mounted || chartState.loading) {
      return (
        <div className="flex items-center justify-center h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading chart data...</p>
            {chartState.retryCount > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                Retry attempt {chartState.retryCount}
              </p>
            )}
          </div>
        </div>
      );
    }

    // Error state
    if (chartState.error) {
      return (
        <div className="flex items-center justify-center h-[400px]">
          <div className="text-center max-w-md">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-400 mb-2">Failed to load chart data</p>
            <p className="text-sm text-muted-foreground mb-4">{chartState.error}</p>
            <div className="flex gap-2 justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchChartData()}
                disabled={chartState.loading}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
              {chartState.retryCount < 3 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={retryFetch}
                  disabled={chartState.loading}
                >
                  Auto Retry ({3 - chartState.retryCount} left)
                </Button>
              )}
            </div>
          </div>
        </div>
      );
    }

    // No data state
    if (!chartData || chartData.length === 0) {
      return (
        <div className="flex items-center justify-center h-[400px]">
          <div className="text-center">
            <Info className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No chart data available</p>
            <p className="text-sm text-muted-foreground mt-2">
              Try selecting a different time range or check back later
            </p>
          </div>
        </div>
      );
    }

    if (chartType === 'candlestick') {
      return (
        <ResponsiveContainer width="100%" height={fullscreen ? 500 : 400}>
          <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              tickFormatter={formatXAxisTick}
              className="text-xs"
            />
            <YAxis
              domain={['dataMin - 5', 'dataMax + 5']}
              className="text-xs"
              tick={{ fill: '#888' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="low" fill="transparent" isAnimationActive={false} />
            <Bar dataKey="high" fill="transparent" isAnimationActive={false} />
            {chartData.map((entry, index) => {
              const isGreen = entry.close >= entry.open;
              return (
                <Bar
                  key={`candle-${index}`}
                  dataKey="close"
                  fill={isGreen ? '#10b981' : '#ef4444'}
                  isAnimationActive={false}
                />
              );
            })}
            {indicators.sma20 && (
              <Line
                type="monotone"
                dataKey="sma20"
                stroke="#f59e0b"
                strokeWidth={1}
                dot={false}
                isAnimationActive={false}
              />
            )}
            {indicators.sma50 && (
              <Line
                type="monotone"
                dataKey="sma50"
                stroke="#3b82f6"
                strokeWidth={1}
                dot={false}
                isAnimationActive={false}
              />
            )}
            {indicators.bollinger && (
              <>
                <Line
                  type="monotone"
                  dataKey="upperBand"
                  stroke="#94a3b8"
                  strokeWidth={1}
                  dot={false}
                  strokeDasharray="3 3"
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="lowerBand"
                  stroke="#94a3b8"
                  strokeWidth={1}
                  dot={false}
                  strokeDasharray="3 3"
                  isAnimationActive={false}
                />
              </>
            )}
          </ComposedChart>
        </ResponsiveContainer>
      );
    } else if (chartType === 'area') {
      return (
        <ResponsiveContainer width="100%" height={fullscreen ? 500 : 400}>
          <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              tickFormatter={formatXAxisTick}
              className="text-xs"
            />
            <YAxis
              domain={['dataMin - 5', 'dataMax + 5']}
              className="text-xs"
              tick={{ fill: '#888' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="close"
              stroke="#14b8a6"
              strokeWidth={2}
              fill="url(#colorPrice)"
              isAnimationActive={false}
            />
            {compareWith !== 'none' && benchmarkData && (
              <Line
                type="monotone"
                dataKey="benchmarkPrice"
                stroke="#ff6b6b"
                strokeWidth={2}
                dot={false}
                strokeDasharray="5 5"
                isAnimationActive={false}
              />
            )}
            {indicators.sma20 && (
              <Line
                type="monotone"
                dataKey="sma20"
                stroke="#f59e0b"
                strokeWidth={1}
                dot={false}
                isAnimationActive={false}
              />
            )}
            {indicators.sma50 && (
              <Line
                type="monotone"
                dataKey="sma50"
                stroke="#3b82f6"
                strokeWidth={1}
                dot={false}
                isAnimationActive={false}
              />
            )}
            {indicators.ema20 && (
              <Line
                type="monotone"
                dataKey="ema20"
                stroke="#8b5cf6"
                strokeWidth={1}
                dot={false}
                isAnimationActive={false}
              />
            )}
            {indicators.bollinger && (
              <>
                <Line
                  type="monotone"
                  dataKey="upperBand"
                  stroke="#94a3b8"
                  strokeWidth={1}
                  dot={false}
                  strokeDasharray="3 3"
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="lowerBand"
                  stroke="#94a3b8"
                  strokeWidth={1}
                  dot={false}
                  strokeDasharray="3 3"
                  isAnimationActive={false}
                />
              </>
            )}
          </AreaChart>
        </ResponsiveContainer>
      );
    } else {
      return (
        <ResponsiveContainer width="100%" height={fullscreen ? 500 : 400}>
          <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              tickFormatter={formatXAxisTick}
              className="text-xs"
            />
            <YAxis
              domain={['dataMin - 5', 'dataMax + 5']}
              className="text-xs"
              tick={{ fill: '#888' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="close"
              stroke="#14b8a6"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            {compareWith !== 'none' && benchmarkData && (
              <Line
                type="monotone"
                dataKey="benchmarkPrice"
                stroke="#ff6b6b"
                strokeWidth={2}
                dot={false}
                strokeDasharray="5 5"
                isAnimationActive={false}
              />
            )}
            {indicators.sma20 && (
              <Line
                type="monotone"
                dataKey="sma20"
                stroke="#f59e0b"
                strokeWidth={1}
                dot={false}
                isAnimationActive={false}
              />
            )}
            {indicators.sma50 && (
              <Line
                type="monotone"
                dataKey="sma50"
                stroke="#3b82f6"
                strokeWidth={1}
                dot={false}
                isAnimationActive={false}
              />
            )}
            {indicators.ema20 && (
              <Line
                type="monotone"
                dataKey="ema20"
                stroke="#8b5cf6"
                strokeWidth={1}
                dot={false}
                isAnimationActive={false}
              />
            )}
            {indicators.bollinger && (
              <>
                <Line
                  type="monotone"
                  dataKey="upperBand"
                  stroke="#94a3b8"
                  strokeWidth={1}
                  dot={false}
                  strokeDasharray="3 3"
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="lowerBand"
                  stroke="#94a3b8"
                  strokeWidth={1}
                  dot={false}
                  strokeDasharray="3 3"
                  isAnimationActive={false}
                />
              </>
            )}
          </LineChart>
        </ResponsiveContainer>
      );
    }
  };

  // Don't render anything until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-cyan-500" />
              Price Chart
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
              <p className="text-gray-400">Loading chart data...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className={cn(
        "w-full", 
        className, 
        fullscreen && "fixed inset-0 z-50 rounded-none h-screen overflow-auto"
      )}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-cyan-500" />
              Price Chart
            </CardTitle>
            {chartState.loading && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <div className="animate-spin rounded-full h-3 w-3 border border-cyan-400 border-t-transparent"></div>
                Loading...
              </div>
            )}
            {chartState.error && (
              <Badge variant="destructive" className="text-xs">
                <AlertCircle className="h-3 w-3 mr-1" />
                Error
              </Badge>
            )}
            {!chartState.loading && !chartState.error && chartData.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {chartData.length} data points
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchChartData()}
              disabled={chartState.loading}
              title="Refresh chart data"
            >
              <RefreshCw className={cn("h-4 w-4", chartState.loading && "animate-spin")} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFullscreen(!fullscreen)}
              title={fullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" disabled={chartState.loading || !!chartState.error}>
                  <Download className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Export Chart</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Download as PNG</DropdownMenuItem>
                <DropdownMenuItem>Download as SVG</DropdownMenuItem>
                <DropdownMenuItem>Download data as CSV</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Chart Controls */}
        <div className="space-y-4 mb-4">
          {/* Time Range Selector */}
          <div className="flex flex-wrap items-center gap-2">
            {(['1D', '1W', '1M', '3M', '6M', '1Y', '2Y', '5Y'] as TimeRange[]).map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange(range)}
                disabled={chartState.loading}
                className={cn(
                  "h-8",
                  timeRange === range && "bg-cyan-500 hover:bg-cyan-600"
                )}
              >
                {range}
              </Button>
            ))}
          </div>

          {/* Chart Type and Indicators */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Select value={chartType} onValueChange={(value) => setChartType(value as ChartType)}>
                <SelectTrigger className="w-[140px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="line">
                    <div className="flex items-center gap-2">
                      <LineChartIcon className="h-4 w-4" />
                      Line
                    </div>
                  </SelectItem>
                  <SelectItem value="area">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Area
                    </div>
                  </SelectItem>
                  <SelectItem value="candlestick">
                    <div className="flex items-center gap-2">
                      <CandlestickChart className="h-4 w-4" />
                      Candlestick
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8">
                    <Settings className="h-4 w-4 mr-2" />
                    Indicators
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuLabel>Technical Indicators</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    checked={indicators.sma20}
                    onCheckedChange={(checked) =>
                      setIndicators(prev => ({ ...prev, sma20: checked }))
                    }
                  >
                    SMA 20
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={indicators.sma50}
                    onCheckedChange={(checked) =>
                      setIndicators(prev => ({ ...prev, sma50: checked }))
                    }
                  >
                    SMA 50
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={indicators.ema20}
                    onCheckedChange={(checked) =>
                      setIndicators(prev => ({ ...prev, ema20: checked }))
                    }
                  >
                    EMA 20
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={indicators.bollinger}
                    onCheckedChange={(checked) =>
                      setIndicators(prev => ({ ...prev, bollinger: checked }))
                    }
                  >
                    Bollinger Bands
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    checked={indicators.volume}
                    onCheckedChange={(checked) =>
                      setIndicators(prev => ({ ...prev, volume: checked }))
                    }
                  >
                    Volume
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={indicators.rsi}
                    onCheckedChange={(checked) =>
                      setIndicators(prev => ({ ...prev, rsi: checked }))
                    }
                  >
                    RSI
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={indicators.macd}
                    onCheckedChange={(checked) =>
                      setIndicators(prev => ({ ...prev, macd: checked }))
                    }
                  >
                    MACD
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Select value={compareWith} onValueChange={setCompareWith}>
                <SelectTrigger className="w-[140px] h-8">
                  <SelectValue placeholder="Compare with" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="NIFTY50">Nifty 50</SelectItem>
                  <SelectItem value="SENSEX">Sensex</SelectItem>
                  <SelectItem value="BANKNIFTY">Bank Nifty</SelectItem>
                  <SelectItem value="NIFTYIT">Nifty IT</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 text-xs flex-wrap">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-cyan-500 rounded" />
                <span>{symbol}</span>
              </div>
              {compareWith !== 'none' && benchmarkData && (
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-red-400 rounded border-dashed border" />
                  <span>{compareWith}</span>
                  {benchmarkLoading && (
                    <div className="animate-spin rounded-full h-3 w-3 border border-red-400 border-t-transparent ml-1"></div>
                  )}
                </div>
              )}
              {indicators.sma20 && (
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-amber-500 rounded" />
                  <span>SMA 20</span>
                </div>
              )}
              {indicators.sma50 && (
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-blue-500 rounded" />
                  <span>SMA 50</span>
                </div>
              )}
              {indicators.ema20 && (
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-violet-500 rounded" />
                  <span>EMA 20</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Chart */}
        <div className="space-y-4">
          {renderChart()}

          {/* Volume Chart */}
          {indicators.volume && (
            <div>
              <h4 className="text-sm font-medium mb-2">Volume</h4>
              <ResponsiveContainer width="100%" height={100}>
                <BarChart data={chartData} margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatXAxisTick}
                    className="text-xs"
                  />
                  <YAxis
                    className="text-xs"
                    tick={{ fill: '#888' }}
                    tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                  />
                  <Tooltip
                    formatter={(value: number) => `${(value / 1000000).toFixed(2)}M`}
                    labelFormatter={formatTooltipLabel}
                  />
                  <Bar dataKey="volume" fill="#14b8a6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* RSI Chart */}
          {indicators.rsi && (
            <div>
              <h4 className="text-sm font-medium mb-2">RSI (14)</h4>
              <ResponsiveContainer width="100%" height={100}>
                <LineChart data={chartData} margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatXAxisTick}
                    className="text-xs"
                  />
                  <YAxis
                    domain={[0, 100]}
                    className="text-xs"
                    tick={{ fill: '#888' }}
                  />
                  <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="3 3" />
                  <ReferenceLine y={30} stroke="#10b981" strokeDasharray="3 3" />
                  <Tooltip
                    formatter={(value: number) => value?.toFixed(2)}
                    labelFormatter={formatTooltipLabel}
                  />
                  <Line
                    type="monotone"
                    dataKey="rsi"
                    stroke="#8b5cf6"
                    strokeWidth={1}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* MACD Chart */}
          {indicators.macd && (
            <div>
              <h4 className="text-sm font-medium mb-2">MACD</h4>
              <ResponsiveContainer width="100%" height={100}>
                <ComposedChart data={chartData} margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatXAxisTick}
                    className="text-xs"
                  />
                  <YAxis
                    className="text-xs"
                    tick={{ fill: '#888' }}
                  />
                  <Tooltip
                    formatter={(value: number) => value?.toFixed(2)}
                    labelFormatter={formatTooltipLabel}
                  />
                  <Bar
                    dataKey="macd"
                    fill="#14b8a6"
                    fillOpacity={0.6}
                  />
                  <Line
                    type="monotone"
                    dataKey="signal"
                    stroke="#f59e0b"
                    strokeWidth={1}
                    dot={false}
                    isAnimationActive={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Chart Statistics */}
        {mounted && chartData.length > 0 && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Period High</span>
                <p className="font-medium text-green-500">
                  ₹{Math.max(...chartData.map(d => d.high)).toFixed(2)}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Period Low</span>
                <p className="font-medium text-red-500">
                  ₹{Math.min(...chartData.map(d => d.low)).toFixed(2)}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Avg Volume</span>
                <p className="font-medium">
                  {(chartData.reduce((acc, d) => acc + d.volume, 0) / chartData.length / 1000000).toFixed(2)}M
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Volatility</span>
                <p className="font-medium">
                  {((Math.max(...chartData.map(d => d.high)) - Math.min(...chartData.map(d => d.low))) / currentPrice * 100).toFixed(2)}%
                </p>
              </div>
            </div>
            {/* Performance comparison */}
            {compareWith !== 'none' && benchmarkData && chartData.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <h5 className="text-sm font-medium mb-2">Performance Comparison ({timeRange})</h5>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">{symbol} Return</span>
                    <p className={cn("font-medium", 
                      ((chartData[chartData.length - 1]?.close - chartData[0]?.close) / chartData[0]?.close * 100) >= 0 
                        ? "text-green-500" : "text-red-500"
                    )}>
                      {((chartData[chartData.length - 1]?.close - chartData[0]?.close) / chartData[0]?.close * 100).toFixed(2)}%
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{compareWith} Return</span>
                    <p className={cn("font-medium",
                      (chartData[chartData.length - 1]?.benchmarkReturn || 0) >= 0 
                        ? "text-green-500" : "text-red-500"
                    )}>
                      {(chartData[chartData.length - 1]?.benchmarkReturn || 0).toFixed(2)}%
                    </p>
                  </div>
                </div>
              </div>
            )}
            {/* Mobile interaction hint */}
            <div className="mt-2 text-xs text-muted-foreground text-center md:hidden">
              Double-tap chart to toggle fullscreen • Press F for fullscreen
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StockChart;
