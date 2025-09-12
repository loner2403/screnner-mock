// src/components/Ratios/utils.ts

import { 
  CompanyType, 
  InsightSentryRatiosResponse, 
  MetricRow, 
  FormattedValue,
  ProcessedRatiosData 
} from './types';
import { BANKING_SECTORS, BANKING_FIELD_INDICATORS, getMetricConfig } from './config';

/**
 * Detect company type based on sector and available data fields
 */
export function detectCompanyType(
  sector: string | undefined, 
  companyData: InsightSentryRatiosResponse
): CompanyType {
  const reportType = (companyData as any).report_type;
  if (reportType === 'banking') {
    return 'banking';
  }
  
  if (sector) {
    const sectorLower = sector.toLowerCase();
    const isBanking = BANKING_SECTORS.some(bankingSector => 
      sectorLower.includes(bankingSector.toLowerCase())
    );
    if (isBanking) {
      return 'banking';
    }
  }
  
  const hasBankingFields = BANKING_FIELD_INDICATORS.some(field => 
    companyData[field as keyof InsightSentryRatiosResponse] !== undefined &&
    companyData[field as keyof InsightSentryRatiosResponse] !== null
  );
  
  if (hasBankingFields) {
    return 'banking';
  }
  
  return 'non-banking';
}

/**
 * Format currency values
 */
export function formatCurrency(value: number | null): FormattedValue {
  if (value === null || value === undefined || isNaN(value)) {
    return {
      display: 'N/A',
      raw: null
    };
  }
  
  const isNegative = value < 0;
  const isZero = value === 0;
  const absValue = Math.abs(value);
  
  let display: string;
  if (isZero) {
    display = '0';
  } else {
    display = new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2
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
  
  let display = `${value.toFixed(2)}%`;
  
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
  
  let display = absValue.toFixed(2);
  
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
 * Extract years from historical data arrays in the API response
 */
function extractYears(apiData: InsightSentryRatiosResponse): string[] {
  if (apiData.years && Array.isArray(apiData.years)) {
    return apiData.years;
  }
  
  const historicalFields = Object.keys(apiData).filter(key => key.endsWith('_fy_h'));
  if (historicalFields.length > 0) {
    const firstField = historicalFields[0] as keyof InsightSentryRatiosResponse;
    const values = apiData[firstField];
    if (Array.isArray(values)) {
      const currentYear = new Date().getFullYear();
      return Array.from({ length: values.length }, (_, i) => (currentYear - values.length + 1 + i).toString());
    }
  }
  
  return Array.from({ length: 12 }, (_, i) => (2014 + i).toString());
}

/**
 * Process raw API data into formatted metric rows
 */
export function processRatiosData(
  apiData: InsightSentryRatiosResponse,
  companyType: CompanyType
): ProcessedRatiosData {
  const years = extractYears(apiData);
  const metricConfigs = getMetricConfig(companyType);
  
  const rows: MetricRow[] = metricConfigs.map(config => {
    let values: (number | null)[] | null = null;
    
    if (config.calculation) {
      values = config.calculation(apiData);
    } else {
      const rawValues = apiData[config.key as keyof InsightSentryRatiosResponse];
      if (Array.isArray(rawValues)) {
        values = rawValues.map(val => (val === null || isNaN(val) ? null : val));
      } else {
        values = new Array(years.length).fill(null);
      }
    }
    
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
export function validateApiResponse(data: any): data is InsightSentryRatiosResponse {
  if (!data || typeof data !== 'object') {
    return false;
  }
  
  const hasRatiosData = Object.keys(data).some(key => 
    key.endsWith('_fy_h') && (typeof data[key] === 'number' || Array.isArray(data[key]))
  );
  
  return hasRatiosData;
}
