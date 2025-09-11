import React from 'react';
import { QuarterInfo, MetricRow } from './types';

interface EnhancedQuarterlyTableProps {
  quarters: QuarterInfo[];
  metrics: MetricRow[];
  companyType: 'banking' | 'non-banking';
}

// Format number to crores with 2 decimal places
const formatToCrores = (value: number): string => {
  if (typeof value !== 'number' || isNaN(value)) return '-';
  
  const croreValue = value / 10000000; // Convert to crores (1 crore = 10M)
  if (Math.abs(croreValue) < 0.01) return '0'; // If less than 0.01 crores, show 0
  
  return croreValue.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

const EnhancedQuarterlyTable: React.FC<EnhancedQuarterlyTableProps> = ({
  quarters,
  metrics,
  companyType
}) => {
  if (quarters.length === 0 || metrics.length === 0) {
    return (
      <div className="border border-gray-200 rounded-lg p-8 text-center text-gray-500">
        <p>No quarterly data available</p>
      </div>
    );
  }

  // Function to determine current quarter based on result publication schedule
  const getCurrentQuarter = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-based (0 = January)

    // Determine latest available quarter based on result publication schedule
    if (currentMonth >= 0 && currentMonth <= 1) { // Jan-Feb: Q3 results being published
      return `Dec ${currentYear - 1}`;
    } else if (currentMonth === 2) { // March: Q3 results published, waiting for Q4
      return `Dec ${currentYear - 1}`;
    } else if (currentMonth >= 3 && currentMonth <= 4) { // Apr-May: Q4 results being published
      return `Mar ${currentYear}`;
    } else if (currentMonth === 5) { // June: Q4 results published, waiting for Q1
      return `Mar ${currentYear}`;
    } else if (currentMonth >= 6 && currentMonth <= 7) { // Jul-Aug: Q1 results being published
      return `Jun ${currentYear}`;
    } else if (currentMonth === 8) { // Sep: Q1 results published, waiting for Q2
      return `Jun ${currentYear}`;
    } else if (currentMonth >= 9 && currentMonth <= 10) { // Oct-Nov: Q2 results being published
      return `Sep ${currentYear}`;
    } else { // Dec: Q2 results published, waiting for Q3
      return `Sep ${currentYear}`;
    }
  };

  const currentQuarter = getCurrentQuarter();

  // Check if a quarter matches the current quarter month (regardless of year)
  const isCurrentQuarter = (quarter: QuarterInfo) => {
    const currentQuarterMonth = getCurrentQuarter().split(' ')[0]; // Gets 'Mar', 'Jun', 'Sep', or 'Dec'
    const quarterMonth = quarter.quarter.split(' ')[0]; // Gets the month part from the quarter
    return quarterMonth === currentQuarterMonth;
  };

  const getCellClassName = (value: string | number | null, type: string, isNegative?: boolean) => {
    const baseClasses = "px-3 py-1.5 text-sm text-right whitespace-nowrap";
    
    if (value === null || value === 'N/A') {
      return `${baseClasses} text-gray-400`;
    }
    
    // Handle negative values (show in red)
    if (isNegative || (typeof value === 'string' && value.startsWith('-'))) {
      return `${baseClasses} text-red-600`;
    }
    
    if (type === 'link') {
      return `${baseClasses} text-blue-600 hover:text-blue-800 cursor-pointer`;
    }
    
    return `${baseClasses} text-gray-900`;
  };

  const getRowClassName = (index: number) => {
    // Alternate row colors for better readability
    return index % 2 === 0 ? 'bg-white' : 'bg-gray-50';
  };

  const handlePDFClick = (quarter: QuarterInfo) => {
    console.log(`Opening PDF for ${quarter.quarter}`);
    // TODO: Implement PDF download/view logic
  };

  return (
    <div className="w-full">
      {/* Table Container with improved responsiveness */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg bg-white shadow-sm">
        <table className="w-full table-auto min-w-full">
          {/* Table Header */}
          <thead>
            <tr className="bg-gray-100 border-b border-gray-200">
              <th className="sticky left-0 z-10 bg-gray-100 px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider min-w-[140px] w-[20%]">
                Metric
              </th>
              {quarters.map((quarter, index) => (
                <th 
                  key={`${quarter.quarter}-${index}`}
                  className={`px-3 py-2 text-center text-xs font-medium text-gray-700 min-w-[90px] ${
                    isCurrentQuarter(quarter) ? 'bg-gray-200' : ''
                  }`}
                >
                  <div className="font-semibold truncate">{quarter.quarter}</div>
                </th>
              ))}
            </tr>
          </thead>
          
          {/* Table Body */}
          <tbody className="bg-white divide-y divide-gray-200">
            {metrics.map((metric, rowIndex) => {
              const isPercentage = metric.type === 'percentage';
              const isCurrency = metric.type === 'currency';
              const isLink = metric.type === 'link';
              
              return (
                <tr 
                  key={`${metric.label}-${rowIndex}`}
                  className={getRowClassName(rowIndex)}
                >
                  {/* Metric Label */}
                  <td className="sticky left-0 z-10 bg-inherit px-4 py-1.5 text-sm font-medium text-gray-700 whitespace-nowrap">
                    {metric.label}
                  </td>
                  
                  {/* Metric Values */}
                  {quarters.map((quarter, colIndex) => {
                    const value = metric.values[colIndex];
                    const rawValue = metric.rawValues?.[colIndex];
                    const isNegative = rawValue !== null && rawValue !== undefined && rawValue < 0;
                    
                    if (isLink) {
                      return (
                        <td 
                          key={`${quarter.quarter}-${colIndex}`}
                          className={getCellClassName(value, metric.type, isNegative)}
                          onClick={() => value && value !== 'N/A' && handlePDFClick(quarter)}
                        >
                          {value && value !== 'N/A' ? (
                            <span className="cursor-pointer hover:underline" title="View PDF">
                              📄
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                      );
                    }
                    
                    return (
                      <td 
                        key={`${quarter.quarter}-${colIndex}`}
                        className={`${getCellClassName(value, metric.type, isNegative)} ${
                          isCurrentQuarter(quarter) ? 'bg-gray-200' : ''
                        }`}
                      >
                        {(() => {
                          if (value === null || value === 'N/A' || !rawValue) return '-';
                          if (typeof rawValue === 'number') {
                            // Format as crores if the value is large enough (>= 10M or 1 crore)
                            if (Math.abs(rawValue) >= 10000000) {
                              return formatToCrores(rawValue);
                            }
                            // For smaller numbers, use regular formatting
                            return rawValue.toLocaleString('en-IN');
                          }
                          return value;
                        })()}
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
        {companyType === 'banking' ? (
          <p className="text-xs text-gray-500">
            * Financing Profit = Net Interest Income | Financing Margin = Net Interest Margin | NPA = Non-Performing Assets
          </p>
        ) : (
          <p className="text-xs text-gray-500">
            * OPM = Operating Profit Margin | EPS = Earnings Per Share | + indicates expandable details
          </p>
        )}
      </div>
    </div>
  );
};

export default EnhancedQuarterlyTable;
