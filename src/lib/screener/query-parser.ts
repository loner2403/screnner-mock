import { Filter, FilterOperator } from './types'
import { Prisma } from '@prisma/client'

/**
 * Converts screener filters to Prisma where clauses
 * This prevents SQL injection by using Prisma's typed query builder
 */
export function filtersToWhereClause(filters: Filter[]): Prisma.CompanyWhereInput {
  const whereConditions: Prisma.CompanyWhereInput[] = []

  for (const filter of filters) {
    const { field, operator, value } = filter

    // Check if field is a company field or financial metric field
    if (isCompanyField(field)) {
      // Direct company field filter
      whereConditions.push({
        [field]: operatorToCondition(operator, value)
      })
    } else if (isBalanceSheetField(field)) {
      // Map frontend field names to database field names
      const dbField = mapFieldToDbField(field)

      // Build the nested where clause for balance sheet fields
      const balanceSheetCondition: Record<string, any> = {
        [dbField]: operatorToCondition(operator, value)
      }

      // Add condition that requires at least one balance sheet record matching the filter
      whereConditions.push({
        balanceSheets: {
          some: balanceSheetCondition
        }
      })
    } else {
      throw new Error(`Unsupported filter field: ${field}`)
    }
  }

  // Combine all conditions with AND logic
  return {
    AND: whereConditions
  }
}

/**
 * Converts filter operator to Prisma condition
 */
function operatorToCondition(operator: FilterOperator, value: number): Record<string, number> {
  switch (operator) {
    case 'gt':
      return { gt: value }
    case 'gte':
      return { gte: value }
    case 'lt':
      return { lt: value }
    case 'lte':
      return { lte: value }
    case 'eq':
      return { equals: value }
    default:
      throw new Error(`Unsupported operator: ${operator}`)
  }
}

/**
 * Builds Prisma orderBy clause from sort parameters
 */
export function buildOrderBy(
  sortBy?: string,
  sortOrder: 'asc' | 'desc' = 'desc'
): Prisma.CompanyOrderByWithRelationInput[] {
  if (!sortBy) {
    // Default sort by company name
    return [{ name: 'asc' }]
  }

  // For company fields
  if (isCompanyField(sortBy)) {
    return [{ [sortBy]: sortOrder }]
  }

  // For balance sheet fields, sort by company name for now
  // TODO: Implement complex sorting by balance sheet values later
  if (isBalanceSheetField(sortBy)) {
    return [{ name: 'asc' }]
  }

  // Default fallback
  return [{ name: 'asc' }]
}

/**
 * Check if field is a company field
 */
function isCompanyField(field: string): boolean {
  const companyFields = ['marketCap', 'symbol', 'name', 'sector', 'industry', 'exchange']
  return companyFields.includes(field)
}

/**
 * Check if field is a balance sheet field
 */
function isBalanceSheetField(field: string): boolean {
  const balanceSheetFields = [
    'currentRatio', 'debtToEquity', 'totalAssets', 'totalEquity', 'totalLiabilities',
    'currentAssets', 'currentLiabilities', 'workingCapital', 'netDebt', 'tceRatio',
    'debtToAssets', 'equityRatio', 'cashConversionCycle'
  ]
  return balanceSheetFields.includes(field)
}

/**
 * Maps frontend field names to database field names
 */
function mapFieldToDbField(field: string): string {
  const fieldMap: Record<string, string> = {
    'debtToEquity': 'netDebtToEquityPercent', // Frontend uses debtToEquity, DB stores netDebtToEquityPercent
    'currentRatio': 'currentRatio',
    'totalAssets': 'totalAssets',
    'totalEquity': 'totalEquity',
    'totalLiabilities': 'totalLiabilities',
    'currentAssets': 'currentAssets',
    'currentLiabilities': 'currentLiabilities',
    'workingCapital': 'workingCapital',
    'netDebt': 'netDebt',
    'tceRatio': 'tceRatio',
    'debtToAssets': 'debtToAssets',
    'equityRatio': 'equityRatio',
    'cashConversionCycle': 'cashConversionCycle'
  }

  return fieldMap[field] || field
}