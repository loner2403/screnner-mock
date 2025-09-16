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

const CACHE_DURATION = 0 * 1000; // 0 second for immediate testing

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
      
      // Extract sector from API response if not provided
      let effectiveSector = sector;
      if (!effectiveSector && Array.isArray(apiResponse)) {
        const sectorField = apiResponse.find(item => item.id === 'sector-i18n-en' || item.id === 'sector');
        if (sectorField) {
          effectiveSector = sectorField.value;
        }
      }
      
      const companyType = detectCompanyType(effectiveSector, apiResponse);

      // Calculate revenue from quarterly data using Indian FY structure
      let calculatedRevenue: number[] | null = null;
      try {
        const quarterlyResponse = await fetch(`/api/quarterly/${symbol}`);
        if (quarterlyResponse.ok) {
          const quarterlyData = await quarterlyResponse.json();
          const revenueQuarterly = quarterlyData.total_revenue_fq_h || quarterlyData.revenue_fq_h;
          const fiscalPeriodEnds = quarterlyData.fiscal_period_end_fq_h;

          if (Array.isArray(revenueQuarterly) && Array.isArray(fiscalPeriodEnds) && revenueQuarterly.length >= 4) {
            // Convert timestamps to dates and create quarter info
            const quarters = revenueQuarterly.map((revenue: number, index: number) => {
              const endDate = new Date(fiscalPeriodEnds[index] * 1000);
              const month = endDate.getMonth() + 1; // 1-12
              const year = endDate.getFullYear();

              // Determine FY year based on quarter end date
              // Indian FY: Apr-Mar, so if quarter ends in Jan-Mar, it belongs to that year's FY
              // If quarter ends in Apr-Dec, it belongs to next year's FY
              let fyYear: number;
              if (month >= 1 && month <= 3) {
                // Jan-Mar quarter belongs to current year's FY
                fyYear = year;
              } else {
                // Apr-Dec quarters belong to next year's FY
                fyYear = year + 1;
              }

              return {
                revenue,
                endDate,
                month,
                year,
                fyYear,
                quarterType: month === 3 ? 'Q4' : month === 6 ? 'Q1' : month === 9 ? 'Q2' : month === 12 ? 'Q3' : 'Unknown'
              };
            });

            console.log('Quarter mapping for', symbol);
            quarters.slice(0, 8).forEach((q, i) => {
              console.log(`  ${i}: ${q.quarterType} FY${q.fyYear} - ${q.endDate.toISOString().split('T')[0]} - Revenue: ${q.revenue}`);
            });

            // Group quarters by FY year
            const fyGroups = new Map<number, typeof quarters>();
            quarters.forEach(quarter => {
              if (!fyGroups.has(quarter.fyYear)) {
                fyGroups.set(quarter.fyYear, []);
              }
              fyGroups.get(quarter.fyYear)!.push(quarter);
            });

            // Calculate annual revenues for each complete FY (must have 4 quarters)
            const annualRevenues: number[] = [];
            const sortedFYYears = Array.from(fyGroups.keys()).sort((a, b) => b - a); // Latest first

            for (const fyYear of sortedFYYears) {
              const fyQuarters = fyGroups.get(fyYear)!;
              if (fyQuarters.length === 4) {
                const yearRevenue = fyQuarters.reduce((sum, quarter) => sum + (quarter.revenue || 0), 0);
                annualRevenues.push(yearRevenue);
                console.log(`  FY${fyYear}: ${yearRevenue} (from ${fyQuarters.length} quarters)`);
              } else {
                console.log(`  FY${fyYear}: Incomplete (${fyQuarters.length} quarters) - skipping`);
              }
            }

            calculatedRevenue = annualRevenues;
            console.log(`Calculated ${annualRevenues.length} complete FY revenues from ${revenueQuarterly.length} quarters for ${symbol}`);
          }
        }
      } catch (error) {
        console.error('Failed to calculate revenue from quarterly data:', error);
      }

      const processedData = processProfitAndLossData(apiResponse, companyType, calculatedRevenue || undefined);

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