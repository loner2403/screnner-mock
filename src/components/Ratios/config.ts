// Metric configurations for banking and non-banking companies
import { MetricConfig, CompanyType, InsightSentryRatiosResponse } from './types';

// Banking-specific ratios configuration
export const BANKING_METRICS: MetricConfig[] = [
  // Profitability Ratios
  { key: 'return_on_equity_fy_h', label: 'Return on Equity', type: 'percentage' },
  { key: 'return_on_assets_fy_h', label: 'Return on Assets', type: 'percentage' },
  { key: 'net_interest_margin_fy_h', label: 'Net Interest Margin', type: 'percentage' },
  { key: 'operating_margin_fy_h', label: 'Operating Margin', type: 'percentage' },
  
  // Efficiency Ratios
  { key: 'efficiency_ratio_fy_h', label: 'Efficiency Ratio', type: 'percentage' },
  
  // Banking-specific Ratios
  { key: 'loans_net_total_deposits_fy_h', label: 'Loan to Deposit Ratio', type: 'percentage' },
  { key: 'demand_deposits_total_deposits_fy_h', label: 'Demand Deposits Ratio', type: 'percentage' },
  { key: 'nonperf_loans_loans_gross_fy_h', label: 'NPL Ratio', type: 'percentage' },
  { key: 'loan_loss_coverage_fy_h', label: 'Loan Loss Coverage', type: 'percentage' },
  
  // Valuation Ratios
  { key: 'price_earnings_fy_h', label: 'Price to Earnings', type: 'number' },
  { key: 'price_book_fy_h', label: 'Price to Book', type: 'number' },
  { key: 'dividend_payout_ratio_fy_h', label: 'Dividend Payout Ratio', type: 'percentage' },
  { key: 'dividends_yield_fy_h', label: 'Dividend Yield', type: 'percentage' }
];

// Non-banking ratios configuration
export const NON_BANKING_METRICS: MetricConfig[] = [
  // Profitability Ratios
  { key: 'return_on_equity_fy_h', label: 'Return on Equity', type: 'percentage' },
  { key: 'return_on_assets_fy_h', label: 'Return on Assets', type: 'percentage' },
  { key: 'return_on_common_equity_fy_h', label: 'Return on Common Equity', type: 'percentage' },
  { key: 'operating_margin_fy_h', label: 'Operating Margin', type: 'percentage' },
  { key: 'net_margin_fy_h', label: 'Net Margin', type: 'percentage' },
  { key: 'gross_margin_fy_h', label: 'Gross Margin', type: 'percentage' },

  // Solvency Ratios
  { key: 'debt_to_equity_fy_h', label: 'Debt to Equity', type: 'number' },
  { key: 'debt_to_asset_fy_h', label: 'Debt to Asset', type: 'number' },
  { key: 'long_term_debt_to_equity_fy_h', label: 'Long Term Debt to Equity', type: 'number' },
  { key: 'long_term_debt_to_assets_fy_h', label: 'Long Term Debt to Assets', type: 'number' },

  // Liquidity Ratios
  { key: 'current_ratio_fy_h', label: 'Current Ratio', type: 'number' },
  { key: 'quick_ratio_fy_h', label: 'Quick Ratio', type: 'number' },

  // Efficiency Ratios
  { key: 'asset_turnover_fy_h', label: 'Asset Turnover', type: 'number' },
  { key: 'invent_turnover_fy_h', label: 'Inventory Turnover', type: 'number' },
  { key: 'receivables_turnover_fy_h', label: 'Receivables Turnover', type: 'number' },
  
  // Valuation Ratios
  { key: 'price_earnings_fy_h', label: 'Price to Earnings', type: 'number' },
  { key: 'price_book_fy_h', label: 'Price to Book', type: 'number' },
  { key: 'price_sales_fy_h', label: 'Price to Sales', type: 'number' },
  { key: 'dividend_payout_ratio_fy_h', label: 'Dividend Payout Ratio', type: 'percentage' },
  { key: 'dividends_yield_fy_h', label: 'Dividend Yield', type: 'percentage' }
];

// Banking sectors for company type detection
export const BANKING_SECTORS = [
  'Banks',
  'Banking',
  'Financial Services',
  'Finance',
  'Private Sector Bank',
  'Public Sector Bank',
  'Cooperative Bank',
  'Regional Rural Bank',
  'Small Finance Bank',
  'Payments Bank'
];

// Banking field indicators for secondary detection
export const BANKING_FIELD_INDICATORS = [
  'net_interest_margin_fy_h',
  'efficiency_ratio_fy_h',
  'loans_net_total_deposits_fy_h',
  'demand_deposits_total_deposits_fy_h',
  'nonperf_loans_loans_gross_fy_h',
  'loan_loss_coverage_fy_h'
];

// Get metric configuration based on company type
export function getMetricConfig(companyType: CompanyType): MetricConfig[] {
  return companyType === 'banking' ? BANKING_METRICS : NON_BANKING_METRICS;
}