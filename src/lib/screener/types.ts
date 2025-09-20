import { z } from 'zod'

// Filter validation schemas
export const FilterOperatorSchema = z.enum(['gt', 'gte', 'lt', 'lte', 'eq'])
export const FilterFieldSchema = z.enum([
  // Available from BalanceSheet data
  'currentRatio',
  'debtToEquity', // derived from netDebtToEquityPercent
  'marketCap',
  'totalAssets',
  'totalEquity',
  'totalLiabilities',
  'currentAssets',
  'currentLiabilities',
  'workingCapital',
  'netDebt',
  'tceRatio',
  'debtToAssets',
  'equityRatio',
  'cashConversionCycle',

  // Future fields (will be available when P&L data is added)
  // 'peRatio',
  // 'pbRatio',
  // 'priceToSales',
  // 'evEbitda',
  // 'roe',
  // 'roa',
  // 'roce',
  // 'grossMargin',
  // 'operatingMargin',
  // 'netMargin',
  // 'quickRatio',
  // 'revenue',
  // 'netIncome'
])

export const FilterSchema = z.object({
  field: FilterFieldSchema,
  operator: FilterOperatorSchema,
  value: z.number().finite()
})

export const ScreenerRequestSchema = z.object({
  filters: z.array(FilterSchema).min(1).max(10),
  sortBy: FilterFieldSchema.optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  limit: z.number().int().min(1).max(1000).default(50),
  offset: z.number().int().min(0).default(0)
})

// Response types
export interface ScreenerStock {
  id: string
  symbol: string
  name: string
  sector?: string
  industry?: string
  marketCap?: number // in crores
  metrics: {
    // Available from BalanceSheet data
    currentRatio?: number
    debtToEquity?: number // converted from percentage
    totalAssets?: number // in crores
    totalEquity?: number // in crores
    totalLiabilities?: number // in crores
    currentAssets?: number // in crores
    currentLiabilities?: number // in crores
    workingCapital?: number // in crores
    netDebt?: number // in crores
    tceRatio?: number // percentage
    debtToAssets?: number // percentage
    equityRatio?: number // percentage
    cashConversionCycle?: number // days

    // Future fields (commented out until P&L data is available)
    // peRatio?: number
    // pbRatio?: number
    // priceToSales?: number
    // evEbitda?: number
    // roe?: number
    // roa?: number
    // roce?: number
    // grossMargin?: number
    // operatingMargin?: number
    // netMargin?: number
    // quickRatio?: number
    // revenue?: number
    // netIncome?: number
  }
}

export interface ScreenerResponse {
  stocks: ScreenerStock[]
  total: number
  page: {
    offset: number
    limit: number
    hasNext: boolean
  }
  filters: z.infer<typeof FilterSchema>[]
}

export type FilterField = z.infer<typeof FilterFieldSchema>
export type FilterOperator = z.infer<typeof FilterOperatorSchema>
export type Filter = z.infer<typeof FilterSchema>
export type ScreenerRequest = z.infer<typeof ScreenerRequestSchema>