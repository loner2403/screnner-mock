// Currency conversion utilities
export interface ExchangeRates {
  USD: number;
  INR: number;
  [key: string]: number;
}

// Cache for exchange rates (valid for 1 hour)
let exchangeRateCache: {
  rates: ExchangeRates | null;
  timestamp: number;
} = {
  rates: null,
  timestamp: 0
};

const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

// Fallback exchange rate (approximate - updated periodically)
const FALLBACK_USD_TO_INR = 84.5;

/**
 * Fetch exchange rate from primary API
 */
async function fetchFromPrimaryAPI(): Promise<number | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD', {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Stock-App/1.0'
      }
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      const rate = data.rates?.INR;

      if (typeof rate === 'number' && rate > 0) {
        return rate;
      }
    }
  } catch (error) {
    // Silently fail
  }

  return null;
}

/**
 * Fetch exchange rate from backup API
 */
async function fetchFromBackupAPI(): Promise<number | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

    // Using fixer.io free tier as backup
    const response = await fetch('https://api.fixer.io/latest?base=USD&symbols=INR', {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Stock-App/1.0'
      }
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      const rate = data.rates?.INR;

      if (typeof rate === 'number' && rate > 0) {
        return rate;
      }
    }
  } catch (error) {
    // Silently fail
  }

  return null;
}

/**
 * Get current USD to INR exchange rate
 * Uses multiple APIs with fallback to cached/approximate rate
 */
export async function getUSDToINRRate(): Promise<number> {
  const now = Date.now();

  // Return cached rate if still valid
  if (exchangeRateCache.rates && (now - exchangeRateCache.timestamp) < CACHE_DURATION) {
    return exchangeRateCache.rates.INR / exchangeRateCache.rates.USD;
  }

  // Try primary API
  let rate = await fetchFromPrimaryAPI();

  // Try backup API if primary fails
  if (!rate) {
    rate = await fetchFromBackupAPI();
  }

  // Cache successful result
  if (rate) {
    exchangeRateCache = {
      rates: { USD: 1, INR: rate },
      timestamp: now
    };
    return rate;
  }

  // Try to use expired cached rate if available
  if (exchangeRateCache.rates && exchangeRateCache.rates.INR > 0) {
    return exchangeRateCache.rates.INR;
  }

  // Final fallback to approximate rate (silently)
  return FALLBACK_USD_TO_INR;
}

/**
 * Convert USD amount to INR
 */
export async function convertUSDToINR(usdAmount: number): Promise<number> {
  if (typeof usdAmount !== 'number' || isNaN(usdAmount)) {
    return 0;
  }

  const rate = await getUSDToINRRate();
  return usdAmount * rate;
}

/**
 * Convert multiple USD values to INR
 */
export async function convertMultipleUSDToINR(values: Record<string, number>): Promise<Record<string, number>> {
  const rate = await getUSDToINRRate();
  const converted: Record<string, number> = {};

  for (const [key, value] of Object.entries(values)) {
    converted[key] = typeof value === 'number' && !isNaN(value) ? value * rate : value;
  }

  return converted;
}

/**
 * Fields that should be converted from USD to INR
 */
export const CURRENCY_FIELDS = [
  'market_cap'
];

/**
 * Convert only market cap from USD to INR (keeping stock prices in USD)
 */
export async function convertStockDataToINR(stockData: any): Promise<any> {
  if (!stockData || typeof stockData !== 'object') {
    return stockData;
  }

  // Only convert market cap if it's in USD
  if (stockData.fundamental_currency === 'USD' && typeof stockData.market_cap === 'number' && !isNaN(stockData.market_cap)) {
    try {
      const rate = await getUSDToINRRate();
      const converted = { ...stockData };

      // Convert only market cap to INR
      converted.market_cap = stockData.market_cap * rate;

      // Add metadata to indicate market cap is in INR while prices remain in USD
      converted.market_cap_currency = 'INR';

      return converted;
    } catch (error) {
      // If conversion fails, return original data
      if (process.env.NODE_ENV === 'development') {
        console.warn('Currency conversion failed, using original values:', error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error));
      }
      return stockData;
    }
  }

  // Return as-is if no conversion needed
  return stockData;
}

/**
 * Convert a single USD market cap value to INR
 */
export async function convertMarketCapToINR(marketCapUSD: number): Promise<number> {
  if (typeof marketCapUSD !== 'number' || isNaN(marketCapUSD)) {
    return marketCapUSD;
  }

  const rate = await getUSDToINRRate();
  return marketCapUSD * rate;
}


