
import { 
  CompanyType, 
  InsightSentryProfitAndLossResponse, 
  ProcessedProfitAndLossData,
  MetricRow
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

  const reportType = dataMap.get('report_type');
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
  
  const hasBankingFields = BANKING_FIELD_INDICATORS.some(field => dataMap.has(field));
  
  if (hasBankingFields) {
    return 'banking';
  }
  
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

  return {
    years,
    rows,
    companyType,
    lastUpdated: new Date().toISOString(),
    hasProductSegments: false, // Placeholder
  };
}

export function validateApiResponse(data: any): data is InsightSentryProfitAndLossResponse {
  return Array.isArray(data);
}
