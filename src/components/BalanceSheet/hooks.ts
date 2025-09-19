// Custom hooks for balance sheet data fetching
import { useState, useEffect, useCallback } from 'react';
import { fetchBalanceSheetData } from '@/lib/api';
import { 
  ProcessedBalanceSheetData, 
  BalanceSheetError, 
  InsightSentryBalanceSheetResponse 
} from './types';
import { detectCompanyType, processBalanceSheetData, validateApiResponse } from './utils';

interface UseBalanceSheetDataResult {
  data: ProcessedBalanceSheetData | null;
  loading: boolean;
  error: BalanceSheetError | null;
  refetch: () => void;
}

// Cache for balance sheet data to avoid repeated API calls
const dataCache = new Map<string, {
  data: ProcessedBalanceSheetData;
  timestamp: number;
}>();

const CACHE_DURATION = 1 * 1000; // 1 second for testing to avoid caching issues

export function useBalanceSheetData(
  symbol: string, 
  sector?: string
): UseBalanceSheetDataResult {
  const [data, setData] = useState<ProcessedBalanceSheetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<BalanceSheetError | null>(null);

  const fetchData = useCallback(async () => {
    if (!symbol) {
      setError({
        type: 'invalid-data',
        message: 'Symbol is required',
        details: 'No symbol provided for balance sheet data fetch'
      });
      setLoading(false);
      return;
    }

    // Clear cache for HDFCBANK for testing
    if (symbol.toUpperCase().includes('HDFCBANK')) {
      console.log('Clearing balance sheet cache for', symbol);
      dataCache.clear();
    }

    // Check cache first
    const cacheKey = symbol.toUpperCase();
    const cached = dataCache.get(cacheKey);
    const now = Date.now();

    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      console.log('Using cached balance sheet data for', symbol);
      setData(cached.data);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Fetching balance sheet data for', symbol);
      const apiResponse = await fetchBalanceSheetData(symbol);

      // Validate API response
      if (!validateApiResponse(apiResponse)) {
        throw new Error('Invalid API response format');
      }

      // Detect company type
      console.log('Sector passed to detectCompanyType:', sector);
      console.log('API response keys:', Object.keys(apiResponse));
      console.log('API response sector:', (apiResponse as any).sector);
      
      // Use sector from API response if available, fallback to passed sector
      // Check multiple possible sector field names
      const apiSector = (apiResponse as any)['sector-i18n-en'] || 
                        (apiResponse as any).sector || 
                        (apiResponse as any)['industry-i18n-en'];
      const effectiveSector = apiSector || sector;
      console.log('API sector fields:', {
        'sector-i18n-en': (apiResponse as any)['sector-i18n-en'],
        'sector': (apiResponse as any).sector,
        'industry-i18n-en': (apiResponse as any)['industry-i18n-en'],
        'report_type': (apiResponse as any).report_type
      });
      console.log('Effective sector for detection:', effectiveSector);
      
      const companyType = detectCompanyType(effectiveSector, apiResponse);
      console.log('Detected company type:', companyType, 'for symbol:', symbol, 'with effective sector:', effectiveSector);

      // Process the data
      const processedData = processBalanceSheetData(apiResponse, companyType);

      // Cache the processed data
      dataCache.set(cacheKey, {
        data: processedData,
        timestamp: now
      });

      setData(processedData);
      setError(null);

    } catch (err) {
      console.error('Error fetching balance sheet data:', err);
      
      let errorType: BalanceSheetError['type'] = 'network';
      let errorMessage = 'Failed to load balance sheet data';
      let errorDetails = '';

      if (err instanceof Error) {
        errorDetails = err.message;
        
        if (err.message.includes('not found') || err.message.includes('404')) {
          errorType = 'not-found';
          errorMessage = 'Balance sheet data not available for this company';
        } else if (err.message.includes('rate limit') || err.message.includes('429')) {
          errorType = 'network';
          errorMessage = 'Too many requests. Please try again later.';
        } else if (err.message.includes('Invalid API response')) {
          errorType = 'invalid-data';
          errorMessage = 'Invalid data format received';
        }
      }

      setError({
        type: errorType,
        message: errorMessage,
        details: errorDetails
      });
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [symbol, sector]);

  const refetch = useCallback(() => {
    // Clear cache for this symbol
    const cacheKey = symbol.toUpperCase();
    dataCache.delete(cacheKey);
    
    // Refetch data
    fetchData();
  }, [fetchData, symbol]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch
  };
}

// Hook for managing multiple balance sheet data requests (for comparison)
export function useMultipleBalanceSheetData(symbols: string[], sector?: string) {
  const [dataMap, setDataMap] = useState<Map<string, ProcessedBalanceSheetData>>(new Map());
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Map<string, BalanceSheetError>>(new Map());

  const fetchMultipleData = useCallback(async () => {
    if (symbols.length === 0) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const newDataMap = new Map<string, ProcessedBalanceSheetData>();
    const newErrors = new Map<string, BalanceSheetError>();

    await Promise.allSettled(
      symbols.map(async (symbol) => {
        try {
          const apiResponse = await fetchBalanceSheetData(symbol);
          
          if (validateApiResponse(apiResponse)) {
            const companyType = detectCompanyType(sector, apiResponse);
            const processedData = processBalanceSheetData(apiResponse, companyType);
            newDataMap.set(symbol, processedData);
          }
        } catch (err) {
          newErrors.set(symbol, {
            type: 'network',
            message: `Failed to load data for ${symbol}`,
            details: err instanceof Error ? err.message : 'Unknown error'
          });
        }
      })
    );

    setDataMap(newDataMap);
    setErrors(newErrors);
    setLoading(false);
  }, [symbols, sector]);

  useEffect(() => {
    fetchMultipleData();
  }, [fetchMultipleData]);

  return {
    dataMap,
    loading,
    errors,
    refetch: fetchMultipleData
  };
}

// Clear all cached data (useful for memory management)
export function clearBalanceSheetDataCache(): void {
  dataCache.clear();
  console.log('Balance sheet data cache cleared');
}

// Get cache statistics
export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: dataCache.size,
    keys: Array.from(dataCache.keys())
  };
}