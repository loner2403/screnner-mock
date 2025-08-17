'use client';

import { Suspense } from 'react';
import Search from "@/components/Search";

function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span className="ml-2 text-gray-600">Loading dashboard...</span>
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen w-full bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Indian Stock Screener</h1>
              <p className="mt-1 text-sm text-gray-600">Search NSE/BSE companies and view real-time metrics</p>
            </div>
            <div className="text-sm text-gray-500">
              Live Market Data
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        <Suspense fallback={<LoadingSpinner />}>
          <Search />
        </Suspense>
        
        {/* Popular Stocks Suggestion */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800 font-medium mb-2">Popular Indian Stocks:</p>
          <p className="text-sm text-blue-700">
            Try searching: HDFCBANK, RELIANCE, TCS, INFY, ICICIBANK, SBIN, WIPRO, LT, BHARTIARTL, MARUTI
          </p>
        </div>
      </main>
    </div>
  );
}
