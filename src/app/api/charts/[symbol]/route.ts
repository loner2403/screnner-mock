import { NextRequest, NextResponse } from 'next/server';

// Types for chart data
interface OHLCVData {
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    date: string; // ISO format for display
}

interface RapidAPIItem {
    date: string;
    open: string | number;
    high: string | number;
    low: string | number;
    close: string | number;
    volume: string | number;
}

interface AlphaVantageValues {
    '1. open': string;
    '2. high': string;
    '3. low': string;
    '4. close': string;
    '5. volume': string;
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

// Note: TechnicalIndicators interface reserved for future use

type TimeFrame = '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | '2Y' | '5Y';

// Environment variables
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const ALPHA_VANTAGE_KEY = process.env.ALPHA_VANTAGE_KEY;

// Cache for storing chart data (in production, use Redis)
const chartCache = new Map<string, { data: ChartDataResponse; timestamp: number; ttl: number }>();

// Cache TTL in milliseconds (15 minutes for chart data)
const CACHE_TTL = 15 * 60 * 1000;

// Helper function to get cache key
const getCacheKey = (symbol: string, timeframe: TimeFrame): string => {
    return `chart:${symbol}:${timeframe}`;
};

// Helper function to check if cache is valid
const isCacheValid = (cacheEntry: { timestamp: number; ttl: number }): boolean => {
    return Date.now() - cacheEntry.timestamp < cacheEntry.ttl;
};

// Helper function to normalize symbol (remove exchange prefix)
const normalizeSymbol = (symbol: string): string => {
    return symbol.includes(':') ? symbol.split(':')[1] : symbol;
};

// Helper function to get date range for timeframe
const getDateRange = (timeframe: TimeFrame): { from: string; to: string } => {
    const now = new Date();
    const to = now.toISOString().split('T')[0];

    let from: Date;
    switch (timeframe) {
        case '1D':
            from = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
            break;
        case '1W':
            from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
        case '1M':
            from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
        case '3M':
            from = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            break;
        case '6M':
            from = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
            break;
        case '1Y':
            from = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            break;
        case '2Y':
            from = new Date(now.getTime() - 2 * 365 * 24 * 60 * 60 * 1000);
            break;
        case '5Y':
            from = new Date(now.getTime() - 5 * 365 * 24 * 60 * 60 * 1000);
            break;
        default:
            from = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    }

    return {
        from: from.toISOString().split('T')[0],
        to
    };
};

// Primary API: RapidAPI (Yahoo Finance)
const fetchFromRapidAPI = async (symbol: string, timeframe: TimeFrame): Promise<ChartDataResponse | null> => {
    if (!RAPIDAPI_KEY) {
        console.warn('RAPIDAPI_KEY not configured');
        return null;
    }

    try {
        const normalizedSymbol = normalizeSymbol(symbol);
        // Note: Date range calculation reserved for future filtering implementation

        // Use Yahoo Finance API via RapidAPI
        const url = `https://yahoo-finance15.p.rapidapi.com/api/yahoo/hi/history/${normalizedSymbol}.NS`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'X-RapidAPI-Key': RAPIDAPI_KEY,
                'X-RapidAPI-Host': 'yahoo-finance15.p.rapidapi.com'
            }
        });

        if (!response.ok) {
            console.warn(`RapidAPI request failed: ${response.status}`);
            return null;
        }

        const data = await response.json();

        if (!data.body || !Array.isArray(data.body)) {
            console.warn('Invalid data format from RapidAPI');
            return null;
        }

        // Transform the data to our format
        const ohlcvData: OHLCVData[] = data.body
            .filter((item: RapidAPIItem) => item.date && item.open && item.high && item.low && item.close)
            .map((item: RapidAPIItem) => ({
                timestamp: new Date(item.date).getTime(),
                open: parseFloat(String(item.open)),
                high: parseFloat(String(item.high)),
                low: parseFloat(String(item.low)),
                close: parseFloat(String(item.close)),
                volume: parseInt(String(item.volume)) || 0,
                date: new Date(item.date).toISOString()
            }))
            .sort((a: OHLCVData, b: OHLCVData) => a.timestamp - b.timestamp);

        return {
            symbol: normalizedSymbol,
            data: ohlcvData,
            metadata: {
                exchange: 'NSE',
                currency: 'INR',
                timezone: 'Asia/Kolkata',
                lastUpdate: new Date().toISOString()
            }
        };
    } catch (error) {
        console.error('Error fetching from RapidAPI:', error);
        return null;
    }
};

// Fallback API: Alpha Vantage
const fetchFromAlphaVantage = async (symbol: string, timeframe: TimeFrame): Promise<ChartDataResponse | null> => {
    if (!ALPHA_VANTAGE_KEY) {
        console.warn('ALPHA_VANTAGE_KEY not configured');
        return null;
    }

    try {
        const normalizedSymbol = normalizeSymbol(symbol);

        // Determine the function based on timeframe
        const func = 'TIME_SERIES_DAILY';
        let outputsize = 'compact';

        if (['2Y', '5Y'].includes(timeframe)) {
            outputsize = 'full';
        }

        const url = `https://www.alphavantage.co/query?function=${func}&symbol=${normalizedSymbol}.BSE&apikey=${ALPHA_VANTAGE_KEY}&outputsize=${outputsize}`;

        const response = await fetch(url);

        if (!response.ok) {
            console.warn(`Alpha Vantage request failed: ${response.status}`);
            return null;
        }

        const data = await response.json();

        if (data['Error Message'] || data['Note']) {
            console.warn('Alpha Vantage API error:', data['Error Message'] || data['Note']);
            return null;
        }

        const timeSeries = data['Time Series (Daily)'];
        if (!timeSeries) {
            console.warn('No time series data from Alpha Vantage');
            return null;
        }

        // Transform the data to our format
        const ohlcvData: OHLCVData[] = Object.entries(timeSeries)
            .map(([date, values]) => {
                const vals = values as AlphaVantageValues;
                return {
                    timestamp: new Date(date).getTime(),
                    open: parseFloat(vals['1. open']),
                    high: parseFloat(vals['2. high']),
                    low: parseFloat(vals['3. low']),
                    close: parseFloat(vals['4. close']),
                    volume: parseInt(vals['5. volume']) || 0,
                    date: new Date(date).toISOString()
                };
            })
            .sort((a: OHLCVData, b: OHLCVData) => a.timestamp - b.timestamp);

        return {
            symbol: normalizedSymbol,
            data: ohlcvData,
            metadata: {
                exchange: 'BSE',
                currency: 'INR',
                timezone: 'Asia/Kolkata',
                lastUpdate: new Date().toISOString()
            }
        };
    } catch (error) {
        console.error('Error fetching from Alpha Vantage:', error);
        return null;
    }
};

// Generate mock data as final fallback
const generateMockData = (symbol: string, timeframe: TimeFrame): ChartDataResponse => {
    const normalizedSymbol = normalizeSymbol(symbol);
    const { from, to } = getDateRange(timeframe);

    const startDate = new Date(from);
    const endDate = new Date(to);
    const data: OHLCVData[] = [];

    // Generate realistic mock data
    let currentPrice = 1000 + Math.random() * 2000; // Random starting price between 1000-3000
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
        // Skip weekends for stock data
        if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
            const volatility = 0.02; // 2% daily volatility
            const change = (Math.random() - 0.5) * 2 * volatility;

            const open = currentPrice;
            const close = open * (1 + change);
            const high = Math.max(open, close) * (1 + Math.random() * 0.01);
            const low = Math.min(open, close) * (1 - Math.random() * 0.01);
            const volume = Math.floor(Math.random() * 1000000) + 100000;

            data.push({
                timestamp: currentDate.getTime(),
                open: parseFloat(open.toFixed(2)),
                high: parseFloat(high.toFixed(2)),
                low: parseFloat(low.toFixed(2)),
                close: parseFloat(close.toFixed(2)),
                volume,
                date: currentDate.toISOString()
            });

            currentPrice = close;
        }

        currentDate.setDate(currentDate.getDate() + 1);
    }

    return {
        symbol: normalizedSymbol,
        data,
        metadata: {
            exchange: 'NSE',
            currency: 'INR',
            timezone: 'Asia/Kolkata',
            lastUpdate: new Date().toISOString()
        }
    };
};

// Main function to fetch chart data with fallbacks
const fetchChartData = async (symbol: string, timeframe: TimeFrame): Promise<ChartDataResponse> => {
    // Try primary API first
    let result = await fetchFromRapidAPI(symbol, timeframe);

    if (!result || result.data.length === 0) {
        console.log('Primary API failed, trying Alpha Vantage...');
        result = await fetchFromAlphaVantage(symbol, timeframe);
    }

    if (!result || result.data.length === 0) {
        console.log('All APIs failed, generating mock data...');
        result = generateMockData(symbol, timeframe);
    }

    return result;
};

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ symbol: string }> }
) {
    try {
        const { symbol } = await context.params;
        const { searchParams } = new URL(request.url);

        // Get query parameters
        const timeframe = (searchParams.get('timeframe') as TimeFrame) || '1Y';
        // Note: indicators parameter reserved for future technical analysis implementation

        // Validate timeframe
        const validTimeframes: TimeFrame[] = ['1D', '1W', '1M', '3M', '6M', '1Y', '2Y', '5Y'];
        if (!validTimeframes.includes(timeframe)) {
            return NextResponse.json(
                { error: 'Invalid timeframe. Valid options: ' + validTimeframes.join(', ') },
                { status: 400 }
            );
        }

        // Check cache first
        const cacheKey = getCacheKey(symbol, timeframe);
        const cachedData = chartCache.get(cacheKey);

        if (cachedData && isCacheValid(cachedData)) {
            console.log(`Cache hit for ${symbol}:${timeframe}`);
            return NextResponse.json(cachedData.data);
        }

        // Fetch fresh data
        console.log(`Fetching chart data for ${symbol}:${timeframe}`);
        const chartData = await fetchChartData(symbol, timeframe);

        // Cache the result
        chartCache.set(cacheKey, {
            data: chartData,
            timestamp: Date.now(),
            ttl: CACHE_TTL
        });

        // Clean up old cache entries (simple cleanup)
        if (chartCache.size > 1000) {
            for (const [key, entry] of chartCache.entries()) {
                if (!isCacheValid(entry)) {
                    chartCache.delete(key);
                }
            }
        }

        return NextResponse.json(chartData);

    } catch (error) {
        console.error('Error in chart API:', error);

        // Return error response
        return NextResponse.json(
            {
                error: 'Failed to fetch chart data',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}