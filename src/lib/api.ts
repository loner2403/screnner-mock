// API service for RapidAPI stock screener
export interface StockData {
  symbol_code: string;
  name: string;
  delay_seconds: number;
  fundamental_currency: string;
  country: string;
  close: number;
  volume: number;
  market_cap: number;
  change?: number;
  high?: number;
  low?: number;
  open?: number;
  price_earnings_ttm?: number;
  dividends_yield?: number;
  return_on_equity_fq?: number;
  return_on_assets_fq?: number;
  return_on_invested_capital_fq?: number;
  price_book_fq?: number;
  beta_1_year?: number;
  // Additional fields for charting and analysis
  performance_week?: number;
  performance_month?: number;
  performance_3_month?: number;
  performance_6_month?: number;
  performance_year?: number;
  performance_5_year?: number;
  volatility_week?: number;
  volatility_month?: number;
  average_volume_10d?: number;
  average_volume_30d?: number;
  free_cash_flow_ttm?: number;
  net_income_ttm?: number;
  total_revenue_ttm?: number;
}

export interface ScreenerResponse {
  hasNext: boolean;
  current_page: number;
  total_page: number;
  current_items: number;
  data: StockData[];
}

export interface ScreenerFields {
  available_fields: string[];
  available_exchanges: string[];
  available_countries: string[];
  sortOrder: string[];
}

// Get available fields, exchanges, and countries
export async function getScreenerFields(): Promise<ScreenerFields> {
  try {
    const response = await fetch('/api/stocks', {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching screener fields:', error);
    throw error;
  }
}

// Search stocks with filters
export async function searchStocks(params: {
  fields?: string[];
  exchanges?: string[];
  countries?: string[];
  page?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  searchTerm?: string;
}): Promise<ScreenerResponse> {
  try {
    const response = await fetch('/api/stocks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error searching stocks:', error);
    throw error;
  }
}

// Format currency values
export function formatCurrency(value: number, currency = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

// Format large numbers (market cap, volume)
export function formatLargeNumber(value: number): string {
  if (value >= 1e12) {
    return `₹${(value / 1e12).toFixed(2)}T`;
  } else if (value >= 1e9) {
    return `₹${(value / 1e9).toFixed(2)}B`;
  } else if (value >= 1e7) {
    return `₹${(value / 1e7).toFixed(2)}Cr`;
  } else if (value >= 1e5) {
    return `₹${(value / 1e5).toFixed(2)}L`;
  } else if (value >= 1e3) {
    return `₹${(value / 1e3).toFixed(2)}K`;
  }
  return `₹${value.toFixed(2)}`;
}

// Format market cap specifically to match reference
export function formatMarketCap(value: number): string {
  if (value >= 1e12) {
    return `${(value / 1e12).toFixed(2)}B`; // Remove ₹ symbol for market cap display
  } else if (value >= 1e9) {
    return `${(value / 1e9).toFixed(2)}B`;
  } else if (value >= 1e7) {
    return `${(value / 1e7).toFixed(2)}Cr`;
  } else if (value >= 1e5) {
    return `${(value / 1e5).toFixed(2)}L`;
  } else if (value >= 1e3) {
    return `${(value / 1e3).toFixed(2)}K`;
  }
  return `${value.toFixed(2)}`;
}

// Format percentage change
export function formatPercentage(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '0.00%';
  }
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

