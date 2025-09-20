'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { X, Plus } from 'lucide-react'
import { Filter, FilterField, FilterOperator } from '@/lib/screener/types'

interface FilterFormProps {
  filters: Filter[]
  onFiltersChange: (filters: Filter[]) => void
  onSearch: () => void
  loading?: boolean
}

const FILTER_FIELDS: { value: FilterField; label: string }[] = [
  // Available from BalanceSheet data
  { value: 'currentRatio', label: 'Current Ratio' },
  { value: 'debtToEquity', label: 'Debt/Equity Ratio' },
  { value: 'marketCap', label: 'Market Cap (₹ Cr)' },
  { value: 'totalAssets', label: 'Total Assets (₹ Cr)' },
  { value: 'totalEquity', label: 'Total Equity (₹ Cr)' },
  { value: 'totalLiabilities', label: 'Total Liabilities (₹ Cr)' },
  { value: 'currentAssets', label: 'Current Assets (₹ Cr)' },
  { value: 'currentLiabilities', label: 'Current Liabilities (₹ Cr)' },
  { value: 'workingCapital', label: 'Working Capital (₹ Cr)' },
  { value: 'netDebt', label: 'Net Debt (₹ Cr)' },
  { value: 'tceRatio', label: 'TCE Ratio (%)' },
  { value: 'debtToAssets', label: 'Debt/Assets (%)' },
  { value: 'equityRatio', label: 'Equity Ratio (%)' },
  { value: 'cashConversionCycle', label: 'Cash Conversion Cycle (Days)' }
]

const OPERATORS: { value: FilterOperator; label: string }[] = [
  { value: 'gt', label: '>' },
  { value: 'gte', label: '≥' },
  { value: 'lt', label: '<' },
  { value: 'lte', label: '≤' },
  { value: 'eq', label: '=' }
]

export function FilterForm({ filters, onFiltersChange, onSearch, loading = false }: FilterFormProps) {
  const addFilter = () => {
    if (filters.length >= 10) return // Max 10 filters

    const newFilter: Filter = {
      field: 'currentRatio',
      operator: 'gt',
      value: 1.5
    }
    onFiltersChange([...filters, newFilter])
  }

  const removeFilter = (index: number) => {
    const newFilters = filters.filter((_, i) => i !== index)
    onFiltersChange(newFilters)
  }

  const updateFilter = (index: number, updates: Partial<Filter>) => {
    const newFilters = filters.map((filter, i) =>
      i === index ? { ...filter, ...updates } : filter
    )
    onFiltersChange(newFilters)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock Screener Filters</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {filters.map((filter, index) => (
            <div key={index} className="flex items-center gap-2 p-3 border rounded-md">
              <Select
                value={filter.field}
                onValueChange={(value: FilterField) => updateFilter(index, { field: value })}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FILTER_FIELDS.map(field => (
                    <SelectItem key={field.value} value={field.value}>
                      {field.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filter.operator}
                onValueChange={(value: FilterOperator) => updateFilter(index, { operator: value })}
              >
                <SelectTrigger className="w-16">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OPERATORS.map(op => (
                    <SelectItem key={op.value} value={op.value}>
                      {op.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                type="number"
                step="0.01"
                value={filter.value}
                onChange={(e) => updateFilter(index, { value: parseFloat(e.target.value) || 0 })}
                className="w-32"
                placeholder="Value"
              />

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removeFilter(index)}
                className="p-2"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={addFilter}
              disabled={filters.length >= 10}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Filter
            </Button>

            <Button
              type="submit"
              disabled={filters.length === 0 || loading}
              className="flex items-center gap-2"
            >
              {loading ? 'Searching...' : 'Screen Stocks'}
            </Button>
          </div>

          {filters.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Add at least one filter to start screening stocks
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  )
}