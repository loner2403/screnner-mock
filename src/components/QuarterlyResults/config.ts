// Metric configurations based on ROIC API structure
import { MetricConfig, CompanyType } from './types';

// Non-banking companies (matching reference image exactly)
export const NON_BANKING_METRICS: MetricConfig[] = [
  { key: 'revenue_fq_h', label: 'Sales +', type: 'currency' },
  { key: 'total_oper_expense_fq_h', label: 'Expenses +', type: 'currency' },
  { key: 'oper_income_fq_h', label: 'Operating Profit', type: 'currency' },
  { key: 'operating_margin_fq_h', label: 'OPM %', type: 'percentage' },
  { key: 'non_oper_income_fq_h', label: 'Other Income +', type: 'currency' },
  { key: 'interest_fq_h', label: 'Interest', type: 'currency' },
  { key: 'depreciation_fq_h', label: 'Depreciation', type: 'currency' },
  { key: 'pretax_income_fq_h', label: 'Profit before tax', type: 'currency' },
  { key: 'tax_rate_fq_h', label: 'Tax %', type: 'percentage' },
  { key: 'net_income_fq_h', label: 'Net Profit +', type: 'currency' },
  { key: 'earnings_per_share_basic_fq_h', label: 'EPS in Rs', type: 'number' }
];

// Banking companies
export const BANKING_METRICS: MetricConfig[] = [
  { key: 'total_revenue_fq_h', label: 'Revenue', type: 'currency' },
  { key: 'interest_income_net_fq_h', label: 'Interest', type: 'currency' },
  { key: 'total_oper_expense_fq_h', label: 'Expenses', type: 'currency' },
  { key: 'non_oper_income_fq_h', label: 'Financing Profit', type: 'currency' },
  { key: 'pretax_income_fq_h', label: 'Financing Margin', type: 'currency' },
  { key: 'non_interest_income_fq_h', label: 'Other Income', type: 'currency' },
  { key: 'pretax_income_fq_h', label: 'Profit Before Tax', type: 'currency' },
  { key: 'tax_rate_fq_h', label: 'Tax %', type: 'percentage' },
  { key: 'net_income_fq_h', label: 'Net Profit', type: 'currency' },
  { key: 'earnings_per_share_basic_fq_h', label: 'EPS in Rs', type: 'number' },
  { key: 'nonperf_loans_loans_gross_fq_h', label: 'Gross NPA %', type: 'percentage' }
];

// Company type detection
export function detectCompanyType(sector?: string, symbol?: string): CompanyType {
  if (sector) {
    const sectorLower = sector.toLowerCase();
    if (sectorLower.includes('bank') || sectorLower.includes('financial')) {
      return 'banking';
    }
  }

  if (symbol) {
    const symbolUpper = symbol.toUpperCase();
    if (symbolUpper.includes('BANK') || symbolUpper.includes('HDFC') ||
        symbolUpper.includes('ICICI') || symbolUpper.includes('SBIN')) {
      return 'banking';
    }
  }

  return 'non-banking';
}

export function getMetricConfig(companyType: CompanyType): MetricConfig[] {
  return companyType === 'banking' ? BANKING_METRICS : NON_BANKING_METRICS;
}