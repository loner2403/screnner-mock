// src/components/Ratios/config.ts

import { MetricConfig, CompanyType } from './types';

// Common metrics for both banking and non-banking
const COMMON_METRICS: MetricConfig[] = [
  { key: 'return_on_equity_fy_h', label: 'Return on Equity %', type: 'percentage' },
  { key: 'return_on_assets_fy_h', label: 'Return on Assets %', type: 'percentage' },
  { key: 'debt_to_equity_fy_h', label: 'Debt to Equity', type: 'number' },
  { key: 'price_earnings_fy_h', label: 'P/E Ratio', type: 'number' },
  { key: 'price_book_fy_h', label: 'P/B Ratio', type: 'number' },
  { key: 'dividend_payout_ratio_fy_h', label: 'Dividend Payout %', type: 'percentage' },
];

// Banking-specific ratios configuration
export const BANKING_METRICS: MetricConfig[] = [
  ...COMMON_METRICS,
  { key: 'net_interest_margin_fy_h', label: 'Net Interest Margin %', type: 'percentage' },
  { key: 'efficiency_ratio_fy_h', label: 'Cost to Income Ratio', type: 'number' },
  { key: 'loans_net_total_deposits_fy_h', label: 'Credit to Deposit Ratio', type: 'number' },
  { key: 'demand_deposits_total_deposits_fy_h', label: 'CASA Ratio %', type: 'percentage' },
  { key: 'nonperf_loans_loans_gross_fy_h', label: 'Gross NPA %', type: 'percentage' },
  { key: 'loan_loss_coverage_fy_h', label: 'Provision Coverage %', type: 'percentage' },
];

// Non-banking ratios configuration
export const NON_BANKING_METRICS: MetricConfig[] = [
  ...COMMON_METRICS,
  { key: 'operating_margin_fy_h', label: 'Operating Margin %', type: 'percentage' },
  { key: 'net_margin_fy_h', label: 'Net Margin %', type: 'percentage' },
  { key: 'gross_margin_fy_h', label: 'Gross Margin %', type: 'percentage' },
  { key: 'current_ratio_fy_h', label: 'Current Ratio', type: 'number' },
  { key: 'quick_ratio_fy_h', label: 'Quick Ratio', type: 'number' },
  { key: 'asset_turnover_fy_h', label: 'Asset Turnover', type: 'number' },
  { key: 'invent_turnover_fy_h', label: 'Inventory Turnover', type: 'number' },
  { key: 'price_sales_fy_h', label: 'P/S Ratio', type: 'number' },
];

// Banking sectors for company type detection
export const BANKING_SECTORS = [
  'Banks',
  'Banking',
  'Financial Services',
  'Finance',
  'Private Sector Bank',
  'Public Sector Bank',
];

// Banking field indicators for secondary detection
export const BANKING_FIELD_INDICATORS = [
  'net_interest_margin_fy_h',
  'loans_net_total_deposits_fy_h',
  'nonperf_loans_loans_gross_fy_h',
];

// Get metric configuration based on company type
export function getMetricConfig(companyType: CompanyType): MetricConfig[] {
  return companyType === 'banking' ? BANKING_METRICS : NON_BANKING_METRICS;
}
