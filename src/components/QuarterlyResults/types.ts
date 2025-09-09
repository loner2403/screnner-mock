// TypeScript interfaces for Quarterly Results Component

export interface QuarterlyResultsProps {
  symbol: string;
  companyName: string;
  sector?: string;
  className?: string;
}

export interface QuarterInfo {
  quarter: string; // "Jun 2024"
  year: number;
  period: string; // "Q1 FY25"
  date: string; // ISO date string
}

export interface MetricRow {
  label: string;
  values: (number | string | null)[];
  type: 'currency' | 'percentage' | 'number' | 'link';
  unit?: string;
  rawValues?: (number | null)[];
}

export interface QuarterlyData {
  quarters: QuarterInfo[];
  metrics: MetricRow[];
  companyType: 'banking' | 'non-banking';
  hasProductSegments: boolean;
  lastUpdated: string;
}

export interface FormattedValue {
  display: string;
  raw: number | null;
  isNegative?: boolean;
  isZero?: boolean;
}

export type MetricType = 'currency' | 'percentage' | 'number' | 'link';

export type CompanyType = 'banking' | 'non-banking';

// Enhanced core data interfaces for actual API structure
export interface FinancialMetric {
  id: string;
  name: string;
  currentValue: number | null;
  historicalValues: (number | null)[];
  unit: 'currency' | 'percentage' | 'ratio' | 'count';
  category: 'profitability' | 'liquidity' | 'solvency' | 'efficiency' | 'asset-quality';
  period: 'FY' | 'FQ' | 'TTM';
  section: string;
  subsection?: string;
}

export interface FinancialSection {
  id: string;
  name: string;
  metrics: FinancialMetric[];
  subsections?: FinancialSection[];
}

export interface CompanyFinancialData {
  companyType: 'banking' | 'non-banking';
  symbol: string;
  sections: FinancialSection[];
  lastUpdated: string;
  metadata: {
    sector?: string;
    industry?: string;
    maxHistoricalYears: number;
    maxQuarterlyPeriods: number;
  };
}

// Raw API Response interfaces - Complex nested structure
export interface RawApiDataPoint {
  id: string;
  name: string;
  category: string;
  type: string;
  period: 'FY' | 'FQ' | 'TTM';
  value: number | number[] | null;
}

export interface RawInsightSentryResponse {
  data: RawApiDataPoint[];
  metadata?: {
    symbol: string;
    sector?: string;
    industry?: string;
    lastUpdated: string;
  };
}

// Parsed/Flattened API Response interfaces
export interface InsightSentryQuarterlyResponse {
  // Quarterly historical arrays (up to 32 quarters)
  revenue_fq_h?: number[];
  total_revenue_fq_h?: number[];
  interest_income_fq_h?: number[];
  interest_expense_fq_h?: number[];
  interest_income_net_fq_h?: number[];
  net_interest_margin_fq_h?: number[];
  non_interest_income_fq_h?: number[];
  total_oper_expense_fq_h?: number[];
  oper_income_fq_h?: number[];
  operating_margin_fq_h?: number[];
  non_oper_income_fq_h?: number[];
  non_oper_interest_income_fq_h?: number[];
  depreciation_fq_h?: number[];
  pretax_income_fq_h?: number[];
  tax_rate_fq_h?: number[];
  net_income_fq_h?: number[];
  net_income_bef_disc_oper_fq_h?: number[];
  net_margin_fq_h?: number[];
  earnings_per_share_basic_fq_h?: number[];
  gross_profit_fq_h?: number[];
  ebitda_fq_h?: number[];
  ebitda_margin_fq_h?: number[];
  nonperf_loans_loans_gross_fq_h?: number[];
  loan_loss_provision_fq_h?: number[];
  cash_f_operating_activities_fq_h?: number[];
  total_assets_fq_h?: number[];
  total_liabilities_fq_h?: number[];
  total_equity_fq_h?: number[];
  
  // Banking specific quarterly fields
  total_deposits_fq_h?: number[];
  loans_net_fq_h?: number[];
  loans_gross_fq_h?: number[];
  loan_loss_allowances_fq_h?: number[];
  nonperf_loans_fq_h?: number[];
  
  // Annual historical arrays (up to 20 years)
  revenue_fy_h?: number[];
  total_revenue_fy_h?: number[];
  interest_income_fy_h?: number[];
  interest_expense_fy_h?: number[];
  interest_income_net_fy_h?: number[];
  net_interest_margin_fy_h?: number[];
  non_interest_income_fy_h?: number[];
  total_oper_expense_fy_h?: number[];
  oper_income_fy_h?: number[];
  operating_margin_fy_h?: number[];
  non_oper_income_fy_h?: number[];
  non_oper_interest_income_fy_h?: number[];
  depreciation_fy_h?: number[];
  ebit_fy_h?: number[];
  ebitda_fy_h?: number[];
  ebitda_margin_fy_h?: number[];
  pretax_income_fy_h?: number[];
  pre_tax_margin_fy_h?: number[];
  income_tax_fy_h?: number[];
  tax_rate_fy_h?: number[];
  net_income_fy_h?: number[];
  net_margin_fy_h?: number[];
  earnings_per_share_basic_fy_h?: number[];
  dividend_payout_ratio_fy_h?: number[];
  cost_of_goods_fy_h?: number[];
  gross_profit_fy_h?: number[];
  gross_margin_fy_h?: number[];
  operating_expenses_fy_h?: number[];
  sell_gen_admin_exp_total_fy_h?: number[];
  
  // Balance Sheet annual historicals
  total_assets_fy_h?: number[];
  total_liabilities_fy_h?: number[];
  total_equity_fy_h?: number[];
  total_debt_fy_h?: number[];
  long_term_debt_fy_h?: number[];
  total_current_liabilities_fy_h?: number[];
  cash_n_equivalents_fy_h?: number[];
  total_inventory_fy_h?: number[];
  common_stock_par_fy_h?: number[];
  retained_earnings_fy_h?: number[];
  ppe_total_net_fy_h?: number[];
  long_term_investments_fy_h?: number[];
  long_term_other_assets_total_fy_h?: number[];
  
  // Cash Flow annual historicals
  cash_f_operating_activities_fy_h?: number[];
  cash_f_investing_activities_fy_h?: number[];
  cash_f_financing_activities_fy_h?: number[];
  free_cash_flow_fy_h?: number[];
  capital_expenditures_fy_h?: number[];
  common_dividends_cash_flow_fy_h?: number[];
  
  // Key Ratios annual historicals
  return_on_equity_fy_h?: number[];
  return_on_assets_fy_h?: number[];
  debt_to_equity_fy_h?: number[];
  debt_to_asset_fy_h?: number[];
  current_ratio_fy_h?: number[];
  quick_ratio_fy_h?: number[];
  asset_turnover_fy_h?: number[];
  invent_turnover_fy_h?: number[];
  book_value_per_share_fy_h?: number[];
  market_cap_basic_fy_h?: number[];
  enterprise_value_fy_h?: number[];
  price_earnings_fq_h?: number[];
  price_book_fq_h?: number[];
  price_sales_fq_h?: number[];
  enterprise_value_ebitda_fq_h?: number[];
  dividends_yield_fy_h?: number[];
  total_shares_outstanding_fy_h?: number[];
  number_of_employees_fy_h?: number[];
  
  // Banking specific annual fields
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
  short_term_debt_fy_h?: number[];
  
  // Current values (non-historical)
  revenue_fy?: number;
  total_revenue_fy?: number;
  total_revenue_ttm?: number;
  interest_income_fy?: number;
  net_income_fy?: number;
  
  // Quarterly current values
  revenue_fq?: number;
  total_revenue_fq?: number;
  interest_income_fq?: number;
  interest_income_net_fq?: number;
  net_interest_margin_fq?: number;
  non_interest_income_fq?: number;
  oper_income_fq?: number;
  non_oper_income_fq?: number;
  ebitda_fq?: number;
  ebitda_margin_fq?: number;
  net_income_fq?: number;
  net_margin_fq?: number;
  earnings_per_share_basic_fq?: number;
  gross_profit_fq?: number;
  total_deposits_fq?: number;
  nonperf_loans_fq?: number;
  nonperf_loans_loans_gross_fq?: number;
  loan_loss_provision_fq?: number;
  cash_f_operating_activities_fq?: number;
  total_assets_fq?: number;
  total_liabilities_fq?: number;
  total_equity_fq?: number;
  
  // Segment data
  revenue_seg_by_business_h?: any;
  revenue_seg_by_region_h?: any;
  
  // Additional banking fields
  loans_mortgage_fy?: number;
  loans_commercial_fy?: number;
  loans_consumer_fy?: number;
  loans_broker_fin_inst_fy?: number;
  trust_commissions_income_fy?: number;
  underwriting_n_commissions_fy?: number;
  trading_account_income_fy?: number;
  trading_account_securities_fy?: number;
  loan_losses_act_fy?: number;
  loan_loss_rsrv_total_assets_fy?: number;
  loan_loss_rsrv_total_capital_fy?: number;
  nonperf_loan_common_equity_fy?: number;
  
  // Additional non-banking fields
  other_assets_incl_intang_fy?: number;
  market_cap_basic?: number;
  enterprise_value_fq?: number;
  price_earnings_fq?: number;
  price_book_fq?: number;
  price_sales_fq?: number;
  enterprise_value_ebitda_fq?: number;
  dividends_yield_fq?: number;
  number_of_employees?: number;
  
  // Quarter metadata
  quarters_info?: {
    dates: string[];
    periods: string[];
  };
  
  // Company metadata
  sector?: string;
  industry?: string;
  company_type?: string;
}

export interface ProcessedQuarterlyData {
  quarters: QuarterInfo[];
  rows: MetricRow[];
  companyType: CompanyType;
  hasProductSegments: boolean;
  lastUpdated: string;
}

// Enhanced mapping configuration interfaces
export interface FieldMapping {
  apiField: string;
  historicalField?: string;
  quarterlyField?: string;
  quarterlyHistoricalField?: string;
  displayName: string;
  unit: 'currency' | 'percentage' | 'ratio' | 'count';
  category: 'profitability' | 'liquidity' | 'solvency' | 'efficiency' | 'asset-quality';
  section: string;
  subsection?: string;
  required: boolean;
  calculation?: (data: InsightSentryQuarterlyResponse) => number | null;
  historicalCalculation?: (data: InsightSentryQuarterlyResponse) => number[] | null;
  quarterlyCalculation?: (data: InsightSentryQuarterlyResponse) => number[] | null;
}

export interface MappingConfig {
  companyType: 'banking' | 'non-banking';
  sections: {
    [sectionId: string]: {
      name: string;
      fields: FieldMapping[];
      subsections?: {
        [subsectionId: string]: {
          name: string;
          fields: FieldMapping[];
        };
      };
    };
  };
}

// Legacy metric configuration interface (for backward compatibility)
export interface MetricConfig {
  key: string;
  label: string;
  type: MetricType;
  unit?: string;
  calculation?: (data: InsightSentryQuarterlyResponse) => number[] | null;
}

// Enhanced error handling interfaces
export enum MappingErrorType {
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_DATA_TYPE = 'INVALID_DATA_TYPE',
  CALCULATION_ERROR = 'CALCULATION_ERROR',
  COMPANY_TYPE_DETECTION_FAILED = 'COMPANY_TYPE_DETECTION_FAILED',
  API_PARSING_ERROR = 'API_PARSING_ERROR',
  HISTORICAL_DATA_MISMATCH = 'HISTORICAL_DATA_MISMATCH'
}

export interface MappingError {
  type: MappingErrorType;
  field: string;
  message: string;
  originalValue?: any;
  context?: {
    section?: string;
    subsection?: string;
    companyType?: CompanyType;
    period?: string;
    outliers?: number[];
    fallbackReason?: string;
    attemptNumber?: number;
    totalAttempts?: number;
  };
}

export interface DataMappingResult {
  success: boolean;
  data?: CompanyFinancialData;
  errors: MappingError[];
  warnings: MappingError[];
}

// Legacy error interfaces (for backward compatibility)
export interface QuarterlyResultsError {
  type: 'network' | 'not-found' | 'partial-data' | 'invalid-data';
  message: string;
  details?: string;
}

export interface ErrorStateProps {
  error: QuarterlyResultsError;
  onRetry: () => void;
  variant: 'network' | 'not-found' | 'partial-data';
}

// Loading state interface
export interface LoadingStateProps {
  quarters?: number;
  metrics?: number;
}