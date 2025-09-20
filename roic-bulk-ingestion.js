#!/usr/bin/env node

/**
 * ROIC API Bulk Balance Sheet Data Ingestion Script
 *
 * This script:
 * 1. Fetches all NSE company tickers from ROIC API
 * 2. Fetches balance sheet data for each company
 * 3. Ingests the data into our database
 *
 * Usage:
 *   node roic-bulk-ingestion.js
 *   node roic-bulk-ingestion.js --limit 50
 *   node roic-bulk-ingestion.js --latest-only
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// ROIC API Configuration
const ROIC_API_KEY = process.env.ROIC_API_KEY;
const ROIC_BASE_URL = process.env.ROIC_BASE_URL || 'https://api.roic.ai';

// Local API Configuration
const LOCAL_API_BASE_URL = process.env.LOCAL_API_BASE_URL || 'http://localhost:3000';

if (!ROIC_API_KEY) {
  console.error('❌ ROIC_API_KEY not found in environment variables');
  process.exit(1);
}

// Rate limiting configuration
const RATE_LIMIT_DELAY = 200; // 200ms between requests (5 requests per second)
const BATCH_SIZE = 10; // Process companies in batches
const MAX_RETRIES = 3;

class ROICBulkIngestionService {
  constructor(options = {}) {
    this.apiKey = ROIC_API_KEY;
    this.baseUrl = ROIC_BASE_URL;
    this.localApiUrl = LOCAL_API_BASE_URL;
    this.batchSize = options.batchSize || BATCH_SIZE;
    this.delay = options.delay || RATE_LIMIT_DELAY;
    this.maxRetries = options.maxRetries || MAX_RETRIES;
    this.limit = options.limit || null; // Limit number of companies to process
    this.forceUpdate = options.forceUpdate || false; // Force update existing companies
    this.existingCompanies = new Set(); // Track already ingested companies
    this.results = {
      total: 0,
      successful: 0,
      failed: 0,
      skipped: 0,
      errors: [],
      data: []
    };
  }

  /**
   * Sleep for specified milliseconds
   */
  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Fetch existing companies from database to avoid duplicates
   */
  async fetchExistingCompanies() {
    try {
      console.log(`📋 Checking existing companies in database...`);

      const response = await fetch(`${this.localApiUrl}/api/screener/companies`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const companies = data.companies || [];

        companies.forEach(company => {
          // Add both symbol and ticker variations to cover all possible formats
          if (company.symbol) this.existingCompanies.add(company.symbol);
          if (company.ticker) this.existingCompanies.add(company.ticker);
        });

        console.log(`✅ Found ${this.existingCompanies.size} existing companies in database`);
      } else {
        console.log(`⚠️  Could not fetch existing companies (${response.status}), will proceed with duplicate checking during ingestion`);
      }
    } catch (error) {
      console.log(`⚠️  Could not fetch existing companies: ${error.message}, will proceed with duplicate checking during ingestion`);
    }
  }

  /**
   * Fetch all NSE company tickers
   */
  async fetchNSECompanies() {
    const url = `${this.baseUrl}/v2/tickers/search/exchange/NSE?apikey=${this.apiKey}`;

    try {
      console.log(`📋 Fetching NSE company list...`);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Stock-Screener-App/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data || !Array.isArray(data)) {
        throw new Error('Invalid response format from NSE tickers API');
      }

      console.log(`✅ Fetched ${data.length} NSE companies`);

      // Extract tickers from the response
      let tickers = data.map(company => {
        // Handle different possible response formats
        if (typeof company === 'string') {
          return company;
        } else if (company && company.ticker) {
          return company.ticker;
        } else if (company && company.symbol) {
          return company.symbol;
        } else if (company && company.code) {
          return company.code;
        }
        return null;
      }).filter(ticker => ticker !== null);

      // Apply limit if specified
      if (this.limit && this.limit > 0) {
        tickers = tickers.slice(0, this.limit);
        console.log(`🎯 Limited to first ${this.limit} companies`);
      }

      return tickers;

    } catch (error) {
      console.error(`❌ Failed to fetch NSE companies: ${error.message}`);
      throw error;
    }
  }

  /**
   * Fetch balance sheet data for a single company with retry logic
   */
  async fetchCompanyData(ticker, retryCount = 0) {
    const url = `${this.baseUrl}/v2/fundamental/balance-sheet/${ticker}?apikey=${this.apiKey}`;

    try {
      console.log(`📊 Fetching balance sheet for ${ticker} (attempt ${retryCount + 1})`);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Stock-Screener-App/1.0'
        }
      });

      if (!response.ok) {
        if (response.status === 429 && retryCount < this.maxRetries) {
          console.log(`⏳ Rate limited for ${ticker}, waiting 3 seconds...`);
          await this.sleep(3000);
          return this.fetchCompanyData(ticker, retryCount + 1);
        }

        if (response.status === 404) {
          throw new Error(`Balance sheet data not found for ${ticker}`);
        }

        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Validate that we got data
      if (!data || (Array.isArray(data) && data.length === 0)) {
        throw new Error(`No balance sheet data available for ${ticker}`);
      }

      console.log(`✅ Successfully fetched balance sheet for ${ticker}`);
      return data;

    } catch (error) {
      if (retryCount < this.maxRetries && !error.message.includes('not found')) {
        console.log(`⚠️  Error fetching ${ticker}, retrying... (${error.message})`);
        await this.sleep(2000 * (retryCount + 1)); // Exponential backoff
        return this.fetchCompanyData(ticker, retryCount + 1);
      }

      console.error(`❌ Failed to fetch ${ticker}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Process a batch of companies
   */
  async processBatch(companies) {
    const batchResults = [];

    for (const ticker of companies) {
      // Check if company already exists and we're not forcing update
      if (!this.forceUpdate && this.existingCompanies.has(ticker)) {
        console.log(`⏭️  Skipping ${ticker} (already exists, use --force-update to override)`);
        this.results.skipped++;
        this.results.total++;
        batchResults.push({ ticker, status: 'skipped', reason: 'already exists' });
        continue;
      }

      try {
        const data = await this.fetchCompanyData(ticker);

        // Normalize data structure - ROIC API might return array or single object
        const normalizedData = Array.isArray(data) ? data : [data];

        // Add each record to our results
        normalizedData.forEach(record => {
          // Ensure ticker is set correctly
          if (record && typeof record === 'object') {
            record.ticker = ticker;
            record.symbol = ticker; // Also set symbol for consistency
            this.results.data.push(record);
          }
        });

        this.results.successful++;
        batchResults.push({ ticker, status: 'success', records: normalizedData.length });

      } catch (error) {
        this.results.failed++;
        this.results.errors.push(`${ticker}: ${error.message}`);
        batchResults.push({ ticker, status: 'error', error: error.message });
      }

      this.results.total++;

      // Rate limiting - wait between requests
      if (this.delay > 0) {
        await this.sleep(this.delay);
      }
    }

    return batchResults;
  }

  /**
   * Fetch data for all companies
   */
  async fetchAllCompanies(companies) {
    console.log(`🚀 Starting bulk balance sheet ingestion for ${companies.length} companies`);
    console.log(`⚙️  Configuration: Batch size=${this.batchSize}, Delay=${this.delay}ms`);

    // Process companies in batches
    for (let i = 0; i < companies.length; i += this.batchSize) {
      const batch = companies.slice(i, i + this.batchSize);
      const batchNumber = Math.floor(i / this.batchSize) + 1;
      const totalBatches = Math.ceil(companies.length / this.batchSize);

      console.log(`\n📦 Processing batch ${batchNumber}/${totalBatches}: ${batch.join(', ')}`);

      try {
        const batchResults = await this.processBatch(batch);

        // Log batch summary
        const successful = batchResults.filter(r => r.status === 'success').length;
        const failed = batchResults.filter(r => r.status === 'error').length;
        const skipped = batchResults.filter(r => r.status === 'skipped').length;
        console.log(`✅ Batch ${batchNumber} completed: ${successful} successful, ${failed} failed, ${skipped} skipped`);

      } catch (error) {
        console.error(`❌ Batch ${batchNumber} failed: ${error.message}`);
      }

      // Wait between batches to be respectful to the API
      if (i + this.batchSize < companies.length) {
        console.log(`⏳ Waiting 2 seconds before next batch...`);
        await this.sleep(2000);
      }
    }

    return this.results;
  }

  /**
   * Save fetched data to file
   */
  async saveDataToFile(filename = 'roic-bulk-data.json') {
    try {
      const filepath = path.join(process.cwd(), filename);
      await fs.promises.writeFile(filepath, JSON.stringify(this.results.data, null, 2));
      console.log(`💾 Data saved to ${filepath}`);
      return filepath;
    } catch (error) {
      console.error(`❌ Failed to save data: ${error.message}`);
      throw error;
    }
  }

  /**
   * Ingest data using the existing database service
   */
  async ingestToDatabase() {
    if (this.results.data.length === 0) {
      console.log('⚠️  No data to ingest');
      return;
    }

    try {
      console.log(`\n🗄️  Starting database ingestion for ${this.results.data.length} records...`);

      if (this.forceUpdate) {
        console.log(`🔄 Force update mode: existing companies will be updated`);
      }

      // Use the existing ingestion API with upsert mode
      const response = await fetch(`${this.localApiUrl}/api/ingest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          source: 'api',
          data: this.results.data,
          upsert: this.forceUpdate // Enable upsert when force updating
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Database ingestion failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log(`✅ Database ingestion completed:`, result);

      return result;

    } catch (error) {
      console.error(`❌ Database ingestion failed: ${error.message}`);

      // Fallback: save data to file for manual ingestion
      console.log(`💾 Saving data to file for manual ingestion...`);
      await this.saveDataToFile('failed-ingestion-data.json');

      throw error;
    }
  }

  /**
   * Print summary of results
   */
  printSummary() {
    console.log(`\n📊 INGESTION SUMMARY`);
    console.log(`===================`);
    console.log(`Total companies processed: ${this.results.total}`);
    console.log(`Successful: ${this.results.successful}`);
    console.log(`Failed: ${this.results.failed}`);
    console.log(`Skipped (already exist): ${this.results.skipped}`);
    console.log(`Total balance sheet records fetched: ${this.results.data.length}`);

    if (this.results.errors.length > 0) {
      console.log(`\n❌ ERRORS (showing first 10):`);
      this.results.errors.slice(0, 10).forEach(error => console.log(`  - ${error}`));
      if (this.results.errors.length > 10) {
        console.log(`  ... and ${this.results.errors.length - 10} more errors`);
      }
    }

    // Show some sample tickers that were successful
    const successfulTickers = this.results.data
      .map(record => record.ticker || record.symbol)
      .filter((ticker, index, arr) => arr.indexOf(ticker) === index)
      .slice(0, 10);

    if (successfulTickers.length > 0) {
      console.log(`\n✅ Sample successful companies: ${successfulTickers.join(', ')}`);
    }

    // Show success rate
    const successRate = this.results.total > 0 ? (this.results.successful / this.results.total * 100).toFixed(1) : 0;
    console.log(`\n📈 Success rate: ${successRate}%`);
  }
}

// Command line interface
async function main() {
  const args = process.argv.slice(2);
  const options = {};

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--limit' && i + 1 < args.length) {
      options.limit = parseInt(args[i + 1], 10);
      i++; // skip next argument
    } else if (arg === '--latest-only') {
      options.latestOnly = true;
    } else if (arg === '--force-update') {
      options.forceUpdate = true;
    } else if (arg === '--help') {
      console.log(`
ROIC Bulk Balance Sheet Ingestion Script

This script fetches balance sheet data for all NSE companies from ROIC API
and ingests it into your database.

Usage:
  node roic-bulk-ingestion.js [options]

Options:
  --limit N         Only process first N companies (useful for testing)
  --latest-only     Only process latest data
  --force-update    Update existing companies (replaces data, prevents duplicates)
  --help            Show this help message

Examples:
  node roic-bulk-ingestion.js
  node roic-bulk-ingestion.js --limit 20
  node roic-bulk-ingestion.js --limit 50 --latest-only
  node roic-bulk-ingestion.js --force-update

Environment Variables:
  ROIC_API_KEY    Required. Your ROIC API key
  ROIC_BASE_URL   Optional. ROIC API base URL (default: https://api.roic.ai)

The script will:
1. Fetch all NSE company tickers
2. Fetch balance sheet data for each company
3. Save data to a backup file
4. Ingest data into your database via the API
      `);
      process.exit(0);
    }
  }

  try {
    console.log(`🚀 ROIC Bulk Balance Sheet Data Ingestion`);
    console.log(`🔑 API Key: ${ROIC_API_KEY.substring(0, 8)}...`);

    if (options.limit) {
      console.log(`🎯 Limiting to first ${options.limit} companies`);
    }

    const service = new ROICBulkIngestionService(options);

    // Step 1: Fetch existing companies from database (for duplicate prevention)
    if (!options.forceUpdate) {
      await service.fetchExistingCompanies();
    }

    // Step 2: Fetch all NSE company tickers
    const companies = await service.fetchNSECompanies();

    if (companies.length === 0) {
      console.error('❌ No companies found from NSE API');
      process.exit(1);
    }

    // Step 3: Fetch balance sheet data for all companies
    const results = await service.fetchAllCompanies(companies);

    // Step 4: Save to file (backup)
    const dataFile = await service.saveDataToFile();

    // Step 5: Print summary
    service.printSummary();

    // Step 6: Ingest to database
    if (results.data.length > 0) {
      console.log(`\n🗄️  Proceeding with database ingestion...`);
      try {
        await service.ingestToDatabase();
        console.log(`\n🎉 Bulk ingestion completed successfully!`);
      } catch (dbError) {
        console.log(`\n⚠️  Database ingestion failed, but data is saved to file`);
        console.log(`📁 You can manually ingest from: ${dataFile}`);
      }
    } else {
      console.log(`\n⚠️  No data to ingest into database`);
    }

    console.log(`📁 Data backed up to: ${dataFile}`);

  } catch (error) {
    console.error(`\n💥 Bulk ingestion failed:`, error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { ROICBulkIngestionService };