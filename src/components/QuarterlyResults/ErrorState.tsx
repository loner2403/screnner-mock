import React from 'react';
import { ErrorStateProps } from './types';

const ErrorState: React.FC<ErrorStateProps> = ({ error, onRetry, variant }) => {
  const getErrorContent = () => {
    switch (variant) {
      case 'network':
        return {
          title: 'Network Error',
          message: 'Unable to load quarterly results. Please check your connection and try again.',
          icon: '🌐',
        };
      case 'not-found':
        return {
          title: 'Data Not Found',
          message: 'Quarterly results are not available for this company.',
          icon: '📊',
        };
      case 'partial-data':
        return {
          title: 'Partial Data',
          message: 'Some quarterly data may be missing or incomplete.',
          icon: '⚠️',
        };
      default:
        return {
          title: 'Error',
          message: error.message || 'An unexpected error occurred.',
          icon: '❌',
        };
    }
  };

  const { title, message, icon } = getErrorContent();

  return (
    <div className="w-full p-8 text-center">
      <div className="max-w-md mx-auto">
        <div className="text-4xl mb-4">{icon}</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 mb-6">{message}</p>
        
        {error.details && (
          <div className="text-sm text-gray-500 mb-4 p-3 bg-gray-50 rounded">
            {error.details}
          </div>
        )}
        
        {variant !== 'not-found' && (
          <button
            onClick={onRetry}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorState;