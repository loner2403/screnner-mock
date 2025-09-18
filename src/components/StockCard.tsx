'use client';

import { useRouter } from 'next/navigation';
import { type StockData, formatLargeNumber, formatPercentage } from '@/lib/api';
import { useState, useEffect } from 'react';

interface StockCardProps {
  stock: StockData;
}

export default function StockCard({ stock }: StockCardProps) {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);
  const [sparklineData, setSparklineData] = useState<number[]>([]);
  
  const isPositive = stock.change && stock.change >= 0;
  const changeColor = isPositive ? 'text-green-400' : 'text-red-400';
  const changeBgColor = isPositive ? 'bg-green-950/30 border-green-900/50' : 'bg-red-950/30 border-red-900/50';
  const glowColor = isPositive ? 'hover:shadow-green-400/20' : 'hover:shadow-red-400/20';

  // Generate mini sparkline data using seeded random for consistency
  useEffect(() => {
    const data = [];
    const basePrice = stock.close;

    // Create a simple seeded random function based on stock symbol
    const seed = stock.symbol_code.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    let rng = seed;
    const seededRandom = () => {
      rng = (rng * 9301 + 49297) % 233280;
      return rng / 233280;
    };

    for (let i = 0; i < 20; i++) {
      const variation = (seededRandom() - 0.5) * 0.05;
      data.push(basePrice * (1 + variation));
    }
    data.push(stock.close); // End with current price
    setSparklineData(data);
  }, [stock.close, stock.symbol_code]);

  const handleClick = () => {
    const symbolParam = encodeURIComponent(stock.symbol_code);
    router.push(`/stock/${symbolParam}`);
  };

  // Calculate day's change in rupees
  const dayChange = stock.change && stock.open 
    ? stock.close - stock.open 
    : 0;

  // Mini sparkline component
  const Sparkline = () => {
    if (sparklineData.length === 0) return null;
    
    const max = Math.max(...sparklineData);
    const min = Math.min(...sparklineData);
    const range = max - min;
    const width = 100;
    const height = 30;
    
    const points = sparklineData.map((value, index) => {
      const x = (index / (sparklineData.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    }).join(' ');
    
    return (
      <svg width={width} height={height} className="opacity-60">
        <polyline
          fill="none"
          stroke={isPositive ? '#00e676' : '#ff5252'}
          strokeWidth="1.5"
          points={points}
        />
      </svg>
    );
  };

  return (
    <div 
      className={`relative bg-gray-900 rounded-xl border border-gray-800 p-5 transition-all duration-300 cursor-pointer card-hover hover:border-gray-700 hover:shadow-xl ${glowColor} group`}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Bull/Bear Indicator */}
      <div className={`absolute top-2 right-2 ${isPositive ? 'text-green-400' : 'text-red-400'} opacity-20 group-hover:opacity-40 transition-opacity`}>
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
          {isPositive ? (
            <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" />
          ) : (
            <path fillRule="evenodd" d="M12 13a1 1 0 100 2h5a1 1 0 001-1V9a1 1 0 10-2 0v2.586l-4.293-4.293a1 1 0 00-1.414 0L8 9.586 3.707 5.293a1 1 0 00-1.414 1.414l5 5a1 1 0 001.414 0L11 9.414 14.586 13H12z" />
          )}
        </svg>
      </div>

      {/* Header */}
      <div className="mb-3">
        <h3 className="font-bold text-base text-white truncate group-hover:text-cyan-400 transition-colors">
          {stock.name}
        </h3>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-gray-500">{stock.symbol_code.split(':')[1] || stock.symbol_code}</span>
          <span className="text-xs px-2 py-0.5 bg-gray-800 text-gray-400 rounded">
            {stock.symbol_code.split(':')[0]}
          </span>
        </div>
      </div>

      {/* Price and Change */}
      <div className="mb-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <span className="text-2xl font-black text-white">
              ₹{stock.close.toFixed(2)}
            </span>
            {dayChange !== 0 && (
              <div className={`text-xs mt-1 ${changeColor}`}>
                {dayChange >= 0 ? '+' : ''}₹{dayChange.toFixed(2)}
              </div>
            )}
          </div>
          {stock.change !== undefined && stock.change !== null && (
            <span className={`px-2.5 py-1 rounded-lg text-sm font-bold ${changeBgColor} ${changeColor} border`}>
              {formatPercentage(stock.change)}
            </span>
          )}
        </div>
        
        {/* Mini Chart */}
        <div className="flex justify-center mt-2">
          <Sparkline />
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-black/30 rounded-lg p-2">
          <span className="text-xs text-gray-500 block">MCap</span>
          <span className="text-sm font-semibold text-white">
            {formatLargeNumber(stock.market_cap)}
          </span>
        </div>

        <div className="bg-black/30 rounded-lg p-2">
          <span className="text-xs text-gray-500 block">Volume</span>
          <span className="text-sm font-semibold text-white">
            {(stock.volume / 1000000).toFixed(1)}M
          </span>
        </div>

        {stock.price_earnings_ttm !== undefined && stock.price_earnings_ttm > 0 && (
          <div className="bg-black/30 rounded-lg p-2">
            <span className="text-xs text-gray-500 block">P/E</span>
            <span className="text-sm font-semibold text-white">
              {stock.price_earnings_ttm.toFixed(1)}
            </span>
          </div>
        )}

        {stock.dividends_yield !== undefined && stock.dividends_yield > 0 && (
          <div className="bg-black/30 rounded-lg p-2">
            <span className="text-xs text-gray-500 block">Div Yield</span>
            <span className="text-sm font-semibold text-white">
              {stock.dividends_yield.toFixed(2)}%
            </span>
          </div>
        )}
      </div>

      {/* Day Range Bar */}
      {stock.high !== undefined && stock.low !== undefined && (
        <div className="mt-4 pt-3 border-t border-gray-800">
          <div className="flex justify-between items-center text-xs text-gray-500 mb-1">
            <span>₹{stock.low.toFixed(0)}</span>
            <span className="text-gray-400">Day Range</span>
            <span>₹{stock.high.toFixed(0)}</span>
          </div>
          <div className="relative h-2 bg-gray-800 rounded-full overflow-hidden">
            <div 
              className="absolute h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 opacity-50"
              style={{ width: '100%' }}
            />
            <div 
              className="absolute h-2 w-2 bg-white rounded-full shadow-lg transform -translate-y-1/2 top-1/2"
              style={{ 
                left: `${((stock.close - stock.low) / (stock.high - stock.low)) * 100}%`,
                transform: 'translate(-50%, -50%)'
              }}
            />
          </div>
        </div>
      )}

      {/* Footer - Quick Actions */}
      <div className="mt-4 pt-3 border-t border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              console.log('Add to watchlist:', stock.symbol_code);
            }}
            className="text-gray-500 hover:text-cyan-400 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              console.log('View chart:', stock.symbol_code);
            }}
            className="text-gray-500 hover:text-cyan-400 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </button>
        </div>
        <div className="flex items-center gap-1">
          {stock.delay_seconds === 0 ? (
            <span className="flex items-center gap-1 text-xs text-green-400">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
              Live
            </span>
          ) : (
            <span className="text-xs text-gray-500">
              {stock.delay_seconds}s delay
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
