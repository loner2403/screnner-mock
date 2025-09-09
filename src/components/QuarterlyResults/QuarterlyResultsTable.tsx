import React from 'react';
import { QuarterlyResultsProps } from './types';
import QuarterlyResultsHeader from './QuarterlyResultsHeader';
import LoadingState from './LoadingState';
import ErrorState from './ErrorState';
import BankingMetricsTable from './BankingMetricsTable';
import NonBankingMetricsTable from './NonBankingMetricsTable';
import { useQuarterlyData } from './hooks';

const QuarterlyResultsTable: React.FC<QuarterlyResultsProps> = ({
  symbol,
  companyName,
  sector,
  className = '',
}) => {
  const { data, loading, error, refetch } = useQuarterlyData(symbol, sector);

  if (loading) {
    return (
      <div className={`quarterly-results-section ${className}`}>
        <LoadingState quarters={12} metrics={12} />
      </div>
    );
  }

  if (error) {
    const getErrorVariant = () => {
      switch (error.type) {
        case 'not-found':
          return 'not-found';
        case 'partial-data':
          return 'partial-data';
        default:
          return 'network';
      }
    };

    return (
      <div className={`quarterly-results-section ${className}`}>
        <ErrorState
          error={error}
          onRetry={refetch}
          variant={getErrorVariant()}
        />
      </div>
    );
  }

  if (!data) {
    return (
      <div className={`quarterly-results-section ${className}`}>
        <div className="border border-gray-200 rounded-lg p-8 text-center text-gray-500">
          <p>No quarterly data available</p>
        </div>
      </div>
    );
  }

  const handleProductSegmentsClick = () => {
    console.log('Product segments clicked for', symbol);
    // TODO: Implement product segments modal/page
  };

  return (
    <div className={`quarterly-results-section ${className}`}>
      <QuarterlyResultsHeader
        hasProductSegments={data.hasProductSegments}
        onProductSegmentsClick={handleProductSegmentsClick}
      />

      {/* Render appropriate table based on company type */}
      {data.companyType === 'banking' ? (
        <BankingMetricsTable
          quarters={data.quarters}
          metrics={data.rows}
        />
      ) : (
        <NonBankingMetricsTable
          quarters={data.quarters}
          metrics={data.rows}
        />
      )}

      {/* Data freshness indicator */}
      <div className="mt-4 text-xs text-gray-500 text-right">
        Last updated: {new Date(data.lastUpdated).toLocaleString()}
      </div>
    </div>
  );
};

export default QuarterlyResultsTable;