'use client';

import React, { useState, useEffect } from 'react';
import { QuarterlyResultsProps, QuarterlyData, CompanyType } from './types';
import { detectCompanyType, getMetricConfig } from './config';
import { generateQuarterLabels, formatValue } from './utils';

const QuarterlyResultsTable: React.FC<QuarterlyResultsProps> = ({
  symbol,
  companyName,
  sector,
  className = ''
}) => {
  const [data, setData] = useState<QuarterlyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      console.log('QuarterlyResultsTable: Starting fetch for symbol:', symbol);
      setLoading(true);
      setError(null);

      try {
        // Add timestamp to prevent caching
        const timestamp = new Date().getTime();
        const url = `/api/quarterly/${symbol}?t=${timestamp}`;
        console.log('QuarterlyResultsTable: Fetching from URL:', url);
        
        const response = await fetch(url, {
          cache: 'no-cache',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        console.log('QuarterlyResultsTable: Response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.status}`);
        }

        const apiData = await response.json();
        console.log('QuarterlyResultsTable: API Response:', apiData);
        console.log('QuarterlyResultsTable: Response keys:', Object.keys(apiData));
        console.log('QuarterlyResultsTable: Has revenue_fq_h?', !!apiData.revenue_fq_h);
        console.log('QuarterlyResultsTable: Has total_revenue_fq_h?', !!apiData.total_revenue_fq_h);
        console.log('QuarterlyResultsTable: Sector from API:', apiData.sector);
        
        setData(apiData);
      } catch (err) {
        console.error('QuarterlyResultsTable: Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    if (symbol) {
      console.log('QuarterlyResultsTable: Symbol prop received:', symbol);
      fetchData();
    } else {
      console.log('QuarterlyResultsTable: No symbol provided');
    }
  }, [symbol]);

  if (loading) {
    return (
      <div className={`quarterly-results-section ${className}`}>
        <div className="bg-white border border-gray-200 rounded-lg p-8">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded w-full"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`quarterly-results-section ${className}`}>
        <div className="bg-white border border-red-200 rounded-lg p-8 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={`quarterly-results-section ${className}`}>
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-500">No quarterly data available</p>
        </div>
      </div>
    );
  }

  // Detect company type and get appropriate metrics
  const companyType: CompanyType = detectCompanyType(data.sector || sector, symbol);
  const metrics = getMetricConfig(companyType);
  
  console.log('QuarterlyResultsTable: Company type detected:', companyType);
  console.log('QuarterlyResultsTable: Metrics to display:', metrics.map(m => m.key));

  // Generate quarter labels
  const quarterLabels = data.quarters_info?.dates
    ? generateQuarterLabels(data.quarters_info.dates)
    : [];
    
  // Log the actual data being rendered
  console.log('QuarterlyResultsTable: Quarter labels:', quarterLabels);
  if (metrics.length > 0) {
    const firstMetric = metrics[0];
    const firstMetricData = data[firstMetric.key] as number[] | undefined;
    console.log(`QuarterlyResultsTable: First metric (${firstMetric.key}) data:`, firstMetricData);
    if (firstMetricData && firstMetricData.length > 0) {
      console.log(`QuarterlyResultsTable: First value of ${firstMetric.key}:`, firstMetricData[0]);
      const isMockData = firstMetricData[0] === 224671;
      console.log('QuarterlyResultsTable: Is this mock data?', isMockData);
    }
  }

  return (
    <div className={`quarterly-results-section w-full ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Quarterly Results</h2>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>Consolidated Figures in Rs. Crores</span>
          <span>/</span>
          <button className="text-blue-600 hover:text-blue-800">View Standalone</button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            {/* Header */}
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider min-w-[140px]">
                  METRIC
                </th>
                {quarterLabels.map((quarter, index) => (
                  <th
                    key={`${quarter}-${index}`}
                    className="px-3 py-3 text-center text-xs font-medium text-gray-700 min-w-[90px]"
                  >
                    {quarter}
                  </th>
                ))}
              </tr>
            </thead>

            {/* Body */}
            <tbody className="bg-white divide-y divide-gray-200">
              {metrics.map((metric, rowIndex) => {
                const values = data[metric.key] as number[] | undefined;

                return (
                  <tr
                    key={`${metric.label}-${rowIndex}`}
                    className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                  >
                    {/* Metric Label */}
                    <td className="px-4 py-3 text-sm font-medium text-gray-700 whitespace-nowrap">
                      {metric.label}
                    </td>

                    {/* Values */}
                    {quarterLabels.map((_, colIndex) => {
                      const value = values?.[colIndex] || null;
                      const formattedValue = formatValue(value, metric.type);
                      const isNegative = value !== null && value < 0;

                      return (
                        <td
                          key={`${metric.label}-${colIndex}`}
                          className={`px-3 py-3 text-sm text-right whitespace-nowrap ${
                            isNegative ? 'text-red-600' : 'text-gray-900'
                          }`}
                        >
                          {formattedValue}
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
            {companyType === 'banking' ? (
              <p>* Financing Profit = Net Interest Income | Financing Margin = Net Interest Margin</p>
            ) : (
              <p>* OPM = Operating Profit Margin | EPS = Earnings Per Share | + indicates expandable details</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuarterlyResultsTable;