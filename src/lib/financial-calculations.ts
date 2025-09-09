// Financial calculations for metrics not directly provided by API

/**
 * Calculate ROCE (Return on Capital Employed)
 * ROCE = EBIT / Capital Employed
 * Where Capital Employed = Total Assets - Current Liabilities
 * 
 * Alternative calculation when EBIT not available:
 * ROCE = Net Income / (Total Assets - Current Liabilities)
 * 
 * Simplified calculation using available fields:
 * ROCE ≈ (Net Income TTM / Total Assets) * (Total Assets / (Total Assets - Total Current Liabilities))
 */
export function calculateROCE(stockData: any): number | null {
    // Method 1: ROCE = EBIT / Capital Employed
    // Capital Employed = Total Equity + Total Debt
    if (stockData.oper_income_ttm && stockData.total_equity_fq && stockData.total_debt_fq) {
        const capitalEmployed = stockData.total_equity_fq + stockData.total_debt_fq;
        if (capitalEmployed > 0) {
            const roce = (stockData.oper_income_ttm / capitalEmployed) * 100;
            if (process.env.NODE_ENV === 'development') {
                console.log(`ROCE Method 1 (Operating Income): ${roce.toFixed(2)}% for ${stockData.symbol_code}`);
            }
            return roce;
        }
    }

    // Method 2: Use net income as proxy for EBIT (add back interest and taxes)
    if (stockData.net_income_ttm && stockData.total_equity_fq && stockData.total_debt_fq) {
        const capitalEmployed = stockData.total_equity_fq + stockData.total_debt_fq;
        if (capitalEmployed > 0) {
            // Approximate EBIT as Net Income * 1.4 (accounting for taxes and interest)
            const approximateEBIT = stockData.net_income_ttm * 1.4;
            const roce = (approximateEBIT / capitalEmployed) * 100;
            if (process.env.NODE_ENV === 'development') {
                console.log(`ROCE Method 2 (Net Income * 1.4): ${roce.toFixed(2)}% for ${stockData.symbol_code}`);
            }
            return roce;
        }
    }

    // Method 3: Use ROA and adjust for leverage
    if (stockData.return_on_assets_fq && stockData.total_assets_fq && stockData.total_equity_fq && stockData.total_debt_fq) {
        const capitalEmployed = stockData.total_equity_fq + stockData.total_debt_fq;
        const totalAssets = stockData.total_assets_fq;
        if (capitalEmployed > 0 && totalAssets > 0) {
            // ROCE = ROA * (Total Assets / Capital Employed)
            const roce = stockData.return_on_assets_fq * (totalAssets / capitalEmployed);
            if (process.env.NODE_ENV === 'development') {
                console.log(`ROCE Method 3 (ROA adjusted): ${roce.toFixed(2)}% for ${stockData.symbol_code}`);
            }
            return roce;
        }
    }

    // Method 4: Estimate from ROE
    if (stockData.return_on_equity_fq && stockData.total_equity_fq && stockData.total_debt_fq) {
        const capitalEmployed = stockData.total_equity_fq + stockData.total_debt_fq;
        const equityRatio = stockData.total_equity_fq / capitalEmployed;
        if (equityRatio > 0) {
            // ROCE ≈ ROE * Equity Ratio (simplified)
            const roce = stockData.return_on_equity_fq * equityRatio;
            if (process.env.NODE_ENV === 'development') {
                console.log(`ROCE Method 4 (ROE * Equity Ratio): ${roce.toFixed(2)}% for ${stockData.symbol_code}`);
            }
            return roce;
        }
    }

    if (process.env.NODE_ENV === 'development') {
        console.log(`Could not calculate ROCE for ${stockData.symbol_code} - missing required fields`);
    }
    return null;
}

/**
 * Calculate Book Value per Share
 * Book Value per Share = Total Equity / Total Shares Outstanding
 */
export function calculateBookValue(stockData: any): number | null {
    // Method 1: Direct calculation from balance sheet
    if (stockData.total_equity_fq && stockData.total_shares_outstanding_current && stockData.total_shares_outstanding_current > 0) {
        const bookValue = stockData.total_equity_fq / stockData.total_shares_outstanding_current;
        if (process.env.NODE_ENV === 'development') {
            console.log(`Book Value Method 1 (Equity/Shares): ₹${bookValue.toFixed(2)} for ${stockData.symbol_code}`);
        }
        return bookValue;
    }

    // Method 2: Use Price-to-Book ratio if available
    if (stockData.close && stockData.price_book_fq && stockData.price_book_fq > 0) {
        const bookValue = stockData.close / stockData.price_book_fq;
        if (process.env.NODE_ENV === 'development') {
            console.log(`Book Value Method 2 (Price/P-B): ₹${bookValue.toFixed(2)} for ${stockData.symbol_code}`);
        }
        return bookValue;
    }

    // Method 3: Estimate from market cap and P/B ratio
    if (stockData.market_cap && stockData.price_book_fq && stockData.price_book_fq > 0) {
        // Market cap / P/B ratio gives total book value
        const totalBookValue = stockData.market_cap / stockData.price_book_fq;
        if (stockData.total_shares_outstanding_current && stockData.total_shares_outstanding_current > 0) {
            const bookValue = totalBookValue / stockData.total_shares_outstanding_current;
            if (process.env.NODE_ENV === 'development') {
                console.log(`Book Value Method 3 (MCap/P-B/Shares): ₹${bookValue.toFixed(2)} for ${stockData.symbol_code}`);
            }
            return bookValue;
        }
    }

    if (process.env.NODE_ENV === 'development') {
        console.log(`Could not calculate Book Value for ${stockData.symbol_code} - missing required fields`);
    }
    return null;
}

/**
 * Calculate additional financial metrics that might be missing
 */
export function calculateFinancialMetrics(stockData: any): any {
    const enriched = { ...stockData };

    // Calculate ROCE if not provided
    if (!enriched.return_on_invested_capital_fq) {
        const calculatedROCE = calculateROCE(stockData);
        if (calculatedROCE !== null) {
            enriched.return_on_invested_capital_fq = calculatedROCE;
            enriched.roce_calculated = true; // Flag to indicate it's calculated
            
            // Debug logging in development
            if (process.env.NODE_ENV === 'development') {
                console.log(`Calculated ROCE for ${stockData.symbol_code}: ${calculatedROCE.toFixed(2)}%`);
            }
        }
    }

    // Calculate Book Value if not provided
    if (!enriched.book_value) {
        const calculatedBookValue = calculateBookValue(stockData);
        if (calculatedBookValue !== null) {
            enriched.book_value = calculatedBookValue;
            enriched.book_value_calculated = true; // Flag to indicate it's calculated
            
            // Debug logging in development
            if (process.env.NODE_ENV === 'development') {
                console.log(`Calculated Book Value for ${stockData.symbol_code}: ₹${calculatedBookValue.toFixed(2)}`);
            }
        }
    }

    // Calculate Price-to-Book if missing but we have book value
    if (!enriched.price_book_fq && enriched.close && enriched.book_value && enriched.book_value > 0) {
        enriched.price_book_fq = enriched.close / enriched.book_value;
        enriched.price_book_calculated = true;
        
        // Debug logging in development
        if (process.env.NODE_ENV === 'development') {
            console.log(`Calculated P/B for ${stockData.symbol_code}: ${enriched.price_book_fq.toFixed(2)}`);
        }
    }

    return enriched;
}

/**
 * Get the fields we need to request from the API for calculations
 */
export const CALCULATION_REQUIRED_FIELDS = [
    // Basic price and volume data
    'close', 'volume', 'market_cap', 'change', 'high', 'low', 'open',

    // Financial statement data for calculations
    'total_assets_fq',
    'total_equity_fq',
    'total_liabilities_fq',
    'total_current_assets_fq',
    'total_debt_fq',
    'net_income_ttm',
    'oper_income_ttm',
    'total_shares_outstanding_current',

    // Ratios that might be provided directly
    'price_book_fq',
    'return_on_equity_fq',
    'return_on_assets_fq',
    'current_ratio_fq',

    // Other useful metrics
    'price_earnings_ttm',
    'dividends_yield',
    'beta_1_year',
    'free_cash_flow_ttm',
    'total_revenue_ttm'
];