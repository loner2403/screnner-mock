import { NextRequest, NextResponse } from 'next/server';

interface MarketCapSalesDataPoint {
    time: number;
    price: number;
    sales_ttm: number;
    market_cap_sales_ratio: number;
    market_cap: number;
    shares_outstanding: number;
}

interface MarketCapSalesChartResponse {
    symbol: string;
    timeframe: string;
    data: MarketCapSalesDataPoint[];
    metadata: {
        median_market_cap_sales: number;
        last_update: string;
        calculation_method: string;
    };
}

interface StockPriceData {
    timestamp: number;
    close: number;
}


// Cache for storing Market Cap/Sales data
const marketCapSalesCache = new Map<string, { data: MarketCapSalesChartResponse; timestamp: number; ttl: number }>();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

const getCacheKey = (symbol: string, timeframe: string): string => {
    return `market-cap-sales:${symbol}:${timeframe}`;
};

const isCacheValid = (cacheEntry: { timestamp: number; ttl: number }): boolean => {
    return Date.now() - cacheEntry.timestamp < cacheEntry.ttl;
};


// Fetch stock price data from internal charts API
const fetchStockPriceData = async (symbol: string, timeframe: string): Promise<StockPriceData[]> => {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    console.log(`Fetching stock price data for ${symbol}, timeframe: ${timeframe}`);

    const response = await fetch(`${baseUrl}/api/charts/${symbol}?timeframe=${timeframe}`, {
        headers: {
            'Accept': 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error(`Stock price API request failed: ${response.status}`);
    }

    const result = await response.json();

    if (!result.data || !Array.isArray(result.data)) {
        throw new Error('Invalid stock price data format');
    }

    const stockPrices: StockPriceData[] = result.data.map((item: any) => ({
        timestamp: item.timestamp,
        close: parseFloat(item.close)
    }));

    console.log(`Got ${stockPrices.length} stock price data points`);

    return stockPrices;
};

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = 'insightsentry.p.rapidapi.com';

interface InsightSentryDataPoint {
    id: string;
    name: string;
    category: string;
    type: string;
    period: string;
    value: number | number[];
}

interface InsightSentryResponse {
    code: string;
    data: InsightSentryDataPoint[];
}

const normalizeSymbol = (symbol: string): string => {
    return symbol.includes(':') ? symbol : `NSE:${symbol}`;
};

// Fetch fundamental data directly from InsightSentry
const fetchFundamentalData = async (symbol: string): Promise<{ sharesOutstanding: number; quarterlyRevenues: number[] }> => {
    const fullSymbol = normalizeSymbol(symbol);
    console.log(`Fetching fundamental data for ${fullSymbol} from InsightSentry`);

    if (!RAPIDAPI_KEY) {
        throw new Error('RAPIDAPI_KEY is not configured');
    }

    const response = await fetch(
        `https://${RAPIDAPI_HOST}/v3/symbols/${encodeURIComponent(fullSymbol)}/fundamentals`,
        {
            method: 'GET',
            headers: {
                'X-RapidAPI-Host': RAPIDAPI_HOST,
                'X-RapidAPI-Key': RAPIDAPI_KEY,
                'Accept': 'application/json'
            }
        }
    );

    if (!response.ok) {
        throw new Error(`InsightSentry API request failed: ${response.status}`);
    }

    const result: InsightSentryResponse = await response.json();

    if (!result.data || !Array.isArray(result.data)) {
        throw new Error('Invalid InsightSentry response format');
    }

    // Find shares outstanding - try multiple field names
    const sharesOutstandingData = result.data.find(item =>
        item.id === 'basic_shares_outstanding_fq' ||
        item.id === 'total_shares_outstanding_fq' ||
        item.id === 'diluted_shares_outstanding_fq' ||
        item.id === 'float_shares_outstanding_fy'
    );

    // Find quarterly revenue history - use total_revenue_fq_h data
    const quarterlyRevenueData = result.data.find(item =>
        item.id === 'total_revenue_fq_h' ||
        item.id === 'revenue_fq_h'
    );

    if (!sharesOutstandingData) {
        console.log('Available fundamental fields:', result.data.map(d => d.id).slice(0, 20));
        throw new Error('Shares outstanding data not found in fundamentals');
    }

    if (!quarterlyRevenueData || !Array.isArray(quarterlyRevenueData.value)) {
        console.log('Available fundamental fields:', result.data.map(d => d.id).slice(0, 20));
        throw new Error('Quarterly revenue history data not found in fundamentals');
    }

    const sharesOutstanding = sharesOutstandingData.value as number;
    const quarterlyRevenues = quarterlyRevenueData.value as number[];

    const ttmSales = quarterlyRevenues.slice(0, 4).reduce((sum, r) => sum + r, 0);
    console.log(`Found shares outstanding: ${sharesOutstanding.toLocaleString()}`);
    console.log(`Found ${quarterlyRevenues.length} quarters of revenue data`);
    console.log(`Recent quarterly revenues: ${quarterlyRevenues.slice(0, 4).map(r => `₹${(r / 10000000).toFixed(0)}Cr`).join(', ')}`);
    console.log(`TTM Sales (sum of 4 quarters): ₹${(ttmSales / 10000000).toFixed(0)}Cr`);
    console.log(`Raw TTM Sales value: ${ttmSales}`);

    // Debug calculation for expected 4.16 ratio
    const currentPrice = 970; // Approximate current price
    const marketCap = currentPrice * sharesOutstanding;
    const currentRatio = marketCap / ttmSales;
    const expectedTTMSales = marketCap / 4.16;
    console.log(`DEBUG: Current price ~₹${currentPrice}, Market Cap: ₹${(marketCap / 1000000000000).toFixed(2)}T`);
    console.log(`DEBUG: Current ratio: ${currentRatio.toFixed(3)}, Expected ratio: 4.16`);
    console.log(`DEBUG: For 4.16 ratio, TTM Sales should be: ₹${(expectedTTMSales / 10000000).toFixed(0)}Cr`);
    console.log(`DEBUG: Actual TTM Sales: ₹${(ttmSales / 10000000).toFixed(0)}Cr (${((ttmSales / expectedTTMSales - 1) * 100).toFixed(1)}% higher)`);

    return {
        sharesOutstanding,
        quarterlyRevenues
    };
};

// Calculate TTM sales for a given date using quarterly data
const calculateTTMSales = (
    date: Date,
    quarterlyRevenues: number[]
): number => {
    // Quarterly revenues are ordered with most recent first
    // We need to find which quarter this date falls into and calculate TTM from that point

    const year = date.getFullYear();
    const month = date.getMonth();
    const quarter = Math.floor(month / 3) + 1; // 1=Q1, 2=Q2, 3=Q3, 4=Q4

    // Calculate how many quarters back from the most recent quarter this date represents
    const currentYear = new Date().getFullYear();
    const currentQuarter = Math.floor(new Date().getMonth() / 3) + 1;

    // Calculate quarter offset from most recent
    const yearDiff = currentYear - year;
    const quarterDiff = currentQuarter - quarter;
    const quartersBack = yearDiff * 4 + quarterDiff;

    console.log(`TTM calc for ${year}-Q${quarter}: ${quartersBack} quarters back from current`);

    // Take 4 quarters starting from this quarter's position
    const startIndex = quartersBack;
    const endIndex = startIndex + 4;

    if (startIndex >= 0 && endIndex <= quarterlyRevenues.length) {
        const relevantQuarters = quarterlyRevenues.slice(startIndex, endIndex);
        const ttmSales = relevantQuarters.reduce((sum, revenue) => sum + revenue, 0);
        console.log(`TTM for ${year}-Q${quarter}: ₹${(ttmSales / 10000000).toFixed(0)}Cr from quarters [${relevantQuarters.map(q => (q / 10000000).toFixed(0)).join(', ')}]Cr`);
        return ttmSales;
    }

    // Fallback: if we don't have enough historical data, use available quarters
    if (quarterlyRevenues.length >= 4) {
        return quarterlyRevenues.slice(0, 4).reduce((sum, revenue) => sum + revenue, 0);
    }

    return quarterlyRevenues.reduce((sum, revenue) => sum + revenue, 0);
};

// Group stock prices by quarter to calculate quarterly TTM values
const getQuarterKey = (timestamp: number): string => {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const quarter = Math.floor(date.getMonth() / 3) + 1;
    return `${year}-Q${quarter}`;
};

// Generate Market Cap/Sales data points with dynamic TTM calculations
const generateMarketCapSalesData = (
    stockPrices: StockPriceData[],
    sharesOutstanding: number,
    quarterlyRevenues: number[]
): MarketCapSalesDataPoint[] => {
    // Group prices by quarter to calculate TTM per quarter
    const quarterlyGroups = new Map<string, { prices: StockPriceData[], ttmSales: number }>();

    // First pass: group prices by quarter and calculate TTM for each quarter
    stockPrices.forEach((pricePoint) => {
        const quarterKey = getQuarterKey(pricePoint.timestamp);

        if (!quarterlyGroups.has(quarterKey)) {
            const date = new Date(pricePoint.timestamp);
            const ttmSales = calculateTTMSales(date, quarterlyRevenues);
            quarterlyGroups.set(quarterKey, { prices: [], ttmSales });
        }

        quarterlyGroups.get(quarterKey)!.prices.push(pricePoint);
    });

    console.log(`Generated ${quarterlyGroups.size} quarterly groups for Market Cap/Sales calculation`);

    // Second pass: generate data points with appropriate TTM values
    const result: MarketCapSalesDataPoint[] = [];

    for (const [quarterKey, { prices, ttmSales }] of quarterlyGroups) {
        prices.forEach((pricePoint) => {
            const marketCap = pricePoint.close * sharesOutstanding;
            const marketCapSalesRatio = ttmSales > 0 ? marketCap / ttmSales : 0;

            result.push({
                time: Math.floor(pricePoint.timestamp / 1000), // Convert to seconds for consistency
                price: pricePoint.close,
                sales_ttm: ttmSales,
                market_cap_sales_ratio: parseFloat(marketCapSalesRatio.toFixed(3)),
                market_cap: marketCap,
                shares_outstanding: sharesOutstanding
            });
        });
    }

    // Sort by timestamp to maintain chronological order
    result.sort((a, b) => a.time - b.time);

    return result;
};

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ symbol: string }> }
) {
    try {
        const { symbol } = await context.params;
        const { searchParams } = new URL(request.url);
        const timeframe = searchParams.get('timeframe') || '1Y';

        // Validate timeframe
        const validTimeframes = ['1M', '6M', '1Y', '3Y', '5Y'];
        if (!validTimeframes.includes(timeframe)) {
            return NextResponse.json(
                { error: 'Invalid timeframe. Valid options: ' + validTimeframes.join(', ') },
                { status: 400 }
            );
        }

        // Check cache first
        const cacheKey = getCacheKey(symbol, timeframe);
        const cachedData = marketCapSalesCache.get(cacheKey);

        if (cachedData && isCacheValid(cachedData)) {
            console.log(`Cache hit for Market Cap/Sales ${symbol}:${timeframe}`);
            return NextResponse.json(cachedData.data);
        }

        console.log(`Fetching fresh Market Cap/Sales data for ${symbol}:${timeframe}`);

        // Fetch all required data in parallel
        const [stockPrices, { sharesOutstanding, quarterlyRevenues }] = await Promise.all([
            fetchStockPriceData(symbol, timeframe),
            fetchFundamentalData(symbol)
        ]);

        if (stockPrices.length === 0) {
            throw new Error('No stock price data available');
        }

        // Generate Market Cap/Sales data points with dynamic TTM calculations
        const marketCapSalesData = generateMarketCapSalesData(stockPrices, sharesOutstanding, quarterlyRevenues);

        // Calculate median Market Cap/Sales ratio
        const ratios = marketCapSalesData
            .map(d => d.market_cap_sales_ratio)
            .filter(r => r > 0 && isFinite(r));

        const sortedRatios = ratios.sort((a, b) => a - b);
        const medianRatio = sortedRatios.length > 0
            ? sortedRatios.length % 2 === 0
                ? (sortedRatios[sortedRatios.length / 2 - 1] + sortedRatios[sortedRatios.length / 2]) / 2
                : sortedRatios[Math.floor(sortedRatios.length / 2)]
            : 0;

        const result: MarketCapSalesChartResponse = {
            symbol: normalizeSymbol(symbol),
            timeframe,
            data: marketCapSalesData,
            metadata: {
                median_market_cap_sales: parseFloat(medianRatio.toFixed(3)),
                last_update: new Date().toISOString(),
                calculation_method: 'Market Cap = Price × Shares Outstanding; Ratio = Market Cap ÷ TTM Sales'
            }
        };

        // Cache the result
        marketCapSalesCache.set(cacheKey, {
            data: result,
            timestamp: Date.now(),
            ttl: CACHE_TTL
        });

        // Clean up old cache entries
        if (marketCapSalesCache.size > 50) {
            for (const [key, entry] of marketCapSalesCache.entries()) {
                if (!isCacheValid(entry)) {
                    marketCapSalesCache.delete(key);
                }
            }
        }

        console.log(`Market Cap/Sales data generated: ${marketCapSalesData.length} points, median ratio: ${medianRatio.toFixed(3)}`);

        return NextResponse.json(result);

    } catch (error) {
        console.error('Error in Market Cap/Sales API:', error);

        return NextResponse.json(
            {
                error: 'Failed to fetch Market Cap/Sales data',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}