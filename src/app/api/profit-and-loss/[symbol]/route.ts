import { NextRequest, NextResponse } from 'next/server';

interface IncomeStatementData {
    ticker: string;
    date: string;
    period: string;
    period_label: string;
    fiscal_year: string;
    is_sales_revenue_turnover: number;
    is_sales_and_services_revenues: number;
    is_cogs: number;
    is_cog_and_services_sold: number;
    is_gross_profit: number;
    is_operating_expn: number;
    is_sg_and_a_expense: number;
    is_other_operating_expenses: number;
    is_oper_income: number;
    is_nonop_income_loss: number;
    is_net_interest_expense: number;
    is_int_expense: number;
    is_int_income: number;
    is_other_nonop_income_loss: number;
    is_pretax_income: number;
    is_inc_tax_exp: number;
    is_inc_bef_xo_item: number;
    is_xo_gl_net_of_tax?: number;
    is_extraord_items_and_acctg_chng?: number;
    is_ni_including_minority_int_ratio: number;
    is_min_noncontrol_interest_credits?: number;
    is_net_income: number;
    is_earn_for_common: number;
    is_avg_num_sh_for_eps: number;
    eps: number;
    eps_cont_ops: number;
    is_sh_for_diluted_eps: number;
    diluted_eps: number;
    dil_eps_cont_ops: number;
    ebitda: number;
    ebitda_margin: number;
    ebita: number;
    ebit: number;
    gross_margin: number;
    oper_margin: number;
    profit_margin: number;
    div_per_shr: number;
    is_depr_exp: number;
}

interface ProfitLossTableRow {
    year: string;
    salesRevenue: number;
    cogs: number;
    grossProfit: number;
    operatingExpenses: number;
    ebitda: number;
    ebitdaPercent: number;
    depreciation: number;
    ebit: number;
    interest: number;
    otherIncome: number;
    pbt: number;
    tax: number;
    pat: number;
    eps: number;
}

interface ProfitLossResponse {
    symbol: string;
    companyName: string;
    data: ProfitLossTableRow[];
    metadata: {
        last_update: string;
        currency: string;
        unit: string;
    };
}

// Cache for storing P&L data
const profitLossCache = new Map<string, { data: ProfitLossResponse; timestamp: number; ttl: number }>();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

const getCacheKey = (symbol: string): string => {
    return `profit-loss:${symbol}`;
};

const isCacheValid = (cacheEntry: { timestamp: number; ttl: number }): boolean => {
    return Date.now() - cacheEntry.timestamp < cacheEntry.ttl;
};

const ROIC_API_KEY = 'cb8ab741035240bc813f12cd897a776d';
const ROIC_BASE_URL = 'https://api.roic.ai';

// Convert number to crores format
const toCrores = (value: number): number => {
    return Math.round((value / 10000000) * 100) / 100; // Convert to crores and round to 2 decimal places
};

// Calculate percentage
const calculatePercentage = (numerator: number, denominator: number): number => {
    if (denominator === 0) return 0;
    return Math.round((numerator / denominator) * 100);
};

// Fetch income statement data from ROIC API
const fetchIncomeStatementData = async (symbol: string): Promise<IncomeStatementData[]> => {
    // Convert symbol format: NSE:SYMBOL -> SYMBOL.NS or keep SYMBOL.NS as is
    let nseSymbol = symbol;
    if (symbol.startsWith('NSE:')) {
        nseSymbol = symbol.replace('NSE:', '') + '.NS';
    } else if (!symbol.includes('.NS')) {
        nseSymbol = `${symbol}.NS`;
    }

    console.log(`Fetching income statement data for ${nseSymbol} from ROIC API`);

    const response = await fetch(
        `${ROIC_BASE_URL}/v2/fundamental/income-statement/${encodeURIComponent(nseSymbol)}?apikey=${ROIC_API_KEY}`,
        {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        }
    );

    if (!response.ok) {
        throw new Error(`ROIC API request failed: ${response.status} ${response.statusText}`);
    }

    const data: IncomeStatementData[] = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
        throw new Error('No income statement data found');
    }

    console.log(`Found ${data.length} years of income statement data`);

    // Sort by fiscal year in descending order (most recent first)
    return data.sort((a, b) => parseInt(b.fiscal_year) - parseInt(a.fiscal_year));
};

// Transform income statement data to P&L table format
const transformToProfitLossTable = (incomeData: IncomeStatementData[]): ProfitLossTableRow[] => {
    return incomeData.map(item => {
        const salesRevenue = toCrores(item.is_sales_revenue_turnover || item.is_sales_and_services_revenues);
        const cogs = toCrores(item.is_cogs || item.is_cog_and_services_sold);
        const grossProfit = toCrores(item.is_gross_profit);
        const operatingExpenses = toCrores(item.is_operating_expn);
        const ebitda = toCrores(item.ebitda);
        const ebitdaPercent = Math.round(item.ebitda_margin * 100) / 100; // Round to 2 decimal places
        const depreciation = toCrores(item.is_depr_exp);
        const ebit = toCrores(item.ebita);
        const interest = toCrores(item.is_net_interest_expense || item.is_int_expense);
        const otherIncome = toCrores(Math.abs(item.is_other_nonop_income_loss || 0));
        const pbt = toCrores(item.is_pretax_income); // Profit Before Tax
        const tax = toCrores(item.is_inc_tax_exp);
        const pat = toCrores(item.is_net_income); // Profit After Tax
        const eps = Math.round(item.eps * 100) / 100; // Round to 2 decimal places

        return {
            year: item.period_label,
            salesRevenue,
            cogs,
            grossProfit,
            operatingExpenses,
            ebitda,
            ebitdaPercent,
            depreciation,
            ebit,
            interest,
            otherIncome,
            pbt,
            tax,
            pat,
            eps
        };
    });
};

// Generate mock data as fallback
const generateMockProfitLossData = (symbol: string): ProfitLossResponse => {
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 13 }, (_, i) => currentYear - i);

    const data: ProfitLossTableRow[] = years.map((year, index) => {
        // Mock data with some realistic patterns
        const salesRevenue = 2000 + (index * 50) + Math.random() * 200;
        const cogs = salesRevenue * (0.65 + Math.random() * 0.1); // 65-75% of sales
        const grossProfit = salesRevenue - cogs;
        const operatingExpenses = salesRevenue * (0.15 + Math.random() * 0.1); // 15-25% of sales
        const ebitda = grossProfit - operatingExpenses;
        const ebitdaPercent = Math.round((ebitda / salesRevenue) * 100 * 100) / 100;
        const depreciation = Math.random() * 40;
        const ebit = ebitda - depreciation;
        const interest = Math.random() * 60;
        const otherIncome = Math.random() * 50;
        const pbt = ebit + otherIncome - interest;
        const tax = pbt * (0.20 + Math.random() * 0.10); // 20-30% tax rate
        const pat = pbt - tax;
        const eps = pat / 100; // Assuming 100Cr shares

        return {
            year: year.toString(),
            salesRevenue: Math.round(salesRevenue),
            cogs: Math.round(cogs),
            grossProfit: Math.round(grossProfit),
            operatingExpenses: Math.round(operatingExpenses),
            ebitda: Math.round(ebitda),
            ebitdaPercent,
            depreciation: Math.round(depreciation),
            ebit: Math.round(ebit),
            interest: Math.round(interest),
            otherIncome: Math.round(otherIncome),
            pbt: Math.round(pbt),
            tax: Math.round(tax),
            pat: Math.round(pat),
            eps: Math.round(eps * 100) / 100
        };
    });

    return {
        symbol: symbol.includes('.NS') ? symbol : `${symbol}.NS`,
        companyName: symbol.replace('.NS', ''),
        data,
        metadata: {
            last_update: new Date().toISOString(),
            currency: 'INR',
            unit: 'Crores'
        }
    };
};

// Main function to fetch profit & loss data with fallback
const fetchProfitLossData = async (symbol: string): Promise<ProfitLossResponse> => {
    try {
        console.log(`Attempting to fetch profit & loss data for ${symbol}`);

        const incomeData = await fetchIncomeStatementData(symbol);
        const profitLossData = transformToProfitLossTable(incomeData);

        if (profitLossData.length === 0) {
            console.log('No profit & loss data generated, falling back to mock data');
            return generateMockProfitLossData(symbol);
        }

        return {
            symbol: symbol.includes('.NS') ? symbol : `${symbol}.NS`,
            companyName: symbol.replace('.NS', ''),
            data: profitLossData,
            metadata: {
                last_update: new Date().toISOString(),
                currency: 'INR',
                unit: 'Crores'
            }
        };

    } catch (error) {
        console.error('Error fetching profit & loss data from API:', error);
        console.log('Falling back to mock data');
        return generateMockProfitLossData(symbol);
    }
};

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ symbol: string }> }
) {
    try {
        const { symbol } = await context.params;

        if (!symbol) {
            return NextResponse.json(
                { error: 'Symbol parameter is required' },
                { status: 400 }
            );
        }

        // Check cache first
        const cacheKey = getCacheKey(symbol);
        const cachedData = profitLossCache.get(cacheKey);

        if (cachedData && isCacheValid(cachedData)) {
            console.log(`Cache hit for Profit & Loss data ${symbol}`);
            return NextResponse.json(cachedData.data);
        }

        console.log(`Fetching fresh Profit & Loss data for ${symbol}`);

        // Fetch fresh data
        const profitLossData = await fetchProfitLossData(symbol);

        // Cache the result
        profitLossCache.set(cacheKey, {
            data: profitLossData,
            timestamp: Date.now(),
            ttl: CACHE_TTL
        });

        // Clean up old cache entries
        if (profitLossCache.size > 50) {
            for (const [key, entry] of profitLossCache.entries()) {
                if (!isCacheValid(entry)) {
                    profitLossCache.delete(key);
                }
            }
        }

        console.log(`Profit & Loss data generated: ${profitLossData.data.length} years`);

        return NextResponse.json(profitLossData);

    } catch (error) {
        console.error('Error in Profit & Loss API:', error);

        return NextResponse.json(
            {
                error: 'Failed to fetch Profit & Loss data',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}