'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { QuarterlyResultsProps } from './types';

// Types for the API response
interface QuarterlyApiResponse {
  // Non-banking fields
  revenue_fq_h?: number[];
  total_oper_expense_fq_h?: number[];
  oper_income_fq_h?: number[];
  operating_margin_fq_h?: number[];
  non_oper_income_fq_h?: number[];
  depreciation_fq_h?: number[];
  
  // Banking fields
  total_revenue_fq_h?: number[];
  interest_income_fq_h?: number[];
  interest_income_net_fq_h?: number[];
  net_interest_margin_fq_h?: number[];
  non_interest_income_fq_h?: number[];
  
  // Common fields
  pretax_income_fq_h?: number[];
  net_income_fq_h?: number[];
  earnings_per_share_basic_fq_h?: number[];
  tax_rate_fq_h?: number[];
  interest_fq_h?: number[];
  
  // Meta info
  quarters_info?: {
    dates: string[];
    periods: string[];
  };
  sector?: string;
}

interface MetricConfig {
  key: keyof QuarterlyApiResponse;
  label: string;
  type: 'currency' | 'percentage' | 'number';
}

const QuarterlyResultsTable: React.FC<QuarterlyResultsProps> = ({
  symbol,
  companyName,
  sector,
  className = ''
}) => {
  const [data, setData] = useState<QuarterlyApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Determine if company is banking based on sector
  const isBankingCompany = useCallback((apiSector?: string): boolean => {
    const checkSector = apiSector || sector || '';
    const sectorLower = checkSector.toLowerCase();
    return (
      sectorLower.includes('bank') ||
      sectorLower.includes('financial') ||
      sectorLower.includes('finance') ||
      symbol.toUpperCase().includes('BANK') ||
      symbol.toUpperCase().includes('HDFC') ||
      symbol.toUpperCase().includes('ICICI')
    );
  }, [sector, symbol]);

  // Get metrics configuration based on company type
  const getMetrics = useCallback((isBank: boolean): MetricConfig[] => {
    if (isBank) {
      return [
        { key: 'total_revenue_fq_h', label: 'Total Revenue', type: 'currency' },
        { key: 'interest_income_fq_h', label: 'Interest Income', type: 'currency' },
        { key: 'interest_income_net_fq_h', label: 'Net Interest Income', type: 'currency' },
        { key: 'net_interest_margin_fq_h', label: 'Net Interest Margin (%)', type: 'percentage' },
        { key: 'non_interest_income_fq_h', label: 'Non-Interest Income', type: 'currency' },
        { key: 'pretax_income_fq_h', label: 'Pre-Tax Profit', type: 'currency' },
        { key: 'tax_rate_fq_h', label: 'Tax Rate (%)', type: 'percentage' },
        { key: 'net_income_fq_h', label: 'Net Profit', type: 'currency' },
        { key: 'earnings_per_share_basic_fq_h', label: 'EPS (₹)', type: 'number' },
      ];
    } else {
      return [
        { key: 'revenue_fq_h', label: 'Sales / Revenue', type: 'currency' },
        { key: 'total_oper_expense_fq_h', label: 'Operating Expenses', type: 'currency' },
        { key: 'oper_income_fq_h', label: 'Operating Profit', type: 'currency' },
        { key: 'operating_margin_fq_h', label: 'OPM (%)', type: 'percentage' },
        { key: 'non_oper_income_fq_h', label: 'Other Income', type: 'currency' },
        { key: 'depreciation_fq_h', label: 'Depreciation', type: 'currency' },
        { key: 'interest_fq_h', label: 'Interest', type: 'currency' },
        { key: 'pretax_income_fq_h', label: 'Pre-Tax Profit', type: 'currency' },
        { key: 'tax_rate_fq_h', label: 'Tax Rate (%)', type: 'percentage' },
        { key: 'net_income_fq_h', label: 'Net Profit', type: 'currency' },
        { key: 'earnings_per_share_basic_fq_h', label: 'EPS (₹)', type: 'number' },
      ];
    }
  }, []);

  // Format values based on type
  const formatValue = useCallback((value: number | null | undefined, type: string): string => {
    if (value === null || value === undefined || isNaN(value)) {
      return '-';
    }

    switch (type) {
      case 'currency':
        // Format as Indian currency in crores
        return new Intl.NumberFormat('en-IN', {
          maximumFractionDigits: 0,
          minimumFractionDigits: 0
        }).format(Math.abs(value));
      
      case 'percentage':
        return `${Math.round(value)}%`;
      
      case 'number':
        return value.toFixed(2);
      
      default:
        return String(value);
    }
  }, []);

  // Generate quarter labels from dates
  const generateQuarterLabels = useCallback((dates: string[]): string[] => {
    if (!dates || dates.length === 0) return [];
    
    return dates.map(dateStr => {
      try {
        const date = new Date(dateStr);
        const month = date.getMonth();
        const year = date.getFullYear();
        
        if (month >= 0 && month <= 2) {
          return `Mar ${year}`;
        } else if (month >= 3 && month <= 5) {
          return `Jun ${year}`;
        } else if (month >= 6 && month <= 8) {
          return `Sep ${year}`;
        } else {
          return `Dec ${year}`;
        }
      } catch {
        return dateStr;
      }
    });
  }, []);

  // Fetch quarterly data
  useEffect(() => {
    if (!symbol) {
      console.warn('QuarterlyResultsTable: No symbol provided');
      return;
    }

    const fetchQuarterlyData = async () => {
      setLoading(true);
      setError(null);
      setData(null); // Clear previous data

      try {
        // Clean the symbol - remove exchange prefix if present (e.g., NSE:, BSE:)
        let cleanSymbol = symbol;
        if (symbol.includes(':')) {
          cleanSymbol = symbol.split(':')[1];
        }
        
        // Add cache buster to prevent stale data
        const timestamp = Date.now();
        const url = `/api/quarterly/${cleanSymbol}?_t=${timestamp}`;
        
        console.log(`QuarterlyResultsTable: Fetching data for ${cleanSymbol} (original: ${symbol})`);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          cache: 'no-store' // Force no caching
        });

        if (!response.ok) {
          throw new Error(`API returned ${response.status}`);
        }

        const apiData = await response.json();
        
        // Log for debugging
        console.log('QuarterlyResultsTable: Received data:', {
          symbol,
          hasRevenue: !!apiData.revenue_fq_h,
          hasTotalRevenue: !!apiData.total_revenue_fq_h,
          sector: apiData.sector,
          firstRevenue: apiData.revenue_fq_h?.[0] || apiData.total_revenue_fq_h?.[0],
          quartersCount: apiData.quarters_info?.dates?.length
        });

        // Validate data
        if (!apiData.quarters_info?.dates || apiData.quarters_info.dates.length === 0) {
          throw new Error('No quarterly data available');
        }

        setData(apiData);
      } catch (err) {
        console.error('QuarterlyResultsTable: Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load quarterly data');
      } finally {
        setLoading(false);
      }
    };

    fetchQuarterlyData();
  }, [symbol]); // Only re-fetch when symbol changes

  // Loading state
  if (loading) {
    return (
      <div className={`w-full ${className}`}>
        <div className="bg-white border border-gray-200 rounded-lg p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-3">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded w-full"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`w-full ${className}`}>
        <div className="bg-white border border-red-200 rounded-lg p-8">
          <div className="text-center">
            <p className="text-red-600 mb-4">Failed to load quarterly results</p>
            <p className="text-sm text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No data state
  if (!data || !data.quarters_info?.dates) {
    return (
      <div className={`w-full ${className}`}>
        <div className="bg-white border border-gray-200 rounded-lg p-8">
          <p className="text-center text-gray-500">No quarterly data available</p>
        </div>
      </div>
    );
  }

  // Determine company type and get metrics
  const isBank = isBankingCompany(data.sector);
  const metrics = getMetrics(isBank);
  const quarterLabels = generateQuarterLabels(data.quarters_info.dates);

  // Filter out metrics that have no data
  const visibleMetrics = metrics.filter(metric => {
    const values = data[metric.key] as number[] | undefined;
    return values && values.some(v => v !== null && v !== undefined);
  });

  return (
    <div className={`w-full ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Quarterly Results</h2>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>Consolidated Figures in Rs. Crores</span>
          {data.sector && (
            <>
              <span className="text-gray-400">|</span>
              <span className="text-gray-700">{data.sector}</span>
            </>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                  Metric
                </th>
                {quarterLabels.map((label, idx) => (
                  <th
                    key={`quarter-${idx}`}
                    className="px-3 py-3 text-center text-xs font-medium text-gray-700 min-w-[100px]"
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            
            <tbody className="bg-white divide-y divide-gray-200">
              {visibleMetrics.map((metric, rowIdx) => {
                const values = data[metric.key] as number[] | undefined;
                
                return (
                  <tr key={metric.key} className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-700 whitespace-nowrap sticky left-0 bg-inherit z-10">
                      {metric.label}
                    </td>
                    
                    {quarterLabels.map((_, colIdx) => {
                      const value = values?.[colIdx];
                      const isNegative = typeof value === 'number' && value < 0;
                      
                      return (
                        <td
                          key={`${metric.key}-${colIdx}`}
                          className={`px-3 py-3 text-sm text-right whitespace-nowrap ${
                            isNegative ? 'text-red-600' : 'text-gray-900'
                          }`}
                        >
                          {formatValue(value, metric.type)}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
          <div className="text-xs text-gray-500 space-y-1">
            <p>All figures in Rs. Crores unless otherwise specified</p>
            {isBank ? (
              <p>* NIM = Net Interest Margin | EPS = Earnings Per Share</p>
            ) : (
              <p>* OPM = Operating Profit Margin | EPS = Earnings Per Share</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuarterlyResultsTable;
