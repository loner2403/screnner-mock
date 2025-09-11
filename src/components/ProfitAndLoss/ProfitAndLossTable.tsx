import React from 'react';
import { ProfitAndLossProps, ProfitAndLossResultsError } from './types';
import { useProfitAndLossData } from './hooks';
import BankingProfitAndLossTable from './BankingProfitAndLossTable';
import NonBankingProfitAndLossTable from './NonBankingProfitAndLossTable';

const LoadingSkeleton: React.FC<{ years?: number; metrics?: number }> = ({ years = 12, metrics = 15 }) => (
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

const ErrorDisplay: React.FC<{ error: ProfitAndLossResultsError; onRetry: () => void }> = ({ error, onRetry }) => (
    <div className="border border-red-200 rounded-lg p-8 text-center">
        <div className="text-red-600 mb-4">
            <h3 className="text-lg font-semibold">Unable to load Profit & Loss data</h3>
            <p className="text-sm mt-1">{error.message}</p>
            {error.details && <p className="text-xs text-gray-500 mt-2">{error.details}</p>}
        </div>
        <button onClick={onRetry} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
            Try Again
        </button>
    </div>
);

const ProfitAndLossTable: React.FC<ProfitAndLossProps> = ({
  symbol,
  companyName,
  sector,
  className = '',
}) => {
  const { data, loading, error, refetch } = useProfitAndLossData(symbol, sector);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return <ErrorDisplay error={error} onRetry={refetch} />;
  }

  if (!data) {
    return <div className={className}>No data available.</div>;
  }

  return (
    <div className={className}>
      {data.companyType === 'banking' ? (
        <BankingProfitAndLossTable data={data} />
      ) : (
        <NonBankingProfitAndLossTable data={data} />
      )}
    </div>
  );
};

export default ProfitAndLossTable;