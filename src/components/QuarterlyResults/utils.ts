// Utility functions for quarterly results processing
import { 
  CompanyType, 
  InsightSentryQuarterlyResponse, 
  QuarterInfo, 
  MetricRow, 
  FormattedValue,
  ProcessedQuarterlyData 
} from './types';
import { BANKING_SECTORS, BANKING_FIELD_INDICATORS, getMetricConfig } from './config';

/**
 * Detect company type based on sector and available data fields
 */
export function detectCompanyType(
  sector: string | undefined, 
  companyData: InsightSentryQuarterlyResponse
): CompanyType {
  // Primary detection via sector
  if (sector) {
    const sectorLower = sector.toLowerCase();
    const isBanking = BANKING_SECTORS.some(bankingSector => 
      sectorLower.includes(bankingSector.toLowerCase())
    );
    
    if (isBanking) {
      return 'banking';
    }
  }
  
  // Secondary detection via available fields
  const hasBankingFields = BANKING_FIELD_INDICATORS.some(field => 
    companyData[field as keyof InsightSentryQuarterlyResponse] !== undefined &&
    companyData[field as keyof InsightSentryQuarterlyResponse] !== null
  );
  
  return hasBankingFields ? 'banking' : 'non-banking';
}

/**
 * Generate quarter information from dates
 */
export function generateQuarterInfo(dates: string[]): QuarterInfo[] {
  return dates.map(dateStr => {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = date.getMonth(); // 0-based
    
    // Determine quarter and format
    let quarter: string;
    let period: string;
    
    if (month >= 0 && month <= 2) { // Jan-Mar
      quarter = `Mar ${year}`;
      period = `Q4 FY${year.toString().slice(-2)}`;
    } else if (month >= 3 && month <= 5) { // Apr-Jun
      quarter = `Jun ${year}`;
      period = `Q1 FY${(year + 1).toString().slice(-2)}`;
    } else if (month >= 6 && month <= 8) { // Jul-Sep
      quarter = `Sep ${year}`;
      period = `Q2 FY${(year + 1).toString().slice(-2)}`;
    } else { // Oct-Dec
      quarter = `Dec ${year}`;
      period = `Q3 FY${(year + 1).toString().slice(-2)}`;
    }
    
    return {
      quarter,
      year,
      period,
      date: dateStr
    };
  }).reverse(); // Most recent first
}

/**
 * Format currency values in crores
 */
export function formatCurrency(value: number | null): FormattedValue {
  if (value === null || value === undefined || isNaN(value)) {
    return {
      display: 'N/A',
      raw: null
    };
  }
  
  // Convert to crores (assuming input is in basic currency units)
  const crores = Math.abs(value) / 10000000; // 1 crore = 10,000,000
  const isNegative = value < 0;
  const isZero = value === 0;
  
  let display: string;
  if (isZero) {
    display = '0';
  } else if (crores >= 1000) {
    display = new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 0
    }).format(crores);
  } else if (crores >= 1) {
    display = new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 0
    }).format(crores);
  } else {
    // For values less than 1 crore, show in lakhs or thousands
    const lakhs = Math.abs(value) / 100000;
    if (lakhs >= 1) {
      display = `${lakhs.toFixed(0)}L`;
    } else {
      display = `${(Math.abs(value) / 1000).toFixed(0)}K`;
    }
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
 * Format percentage values
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
  
  const display = isZero ? '0%' : `${value.toFixed(1)}%`;
  
  return {
    display,
    raw: value,
    isNegative,
    isZero
  };
}

/**
 * Format regular numbers (like EPS)
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
  
  const display = isZero ? '0.00' : value.toFixed(2);
  
  return {
    display,
    raw: value,
    isNegative,
    isZero
  };
}

/**
 * Format link values (like PDF links)
 */
export function formatLink(value: string | null): FormattedValue {
  if (!value) {
    return {
      display: 'N/A',
      raw: null
    };
  }
  
  return {
    display: '📄',
    raw: null
  };
}

/**
 * Process raw API data into formatted metric rows
 */
export function processQuarterlyData(
  apiData: InsightSentryQuarterlyResponse,
  companyType: CompanyType
): ProcessedQuarterlyData {
  // Generate quarter information
  const dates = apiData.quarters_info?.dates || [];
  const quarters = generateQuarterInfo(dates);
  
  // Get metric configuration for company type
  const metricConfigs = getMetricConfig(companyType);
  
  // Process each metric
  const rows: MetricRow[] = metricConfigs.map(config => {
    let values: number[] | null = null;
    
    if (config.calculation) {
      // Use custom calculation
      values = config.calculation(apiData);
    } else {
      // Get values from API data
      const rawValues = apiData[config.key as keyof InsightSentryQuarterlyResponse] as number[] | undefined;
      values = rawValues || null;
    }
    
    // Format values based on type
    const formattedValues = (values || []).map(value => {
      switch (config.type) {
        case 'currency':
          return formatCurrency(value).display;
        case 'percentage':
          return formatPercentage(value).display;
        case 'number':
          return formatNumber(value).display;
        case 'link':
          return formatLink(value as any).display;
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
  
  // Check for product segments (placeholder)
  const hasProductSegments = false; // Will be implemented later
  
  return {
    quarters,
    rows,
    companyType,
    hasProductSegments,
    lastUpdated: new Date().toISOString()
  };
}

/**
 * Validate API response data
 */
export function validateApiResponse(data: any): data is InsightSentryQuarterlyResponse {
  if (!data || typeof data !== 'object') {
    return false;
  }
  
  // Check if at least some quarterly data exists
  const hasQuarterlyData = Object.keys(data).some(key => 
    key.endsWith('_fq_h') && Array.isArray(data[key]) && data[key].length > 0
  );
  
  return hasQuarterlyData;
}

/**
 * Get the most recent N quarters from data arrays
 */
export function getRecentQuarters<T>(data: T[], maxQuarters: number = 12): T[] {
  if (!Array.isArray(data)) {
    return [];
  }
  
  // Take the most recent quarters (assuming data is in chronological order)
  return data.slice(-maxQuarters).reverse(); // Most recent first
}

/**
 * Calculate Net NPA percentage for banking companies
 */
export function calculateNetNPA(
  grossNPL: number[] | undefined,
  provisions: number[] | undefined,
  netLoans: number[] | undefined
): number[] | null {
  if (!grossNPL || !provisions || !netLoans) {
    return null;
  }
  
  const length = Math.min(grossNPL.length, provisions.length, netLoans.length);
  const result: number[] = [];
  
  for (let i = 0; i < length; i++) {
    const gross = grossNPL[i];
    const provision = provisions[i];
    const loans = netLoans[i];
    
    if (gross !== null && provision !== null && loans !== null && loans !== 0) {
      const netNPL = gross - provision;
      const netNPAPercent = (netNPL / loans) * 100;
      result.push(Math.max(0, netNPAPercent)); // Ensure non-negative
    } else {
      result.push(0);
    }
  }
  
  return result;
}