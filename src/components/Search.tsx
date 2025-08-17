'use client';

import { useState, useEffect } from 'react';
import { searchStocks, type StockData } from '@/lib/api';
import StockCard from '@/components/StockCard';

export default function Search() {
  const [searchTerm, setSearchTerm] = useState('');
  const [stocks, setStocks] = useState<StockData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (term: string = searchTerm) => {
    if (!term.trim() && !hasSearched) {
      // Load default stocks on first load
      setLoading(true);
      setError(null);
      try {
        const response = await searchStocks({
          page: 1,
          sortBy: 'market_cap',
          sortOrder: 'desc',
        });
        setStocks(response.data || []);
        setHasSearched(true);
      } catch (err) {
        setError('Failed to fetch stock data. Please try again.');
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!term.trim()) return;

    setLoading(true);
    setError(null);
    
    try {
      const response = await searchStocks({
        searchTerm: term,
        page: 1,
        sortBy: 'market_cap',
        sortOrder: 'desc',
      });
      setStocks(response.data || []);
      setHasSearched(true);
    } catch (err) {
      setError('Failed to search stocks. Please try again.');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load default stocks on component mount
  useEffect(() => {
    handleSearch('');
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Auto-search with debounce
    if (value.length >= 2) {
      const timeoutId = setTimeout(() => {
        handleSearch(value);
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  };

  return (
    <div className="w-full">
      {/* Search Bar */}
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={handleInputChange}
            placeholder="Search Indian stocks (e.g., HDFCBANK, RELIANCE, TCS)..."
            className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading stocks...</span>
        </div>
      )}

      {/* Results */}
      {!loading && hasSearched && (
        <div>
          {stocks.length > 0 ? (
            <>
              <div className="mb-4 text-sm text-gray-600">
                Found {stocks.length} stocks
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {stocks.map((stock) => (
                  <StockCard key={stock.symbol_code} stock={stock} />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No stocks found</p>
              <p className="text-gray-400 text-sm mt-2">
                Try searching for popular Indian stocks like HDFCBANK, RELIANCE, or TCS
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
