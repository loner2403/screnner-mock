import { useState, useEffect, useCallback } from 'react';
import { fetchProfitAndLossData } from '@/lib/api';
import { 
  ProcessedProfitAndLossData, 
  ProfitAndLossResultsError, 
} from './types';
import { detectCompanyType, processProfitAndLossData, validateApiResponse } from './utils';

interface UseProfitAndLossDataResult {
  data: ProcessedProfitAndLossData | null;
  loading: boolean;
  error: ProfitAndLossResultsError | null;
  refetch: () => void;
}

const dataCache = new Map<string, {
  data: ProcessedProfitAndLossData;
  timestamp: number;
}>();

const CACHE_DURATION = 10 * 1000; // 10 seconds for testing

export function useProfitAndLossData(
  symbol: string, 
  sector?: string
): UseProfitAndLossDataResult {
  const [data, setData] = useState<ProcessedProfitAndLossData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ProfitAndLossResultsError | null>(null);

  const fetchData = useCallback(async () => {
    if (!symbol) {
      setError({
        type: 'invalid-data',
        message: 'Symbol is required',
        details: 'No symbol provided for profit and loss data fetch'
      });
      setLoading(false);
      return;
    }

    const cacheKey = symbol.toUpperCase();
    const cached = dataCache.get(cacheKey);
    const now = Date.now();

    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      setData(cached.data);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const apiResponse = await fetchProfitAndLossData(symbol);

      if (!validateApiResponse(apiResponse)) {
        throw new Error('Invalid API response format');
      }
      
      const companyType = detectCompanyType(sector, apiResponse);

      const processedData = processProfitAndLossData(apiResponse, companyType);

      dataCache.set(cacheKey, {
        data: processedData,
        timestamp: now
      });

      setData(processedData);
      setError(null);

    } catch (err) {
      let errorType: ProfitAndLossResultsError['type'] = 'network';
      let errorMessage = 'Failed to load profit and loss data';
      let errorDetails = '';

      if (err instanceof Error) {
        errorDetails = err.message;
        
        if (err.message.includes('not found') || err.message.includes('404')) {
          errorType = 'not-found';
          errorMessage = 'Profit and loss data not available for this company';
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
    const cacheKey = symbol.toUpperCase();
    dataCache.delete(cacheKey);
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