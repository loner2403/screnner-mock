// Utility functions for balance sheet processing
import { 
  CompanyType, 
  InsightSentryBalanceSheetResponse, 
  MetricRow, 
  FormattedValue,
  ProcessedBalanceSheetData 
} from './types';
import { BANKING_SECTORS, BANKING_FIELD_INDICATORS, getMetricConfig } from './config';

/**
 * Detect company type based on sector and available data fields
 */
export function detectCompanyType(
  sector: string | undefined, 
  companyData: InsightSentryBalanceSheetResponse
): CompanyType {
  // Highest priority: Check report_type field
  const reportType = (companyData as any).report_type;
  if (reportType === 'banking') {
    console.log('Detected banking company via report_type field');
    return 'banking';
  }
  
  // Primary detection via sector
  if (sector) {
    const sectorLower = sector.toLowerCase();
    const isBanking = BANKING_SECTORS.some(bankingSector => 
      sectorLower.includes(bankingSector.toLowerCase())
    );
    
    if (isBanking) {
      console.log('Detected banking company via sector:', sector);
      return 'banking';
    }
  }
  
  // Secondary detection via available fields
  const hasBankingFields = BANKING_FIELD_INDICATORS.some(field => 
    companyData[field as keyof InsightSentryBalanceSheetResponse] !== undefined &&
    companyData[field as keyof InsightSentryBalanceSheetResponse] !== null
  );
  
  if (hasBankingFields) {
    console.log('Detected banking company via banking field indicators');
    return 'banking';
  }
  
  console.log('Detected non-banking company - no banking indicators found');
  return 'non-banking';
}

/**
 * Format currency values in crores (matching the image format)
 */
export function formatCurrency(value: number | null): FormattedValue {
  if (value === null || value === undefined || isNaN(value)) {
    return {
      display: 'N/A',
      raw: null
    };
  }
  
  // Assuming the values are already in the correct scale (matching the mock data)
  // The API might return values in different scales, so we need to detect this
  const isNegative = value < 0;
  const isZero = value === 0;
  const absValue = Math.abs(value);
  
  let display: string;
  if (isZero) {
    display = '0';
  } else {
    // Format with comma separators (Indian numbering system)
    display = new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 0,
      minimumFractionDigits: 0
    }).format(absValue);
  }
  
  if (isNegative && !isZero) {
    display = `-${display}`;
  }
  
  return {
    display,
    raw: value,
    isNegative,
    isZero
  };
}

/**
 * Format percentage values (matching the image format)
 */
export function formatPercentage(value: number | null): FormattedValue {
  if (value === null || value === undefined || isNaN(value)) {
    return {
      display: 'N/A',
      raw: null
    };
  }
  
  const isNegative = value < 0;
  const isZero = value === 0;
  
  // Format as integer percentage (no decimal places as shown in image)
  let display: string;
  if (isZero) {
    display = '0%';
  } else if (isNegative) {
    display = `${Math.round(value)}%`;
  } else {
    display = `${Math.round(value)}%`;
  }
  
  return {
    display,
    raw: value,
    isNegative,
    isZero
  };
}

/**
 * Format regular numbers (like ratios)
 */
export function formatNumber(value: number | null): FormattedValue {
  if (value === null || value === undefined || isNaN(value)) {
    return {
      display: 'N/A',
      raw: null
    };
  }
  
  const isNegative = value < 0;
  const isZero = value === 0;
  const absValue = Math.abs(value);
  
  // Format ratio values with 2 decimal places
  let display: string;
  if (isZero) {
    display = '0.00';
  } else {
    display = absValue.toFixed(2);
  }
  
  if (isNegative && !isZero) {
    display = `-${display}`;
  }
  
  return {
    display,
    raw: value,
    isNegative,
    isZero
  };
}

/**
 * Convert API values to crores (divide by 10,000,000)
 */
function convertToCrores(value: number | null): number | null {
  if (value === null || value === undefined || isNaN(value)) {
    return null;
  }
  // API values are typically in rupees, convert to crores
  return value / 10000000;
}

/**
 * Extract years from historical data arrays in the API response
 */
function extractYears(apiData: any): string[] {
  // Try to get years from the API response
  if (apiData.years && Array.isArray(apiData.years)) {
    return apiData.years;
  }
  
  // Fallback: try to infer years from any historical array
  const historicalFields = Object.keys(apiData).filter(key => key.endsWith('_fy_h'));
  if (historicalFields.length > 0) {
    const firstField = historicalFields[0];
    const values = apiData[firstField];
    if (Array.isArray(values)) {
      // Generate years based on array length (going backwards from current year)
      const currentYear = new Date().getFullYear();
      return Array.from({ length: values.length }, (_, i) => (currentYear - values.length + 1 + i).toString());
    }
  }
  
  // Default fallback
  return Array.from({ length: 12 }, (_, i) => (2014 + i).toString());
}

/**
 * Process raw API data into formatted metric rows with historical data
 */
export function processBalanceSheetData(
  apiData: InsightSentryBalanceSheetResponse,
  companyType: CompanyType
): ProcessedBalanceSheetData {
  console.log('Processing balance sheet data:', {
    companyType,
    apiDataKeys: Object.keys(apiData),
    historicalFields: Object.keys(apiData).filter(key => key.endsWith('_fy_h')).slice(0, 5)
  });
  
  // Get years from API data
  const years = extractYears(apiData);
  console.log('Extracted years:', years);
  
  // Get metric configuration for company type
  const metricConfigs = getMetricConfig(companyType);
  
  // Process each metric
  const rows: MetricRow[] = metricConfigs.map(config => {
    let values: number[] | null = null;
    
    if (config.calculation) {
      // Use custom calculation
      values = config.calculation(apiData);
    } else {
      // Get values from API data - handle both mock and real API formats
      const rawValues = apiData[config.key as keyof InsightSentryBalanceSheetResponse];
      
      if (Array.isArray(rawValues)) {
        // Convert to crores and handle nulls
        values = rawValues.map(val => convertToCrores(val));
      } else if (typeof rawValues === 'number') {
        // Single value - expand to array matching years length
        const convertedValue = convertToCrores(rawValues);
        values = new Array(years.length).fill(convertedValue);
      } else {
        values = null;
      }
    }
    
    console.log(`Processing metric ${config.label}:`, {
      key: config.key,
      rawValues: Array.isArray(apiData[config.key as keyof InsightSentryBalanceSheetResponse]) 
        ? `[${(apiData[config.key as keyof InsightSentryBalanceSheetResponse] as number[])?.slice(0, 3).join(', ')}...]`
        : apiData[config.key as keyof InsightSentryBalanceSheetResponse],
      processedValues: values?.slice(0, 3),
      valuesLength: values?.length
    });
    
    // Format values based on type
    const formattedValues = (values || []).map(value => {
      switch (config.type) {
        case 'currency':
          return formatCurrency(value).display;
        case 'percentage':
          return formatPercentage(value).display;
        case 'number':
          return formatNumber(value).display;
        default:
          return value?.toString() || 'N/A';
      }
    });
    
    return {
      label: config.label,
      values: formattedValues,
      type: config.type,
      unit: config.unit,
      rawValues: values || undefined
    };
  });
  
  console.log('Processed balance sheet data:', {
    yearsCount: years.length,
    rowsCount: rows.length,
    sampleRow: rows[0] ? {
      label: rows[0].label,
      valuesCount: rows[0].values.length,
      sampleValues: rows[0].values.slice(0, 3)
    } : null
  });
  
  return {
    years,
    rows,
    companyType,
    lastUpdated: new Date().toISOString()
  };
}

/**
 * Validate API response data
 */
export function validateApiResponse(data: any): data is InsightSentryBalanceSheetResponse {
  if (!data || typeof data !== 'object') {
    return false;
  }
  
  // Check if at least some balance sheet data exists
  const hasBalanceSheetData = Object.keys(data).some(key => 
    key.endsWith('_fy_h') && (typeof data[key] === 'number' || Array.isArray(data[key]))
  );
  
  return hasBalanceSheetData;
}

/**
 * Calculate return on equity for any company type
 */
export function calculateROE(
  netIncome: number | undefined,
  shareholdersEquity: number | undefined
): number | null {
  if (!netIncome || !shareholdersEquity || shareholdersEquity === 0) {
    return null;
  }
  
  return (netIncome / shareholdersEquity) * 100;
}

/**
 * Calculate return on assets for any company type
 */
export function calculateROA(
  netIncome: number | undefined,
  totalAssets: number | undefined
): number | null {
  if (!netIncome || !totalAssets || totalAssets === 0) {
    return null;
  }
  
  return (netIncome / totalAssets) * 100;
}

/**
 * Calculate debt to equity ratio
 */
export function calculateDebtToEquity(
  totalDebt: number | undefined,
  shareholdersEquity: number | undefined
): number | null {
  if (!totalDebt || !shareholdersEquity || shareholdersEquity === 0) {
    return null;
  }
  
  return totalDebt / shareholdersEquity;
}

/**
 * Calculate current ratio
 */
export function calculateCurrentRatio(
  currentAssets: number | undefined,
  currentLiabilities: number | undefined
): number | null {
  if (!currentAssets || !currentLiabilities || currentLiabilities === 0) {
    return null;
  }
  
  return currentAssets / currentLiabilities;
}