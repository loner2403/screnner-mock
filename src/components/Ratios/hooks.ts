// src/components/Ratios/hooks.ts

import { useState, useEffect, useCallback } from 'react';
import { fetchRatiosData } from '@/lib/api';
import { 
  ProcessedRatiosData, 
  RatiosError, 
  InsightSentryRatiosResponse 
} from './types';
import { detectCompanyType, processRatiosData, validateApiResponse } from './utils';

interface UseRatiosDataResult {
  data: ProcessedRatiosData | null;
  loading: boolean;
  error: RatiosError | null;
  refetch: () => void;
}

const dataCache = new Map<string, {
  data: ProcessedRatiosData;
  timestamp: number;
}>();

const CACHE_DURATION = 10 * 1000; // 10 seconds

export function useRatiosData(
  symbol: string, 
  sector?: string
): UseRatiosDataResult {
  const [data, setData] = useState<ProcessedRatiosData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<RatiosError | null>(null);

  const fetchData = useCallback(async () => {
    if (!symbol) {
      setError({
        type: 'invalid-data',
        message: 'Symbol is required',
        details: 'No symbol provided for ratios data fetch'
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
      const apiResponse = await fetchRatiosData(symbol);

      if (!validateApiResponse(apiResponse)) {
        throw new Error('Invalid API response format for ratios');
      }

      const apiSector = (apiResponse as any)['sector-i18n-en'] || (apiResponse as any).sector;
      const effectiveSector = apiSector || sector;
      
      const companyType = detectCompanyType(effectiveSector, apiResponse);

      const processedData = processRatiosData(apiResponse, companyType);

      dataCache.set(cacheKey, {
        data: processedData,
        timestamp: now
      });

      setData(processedData);
      setError(null);

    } catch (err) {
      let errorType: RatiosError['type'] = 'network';
      let errorMessage = 'Failed to load ratios data';
      let errorDetails = '';

      if (err instanceof Error) {
        errorDetails = err.message;
        if (err.message.includes('not found')) {
          errorType = 'not-found';
          errorMessage = 'Ratios data not available for this company';
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
