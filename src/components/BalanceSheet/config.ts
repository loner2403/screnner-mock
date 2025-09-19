// Balance sheet structure configuration with ROIC API field mappings
import { MetricConfig, CompanyType } from './types';

// Balance sheet structure for non-banking companies based on ROIC API fields
export const NON_BANKING_BALANCE_SHEET_METRICS: MetricConfig[] = [
  // ASSETS SECTION HEADER
  { label: '--- ASSETS ---', type: 'section', isSection: true },

  // Non-current Assets
  { label: 'NON-CURRENT ASSETS', type: 'section', isSection: true, level: 1 },
  { key: 'ppe_total_net_fy_h', label: 'Property, plant & equipment (net)', type: 'currency' },
  {
    label: 'Intangibles & goodwill (net)',
    type: 'currency',
    calculation: (dataMap) => {
      const goodwill = dataMap.get('goodwill_fy_h') || [];
      const intangibles = dataMap.get('intangibles_net_fy_h') || [];

      const maxLength = Math.max(goodwill.length, intangibles.length);
      const result = [];
      for (let i = 0; i < maxLength; i++) {
        const goodwillValue = goodwill[i] || 0;
        const intangiblesValue = intangibles[i] || 0;
        result.push(goodwillValue + intangiblesValue);
      }
      return result;
    }
  },
  { key: 'other_noncurrent_assets_fy_h', label: 'Long-term investments', type: 'currency' },
  { key: 'other_noncurrent_assets_fy_h', label: 'Deferred tax assets', type: 'currency' },
  { key: 'other_noncurrent_assets_fy_h', label: 'Other non-current assets', type: 'currency' },
  { key: 'total_noncurrent_assets_fy_h', label: 'Total Non-current Assets', type: 'currency', isSubTotal: true },

  // Current Assets
  { label: 'CURRENT ASSETS', type: 'section', isSection: true, level: 1 },
  { key: 'total_inventory_fy_h', label: 'Inventories', type: 'currency' },
  { key: 'accounts_receivable_fy_h', label: 'Trade & other receivables', type: 'currency' },
  { key: 'cash_fy_h', label: 'Cash & equivalents', type: 'currency' },
  { key: 'short_term_investments_fy_h', label: 'Short-term investments', type: 'currency' },
  { key: 'other_current_assets_fy_h', label: 'Other current assets', type: 'currency' },
  { key: 'total_current_assets_fy_h', label: 'Total Current Assets', type: 'currency', isSubTotal: true },

  // Total Assets
  { key: 'total_assets_fy_h', label: 'TOTAL ASSETS', type: 'currency', isTotal: true },
  
  // LIABILITIES SECTION HEADER
  { label: '--- LIABILITIES ---', type: 'section', isSection: true },

  // Non-current Liabilities
  { label: 'NON-CURRENT LIABILITIES', type: 'section', isSection: true, level: 1 },
  { key: 'long_term_debt_fy_h', label: 'Long-term debt', type: 'currency' },
  { key: 'other_noncurrent_liabilities_fy_h', label: 'Deferred tax liabilities', type: 'currency' },
  { key: 'other_noncurrent_liabilities_fy_h', label: 'Other non-current liabilities', type: 'currency' },
  { key: 'total_noncurrent_liabilities_fy_h', label: 'Total Non-current Liabilities', type: 'currency', isSubTotal: true },

  // Current Liabilities
  { label: 'CURRENT LIABILITIES', type: 'section', isSection: true, level: 1 },
  { key: 'short_term_debt_fy_h', label: 'Short-term borrowings & current portion of LT debt', type: 'currency' },
  { key: 'accounts_payable_fy_h', label: 'Trade payables', type: 'currency' },
  { key: 'other_current_liabilities_fy_h', label: 'Deferred revenue (current)', type: 'currency' },
  { key: 'other_current_liabilities_fy_h', label: 'Other current liabilities (incl. taxes/dividends/accruals)', type: 'currency' },
  { key: 'total_current_liabilities_fy_h', label: 'Subtotal – Current liabilities', type: 'currency', isSubTotal: true },

  // Total Liabilities
  { key: 'total_liabilities_fy_h', label: 'TOTAL LIABILITIES', type: 'currency', isTotal: true },
  
  // EQUITY SECTION HEADER
  { label: '--- EQUITY ---', type: 'section', isSection: true },

  { key: 'common_stock_fy_h', label: 'Equity share capital', type: 'currency' },
  {
    label: 'Reserves & surplus (incl. APIC, retained earnings, other equity, net of treasury)',
    type: 'currency',
    calculation: (dataMap) => {
      const paidInCapital = dataMap.get('paid_in_capital_fy_h') || [];
      const retainedEarnings = dataMap.get('retained_earnings_fy_h') || [];

      const maxLength = Math.max(paidInCapital.length, retainedEarnings.length);
      const result = [];
      for (let i = 0; i < maxLength; i++) {
        const paidInValue = paidInCapital[i] || 0;
        const retainedValue = retainedEarnings[i] || 0;
        result.push(paidInValue + retainedValue);
      }
      return result;
    }
  },
  { key: 'total_equity_fy_h', label: 'Equity attributable to owners', type: 'currency' },
  { key: 'total_equity_fy_h', label: 'TOTAL EQUITY', type: 'currency', isTotal: true },

  // Check
  {
    label: 'TOTAL LIABILITIES & EQUITY',
    type: 'currency',
    isTotal: true,
    calculation: (dataMap) => {
      const totalLiabilities = dataMap.get('total_liabilities_fy_h') || [];
      const totalEquity = dataMap.get('total_equity_fy_h') || [];

      const maxLength = Math.max(totalLiabilities.length, totalEquity.length);
      const result = [];
      for (let i = 0; i < maxLength; i++) {
        const liabilitiesValue = totalLiabilities[i] || 0;
        const equityValue = totalEquity[i] || 0;
        result.push(liabilitiesValue + equityValue);
      }
      return result;
    }
  }
];

// Banking-specific metrics (similar structure but with banking-specific fields)
export const BANKING_BALANCE_SHEET_METRICS: MetricConfig[] = [
  // ASSETS SECTION HEADER
  { label: '--- ASSETS ---', type: 'section', isSection: true },

  // Banking Assets
  { key: 'cash_fy_h', label: 'Cash & Cash Equivalents', type: 'currency' },
  { key: 'total_current_assets_fy_h', label: 'Loans & Advances', type: 'currency' },
  { key: 'short_term_investments_fy_h', label: 'Investments', type: 'currency' },
  { key: 'ppe_total_net_fy_h', label: 'Fixed Assets', type: 'currency' },
  { key: 'other_noncurrent_assets_fy_h', label: 'Other Assets', type: 'currency' },
  { key: 'total_assets_fy_h', label: 'TOTAL ASSETS', type: 'currency', isTotal: true },

  // LIABILITIES SECTION HEADER
  { label: '--- LIABILITIES ---', type: 'section', isSection: true },

  // Banking Liabilities
  { key: 'total_current_liabilities_fy_h', label: 'Deposits', type: 'currency' },
  { key: 'long_term_debt_fy_h', label: 'Borrowings', type: 'currency' },
  { key: 'other_current_liabilities_fy_h', label: 'Other Liabilities', type: 'currency' },
  { key: 'total_liabilities_fy_h', label: 'TOTAL LIABILITIES', type: 'currency', isTotal: true },

  // EQUITY SECTION HEADER
  { label: '--- EQUITY ---', type: 'section', isSection: true },

  { key: 'common_stock_fy_h', label: 'Equity Capital', type: 'currency' },
  { key: 'retained_earnings_fy_h', label: 'Reserves', type: 'currency' },
  { key: 'total_equity_fy_h', label: 'TOTAL EQUITY', type: 'currency', isTotal: true },

  // Check
  {
    label: 'TOTAL LIABILITIES & EQUITY',
    type: 'currency',
    isTotal: true,
    calculation: (dataMap) => {
      const totalLiabilities = dataMap.get('total_liabilities_fy_h') || [];
      const totalEquity = dataMap.get('total_equity_fy_h') || [];

      const maxLength = Math.max(totalLiabilities.length, totalEquity.length);
      const result = [];
      for (let i = 0; i < maxLength; i++) {
        const liabilitiesValue = totalLiabilities[i] || 0;
        const equityValue = totalEquity[i] || 0;
        result.push(liabilitiesValue + equityValue);
      }
      return result;
    }
  }
];

// Get metric configuration based on company type
export function getBalanceSheetMetricConfig(companyType: CompanyType): MetricConfig[] {
  return companyType === 'banking' ? BANKING_BALANCE_SHEET_METRICS : NON_BANKING_BALANCE_SHEET_METRICS;
}

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
  'deferred_income_current_fy_h',
  'total_non_current_liabilities_fy_h',
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
  return companyType === 'banking' ? BANKING_BALANCE_SHEET_METRICS : NON_BANKING_BALANCE_SHEET_METRICS;
}