// Metric configurations for banking and non-banking companies
import { MetricConfig, CompanyType, InsightSentryBalanceSheetResponse } from './types';

// Banking-specific balance sheet configuration (using actual API fields from hdfc-bank-data-mapping.md)
export const BANKING_METRICS: MetricConfig[] = [
  // Equity section
  { key: 'common_stock_par_fy_h', label: 'Equity Capital', type: 'currency' },
  { key: 'retained_earnings_fy_h', label: 'Reserves', type: 'currency' },
  
  // Liabilities section - Banking specific
  { key: 'total_deposits_fy_h', label: 'Deposits', type: 'currency' },
  { key: 'total_debt_fy_h', label: 'Borrowings', type: 'currency' },
  { key: 'other_liabilities_total_fy_h', label: 'Other Liabilities +', type: 'currency' },
  { key: 'total_liabilities_fy_h', label: 'Total Liabilities', type: 'currency' },
  
  // Assets section
  { key: 'ppe_total_net_fy_h', label: 'Fixed Assets +', type: 'currency' },
  { key: 'cwip_fy_h', label: 'CWIP', type: 'currency' }, // Not available in API - shows zeros
  { key: 'long_term_investments_fy_h', label: 'Investments', type: 'currency' },
  { key: 'long_term_other_assets_total_fy_h', label: 'Other Assets +', type: 'currency' },
  { key: 'total_assets_fy_h', label: 'Total Assets', type: 'currency' }
];

// Non-banking balance sheet configuration (using actual API fields from historical_data_mapping.md)
export const NON_BANKING_METRICS: MetricConfig[] = [
  // Equity section
  { key: 'common_stock_par_fy_h', label: 'Equity Capital', type: 'currency' },
  { key: 'retained_earnings_fy_h', label: 'Reserves', type: 'currency' },
  
  // Liabilities section - Non-banking
  { key: 'total_debt_fy_h', label: 'Borrowings', type: 'currency' },
  { key: 'total_current_liabilities_fy_h', label: 'Other Liabilities +', type: 'currency' },
  { key: 'total_liabilities_fy_h', label: 'Total Liabilities', type: 'currency' },
  
  // Assets section
  { key: 'ppe_total_net_fy_h', label: 'Fixed Assets +', type: 'currency' },
  { key: 'cwip_fy_h', label: 'CWIP', type: 'currency' }, // Not available in API - shows zeros
  { key: 'long_term_investments_fy_h', label: 'Investments', type: 'currency' },
  { key: 'long_term_other_assets_total_fy_h', label: 'Other Assets +', type: 'currency' },
  { key: 'total_assets_fy_h', label: 'Total Assets', type: 'currency' }
];

// Banking sectors for company type detection
export const BANKING_SECTORS = [
  'Banks',
  'Banking',
  'Financial Services',
  'Finance', // Added for HDFC Bank and similar banks
  'Private Sector Bank',
  'Public Sector Bank',
  'Cooperative Bank',
  'Regional Rural Bank',
  'Small Finance Bank',
  'Payments Bank'
];

// Banking field indicators for secondary detection
export const BANKING_FIELD_INDICATORS = [
  'total_deposits_fy_h',
  'loans_net_fy_h',
  'loans_gross_fy_h',
  'interest_income_fy_h',
  'interest_expense_fy_h',
  'net_interest_margin_fy_h'
];

// All fields needed for balance sheet (based on API structure)
export const ALL_BALANCE_SHEET_FIELDS = [
  // Assets
  'cash_fy_h',
  'total_current_assets_fy_h',
  'total_noncurrent_assets_fy_h',
  'total_assets_fy_h',
  
  // Liabilities
  'total_current_liabilities_fy_h',
  'total_noncurrent_liabilities_fy_h',
  'total_liabilities_fy_h',
  
  // Equity
  'total_equity_fy_h',
  
  // Income (for calculations)
  'net_income_fy_h',
  
  // Banking-specific fields
  'total_deposits_fy_h',
  'loans_net_fy_h',
  'loans_gross_fy_h',
  'interest_income_fy_h',
  'interest_expense_fy_h',
  'net_interest_margin_fy_h',
  
  // Metadata
  'sector',
  'industry',
  'report_type'
];

// Get metric configuration based on company type
export function getMetricConfig(companyType: CompanyType): MetricConfig[] {
  return companyType === 'banking' ? BANKING_METRICS : NON_BANKING_METRICS;
}