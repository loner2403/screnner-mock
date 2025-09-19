import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const ROIC_API_KEY = process.env.ROIC_API_KEY;

if (!ROIC_API_KEY) {
  throw new Error('ROIC_API_KEY environment variable is required');
}
const ROIC_BASE_URL = 'https://api.roic.ai/v2';

// Generate mock balance sheet data for fallback
function generateMockBalanceSheetData(symbol: string) {
  const isBank = symbol.includes('BANK') || symbol.includes('HDFC') || symbol.includes('ICICI') || symbol.includes('SBIN');
  const years = 12;
  const historicalYears = Array.from({ length: years }, (_, i) => (2014 + i).toString());
  
  // Generate realistic historical progression
  const generateHistoricalData = (base: number, growthRate: number = 0.10) => {
    return Array.from({ length: years }, (_, i) => {
      const factor = Math.pow(1 + growthRate, i - (years - 1));
      return Math.round(base * factor);
    });
  };
  
  const baseData = {
    years: historicalYears,
    company_name: symbol,
    sector: isBank ? 'Private Sector Bank' : 'Technology',
    'sector-i18n-en': isBank ? 'Private Sector Bank' : 'Technology',
    report_type: isBank ? 'banking' : 'non-banking'
  };
  
  if (isBank) {
    // Banking-specific mock data
    return {
      ...baseData,
      // Assets
      total_assets_fy_h: generateHistoricalData(250000, 0.12),
      loans_net_fy_h: generateHistoricalData(150000, 0.13),
      loans_gross_fy_h: generateHistoricalData(155000, 0.13),
      long_term_investments_fy_h: generateHistoricalData(45000, 0.08),
      ppe_total_net_fy_h: generateHistoricalData(3500, 0.05),
      loan_loss_allowances_fy_h: generateHistoricalData(5000, 0.10),
      deferred_tax_assests_fy_h: generateHistoricalData(1800, 0.08),
      goodwill_fy_h: generateHistoricalData(2200, 0.04),
      intangibles_net_fy_h: generateHistoricalData(1500, 0.05),
      investments_in_unconcsolidate_fy_h: generateHistoricalData(6500, 0.07),
      other_investments_fy_h: generateHistoricalData(3800, 0.09),
      
      // Liabilities
      total_liabilities_fy_h: generateHistoricalData(220000, 0.12),
      total_deposits_fy_h: generateHistoricalData(180000, 0.11),
      total_debt_fy_h: generateHistoricalData(25000, 0.09),
      other_liabilities_total_fy_h: generateHistoricalData(15000, 0.10),
      
      // Equity
      total_equity_fy_h: generateHistoricalData(30000, 0.15),
      common_stock_par_fy_h: generateHistoricalData(500, 0.02),
      retained_earnings_fy_h: generateHistoricalData(25000, 0.16),
      common_equity_total_fy_h: generateHistoricalData(29500, 0.15)
    };
  } else {
    // Non-banking mock data
    return {
      ...baseData,
      // Assets
      total_assets_fy_h: generateHistoricalData(85000, 0.10),
      ppe_total_net_fy_h: generateHistoricalData(25000, 0.08),
      long_term_investments_fy_h: generateHistoricalData(15000, 0.12),
      long_term_other_assets_total_fy_h: generateHistoricalData(10000, 0.09),
      deferred_tax_assests_fy_h: generateHistoricalData(35000000000, 0.07),
      goodwill_fy_h: generateHistoricalData(50000000000, 0.05),
      intangibles_net_fy_h: generateHistoricalData(25000000000, 0.06),
      investments_in_unconcsolidate_fy_h: generateHistoricalData(80000000000, 0.09),
      other_investments_fy_h: generateHistoricalData(45000000000, 0.08),
      cwip_fy_h: generateHistoricalData(2000, 0.15),
      
      // Liabilities
      total_liabilities_fy_h: generateHistoricalData(45000, 0.09),
      total_debt_fy_h: generateHistoricalData(15000, 0.07),
      total_current_liabilities_fy_h: generateHistoricalData(20000, 0.10),
      other_liabilities_total_fy_h: generateHistoricalData(10000, 0.08),
      
      // Equity
      total_equity_fy_h: generateHistoricalData(40000, 0.12),
      common_stock_par_fy_h: generateHistoricalData(1000, 0.01),
      retained_earnings_fy_h: generateHistoricalData(35000, 0.13),
      common_equity_total_fy_h: generateHistoricalData(39000, 0.12)
    };
  }
}

// Map ROIC API response data to balance sheet format
function mapRoicToBalanceSheetData(roicData: any[], symbol: string): any {
  console.log(`Mapping ROIC API data for ${symbol}`);

  if (!Array.isArray(roicData) || roicData.length === 0) {
    console.log('No ROIC data available, using mock fallback');
    return null;
  }

  // Sort data by fiscal year (most recent first)
  const sortedData = roicData.sort((a, b) => {
    const yearA = parseInt(a.fiscal_year || '0');
    const yearB = parseInt(b.fiscal_year || '0');
    return yearB - yearA;
  });

  // Get years from the data
  const years = sortedData.map(item => item.fiscal_year || item.period_label).filter(Boolean);

  const isBank = symbol.includes('BANK') || symbol.includes('HDFC') || symbol.includes('ICICI') || symbol.includes('SBIN');

  // Helper function to extract historical array from sorted data
  function extractHistoricalArray(fieldName: string): (number | null)[] {
    return sortedData.map(item => {
      const value = item[fieldName];
      return value !== null && value !== undefined && !isNaN(value) ? Number(value) : null;
    }).reverse(); // Reverse to get chronological order (oldest to newest)
  }

  // Helper function to convert values from original currency to crores
  function convertToCrores(value: number | null): number | null {
    if (value === null || value === undefined) return null;
    // ROIC API returns values in original currency, convert to crores (divide by 10^7)
    const crores = value / 10000000;
    return Math.round(crores * 100) / 100; // Round to 2 decimal places
  }

  const balanceSheetData: any = {
    years: years.reverse(), // Chronological order (oldest to newest)
    company_name: sortedData[0]?.ticker || symbol,
    sector: isBank ? 'Private Sector Bank' : 'Technology',
    'sector-i18n-en': isBank ? 'Private Sector Bank' : 'Technology',
    report_type: isBank ? 'banking' : 'non-banking'
  };

  // Define field mappings from ROIC API fields to expected balance sheet fields
  const fieldMappings = [
    // ASSETS
    // Non-current Assets
    { roicField: 'bs_net_fix_asset', balanceSheetField: 'ppe_total_net_fy_h' }, // Property, plant & equipment (net)
    { roicField: 'bs_goodwill', balanceSheetField: 'goodwill_fy_h' }, // Goodwill
    { roicField: 'bs_other_intangible_assets_detailed', balanceSheetField: 'intangibles_net_fy_h' }, // Other intangible assets
    { roicField: 'bs_disclosed_intangibles', balanceSheetField: 'intangibles_total_fy_h' }, // Total intangibles
    { roicField: 'bs_other_noncurrent_assets_detailed', balanceSheetField: 'other_noncurrent_assets_fy_h' }, // Other non-current assets
    { roicField: 'bs_tot_non_cur_asset', balanceSheetField: 'total_noncurrent_assets_fy_h' }, // Total non-current assets

    // Current Assets
    { roicField: 'bs_inventories', balanceSheetField: 'total_inventory_fy_h' }, // Inventories
    { roicField: 'bs_accts_rec_excl_notes_rec', balanceSheetField: 'accounts_receivable_fy_h' }, // Accounts receivable
    { roicField: 'bs_cash_near_cash_item', balanceSheetField: 'cash_fy_h' }, // Cash and near cash
    { roicField: 'bs_c_and_ce_and_sti_detailed', balanceSheetField: 'cash_and_short_term_investments_fy_h' }, // Cash & short-term investments
    { roicField: 'bs_mkt_sec_other_st_invest', balanceSheetField: 'short_term_investments_fy_h' }, // Short-term investments
    { roicField: 'bs_other_current_assets_detailed', balanceSheetField: 'other_current_assets_fy_h' }, // Other current assets
    { roicField: 'bs_cur_asset_report', balanceSheetField: 'total_current_assets_fy_h' }, // Total current assets

    // Total Assets
    { roicField: 'bs_tot_asset', balanceSheetField: 'total_assets_fy_h' }, // Total assets

    // LIABILITIES
    // Current Liabilities
    { roicField: 'bs_acct_payable', balanceSheetField: 'accounts_payable_fy_h' }, // Accounts payable
    { roicField: 'bs_st_borrow', balanceSheetField: 'short_term_debt_fy_h' }, // Short-term borrowings
    { roicField: 'bs_other_current_liabs_detailed', balanceSheetField: 'other_current_liabilities_fy_h' }, // Other current liabilities
    { roicField: 'bs_cur_liab', balanceSheetField: 'total_current_liabilities_fy_h' }, // Total current liabilities

    // Non-current Liabilities
    { roicField: 'bs_lt_borrow', balanceSheetField: 'long_term_debt_fy_h' }, // Long-term borrowings
    { roicField: 'bs_other_noncurrent_liabs_detailed', balanceSheetField: 'other_noncurrent_liabilities_fy_h' }, // Other non-current liabilities
    { roicField: 'bs_non_cur_liab', balanceSheetField: 'total_noncurrent_liabilities_fy_h' }, // Total non-current liabilities

    // Total Liabilities
    { roicField: 'bs_tot_liab', balanceSheetField: 'total_liabilities_fy_h' }, // Total liabilities

    // EQUITY
    { roicField: 'bs_common_stock', balanceSheetField: 'common_stock_fy_h' }, // Common stock
    { roicField: 'bs_add_paid_in_cap', balanceSheetField: 'paid_in_capital_fy_h' }, // Additional paid-in capital
    { roicField: 'bs_pure_retained_earnings', balanceSheetField: 'retained_earnings_fy_h' }, // Retained earnings
    { roicField: 'bs_minority_noncontrolling_interest', balanceSheetField: 'minority_interest_fy_h' }, // Minority interest
    { roicField: 'bs_total_equity', balanceSheetField: 'total_equity_fy_h' }, // Total equity

    // Combined fields
    { roicField: 'bs_sh_cap_and_apic', balanceSheetField: 'total_share_capital_fy_h' }, // Share capital + APIC
  ];

  // Map each field
  fieldMappings.forEach(({ roicField, balanceSheetField }) => {
    const rawValues = extractHistoricalArray(roicField);
    const convertedValues = rawValues.map(value => convertToCrores(value));
    balanceSheetData[balanceSheetField] = convertedValues;

    if (convertedValues.some(v => v !== null)) {
      console.log(`Mapped ${roicField} -> ${balanceSheetField}: ${convertedValues.filter(v => v !== null).length} non-null values`);
    }
  });

  // Calculate total debt (short-term + long-term)
  const shortTermDebt = balanceSheetData.short_term_debt_fy_h || [];
  const longTermDebt = balanceSheetData.long_term_debt_fy_h || [];
  balanceSheetData.total_debt_fy_h = shortTermDebt.map((st: number | null, i: number) => {
    const stValue = st || 0;
    const ltValue = longTermDebt[i] || 0;
    return stValue + ltValue;
  });

  console.log('Mapped ROIC balance sheet data:', {
    symbol,
    isBank,
    sector: balanceSheetData.sector,
    reportType: balanceSheetData.report_type,
    fieldsGenerated: Object.keys(balanceSheetData).filter(k => k.endsWith('_fy_h')).length,
    yearsCount: balanceSheetData.years.length,
    years: balanceSheetData.years
  });

  return balanceSheetData;
}

// Fetch balance sheet data from ROIC API
async function fetchRoicBalanceSheetData(symbol: string): Promise<any> {
  try {
    // Clean symbol - remove NSE: prefix if present, then append .NS
    const cleanSymbol = symbol.includes(':') ? symbol.split(':')[1] : symbol;
    const tickerSymbol = cleanSymbol.includes('.NS') ? cleanSymbol : `${cleanSymbol}.NS`;

    console.log(`Fetching balance sheet data from ROIC API for symbol: ${tickerSymbol}`);

    const response = await fetch(
      `${ROIC_BASE_URL}/fundamental/balance-sheet/${tickerSymbol}?apikey=${ROIC_API_KEY}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      console.error(`ROIC API response not OK: ${response.status} ${response.statusText}`);
      throw new Error(`Failed to fetch data: ${response.status}`);
    }

    const responseData = await response.json();
    console.log(`ROIC API response received for ${tickerSymbol}:`, {
      dataLength: Array.isArray(responseData) ? responseData.length : 'Not an array',
      firstItemKeys: Array.isArray(responseData) && responseData.length > 0 ? Object.keys(responseData[0]).slice(0, 10) : 'No data'
    });

    return responseData;

  } catch (error) {
    console.error('Error fetching ROIC API data:', error);
    // Return empty array to trigger fallback mock data
    return [];
  }
}

// Load data from local JSON file as fallback
function loadLocalApiData(symbol: string): any[] {
  try {
    const filePath = path.join(process.cwd(), 'balance-sheet.json');
    if (!fs.existsSync(filePath)) {
      console.log('Local balance-sheet.json file not found');
      return [];
    }

    const fileContent = fs.readFileSync(filePath, 'utf8');
    const balanceSheetData = JSON.parse(fileContent);

    if (Array.isArray(balanceSheetData)) {
      // Find data matching the symbol
      const cleanSymbol = symbol.includes(':') ? symbol.split(':')[1] : symbol;
      const symbolData = balanceSheetData.filter(item =>
        item.ticker && item.ticker.includes(cleanSymbol.toUpperCase())
      );

      if (symbolData.length > 0) {
        console.log(`Found local balance sheet data for ${symbol}: ${symbolData.length} entries`);
        return symbolData;
      } else {
        console.log(`Using all local balance sheet data as fallback: ${balanceSheetData.length} entries`);
        return balanceSheetData;
      }
    }

    return [];
  } catch (error) {
    console.error('Error loading local balance sheet data:', error);
    return [];
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { symbol: string } }
) {
  try {
    const { symbol } = await params;

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol parameter is required' },
        { status: 400 }
      );
    }

    console.log(`Fetching balance sheet data for symbol: ${symbol}`);

    // Try to fetch data from ROIC API first
    let roicData = await fetchRoicBalanceSheetData(symbol.toUpperCase());

    // If ROIC API fails, try local JSON file
    if (!roicData || (Array.isArray(roicData) && roicData.length === 0)) {
      console.log('ROIC API failed, trying local JSON file');
      roicData = loadLocalApiData(symbol.toUpperCase());

      if (!roicData || (Array.isArray(roicData) && roicData.length === 0)) {
        console.log('No data available, using mock fallback');
        const mockData = generateMockBalanceSheetData(symbol.toUpperCase());
        return NextResponse.json(mockData);
      }
    }

    // Map the ROIC API data to balance sheet format
    const balanceSheetData = mapRoicToBalanceSheetData(roicData, symbol.toUpperCase());

    // If mapping failed, use mock data
    if (!balanceSheetData) {
      console.log('Data mapping failed, using mock fallback');
      const mockData = generateMockBalanceSheetData(symbol.toUpperCase());
      return NextResponse.json(mockData);
    }

    console.log('Processed balance sheet data for', symbol, ':', {
      companyName: balanceSheetData.company_name,
      sector: balanceSheetData.sector,
      reportType: balanceSheetData.report_type,
      hasAssets: !!balanceSheetData.total_assets_fy_h,
      hasLiabilities: !!balanceSheetData.total_liabilities_fy_h,
      hasEquity: !!balanceSheetData.total_equity_fy_h,
      fieldsAvailable: Object.keys(balanceSheetData).filter(k => k.endsWith('_fy_h')).length
    });

    return NextResponse.json(balanceSheetData);

  } catch (error) {
    console.error('Error in balance sheet API:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}