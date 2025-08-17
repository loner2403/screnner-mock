'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { type StockData, formatLargeNumber, formatPercentage, formatMarketCap } from '@/lib/api';

export default function StockDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [stock, setStock] = useState<StockData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState('1Y');

  const symbol = params.symbol as string;

  useEffect(() => {
    const fetchStockDetail = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/stocks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            searchTerm: decodeURIComponent(symbol),
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch stock data');
        }

        const data = await response.json();
        console.log(`Stock detail page received data for ${symbol}:`, data);
        
        if (data.data && data.data.length > 0) {
          // Find exact match first, then fallback to partial match
          const exactMatch = data.data.find((stock: StockData) => 
            stock.symbol_code === decodeURIComponent(symbol)
          );
          const partialMatch = data.data.find((stock: StockData) => 
            stock.symbol_code.includes(decodeURIComponent(symbol).replace('NSE:', '').replace('BSE:', ''))
          );
          
          setStock(exactMatch || partialMatch || data.data[0]);
        } else {
          setError('Stock not found');
        }
      } catch (err) {
        setError('Failed to load stock data');
        console.error('Error fetching stock detail:', err);
      } finally {
        setLoading(false);
      }
    };

    if (symbol) {
      fetchStockDetail();
    }
  }, [symbol]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !stock) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Stock Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'The requested stock could not be found.'}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const changeColor = stock.change && stock.change >= 0 ? 'text-green-600' : 'text-red-600';
  const changeBgColor = stock.change && stock.change >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200';
  const changeIcon = stock.change && stock.change >= 0 ? '●' : '●';

  const timeframes = ['1M', '6M', '1Y', '3Y', '5Y', '10Y', 'Max'];

  // Get exchange and symbol info
  const exchangeInfo = stock.symbol_code.split(':');
  const exchange = exchangeInfo[0];
  const symbolCode = exchangeInfo[1];

  // Generate mock chart data based on selected timeframe
  const generateChartData = () => {
    const dataPoints = selectedTimeframe === '1M' ? 30 : 
                      selectedTimeframe === '6M' ? 180 : 
                      selectedTimeframe === '1Y' ? 365 : 
                      selectedTimeframe === '3Y' ? 1095 : 
                      selectedTimeframe === '5Y' ? 1825 : 2555;
    
    const basePrice = stock.close;
    const performanceMap = {
      '1M': stock.performance_month || 2.3,
      '6M': stock.performance_6_month || 12.4,
      '1Y': stock.performance_year || 18.9,
      '3Y': (stock.performance_year || 18.9) * 2.2,
      '5Y': stock.performance_5_year || 85.2,
      '10Y': (stock.performance_5_year || 85.2) * 1.8,
      'Max': (stock.performance_5_year || 85.2) * 2.5
    };
    
    const totalReturn = performanceMap[selectedTimeframe as keyof typeof performanceMap];
    const data = [];
    
    for (let i = 0; i < Math.min(dataPoints, 50); i++) {
      const progress = i / Math.min(dataPoints, 50);
      const volatility = (Math.random() - 0.5) * 0.1;
      const trendReturn = totalReturn * progress / 100;
      const price = basePrice * (1 + trendReturn + volatility);
      
      data.push({
        date: `Day ${i + 1}`,
        price: Math.round(price * 100) / 100,
        volume: Math.round((stock.average_volume_30d || 7000000) * (0.8 + Math.random() * 0.4))
      });
    }
    
    return data;
  };

  const renderPerformanceChart = () => {
    const chartData = generateChartData();
    const maxPrice = Math.max(...chartData.map(d => d.price));
    const minPrice = Math.min(...chartData.map(d => d.price));
    const priceRange = maxPrice - minPrice;
    
    return (
      <div className="relative w-full h-full">
        <svg className="w-full h-full" viewBox="0 0 800 300">
          {/* Grid lines */}
          {[0, 1, 2, 3, 4].map(i => (
            <line
              key={`grid-${i}`}
              x1="50"
              y1={50 + i * 50}
              x2="750"
              y2={50 + i * 50}
              stroke="#e5e7eb"
              strokeWidth="1"
            />
          ))}
          
          {/* Price line */}
          <polyline
            fill="none"
            stroke="#2563eb"
            strokeWidth="2"
            points={chartData.map((point, index) => {
              const x = 50 + (index / (chartData.length - 1)) * 700;
              const y = 250 - ((point.price - minPrice) / priceRange) * 200;
              return `${x},${y}`;
            }).join(' ')}
          />
          
          {/* Y-axis labels */}
          {[0, 1, 2, 3, 4].map(i => (
            <text
              key={`y-label-${i}`}
              x="40"
              y={255 - i * 50}
              textAnchor="end"
              fontSize="12"
              fill="#6b7280"
            >
              ₹{Math.round(minPrice + (priceRange * i / 4))}
            </text>
          ))}
          
          {/* Current price indicator */}
          <circle
            cx={50 + 700}
            cy={250 - ((stock.close - minPrice) / priceRange) * 200}
            r="4"
            fill="#2563eb"
          />
        </svg>
        
        {/* Performance metrics */}
        <div className="absolute top-4 right-4 bg-white bg-opacity-90 rounded-lg p-3 border">
          <div className="text-sm">
            <div className="font-semibold text-gray-900">Performance</div>
            <div className={`text-sm ${(chartData[chartData.length - 1]?.price || 0) >= stock.close ? 'text-green-600' : 'text-red-600'}`}>
              {selectedTimeframe}: {((chartData[chartData.length - 1]?.price || stock.close) / stock.close - 1) * 100 >= 0 ? '+' : ''}
              {(((chartData[chartData.length - 1]?.price || stock.close) / stock.close - 1) * 100).toFixed(2)}%
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <button
            onClick={() => router.push('/')}
            className="flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>
        </div>
      </header>

      {/* Stock Header */}
      <div className="bg-white px-6 py-6">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">{stock.name}</h1>
              <div className="flex items-center space-x-4 text-sm">
                <a href={`https://${stock.name.toLowerCase().replace(/\s+/g, '').replace('ltd', '')}.com`} 
                   className="text-blue-600 hover:underline flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  {stock.name.toLowerCase().replace(/\s+/g, '').replace('ltd', '')}.com
                </a>
                <span className="text-gray-500">
                  <span className="bg-gray-100 px-2 py-1 rounded text-xs font-medium">BSE: {symbolCode}</span>
                </span>
                <span className="text-gray-500">
                  <span className="bg-blue-100 px-2 py-1 rounded text-xs font-medium">{exchange}: {symbolCode}</span>
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-5xl font-bold text-gray-900 mb-2">₹{stock.close.toFixed(2)}</div>
              {stock.change !== undefined && stock.change !== null && (
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-lg font-semibold ${changeBgColor} ${changeColor} border`}>
                  <span className="mr-1">{changeIcon}</span>
                  {formatPercentage(stock.change)}
                  <span className="text-sm text-gray-600 ml-2">14 Aug - close price</span>
                </div>
              )}
            </div>
          </div>

          {/* Key Metrics Grid - Matching Reference Layout */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <div className="grid grid-cols-3 md:grid-cols-6 gap-6">
              <div>
                <div className="text-sm text-gray-600 mb-1">Market Cap</div>
                <div className="text-lg font-semibold text-gray-900">
                  ₹{formatMarketCap(stock.market_cap)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Current Price</div>
                <div className="text-lg font-semibold text-gray-900">₹{stock.close.toFixed(0)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">High / Low</div>
                <div className="text-lg font-semibold text-gray-900">
                  ₹{stock.high?.toFixed(0)} / {stock.low?.toFixed(0)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Stock P/E</div>
                <div className="text-lg font-semibold text-gray-900">
                  {stock.price_earnings_ttm?.toFixed(1) || 'N/A'}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Book Value</div>
                <div className="text-lg font-semibold text-gray-900">
                  {stock.price_book_fq ? `₹${stock.price_book_fq.toFixed(0)}` : 'N/A'}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Dividend Yield</div>
                <div className="text-lg font-semibold text-gray-900">
                  {stock.dividends_yield?.toFixed(2)}%
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">ROCE</div>
                <div className="text-lg font-semibold text-gray-900">
                  {stock.return_on_invested_capital_fq ? `${stock.return_on_invested_capital_fq.toFixed(1)}%` : 'N/A'}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">ROE</div>
                <div className="text-lg font-semibold text-gray-900">
                  {stock.return_on_equity_fq ? `${stock.return_on_equity_fq.toFixed(1)}%` : 'N/A'}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Face Value</div>
                <div className="text-lg font-semibold text-gray-900">
                  ₹{stock.beta_1_year?.toFixed(2) || '1.00'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white px-6 py-6 border-t border-gray-200">
        <div className="mx-auto max-w-7xl">
          {/* Timeframe Buttons */}
          <div className="flex space-x-1 mb-6">
            {timeframes.map((timeframe) => (
              <button
                key={timeframe}
                onClick={() => setSelectedTimeframe(timeframe)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  selectedTimeframe === timeframe
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {timeframe}
              </button>
            ))}
          </div>

          {/* Chart Placeholder */}
          <div className="bg-gray-50 rounded-lg p-8 text-center min-h-[400px] flex items-center justify-center">
            <div className="text-gray-500">
              <div className="mb-4">
                <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Price Chart</h3>
              <p className="text-gray-600">
                Chart for {selectedTimeframe} timeframe will be displayed here.
                <br />
                Integration with charting library (Chart.js, Recharts, etc.) pending.
              </p>
            </div>
          </div>

          {/* Chart Legend */}
          <div className="flex items-center justify-center space-x-6 mt-4 text-sm">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-600 rounded-full mr-2"></div>
              <span className="text-gray-600">Price on {exchange}</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
              <span className="text-gray-600">50 DMA</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
              <span className="text-gray-600">200 DMA</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-gray-400 rounded-full mr-2"></div>
              <span className="text-gray-600">Volume</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
