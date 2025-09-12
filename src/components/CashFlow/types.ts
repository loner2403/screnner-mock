// Core cash flow interfaces (following BalanceSheet pattern but with cash flow data)
export interface MetricRow {
  label: string;
  values: string[];
  type: 'currency' | 'percentage' | 'number';
  unit?: string;
  rawValues?: (number | null)[];
}

export interface CashFlowProps {
  symbol: string;
  companyName: string;
  sector?: string;
  className?: string;
}

export interface ProcessedCashFlowData {
  years: string[];
  rows: MetricRow[];
  companyType: CompanyType;
  lastUpdated: string;
}

// Metric configuration interface (following BalanceSheet pattern)
export interface MetricConfig {
  key: string;
  label: string;
  type: 'currency' | 'percentage' | 'number';
  unit?: string;
  calculation?: (data: InsightSentryCashFlowResponse) => number[] | null;
}

export interface FormattedValue {
  display: string;
  raw: number | null;
  isNegative?: boolean;
  isZero?: boolean;
}

export type CompanyType = 'banking' | 'non-banking';

// Error handling interface (following BalanceSheet pattern)
export interface CashFlowError {
  type: 'network' | 'not-found' | 'partial-data' | 'invalid-data';
  message: string;
  details?: string;
}

// Raw API Response interfaces for cash flow data
export interface InsightSentryCashFlowResponse {
  // Operating Activities - Annual historical arrays
  net_income_fy_h?: number[];
  depreciation_amortization_fy_h?: number[];
  working_capital_changes_fy_h?: number[];
  accounts_receivable_changes_fy_h?: number[];
  inventory_changes_fy_h?: number[];
  accounts_payable_changes_fy_h?: number[];
  other_operating_cash_flow_fy_h?: number[];
  operating_cash_flow_fy_h?: number[];
  
  // Investing Activities - Annual historical arrays
  capital_expenditure_fy_h?: number[];
  acquisitions_fy_h?: number[];
  asset_sales_fy_h?: number[];
  investment_purchases_fy_h?: number[];
  investment_sales_fy_h?: number[];
  other_investing_cash_flow_fy_h?: number[];
  investing_cash_flow_fy_h?: number[];
  
  // Financing Activities - Annual historical arrays
  debt_issued_fy_h?: number[];
  debt_repayment_fy_h?: number[];
  equity_issued_fy_h?: number[];
  equity_repurchase_fy_h?: number[];
  dividends_paid_fy_h?: number[];
  other_financing_cash_flow_fy_h?: number[];
  financing_cash_flow_fy_h?: number[];
  
  // Net Cash Flow and Cash Position
  net_cash_flow_fy_h?: number[];
  cash_beginning_fy_h?: number[];
  cash_ending_fy_h?: number[];
  free_cash_flow_fy_h?: number[];
  
  // Banking-specific cash flow fields
  interest_received_fy_h?: number[];
  interest_paid_fy_h?: number[];
  deposit_changes_fy_h?: number[];
  loan_changes_fy_h?: number[];
  
  // Current values (non-historical)
  operating_cash_flow_fy?: number;
  investing_cash_flow_fy?: number;
  financing_cash_flow_fy?: number;
  net_cash_flow_fy?: number;
  free_cash_flow_fy?: number;
  
  // Company metadata
  sector?: string;
  industry?: string;
  company_type?: string;
  report_type?: string;
  'sector-i18n-en'?: string;
  'industry-i18n-en'?: string;
}

// Loading state interface
export interface CashFlowLoadingState {
  years?: number;
  metrics?: number;
}