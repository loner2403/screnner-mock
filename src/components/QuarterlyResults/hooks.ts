// Custom hooks for quarterly results data fetching
import { useState, useEffect, useCallback } from 'react';
import { fetchQuarterlyData } from '@/lib/api';
import { 
  ProcessedQuarterlyData, 
  QuarterlyResultsError, 
  InsightSentryQuarterlyResponse 
} from './types';
import { detectCompanyType, processQuarterlyData, validateApiResponse } from './utils';

interface UseQuarterlyDataResult {
  data: ProcessedQuarterlyData | null;
  loading: boolean;
  error: QuarterlyResultsError | null;
  refetch: () => void;
}

// Cache for quarterly data to avoid repeated API calls
const dataCache = new Map<string, {
  data: ProcessedQuarterlyData;
  timestamp: number;
}>();

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function useQuarterlyData(
  symbol: string, 
  sector?: string
): UseQuarterlyDataResult {
  const [data, setData] = useState<ProcessedQuarterlyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<QuarterlyResultsError | null>(null);

  const fetchData = useCallback(async () => {
    if (!symbol) {
      setError({
        type: 'invalid-data',
        message: 'Symbol is required',
        details: 'No symbol provided for quarterly data fetch'
      });
      setLoading(false);
      return;
    }

    // Check cache first
    const cacheKey = symbol.toUpperCase();
    const cached = dataCache.get(cacheKey);
    const now = Date.now();

    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      console.log('Using cached quarterly data for', symbol);
      setData(cached.data);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Fetching quarterly data for', symbol);
      const apiResponse = await fetchQuarterlyData(symbol);

      // Validate API response
      if (!validateApiResponse(apiResponse)) {
        throw new Error('Invalid API response format');
      }

      // Detect company type
      const companyType = detectCompanyType(sector, apiResponse);
      console.log('Detected company type:', companyType, 'for', symbol);

      // Process the data
      const processedData = processQuarterlyData(apiResponse, companyType);

      // Cache the processed data
      dataCache.set(cacheKey, {
        data: processedData,
        timestamp: now
      });

      setData(processedData);
      setError(null);

    } catch (err) {
      console.error('Error fetching quarterly data:', err);
      
      let errorType: QuarterlyResultsError['type'] = 'network';
      let errorMessage = 'Failed to load quarterly data';
      let errorDetails = '';

      if (err instanceof Error) {
        errorDetails = err.message;
        
        if (err.message.includes('not found') || err.message.includes('404')) {
          errorType = 'not-found';
          errorMessage = 'Quarterly data not available for this company';
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

// Hook for managing multiple quarterly data requests (for comparison)
export function useMultipleQuarterlyData(symbols: string[], sector?: string) {
  const [dataMap, setDataMap] = useState<Map<string, ProcessedQuarterlyData>>(new Map());
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Map<string, QuarterlyResultsError>>(new Map());

  const fetchMultipleData = useCallback(async () => {
    if (symbols.length === 0) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const newDataMap = new Map<string, ProcessedQuarterlyData>();
    const newErrors = new Map<string, QuarterlyResultsError>();

    await Promise.allSettled(
      symbols.map(async (symbol) => {
        try {
          const apiResponse = await fetchQuarterlyData(symbol);
          
          if (validateApiResponse(apiResponse)) {
            const companyType = detectCompanyType(sector, apiResponse);
            const processedData = processQuarterlyData(apiResponse, companyType);
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
export function clearQuarterlyDataCache(): void {
  dataCache.clear();
  console.log('Quarterly data cache cleared');
}

// Get cache statistics
export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: dataCache.size,
    keys: Array.from(dataCache.keys())
  };
}