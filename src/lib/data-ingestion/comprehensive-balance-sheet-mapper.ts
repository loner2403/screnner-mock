import { z } from 'zod'

// Define the comprehensive raw balance sheet data structure from your API
export const RawBalanceSheetSchema = z.object({
  // Basic Information
  ticker: z.string(),
  date: z.string(),
  period: z.string(),
  period_label: z.string(),
  fiscal_year: z.string(),

  // ASSETS - Current Assets
  bs_c_and_ce_and_sti_detailed: z.number().optional(), // Cash and cash equivalents
  bs_cash_near_cash_item: z.number().optional(),
  bs_mkt_sec_other_st_invest: z.number().optional(), // Marketable securities
  bs_accts_rec_excl_notes_rec: z.number().optional(), // Accounts receivable
  bs_other_current_receivable: z.number().optional(),
  bs_inventories: z.number().optional(),
  bs_invtry_raw_materials: z.number().optional(),
  bs_invtry_in_progress: z.number().optional(),
  bs_invtry_finished_goods: z.number().optional(),
  bs_other_inv: z.number().optional(),
  bs_other_current_assets_detailed: z.number().optional(),
  bs_cur_asset_report: z.number().optional(), // Total current assets

  // ASSETS - Non-Current Assets
  bs_net_fix_asset: z.number().optional(), // Net fixed assets
  bs_gross_fix_asset: z.number().optional(),
  bs_accum_depr: z.number().optional(), // Accumulated depreciation
  bs_other_assets_def_chrg_other: z.number().optional(),
  bs_disclosed_intangibles: z.number().optional(),
  bs_goodwill: z.number().optional(),
  bs_other_intangible_assets_detailed: z.number().optional(),
  bs_other_noncurrent_assets_detailed: z.number().optional(),
  bs_tot_non_cur_asset: z.number().optional(), // Total non-current assets
  bs_tot_asset: z.number().optional(), // Total assets

  // LIABILITIES - Current Liabilities
  bs_acct_payable: z.number().optional(), // Accounts payable
  bs_taxes_payable: z.number().optional(),
  bs_accrual: z.number().optional(),
  bs_st_borrow: z.number().optional(), // Short term borrowings
  bs_short_term_debt_detailed: z.number().optional(),
  bs_other_current_liabs_sub_detailed: z.number().optional(),
  bs_deferred_tax_liabs_st: z.number().optional(),
  bs_other_current_liabs_detailed: z.number().optional(),
  bs_cur_liab: z.number().optional(), // Total current liabilities

  // LIABILITIES - Non-Current Liabilities
  bs_lt_borrow: z.number().optional(), // Long term borrowings
  bs_long_term_borrowings_detailed: z.number().optional(),
  bs_other_noncur_liabs_sub_detailed: z.number().optional(),
  bs_other_noncurrent_liabs_detailed: z.number().optional(),
  bs_non_cur_liab: z.number().optional(), // Total non-current liabilities
  bs_tot_liab: z.number().optional(), // Total liabilities

  // EQUITY
  bs_sh_cap_and_apic: z.number().optional(), // Share capital and APIC
  bs_common_stock: z.number().optional(),
  bs_add_paid_in_cap: z.number().optional(),
  bs_pure_retained_earnings: z.number().optional(),
  bs_eqty_bef_minority_int_detailed: z.number().optional(),
  bs_minority_noncontrolling_interest: z.number().optional(),
  bs_total_equity: z.number().optional(),
  bs_tot_liab_and_eqy: z.number().optional(), // Total liabilities and equity
  bs_sh_out: z.number().optional(), // Shares outstanding

  // CALCULATED RATIOS (These remain as percentages/ratios)
  net_debt: z.number().optional(),
  net_debt_to_shrhldr_eqty: z.number().optional(), // Percentage
  tce_ratio: z.number().optional(), // Percentage
  cur_ratio: z.number().optional(), // Ratio
  cash_conversion_cycle: z.number().optional(), // Days
})

export type RawBalanceSheetData = z.infer<typeof RawBalanceSheetSchema>

// Helper function to convert values to crores (divide by 10,000,000)
function toCrores(value: number | undefined): number | null {
  if (value === undefined || value === null) return null
  return Number((value / 10000000).toFixed(4)) // 4 decimal places for precision
}

// Helper function to keep shares in crores (divide by 100,000,000)
function sharesToCrores(value: number | undefined): number | null {
  if (value === undefined || value === null) return null
  return Number((value / 100000000).toFixed(4))
}

// Helper function to extract quarter from period string
function extractQuarterFromPeriod(period: string): number | null {
  if (period === 'annual') return null // Annual reports are NOT quarters

  // Handle common period formats
  if (period.includes('Q1') || period.includes('q1')) return 1
  if (period.includes('Q2') || period.includes('q2')) return 2
  if (period.includes('Q3') || period.includes('q3')) return 3
  if (period.includes('Q4') || period.includes('q4')) return 4

  // Handle month-based periods (if needed)
  if (period.includes('03') || period.includes('Mar')) return 1
  if (period.includes('06') || period.includes('Jun')) return 2
  if (period.includes('09') || period.includes('Sep')) return 3
  if (period.includes('12') || period.includes('Dec')) return 4

  return null // Unknown format
}

// Map comprehensive balance sheet data to our database schema
export function mapBalanceSheetToDatabase(
  rawData: RawBalanceSheetData
): {
  companyData: {
    symbol: string
    ticker: string
    name: string
  }
  balanceSheetData: {
    ticker: string
    date: string
    year: number
    quarter: number | null
    fiscalYear: string
    period: string
    periodLabel: string
    isAnnual: boolean // NEW: Distinguish annual from quarterly reports

    // Assets (in crores)
    cashAndCashEquivalents: number | null
    cashNearCashItem: number | null
    marketableSecurities: number | null
    accountsReceivable: number | null
    otherCurrentReceivable: number | null
    inventory: number | null
    inventoryRawMaterials: number | null
    inventoryInProgress: number | null
    inventoryFinishedGoods: number | null
    otherInventory: number | null
    otherCurrentAssets: number | null
    currentAssets: number | null

    netFixedAssets: number | null
    grossFixedAssets: number | null
    accumulatedDepreciation: number | null
    otherNonCurrentAssets: number | null
    disclosedIntangibles: number | null
    goodwill: number | null
    otherIntangibleAssets: number | null
    otherNonCurrentAssetsDetailed: number | null
    totalNonCurrentAssets: number | null
    totalAssets: number | null

    // Liabilities (in crores)
    accountsPayable: number | null
    taxesPayable: number | null
    accruals: number | null
    shortTermBorrowings: number | null
    shortTermDebtDetailed: number | null
    otherCurrentLiabilities: number | null
    deferredTaxLiabilitiesST: number | null
    otherCurrentLiabsDetailed: number | null
    currentLiabilities: number | null

    longTermBorrowings: number | null
    longTermBorrowingsDetailed: number | null
    otherNonCurrentLiabilities: number | null
    otherNonCurrentLiabsDetailed: number | null
    nonCurrentLiabilities: number | null
    totalLiabilities: number | null

    // Equity (in crores)
    shareCapitalAndAPIC: number | null
    commonStock: number | null
    additionalPaidInCapital: number | null
    retainedEarnings: number | null
    equityBeforeMinority: number | null
    minorityInterest: number | null
    totalEquity: number | null
    totalLiabilitiesAndEquity: number | null
    sharesOutstanding: number | null

    // Ratios (preserved as-is)
    netDebt: number | null
    netDebtToEquityPercent: number | null
    tceRatio: number | null
    currentRatio: number | null
    cashConversionCycle: number | null

    // Additional calculated fields
    workingCapital: number | null
    debtToAssets: number | null
    equityRatio: number | null
  }
} {
  // Extract symbol from ticker (remove .NS suffix)
  const symbol = rawData.ticker.replace('.NS', '')
  const year = parseInt(rawData.period_label) || parseInt(rawData.fiscal_year)
  const quarter = extractQuarterFromPeriod(rawData.period)
  const isAnnual = rawData.period === 'annual'

  // Calculate additional ratios
  const currentAssets = toCrores(rawData.bs_cur_asset_report)
  const currentLiabilities = toCrores(rawData.bs_cur_liab)
  const totalAssets = toCrores(rawData.bs_tot_asset)
  const totalLiabilities = toCrores(rawData.bs_tot_liab)
  const totalEquity = toCrores(rawData.bs_total_equity)

  const workingCapital = (currentAssets && currentLiabilities)
    ? Number((currentAssets - currentLiabilities).toFixed(4))
    : null

  const debtToAssets = (totalLiabilities && totalAssets)
    ? Number(((totalLiabilities / totalAssets) * 100).toFixed(2))
    : null

  const equityRatio = (totalEquity && totalAssets)
    ? Number(((totalEquity / totalAssets) * 100).toFixed(2))
    : null

  return {
    companyData: {
      symbol: symbol,
      ticker: rawData.ticker,
      name: symbol, // You might want to fetch company name from another source
    },
    balanceSheetData: {
      ticker: rawData.ticker,
      date: rawData.date,
      year: year,
      quarter: quarter,
      fiscalYear: rawData.fiscal_year,
      period: rawData.period,
      periodLabel: rawData.period_label,
      isAnnual: isAnnual,

      // Assets (converted to crores)
      cashAndCashEquivalents: toCrores(rawData.bs_c_and_ce_and_sti_detailed),
      cashNearCashItem: toCrores(rawData.bs_cash_near_cash_item),
      marketableSecurities: toCrores(rawData.bs_mkt_sec_other_st_invest),
      accountsReceivable: toCrores(rawData.bs_accts_rec_excl_notes_rec),
      otherCurrentReceivable: toCrores(rawData.bs_other_current_receivable),
      inventory: toCrores(rawData.bs_inventories),
      inventoryRawMaterials: toCrores(rawData.bs_invtry_raw_materials),
      inventoryInProgress: toCrores(rawData.bs_invtry_in_progress),
      inventoryFinishedGoods: toCrores(rawData.bs_invtry_finished_goods),
      otherInventory: toCrores(rawData.bs_other_inv),
      otherCurrentAssets: toCrores(rawData.bs_other_current_assets_detailed),
      currentAssets: currentAssets,

      netFixedAssets: toCrores(rawData.bs_net_fix_asset),
      grossFixedAssets: toCrores(rawData.bs_gross_fix_asset),
      accumulatedDepreciation: toCrores(rawData.bs_accum_depr),
      otherNonCurrentAssets: toCrores(rawData.bs_other_assets_def_chrg_other),
      disclosedIntangibles: toCrores(rawData.bs_disclosed_intangibles),
      goodwill: toCrores(rawData.bs_goodwill),
      otherIntangibleAssets: toCrores(rawData.bs_other_intangible_assets_detailed),
      otherNonCurrentAssetsDetailed: toCrores(rawData.bs_other_noncurrent_assets_detailed),
      totalNonCurrentAssets: toCrores(rawData.bs_tot_non_cur_asset),
      totalAssets: totalAssets,

      // Liabilities (converted to crores)
      accountsPayable: toCrores(rawData.bs_acct_payable),
      taxesPayable: toCrores(rawData.bs_taxes_payable),
      accruals: toCrores(rawData.bs_accrual),
      shortTermBorrowings: toCrores(rawData.bs_st_borrow),
      shortTermDebtDetailed: toCrores(rawData.bs_short_term_debt_detailed),
      otherCurrentLiabilities: toCrores(rawData.bs_other_current_liabs_sub_detailed),
      deferredTaxLiabilitiesST: toCrores(rawData.bs_deferred_tax_liabs_st),
      otherCurrentLiabsDetailed: toCrores(rawData.bs_other_current_liabs_detailed),
      currentLiabilities: currentLiabilities,

      longTermBorrowings: toCrores(rawData.bs_lt_borrow),
      longTermBorrowingsDetailed: toCrores(rawData.bs_long_term_borrowings_detailed),
      otherNonCurrentLiabilities: toCrores(rawData.bs_other_noncur_liabs_sub_detailed),
      otherNonCurrentLiabsDetailed: toCrores(rawData.bs_other_noncurrent_liabs_detailed),
      nonCurrentLiabilities: toCrores(rawData.bs_non_cur_liab),
      totalLiabilities: totalLiabilities,

      // Equity (converted to crores)
      shareCapitalAndAPIC: toCrores(rawData.bs_sh_cap_and_apic),
      commonStock: toCrores(rawData.bs_common_stock),
      additionalPaidInCapital: toCrores(rawData.bs_add_paid_in_cap),
      retainedEarnings: toCrores(rawData.bs_pure_retained_earnings),
      equityBeforeMinority: toCrores(rawData.bs_eqty_bef_minority_int_detailed),
      minorityInterest: toCrores(rawData.bs_minority_noncontrolling_interest),
      totalEquity: totalEquity,
      totalLiabilitiesAndEquity: toCrores(rawData.bs_tot_liab_and_eqy),
      sharesOutstanding: sharesToCrores(rawData.bs_sh_out),

      // Ratios (preserved as-is)
      netDebt: toCrores(rawData.net_debt),
      netDebtToEquityPercent: rawData.net_debt_to_shrhldr_eqty || null,
      tceRatio: rawData.tce_ratio || null,
      currentRatio: rawData.cur_ratio || null,
      cashConversionCycle: rawData.cash_conversion_cycle || null,

      // Additional calculated fields
      workingCapital: workingCapital,
      debtToAssets: debtToAssets,
      equityRatio: equityRatio,
    }
  }
}

// Get the most recent year data from an array of balance sheet records
export function getMostRecentData(
  balanceSheetArray: RawBalanceSheetData[]
): RawBalanceSheetData | null {
  if (!balanceSheetArray || balanceSheetArray.length === 0) {
    return null
  }

  // Sort by date (most recent first)
  const sorted = balanceSheetArray.sort((a, b) => {
    const dateA = new Date(a.date)
    const dateB = new Date(b.date)
    return dateB.getTime() - dateA.getTime()
  })

  return sorted[0]
}

// Validate and clean the raw data
export function validateBalanceSheetData(rawData: unknown): RawBalanceSheetData | null {
  try {
    return RawBalanceSheetSchema.parse(rawData)
  } catch (error) {
    console.error('Invalid balance sheet data:', error)
    return null
  }
}

// Helper function to generate database IDs
export function generateBalanceSheetId(companySymbol: string, year: number, quarter: number | null): string {
  return `bs-${companySymbol.toLowerCase()}-${year}-${quarter || 4}`
}

export function generateCompanyId(symbol: string): string {
  return `comp-${symbol.toLowerCase()}`
}