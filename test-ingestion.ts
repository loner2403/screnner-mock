/**
 * Test script for comprehensive balance sheet data ingestion
 * Run this after applying the Prisma migration: npx tsx test-ingestion.ts
 */

import { testDataIngestion, ingestDataFromFile } from './src/lib/data-ingestion/comprehensive-ingestion-service'

async function runTest() {
  console.log('🚀 Starting comprehensive balance sheet data ingestion test...\n')

  try {
    // Test ingestion with your data.json file
    const result = await ingestDataFromFile('./data.json', {
      latestOnly: true, // Only ingest the latest year data
      upsert: true      // Update if exists, create if not
    })

    console.log('\n📊 Ingestion Results:')
    console.log(`✅ Success: ${result.success}`)
    console.log(`📈 Companies Processed: ${result.processed}`)
    console.log(`📋 Message: ${result.message}`)

    if (result.stats) {
      console.log('\n📊 Detailed Stats:')
      console.log(`  - Total Records: ${result.stats.totalRecords}`)
      console.log(`  - Valid Records: ${result.stats.validRecords}`)
      console.log(`  - Companies Processed: ${result.stats.companiesProcessed}`)
      console.log(`  - Latest Data Only: ${result.stats.latestDataOnly}`)
    }

    if (result.success) {
      console.log('\n🎉 Data ingestion completed successfully!')
      console.log('\n📝 What was ingested:')
      console.log('  - Company data (symbol, name, ticker)')
      console.log('  - Latest balance sheet data (2025) in crores')
      console.log('  - All balance sheet line items')
      console.log('  - Calculated ratios and percentages')
      console.log('  - Proper indexing for fast screener queries')
    }

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Also test the comprehensive test function
async function runFullTest() {
  console.log('\n🧪 Running comprehensive test with sample output...\n')

  try {
    await testDataIngestion('./data.json')
  } catch (error) {
    console.error('❌ Comprehensive test failed:', error)
  }
}

// Run both tests
async function main() {
  await runTest()
  await runFullTest()
}

main().catch(console.error)