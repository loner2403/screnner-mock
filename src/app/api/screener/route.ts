import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { ScreenerRequestSchema, ScreenerResponse, ScreenerStock } from '@/lib/screener/types'
import { filtersToWhereClause, buildOrderBy } from '@/lib/screener/query-parser'
import { z } from 'zod'

// Initialize Prisma client (in production, use singleton pattern)
const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json()
    const validatedRequest = ScreenerRequestSchema.parse(body)

    const { filters, sortBy, sortOrder, limit, offset } = validatedRequest

    // Convert filters to Prisma where clause
    const whereClause = filtersToWhereClause(filters)
    const orderBy = buildOrderBy(sortBy, sortOrder)

    // Execute query with Prisma - using BalanceSheet data
    const [companies, totalCount] = await Promise.all([
      prisma.company.findMany({
        where: whereClause,
        orderBy,
        skip: offset,
        take: limit,
        include: {
          balanceSheets: {
            orderBy: { year: 'desc' },
            take: 1 // Get only the latest balance sheet data
          }
        }
      }),
      prisma.company.count({ where: whereClause })
    ])

    // Transform data to response format using BalanceSheet data
    const stocks: ScreenerStock[] = companies.map(company => {
      const latestBalanceSheet = company.balanceSheets[0]

      return {
        id: company.id,
        symbol: company.symbol,
        name: company.name,
        sector: company.sector || undefined,
        industry: company.industry || undefined,
        marketCap: company.marketCap || undefined,
        metrics: latestBalanceSheet ? {
          // Available from balance sheet data (all values in crores)
          currentRatio: latestBalanceSheet.currentRatio || undefined,
          debtToEquity: latestBalanceSheet.netDebtToEquityPercent ?
            Number((latestBalanceSheet.netDebtToEquityPercent / 100).toFixed(4)) : undefined,
          totalAssets: latestBalanceSheet.totalAssets || undefined,
          totalEquity: latestBalanceSheet.totalEquity || undefined,
          totalLiabilities: latestBalanceSheet.totalLiabilities || undefined,
          currentAssets: latestBalanceSheet.currentAssets || undefined,
          currentLiabilities: latestBalanceSheet.currentLiabilities || undefined,
          workingCapital: latestBalanceSheet.workingCapital || undefined,
          netDebt: latestBalanceSheet.netDebt || undefined,
          tceRatio: latestBalanceSheet.tceRatio || undefined,
          debtToAssets: latestBalanceSheet.debtToAssets || undefined,
          equityRatio: latestBalanceSheet.equityRatio || undefined,
          cashConversionCycle: latestBalanceSheet.cashConversionCycle || undefined,
        } : {}
      }
    })

    const response: ScreenerResponse = {
      stocks,
      total: totalCount,
      page: {
        offset,
        limit,
        hasNext: offset + limit < totalCount
      },
      filters
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Screener API error:', error)

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid request format',
          details: error
        },
        { status: 400 }
      )
    }

    // Handle Prisma errors
    if (error instanceof Error && error.message.includes('Prisma')) {
      return NextResponse.json(
        {
          error: 'Database query failed',
          message: 'Please check your filters and try again'
        },
        { status: 500 }
      )
    }

    // Generic error
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'An unexpected error occurred'
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

export async function GET() {
  try {

    // Simple GET endpoint to return available filter fields
    // Only includes fields available from BalanceSheet data
    const filterFields = [
      'currentRatio', 'debtToEquity', 'marketCap', 'totalAssets', 'totalEquity',
      'totalLiabilities', 'currentAssets', 'currentLiabilities', 'workingCapital',
      'netDebt', 'tceRatio', 'debtToAssets', 'equityRatio', 'cashConversionCycle'
    ]

    const operators = ['gt', 'gte', 'lt', 'lte', 'eq']

    return NextResponse.json({
      availableFields: filterFields,
      availableOperators: operators,
      maxFilters: 10,
      maxResults: 1000
    })

  } catch (error) {
    console.error('Screener GET API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch screener configuration' },
      { status: 500 }
    )
  }
}