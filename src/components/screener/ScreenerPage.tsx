'use client'

import { useState, useCallback } from 'react'
import { FilterForm } from './FilterForm'
import { ResultsTable } from './ResultsTable'
import { ErrorBoundary } from './ErrorBoundary'
import { Filter, ScreenerResponse, ScreenerStock } from '@/lib/screener/types'
import { useToast } from '@/hooks/use-toast'

export function ScreenerPage() {
  const [filters, setFilters] = useState<Filter[]>([])
  const [stocks, setStocks] = useState<ScreenerStock[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState<number>()
  const { toast } = useToast()

  const handleSearch = useCallback(async () => {
    if (filters.length === 0) {
      toast({
        title: "No filters",
        description: "Please add at least one filter to screen stocks",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/screener', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filters,
          limit: 100,
          offset: 0
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch results')
      }

      const data: ScreenerResponse = await response.json()
      setStocks(data.stocks)
      setTotal(data.total)

      toast({
        title: "Search completed",
        description: `Found ${data.total} stocks matching your criteria`,
      })

    } catch (error) {
      console.error('Search error:', error)
      toast({
        title: "Search failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      })
      setStocks([])
      setTotal(undefined)
    } finally {
      setLoading(false)
    }
  }, [filters, toast])

  const handleExportCSV = useCallback(() => {
    if (stocks.length === 0) return

    // Create CSV headers - only fields available from BalanceSheet data
    const headers = [
      'Symbol', 'Name', 'Sector', 'Industry', 'Market Cap (₹ Cr)',
      'Current Ratio', 'Debt/Equity', 'Total Assets (₹ Cr)', 'Total Equity (₹ Cr)',
      'Total Liabilities (₹ Cr)', 'Current Assets (₹ Cr)', 'Current Liabilities (₹ Cr)',
      'Working Capital (₹ Cr)', 'Net Debt (₹ Cr)', 'TCE Ratio %', 'Debt/Assets %',
      'Equity Ratio %', 'Cash Conversion Cycle (Days)'
    ]

    // Create CSV rows
    const rows = stocks.map(stock => [
      stock.symbol,
      stock.name,
      stock.sector || '',
      stock.industry || '',
      stock.marketCap?.toString() || '',
      stock.metrics.currentRatio?.toString() || '',
      stock.metrics.debtToEquity?.toString() || '',
      stock.metrics.totalAssets?.toString() || '',
      stock.metrics.totalEquity?.toString() || '',
      stock.metrics.totalLiabilities?.toString() || '',
      stock.metrics.currentAssets?.toString() || '',
      stock.metrics.currentLiabilities?.toString() || '',
      stock.metrics.workingCapital?.toString() || '',
      stock.metrics.netDebt?.toString() || '',
      stock.metrics.tceRatio?.toString() || '',
      stock.metrics.debtToAssets?.toString() || '',
      stock.metrics.equityRatio?.toString() || '',
      stock.metrics.cashConversionCycle?.toString() || ''
    ])

    // Combine headers and rows
    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n')

    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `screener_results_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "Export successful",
      description: "CSV file downloaded successfully",
    })
  }, [stocks, toast])

  return (
    <ErrorBoundary>
      <div className="container mx-auto py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Stock Screener</h1>
          <p className="text-muted-foreground mt-2">
            Filter stocks by financial ratios and metrics
          </p>
        </div>

        <FilterForm
          filters={filters}
          onFiltersChange={setFilters}
          onSearch={handleSearch}
          loading={loading}
        />

        <ResultsTable
          stocks={stocks}
          loading={loading}
          total={total}
          onExport={handleExportCSV}
        />
      </div>
    </ErrorBoundary>
  )
}