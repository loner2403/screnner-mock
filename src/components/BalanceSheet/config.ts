// Balance sheet structure configuration with proper field mappings
import { MetricConfig, CompanyType } from './types';

// Simplified flat balance sheet structure for non-banking companies
export const NON_BANKING_BALANCE_SHEET_METRICS: MetricConfig[] = [
  // ASSETS SECTION HEADER
  { label: '--- ASSETS ---', type: 'section', isSection: true },
  
  // Non-current Assets
  { label: 'Non-current Assets', type: 'section', isSection: true, level: 1 },
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
  {
    label: 'Long-term investments',
    type: 'currency',
    calculation: (dataMap) => {
      const longTerm = dataMap.get('long_term_investments_fy_h') || [];
      const unconsolidated = dataMap.get('investments_in_unconcsolidate_fy_h') || [];
      const other = dataMap.get('other_investments_fy_h') || [];
      
      const maxLength = Math.max(longTerm.length, unconsolidated.length, other.length);
      const result = [];
      for (let i = 0; i < maxLength; i++) {
        const ltValue = longTerm[i] || 0;
        const uncValue = unconsolidated[i] || 0;
        const otherValue = other[i] || 0;
        result.push(ltValue + uncValue + otherValue);
      }
      return result;
    }
  },
  { key: 'deferred_tax_assests_fy_h', label: 'Deferred tax assets', type: 'currency' },
  { key: 'long_term_other_assets_total_fy_h', label: 'Other non-current assets', type: 'currency' },
  {
    label: 'Total Non-current Assets',
    type: 'currency',
    isSubTotal: true,
    calculation: (dataMap) => {
      const ppe = dataMap.get('ppe_total_net_fy_h') || [];
      const goodwill = dataMap.get('goodwill_fy_h') || [];
      const intangibles = dataMap.get('intangibles_net_fy_h') || [];
      const longTermInv = dataMap.get('long_term_investments_fy_h') || [];
      const unconsolidated = dataMap.get('investments_in_unconcsolidate_fy_h') || [];
      const otherInv = dataMap.get('other_investments_fy_h') || [];
      const deferredTax = dataMap.get('deferred_tax_assests_fy_h') || [];
      const otherAssets = dataMap.get('long_term_other_assets_total_fy_h') || [];
      
      const maxLength = Math.max(
        ppe.length, goodwill.length, intangibles.length,
        longTermInv.length, unconsolidated.length, otherInv.length,
        deferredTax.length, otherAssets.length
      );
      
      const result = [];
      for (let i = 0; i < maxLength; i++) {
        result.push(
          (ppe[i] || 0) +
          (goodwill[i] || 0) +
          (intangibles[i] || 0) +
          (longTermInv[i] || 0) +
          (unconsolidated[i] || 0) +
          (otherInv[i] || 0) +
          (deferredTax[i] || 0) +
          (otherAssets[i] || 0)
        );
      }
      return result;
    }
  },
  
  // Current Assets
  { label: 'Current Assets', type: 'section', isSection: true, level: 1 },
  { key: 'total_inventory_fy_h', label: 'Inventories', type: 'currency' },
  { key: 'total_receivables_net_fy_h', label: 'Trade & other receivables', type: 'currency' },
  { key: 'cash_n_equivalents_fy_h', label: 'Cash & equivalents', type: 'currency' },
  { key: 'short_term_investments_fy_h', label: 'Short-term investments', type: 'currency' },
  { key: 'other_current_assets_total_fy_h', label: 'Other current assets', type: 'currency' },
  { key: 'total_current_assets_fy_h', label: 'Total Current Assets', type: 'currency', isSubTotal: true },
  
  // Total Assets
  { key: 'total_assets_fy_h', label: 'TOTAL ASSETS', type: 'currency', isTotal: true },
  
  // LIABILITIES SECTION HEADER
  { label: '--- LIABILITIES ---', type: 'section', isSection: true },
  
  // Non-current Liabilities
  { label: 'Non-current Liabilities', type: 'section', isSection: true, level: 1 },
  { key: 'long_term_debt_fy_h', label: 'Long-term debt', type: 'currency' },
  { key: 'deferred_tax_liabilities_fy_h', label: 'Deferred tax liabilities', type: 'currency' },
  { key: 'other_liabilities_total_fy_h', label: 'Other non-current liabilities', type: 'currency' },
  { key: 'total_non_current_liabilities_fy_h', label: 'Total Non-current Liabilities', type: 'currency', isSubTotal: true },
  
  // Current Liabilities
  { label: 'Current Liabilities', type: 'section', isSection: true, level: 1 },
  {
    label: 'Short-term borrowings & current portion of LT debt',
    type: 'currency',
    calculation: (dataMap) => {
      const shortTermDebt = dataMap.get('short_term_debt_fy_h') || [];
      const shortTermExclCurrent = dataMap.get('short_term_debt_excl_current_port_fy_h') || [];
      const currentPortDebt = dataMap.get('current_port_debt_capital_leases_fy_h') || [];

      const maxLength = Math.max(shortTermDebt.length, shortTermExclCurrent.length, currentPortDebt.length);
      const result = [];
      for (let i = 0; i < maxLength; i++) {
        const shortTermValue = shortTermDebt[i] || 0;
        const shortTermExclValue = shortTermExclCurrent[i] || 0;
        const currentPortValue = currentPortDebt[i] || 0;

        // Use short_term_debt_fy_h if available, otherwise use the sum of the two components
        if (shortTermValue !== 0) {
          result.push(shortTermValue);
        } else {
          result.push(shortTermExclValue + currentPortValue);
        }
      }
      return result;
    }
  },
  { key: 'accounts_payable_fy_h', label: 'Trade payables', type: 'currency' },
  { key: 'deferred_income_current_fy_h', label: 'Deferred revenue (current)', type: 'currency' },
  {
    label: 'Other current liabilities (incl. taxes/dividends/accruals)',
    type: 'currency',
    calculation: (dataMap) => {
      const otherCurrentLiab = dataMap.get('other_current_liabilities_fy_h') || [];
      const incomeTaxPayable = dataMap.get('income_tax_payable_fy_h') || [];
      const dividendsPayable = dataMap.get('dividends_payable_fy_h') || [];

      const maxLength = Math.max(otherCurrentLiab.length, incomeTaxPayable.length, dividendsPayable.length);
      const result = [];
      for (let i = 0; i < maxLength; i++) {
        const otherValue = otherCurrentLiab[i] || 0;
        const taxValue = incomeTaxPayable[i] || 0;
        const dividendsValue = dividendsPayable[i] || 0;
        result.push(otherValue + taxValue + dividendsValue);
      }
      return result;
    }
  },
  {
    label: 'Subtotal – Current liabilities',
    type: 'currency',
    isSubTotal: true,
    calculation: (dataMap) => {
      const totalCurrentLiab = dataMap.get('total_current_liabilities_fy_h') || [];

      // If total_current_liabilities_fy_h is available, use it
      if (totalCurrentLiab.length > 0 && totalCurrentLiab.some(val => val !== 0)) {
        return totalCurrentLiab;
      }

      // Otherwise, calculate from components
      const shortTermDebt = dataMap.get('short_term_debt_fy_h') || [];
      const shortTermExclCurrent = dataMap.get('short_term_debt_excl_current_port_fy_h') || [];
      const currentPortDebt = dataMap.get('current_port_debt_capital_leases_fy_h') || [];
      const accountsPayable = dataMap.get('accounts_payable_fy_h') || [];
      const deferredIncome = dataMap.get('deferred_income_current_fy_h') || [];
      const otherCurrentLiab = dataMap.get('other_current_liabilities_fy_h') || [];
      const incomeTaxPayable = dataMap.get('income_tax_payable_fy_h') || [];
      const dividendsPayable = dataMap.get('dividends_payable_fy_h') || [];

      const maxLength = Math.max(
        shortTermDebt.length, shortTermExclCurrent.length, currentPortDebt.length,
        accountsPayable.length, deferredIncome.length, otherCurrentLiab.length,
        incomeTaxPayable.length, dividendsPayable.length
      );

      const result = [];
      for (let i = 0; i < maxLength; i++) {
        const shortTermValue = shortTermDebt[i] || 0;
        const shortTermExclValue = shortTermExclCurrent[i] || 0;
        const currentPortValue = currentPortDebt[i] || 0;
        const payableValue = accountsPayable[i] || 0;
        const deferredValue = deferredIncome[i] || 0;
        const otherValue = otherCurrentLiab[i] || 0;
        const taxValue = incomeTaxPayable[i] || 0;
        const dividendsValue = dividendsPayable[i] || 0;

        // Calculate short-term debt component
        const shortTermTotal = shortTermValue !== 0 ? shortTermValue : (shortTermExclValue + currentPortValue);

        result.push(shortTermTotal + payableValue + deferredValue + otherValue + taxValue + dividendsValue);
      }
      return result;
    }
  },

  // Total Liabilities
  {
    label: 'TOTAL LIABILITIES',
    type: 'currency',
    isTotal: true,
    calculation: (dataMap) => {
      const totalLiabilities = dataMap.get('total_liabilities_fy_h') || [];

      // If total_liabilities_fy_h is available, use it
      if (totalLiabilities.length > 0 && totalLiabilities.some(val => val !== 0)) {
        return totalLiabilities;
      }

      // Otherwise, calculate from components
      const totalCurrentLiab = dataMap.get('total_current_liabilities_fy_h') || [];
      const totalNonCurrentLiab = dataMap.get('total_non_current_liabilities_fy_h') || [];

      const maxLength = Math.max(totalCurrentLiab.length, totalNonCurrentLiab.length);
      const result = [];
      for (let i = 0; i < maxLength; i++) {
        const currentValue = totalCurrentLiab[i] || 0;
        const nonCurrentValue = totalNonCurrentLiab[i] || 0;
        result.push(currentValue + nonCurrentValue);
      }
      return result;
    }
  },
  
  // EQUITY SECTION HEADER
  { label: '--- EQUITY ---', type: 'section', isSection: true },

  {
    label: 'Equity share capital',
    type: 'currency',
    calculation: (dataMap) => {
      const commonStock = dataMap.get('common_stock_par_fy_h') || [];
      const preferredStock = dataMap.get('preferred_stock_carrying_value_fy_h') || [];

      const maxLength = Math.max(commonStock.length, preferredStock.length);
      const result = [];
      for (let i = 0; i < maxLength; i++) {
        const commonValue = commonStock[i] || 0;
        const preferredValue = preferredStock[i] || 0;
        // Use preferred stock only if non-zero, otherwise use common stock
        result.push(preferredValue !== 0 ? preferredValue : commonValue);
      }
      return result;
    }
  },
  {
    label: 'Reserves & surplus (incl. APIC, retained earnings, other equity, net of treasury)',
    type: 'currency',
    calculation: (dataMap) => {
      const paidInCapital = dataMap.get('paid_in_capital_fy_h') || [];
      const additionalPaidIn = dataMap.get('additional_paid_in_capital_fy_h') || [];
      const retainedEarnings = dataMap.get('retained_earnings_fy_h') || [];
      const otherCommonEquity = dataMap.get('other_common_equity_fy_h') || [];
      const treasuryStock = dataMap.get('treasury_stock_common_fy_h') || [];

      const maxLength = Math.max(
        paidInCapital.length, additionalPaidIn.length, retainedEarnings.length,
        otherCommonEquity.length, treasuryStock.length
      );

      const result = [];
      for (let i = 0; i < maxLength; i++) {
        const paidInValue = paidInCapital[i] || 0;
        const additionalValue = additionalPaidIn[i] || 0;
        const retainedValue = retainedEarnings[i] || 0;
        const otherValue = otherCommonEquity[i] || 0;
        const treasuryValue = treasuryStock[i] || 0;

        result.push(paidInValue + additionalValue + retainedValue + otherValue - Math.abs(treasuryValue));
      }
      return result;
    }
  },
  { key: 'shrhldrs_equity_fy_h', label: 'Equity attributable to owners', type: 'currency' },
  {
    label: 'TOTAL EQUITY',
    type: 'currency',
    isTotal: true,
    calculation: (dataMap) => {
      const shareholdersEquity = dataMap.get('shrhldrs_equity_fy_h') || [];
      const minorityInterest = dataMap.get('minority_interest_fy_h') || [];

      const maxLength = Math.max(shareholdersEquity.length, minorityInterest.length);
      const result = [];
      for (let i = 0; i < maxLength; i++) {
        const shareholdersValue = shareholdersEquity[i] || 0;
        const minorityValue = minorityInterest[i] || 0;
        result.push(shareholdersValue + minorityValue);
      }
      return result;
    }
  },
  
  // Check
  { key: 'total_liabilities_shrhldrs_equity_fy_h', label: 'TOTAL LIABILITIES & EQUITY', type: 'currency', isTotal: true }
];

// Banking-specific metrics (simplified version for banking companies)
export const BANKING_BALANCE_SHEET_METRICS: MetricConfig[] = [
  { key: 'common_stock_par_fy_h', label: 'Equity Capital', type: 'currency' },
  { key: 'common_equity_total_fy_h', label: 'Reserves', type: 'currency' },
  { key: 'total_deposits_fy_h', label: 'Deposits', type: 'currency' },
  { key: 'total_debt_fy_h', label: 'Borrowings', type: 'currency' },
  { key: 'other_liabilities_total_fy_h', label: 'Other Liabilities', type: 'currency' },
  { key: 'total_liabilities_fy_h', label: 'Total Liabilities', type: 'currency' },
  { key: 'ppe_total_net_fy_h', label: 'Fixed Assets', type: 'currency' },
  { key: 'long_term_investments_fy_h', label: 'Investments', type: 'currency' },
  { key: 'total_assets_fy_h', label: 'Total Assets', type: 'currency' }
];

// Get metric configuration based on company type
export function getBalanceSheetMetricConfig(companyType: CompanyType): MetricConfig[] {
  return companyType === 'banking' ? BANKING_BALANCE_SHEET_METRICS : NON_BANKING_BALANCE_SHEET_METRICS;
}


// Banking-specific metrics (simplified version for banking companies)
export const BANKING_METRICS: MetricConfig[] = [
  { key: 'common_stock_par_fy_h', label: 'Equity Capital', type: 'currency' },
  { key: 'common_equity_total_fy_h', label: 'Reserves', type: 'currency' },
  { key: 'total_deposits_fy_h', label: 'Deposits', type: 'currency' },
  { key: 'total_debt_fy_h', label: 'Borrowings', type: 'currency' },
  { key: 'other_liabilities_total_fy_h', label: 'Other Liabilities', type: 'currency' },
  { key: 'total_liabilities_fy_h', label: 'Total Liabilities', type: 'currency' },
  { key: 'ppe_total_net_fy_h', label: 'Fixed Assets', type: 'currency' },
  { key: 'long_term_investments_fy_h', label: 'Investments', type: 'currency' },
  { key: 'total_assets_fy_h', label: 'Total Assets', type: 'currency' }
];

// Non-banking companies use the simplified flat format
export const NON_BANKING_METRICS: MetricConfig[] = NON_BANKING_BALANCE_SHEET_METRICS;

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
  return companyType === 'banking' ? BANKING_METRICS : NON_BANKING_METRICS;
}