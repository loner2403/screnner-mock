import { PrismaClient } from '@prisma/client'
import {
  RawBalanceSheetData,
  mapBalanceSheetToDatabase,
  getMostRecentData,
  validateBalanceSheetData,
  generateBalanceSheetId,
  generateCompanyId
} from './comprehensive-balance-sheet-mapper'

export class ComprehensiveDataIngestionService {
  private prisma: PrismaClient

  constructor() {
    this.prisma = new PrismaClient()
  }

  /**
   * Ingest balance sheet data array for multiple companies with latest data filtering
   */
  async ingestBalanceSheetData(
    rawDataArray: unknown[],
    options: {
      upsert?: boolean
      batchSize?: number
      latestOnly?: boolean // New option to only ingest latest year data
    } = {}
  ): Promise<{
    success: boolean
    processed: number
    errors: string[]
    companies: string[]
    stats: {
      totalRecords: number
      validRecords: number
      companiesProcessed: number
      latestDataOnly: boolean
    }
  }> {
    const { upsert = true, batchSize = 10, latestOnly = true } = options
    const results = {
      success: true,
      processed: 0,
      errors: [] as string[],
      companies: [] as string[],
      stats: {
        totalRecords: rawDataArray.length,
        validRecords: 0,
        companiesProcessed: 0,
        latestDataOnly: latestOnly
      }
    }

    try {
      // Group data by ticker
      const dataByTicker = new Map<string, RawBalanceSheetData[]>()

      // Validate and group data
      for (const rawItem of rawDataArray) {
        const validatedData = validateBalanceSheetData(rawItem)
        if (!validatedData) {
          results.errors.push(`Invalid data structure for item: ${JSON.stringify(rawItem).substring(0, 100)}...`)
          continue
        }

        results.stats.validRecords++
        const ticker = validatedData.ticker
        if (!dataByTicker.has(ticker)) {
          dataByTicker.set(ticker, [])
        }
        dataByTicker.get(ticker)!.push(validatedData)
      }

      console.log(`📊 Processing ${dataByTicker.size} companies with ${results.stats.validRecords} valid records`)

      // Process each company
      for (const [ticker, companyDataArray] of dataByTicker) {
        try {
          if (latestOnly) {
            // Process only the latest data for each company
            await this.processCompanyLatestData(ticker, companyDataArray, upsert)
          } else {
            // Process all historical data for each company
            await this.processCompanyAllData(ticker, companyDataArray, upsert)
          }

          results.processed++
          results.companies.push(ticker)
          results.stats.companiesProcessed++
        } catch (error) {
          results.errors.push(`Failed to process ${ticker}: ${error instanceof Error ? error.message : 'Unknown error'}`)
          results.success = false
        }
      }

      console.log(`✅ Successfully processed ${results.processed} companies`)
      if (results.errors.length > 0) {
        console.log(`⚠️  ${results.errors.length} errors encountered`)
      }

      return results
    } catch (error) {
      results.success = false
      results.errors.push(`Ingestion failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return results
    } finally {
      // Don't disconnect here - let the consumer manage the lifecycle
    }
  }

  /**
   * Explicitly disconnect the Prisma client when done with the service
   */
  async disconnect(): Promise<void> {
    await this.prisma.$disconnect()
  }

  /**
   * Process latest data only for a single company (recommended for initial load)
   */
  private async processCompanyLatestData(
    ticker: string,
    companyDataArray: RawBalanceSheetData[],
    upsert: boolean
  ): Promise<void> {
    // Get the most recent data
    const mostRecentData = getMostRecentData(companyDataArray)
    if (!mostRecentData) {
      throw new Error(`No valid data found for ${ticker}`)
    }

    await this.insertBalanceSheetRecord(mostRecentData, upsert)
    console.log(`✅ Processed latest data for ${ticker} (${mostRecentData.period_label})`)
  }

  /**
   * Process all historical data for a single company
   */
  private async processCompanyAllData(
    ticker: string,
    companyDataArray: RawBalanceSheetData[],
    upsert: boolean
  ): Promise<void> {
    // Sort by date (most recent first) and process all
    const sortedData = companyDataArray.sort((a, b) => {
      const dateA = new Date(a.date)
      const dateB = new Date(b.date)
      return dateB.getTime() - dateA.getTime()
    })

    for (const data of sortedData) {
      await this.insertBalanceSheetRecord(data, upsert)
    }

    console.log(`✅ Processed all ${sortedData.length} records for ${ticker}`)
  }

  /**
   * Insert a single balance sheet record
   */
  private async insertBalanceSheetRecord(
    rawData: RawBalanceSheetData,
    upsert: boolean
  ): Promise<void> {
    // Map to our schema
    const { companyData, balanceSheetData } = mapBalanceSheetToDatabase(rawData)

    // Create or update company first
    const company = await this.prisma.company.upsert({
      where: { symbol: companyData.symbol },
      update: {
        name: companyData.name,
        ticker: companyData.ticker,
        // Don't update marketCap from balance sheet data
        // marketCap should come from market data, not financial statements
      },
      create: {
        id: generateCompanyId(companyData.symbol),
        symbol: companyData.symbol,
        ticker: companyData.ticker,
        name: companyData.name,
        marketCap: null, // Set to null until actual market cap data is available
      }
    })

    // Create or update balance sheet record
    const balanceSheetId = generateBalanceSheetId(
      companyData.symbol,
      balanceSheetData.year,
      balanceSheetData.quarter
    )

    if (upsert) {
      await this.prisma.balanceSheet.upsert({
        where: {
          companyId_year_quarter: {
            companyId: company.id,
            year: balanceSheetData.year,
            quarter: balanceSheetData.quarter || 4
          }
        },
        update: {
          ...balanceSheetData,
        },
        create: {
          id: balanceSheetId,
          companyId: company.id,
          ...balanceSheetData,
        }
      })
    } else {
      // Insert only if doesn't exist
      const existing = await this.prisma.balanceSheet.findUnique({
        where: {
          companyId_year_quarter: {
            companyId: company.id,
            year: balanceSheetData.year,
            quarter: balanceSheetData.quarter || 4
          }
        }
      })

      if (!existing) {
        await this.prisma.balanceSheet.create({
          data: {
            id: balanceSheetId,
            companyId: company.id,
            ...balanceSheetData,
          }
        })
      }
    }
  }

  /**
   * Ingest data from file (like data.json)
   */
  async ingestFromFile(
    filePath: string,
    options: {
      latestOnly?: boolean
      upsert?: boolean
    } = {}
  ): Promise<{
    success: boolean
    message: string
    processed: number
    stats: any
  }> {
    try {
      const fs = require('fs')
      const rawData = JSON.parse(fs.readFileSync(filePath, 'utf8'))

      // Ensure it's an array
      const dataArray = Array.isArray(rawData) ? rawData : [rawData]

      const results = await this.ingestBalanceSheetData(dataArray, options)

      return {
        success: results.success,
        message: `Processed ${results.processed} companies from file. Errors: ${results.errors.length}`,
        processed: results.processed,
        stats: results.stats
      }
    } catch (error) {
      return {
        success: false,
        message: `File ingestion failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        processed: 0,
        stats: {}
      }
    }
  }

  /**
   * Get companies with latest balance sheet data
   */
  async getCompaniesWithLatestData(limit: number = 50): Promise<any[]> {
    const companies = await this.prisma.company.findMany({
      take: limit,
      include: {
        balanceSheets: {
          orderBy: {
            year: 'desc'
          },
          take: 1
        }
      }
    })

    return companies.map(company => ({
      symbol: company.symbol,
      ticker: company.ticker,
      name: company.name,
      marketCap: company.marketCap,
      latestData: company.balanceSheets[0] || null
    }))
  }

  /**
   * Get balance sheet data for a specific company
   */
  async getCompanyBalanceSheets(
    symbol: string,
    options: {
      limit?: number
      latestOnly?: boolean
    } = {}
  ): Promise<any[]> {
    const { limit = 10, latestOnly = false } = options

    const balanceSheets = await this.prisma.balanceSheet.findMany({
      where: {
        company: {
          symbol: symbol
        }
      },
      orderBy: {
        year: 'desc'
      },
      take: latestOnly ? 1 : limit,
      include: {
        company: {
          select: {
            symbol: true,
            ticker: true,
            name: true
          }
        }
      }
    })

    return balanceSheets
  }

  /**
   * Test the ingestion with sample data
   */
  async testIngestion(sampleDataPath: string = './data.json'): Promise<void> {
    try {
      console.log('🧪 Starting test ingestion...')

      const results = await this.ingestFromFile(sampleDataPath, {
        latestOnly: true,
        upsert: true
      })

      console.log('🧪 Test Results:')
      console.log(`✅ Success: ${results.success}`)
      console.log(`📊 Processed: ${results.processed} companies`)
      console.log(`📈 Stats:`, results.stats)

      // Show some sample data
      const sampleCompanies = await this.getCompaniesWithLatestData(5)
      console.log('\n📋 Sample processed companies:')
      sampleCompanies.forEach(company => {
        console.log(`  - ${company.symbol}: ₹${company.latestData?.totalAssets || 'N/A'} Cr assets (${company.latestData?.year || 'N/A'})`)
      })

    } catch (error) {
      console.error('❌ Test failed:', error)
    }
  }
}

// Export convenience functions
export async function ingestDataFromFile(
  filePath: string,
  options: {
    latestOnly?: boolean
    upsert?: boolean
  } = {}
) {
  const service = new ComprehensiveDataIngestionService()
  return await service.ingestFromFile(filePath, options)
}

export async function testDataIngestion(filePath: string = './data.json') {
  const service = new ComprehensiveDataIngestionService()
  return await service.testIngestion(filePath)
}