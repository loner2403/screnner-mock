'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search as SearchIcon,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { searchStocksByName, type SearchResult } from '@/lib/api';

export default function HomePage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Debounced search function
  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setLoading(true);
    try {
      const response = await searchStocksByName(query, 8);
      setSearchResults(response.results);
      setShowResults(true);
    } catch (error) {
      console.error('Error searching stocks:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle search input changes with debouncing
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for debounced search
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(value);
    }, 300);
  };

  // Handle clicking on a search result
  const handleResultClick = async (result: SearchResult) => {
    setNavigating(true);
    setShowResults(false);

    try {
      // For testing, let's try with a known working symbol first
      if (result.name.toLowerCase().includes('jindal')) {
        router.push('/stock/NSE%3AJINDALSTEL');
        return;
      }

      // First try to search by company name to find the correct symbol in our stocks API
      const response = await fetch('/api/stocks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          searchTerm: result.name,
          limit: 10,
        }),
      });

      if (response.ok) {
        const data = await response.json();

        if (data.data && data.data.length > 0) {
          // Try multiple matching strategies
          let exactMatch = null;

          // Strategy 1: Exact name match
          exactMatch = data.data.find((stock: any) =>
            stock.name.toLowerCase() === result.name.toLowerCase()
          );

          // Strategy 2: Partial name match
          if (!exactMatch) {
            exactMatch = data.data.find((stock: any) =>
              stock.name.toLowerCase().includes(result.name.toLowerCase()) ||
              result.name.toLowerCase().includes(stock.name.toLowerCase())
            );
          }

          // Strategy 3: Company name keywords match
          if (!exactMatch) {
            const resultKeywords = result.name.toLowerCase().split(' ').filter(word => word.length > 3);
            exactMatch = data.data.find((stock: any) => {
              const stockKeywords = stock.name.toLowerCase().split(' ');
              return resultKeywords.some((keyword: string) =>
                stockKeywords.some((stockWord: string) => stockWord.includes(keyword) || keyword.includes(stockWord))
              );
            });
          }

          if (exactMatch) {
            const symbolParam = encodeURIComponent(exactMatch.symbol_code);
            router.push(`/stock/${symbolParam}`);
            return;
          }
        }
      }

      // Fallback: try with symbol transformation
      let transformedSymbol = result.symbol;
      if (transformedSymbol.includes('.NS')) {
        transformedSymbol = transformedSymbol.replace('.NS', '');
        transformedSymbol = `NSE:${transformedSymbol}`;
      } else if (transformedSymbol.includes('.BO')) {
        transformedSymbol = transformedSymbol.replace('.BO', '');
        transformedSymbol = `BSE:${transformedSymbol}`;
      }

      const symbolParam = encodeURIComponent(transformedSymbol);
      router.push(`/stock/${symbolParam}`);

    } catch (error) {
      console.error('Error finding stock:', error);
      alert(`Unable to find stock data for ${result.name}. Please try searching for a different company.`);
    } finally {
      setNavigating(false);
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchResults.length > 0) {
      handleResultClick(searchResults[0]);
    }
  };

  // Handle click outside to close results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Popular companies for quick access
  const popularStocks = [
    'RELIANCE',
    'TCS',
    'HDFC BANK',
    'INFOSYS',
    'ICICI BANK',
    'JINDAL',
    'ITC',
    'BHARTI',
    'TATA MOTORS',
    'AXIS BANK'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 flex flex-col items-center justify-center px-4">
      {/* Header Navigation - Fixed at top */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-lg flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-slate-900" fill="currentColor">
                <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">
                Bull<span className="text-teal-400"> AI</span>
              </h1>
              <p className="text-xs text-slate-400">Indian Stock Screener</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-8">
            <a href="#" className="text-slate-300 hover:text-white transition-colors">Home</a>
            <a href="#" className="text-slate-300 hover:text-white transition-colors">Features</a>
            <a href="#" className="text-slate-300 hover:text-white transition-colors">Pricing</a>
            <a href="#" className="text-slate-300 hover:text-white transition-colors">Contact</a>
            <button className="px-4 py-2 border border-teal-400 text-teal-400 rounded-lg hover:bg-teal-400 hover:text-slate-900 transition-all">
              Login →
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content - Centered */}
      <div className="w-full max-w-4xl text-center pt-20">
        {/* Badge */}
        <div className="inline-flex items-center px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-full text-sm text-slate-300 mb-8">
          <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
          No app download, track stocks in real-time
        </div>

        {/* Logo and Title */}
        <div className="mb-8">
          <h1 className="text-5xl lg:text-6xl font-bold mb-4">
            <span className="text-white">Bull</span><span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-300">AI</span>
          </h1>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto">
            The 1st AI assistant for the Indian equities market
          </p>
        </div>

        {/* Search Container - Outside of box */}
        <div ref={searchContainerRef} className="relative mb-8 max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="relative">
            <div className="relative">
              <SearchIcon className="absolute left-6 top-1/2 transform -translate-y-1/2 h-6 w-6 text-slate-400" />
              <Input
                ref={inputRef}
                type="text"
                placeholder="Search for a company"
                value={searchTerm}
                onChange={handleSearchChange}
                onFocus={() => searchTerm && setShowResults(true)}
                className="w-full pl-16 pr-20 py-6 text-xl bg-slate-900/70 border-2 border-slate-600 rounded-2xl text-white placeholder:text-slate-400 focus:ring-2 focus:ring-teal-400 focus:border-teal-400 transition-all shadow-2xl backdrop-blur-sm"
              />
              {loading && (
                <Loader2 className="absolute right-6 top-1/2 transform -translate-y-1/2 h-6 w-6 text-teal-400 animate-spin" />
              )}
            </div>
          </form>

          {/* Search Results Dropdown */}
          {showResults && searchResults.length > 0 && !navigating && (
            <div className="absolute top-full left-0 right-0 bg-slate-800/95 border border-slate-600 rounded-xl shadow-2xl z-50 mt-2 max-h-80 overflow-y-auto backdrop-blur-xl">
              {searchResults.map((result, index) => (
                <div
                  key={`${result.symbol}-${index}`}
                  onClick={() => handleResultClick(result)}
                  className="flex items-center justify-between p-4 hover:bg-slate-700/50 cursor-pointer border-b border-slate-700 last:border-b-0 transition-colors"
                >
                  <div>
                    <div className="font-medium text-white">{result.name}</div>
                    <div className="text-sm text-slate-400">{result.symbol}</div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-teal-400" />
                </div>
              ))}
            </div>
          )}

          {/* Navigation Loading State */}
          {navigating && (
            <div className="absolute top-full left-0 right-0 bg-slate-800/95 border border-slate-600 rounded-xl shadow-2xl z-50 mt-2 backdrop-blur-xl">
              <div className="p-4 text-center text-slate-300 flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-teal-400" />
                Loading stock data...
              </div>
            </div>
          )}

          {/* No Results Message */}
          {showResults && searchTerm && searchResults.length === 0 && !loading && (
            <div className="absolute top-full left-0 right-0 bg-slate-800/95 border border-slate-600 rounded-xl shadow-2xl z-50 mt-2 backdrop-blur-xl">
              <div className="p-4 text-center text-slate-400">
                No companies found for "{searchTerm}"
              </div>
            </div>
          )}
        </div>

        {/* Popular Companies */}
        <div className="mb-8">
          <p className="text-slate-400 mb-4 text-sm">Or search popular stocks:</p>
          <div className="flex flex-wrap justify-center gap-3">
            {popularStocks.slice(0, 6).map((company) => (
              <button
                key={company}
                onClick={() => {
                  setSearchTerm(company);
                  performSearch(company);
                }}
                className="px-4 py-2 text-sm bg-slate-700/50 text-slate-300 border border-slate-600 rounded-lg hover:bg-slate-600/50 hover:text-white hover:border-teal-400 transition-all"
              >
                {company}
              </button>
            ))}
          </div>
        </div>

        {/* Additional Features or Description */}
        <div className="text-center space-y-2 text-slate-400">
          <p>Instant search integration for real-time insights.</p>
          <p>AI scans market data for comprehensive analysis.</p>
        </div>
      </div>
    </div>
  );
}
