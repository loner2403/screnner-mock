// src/components/Ratios/types.ts

// Core ratios interfaces
export interface MetricRow {
  label: string;
  values: string[];
  type: 'percentage' | 'number' | 'currency';
  unit?: string;
  rawValues?: (number | null)[];
}

export interface RatiosProps {
  symbol: string;
  companyName: string;
  sector?: string;
  className?: string;
}

export interface ProcessedRatiosData {
  years: string[];
  rows: MetricRow[];
  companyType: CompanyType;
  lastUpdated: string;
}

// Metric configuration interface
export interface MetricConfig {
  key: string;
  label: string;
  type: 'percentage' | 'number' | 'currency';
  unit?: string;
  calculation?: (data: InsightSentryRatiosResponse) => number[] | null;
}

export interface FormattedValue {
  display: string;
  raw: number | null;
  isNegative?: boolean;
  isZero?: boolean;
}

export type CompanyType = 'banking' | 'non-banking';

// Error handling interface
export interface RatiosError {
  type: 'network' | 'not-found' | 'partial-data' | 'invalid-data';
  message: string;
  details?: string;
}

// Raw API Response interfaces for ratios data
export interface InsightSentryRatiosResponse {
  // Profitability Ratios
  return_on_equity_fy_h?: number[];
  return_on_assets_fy_h?: number[];
  return_on_common_equity_fy_h?: number[];
  operating_margin_fy_h?: number[];
  net_margin_fy_h?: number[];
  gross_margin_fy_h?: number[];

  // Solvency Ratios
  debt_to_equity_fy_h?: number[];
  debt_to_asset_fy_h?: number[];
  long_term_debt_to_equity_fy_h?: number[];
  long_term_debt_to_assets_fy_h?: number[];

  // Liquidity Ratios
  current_ratio_fy_h?: number[];
  quick_ratio_fy_h?: number[];

  // Efficiency Ratios
  asset_turnover_fy_h?: number[];
  invent_turnover_fy_h?: number[];
  receivables_turnover_fy_h?: number[];
  accounts_receivables_net_fy_h?: number[];
  total_revenue_fy_h?: number[];
  
  // Valuation Ratios
  price_earnings_fy_h?: number[];
  price_book_fy_h?: number[];
  price_sales_fy_h?: number[];
  dividend_payout_ratio_fy_h?: number[];
  dividends_yield_fy_h?: number[];

  // Banking-specific Ratios
  net_interest_margin_fy_h?: number[];
  efficiency_ratio_fy_h?: number[];
  loans_net_total_deposits_fy_h?: number[];
  demand_deposits_total_deposits_fy_h?: number[];
  nonperf_loans_loans_gross_fy_h?: number[];
  loan_loss_coverage_fy_h?: number[];

  // Company metadata
  sector?: string;
  industry?: string;
  company_type?: string;
  report_type?: string;
  'sector-i18n-en'?: string;
  'industry-i18n-en'?: string;
  years?: string[];
}

// Loading state interface
export interface RatiosLoadingState {
  years?: number;
  metrics?: number;
}
