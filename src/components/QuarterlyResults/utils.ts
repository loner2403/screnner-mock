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
    companyData[field as keyof InsightSentryQuarterlyResponse] !== undefined &&
    companyData[field as keyof InsightSentryQuarterlyResponse] !== null
  );
  
  if (hasBankingFields) {
    console.log('Detected banking company via banking field indicators');
    return 'banking';
  }
  
  console.log('Detected non-banking company - no banking indicators found');
  return 'non-banking';
}

/**
 * Generate quarter information from dates, filtered to show data only until June 2025
 */
export function generateQuarterInfo(dates: string[]): QuarterInfo[] {
  // Filter dates to only include those until June 2025
  const maxDate = new Date('2025-06-30'); // June 2025
  
  const filteredDates = dates.filter(dateStr => {
    const date = new Date(dateStr);
    return date <= maxDate;
  });
  
  return filteredDates.map(dateStr => {
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
 * Format regular numbers (like EPS - matching the image format)
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
  
  // Format EPS values with 2 decimal places
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
  // Generate quarter information (already filtered to June 2025)
  const dates = apiData.quarters_info?.dates || [];
  const quarters = generateQuarterInfo(dates);
  
  // Calculate how many quarters we need to filter from the original data
  const originalDatesCount = dates.length;
  const filteredDatesCount = quarters.length;
  const quartersToRemove = originalDatesCount - filteredDatesCount;
  
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
    
    // Filter the values to match the filtered quarters
    if (values && quartersToRemove > 0) {
      // Remove the most recent quarters (from the end) that are beyond June 2025
      values = values.slice(0, values.length - quartersToRemove);
    }
    
    // Reverse the data to match the quarters order (most recent first)
    if (values) {
      values = [...values].reverse();
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