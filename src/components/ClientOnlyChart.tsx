'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

// Dynamically import StockChart with no SSR
const StockChart = dynamic(
  () => import('@/components/StockChart'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-[600px] space-y-4">
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
            <Skeleton key={i} className="h-8 w-12 bg-gray-800" />
          ))}
        </div>
        <Skeleton className="w-full h-[400px] bg-gray-900" />
        <div className="grid grid-cols-4 gap-4">
          <Skeleton className="h-20 bg-gray-800" />
          <Skeleton className="h-20 bg-gray-800" />
          <Skeleton className="h-20 bg-gray-800" />
          <Skeleton className="h-20 bg-gray-800" />
        </div>
      </div>
    )
  }
);

interface ClientOnlyChartProps {
  symbol: string;
  currentPrice: number;
  className?: string;
}

export default function ClientOnlyChart(props: ClientOnlyChartProps) {
  return <StockChart {...props} />;
}
