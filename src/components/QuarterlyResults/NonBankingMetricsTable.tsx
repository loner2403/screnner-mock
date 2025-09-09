import React from 'react';
import { QuarterInfo, MetricRow } from './types';

interface NonBankingMetricsTableProps {
  quarters: QuarterInfo[];
  metrics: MetricRow[];
}

const NonBankingMetricsTable: React.FC<NonBankingMetricsTableProps> = ({
  quarters,
  metrics,
}) => {
  if (quarters.length === 0 || metrics.length === 0) {
    return (
      <div className="border border-gray-200 rounded-lg p-8 text-center text-gray-500">
        <p>No quarterly data available</p>
      </div>
    );
  }

  const getCellClassName = (value: string | number | null, type: string) => {
    const baseClasses = "px-3 py-2 text-sm border-r border-gray-200 last:border-r-0 text-right";
    
    if (value === null || value === 'N/A') {
      return `${baseClasses} text-gray-400`;
    }
    
    if (type === 'percentage' || type === 'currency') {
      const numValue = typeof value === 'string' ? parseFloat(value.replace(/[^\d.-]/g, '')) : value;
      if (numValue < 0) {
        return `${baseClasses} text-red-600`;
      }
    }
    
    if (type === 'link') {
      return `${baseClasses} text-blue-600 hover:text-blue-800 cursor-pointer`;
    }
    
    return `${baseClasses} text-gray-900`;
  };

  const getRowClassName = (label: string) => {
    const baseClasses = "border-b border-gray-200 last:border-b-0 hover:bg-gray-50";
    
    // Highlight important business metrics
    if (label.includes('Sales') || label.includes('Net Profit') || label.includes('Operating Profit')) {
      return `${baseClasses} bg-green-50`;
    }
    
    return baseClasses;
  };

  const handleLinkClick = (value: string | number | null, quarter: QuarterInfo) => {
    if (value && value !== 'N/A') {
      console.log(`Opening PDF for ${quarter.quarter}`);
      // TODO: Implement PDF opening logic
    }
  };

  return (
    <div className="non-banking-metrics-table overflow-x-auto">
      <div className="min-w-full border border-gray-200 rounded-lg">
        {/* Table Header */}
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="flex">
            {/* Metric name column */}
            <div className="w-40 px-3 py-3 border-r border-gray-200 bg-gray-100 sticky left-0 z-10">
              <div className="text-sm font-medium text-gray-900">Metric</div>
            </div>
            
            {/* Quarter columns */}
            {quarters.map((quarter, index) => (
              <div 
                key={`${quarter.quarter}-${index}`}
                className="min-w-24 px-3 py-3 border-r border-gray-200 last:border-r-0 text-center"
              >
                <div className="text-sm font-medium text-gray-900">
                  {quarter.quarter}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Table Body */}
        <div className="bg-white">
          {metrics.map((metric, rowIndex) => (
            <div 
              key={`${metric.label}-${rowIndex}`}
              className={getRowClassName(metric.label)}
            >
              <div className="flex">
                {/* Metric name */}
                <div className="w-40 px-3 py-2 border-r border-gray-200 bg-gray-50 sticky left-0 z-10">
                  <div className="text-sm font-medium text-gray-700">
                    {metric.label}
                  </div>
                </div>
                
                {/* Metric values */}
                {quarters.map((quarter, colIndex) => {
                  const value = metric.values[colIndex];
                  const isLink = metric.type === 'link';
                  
                  return (
                    <div 
                      key={`${quarter.quarter}-${colIndex}`}
                      className={getCellClassName(value, metric.type)}
                      onClick={isLink ? () => handleLinkClick(value, quarter) : undefined}
                    >
                      <div className={`font-mono ${isLink ? 'cursor-pointer' : ''}`}>
                        {isLink && value && value !== 'N/A' ? (
                          <span title="Download quarterly report PDF">
                            📄
                          </span>
                        ) : (
                          value || 'N/A'
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Non-banking specific footer note */}
      <div className="mt-2 text-xs text-gray-500">
        <p>* All figures in Rs. Crores unless otherwise specified</p>
        <p>* OPM = Operating Profit Margin | EPS = Earnings Per Share</p>
        <p>* Click 📄 to download quarterly report PDF (when available)</p>
      </div>
    </div>
  );
};

export default NonBankingMetricsTable;