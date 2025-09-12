
import { MetricConfig, CompanyType } from './types';

// Banking-specific metric configuration for Profit & Loss
export const BANKING_PROFIT_LOSS_METRICS: MetricConfig[] = [
  { key: 'total_revenue_fy_h', label: 'Revenue ', type: 'currency' },
  { key: 'interest_income_fy_h', label: 'Interest', type: 'currency' },
  {
    label: 'Expenses',
    type: 'currency',
    calculation: (dataMap) => {
      const minorityInterest = dataMap.get('minority_interest_exp_fy_h') || [];
      const otherOperExpense = dataMap.get('other_oper_expense_total_fy_h') || [];
      const interestExpense = dataMap.get('interest_expense_on_debt_fy_h') || [];
      
      const maxLength = Math.max(minorityInterest.length, otherOperExpense.length, interestExpense.length);
      const result = [];
      for (let i = 0; i < maxLength; i++) {
        const val1 = minorityInterest[i] || 0;
        const val2 = otherOperExpense[i] || 0;
        const val3 = interestExpense[i] || 0;
        result.push(val1 + val2 + val3);
      }
      return result;
    }
  },
  { key: 'interest_income_net_fy_h', label: 'Financing Profit', type: 'currency' },
  { key: 'net_interest_margin_fy_h', label: 'Financing Margin %', type: 'percentage' },
  { key: 'non_interest_income_fy_h', label: 'Other Income +', type: 'currency' },
  { key: 'depreciation_depletion_fy_h', label: 'Depreceition', type: 'currency' },
  { key: 'pretax_income_fy_h', label: 'Profit before tax', type: 'currency' },
  {
    label: 'Tax %',
    type: 'percentage',
    calculation: (dataMap) => {
      const pretaxIncome = dataMap.get('pretax_income_fy_h') || [];
      const incomeTax = dataMap.get('income_tax_fy_h') || [];
      
      const maxLength = Math.max(pretaxIncome.length, incomeTax.length);
      const result = [];
      for (let i = 0; i < maxLength; i++) {
        const pretax = pretaxIncome[i] || 0;
        const tax = Math.abs(incomeTax[i] || 0); // Tax is usually negative in the data
        if (pretax === 0) {
          result.push(0);
        } else {
          result.push((tax / pretax) * 100);
        }
      }
      return result;
    }
  },
  { key: 'net_income_fy_h', label: 'Net Profit +', type: 'currency' },
  { 
    key: 'earnings_per_share_basic_fy_h', 
    label: 'EPS in Rs', 
    type: 'number',
    formatValue: (value) => typeof value === 'number' ? Number(value.toFixed(2)) : value
  },
  { key: 'dividend_payout_ratio_fy_h', label: 'Dividend Payout %', type: 'percentage' },
];

// Non-banking metric configuration for Profit & Loss
export const NON_BANKING_PROFIT_LOSS_METRICS: MetricConfig[] = [
  { key: 'revenue_fy_h', label: 'Sales', type: 'currency' },
  { key: 'cost_of_goods_fy_h', label: 'Expenses', type: 'currency' },
  { key: 'gross_profit_fy_h', label: 'Operating Profit', type: 'currency' },
  { key: 'gross_margin_fy_h', label: 'OPM %', type: 'percentage' },
  { key: 'other_income_fy_h', label: 'Other Income', type: 'currency' },
  { key: 'interest_expense_fy_h', label: 'Interest', type: 'currency' },
  { key: 'depreciation_fy_h', label: 'Depreciation', type: 'currency' },
  { key: 'pretax_income_fy_h', label: 'Profit Before Tax', type: 'currency' },
  {
    label: 'Tax %',
    type: 'percentage',
    calculation: (dataMap) => {
      const pretaxIncome = dataMap.get('pretax_income_fy_h') || [];
      const incomeTax = dataMap.get('income_tax_fy_h') || [];
      
      const maxLength = Math.max(pretaxIncome.length, incomeTax.length);
      const result = [];
      for (let i = 0; i < maxLength; i++) {
        const pretax = pretaxIncome[i] || 0;
        const tax = Math.abs(incomeTax[i] || 0); // Tax is usually negative in the data
        if (pretax === 0) {
          result.push(0);
        } else {
          result.push((tax / pretax) * 100);
        }
      }
      return result;
    }
  },
  
  
  
  { key: 'net_income_fy_h', label: 'Net Profit', type: 'currency' },
  { 
    key: 'earnings_per_share_basic_fy_h', 
    label: 'EPS (Basic)', 
    type: 'number',
    formatValue: (value) => typeof value === 'number' ? Number(value.toFixed(2)) : value
  },
  { key: 'dividend_payout_ratio_fy_h', label: 'Dividend Payout %', type: 'percentage' },
];

// Get metric configuration based on company type
export function getProfitAndLossMetricConfig(companyType: CompanyType): MetricConfig[] {
  return companyType === 'banking' ? BANKING_PROFIT_LOSS_METRICS : NON_BANKING_PROFIT_LOSS_METRICS;
}
