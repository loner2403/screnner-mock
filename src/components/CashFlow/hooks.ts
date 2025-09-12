// Custom hooks for cash flow data fetching
import { useState, useEffect, useCallback } from 'react';
import { 
  ProcessedCashFlowData, 
  CashFlowError, 
  InsightSentryCashFlowResponse 
} from './types';
import { detectCompanyType, processCashFlowData, validateApiResponse } from './utils';

interface UseCashFlowDataResult {
  data: ProcessedCashFlowData | null;
  loading: boolean;
  error: CashFlowError | null;
  refetch: () => void;
}

// Cache for cash flow data to avoid repeated API calls
const dataCache = new Map<string, {
  data: ProcessedCashFlowData;
  timestamp: number;
}>();

const CACHE_DURATION = 10 * 1000; // 10 seconds for testing

export function useCashFlowData(
  symbol: string, 
  sector?: string
): UseCashFlowDataResult {
  const [data, setData] = useState<ProcessedCashFlowData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<CashFlowError | null>(null);

  const fetchData = useCallback(async () => {
    if (!symbol) {
      setError({
        type: 'invalid-data',
        message: 'Symbol is required',
        details: 'No symbol provided for cash flow data fetch'
      });
      setLoading(false);
      return;
    }

    // Clear cache for HDFCBANK for testing
    if (symbol.toUpperCase().includes('HDFCBANK')) {
      console.log('Clearing cash flow cache for', symbol);
      dataCache.clear();
    }

    // Check cache first
    const cacheKey = `${symbol.toUpperCase()}_CASH_FLOW`;
    const cached = dataCache.get(cacheKey);
    const now = Date.now();

    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      console.log('Using cached cash flow data for', symbol);
      setData(cached.data);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Fetching cash flow data for', symbol);
      // Use the dedicated cash flow API endpoint
      const response = await fetch(`/api/cashflow/${encodeURIComponent(symbol.toUpperCase())}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch cash flow data: ${response.status}`);
      }

      const apiResponse = await response.json();

      // Validate API response
      if (!validateApiResponse(apiResponse)) {
        throw new Error('Invalid API response format');
      }

      // Detect company type
      console.log('Sector passed to detectCompanyType:', sector);
      console.log('API response keys:', Object.keys(apiResponse));
      console.log('API response sector:', (apiResponse as any).sector);
      
      // Use sector from API response if available, fallback to passed sector
      const apiSector = (apiResponse as any)['sector-i18n-en'] || 
                        (apiResponse as any).sector || 
                        (apiResponse as any)['industry-i18n-en'];
      const effectiveSector = apiSector || sector;
      console.log('Effective sector for detection:', effectiveSector);
      
      const companyType = detectCompanyType(effectiveSector, apiResponse);
      console.log('Detected company type:', companyType, 'for symbol:', symbol, 'with effective sector:', effectiveSector);

      // Process the data
      const processedData = processCashFlowData(apiResponse, companyType);

      // Cache the processed data
      dataCache.set(cacheKey, {
        data: processedData,
        timestamp: now
      });

      setData(processedData);
      setError(null);

    } catch (err) {
      console.error('Error fetching cash flow data:', err);
      
      let errorType: CashFlowError['type'] = 'network';
      let errorMessage = 'Failed to load cash flow data';
      let errorDetails = '';

      if (err instanceof Error) {
        errorDetails = err.message;
        
        if (err.message.includes('not found') || err.message.includes('404')) {
          errorType = 'not-found';
          errorMessage = 'Cash flow data not available for this company';
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
    const cacheKey = `${symbol.toUpperCase()}_CASH_FLOW`;
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

// Hook for managing multiple cash flow data requests (for comparison)
export function useMultipleCashFlowData(symbols: string[], sector?: string) {
  const [dataMap, setDataMap] = useState<Map<string, ProcessedCashFlowData>>(new Map());
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Map<string, CashFlowError>>(new Map());

  const fetchMultipleData = useCallback(async () => {
    if (symbols.length === 0) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const newDataMap = new Map<string, ProcessedCashFlowData>();
    const newErrors = new Map<string, CashFlowError>();

    await Promise.allSettled(
      symbols.map(async (symbol) => {
        try {
          const response = await fetch(`/api/cashflow/${encodeURIComponent(symbol.toUpperCase())}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const apiResponse = await response.json();
            
            if (validateApiResponse(apiResponse)) {
              const companyType = detectCompanyType(sector, apiResponse);
              const processedData = processCashFlowData(apiResponse, companyType);
              newDataMap.set(symbol, processedData);
            }
          }
        } catch (err) {
          newErrors.set(symbol, {
            type: 'network',
            message: `Failed to load cash flow data for ${symbol}`,
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
export function clearCashFlowDataCache(): void {
  dataCache.clear();
  console.log('Cash flow data cache cleared');
}

// Get cache statistics
export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: dataCache.size,
    keys: Array.from(dataCache.keys())
  };
}