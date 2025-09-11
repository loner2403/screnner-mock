import { NextRequest, NextResponse } from 'next/server';
import { convertStockDataToINR } from '@/lib/currency';
import { calculateFinancialMetrics, CALCULATION_REQUIRED_FIELDS } from '@/lib/financial-calculations';

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = 'insightsentry.p.rapidapi.com';
const BASE_URL = `https://${RAPIDAPI_HOST}/v2/screeners/stock`;

const getHeaders = () => {
  if (!RAPIDAPI_KEY) {
    throw new Error('RAPIDAPI_KEY is not configured in environment variables');
  }
  return {
    'X-RapidAPI-Host': RAPIDAPI_HOST,
    'X-RapidAPI-Key': RAPIDAPI_KEY,
    'Content-Type': 'application/json',
  };
};

// NIFTY 50 universe - normalized symbols (A-Z0-9 only)
const NIFTY_50_SYMBOLS = new Set([
  'ADANIENT', 'ADANIPORTS', 'APOLLOHOSP', 'ASIANPAINT', 'AXISBANK', 'BAJAJAUTO', 'BAJFINANCE', 'BAJAJFINSV',
  'BHARTIARTL', 'BRITANNIA', 'BPCL', 'CIPLA', 'COALINDIA', 'DIVISLAB', 'DRREDDY', 'EICHERMOT', 'GRASIM',
  'HCLTECH', 'HDFCBANK', 'HDFCLIFE', 'HEROMOTOCO', 'HINDALCO', 'HINDUNILVR', 'ICICIBANK', 'INDUSINDBK',
  'INFY', 'ITC', 'JSWSTEEL', 'KOTAKBANK', 'LT', 'LTIM', 'MARUTI', 'MM', 'NESTLEIND', 'NTPC', 'ONGC',
  'POWERGRID', 'RELIANCE', 'SBIN', 'SHRIRAMFIN', 'SUNPHARMA', 'TATACONSUM', 'TATAMOTORS', 'TATASTEEL',
  'TCS', 'TECHM', 'TITAN', 'ULTRACEMCO', 'WIPRO', 'HAVELLS', 'DLF', 'TATAPOWER'
].map(s => s.replace(/[^A-Z0-9]/g, '')));

const normalizeSymbol = (sym: string) => {
  const upper = (sym || '').toUpperCase();
  const core = upper.includes(':') ? upper.split(':')[1] : upper; // drop exchange prefix if present
  return core.replace(/[^A-Z0-9]/g, ''); // remove non-alphanumeric
};

// Mock data for fallback when API fails
const mockStockData = {
  hasNext: false,
  current_page: 1,
  total_page: 1,
  current_items: 10,
  data: [
    {
      symbol_code: "NSE:HDFCBANK",
      name: "HDFC BANK LTD",
      delay_seconds: 0,
      fundamental_currency: "INR",
      country: "India",
      close: 1991.10,
      volume: 7126128,
      market_cap: 1742400000000, // ₹17,424 Cr
      change: 0.55,
      high: 1996,
      low: 1971,
      open: 1985,
      price_earnings_ttm: 21.7,
      dividends_yield: 1.04,
      return_on_equity_fq: 14.4,
      return_on_assets_fq: 7.51,
      beta_1_year: 1.00,
      price_book_fq: 2.84,
      face_value: 1,
      sector: "Private Sector Bank",
      industry: "Banking",
      // Financial statement data for calculations
      total_assets_fq: 2500000000000,
      total_equity_fq: 350000000000,
      total_debt_fq: 1200000000000,
      net_income_ttm: 485000000000,
      oper_income_ttm: 650000000000,
      total_shares_outstanding_current: 8750000000,
      free_cash_flow_ttm: 125000000000
    },
    {
      symbol_code: "NSE:RELIANCE",
      name: "RELIANCE INDUSTRIES LTD",
      delay_seconds: 0,
      fundamental_currency: "INR",
      country: "India",
      close: 1373.8,
      volume: 5234567,
      market_cap: 928000000000, // ₹9,280 Cr
      change: -0.25,
      high: 1385,
      low: 1365,
      open: 1380,
      price_earnings_ttm: 18.5,
      dividends_yield: 0.35,
      return_on_equity_fq: 12.8,
      return_on_assets_fq: 6.2,
      beta_1_year: 0.9,
      price_book_fq: 2.2,
      face_value: 10,
      // Financial statement data for calculations
      total_assets_fq: 1800000000000,
      total_equity_fq: 420000000000,
      total_debt_fq: 650000000000,
      net_income_ttm: 750000000000,
      oper_income_ttm: 950000000000,
      total_shares_outstanding_current: 6750000000
    },
    {
      symbol_code: "NSE:TCS",
      name: "TATA CONSULTANCY SERVICES LTD",
      delay_seconds: 0,
      fundamental_currency: "INR",
      country: "India",
      close: 4234.75,
      volume: 1234567,
      market_cap: 1540000000000, // ₹15,400 Cr
      change: 1.25,
      high: 4250,
      low: 4200,
      open: 4210,
      price_earnings_ttm: 28.3,
      dividends_yield: 1.2,
      return_on_equity_fq: 45.2,
      return_on_assets_fq: 22.1,
      beta_1_year: 0.8,
      price_book_fq: 11.2,
      face_value: 1,
      // Financial statement data for calculations
      total_assets_fq: 450000000000,
      total_equity_fq: 380000000000,
      total_debt_fq: 15000000000,
      net_income_ttm: 540000000000,
      oper_income_ttm: 620000000000,
      total_shares_outstanding_current: 3640000000
    },
    {
      symbol_code: "NSE:INFY",
      name: "INFOSYS LTD",
      delay_seconds: 0,
      fundamental_currency: "INR",
      country: "India",
      close: 1876.45,
      volume: 2345678,
      market_cap: 780000000000, // ₹7,800 Cr
      change: 0.85,
      high: 1890,
      low: 1860,
      open: 1870,
      price_earnings_ttm: 25.7,
      dividends_yield: 2.1,
      return_on_equity_fq: 31.5,
      return_on_assets_fq: 18.9,
      beta_1_year: 0.7,
      price_book_fq: 6.7,
      face_value: 5,
      // Financial statement data for calculations
      total_assets_fq: 320000000000,
      total_equity_fq: 280000000000,
      total_debt_fq: 8000000000,
      net_income_ttm: 240000000000,
      oper_income_ttm: 280000000000,
      total_shares_outstanding_current: 4160000000
    },
    {
      symbol_code: "NSE:ICICIBANK",
      name: "ICICI BANK LTD",
      delay_seconds: 0,
      fundamental_currency: "INR",
      country: "India",
      close: 1234.60,
      volume: 8765432,
      market_cap: 865000000000, // ₹8,650 Cr
      change: -0.45,
      high: 1245,
      low: 1225,
      open: 1240,
      price_earnings_ttm: 19.2,
      dividends_yield: 0.8,
      return_on_equity_fq: 16.8,
      return_on_assets_fq: 1.9,
      beta_1_year: 1.2,
      price_book_fq: 4.4,
      face_value: 2,
      // Financial statement data for calculations
      total_assets_fq: 1800000000000,
      total_equity_fq: 280000000000,
      total_debt_fq: 900000000000,
      net_income_ttm: 450000000000,
      oper_income_ttm: 580000000000,
      total_shares_outstanding_current: 7000000000
    }
  ]
};

export async function GET() {
  // Return available fields for the screener
  return NextResponse.json({
    available_fields: [
      "close", "volume", "market_cap", "change", "high", "low", "open",
      "price_earnings_ttm", "dividends_yield", "beta_1_year",
      "total_assets_fq", "total_equity_fq", "total_liabilities_fq", "total_current_assets_fq",
      "total_debt_fq", "net_income_ttm", "oper_income_ttm", "total_shares_outstanding_current",
      "return_on_equity_fq", "return_on_assets_fq", "free_cash_flow_ttm",
      // Calculated fields
      "return_on_invested_capital_fq", "book_value", "price_book_fq", "face_value"
    ],
    available_exchanges: ["NSE", "BSE"],
    available_countries: ["IN"],
    sortOrder: ["asc", "desc"]
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      fields = [
        'close', 'volume', 'market_cap', 'change', 'high', 'low', 'open',
        'price_earnings_ttm', 'dividends_yield', 'beta_1_year',
        'return_on_equity_fq', 'return_on_invested_capital_fq', 'price_book_fq'
      ],
      exchanges = ['NSE', 'BSE'],
      countries = ['IN'],
      page = 1,
      sortBy = 'market_cap',
      sortOrder = 'desc',
      searchTerm,
      niftyOnly = false,
      // Allow callers to specify an explicit limit/page size
      limit,
      pageSize,
    } = body;

    // Try to fetch from real API first
    try {
      // Prefer NSE only when requesting NIFTY 50 to reduce upstream volume
      const effectiveExchanges = niftyOnly ? ['NSE'] : exchanges;

      // If niftyOnly is true and no explicit limit was provided, default to 50
      const effectiveLimit = (niftyOnly && limit === undefined && pageSize === undefined)
        ? 50
        : (limit ?? pageSize);

      // Request essential fields for calculations (exactly 20 fields - API limit)
      const allFields = [
        // Core price/volume data (7 fields)
        'close', 'volume', 'market_cap', 'change', 'high', 'low', 'open',
        // Financial statement data for ROCE/Book Value calculations (8 fields)
        'total_assets_fq', 'total_equity_fq', 'total_debt_fq', 'net_income_ttm',
        'oper_income_ttm', 'total_shares_outstanding_current', 'return_on_equity_fq', 'return_on_assets_fq',
        // Key ratios and metrics (5 fields)
        'price_earnings_ttm', 'dividends_yield', 'beta_1_year', 'free_cash_flow_ttm', 'price_book_fq'
      ];

      const requestBody: Record<string, any> = {
        fields: allFields,
        exchanges: effectiveExchanges,
        countries,
        page,
        sortBy,
        sortOrder,
      };

      if (effectiveLimit !== undefined) {
        // Forward both common spellings to maximize compatibility with the upstream API
        requestBody.limit = effectiveLimit;
        requestBody.page_size = effectiveLimit;
      }

      console.log('Making API request with headers:', {
        'X-RapidAPI-Host': RAPIDAPI_HOST,
        'X-RapidAPI-Key': RAPIDAPI_KEY ? `${RAPIDAPI_KEY.substring(0, 8)}...` : 'undefined'
      });

      const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(requestBody),
      });

      console.log(`API Response Status: ${response.status}`);

      if (response.ok) {
        let data = await response.json();
        console.log('API Success - received data with', data.data?.length || 0, 'stocks', {
          niftyOnly,
          exchanges: effectiveExchanges,
          appliedLimit: effectiveLimit,
        });

        // Filter by search term if provided
        if (searchTerm && data.data) {
          const searchTermLower = searchTerm.toLowerCase();
          data.data = data.data.filter((stock: any) =>
            stock.name.toLowerCase().includes(searchTermLower) ||
            stock.symbol_code.toLowerCase().includes(searchTermLower) ||
            stock.symbol_code.toLowerCase().replace(':', '').includes(searchTermLower)
          );

          // Log filtering for debugging
          console.log(`API Filtering for: "${searchTerm}", found ${data.data.length} stocks`);
        }

        // If requested, keep only NIFTY 50
        if (niftyOnly && data.data) {
          data.data = data.data.filter((stock: any) => NIFTY_50_SYMBOLS.has(normalizeSymbol(stock.symbol_code)));
          data.current_items = data.data.length;
          console.log(`Applied NIFTY 50 filter, remaining ${data.data.length} stocks`);
        }

        // Normalize/enrich records to ensure UI fields are populated
        if (Array.isArray(data.data)) {
          data.data = await Promise.all(data.data.map(async (s: any) => {
            let enriched: any = { ...s };

            // Convert from USD to INR if needed (only market cap)
            enriched = await convertStockDataToINR(enriched);

            // Calculate financial metrics (ROCE, book value, etc.) from available data
            enriched = calculateFinancialMetrics(enriched);

            // Set default face value if missing (most Indian stocks have face value of 1, 2, 5, or 10)
            if (enriched.face_value === undefined || enriched.face_value === null) {
              // Default face values for common Indian companies
              const symbol = enriched.symbol_code?.split(':')[1];
              if (symbol === 'RELIANCE' || symbol === 'ITC') {
                enriched.face_value = 10;
              } else if (symbol === 'INFY' || symbol === 'HINDUNILVR') {
                enriched.face_value = 5;
              } else if (symbol === 'ICICIBANK' || symbol === 'AXISBANK') {
                enriched.face_value = 2;
              } else {
                enriched.face_value = 1; // Most common face value
              }
            }

            // Normalize dividend yield to percentage if it appears as a fraction (e.g., 0.0039 => 0.39%)
            if (typeof enriched.dividends_yield === 'number' && enriched.dividends_yield > 0 && enriched.dividends_yield < 1) {
              enriched.dividends_yield = enriched.dividends_yield * 100;
            }

            return enriched;
          }));
        }

        return NextResponse.json(data);
      } else {
        const errorText = await response.text();
        console.warn(`API returned ${response.status}: ${errorText}, falling back to mock data`);
      }
    } catch (apiError) {
      console.warn('API request failed, falling back to mock data:', apiError);
    }

    // Fallback to mock data
    let data = { ...mockStockData };

    // Filter mock data by search term if provided
    if (searchTerm) {
      const searchTermLower = searchTerm.toLowerCase();
      data.data = data.data.filter((stock: any) =>
        stock.name.toLowerCase().includes(searchTermLower) ||
        stock.symbol_code.toLowerCase().includes(searchTermLower) ||
        stock.symbol_code.toLowerCase().replace(':', '').includes(searchTermLower)
      );
      data.current_items = data.data.length;

      // Log filtering for debugging
      console.log(`Filtering for: "${searchTerm}", found ${data.data.length} stocks`);
    }

    // If requested, keep only NIFTY 50 for mock data as well
    if (niftyOnly && data.data) {
      data.data = data.data.filter((stock: any) => NIFTY_50_SYMBOLS.has(normalizeSymbol(stock.symbol_code)));
      data.current_items = data.data.length;
      console.log(`Applied NIFTY 50 filter (mock), remaining ${data.data.length} stocks`);
    }

    // Normalize/enrich mock data
    if (Array.isArray(data.data)) {
      data.data = await Promise.all(data.data.map(async (s: any) => {
        let enriched: any = { ...s };

        // Convert from USD to INR if needed (mock data is already in INR, but this ensures consistency)
        enriched = await convertStockDataToINR(enriched);

        // Calculate financial metrics for mock data too
        enriched = calculateFinancialMetrics(enriched);

        if (typeof enriched.dividends_yield === 'number' && enriched.dividends_yield > 0 && enriched.dividends_yield < 1) {
          enriched.dividends_yield = enriched.dividends_yield * 100;
        }
        return enriched;
      }));
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in POST /api/stocks:', error);
    return NextResponse.json(mockStockData);
  }
}
