import { ScreenerPage } from '@/components/screener/ScreenerPage'

export default function ScreenerRoute() {
  return <ScreenerPage />
}

export const metadata = {
  title: 'Stock Screener | Filter Stocks by Financial Ratios',
  description: 'Screen stocks by P/E ratio, ROE, ROCE, debt/equity and other financial metrics. Find stocks that match your investment criteria.',
}