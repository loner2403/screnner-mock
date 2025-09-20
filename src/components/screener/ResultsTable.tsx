'use client'

import { ScreenerStock } from '@/lib/screener/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Download, ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface ResultsTableProps {
  stocks: ScreenerStock[]
  loading?: boolean
  total?: number
  onExport?: () => void
}

export function ResultsTable({ stocks, loading = false, total, onExport }: ResultsTableProps) {
  if (loading) {
    return <ResultsTableSkeleton />
  }

  if (stocks.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <p className="text-muted-foreground">No stocks match your criteria</p>
            <p className="text-sm text-muted-foreground mt-1">
              Try adjusting your filters
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const formatValue = (value?: number, suffix = '', decimals = 2) => {
    if (value === undefined || value === null) return '-'
    return value.toFixed(decimals) + suffix
  }

  const formatLargeNumber = (value?: number) => {
    if (value === undefined || value === null) return '-'
    if (value >= 1000) {
      return `₹${(value / 1000).toFixed(1)}K Cr`
    }
    return `₹${value.toFixed(1)} Cr`
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Screening Results</CardTitle>
          {total !== undefined && (
            <p className="text-sm text-muted-foreground mt-1">
              Found {total} stocks matching your criteria
            </p>
          )}
        </div>
        {onExport && stocks.length > 0 && (
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2 font-medium">Company</th>
                <th className="text-right p-2 font-medium">Current Ratio</th>
                <th className="text-right p-2 font-medium">D/E</th>
                <th className="text-right p-2 font-medium">Total Assets</th>
                <th className="text-right p-2 font-medium">Working Capital</th>
                <th className="text-right p-2 font-medium">TCE Ratio %</th>
                <th className="text-right p-2 font-medium">Market Cap</th>
                <th className="text-center p-2 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {stocks.map((stock) => (
                <tr key={stock.id} className="border-b hover:bg-muted/50">
                  <td className="p-2">
                    <div>
                      <div className="font-medium">{stock.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {stock.symbol}
                      </div>
                      {stock.sector && (
                        <Badge variant="outline" className="mt-1 text-xs">
                          {stock.sector}
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="text-right p-2">
                    {formatValue(stock.metrics.currentRatio, '', 2)}
                  </td>
                  <td className="text-right p-2">
                    {formatValue(stock.metrics.debtToEquity, '', 2)}
                  </td>
                  <td className="text-right p-2">
                    {formatLargeNumber(stock.metrics.totalAssets)}
                  </td>
                  <td className="text-right p-2">
                    {formatLargeNumber(stock.metrics.workingCapital)}
                  </td>
                  <td className="text-right p-2">
                    {formatValue(stock.metrics.tceRatio, '%', 1)}
                  </td>
                  <td className="text-right p-2">
                    {formatLargeNumber(stock.marketCap)}
                  </td>
                  <td className="text-center p-2">
                    <Link href={`/stock/${stock.symbol}`}>
                      <Button variant="outline" size="sm">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {stocks.length >= 50 && (
          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              Showing first {stocks.length} results. Use filters to narrow down results.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ResultsTableSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-60 mt-2" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <Skeleton className="h-12 w-40" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}