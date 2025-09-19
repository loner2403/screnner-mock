// Simple types for Quarterly Results based on ROIC API

export interface QuarterlyResultsProps {
  symbol: string;
  companyName: string;
  sector?: string;
  className?: string;
}

export interface QuarterlyData {
  // Common fields (all companies)
  revenue_fq_h?: number[];
  total_revenue_fq_h?: number[];
  total_oper_expense_fq_h?: number[];
  oper_income_fq_h?: number[];
  operating_margin_fq_h?: number[];
  non_oper_income_fq_h?: number[];
  interest_fq_h?: number[];
  depreciation_fq_h?: number[];
  pretax_income_fq_h?: number[];
  tax_rate_fq_h?: number[];
  net_income_fq_h?: number[];
  earnings_per_share_basic_fq_h?: number[];

  // Banking specific fields
  interest_income_fq_h?: number[];
  interest_income_net_fq_h?: number[];
  net_interest_margin_fq_h?: number[];
  non_interest_income_fq_h?: number[];
  nonperf_loans_loans_gross_fq_h?: number[];
  loan_loss_allowances_fq_h?: number[];
  loans_net_fq_h?: number[];

  // Quarter metadata
  quarters_info?: {
    dates: string[];
    periods: string[];
  };

  // Company metadata
  sector?: string;
}

export type CompanyType = 'banking' | 'non-banking';

export interface MetricConfig {
  key: keyof QuarterlyData;
  label: string;
  type: 'currency' | 'percentage' | 'number';
}

// Legacy types for compatibility with existing components
export interface RawInsightSentryResponse {
  data: RawApiDataPoint[];
  metadata?: any;
}

export interface RawApiDataPoint {
  id: string;
  name: string;
  category: string;
  type: string;
  period: 'FY' | 'FQ' | 'TTM';
  value: number | number[] | null;
}

export interface InsightSentryQuarterlyResponse extends QuarterlyData {
  // Additional legacy fields for compatibility
  [key: string]: any;
}

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
  context?: any;
}