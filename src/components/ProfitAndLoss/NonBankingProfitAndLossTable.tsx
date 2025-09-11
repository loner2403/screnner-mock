
import React from 'react';
import { ProcessedProfitAndLossData } from './types';

interface Props {
  data: ProcessedProfitAndLossData;
}

const NonBankingProfitAndLossTable: React.FC<Props> = ({ data }) => {
  const getCellClassName = (value: string | number | null, type: string, isNegative?: boolean, isSummary?: boolean) => {
    const baseClasses = "px-3 py-1.5 text-sm text-right whitespace-nowrap";
    
    if (value === null || value === 'N/A') {
      return `${baseClasses} text-gray-400`;
    }
    
    // Handle negative values (show in red)
    if (isNegative || (typeof value === 'string' && value.startsWith('-'))) {
      return `${baseClasses} text-red-600`;
    }

    // Highlight summary rows (Sales, Gross Profit, Net Profit, etc.)
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
    <div className="w-full">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-900">
          Profit & Loss Statement
        </h2>
        <p className="text-sm text-gray-600">
          Consolidated Figures in Rs. Crores • Non-Banking
        </p>
      </div>

      {/* Table Container - Multi-year Profit & Loss Style (matching BalanceSheet) */}
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
              const isSummary = row.label.includes('Total') || row.label.includes('Profit') || row.label.includes('Sales') || row.label.includes('Gross') || row.label.includes('EBIT');
              
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
        <p className="text-xs text-gray-500">
          * Non-banking data includes sales, expenses, and operational metrics | + indicates expandable details
        </p>
        <p className="text-xs text-gray-500">
          Last updated: {new Date(data.lastUpdated).toLocaleDateString('en-IN')}
        </p>
      </div>
    </div>
  );
};

export default NonBankingProfitAndLossTable;
