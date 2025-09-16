// Core balance sheet interfaces (following QuarterlyResults pattern but with multi-year data)
export interface MetricRow {
  label: string;
  values: string[];
  type: 'currency' | 'percentage' | 'number' | 'section';
  unit?: string;
  rawValues?: (number | null)[];
  level?: number;
  isSection?: boolean;
  isSubTotal?: boolean;
  isTotal?: boolean;
  collapsible?: boolean;
  formula?: string;
}

export interface BalanceSheetProps {
  symbol: string;
  companyName: string;
  sector?: string;
  className?: string;
}

export interface ProcessedBalanceSheetData {
  years: string[];
  rows: MetricRow[];
  companyType: CompanyType;
  lastUpdated: string;
}

// Metric configuration interface (following QuarterlyResults pattern)
export interface MetricConfig {
  key?: string;
  label: string;
  type: 'currency' | 'percentage' | 'number' | 'section';
  unit?: string;
  level?: number;
  isSection?: boolean;
  isSubTotal?: boolean;
  isTotal?: boolean;
  collapsible?: boolean;
  formula?: string;
  calculation?: (dataMap: Map<string, (number | null)[]>) => (number | null)[] | null;
  items?: MetricConfig[];  // Still kept for backwards compatibility but not used in flat structure
  formatValue?: (value: number) => number;  // For custom formatting
}

export interface FormattedValue {
  display: string;
  raw: number | null;
  isNegative?: boolean;
  isZero?: boolean;
}

export type CompanyType = 'banking' | 'non-banking';

// Error handling interface (following QuarterlyResults pattern)
export interface BalanceSheetError {
  type: 'network' | 'not-found' | 'partial-data' | 'invalid-data';
  message: string;
  details?: string;
}

// Raw API Response interfaces for balance sheet data
export interface InsightSentryBalanceSheetResponse {
  // Annual historical arrays for common fields (up to 20 years)
  total_assets_fy_h?: number[];
  total_liabilities_fy_h?: number[];
  total_equity_fy_h?: number[];
  common_stock_par_fy_h?: number[];
  common_equity_total_fy_h?: number[];
  retained_earnings_fy_h?: number[];
  total_debt_fy_h?: number[];
  long_term_debt_fy_h?: number[];
  short_term_debt_fy_h?: number[];
  total_current_liabilities_fy_h?: number[];
  ppe_total_net_fy_h?: number[];
  long_term_investments_fy_h?: number[];
  long_term_other_assets_total_fy_h?: number[];
  deferred_tax_assests_fy_h?: number[];
  goodwill_fy_h?: number[];
  intangibles_net_fy_h?: number[];
  investments_in_unconcsolidate_fy_h?: number[];
  other_investments_fy_h?: number[];
  cash_n_equivalents_fy_h?: number[];
  total_inventory_fy_h?: number[];
  cwip_fy_h?: number[];
  
  // Banking-specific annual historical fields
  total_deposits_fy_h?: number[];
  demand_deposits_fy_h?: number[];
  savings_time_deposits_fy_h?: number[];
  demand_deposits_total_deposits_fy_h?: number[];
  increase_in_deposits_fy_h?: number[];
  loans_net_fy_h?: number[];
  loans_gross_fy_h?: number[];
  loan_loss_allowances_fy_h?: number[];
  loan_loss_provision_fy_h?: number[];
  increase_in_loans_fy_h?: number[];
  loans_net_total_deposits_fy_h?: number[];
  nonperf_loans_fy_h?: number[];
  nonperf_loans_loans_gross_fy_h?: number[];
  loan_loss_coverage_fy_h?: number[];
  interest_income_loans_fy_h?: number[];
  interest_income_government_securities_fy_h?: number[];
  interest_income_bank_deposits_fy_h?: number[];
  interest_expense_banks_deposits_fy_h?: number[];
  interest_expense_on_debt_fy_h?: number[];
  non_interest_expense_fy_h?: number[];
  return_on_common_equity_fy_h?: number[];
  efficiency_ratio_fy_h?: number[];
  treasury_securities_fy_h?: number[];
  equity_securities_investment_fy_h?: number[];
  other_assets_fy_h?: number[];
  other_liabilities_total_fy_h?: number[];
  
  // Additional fields that might be useful
  paid_in_capital_fy_h?: number[];
  minority_interest_fy_h?: number[];
  goodwill_fy_h?: number[];
  intangible_assets_fy_h?: number[];
  
  // Current values (non-historical)
  total_assets_fy?: number;
  total_liabilities_fy?: number;
  total_equity_fy?: number;
  common_stock_par_fy?: number;
  retained_earnings_fy?: number;
  total_debt_fy?: number;
  
  // Company metadata
  sector?: string;
  industry?: string;
  company_type?: string;
  report_type?: string;
  'sector-i18n-en'?: string;
  'industry-i18n-en'?: string;
}

// Loading state interface
export interface BalanceSheetLoadingState {
  years?: number;
  metrics?: number;
}
