// Metric configurations for cash flow statements for banking and non-banking companies
import { MetricConfig, CompanyType, InsightSentryCashFlowResponse } from './types';

// Banking-specific cash flow configuration (based on actual API fields)
export const BANKING_CASH_FLOW_METRICS: MetricConfig[] = [
  // Operating Activities
  { key: 'cash_f_operating_activities_fy_h', label: 'Cash from Operating Activity', type: 'currency' },
  { key: 'cash_f_investing_activities_fy_h', label: 'Cash from Investing Activity', type: 'currency' },
  { key: 'cash_f_financing_activities_fy_h', label: 'Cash from Financing Activity', type: 'currency' },
  { key: 'free_cash_flow_fy_h', label: 'Net cash flow', type: 'currency' },
  
  

];

// Non-banking cash flow configuration (based on actual API fields)
export const NON_BANKING_CASH_FLOW_METRICS: MetricConfig[] = [
  // Operating Activities
  { key: 'cash_f_operating_activities_fy_h', label: 'Cash from Operating Activity', type: 'currency' },
  { key: 'cash_f_investing_activities_fy_h', label: 'Cash from Investing Activity', type: 'currency' },
  { key: 'cash_f_financing_activities_fy_h', label: 'Cash from Financing Activity', type: 'currency' },
  { key: 'free_cash_flow_fy_h', label: 'Net cash flow', type: 'currency' },
  
];

// Banking sectors for company type detection (reusing from BalanceSheet)
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
  'deposit_changes_fy_h',
  'loan_changes_fy_h',
  'interest_received_fy_h',
  'interest_paid_fy_h'
];

// All fields needed for cash flow statement (based on API structure)
export const ALL_CASH_FLOW_FIELDS = [
  // Operating Activities
  'net_income_fy_h',
  'depreciation_amortization_fy_h',
  'working_capital_changes_fy_h',
  'accounts_receivable_changes_fy_h',
  'inventory_changes_fy_h',
  'accounts_payable_changes_fy_h',
  'operating_cash_flow_fy_h',
  
  // Investing Activities
  'capital_expenditure_fy_h',
  'acquisitions_fy_h',
  'asset_sales_fy_h',
  'investment_purchases_fy_h',
  'investment_sales_fy_h',
  'investing_cash_flow_fy_h',
  
  // Financing Activities
  'debt_issued_fy_h',
  'debt_repayment_fy_h',
  'equity_issued_fy_h',
  'equity_repurchase_fy_h',
  'dividends_paid_fy_h',
  'financing_cash_flow_fy_h',
  
  // Net Cash Flow
  'net_cash_flow_fy_h',
  'cash_beginning_fy_h',
  'cash_ending_fy_h',
  'free_cash_flow_fy_h',
  
  // Banking-specific fields
  'deposit_changes_fy_h',
  'loan_changes_fy_h',
  'interest_received_fy_h',
  'interest_paid_fy_h',
  
  // Metadata
  'sector',
  'industry',
  'report_type'
];

// Get metric configuration based on company type
export function getMetricConfig(companyType: CompanyType): MetricConfig[] {
  return companyType === 'banking' ? BANKING_CASH_FLOW_METRICS : NON_BANKING_CASH_FLOW_METRICS;
}