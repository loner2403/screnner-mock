// Metric configurations for banking and non-banking companies
import { MetricConfig, CompanyType, InsightSentryQuarterlyResponse } from './types';

// Banking-specific metric configuration
export const BANKING_METRICS: MetricConfig[] = [
  { key: 'total_revenue_fq_h', label: 'Revenue +', type: 'currency' },
  { key: 'interest_income_fq_h', label: 'Interest', type: 'currency' },
  { key: 'total_oper_expense_fq_h', label: 'Expenses +', type: 'currency' },
  { key: 'interest_income_net_fq_h', label: 'Financing Profit', type: 'currency' },
  { key: 'net_interest_margin_fq_h', label: 'Financing Margin %', type: 'percentage' },
  { key: 'non_interest_income_fq_h', label: 'Other Income +', type: 'currency' },
  { key: 'depreciation_fq_h', label: 'Depreciation', type: 'currency' },
  { key: 'pretax_income_fq_h', label: 'Profit before tax', type: 'currency' },
  { key: 'tax_rate_fq_h', label: 'Tax %', type: 'percentage' },
  { key: 'net_income_fq_h', label: 'Net Profit +', type: 'currency' },
  { key: 'earnings_per_share_basic_fq_h', label: 'EPS in Rs', type: 'number' },
  { key: 'nonperf_loans_loans_gross_fq_h', label: 'Gross NPA %', type: 'percentage' },
  { 
    key: 'calculated_net_npa', 
    label: 'Net NPA %', 
    type: 'percentage',
    calculation: (data: InsightSentryQuarterlyResponse) => {
      // Calculate Net NPA % using available data
      const grossNPL = data.nonperf_loans_fq_h;
      const provisions = data.loan_loss_allowances_fq_h;
      const netLoans = data.loans_net_fq_h;
      
      if (!grossNPL || !provisions || !netLoans) {
        return null;
      }
      
      const length = Math.min(grossNPL.length, provisions.length, netLoans.length);
      const result: number[] = [];
      
      for (let i = 0; i < length; i++) {
        const gross = grossNPL[i];
        const provision = provisions[i];
        const loans = netLoans[i];
        
        if (gross !== null && provision !== null && loans !== null && loans !== 0) {
          const netNPL = gross - provision;
          const netNPAPercent = (netNPL / loans) * 100;
          result.push(Math.max(0, netNPAPercent)); // Ensure non-negative
        } else {
          result.push(0);
        }
      }
      
      return result;
    }
  }
];

// Non-banking metric configuration
export const NON_BANKING_METRICS: MetricConfig[] = [
  { key: 'revenue_fq_h', label: 'Sales +', type: 'currency' },
  { key: 'total_oper_expense_fq_h', label: 'Expenses +', type: 'currency' },
  { key: 'oper_income_fq_h', label: 'Operating Profit', type: 'currency' },
  { key: 'operating_margin_fq_h', label: 'OPM %', type: 'percentage' },
  { key: 'non_oper_income_fq_h', label: 'Other Income +', type: 'currency' },
  { key: 'non_oper_interest_income_fq_h', label: 'Interest', type: 'currency' },
  { key: 'depreciation_fq_h', label: 'Depreciation', type: 'currency' },
  { key: 'pretax_income_fq_h', label: 'Profit before tax', type: 'currency' },
  { key: 'tax_rate_fq_h', label: 'Tax %', type: 'percentage' },
  { key: 'net_income_fq_h', label: 'Net Profit +', type: 'currency' },
  { key: 'earnings_per_share_basic_fq_h', label: 'EPS in Rs', type: 'number' },
  { key: 'quarterly_report_pdf', label: 'Raw PDF', type: 'link' }
];

// Banking sectors for company type detection
export const BANKING_SECTORS = [
  'Banks',
  'Banking',
  'Financial Services',
  'Private Sector Bank',
  'Public Sector Bank',
  'Cooperative Bank',
  'Regional Rural Bank',
  'Small Finance Bank',
  'Payments Bank'
];

// Banking field indicators for secondary detection
export const BANKING_FIELD_INDICATORS = [
  'interest_income_fq_h',
  'total_deposits_fq_h',
  'nonperf_loans_fq_h',
  'loans_net_fq_h',
  'net_interest_margin_fq_h'
];

// All fields needed for quarterly results
export const ALL_QUARTERLY_FIELDS = [
  // Common fields
  'revenue_fq_h',
  'total_revenue_fq_h',
  'total_oper_expense_fq_h',
  'oper_income_fq_h',
  'operating_margin_fq_h',
  'non_oper_income_fq_h',
  'non_oper_interest_income_fq_h',
  'depreciation_fq_h',
  'pretax_income_fq_h',
  'tax_rate_fq_h',
  'net_income_fq_h',
  'earnings_per_share_basic_fq_h',
  
  // Banking specific
  'interest_income_fq_h',
  'interest_expense_fq_h',
  'interest_income_net_fq_h',
  'net_interest_margin_fq_h',
  'non_interest_income_fq_h',
  'total_deposits_fq_h',
  'loans_net_fq_h',
  'loans_gross_fq_h',
  'nonperf_loans_fq_h',
  'nonperf_loans_loans_gross_fq_h',
  'loan_loss_provision_fq_h',
  'loan_loss_allowances_fq_h',
  
  // Metadata
  'quarters_info',
  'sector',
  'industry',
  'company_type'
];

// Get metric configuration based on company type
export function getMetricConfig(companyType: CompanyType): MetricConfig[] {
  return companyType === 'banking' ? BANKING_METRICS : NON_BANKING_METRICS;
}