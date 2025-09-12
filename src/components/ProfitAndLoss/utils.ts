
import { 
  CompanyType, 
  InsightSentryProfitAndLossResponse, 
  ProcessedProfitAndLossData,
  MetricRow,
  GrowthMetrics
} from './types';
import { BANKING_SECTORS, BANKING_FIELD_INDICATORS } from '../QuarterlyResults/config';
import { getProfitAndLossMetricConfig } from './config';

// Utility functions for Profit & Loss data processing

export function detectCompanyType(
  sector: string | undefined, 
  companyData: InsightSentryProfitAndLossResponse
): CompanyType {
  const dataMap = new Map<string, any>();
  if(Array.isArray(companyData)) {
    for (const item of companyData) {
        dataMap.set(item.id, item.value);
    }
  }

  // Ignore hardcoded report_type from API as it's unreliable
  // Instead, prioritize sector-based detection
  
  if (sector) {
    const sectorLower = sector.toLowerCase();
    // Only consider it banking if sector explicitly contains banking terms
    const isBanking = BANKING_SECTORS.some(bankingSector => {
      const bankingSectorLower = bankingSector.toLowerCase();
      return sectorLower === bankingSectorLower || 
             sectorLower.includes('bank') ||
             sectorLower.includes('financial services') ||
             sectorLower.includes('finance');
    });
    if (isBanking) {
      return 'banking';
    }
    // If we have a clear non-banking sector, return non-banking
    if (sectorLower.includes('energy') || 
        sectorLower.includes('oil') || 
        sectorLower.includes('manufacturing') || 
        sectorLower.includes('technology') ||
        sectorLower.includes('retail') ||
        sectorLower.includes('pharmaceutical') ||
        sectorLower.includes('telecom')) {
      return 'non-banking';
    }
  }
  
  // Check for specific banking fields, but require multiple indicators
  const bankingFields = BANKING_FIELD_INDICATORS.filter(field => dataMap.has(field));
  const hasBankingFields = bankingFields.length >= 2; // Require at least 2 banking-specific fields
  
  if (hasBankingFields) {
    return 'banking';
  }
  
  // Default to non-banking
  return 'non-banking';
}

function convertToCrores(value: number | null): number | null {
  if (value === null || value === undefined || isNaN(value)) {
    return null;
  }
  return value / 10000000;
}

function formatCurrency(value: number | null): string {
    if (value === null || value === undefined || isNaN(value)) {
        return 'N/A';
    }
    const isNegative = value < 0;
    const absValue = Math.abs(value);
    const formattedValue = new Intl.NumberFormat('en-IN', {
        maximumFractionDigits: 2,
        minimumFractionDigits: 2
    }).format(absValue);

    return isNegative ? `-${formattedValue}` : formattedValue;
}

function formatPercentage(value: number | null): string {
    if (value === null || value === undefined) return 'N/A';
    return `${value.toFixed(2)}%`;
}

function formatNumber(value: number | null): string {
    if (value === null || value === undefined) return 'N/A';
    return value.toString();
}

export function processProfitAndLossData(
  apiData: InsightSentryProfitAndLossResponse,
  companyType: CompanyType
): ProcessedProfitAndLossData {
  const metricConfigs = getProfitAndLossMetricConfig(companyType);
  
  const dataMap = new Map<string, any>();
  if(Array.isArray(apiData)) {
    for (const item of apiData) {
        dataMap.set(item.id, item.value);
    }
  }

  // Generate years from 2025 to 2014 (latest to oldest)
  const currentYear = new Date().getFullYear();
  const startYear = 2025;
  const endYear = 2014;
  const years = Array.from({ length: startYear - endYear + 1 }, (_, i) => (startYear - i).toString()); 

  const rows = metricConfigs.map(config => {
    let rawValues: (number | null)[] | undefined;

    if (config.calculation) {
        rawValues = config.calculation(dataMap);
    } else if (config.key) {
        rawValues = dataMap.get(config.key) as (number | null)[] | undefined;
    }

    const valuesInCrores = (rawValues || []).map(val => config.type === 'currency' ? convertToCrores(val) : val);

    const formattedValues = valuesInCrores.map(value => {
        // Apply custom formatValue function first if it exists
        let processedValue = value;
        if (config.formatValue && value !== null && value !== undefined) {
            processedValue = config.formatValue(value);
        }
        
        switch (config.type) {
            case 'currency':
                return formatCurrency(processedValue);
            case 'percentage':
                return formatPercentage(processedValue);
            case 'number':
                return formatNumber(processedValue);
            default:
                return processedValue?.toString() || 'N/A';
        }
    });

    return {
      label: config.label,
      values: formattedValues,
      type: config.type,
      rawValues: valuesInCrores
    };
  });

  // Extract growth metrics from real API data
  const growthMetrics = extractGrowthMetrics(dataMap);

  return {
    years,
    rows,
    companyType,
    lastUpdated: new Date().toISOString(),
    hasProductSegments: false, // Placeholder
    growthMetrics
  };
}

export function validateApiResponse(data: any): data is InsightSentryProfitAndLossResponse {
  return Array.isArray(data);
}

// Calculate CAGR (Compound Annual Growth Rate)
function calculateCAGR(startValue: number, endValue: number, periods: number): number {
  if (startValue <= 0 || endValue <= 0 || periods <= 0) return 0;
  return Math.pow(endValue / startValue, 1 / periods) - 1;
}

// Calculate average for a period
function calculateAverage(values: number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, val) => acc + val, 0);
  return sum / values.length;
}

// Log and return real API data without overrides
function debugApiData(dataMap: Map<string, any>) {
  console.log('=== API Data Debug ===');
  
  // Check what revenue fields are available (based on API response logs)
  const revenueFields = [
    'revenue_fy_h', 'total_revenue_fy_h', 'revenues_fy_h', 
    'total_revenue_ttm_h', 'last_annual_revenue'
  ];
  const netIncomeFields = [
    'net_income_fy_h', 'net_income_fy', 'diluted_net_income_fy_h',
    'net_income_ttm_h', 'net_income'
  ];
  const roeFields = ['return_on_equity_fy_h', 'return_on_equity_fy'];
  
  console.log('Available revenue fields:');
  revenueFields.forEach(field => {
    if (dataMap.has(field)) {
      const data = dataMap.get(field);
      console.log(`  ${field}: ${Array.isArray(data) ? data.length + ' values' : typeof data} = ${Array.isArray(data) ? `[${data.slice(0, 3).join(', ')}...]` : data}`);
    }
  });
  
  console.log('Available net income fields:');
  netIncomeFields.forEach(field => {
    if (dataMap.has(field)) {
      const data = dataMap.get(field);
      console.log(`  ${field}: ${Array.isArray(data) ? data.length + ' values' : typeof data} = ${Array.isArray(data) ? `[${data.slice(0, 3).join(', ')}...]` : data}`);
    }
  });
  
  console.log('Available ROE fields:');
  roeFields.forEach(field => {
    if (dataMap.has(field)) {
      const data = dataMap.get(field);
      console.log(`  ${field}: ${Array.isArray(data) ? data.length + ' values' : typeof data} = ${Array.isArray(data) ? `[${data.slice(0, 3).join(', ')}...]` : data}`);
    }
  });
  
  // Check sector info
  const sector = dataMap.get('sector-i18n-en') || dataMap.get('sector') || '';
  console.log('Sector:', sector);
  console.log('Total fields in dataMap:', dataMap.size);
  console.log('=== End Debug ===');
}

// Extract growth metrics from API data
export function extractGrowthMetrics(dataMap: Map<string, any>): GrowthMetrics {
  // Debug what's available in the API data
  debugApiData(dataMap);
  
  // Get historical data arrays (latest to oldest) from real API data only
  // Try multiple field name variations based on API response
  const revenueHistory = dataMap.get('revenue_fy_h') || 
                        dataMap.get('total_revenue_fy_h') || 
                        dataMap.get('revenues_fy_h') || 
                        dataMap.get('total_revenue_ttm_h') || 
                        dataMap.get('last_annual_revenue') || [];
  
  const netIncomeHistory = dataMap.get('net_income_fy_h') || 
                          dataMap.get('diluted_net_income_fy_h') || 
                          dataMap.get('net_income_ttm_h') ||
                          dataMap.get('net_income_fy') ||
                          dataMap.get('net_income') || [];
  
  const roeHistory = dataMap.get('return_on_equity_fy_h') || 
                    dataMap.get('return_on_equity_fy') || [];

  // Helper function to get valid numbers from array
  const getValidNumbers = (arr: any[]): number[] => 
    arr.filter(val => typeof val === 'number' && !isNaN(val) && val > 0);

  const validRevenue = getValidNumbers(revenueHistory);
  const validNetIncome = getValidNumbers(netIncomeHistory);
  const validROE = getValidNumbers(roeHistory);

  // Calculate sales growth rates
  // Note: For CAGR calculation, we need (End Value / Start Value)^(1/periods) - 1
  // Where End Value is the latest (index 0) and Start Value is the oldest for the period
  const salesGrowth = {
    '10Years': validRevenue.length >= 11 ? 
      calculateCAGR(validRevenue[10], validRevenue[0], 10) * 100 : 0,
    '5Years': validRevenue.length >= 6 ? 
      calculateCAGR(validRevenue[5], validRevenue[0], 5) * 100 : 0,
    '3Years': validRevenue.length >= 4 ? 
      calculateCAGR(validRevenue[3], validRevenue[0], 3) * 100 : 0,
    'TTM': validRevenue.length >= 2 ? 
      ((validRevenue[0] - validRevenue[1]) / validRevenue[1]) * 100 : 0
  };

  // Calculate profit growth rates
  const profitGrowth = {
    '10Years': validNetIncome.length >= 11 ? 
      calculateCAGR(validNetIncome[10], validNetIncome[0], 10) * 100 : 0,
    '5Years': validNetIncome.length >= 6 ? 
      calculateCAGR(validNetIncome[5], validNetIncome[0], 5) * 100 : 0,
    '3Years': validNetIncome.length >= 4 ? 
      calculateCAGR(validNetIncome[3], validNetIncome[0], 3) * 100 : 0,
    'TTM': validNetIncome.length >= 2 ? 
      ((validNetIncome[0] - validNetIncome[1]) / validNetIncome[1]) * 100 : 0
  };

  // For stock price CAGR, we'll use placeholder values since we don't have historical stock prices
  // In a real implementation, you'd need historical stock price data
  const stockPriceCAGR = {
    '10Years': 14, // Placeholder
    '5Years': 12,  // Placeholder
    '3Years': 9,   // Placeholder
    '1Year': 18    // Placeholder
  };

  // Calculate ROE averages
  const returnOnEquity = {
    '10Years': validROE.length >= 10 ? 
      calculateAverage(validROE.slice(0, 10)) : 
      (validROE.length > 0 ? calculateAverage(validROE) : 0),
    '5Years': validROE.length >= 5 ? 
      calculateAverage(validROE.slice(0, 5)) : 
      (validROE.length > 0 ? calculateAverage(validROE) : 0),
    '3Years': validROE.length >= 3 ? 
      calculateAverage(validROE.slice(0, 3)) : 
      (validROE.length > 0 ? calculateAverage(validROE) : 0),
    'LastYear': validROE.length > 0 ? validROE[0] : 0
  };

  return {
    compoundedSalesGrowth: {
      '10Years': Math.round(salesGrowth['10Years']),
      '5Years': Math.round(salesGrowth['5Years']),
      '3Years': Math.round(salesGrowth['3Years']),
      'TTM': Math.round(salesGrowth.TTM)
    },
    compoundedProfitGrowth: {
      '10Years': Math.round(profitGrowth['10Years']),
      '5Years': Math.round(profitGrowth['5Years']),
      '3Years': Math.round(profitGrowth['3Years']),
      'TTM': Math.round(profitGrowth.TTM)
    },
    stockPriceCAGR,
    returnOnEquity: {
      '10Years': Math.round(returnOnEquity['10Years']),
      '5Years': Math.round(returnOnEquity['5Years']),
      '3Years': Math.round(returnOnEquity['3Years']),
      'LastYear': Math.round(returnOnEquity.LastYear)
    }
  };
}
