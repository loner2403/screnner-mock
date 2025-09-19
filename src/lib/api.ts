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
    // Handle different currencies appropriately
    const locale = currency === 'INR' ? 'en-IN' : 'en-US';

    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
}

// Format large numbers (market cap, volume) - assumes INR for market cap
export function formatLargeNumber(value: number, currency: string = 'INR'): string {
    const symbol = currency === 'INR' ? '₹' : '$';

    if (value >= 1e12) {
        return `${symbol}${(value / 1e12).toFixed(2)}T`;
    } else if (value >= 1e9) {
        return `${symbol}${(value / 1e9).toFixed(2)}B`;
    } else if (value >= 1e7) {
        return `${symbol}${(value / 1e7).toFixed(2)}Cr`;
    } else if (value >= 1e5) {
        return `${symbol}${(value / 1e5).toFixed(2)}L`;
    } else if (value >= 1e3) {
        return `${symbol}${(value / 1e3).toFixed(2)}K`;
    }
    return `${symbol}${value.toFixed(2)}`;
}

// Format market cap specifically in crores (assumes INR after conversion)
export function formatMarketCap(value: number): string {
    if (value >= 1e7) {
        const crores = (value / 1e7);
        // Add comma formatting for large numbers
        if (crores >= 1000) {
            return `₹${crores.toLocaleString('en-IN', { maximumFractionDigits: 0 })} Cr`;
        }
        return `₹${crores.toFixed(0)} Cr`;
    } else if (value >= 1e5) {
        return `₹${(value / 1e5).toFixed(0)} L`;
    } else if (value >= 1e3) {
        return `₹${(value / 1e3).toFixed(0)} K`;
    }
    return `₹${value.toFixed(0)}`;
}

// Format percentage change
export function formatPercentage(value: number | null | undefined): string {
    if (value === null || value === undefined || isNaN(value)) {
        return '0.00%';
    }
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
}

// Quarterly Results API interfaces and functions
export interface QuarterlyDataResponse {
    // Quarterly historical arrays (up to 32 quarters)
    revenue_fq_h?: number[];
    total_revenue_fq_h?: number[];
    interest_income_fq_h?: number[];
    interest_expense_fq_h?: number[];
    interest_income_net_fq_h?: number[];
    net_interest_margin_fq_h?: number[];
    non_interest_income_fq_h?: number[];
    total_oper_expense_fq_h?: number[];
    oper_income_fq_h?: number[];
    operating_margin_fq_h?: number[];
    non_oper_income_fq_h?: number[];
    non_oper_interest_income_fq_h?: number[];
    depreciation_fq_h?: number[];
    pretax_income_fq_h?: number[];
    tax_rate_fq_h?: number[];
    net_income_fq_h?: number[];
    earnings_per_share_basic_fq_h?: number[];
    nonperf_loans_loans_gross_fq_h?: number[];
    loan_loss_provision_fq_h?: number[];
    
    // Banking specific fields
    total_deposits_fq_h?: number[];
    loans_net_fq_h?: number[];
    loans_gross_fq_h?: number[];
    loan_loss_allowances_fq_h?: number[];
    
    // Quarter metadata
    quarters_info?: {
        dates: string[];
        periods: string[];
    };
    
    // Company metadata
    sector?: string;
    industry?: string;
    company_type?: string;
}

// Fetch quarterly data for a specific symbol
export async function fetchQuarterlyData(symbol: string): Promise<QuarterlyDataResponse> {
    try {
        const response = await fetch(`/api/quarterly/${symbol}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching quarterly data:', error);
        throw error;
    }
}

// Balance sheet data response interface
export interface BalanceSheetDataResponse {
    [key: string]: any;
    sector?: string;
    industry?: string;
    company_type?: string;
}

// Fetch balance sheet data for a specific symbol
export async function fetchBalanceSheetData(symbol: string): Promise<BalanceSheetDataResponse> {
    try {
        const response = await fetch(`/api/balancesheet/${symbol}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching balance sheet data:', error);
        throw error;
    }
}


export interface ProfitAndLossDataResponse {
    [key: string]: any;
    sector?: string;
    industry?: string;
    company_type?: string;
}

// Fetch Profit and Loss data for a specific symbol
export async function fetchProfitAndLossData(symbol: string): Promise<ProfitAndLossDataResponse> {
    try {
        const response = await fetch(`/api/profit-and-loss/${symbol}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching profit and loss data:', error);
        throw error;
    }
}

// Ratios data response interface
export interface RatiosDataResponse {
    [key: string]: any;
    sector?: string;
    industry?: string;
    company_type?: string;
}

// Fetch Ratios data for a specific symbol
export async function fetchRatiosData(symbol: string): Promise<RatiosDataResponse> {
    try {
        const response = await fetch(`/api/ratios/${symbol}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching ratios data:', error);
        throw error;
    }
}

// Search stocks by name interface
export interface SearchResult {
    symbol: string;
    name: string;
    exchange?: string;
}

export interface SearchResponse {
    results: SearchResult[];
}

// Search stocks by company name using ROIC API
export async function searchStocksByName(query: string, limit: number = 10): Promise<SearchResponse> {
    try {
        const response = await fetch(`/api/search?query=${encodeURIComponent(query)}&limit=${limit}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error searching stocks by name:', error);
        throw error;
    }
}
