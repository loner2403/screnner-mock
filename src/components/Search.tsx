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
  const [activeFilter, setActiveFilter] = useState('all');

  const filters = [
    { id: 'all', label: 'All Stocks', icon: '📊' },
    { id: 'nifty50', label: 'NIFTY 50', icon: '🔥' },
    { id: 'gainers', label: 'Top Gainers', icon: '📈' },
    { id: 'losers', label: 'Top Losers', icon: '📉' },
    { id: 'volume', label: 'High Volume', icon: '🚀' },
  ];

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
          niftyOnly: activeFilter === 'nifty50',
          limit: 50,
        });
        setStocks(response.data || []);
        setHasSearched(true);
      } catch (err) {
        setError('Failed to fetch market data. Please try again.');
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
        sortBy: activeFilter === 'volume' ? 'volume' : 'market_cap',
        sortOrder: 'desc',
        niftyOnly: activeFilter === 'nifty50',
        limit: 50,
      });
      
      let filteredData = response.data || [];
      
      // Apply additional filters
      if (activeFilter === 'gainers') {
        filteredData = filteredData.filter(stock => stock.change && stock.change > 0)
                                 .sort((a, b) => (b.change || 0) - (a.change || 0));
      } else if (activeFilter === 'losers') {
        filteredData = filteredData.filter(stock => stock.change && stock.change < 0)
                                 .sort((a, b) => (a.change || 0) - (b.change || 0));
      }
      
      setStocks(filteredData);
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
  }, [activeFilter]);

  // Debounced auto-search as user types
  useEffect(() => {
    if (searchTerm.trim().length < 2) return;
    const id = setTimeout(() => {
      handleSearch(searchTerm);
    }, 500);
    return () => clearTimeout(id);
  }, [searchTerm]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
  };

  return (
    <div className="w-full">
      {/* Search Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-6">Search & Analyze Stocks</h2>
        
        {/* Search Bar */}
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-500 group-focus-within:text-cyan-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={handleInputChange}
              placeholder="Search by symbol or company name (e.g., RELIANCE, TCS)..."
              className="w-full pl-12 pr-32 py-4 text-lg bg-gray-900 border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-400 focus:border-transparent outline-none transition-all"
            />
            <button
              type="submit"
              disabled={loading}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 px-6 py-2.5 bg-cyan-400 text-black font-semibold rounded-lg hover:bg-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-lg hover:shadow-cyan-400/25"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Searching
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  Search
                </span>
              )}
            </button>
          </div>
        </form>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                activeFilter === filter.id
                  ? 'bg-cyan-400 text-black shadow-lg shadow-cyan-400/25'
                  : 'bg-gray-900 text-gray-400 hover:text-white hover:bg-gray-800 border border-gray-800'
              }`}
            >
              <span className="mr-2">{filter.icon}</span>
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-950/50 border border-red-900 rounded-xl animate-slideUp">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-red-400">{error}</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400"></div>
            <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border border-cyan-400 opacity-20"></div>
          </div>
          <span className="mt-4 text-gray-400">Analyzing market data...</span>
        </div>
      )}

      {/* Results */}
      {!loading && hasSearched && (
        <div className="animate-fadeIn">
          {stocks.length > 0 ? (
            <>
              <div className="flex items-center justify-between mb-6">
                <div className="text-sm text-gray-400">
                  Showing <span className="text-cyan-400 font-semibold">{stocks.length}</span> stocks
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Real-time data
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {stocks.map((stock, index) => (
                  <div key={stock.symbol_code} className="animate-slideUp" style={{ animationDelay: `${index * 0.05}s` }}>
                    <StockCard stock={stock} />
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-16 glass rounded-xl">
              <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-400 text-lg mb-2">No stocks found</p>
              <p className="text-gray-600 text-sm">
                Try adjusting your search or filters
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
