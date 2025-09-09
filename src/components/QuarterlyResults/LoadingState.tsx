import React from 'react';
import { LoadingStateProps } from './types';

const LoadingState: React.FC<LoadingStateProps> = ({ 
  quarters = 12, 
  metrics = 12 
}) => {
  return (
    <div className="w-full">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-4">
        <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
        <div className="h-8 bg-gray-200 rounded w-32 animate-pulse"></div>
      </div>
      
      {/* Table skeleton */}
      <div className="overflow-x-auto">
        <div className="min-w-full border border-gray-200 rounded-lg">
          {/* Table header */}
          <div className="bg-gray-50 border-b border-gray-200">
            <div className="flex">
              <div className="w-40 p-3 border-r border-gray-200">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              </div>
              {Array.from({ length: quarters }).map((_, index) => (
                <div key={index} className="w-24 p-3 border-r border-gray-200 last:border-r-0">
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Table rows */}
          {Array.from({ length: metrics }).map((_, rowIndex) => (
            <div key={rowIndex} className="border-b border-gray-200 last:border-b-0">
              <div className="flex">
                <div className="w-40 p-3 border-r border-gray-200 bg-gray-50">
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                </div>
                {Array.from({ length: quarters }).map((_, colIndex) => (
                  <div key={colIndex} className="w-24 p-3 border-r border-gray-200 last:border-r-0">
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LoadingState;