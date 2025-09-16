import React from 'react';
import { 
  CashFlowProps, 
  CashFlowLoadingState,
  CashFlowError
} from './types';
import { useCashFlowData } from './hooks';

// Loading skeleton component
const LoadingSkeleton: React.FC<CashFlowLoadingState> = ({ years = 12, metrics = 5 }) => (
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

// Error display component
const ErrorDisplay: React.FC<{ error: CashFlowError; onRetry: () => void }> = ({ 
  error, 
  onRetry 
}) => (
  <div className="border border-red-200 rounded-lg p-8 text-center">
    <div className="text-red-600 mb-4">
      <h3 className="text-lg font-semibold">Unable to load cash flow data</h3>
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

const CashFlowTable: React.FC<CashFlowProps> = ({
  symbol,
  companyName,
  sector,
  className
}) => {
  // Use the cash flow hook with the same pattern as BalanceSheet
  const { data, loading, error, refetch } = useCashFlowData(symbol, sector);

  // Show loading state
  if (loading) {
    return <LoadingSkeleton />;
  }

  // Show error state
  if (error) {
    return <ErrorDisplay error={error} onRetry={refetch} />;
  }

  // Show empty state
  if (!data || data.rows.length === 0 || data.years.length === 0) {
    return (
      <div className="border border-gray-200 rounded-lg p-8 text-center text-gray-500">
        <p>No cash flow data available for {companyName}</p>
      </div>
    );
  }

  const getCellClassName = (value: string | number | null, type: string, isNegative?: boolean, isSummary?: boolean) => {
    const baseClasses = "px-3 py-1.5 text-sm text-right whitespace-nowrap";
    
    if (value === null || value === 'N/A') {
      return `${baseClasses} text-gray-400`;
    }
    
    // Handle negative values (show in red)
    if (isNegative || (typeof value === 'string' && value.startsWith('-'))) {
      return `${baseClasses} text-red-600`;
    }

    // Highlight summary rows (Cash Flow from Operating/Investing/Financing Activities, Net Cash Flow, etc.)
    if (isSummary) {
      return `${baseClasses} text-gray-900 font-semibold`;
    }
    
    return `${baseClasses} text-gray-900`;
  };

  const getRowClassName = (index: number, isSummary?: boolean) => {
    // Summary rows get special highlighting
    if (isSummary) {
      return 'bg-blue-50 border-y border-blue-200';
    }
    // Alternate row colors for better readability
    return index % 2 === 0 ? 'bg-white' : 'bg-gray-50';
  };

  const getCurrentQuarter = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    return `Mar ${currentYear}`;
  };

  const currentPeriod = getCurrentQuarter();

  return (
    <div className={`w-full ${className || ''}`}>
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-900">
          Cash Flow Statement
        </h2>
        <p className="text-sm text-gray-600">
          Consolidated Figures in Rs. Crores • {data.companyType === 'banking' ? 'Banking' : 'Non-Banking'}
        </p>
      </div>

      {/* Table Container - Multi-year Cash Flow Style (matching BalanceSheet) */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg bg-white shadow-sm">
        <table className="w-full table-auto min-w-full">
          {/* Table Header */}
          <thead>
            <tr className="bg-gray-100 border-b border-gray-200">
              <th className="sticky left-0 z-10 bg-gray-100 px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider min-w-[160px]">
                {/* Empty header for row labels */}
              </th>
              {data.years.map((year, index) => (
                <th 
                  key={`${year}-${index}`}
                  className={`px-3 py-2 text-center text-xs font-medium text-gray-700 min-w-[90px] ${
                    `Mar ${year}` === currentPeriod ? 'bg-gray-200' : ''
                  }`}
                >
                  <div className="font-semibold truncate">Mar {year}</div>
                </th>
              ))}
            </tr>
          </thead>
          
          {/* Table Body */}
          <tbody className="bg-white divide-y divide-gray-200">
            {data.rows.map((row, rowIndex) => {
              const isSummary = row.label.includes('Cash Flow from') || 
                               row.label.includes('Net Cash Flow') || 
                               row.label.includes('Free Cash Flow') ||
                               row.label.includes('Cash at End of Period');
              
              return (
                <tr 
                  key={`${row.label}-${rowIndex}`}
                  className={getRowClassName(rowIndex, isSummary)}
                >
                  {/* Metric Label */}
                  <td className={`sticky left-0 z-10 bg-inherit px-4 py-1.5 text-sm text-gray-700 whitespace-nowrap ${
                    isSummary ? 'font-semibold' : 'font-medium'
                  }`}>
                    {row.label}
                  </td>
                  
                  {/* Metric Values for each year */}
                  {data.years.map((year, colIndex) => {
                    const value = row.values[colIndex];
                    const rawValue = row.rawValues?.[colIndex];
                    const isNegative = rawValue !== null && rawValue !== undefined && rawValue < 0;
                    const isCurrentYear = `Mar ${year}` === currentPeriod;
                    
                    return (
                      <td 
                        key={`${year}-${colIndex}`}
                        className={`${getCellClassName(value, row.type, isNegative, isSummary)} ${
                          isCurrentYear ? 'bg-gray-200' : ''
                        }`}
                      >
                        {value || '-'}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* Footer Notes */}
      <div className="mt-3 space-y-1">
        <p className="text-xs text-gray-500">
          All figures in Rs. Crores unless otherwise specified
        </p>
        {data.companyType === 'banking' ? (
          <p className="text-xs text-gray-500">
            * Banking cash flows include deposit and loan changes, interest flows | + indicates expandable details
          </p>
        ) : (
          <p className="text-xs text-gray-500">
            * Operating activities include working capital changes | Investing activities include capex and acquisitions | + indicates expandable details
          </p>
        )}
        <p className="text-xs text-gray-500">
          Last updated: {new Date(data.lastUpdated).toLocaleDateString('en-IN')}
        </p>
      </div>
    </div>
  );
};

export { CashFlowTable };
export default CashFlowTable;