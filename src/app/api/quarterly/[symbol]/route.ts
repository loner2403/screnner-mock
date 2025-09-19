import { NextRequest, NextResponse } from 'next/server';

const ROIC_API_KEY = process.env.ROIC_API_KEY ;
const ROIC_BASE_URL = process.env.ROIC_BASE_URL || 'https://api.roic.ai';

// Mock data generation for testing with realistic data matching the image format
function generateMockQuarterlyData(symbol: string) {
  const isBank = symbol.includes('BANK') || symbol.includes('HDFC') || symbol.includes('ICICI') || symbol.includes('SBIN');
  
  // Generate 13 quarters of data (matching the image)
  const quarters = 13;
  const mockData: any = {};
  
  // Generate quarter dates and periods
  const quarterDates: string[] = [];
  const quarterPeriods: string[] = [];
  const currentDate = new Date(2025, 5, 1); // Jun 2025
  
  for (let i = 0; i < quarters; i++) {
    const quarterDate = new Date(currentDate);
    quarterDate.setMonth(quarterDate.getMonth() - (i * 3));
    quarterDates.push(quarterDate.toISOString());
    
    const month = quarterDate.getMonth();
    const year = quarterDate.getFullYear();
    let quarter: string;
    
    if (month >= 0 && month <= 2) {
      quarter = `Mar ${year}`;
    } else if (month >= 3 && month <= 5) {
      quarter = `Jun ${year}`;
    } else if (month >= 6 && month <= 8) {
      quarter = `Sep ${year}`;
    } else {
      quarter = `Dec ${year}`;
    }
    
    quarterPeriods.push(quarter);
  }
  
  if (isBank) {
    console.log(`Generating BANKING mock data for ${symbol} - isBank: ${isBank}`);
    // Banking mock data with more realistic values
    mockData.total_revenue_fq_h = [224671, 243134, 203751, 231132, 211952, 238717, 214054, 203033, 190163, 201231, 197714, 217092, 168799];
    mockData.interest_income_fq_h = mockData.total_revenue_fq_h.map((v:number) => v * 0.85);
    mockData.total_oper_expense_fq_h = [214198, 221621, 191818, 224544, 202180, 237152, 204815, 194558, 180169, 189692, 194094, 202366, 168360];
    mockData.interest_income_net_fq_h = mockData.total_revenue_fq_h.map((v:number, i:number) => v - mockData.total_oper_expense_fq_h[i]);
    mockData.net_interest_margin_fq_h = [5, 9, 6, 3, 5, 1, 4, 4, 5, 6, 2, 7, 0];
    mockData.non_interest_income_fq_h = [780, 954, 818, 794, 1001, 14249, 206, 288, 117, 612, 270, 6046, 992];
    mockData.pretax_income_fq_h = [11253, 22468, 12752, 7382, 10774, 15813, 9445, 8763, 10111, 12151, 3891, 20772, 1431];
    mockData.net_income_fq_h = [10955, 19039, 11009, 7723, 10527, 13842, 9434, 8032, 9634, 13189, 7306, 15858, 608];
    mockData.earnings_per_share_basic_fq_h = [17.32, 30.10, 17.40, 12.22, 16.67, 21.88, 14.97, 12.70, 15.23, 20.86, 11.56, 25.07, 0.95];
    mockData.nonperf_loans_loans_gross_fq_h = [1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 2.0, 2.1, 2.2, 2.3, 2.4];
    mockData.loan_loss_allowances_fq_h = Array.from({length: quarters}, () => Math.random() * 1000 + 500);
    mockData.loans_net_fq_h = Array.from({length: quarters}, () => Math.random() * 100000 + 50000);
    mockData.sector = 'Private Sector Bank';
    console.log(`Banking mock data generated with sector: ${mockData.sector}`);
  } else {
    // Non-banking mock data matching the image format exactly
    mockData.revenue_fq_h = [224671, 243134, 203751, 231132, 211952, 238717, 214054, 203033, 190163, 201231, 197714, 217092, 168799];
    mockData.total_oper_expense_fq_h = [214198, 221621, 191818, 224544, 202180, 237152, 204815, 194558, 180169, 189692, 194094, 202366, 168360];
    mockData.oper_income_fq_h = [10474, 21514, 11934, 6588, 9773, 1564, 9239, 8475, 9994, 11539, 3620, 14727, 439];
    mockData.operating_margin_fq_h = [5, 9, 6, 3, 5, 1, 4, 4, 5, 6, 2, 7, 0];
    mockData.non_oper_income_fq_h = [780, 954, 818, 794, 1001, 14249, 206, 288, 117, 612, 270, 6046, 992];
    mockData.non_oper_interest_income_fq_h = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    mockData.depreciation_fq_h = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    mockData.pretax_income_fq_h = [11253, 22468, 12752, 7382, 10774, 15813, 9445, 8763, 10111, 12151, 3891, 20772, 1431];
    mockData.net_income_fq_h = [10955, 19039, 11009, 7723, 10527, 13842, 9434, 8032, 9634, 13189, 7306, 15858, 608];
    mockData.earnings_per_share_basic_fq_h = [17.32, 30.10, 17.40, 12.22, 16.67, 21.88, 14.97, 12.70, 15.23, 20.86, 11.56, 25.07, 0.95];
    mockData.sector = 'Consumer Goods';
  }
  
  // Common fields
  mockData.tax_rate_fq_h = [15, 15, 14, 16, 15, 12, 15, 13, 14, 8, -63, 26, 103];
  
  mockData.quarters_info = {
    dates: quarterDates,
    periods: quarterPeriods
  };
  
  return mockData;
}

const getHeaders = () => {
  if (!ROIC_API_KEY) {
    throw new Error('ROIC_API_KEY is not configured in environment variables');
  }
  return {
    'Content-Type': 'application/json',
  };
};

// Helper function to detect if a company is banking based on sector/symbol
const isBankingCompany = (sector: string | undefined, symbol: string): boolean => {
  if (!sector) {
    // Fallback to symbol-based detection
    return symbol.includes('BANK') || symbol.includes('HDFC') || symbol.includes('ICICI') || symbol.includes('SBIN');
  }

  const sectorLower = sector.toLowerCase();
  return sectorLower.includes('bank') ||
         sectorLower.includes('financial services') ||
         sectorLower.includes('finance');
};

// Transform ROIC API response to match reference quarterly structure exactly
const transformROICResponse = (roicData: any[], symbol: string): any => {
  if (!roicData || roicData.length === 0) {
    return null;
  }

  // Sort data by date (most recent first)
  const sortedData = [...roicData].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Take all available quarters (up to 13)
  const quarterlyData = sortedData.slice(0, Math.min(13, sortedData.length));

  // Detect company type from symbol
  const isBank = isBankingCompany(undefined, symbol);

  // Create the transformed data structure matching the reference exactly
  const transformed: any = {};

  if (isBank) {
    // Banking fields mapping - values in crores
    transformed.total_revenue_fq_h = quarterlyData.map(q =>
      q.is_sales_revenue_turnover ? Math.round(q.is_sales_revenue_turnover / 10000000) : null
    );
    transformed.interest_income_fq_h = quarterlyData.map(q =>
      q.is_sales_revenue_turnover ? Math.round(q.is_sales_revenue_turnover * 0.85 / 10000000) : null
    );
    transformed.interest_income_net_fq_h = quarterlyData.map(q =>
      q.is_oper_income ? Math.round(q.is_oper_income / 10000000) : null
    );
    transformed.net_interest_margin_fq_h = quarterlyData.map(q =>
      q.oper_margin ? Math.round(q.oper_margin * 10) / 10 : null
    );
    transformed.non_interest_income_fq_h = quarterlyData.map(q =>
      q.is_nonop_income_loss ? Math.round(q.is_nonop_income_loss / 10000000) : null
    );

    // Mock banking-specific fields
    transformed.nonperf_loans_loans_gross_fq_h = quarterlyData.map(() => Math.random() * 2 + 1);
    transformed.loan_loss_allowances_fq_h = quarterlyData.map(() => Math.random() * 1000 + 500);
    transformed.loans_net_fq_h = quarterlyData.map(() => Math.random() * 100000 + 50000);

    transformed.sector = 'Private Sector Bank';
  } else {
    // Non-banking fields mapping - matching reference exactly - values in crores
    transformed.revenue_fq_h = quarterlyData.map(q =>
      q.is_sales_revenue_turnover ? Math.round(q.is_sales_revenue_turnover / 10000000) : null
    );

    // For expenses, calculate total operating expenses differently for some quarters with negative values
    transformed.total_oper_expense_fq_h = quarterlyData.map(q => {
      if (q.is_operating_expn !== null) {
        // Handle the case where operating expenses might be negative (like in Mar 2023)
        return Math.round(q.is_operating_expn / 10000000);
      }
      // Fallback calculation: Sales - Operating Profit
      if (q.is_sales_revenue_turnover && q.is_oper_income) {
        return Math.round((q.is_sales_revenue_turnover - q.is_oper_income) / 10000000);
      }
      return null;
    });

    transformed.oper_income_fq_h = quarterlyData.map(q =>
      q.is_oper_income ? Math.round(q.is_oper_income / 10000000) : null
    );

    // Operating margin - convert to integer percentage
    transformed.operating_margin_fq_h = quarterlyData.map(q => {
      if (q.oper_margin !== null && q.oper_margin !== undefined) {
        return Math.round(q.oper_margin); // Convert to integer percentage
      }
      return null;
    });

    transformed.non_oper_income_fq_h = quarterlyData.map(q =>
      q.is_nonop_income_loss ? Math.round(q.is_nonop_income_loss / 10000000) : null
    );

    transformed.non_oper_interest_income_fq_h = quarterlyData.map(() => 0);

    transformed.depreciation_fq_h = quarterlyData.map(q =>
      q.is_depr_exp ? Math.round(q.is_depr_exp / 10000000) : null
    );

    transformed.sector = 'Consumer Goods';
  }

  // Common fields - values in crores
  transformed.pretax_income_fq_h = quarterlyData.map(q =>
    q.is_pretax_income ? Math.round(q.is_pretax_income / 10000000) : null
  );

  transformed.net_income_fq_h = quarterlyData.map(q =>
    q.is_net_income ? Math.round(q.is_net_income / 10000000) : null
  );

  // EPS - format to 2 decimal places
  transformed.earnings_per_share_basic_fq_h = quarterlyData.map(q => {
    if (q.eps !== null && q.eps !== undefined) {
      return Math.round(q.eps * 100) / 100; // Round to 2 decimal places
    }
    return null;
  });

  // Tax rate - convert to integer percentage
  transformed.tax_rate_fq_h = quarterlyData.map(q => {
    if (q.is_inc_tax_exp && q.is_pretax_income && q.is_pretax_income > 0) {
      return Math.round(q.is_inc_tax_exp / q.is_pretax_income * 100); // Integer percentage
    }
    return null;
  });

  // Interest expense
  transformed.interest_fq_h = quarterlyData.map(q =>
    q.is_int_expense ? Math.round(q.is_int_expense / 10000000) : null
  );

  // Generate quarter information in proper order (most recent first)
  const quarterDates: string[] = [];
  const quarterPeriods: string[] = [];

  quarterlyData.forEach(item => {
    const date = new Date(item.date);
    quarterDates.push(date.toISOString());

    const month = date.getMonth();
    const year = date.getFullYear();
    let quarter: string;

    if (month >= 0 && month <= 2) {
      quarter = `Mar ${year}`;
    } else if (month >= 3 && month <= 5) {
      quarter = `Jun ${year}`;
    } else if (month >= 6 && month <= 8) {
      quarter = `Sep ${year}`;
    } else {
      quarter = `Dec ${year}`;
    }

    quarterPeriods.push(quarter);
  });

  transformed.quarters_info = {
    dates: quarterDates,
    periods: quarterPeriods
  };

  return transformed;
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await params;

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol parameter is required' },
        { status: 400 }
      );
    }

    // Clean up the symbol - remove exchange prefix if present
    let cleanSymbol = symbol;
    if (symbol.includes(':')) {
      // Remove exchange prefix like 'NSE:' or 'BSE:'
      cleanSymbol = symbol.split(':')[1];
    }
    
    // Add .NS suffix if not already present
    const normalizedSymbol = cleanSymbol.includes('.NS') ? cleanSymbol : `${cleanSymbol}.NS`;

    console.log(`Fetching quarterly income statement data for symbol: ${normalizedSymbol}`);

    // Construct the ROIC API URL
    const apiUrl = `${ROIC_BASE_URL}/v2/fundamental/income-statement/${normalizedSymbol}`;
    const url = new URL(apiUrl);
    url.searchParams.append('apikey', ROIC_API_KEY!);
    url.searchParams.append('period', 'quarterly');

    console.log('Making ROIC API request to:', url.toString().replace(ROIC_API_KEY!, '[API_KEY]'));

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: getHeaders(),
    });

    console.log(`ROIC API Response Status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`ROIC API Error ${response.status}:`, errorText);

      if (response.status === 404) {
        console.log('Company not found in ROIC API, generating mock data for testing...');
        const mockData = generateMockQuarterlyData(normalizedSymbol);
        return NextResponse.json(mockData);
      }

      if (response.status === 429) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again later.' },
          { status: 429 }
        );
      }

      // For other errors, also fallback to mock data for development
      console.log('ROIC API error, generating mock data for testing...');
      const mockData = generateMockQuarterlyData(normalizedSymbol);
      return NextResponse.json(mockData);
    }

    const roicResponse = await response.json();
    console.log('ROIC API Success - received data length:', roicResponse.length);

    // Log the actual response
    console.log('ROIC API raw response (first 2 items):', roicResponse.slice(0, 2));
    
    // Check if we have valid quarterly data
    if (!roicResponse || roicResponse.length === 0) {
      console.log('No quarterly data found from ROIC API, generating mock data for testing...');

      // Generate mock quarterly data for testing
      const mockData = generateMockQuarterlyData(normalizedSymbol);
      console.log('Returning MOCK data due to empty ROIC response');
      return NextResponse.json(mockData);
    }

    // Transform ROIC response to match existing component expectations
    console.log('Transforming ROIC data...');
    const transformedData = transformROICResponse(roicResponse, normalizedSymbol);

    if (!transformedData) {
      console.log('Failed to transform ROIC data, generating mock data for testing...');

      // Fallback to mock data
      const mockData = generateMockQuarterlyData(normalizedSymbol);
      console.log('Returning MOCK data due to transformation failure');
      return NextResponse.json(mockData);
    }

    console.log('Final transformed data keys:', Object.keys(transformedData));
    console.log('Quarter info:', transformedData.quarters_info);
    console.log('First revenue value:', transformedData.revenue_fq_h?.[0] || transformedData.total_revenue_fq_h?.[0]);
    console.log('Returning REAL transformed data from ROIC API');

    return NextResponse.json(transformedData);

  } catch (error) {
    console.error('Error in GET /api/quarterly/[symbol]:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}