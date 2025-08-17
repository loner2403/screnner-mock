import { NextRequest, NextResponse } from 'next/server';

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
      market_cap: 17424000000000, // ₹174.24B
      change: 0.55,
      high: 1996,
      low: 1971,
      open: 1985,
      price_earnings_ttm: 21.7,
      dividends_yield: 1.04,
      return_on_equity_fq: 14.4,
      return_on_assets_fq: 7.51,
      return_on_invested_capital_fq: 15.2,
      price_book_fq: 682.50,
      beta_1_year: 1.00,
      // Additional fields for charting
      performance_week: -0.8,
      performance_month: 2.3,
      performance_3_month: 5.7,
      performance_6_month: 12.4,
      performance_year: 18.9,
      performance_5_year: 85.2,
      volatility_week: 1.2,
      volatility_month: 2.8,
      average_volume_10d: 6800000,
      average_volume_30d: 7200000,
      free_cash_flow_ttm: 125000000000,
      net_income_ttm: 485000000000,
      total_revenue_ttm: 1850000000000
    },
    {
      symbol_code: "NSE:RELIANCE",
      name: "RELIANCE INDUSTRIES LTD",
      delay_seconds: 0,
      fundamental_currency: "INR",
      country: "India",
      close: 1373.8,
      volume: 5234567,
      market_cap: 2119286711513622,
      change: -0.25,
      high: 1385,
      low: 1365,
      open: 1380,
      price_earnings_ttm: 18.5,
      dividends_yield: 0.35,
      return_on_equity_fq: 12.8,
      return_on_assets_fq: 6.2,
      return_on_invested_capital_fq: 11.5,
      price_book_fq: 1.8,
      beta_1_year: 0.9
    },
    {
      symbol_code: "NSE:TCS",
      name: "TATA CONSULTANCY SERVICES LTD",
      delay_seconds: 0,
      fundamental_currency: "INR",
      country: "India",
      close: 4234.75,
      volume: 1234567,
      market_cap: 1540000000000,
      change: 1.25,
      high: 4250,
      low: 4200,
      open: 4210,
      price_earnings_ttm: 28.3,
      dividends_yield: 1.2,
      return_on_equity_fq: 45.2,
      return_on_assets_fq: 22.1,
      return_on_invested_capital_fq: 35.8,
      price_book_fq: 12.5,
      beta_1_year: 0.8
    },
    {
      symbol_code: "NSE:INFY",
      name: "INFOSYS LTD",
      delay_seconds: 0,
      fundamental_currency: "INR",
      country: "India",
      close: 1876.45,
      volume: 2345678,
      market_cap: 780000000000,
      change: 0.85,
      high: 1890,
      low: 1860,
      open: 1870,
      price_earnings_ttm: 25.7,
      dividends_yield: 2.1,
      return_on_equity_fq: 31.5,
      return_on_assets_fq: 18.9,
      return_on_invested_capital_fq: 28.2,
      price_book_fq: 8.4,
      beta_1_year: 0.7
    },
    {
      symbol_code: "NSE:ICICIBANK",
      name: "ICICI BANK LTD",
      delay_seconds: 0,
      fundamental_currency: "INR",
      country: "India",
      close: 1234.60,
      volume: 8765432,
      market_cap: 865000000000,
      change: -0.45,
      high: 1245,
      low: 1225,
      open: 1240,
      price_earnings_ttm: 19.2,
      dividends_yield: 0.8,
      return_on_equity_fq: 16.8,
      return_on_assets_fq: 1.9,
      return_on_invested_capital_fq: 14.2,
      price_book_fq: 2.1,
      beta_1_year: 1.2
    }
  ]
};

export async function GET() {
  // Return available fields for the screener
  return NextResponse.json({
    available_fields: [
      "close", "volume", "market_cap", "change", "high", "low", "open", 
      "price_earnings_ttm", "dividends_yield", "analyst_rating", "beta_1_year"
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
      fields = ['close', 'volume', 'market_cap', 'change', 'high', 'low', 'open', 'price_earnings_ttm', 'dividends_yield'],
      exchanges = ['NSE', 'BSE'],
      countries = ['IN'],
      page = 1,
      sortBy = 'market_cap',
      sortOrder = 'desc',
      searchTerm,
    } = body;

    // Try to fetch from real API first
    try {
      const requestBody = {
        fields,
        exchanges,
        countries,
        page,
        sortBy,
        sortOrder,
      };

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
        console.log('API Success - received data with', data.data?.length || 0, 'stocks');
        
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

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in POST /api/stocks:', error);
    return NextResponse.json(mockStockData);
  }
}
