// Mapping Configurations for Banking and Non-Banking Companies
import { MappingConfig, FieldMapping, InsightSentryQuarterlyResponse } from '../../components/QuarterlyResults/types';

/**
 * Banking Company Mapping Configuration
 * Based on hdfc-bank-data-mapping.md - Enhanced with comprehensive annual and quarterly data
 */
export const BANKING_MAPPING_CONFIG: MappingConfig = {
  companyType: 'banking',
  sections: {
    'interest-income': {
      name: 'Interest Income & Expenses',
      fields: [
        {
          apiField: 'total_revenue_fy',
          historicalField: 'total_revenue_fy_h',
          quarterlyField: 'total_revenue_fq',
          quarterlyHistoricalField: 'total_revenue_fq_h',
          displayName: 'Total Revenue',
          unit: 'currency',
          category: 'profitability',
          section: 'interest-income',
          required: true
        },
        {
          apiField: 'interest_income_fy',
          historicalField: 'interest_income_fy_h',
          quarterlyField: 'interest_income_fq',
          quarterlyHistoricalField: 'interest_income_fq_h',
          displayName: 'Interest Income',
          unit: 'currency',
          category: 'profitability',
          section: 'interest-income',
          required: true
        },
        {
          apiField: 'interest_expense_fy',
          historicalField: 'interest_expense_fy_h',
          displayName: 'Interest Expense',
          unit: 'currency',
          category: 'profitability',
          section: 'interest-income',
          required: true
        },
        {
          apiField: 'interest_income_net_fy',
          historicalField: 'interest_income_net_fy_h',
          quarterlyField: 'interest_income_net_fq',
          quarterlyHistoricalField: 'interest_income_net_fq_h',
          displayName: 'Net Interest Income (Financing Profit)',
          unit: 'currency',
          category: 'profitability',
          section: 'interest-income',
          required: true
        },
        {
          apiField: 'net_interest_margin_fy',
          historicalField: 'net_interest_margin_fy_h',
          quarterlyField: 'net_interest_margin_fq',
          quarterlyHistoricalField: 'net_interest_margin_fq_h',
          displayName: 'Net Interest Margin (Financing Margin %)',
          unit: 'percentage',
          category: 'profitability',
          section: 'interest-income',
          required: true
        },
        {
          apiField: 'non_interest_income_fy',
          historicalField: 'non_interest_income_fy_h',
          quarterlyField: 'non_interest_income_fq',
          quarterlyHistoricalField: 'non_interest_income_fq_h',
          displayName: 'Other Income (Non-Interest)',
          unit: 'currency',
          category: 'profitability',
          section: 'interest-income',
          required: true
        }
      ],
      subsections: {
        'interest-sources': {
          name: 'Interest Income Sources',
          fields: [
            {
              apiField: 'interest_income_loans_fy',
              historicalField: 'interest_income_loans_fy_h',
              displayName: 'Interest from Loans',
              unit: 'currency',
              category: 'profitability',
              section: 'interest-income',
              subsection: 'interest-sources',
              required: false
            },
            {
              apiField: 'interest_income_government_securities_fy',
              historicalField: 'interest_income_government_securities_fy_h',
              displayName: 'Interest from Government Securities',
              unit: 'currency',
              category: 'profitability',
              section: 'interest-income',
              subsection: 'interest-sources',
              required: false
            },
            {
              apiField: 'interest_income_bank_deposits_fy',
              historicalField: 'interest_income_bank_deposits_fy_h',
              displayName: 'Interest from Bank Deposits',
              unit: 'currency',
              category: 'profitability',
              section: 'interest-income',
              subsection: 'interest-sources',
              required: false
            }
          ]
        },
        'interest-expenses': {
          name: 'Interest Expense Breakdown',
          fields: [
            {
              apiField: 'interest_expense_banks_deposits_fy',
              historicalField: 'interest_expense_banks_deposits_fy_h',
              displayName: 'Interest on Customer Deposits',
              unit: 'currency',
              category: 'profitability',
              section: 'interest-income',
              subsection: 'interest-expenses',
              required: false
            },
            {
              apiField: 'interest_expense_on_debt_fy',
              historicalField: 'interest_expense_on_debt_fy_h',
              displayName: 'Interest on Borrowings',
              unit: 'currency',
              category: 'profitability',
              section: 'interest-income',
              subsection: 'interest-expenses',
              required: false
            }
          ]
        }
      }
    },
    'deposits': {
      name: 'Deposits',
      fields: [
        {
          apiField: 'total_deposits_fy',
          historicalField: 'total_deposits_fy_h',
          quarterlyField: 'total_deposits_fq',
          quarterlyHistoricalField: 'total_deposits_fq_h',
          displayName: 'Total Deposits',
          unit: 'currency',
          category: 'liquidity',
          section: 'deposits',
          required: true
        },
        {
          apiField: 'demand_deposits_fy',
          historicalField: 'demand_deposits_fy_h',
          displayName: 'Demand Deposits (CASA)',
          unit: 'currency',
          category: 'liquidity',
          section: 'deposits',
          required: false
        },
        {
          apiField: 'savings_time_deposits_fy',
          historicalField: 'savings_time_deposits_fy_h',
          displayName: 'Time Deposits (Fixed/Term)',
          unit: 'currency',
          category: 'liquidity',
          section: 'deposits',
          required: false
        },
        {
          apiField: 'demand_deposits_total_deposits_fy',
          historicalField: 'demand_deposits_total_deposits_fy_h',
          displayName: 'CASA Ratio',
          unit: 'percentage',
          category: 'efficiency',
          section: 'deposits',
          required: false
        },
        {
          apiField: 'increase_in_deposits_fy',
          historicalField: 'increase_in_deposits_fy_h',
          displayName: 'Deposit Growth',
          unit: 'currency',
          category: 'liquidity',
          section: 'deposits',
          required: false
        }
      ]
    },
    'loans': {
      name: 'Loans & Advances',
      fields: [
        {
          apiField: 'loans_gross_fy',
          historicalField: 'loans_gross_fy_h',
          displayName: 'Gross Loans',
          unit: 'currency',
          category: 'liquidity',
          section: 'loans',
          required: true
        },
        {
          apiField: 'loans_net_fy',
          historicalField: 'loans_net_fy_h',
          displayName: 'Net Loans',
          unit: 'currency',
          category: 'liquidity',
          section: 'loans',
          required: true
        },
        {
          apiField: 'loan_loss_allowances_fy',
          historicalField: 'loan_loss_allowances_fy_h',
          displayName: 'Loan Loss Allowances',
          unit: 'currency',
          category: 'asset-quality',
          section: 'loans',
          required: true
        },
        {
          apiField: 'loan_loss_provision_fy',
          historicalField: 'loan_loss_provision_fy_h',
          quarterlyField: 'loan_loss_provision_fq',
          quarterlyHistoricalField: 'loan_loss_provision_fq_h',
          displayName: 'Loan Loss Provision',
          unit: 'currency',
          category: 'asset-quality',
          section: 'loans',
          required: true
        },
        {
          apiField: 'increase_in_loans_fy',
          historicalField: 'increase_in_loans_fy_h',
          displayName: 'Loan Disbursements (Growth)',
          unit: 'currency',
          category: 'liquidity',
          section: 'loans',
          required: false
        },
        {
          apiField: 'loans_net_total_deposits_fy',
          historicalField: 'loans_net_total_deposits_fy_h',
          displayName: 'Credit to Deposit Ratio',
          unit: 'percentage',
          category: 'efficiency',
          section: 'loans',
          required: false
        }
      ],
      subsections: {
        'loan-portfolio': {
          name: 'Loan Portfolio Breakdown',
          fields: [
            {
              apiField: 'loans_mortgage_fy',
              displayName: 'Real Estate Mortgage Loans',
              unit: 'currency',
              category: 'liquidity',
              section: 'loans',
              subsection: 'loan-portfolio',
              required: false
            },
            {
              apiField: 'loans_commercial_fy',
              displayName: 'Commercial Loans',
              unit: 'currency',
              category: 'liquidity',
              section: 'loans',
              subsection: 'loan-portfolio',
              required: false
            },
            {
              apiField: 'loans_consumer_fy',
              displayName: 'Consumer/Retail Loans',
              unit: 'currency',
              category: 'liquidity',
              section: 'loans',
              subsection: 'loan-portfolio',
              required: false
            },
            {
              apiField: 'loans_broker_fin_inst_fy',
              displayName: 'Loans to Financial Institutions',
              unit: 'currency',
              category: 'liquidity',
              section: 'loans',
              subsection: 'loan-portfolio',
              required: false
            }
          ]
        }
      }
    },
    'asset-quality': {
      name: 'Asset Quality',
      fields: [
        {
          apiField: 'nonperf_loans_fy',
          historicalField: 'nonperf_loans_fy_h',
          quarterlyField: 'nonperf_loans_fq',
          quarterlyHistoricalField: 'nonperf_loans_fq_h',
          displayName: 'Non-Performing Loans (Absolute)',
          unit: 'currency',
          category: 'asset-quality',
          section: 'asset-quality',
          required: true
        },
        {
          apiField: 'nonperf_loans_loans_gross_fy',
          historicalField: 'nonperf_loans_loans_gross_fy_h',
          quarterlyField: 'nonperf_loans_loans_gross_fq',
          quarterlyHistoricalField: 'nonperf_loans_loans_gross_fq_h',
          displayName: 'Gross NPA Ratio (%)',
          unit: 'percentage',
          category: 'asset-quality',
          section: 'asset-quality',
          required: true
        },
        {
          apiField: 'calculated_net_npa',
          displayName: 'Net NPA Ratio (%)',
          unit: 'percentage',
          category: 'asset-quality',
          section: 'asset-quality',
          required: false,
          historicalCalculation: (data: InsightSentryQuarterlyResponse) => {
            const grossNPL = data.nonperf_loans_fy_h;
            const provisions = data.loan_loss_allowances_fy_h;
            const netLoans = data.loans_net_fy_h;
            
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
                result.push(Math.max(0, netNPAPercent));
              } else {
                result.push(null as any);
              }
            }
            
            return result;
          }
        },
        {
          apiField: 'loan_loss_coverage_fy',
          historicalField: 'loan_loss_coverage_fy_h',
          displayName: 'Provision Coverage Ratio (%)',
          unit: 'percentage',
          category: 'asset-quality',
          section: 'asset-quality',
          required: false
        },
        {
          apiField: 'loan_losses_act_fy',
          displayName: 'Actual Loan Losses (Write-offs)',
          unit: 'currency',
          category: 'asset-quality',
          section: 'asset-quality',
          required: false
        }
      ],
      subsections: {
        'risk-metrics': {
          name: 'Additional Risk Metrics',
          fields: [
            {
              apiField: 'loan_loss_rsrv_total_assets_fy',
              displayName: 'Loan Loss Reserves to Total Assets',
              unit: 'percentage',
              category: 'asset-quality',
              section: 'asset-quality',
              subsection: 'risk-metrics',
              required: false
            },
            {
              apiField: 'loan_loss_rsrv_total_capital_fy',
              displayName: 'Loan Loss Reserves to Capital',
              unit: 'percentage',
              category: 'asset-quality',
              section: 'asset-quality',
              subsection: 'risk-metrics',
              required: false
            },
            {
              apiField: 'nonperf_loan_common_equity_fy',
              displayName: 'NPL to Common Equity',
              unit: 'percentage',
              category: 'asset-quality',
              section: 'asset-quality',
              subsection: 'risk-metrics',
              required: false
            }
          ]
        }
      }
    },
    'profitability': {
      name: 'Profitability & Performance',
      fields: [
        {
          apiField: 'total_oper_expense_fy',
          historicalField: 'total_oper_expense_fy_h',
          displayName: 'Total Operating Expenses',
          unit: 'currency',
          category: 'profitability',
          section: 'profitability',
          required: true
        },
        {
          apiField: 'non_interest_expense_fy',
          historicalField: 'non_interest_expense_fy_h',
          displayName: 'Non-Interest Expenses',
          unit: 'currency',
          category: 'profitability',
          section: 'profitability',
          required: true
        },
        {
          apiField: 'pretax_income_fy',
          historicalField: 'pretax_income_fy_h',
          displayName: 'Profit Before Tax',
          unit: 'currency',
          category: 'profitability',
          section: 'profitability',
          required: true
        },
        {
          apiField: 'tax_rate_fy',
          historicalField: 'tax_rate_fy_h',
          displayName: 'Effective Tax Rate',
          unit: 'percentage',
          category: 'profitability',
          section: 'profitability',
          required: false
        },
        {
          apiField: 'net_income_fy',
          historicalField: 'net_income_fy_h',
          quarterlyField: 'net_income_fq',
          quarterlyHistoricalField: 'net_income_fq_h',
          displayName: 'Net Profit (PAT)',
          unit: 'currency',
          category: 'profitability',
          section: 'profitability',
          required: true
        },
        {
          apiField: 'earnings_per_share_basic_fy',
          historicalField: 'earnings_per_share_basic_fy_h',
          quarterlyField: 'earnings_per_share_basic_fq',
          quarterlyHistoricalField: 'earnings_per_share_basic_fq_h',
          displayName: 'Earnings Per Share (Basic)',
          unit: 'currency',
          category: 'profitability',
          section: 'profitability',
          required: false
        },
        {
          apiField: 'dividend_payout_ratio_fy',
          historicalField: 'dividend_payout_ratio_fy_h',
          displayName: 'Dividend Payout Ratio',
          unit: 'percentage',
          category: 'profitability',
          section: 'profitability',
          required: false
        }
      ],
      subsections: {
        'key-ratios': {
          name: 'Key Banking Ratios',
          fields: [
            {
              apiField: 'return_on_assets_fy',
              historicalField: 'return_on_assets_fy_h',
              displayName: 'Return on Assets (ROA)',
              unit: 'percentage',
              category: 'profitability',
              section: 'profitability',
              subsection: 'key-ratios',
              required: false
            },
            {
              apiField: 'return_on_common_equity_fy',
              historicalField: 'return_on_common_equity_fy_h',
              displayName: 'Return on Equity (ROE)',
              unit: 'percentage',
              category: 'profitability',
              section: 'profitability',
              subsection: 'key-ratios',
              required: false
            },
            {
              apiField: 'efficiency_ratio_fy',
              historicalField: 'efficiency_ratio_fy_h',
              displayName: 'Cost to Income Ratio (Operating Efficiency)',
              unit: 'percentage',
              category: 'efficiency',
              section: 'profitability',
              subsection: 'key-ratios',
              required: false
            }
          ]
        },
        'fee-income': {
          name: 'Fee & Commission Income',
          fields: [
            {
              apiField: 'trust_commissions_income_fy',
              displayName: 'Trust & Fiduciary Income',
              unit: 'currency',
              category: 'profitability',
              section: 'profitability',
              subsection: 'fee-income',
              required: false
            },
            {
              apiField: 'underwriting_n_commissions_fy',
              displayName: 'Underwriting Commissions',
              unit: 'currency',
              category: 'profitability',
              section: 'profitability',
              subsection: 'fee-income',
              required: false
            },
            {
              apiField: 'trading_account_income_fy',
              displayName: 'Trading Income',
              unit: 'currency',
              category: 'profitability',
              section: 'profitability',
              subsection: 'fee-income',
              required: false
            }
          ]
        }
      }
    },
    'balance-sheet': {
      name: 'Balance Sheet',
      fields: [
        {
          apiField: 'total_assets_fy',
          historicalField: 'total_assets_fy_h',
          displayName: 'Total Assets',
          unit: 'currency',
          category: 'liquidity',
          section: 'balance-sheet',
          required: true
        },
        {
          apiField: 'total_liabilities_fy',
          historicalField: 'total_liabilities_fy_h',
          displayName: 'Total Liabilities',
          unit: 'currency',
          category: 'solvency',
          section: 'balance-sheet',
          required: true
        },
        {
          apiField: 'total_equity_fy',
          historicalField: 'total_equity_fy_h',
          displayName: 'Total Shareholders Equity',
          unit: 'currency',
          category: 'solvency',
          section: 'balance-sheet',
          required: true
        },
        {
          apiField: 'total_debt_fy',
          historicalField: 'total_debt_fy_h',
          displayName: 'Total Borrowings',
          unit: 'currency',
          category: 'solvency',
          section: 'balance-sheet',
          required: false
        }
      ],
      subsections: {
        'equity-capital': {
          name: 'Shareholders Equity',
          fields: [
            {
              apiField: 'common_stock_par_fy',
              historicalField: 'common_stock_par_fy_h',
              displayName: 'Equity Capital (Share Capital)',
              unit: 'currency',
              category: 'solvency',
              section: 'balance-sheet',
              subsection: 'equity-capital',
              required: false
            },
            {
              apiField: 'retained_earnings_fy',
              historicalField: 'retained_earnings_fy_h',
              displayName: 'Reserves & Retained Earnings',
              unit: 'currency',
              category: 'solvency',
              section: 'balance-sheet',
              subsection: 'equity-capital',
              required: false
            }
          ]
        },
        'borrowings': {
          name: 'Borrowings Breakdown',
          fields: [
            {
              apiField: 'short_term_debt_fy',
              historicalField: 'short_term_debt_fy_h',
              displayName: 'Short-term Borrowings',
              unit: 'currency',
              category: 'solvency',
              section: 'balance-sheet',
              subsection: 'borrowings',
              required: false
            },
            {
              apiField: 'long_term_debt_fy',
              historicalField: 'long_term_debt_fy_h',
              displayName: 'Long-term Borrowings',
              unit: 'currency',
              category: 'solvency',
              section: 'balance-sheet',
              subsection: 'borrowings',
              required: false
            }
          ]
        },
        'investments': {
          name: 'Investment Portfolio',
          fields: [
            {
              apiField: 'long_term_investments_fy',
              historicalField: 'long_term_investments_fy_h',
              displayName: 'Total Investments',
              unit: 'currency',
              category: 'efficiency',
              section: 'balance-sheet',
              subsection: 'investments',
              required: false
            },
            {
              apiField: 'treasury_securities_fy',
              historicalField: 'treasury_securities_fy_h',
              displayName: 'Government Securities',
              unit: 'currency',
              category: 'efficiency',
              section: 'balance-sheet',
              subsection: 'investments',
              required: false
            },
            {
              apiField: 'equity_securities_investment_fy',
              historicalField: 'equity_securities_investment_fy_h',
              displayName: 'Equity Securities',
              unit: 'currency',
              category: 'efficiency',
              section: 'balance-sheet',
              subsection: 'investments',
              required: false
            },
            {
              apiField: 'trading_account_securities_fy',
              displayName: 'Trading Securities',
              unit: 'currency',
              category: 'efficiency',
              section: 'balance-sheet',
              subsection: 'investments',
              required: false
            }
          ]
        },
        'other-assets': {
          name: 'Other Assets',
          fields: [
            {
              apiField: 'ppe_total_net_fy',
              historicalField: 'ppe_total_net_fy_h',
              displayName: 'Fixed Assets (PP&E)',
              unit: 'currency',
              category: 'efficiency',
              section: 'balance-sheet',
              subsection: 'other-assets',
              required: false
            },
            {
              apiField: 'other_assets_fy',
              historicalField: 'other_assets_fy_h',
              displayName: 'Other Assets',
              unit: 'currency',
              category: 'efficiency',
              section: 'balance-sheet',
              subsection: 'other-assets',
              required: false
            }
          ]
        }
      }
    },
    'cash-flow': {
      name: 'Cash Flow Statement',
      fields: [
        {
          apiField: 'cash_f_operating_activities_fy',
          historicalField: 'cash_f_operating_activities_fy_h',
          displayName: 'Cash from Operating Activities',
          unit: 'currency',
          category: 'liquidity',
          section: 'cash-flow',
          required: true
        },
        {
          apiField: 'cash_f_investing_activities_fy',
          historicalField: 'cash_f_investing_activities_fy_h',
          displayName: 'Cash from Investing Activities',
          unit: 'currency',
          category: 'liquidity',
          section: 'cash-flow',
          required: false
        },
        {
          apiField: 'cash_f_financing_activities_fy',
          historicalField: 'cash_f_financing_activities_fy_h',
          displayName: 'Cash from Financing Activities',
          unit: 'currency',
          category: 'liquidity',
          section: 'cash-flow',
          required: false
        },
        {
          apiField: 'free_cash_flow_fy',
          historicalField: 'free_cash_flow_fy_h',
          displayName: 'Net Cash Flow',
          unit: 'currency',
          category: 'liquidity',
          section: 'cash-flow',
          required: false
        }
      ]
    }
  }
};

/**
 * Non-Banking Company Mapping Configuration
 * Based on historical_data_mapping.md - Enhanced with comprehensive annual and quarterly data
 * Covers all major financial metrics with up to 20 years of annual data and 32 quarters of quarterly data
 */
export const NON_BANKING_MAPPING_CONFIG: MappingConfig = {
  companyType: 'non-banking',
  sections: {
    'profit-loss': {
      name: 'Profit & Loss Statement',
      fields: [
        {
          apiField: 'revenue_fy',
          historicalField: 'revenue_fy_h',
          quarterlyField: 'revenue_fq',
          quarterlyHistoricalField: 'revenue_fq_h',
          displayName: 'Sales/Revenue',
          unit: 'currency',
          category: 'profitability',
          section: 'profit-loss',
          required: true
        },
        {
          apiField: 'total_revenue_ttm',
          historicalField: 'total_revenue_fy_h',
          displayName: 'Total Revenue (TTM)',
          unit: 'currency',
          category: 'profitability',
          section: 'profit-loss',
          required: false
        },
        {
          apiField: 'cost_of_goods_fy',
          historicalField: 'cost_of_goods_fy_h',
          displayName: 'Cost of Goods Sold',
          unit: 'currency',
          category: 'profitability',
          section: 'profit-loss',
          required: false
        },
        {
          apiField: 'gross_profit_fy',
          historicalField: 'gross_profit_fy_h',
          quarterlyField: 'gross_profit_fq',
          quarterlyHistoricalField: 'gross_profit_fq_h',
          displayName: 'Gross Profit',
          unit: 'currency',
          category: 'profitability',
          section: 'profit-loss',
          required: true
        },
        {
          apiField: 'gross_margin_fy',
          historicalField: 'gross_margin_fy_h',
          displayName: 'Gross Margin (%)',
          unit: 'percentage',
          category: 'profitability',
          section: 'profit-loss',
          required: false
        },
        {
          apiField: 'operating_expenses_fy',
          historicalField: 'operating_expenses_fy_h',
          displayName: 'Operating Expenses (Total)',
          unit: 'currency',
          category: 'profitability',
          section: 'profit-loss',
          required: true
        },
        {
          apiField: 'sell_gen_admin_exp_total_fy',
          historicalField: 'sell_gen_admin_exp_total_fy_h',
          displayName: 'SG&A Expenses',
          unit: 'currency',
          category: 'profitability',
          section: 'profit-loss',
          required: false
        },
        {
          apiField: 'oper_income_fy',
          historicalField: 'oper_income_fy_h',
          quarterlyField: 'oper_income_fq',
          quarterlyHistoricalField: 'oper_income_fq_h',
          displayName: 'Operating Profit',
          unit: 'currency',
          category: 'profitability',
          section: 'profit-loss',
          required: true
        },
        {
          apiField: 'operating_margin_fy',
          historicalField: 'operating_margin_fy_h',
          displayName: 'Operating Margin (%)',
          unit: 'percentage',
          category: 'profitability',
          section: 'profit-loss',
          required: false
        },
        {
          apiField: 'non_oper_income_fy',
          historicalField: 'non_oper_income_fy_h',
          quarterlyField: 'non_oper_income_fq',
          quarterlyHistoricalField: 'non_oper_income_fq_h',
          displayName: 'Other Income',
          unit: 'currency',
          category: 'profitability',
          section: 'profit-loss',
          required: false
        },
        {
          apiField: 'non_oper_interest_income_fy',
          historicalField: 'non_oper_interest_income_fy_h',
          displayName: 'Interest Income',
          unit: 'currency',
          category: 'profitability',
          section: 'profit-loss',
          required: false
        },
        {
          apiField: 'depreciation_fy',
          historicalField: 'depreciation_fy_h',
          displayName: 'Depreciation',
          unit: 'currency',
          category: 'profitability',
          section: 'profit-loss',
          required: false
        },
        {
          apiField: 'ebit_fy',
          historicalField: 'ebit_fy_h',
          displayName: 'EBIT',
          unit: 'currency',
          category: 'profitability',
          section: 'profit-loss',
          required: false
        },
        {
          apiField: 'ebitda_fy',
          historicalField: 'ebitda_fy_h',
          quarterlyField: 'ebitda_fq',
          quarterlyHistoricalField: 'ebitda_fq_h',
          displayName: 'EBITDA',
          unit: 'currency',
          category: 'profitability',
          section: 'profit-loss',
          required: true
        },
        {
          apiField: 'ebitda_margin_fy',
          historicalField: 'ebitda_margin_fy_h',
          quarterlyField: 'ebitda_margin_fq',
          quarterlyHistoricalField: 'ebitda_margin_fq_h',
          displayName: 'EBITDA Margin (%)',
          unit: 'percentage',
          category: 'profitability',
          section: 'profit-loss',
          required: false
        },
        {
          apiField: 'pretax_income_fy',
          historicalField: 'pretax_income_fy_h',
          displayName: 'Profit Before Tax',
          unit: 'currency',
          category: 'profitability',
          section: 'profit-loss',
          required: true
        },
        {
          apiField: 'pre_tax_margin_fy',
          historicalField: 'pre_tax_margin_fy_h',
          displayName: 'Pre-tax Margin (%)',
          unit: 'percentage',
          category: 'profitability',
          section: 'profit-loss',
          required: false
        },
        {
          apiField: 'income_tax_fy',
          historicalField: 'income_tax_fy_h',
          displayName: 'Tax',
          unit: 'currency',
          category: 'profitability',
          section: 'profit-loss',
          required: false
        },
        {
          apiField: 'net_income_fy',
          historicalField: 'net_income_fy_h',
          quarterlyField: 'net_income_fq',
          quarterlyHistoricalField: 'net_income_bef_disc_oper_fq_h',
          displayName: 'Net Profit',
          unit: 'currency',
          category: 'profitability',
          section: 'profit-loss',
          required: true
        },
        {
          apiField: 'net_margin_fy',
          historicalField: 'net_margin_fy_h',
          quarterlyField: 'net_margin_fq',
          quarterlyHistoricalField: 'net_margin_fq_h',
          displayName: 'Net Margin (%)',
          unit: 'percentage',
          category: 'profitability',
          section: 'profit-loss',
          required: false
        },
        {
          apiField: 'earnings_per_share_basic_fy',
          historicalField: 'earnings_per_share_basic_fy_h',
          quarterlyField: 'earnings_per_share_basic_fq',
          quarterlyHistoricalField: 'earnings_per_share_basic_fq_h',
          displayName: 'EPS (Basic)',
          unit: 'currency',
          category: 'profitability',
          section: 'profit-loss',
          required: false
        },
        {
          apiField: 'dividend_payout_ratio_fy',
          historicalField: 'dividend_payout_ratio_fy_h',
          displayName: 'Dividend Payout Ratio (%)',
          unit: 'percentage',
          category: 'profitability',
          section: 'profit-loss',
          required: false
        },
        {
          apiField: 'calculated_gross_margin',
          displayName: 'Calculated Gross Margin (%)',
          unit: 'percentage',
          category: 'profitability',
          section: 'profit-loss',
          required: false,
          calculation: (data: InsightSentryQuarterlyResponse) => {
            const revenue = data.revenue_fy;
            const grossProfitHistory = data.gross_profit_fy_h;
            if (revenue && grossProfitHistory && grossProfitHistory.length > 0 && revenue !== 0) {
              const latestGrossProfit = grossProfitHistory[0]; // Most recent value
              if (latestGrossProfit !== null) {
                return (latestGrossProfit / revenue) * 100;
              }
            }
            return null;
          },
          historicalCalculation: (data: InsightSentryQuarterlyResponse) => {
            const revenue = data.revenue_fy_h;
            const grossProfit = data.gross_profit_fy_h;
            
            if (!revenue || !grossProfit) {
              return null;
            }
            
            const length = Math.min(revenue.length, grossProfit.length);
            const result: number[] = [];
            
            for (let i = 0; i < length; i++) {
              const rev = revenue[i];
              const gross = grossProfit[i];
              
              if (rev !== null && gross !== null && rev !== 0) {
                result.push((gross / rev) * 100);
              } else {
                result.push(null as any);
              }
            }
            
            return result;
          }
        }
      ],
      subsections: {
        'expense-breakdown': {
          name: 'Expense Breakdown',
          fields: [
            {
              apiField: 'cost_of_goods_fy',
              historicalField: 'cost_of_goods_fy_h',
              displayName: 'Cost of Goods Sold',
              unit: 'currency',
              category: 'profitability',
              section: 'profit-loss',
              subsection: 'expense-breakdown',
              required: false
            },
            {
              apiField: 'sell_gen_admin_exp_total_fy',
              historicalField: 'sell_gen_admin_exp_total_fy_h',
              displayName: 'Selling, General & Administrative',
              unit: 'currency',
              category: 'profitability',
              section: 'profit-loss',
              subsection: 'expense-breakdown',
              required: false
            },
            {
              apiField: 'depreciation_fy',
              historicalField: 'depreciation_fy_h',
              displayName: 'Depreciation & Amortization',
              unit: 'currency',
              category: 'profitability',
              section: 'profit-loss',
              subsection: 'expense-breakdown',
              required: false
            }
          ]
        },
        'profitability-metrics': {
          name: 'Profitability Metrics',
          fields: [
            {
              apiField: 'gross_margin_fy',
              historicalField: 'gross_margin_fy_h',
              displayName: 'Gross Profit Margin (%)',
              unit: 'percentage',
              category: 'profitability',
              section: 'profit-loss',
              subsection: 'profitability-metrics',
              required: false
            },
            {
              apiField: 'operating_margin_fy',
              historicalField: 'operating_margin_fy_h',
              displayName: 'Operating Profit Margin (%)',
              unit: 'percentage',
              category: 'profitability',
              section: 'profit-loss',
              subsection: 'profitability-metrics',
              required: false
            },
            {
              apiField: 'ebitda_margin_fy',
              historicalField: 'ebitda_margin_fy_h',
              quarterlyField: 'ebitda_margin_fq',
              quarterlyHistoricalField: 'ebitda_margin_fq_h',
              displayName: 'EBITDA Margin (%)',
              unit: 'percentage',
              category: 'profitability',
              section: 'profit-loss',
              subsection: 'profitability-metrics',
              required: false
            },
            {
              apiField: 'pre_tax_margin_fy',
              historicalField: 'pre_tax_margin_fy_h',
              displayName: 'Pre-tax Profit Margin (%)',
              unit: 'percentage',
              category: 'profitability',
              section: 'profit-loss',
              subsection: 'profitability-metrics',
              required: false
            },
            {
              apiField: 'net_margin_fy',
              historicalField: 'net_margin_fy_h',
              quarterlyField: 'net_margin_fq',
              quarterlyHistoricalField: 'net_margin_fq_h',
              displayName: 'Net Profit Margin (%)',
              unit: 'percentage',
              category: 'profitability',
              section: 'profit-loss',
              subsection: 'profitability-metrics',
              required: false
            }
          ]
        }
      }
    },
    'balance-sheet': {
      name: 'Balance Sheet',
      fields: [
        {
          apiField: 'total_assets_fy',
          historicalField: 'total_assets_fy_h',
          quarterlyField: 'total_assets_fq',
          quarterlyHistoricalField: 'total_assets_fq_h',
          displayName: 'Total Assets',
          unit: 'currency',
          category: 'liquidity',
          section: 'balance-sheet',
          required: true
        },
        {
          apiField: 'total_liabilities_fy',
          historicalField: 'total_liabilities_fy_h',
          quarterlyField: 'total_liabilities_fq',
          quarterlyHistoricalField: 'total_liabilities_fq_h',
          displayName: 'Total Liabilities',
          unit: 'currency',
          category: 'solvency',
          section: 'balance-sheet',
          required: true
        },
        {
          apiField: 'total_equity_fy',
          historicalField: 'total_equity_fy_h',
          quarterlyField: 'total_equity_fq',
          quarterlyHistoricalField: 'total_equity_fq_h',
          displayName: 'Total Shareholders Equity',
          unit: 'currency',
          category: 'solvency',
          section: 'balance-sheet',
          required: true
        },
        {
          apiField: 'total_debt_fy',
          historicalField: 'total_debt_fy_h',
          displayName: 'Total Borrowings/Debt',
          unit: 'currency',
          category: 'solvency',
          section: 'balance-sheet',
          required: false
        },
        {
          apiField: 'cash_n_equivalents_fy',
          historicalField: 'cash_n_equivalents_fy_h',
          displayName: 'Cash & Cash Equivalents',
          unit: 'currency',
          category: 'liquidity',
          section: 'balance-sheet',
          required: false
        },
        {
          apiField: 'total_inventory_fy',
          historicalField: 'total_inventory_fy_h',
          displayName: 'Total Inventory',
          unit: 'currency',
          category: 'efficiency',
          section: 'balance-sheet',
          required: false
        },
        {
          apiField: 'calculated_working_capital',
          displayName: 'Working Capital (Estimated)',
          unit: 'currency',
          category: 'liquidity',
          section: 'balance-sheet',
          required: false,
          calculation: (data: InsightSentryQuarterlyResponse) => {
            // Working Capital = Current Assets - Current Liabilities
            // We'll use Cash + Inventory as proxy for current assets
            const cashHistory = data.cash_n_equivalents_fy_h;
            const inventoryHistory = data.total_inventory_fy_h;
            const currentLiabilitiesHistory = data.total_current_liabilities_fy_h;
            
            if (cashHistory && inventoryHistory && currentLiabilitiesHistory && 
                cashHistory.length > 0 && inventoryHistory.length > 0 && currentLiabilitiesHistory.length > 0) {
              const latestCash = cashHistory[0];
              const latestInventory = inventoryHistory[0];
              const latestCurrentLiabilities = currentLiabilitiesHistory[0];
              
              if (latestCash !== null && latestInventory !== null && latestCurrentLiabilities !== null) {
                return (latestCash + latestInventory) - latestCurrentLiabilities;
              }
            }
            return null;
          },
          historicalCalculation: (data: InsightSentryQuarterlyResponse) => {
            const cash = data.cash_n_equivalents_fy_h;
            const inventory = data.total_inventory_fy_h;
            const currentLiabilities = data.total_current_liabilities_fy_h;
            
            if (!cash || !inventory || !currentLiabilities) {
              return null;
            }
            
            const length = Math.min(cash.length, inventory.length, currentLiabilities.length);
            const result: number[] = [];
            
            for (let i = 0; i < length; i++) {
              const c = cash[i];
              const inv = inventory[i];
              const cl = currentLiabilities[i];
              
              if (c !== null && inv !== null && cl !== null) {
                result.push((c + inv) - cl);
              } else {
                result.push(null as any);
              }
            }
            
            return result;
          }
        }
      ],
      subsections: {
        'equity-capital': {
          name: 'Shareholders Equity',
          fields: [
            {
              apiField: 'common_stock_par_fy',
              historicalField: 'common_stock_par_fy_h',
              displayName: 'Equity Capital (Share Capital)',
              unit: 'currency',
              category: 'solvency',
              section: 'balance-sheet',
              subsection: 'equity-capital',
              required: false
            },
            {
              apiField: 'retained_earnings_fy',
              historicalField: 'retained_earnings_fy_h',
              displayName: 'Reserves & Retained Earnings',
              unit: 'currency',
              category: 'solvency',
              section: 'balance-sheet',
              subsection: 'equity-capital',
              required: false
            }
          ]
        },
        'debt-breakdown': {
          name: 'Borrowings & Liabilities',
          fields: [
            {
              apiField: 'long_term_debt_fy',
              historicalField: 'long_term_debt_fy_h',
              displayName: 'Long-term Debt',
              unit: 'currency',
              category: 'solvency',
              section: 'balance-sheet',
              subsection: 'debt-breakdown',
              required: false
            },
            {
              apiField: 'total_current_liabilities_fy',
              historicalField: 'total_current_liabilities_fy_h',
              displayName: 'Current Liabilities',
              unit: 'currency',
              category: 'solvency',
              section: 'balance-sheet',
              subsection: 'debt-breakdown',
              required: false
            },
            {
              apiField: 'total_debt_fy',
              historicalField: 'total_debt_fy_h',
              displayName: 'Total Borrowings',
              unit: 'currency',
              category: 'solvency',
              section: 'balance-sheet',
              subsection: 'debt-breakdown',
              required: false
            }
          ]
        },
        'fixed-assets': {
          name: 'Fixed Assets & Investments',
          fields: [
            {
              apiField: 'ppe_total_net_fy',
              historicalField: 'ppe_total_net_fy_h',
              displayName: 'Property, Plant & Equipment (Net)',
              unit: 'currency',
              category: 'efficiency',
              section: 'balance-sheet',
              subsection: 'fixed-assets',
              required: false
            },
            {
              apiField: 'long_term_investments_fy',
              historicalField: 'long_term_investments_fy_h',
              displayName: 'Long-term Investments',
              unit: 'currency',
              category: 'efficiency',
              section: 'balance-sheet',
              subsection: 'fixed-assets',
              required: false
            }
          ]
        },
        'current-assets': {
          name: 'Current Assets',
          fields: [
            {
              apiField: 'cash_n_equivalents_fy',
              historicalField: 'cash_n_equivalents_fy_h',
              displayName: 'Cash & Cash Equivalents',
              unit: 'currency',
              category: 'liquidity',
              section: 'balance-sheet',
              subsection: 'current-assets',
              required: false
            },
            {
              apiField: 'total_inventory_fy',
              historicalField: 'total_inventory_fy_h',
              displayName: 'Total Inventory',
              unit: 'currency',
              category: 'efficiency',
              section: 'balance-sheet',
              subsection: 'current-assets',
              required: false
            }
          ]
        },
        'other-assets': {
          name: 'Other Assets',
          fields: [
            {
              apiField: 'other_assets_incl_intang_fy',
              historicalField: 'long_term_other_assets_total_fy_h',
              displayName: 'Other Assets (including Intangibles)',
              unit: 'currency',
              category: 'efficiency',
              section: 'balance-sheet',
              subsection: 'other-assets',
              required: false
            }
          ]
        }
      }
    },
    'cash-flow': {
      name: 'Cash Flow Statement',
      fields: [
        {
          apiField: 'cash_f_operating_activities_fy',
          historicalField: 'cash_f_operating_activities_fy_h',
          quarterlyField: 'cash_f_operating_activities_fq',
          quarterlyHistoricalField: 'cash_f_operating_activities_fq_h',
          displayName: 'Cash from Operating Activities',
          unit: 'currency',
          category: 'liquidity',
          section: 'cash-flow',
          required: true
        },
        {
          apiField: 'cash_f_investing_activities_fy',
          historicalField: 'cash_f_investing_activities_fy_h',
          displayName: 'Cash from Investing Activities',
          unit: 'currency',
          category: 'liquidity',
          section: 'cash-flow',
          required: false
        },
        {
          apiField: 'cash_f_financing_activities_fy',
          historicalField: 'cash_f_financing_activities_fy_h',
          displayName: 'Cash from Financing Activities',
          unit: 'currency',
          category: 'liquidity',
          section: 'cash-flow',
          required: false
        },
        {
          apiField: 'free_cash_flow_fy',
          historicalField: 'free_cash_flow_fy_h',
          displayName: 'Free Cash Flow',
          unit: 'currency',
          category: 'liquidity',
          section: 'cash-flow',
          required: false
        },
        {
          apiField: 'capital_expenditures_fy',
          historicalField: 'capital_expenditures_fy_h',
          displayName: 'Capital Expenditure (CapEx)',
          unit: 'currency',
          category: 'efficiency',
          section: 'cash-flow',
          required: false
        },
        {
          apiField: 'common_dividends_cash_flow_fy',
          historicalField: 'common_dividends_cash_flow_fy_h',
          displayName: 'Dividends Paid',
          unit: 'currency',
          category: 'liquidity',
          section: 'cash-flow',
          required: false
        }
      ],
      subsections: {
        'operating-cash-flow': {
          name: 'Operating Cash Flow Components',
          fields: [
            {
              apiField: 'cash_f_operating_activities_fy',
              historicalField: 'cash_f_operating_activities_fy_h',
              quarterlyField: 'cash_f_operating_activities_fq',
              quarterlyHistoricalField: 'cash_f_operating_activities_fq_h',
              displayName: 'Net Cash from Operations',
              unit: 'currency',
              category: 'liquidity',
              section: 'cash-flow',
              subsection: 'operating-cash-flow',
              required: false
            }
          ]
        },
        'investing-cash-flow': {
          name: 'Investing Cash Flow Components',
          fields: [
            {
              apiField: 'capital_expenditures_fy',
              historicalField: 'capital_expenditures_fy_h',
              displayName: 'Capital Expenditures',
              unit: 'currency',
              category: 'efficiency',
              section: 'cash-flow',
              subsection: 'investing-cash-flow',
              required: false
            },
            {
              apiField: 'cash_f_investing_activities_fy',
              historicalField: 'cash_f_investing_activities_fy_h',
              displayName: 'Net Cash from Investing',
              unit: 'currency',
              category: 'liquidity',
              section: 'cash-flow',
              subsection: 'investing-cash-flow',
              required: false
            }
          ]
        },
        'financing-cash-flow': {
          name: 'Financing Cash Flow Components',
          fields: [
            {
              apiField: 'common_dividends_cash_flow_fy',
              historicalField: 'common_dividends_cash_flow_fy_h',
              displayName: 'Dividends Paid',
              unit: 'currency',
              category: 'liquidity',
              section: 'cash-flow',
              subsection: 'financing-cash-flow',
              required: false
            },
            {
              apiField: 'cash_f_financing_activities_fy',
              historicalField: 'cash_f_financing_activities_fy_h',
              displayName: 'Net Cash from Financing',
              unit: 'currency',
              category: 'liquidity',
              section: 'cash-flow',
              subsection: 'financing-cash-flow',
              required: false
            }
          ]
        },
        'free-cash-flow': {
          name: 'Free Cash Flow Analysis',
          fields: [
            {
              apiField: 'free_cash_flow_fy',
              historicalField: 'free_cash_flow_fy_h',
              displayName: 'Free Cash Flow',
              unit: 'currency',
              category: 'liquidity',
              section: 'cash-flow',
              subsection: 'free-cash-flow',
              required: false
            }
          ]
        }
      }
    },
    'key-ratios': {
      name: 'Key Financial Ratios',
      fields: [
        {
          apiField: 'return_on_equity_fy',
          historicalField: 'return_on_equity_fy_h',
          displayName: 'Return on Equity (ROE %)',
          unit: 'percentage',
          category: 'profitability',
          section: 'key-ratios',
          required: false
        },
        {
          apiField: 'return_on_assets_fy',
          historicalField: 'return_on_assets_fy_h',
          displayName: 'Return on Assets (ROA %)',
          unit: 'percentage',
          category: 'profitability',
          section: 'key-ratios',
          required: false
        },
        {
          apiField: 'debt_to_equity_fy',
          historicalField: 'debt_to_equity_fy_h',
          displayName: 'Debt to Equity Ratio',
          unit: 'ratio',
          category: 'solvency',
          section: 'key-ratios',
          required: false
        },
        {
          apiField: 'debt_to_asset_fy',
          historicalField: 'debt_to_asset_fy_h',
          displayName: 'Debt to Assets Ratio',
          unit: 'ratio',
          category: 'solvency',
          section: 'key-ratios',
          required: false
        },
        {
          apiField: 'current_ratio_fy',
          historicalField: 'current_ratio_fy_h',
          displayName: 'Current Ratio',
          unit: 'ratio',
          category: 'liquidity',
          section: 'key-ratios',
          required: false
        },
        {
          apiField: 'quick_ratio_fy',
          historicalField: 'quick_ratio_fy_h',
          displayName: 'Quick Ratio',
          unit: 'ratio',
          category: 'liquidity',
          section: 'key-ratios',
          required: false
        },
        {
          apiField: 'asset_turnover_fy',
          historicalField: 'asset_turnover_fy_h',
          displayName: 'Asset Turnover Ratio',
          unit: 'ratio',
          category: 'efficiency',
          section: 'key-ratios',
          required: false
        },
        {
          apiField: 'invent_turnover_fy',
          historicalField: 'invent_turnover_fy_h',
          displayName: 'Inventory Turnover Ratio',
          unit: 'ratio',
          category: 'efficiency',
          section: 'key-ratios',
          required: false
        },
        {
          apiField: 'book_value_per_share_fy',
          historicalField: 'book_value_per_share_fy_h',
          displayName: 'Book Value per Share',
          unit: 'currency',
          category: 'solvency',
          section: 'key-ratios',
          required: false
        }
      ],
      subsections: {
        'profitability-ratios': {
          name: 'Profitability Ratios',
          fields: [
            {
              apiField: 'return_on_equity_fy',
              historicalField: 'return_on_equity_fy_h',
              displayName: 'Return on Equity (ROE %)',
              unit: 'percentage',
              category: 'profitability',
              section: 'key-ratios',
              subsection: 'profitability-ratios',
              required: false
            },
            {
              apiField: 'return_on_assets_fy',
              historicalField: 'return_on_assets_fy_h',
              displayName: 'Return on Assets (ROA %)',
              unit: 'percentage',
              category: 'profitability',
              section: 'key-ratios',
              subsection: 'profitability-ratios',
              required: false
            },
            {
              apiField: 'gross_margin_fy',
              historicalField: 'gross_margin_fy_h',
              displayName: 'Gross Profit Margin (%)',
              unit: 'percentage',
              category: 'profitability',
              section: 'key-ratios',
              subsection: 'profitability-ratios',
              required: false
            },
            {
              apiField: 'operating_margin_fy',
              historicalField: 'operating_margin_fy_h',
              displayName: 'Operating Profit Margin (%)',
              unit: 'percentage',
              category: 'profitability',
              section: 'key-ratios',
              subsection: 'profitability-ratios',
              required: false
            },
            {
              apiField: 'net_margin_fy',
              historicalField: 'net_margin_fy_h',
              quarterlyField: 'net_margin_fq',
              quarterlyHistoricalField: 'net_margin_fq_h',
              displayName: 'Net Profit Margin (%)',
              unit: 'percentage',
              category: 'profitability',
              section: 'key-ratios',
              subsection: 'profitability-ratios',
              required: false
            }
          ]
        },
        'liquidity-ratios': {
          name: 'Liquidity Ratios',
          fields: [
            {
              apiField: 'current_ratio_fy',
              historicalField: 'current_ratio_fy_h',
              displayName: 'Current Ratio',
              unit: 'ratio',
              category: 'liquidity',
              section: 'key-ratios',
              subsection: 'liquidity-ratios',
              required: false
            },
            {
              apiField: 'quick_ratio_fy',
              historicalField: 'quick_ratio_fy_h',
              displayName: 'Quick Ratio (Acid Test)',
              unit: 'ratio',
              category: 'liquidity',
              section: 'key-ratios',
              subsection: 'liquidity-ratios',
              required: false
            }
          ]
        },
        'solvency-ratios': {
          name: 'Solvency Ratios',
          fields: [
            {
              apiField: 'debt_to_equity_fy',
              historicalField: 'debt_to_equity_fy_h',
              displayName: 'Debt to Equity Ratio',
              unit: 'ratio',
              category: 'solvency',
              section: 'key-ratios',
              subsection: 'solvency-ratios',
              required: false
            },
            {
              apiField: 'debt_to_asset_fy',
              historicalField: 'debt_to_asset_fy_h',
              displayName: 'Debt to Assets Ratio',
              unit: 'ratio',
              category: 'solvency',
              section: 'key-ratios',
              subsection: 'solvency-ratios',
              required: false
            }
          ]
        },
        'efficiency-ratios': {
          name: 'Efficiency Ratios',
          fields: [
            {
              apiField: 'asset_turnover_fy',
              historicalField: 'asset_turnover_fy_h',
              displayName: 'Asset Turnover Ratio',
              unit: 'ratio',
              category: 'efficiency',
              section: 'key-ratios',
              subsection: 'efficiency-ratios',
              required: false
            },
            {
              apiField: 'invent_turnover_fy',
              historicalField: 'invent_turnover_fy_h',
              displayName: 'Inventory Turnover Ratio',
              unit: 'ratio',
              category: 'efficiency',
              section: 'key-ratios',
              subsection: 'efficiency-ratios',
              required: false
            }
          ]
        },
        'market-ratios': {
          name: 'Market/Valuation Ratios',
          fields: [
            {
              apiField: 'market_cap_basic',
              historicalField: 'market_cap_basic_fy_h',
              displayName: 'Market Capitalization',
              unit: 'currency',
              category: 'efficiency',
              section: 'key-ratios',
              subsection: 'market-ratios',
              required: false
            },
            {
              apiField: 'enterprise_value_fq',
              historicalField: 'enterprise_value_fy_h',
              displayName: 'Enterprise Value',
              unit: 'currency',
              category: 'efficiency',
              section: 'key-ratios',
              subsection: 'market-ratios',
              required: false
            },
            {
              apiField: 'price_earnings_fq',
              historicalField: 'price_earnings_fq_h',
              displayName: 'P/E Ratio',
              unit: 'ratio',
              category: 'efficiency',
              section: 'key-ratios',
              subsection: 'market-ratios',
              required: false
            },
            {
              apiField: 'price_book_fq',
              historicalField: 'price_book_fq_h',
              displayName: 'P/B Ratio',
              unit: 'ratio',
              category: 'efficiency',
              section: 'key-ratios',
              subsection: 'market-ratios',
              required: false
            },
            {
              apiField: 'price_sales_fq',
              historicalField: 'price_sales_fq_h',
              displayName: 'P/S Ratio',
              unit: 'ratio',
              category: 'efficiency',
              section: 'key-ratios',
              subsection: 'market-ratios',
              required: false
            },
            {
              apiField: 'enterprise_value_ebitda_fq',
              historicalField: 'enterprise_value_ebitda_fq_h',
              displayName: 'EV/EBITDA Ratio',
              unit: 'ratio',
              category: 'efficiency',
              section: 'key-ratios',
              subsection: 'market-ratios',
              required: false
            },
            {
              apiField: 'dividends_yield_fq',
              historicalField: 'dividends_yield_fy_h',
              displayName: 'Dividend Yield (%)',
              unit: 'percentage',
              category: 'profitability',
              section: 'key-ratios',
              subsection: 'market-ratios',
              required: false
            }
          ]
        },
        'per-share-metrics': {
          name: 'Per Share Metrics',
          fields: [
            {
              apiField: 'earnings_per_share_basic_fy',
              historicalField: 'earnings_per_share_basic_fy_h',
              quarterlyField: 'earnings_per_share_basic_fq',
              quarterlyHistoricalField: 'earnings_per_share_basic_fq_h',
              displayName: 'Earnings Per Share (Basic)',
              unit: 'currency',
              category: 'profitability',
              section: 'key-ratios',
              subsection: 'per-share-metrics',
              required: false
            },
            {
              apiField: 'book_value_per_share_fy',
              historicalField: 'book_value_per_share_fy_h',
              displayName: 'Book Value per Share',
              unit: 'currency',
              category: 'solvency',
              section: 'key-ratios',
              subsection: 'per-share-metrics',
              required: false
            },
            {
              apiField: 'total_shares_outstanding_fy',
              historicalField: 'total_shares_outstanding_fy_h',
              displayName: 'Shares Outstanding',
              unit: 'count',
              category: 'efficiency',
              section: 'key-ratios',
              subsection: 'per-share-metrics',
              required: false
            }
          ]
        },
        'operational-metrics': {
          name: 'Operational Metrics',
          fields: [
            {
              apiField: 'number_of_employees',
              historicalField: 'number_of_employees_fy_h',
              displayName: 'Number of Employees',
              unit: 'count',
              category: 'efficiency',
              section: 'key-ratios',
              subsection: 'operational-metrics',
              required: false
            }
          ]
        }
      }
    },
    'segment-data': {
      name: 'Segment Analysis',
      fields: [
        {
          apiField: 'revenue_seg_by_business_h',
          displayName: 'Revenue by Business Segment',
          unit: 'currency',
          category: 'profitability',
          section: 'segment-data',
          required: false
        },
        {
          apiField: 'revenue_seg_by_region_h',
          displayName: 'Revenue by Geography',
          unit: 'currency',
          category: 'profitability',
          section: 'segment-data',
          required: false
        }
      ]
    }
  }
};

/**
 * Get mapping configuration based on company type
 */
export function getMappingConfig(companyType: 'banking' | 'non-banking'): MappingConfig {
  return companyType === 'banking' ? BANKING_MAPPING_CONFIG : NON_BANKING_MAPPING_CONFIG;
}

/**
 * Get all field mappings for a company type (flattened)
 */
export function getAllFieldMappings(companyType: 'banking' | 'non-banking'): FieldMapping[] {
  const config = getMappingConfig(companyType);
  const allMappings: FieldMapping[] = [];

  for (const section of Object.values(config.sections)) {
    allMappings.push(...section.fields);
    
    if (section.subsections) {
      for (const subsection of Object.values(section.subsections)) {
        allMappings.push(...subsection.fields);
      }
    }
  }

  return allMappings;
}

/**
 * Get required field mappings for a company type
 */
export function getRequiredFieldMappings(companyType: 'banking' | 'non-banking'): FieldMapping[] {
  return getAllFieldMappings(companyType).filter(mapping => mapping.required);
}

/**
 * Get field mapping by API field name
 */
export function getFieldMappingByApiField(
  companyType: 'banking' | 'non-banking', 
  apiField: string
): FieldMapping | undefined {
  return getAllFieldMappings(companyType).find(mapping => mapping.apiField === apiField);
}