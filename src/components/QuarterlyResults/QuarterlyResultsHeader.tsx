import React from 'react';

interface QuarterlyResultsHeaderProps {
  hasProductSegments: boolean;
  onProductSegmentsClick?: () => void;
}

const QuarterlyResultsHeader: React.FC<QuarterlyResultsHeaderProps> = ({
  hasProductSegments,
  onProductSegmentsClick,
}) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Quarterly Results</h2>
        <p className="text-sm text-gray-600 mt-1">
          Consolidated Figures in Rs. Crores / <span className="text-blue-600 cursor-pointer hover:underline">View Standalone</span>
        </p>
      </div>
      
      {hasProductSegments && (
        <button
          onClick={onProductSegmentsClick}
          className="inline-flex items-center px-3 py-1.5 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          PRODUCT SEGMENTS
        </button>
      )}
    </div>
  );
};

export default QuarterlyResultsHeader;