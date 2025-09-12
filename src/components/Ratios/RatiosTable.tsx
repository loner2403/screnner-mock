// src/components/Ratios/RatiosTable.tsx

import React from 'react';
import { 
  RatiosProps, 
  RatiosLoadingState,
  RatiosError
} from './types';
import { useRatiosData } from './hooks';

const LoadingSkeleton: React.FC<RatiosLoadingState> = ({ years = 12, metrics = 10 }) => (
  <div className="w-full">
    <div className="overflow-x-auto border border-gray-200 rounded-lg bg-white shadow-sm">
      <table className="w-full table-auto min-w-full">
        <thead>
          <tr className="bg-gray-100 border-b border-gray-200">
            <th className="sticky left-0 z-10 bg-gray-100 px-4 py-2 w-[20%]">
              <div className="h-4 bg-gray-300 rounded animate-pulse"></div>
            </th>
            {Array.from({ length: years }).map((_, i) => (
              <th key={i} className="px-3 py-2 min-w-[90px]">
                <div className="h-4 bg-gray-300 rounded animate-pulse"></div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: metrics }).map((_, rowIndex) => (
            <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="sticky left-0 z-10 bg-inherit px-4 py-1.5">
                <div className="h-4 bg-gray-300 rounded animate-pulse"></div>
              </td>
              {Array.from({ length: years }).map((_, colIndex) => (
                <td key={colIndex} className="px-3 py-1.5">
                  <div className="h-4 bg-gray-300 rounded animate-pulse"></div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const ErrorDisplay: React.FC<{ error: RatiosError; onRetry: () => void }> = ({ 
  error, 
  onRetry 
}) => (
  <div className="border border-red-200 rounded-lg p-8 text-center">
    <div className="text-red-600 mb-4">
      <h3 className="text-lg font-semibold">Unable to load ratios data</h3>
      <p className="text-sm mt-1">{error.message}</p>
      {error.details && (
        <p className="text-xs text-gray-500 mt-2">{error.details}</p>
      )}
    </div>
    <button
      onClick={onRetry}
      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
    >
      Try Again
    </button>
  </div>
);

const RatiosTable: React.FC<RatiosProps> = ({
  symbol,
  companyName,
  sector,
  className
}) => {
  const { data, loading, error, refetch } = useRatiosData(symbol, sector);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return <ErrorDisplay error={error} onRetry={refetch} />;
  }

  if (!data || data.rows.length === 0 || data.years.length === 0) {
    return (
      <div className="border border-gray-200 rounded-lg p-8 text-center text-gray-500">
        <p>No ratios data available for {companyName}</p>
      </div>
    );
  }

  const getCellClassName = (value: string | number | null, type: string, isNegative?: boolean) => {
    const baseClasses = "px-3 py-1.5 text-sm text-right whitespace-nowrap";
    
    if (value === null || value === 'N/A') {
      return `${baseClasses} text-gray-400`;
    }
    
    if (isNegative || (typeof value === 'string' && value.startsWith('-'))) {
      return `${baseClasses} text-red-600`;
    }
    
    return `${baseClasses} text-gray-900`;
  };

  return (
    <div className={`w-full ${className || ''}`}>
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-900">
          Key Ratios
        </h2>
        <p className="text-sm text-gray-600">
          {data.companyType === 'banking' ? 'Banking' : 'Non-Banking'} Ratios
        </p>
      </div>

      <div className="overflow-x-auto border border-gray-200 rounded-lg bg-white shadow-sm">
        <table className="w-full table-auto min-w-full">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-200">
              <th className="sticky left-0 z-10 bg-gray-100 px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider min-w-[160px]">
                Ratio
              </th>
              {data.years.map((year, index) => (
                <th 
                  key={`${year}-${index}`}
                  className="px-3 py-2 text-center text-xs font-medium text-gray-700 min-w-[90px]"
                >
                  <div className="font-semibold truncate">Mar {year}</div>
                </th>
              ))}
            </tr>
          </thead>
          
          <tbody className="bg-white divide-y divide-gray-200">
            {data.rows.map((row, rowIndex) => (
              <tr 
                key={`${row.label}-${rowIndex}`}
                className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
              >
                <td className="sticky left-0 z-10 bg-inherit px-4 py-1.5 text-sm text-gray-700 whitespace-nowrap font-medium">
                  {row.label}
                </td>
                
                {data.years.map((year, colIndex) => {
                  const value = row.values[colIndex];
                  const rawValue = row.rawValues?.[colIndex];
                  const isNegative = rawValue !== null && rawValue !== undefined && rawValue < 0;
                  
                  return (
                    <td 
                      key={`${year}-${colIndex}`}
                      className={getCellClassName(value, row.type, isNegative)}
                    >
                      {value || '-'}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="mt-3">
        <p className="text-xs text-gray-500">
          Last updated: {new Date(data.lastUpdated).toLocaleDateString('en-IN')}
        </p>
      </div>
    </div>
  );
};

export { RatiosTable };
export default RatiosTable;
