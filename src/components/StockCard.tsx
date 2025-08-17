'use client';

import { useRouter } from 'next/navigation';
import { type StockData, formatLargeNumber, formatPercentage } from '@/lib/api';

interface StockCardProps {
  stock: StockData;
}

export default function StockCard({ stock }: StockCardProps) {
  const router = useRouter();
  const changeColor = stock.change && stock.change >= 0 ? 'text-green-600' : 'text-red-600';
  const changeBgColor = stock.change && stock.change >= 0 ? 'bg-green-50' : 'bg-red-50';

  const handleClick = () => {
    const symbolParam = encodeURIComponent(stock.symbol_code);
    router.push(`/stock/${symbolParam}`);
  };

  return (
    <div 
      className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer hover:border-blue-300"
      onClick={handleClick}
    >
      {/* Header */}
      <div className="mb-4">
        <h3 className="font-semibold text-lg text-gray-900 truncate">
          {stock.name}
        </h3>
        <p className="text-sm text-gray-500">{stock.symbol_code}</p>
      </div>

      {/* Price and Change */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-gray-900">
            ₹{stock.close.toFixed(2)}
          </span>
          {stock.change !== undefined && stock.change !== null && (
            <span className={`px-2 py-1 rounded text-sm font-medium ${changeBgColor} ${changeColor}`}>
              {formatPercentage(stock.change)}
            </span>
          )}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Market Cap</span>
          <span className="text-sm font-medium text-gray-900">
            {formatLargeNumber(stock.market_cap)}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Volume</span>
          <span className="text-sm font-medium text-gray-900">
            {stock.volume.toLocaleString('en-IN')}
          </span>
        </div>

        {stock.high !== undefined && stock.low !== undefined && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Day Range</span>
            <span className="text-sm font-medium text-gray-900">
              ₹{stock.low.toFixed(2)} - ₹{stock.high.toFixed(2)}
            </span>
          </div>
        )}

        {stock.price_earnings_ttm !== undefined && stock.price_earnings_ttm > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">P/E Ratio</span>
            <span className="text-sm font-medium text-gray-900">
              {stock.price_earnings_ttm.toFixed(2)}
            </span>
          </div>
        )}

        {stock.dividends_yield !== undefined && stock.dividends_yield > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Dividend Yield</span>
            <span className="text-sm font-medium text-gray-900">
              {stock.dividends_yield.toFixed(2)}%
            </span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>{stock.country}</span>
          {stock.delay_seconds > 0 && (
            <span>Delayed {stock.delay_seconds}s</span>
          )}
        </div>
      </div>
    </div>
  );
}
