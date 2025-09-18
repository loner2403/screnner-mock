'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ProfitLossTableRow {
    year: string;
    salesRevenue: number;
    cogs: number;
    grossProfit: number;
    operatingExpenses: number;
    ebitda: number;
    ebitdaPercent: number;
    depreciation: number;
    ebit: number;
    interest: number;
    otherIncome: number;
    pbt: number;
    tax: number;
    pat: number;
    eps: number;
}

interface ProfitLossData {
    symbol: string;
    companyName: string;
    data: ProfitLossTableRow[];
    metadata: {
        last_update: string;
        currency: string;
        unit: string;
    };
}

interface ProfitAndLossTableProps {
    symbol: string;
    companyName?: string;
    className?: string;
}

const formatNumber = (value: number): string => {
    if (value === 0) return '0';
    if (value >= 1000) {
        return Math.round(value).toLocaleString('en-IN');
    }
    return value.toFixed(2);
};

const formatPercent = (value: number): string => {
    return `${value}%`;
};

export function ProfitAndLossTable({ symbol, companyName, className }: ProfitAndLossTableProps) {
    const [data, setData] = useState<ProfitLossData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/profit-and-loss/${encodeURIComponent(symbol)}`);

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }

            const result: ProfitLossData = await response.json();
            setData(result);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data';
            setError(errorMessage);
            console.error('Error fetching profit & loss data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (symbol) {
            fetchData();
        }
    }, [symbol]);

    if (loading) {
        return (
            <Card className={cn("w-full", className)}>
                <CardHeader>
                    <CardTitle className="text-xl font-bold">Profit & Loss</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="animate-pulse space-y-4">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-64 bg-gray-200 rounded"></div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error || !data) {
        return (
            <Card className={cn("w-full", className)}>
                <CardHeader>
                    <CardTitle className="text-xl font-bold">Profit & Loss</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8">
                        <p className="text-red-600 mb-4">{error || 'No data available'}</p>
                        <Button onClick={fetchData} variant="outline">
                            Try Again
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Get the last 13 years of data (or all if less than 13)
    const tableData = data.data.slice(0, 13);

    return (
        <Card className={cn("w-full", className)}>
            <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-xl font-bold">Profit & Loss</CardTitle>
                        <p className="text-sm text-gray-600 mt-1">
                            Consolidated Figures in Rs. Crores / View Standalone
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="text-xs">
                            📱 RELATED PARTY
                        </Button>
                        <Button variant="outline" size="sm" className="text-xs">
                            🎯 PRODUCT SEGMENTS
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b bg-gray-50">
                                <th className="text-left p-3 font-medium text-gray-700 sticky left-0 bg-gray-50 z-10 border-r">
                                    &nbsp;
                                </th>
                                {tableData.map((row) => (
                                    <th
                                        key={row.year}
                                        className="text-center p-3 font-medium text-gray-700 min-w-[80px] border-r last:border-r-0"
                                    >
                                        {row.year.includes('Mar') ? row.year : `Mar ${row.year}`}
                                    </th>
                                ))}
                                <th className="text-center p-3 font-medium text-gray-700 min-w-[80px]">
                                    TTM
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {/* Sales/Revenue */}
                            <tr className="hover:bg-gray-50">
                                <td className="p-3 font-medium sticky left-0 bg-white z-10 border-r">
                                    Sales/Revenue
                                </td>
                                {tableData.map((row) => (
                                    <td key={`sales-${row.year}`} className="text-center p-3 border-r last:border-r-0">
                                        {formatNumber(row.salesRevenue)}
                                    </td>
                                ))}
                                <td className="text-center p-3">
                                    {tableData.length > 0 ? formatNumber(tableData[0].salesRevenue) : '-'}
                                </td>
                            </tr>

                            {/* COGS */}
                            <tr className="hover:bg-gray-50">
                                <td className="p-3 font-medium sticky left-0 bg-white z-10 border-r">
                                    COGS
                                </td>
                                {tableData.map((row) => (
                                    <td key={`cogs-${row.year}`} className="text-center p-3 border-r last:border-r-0">
                                        {formatNumber(row.cogs)}
                                    </td>
                                ))}
                                <td className="text-center p-3">
                                    {tableData.length > 0 ? formatNumber(tableData[0].cogs) : '-'}
                                </td>
                            </tr>

                            {/* Gross Profit */}
                            <tr className="hover:bg-gray-50">
                                <td className="p-3 font-medium sticky left-0 bg-white z-10 border-r">
                                    Gross Profit
                                </td>
                                {tableData.map((row) => (
                                    <td key={`gross-profit-${row.year}`} className="text-center p-3 border-r last:border-r-0">
                                        {formatNumber(row.grossProfit)}
                                    </td>
                                ))}
                                <td className="text-center p-3">
                                    {tableData.length > 0 ? formatNumber(tableData[0].grossProfit) : '-'}
                                </td>
                            </tr>

                            {/* Operating Expenses */}
                            <tr className="hover:bg-gray-50">
                                <td className="p-3 font-medium sticky left-0 bg-white z-10 border-r">
                                    Operating Expenses
                                </td>
                                {tableData.map((row) => (
                                    <td key={`op-expenses-${row.year}`} className="text-center p-3 border-r last:border-r-0">
                                        {formatNumber(row.operatingExpenses)}
                                    </td>
                                ))}
                                <td className="text-center p-3">
                                    {tableData.length > 0 ? formatNumber(tableData[0].operatingExpenses) : '-'}
                                </td>
                            </tr>

                            {/* EBITDA */}
                            <tr className="hover:bg-gray-50">
                                <td className="p-3 font-medium sticky left-0 bg-white z-10 border-r">
                                    EBITDA
                                </td>
                                {tableData.map((row) => (
                                    <td key={`ebitda-${row.year}`} className="text-center p-3 border-r last:border-r-0">
                                        {formatNumber(row.ebitda)}
                                    </td>
                                ))}
                                <td className="text-center p-3">
                                    {tableData.length > 0 ? formatNumber(tableData[0].ebitda) : '-'}
                                </td>
                            </tr>

                            {/* EBITDA % */}
                            <tr className="hover:bg-gray-50">
                                <td className="p-3 font-medium sticky left-0 bg-white z-10 border-r">
                                    EBITDA%
                                </td>
                                {tableData.map((row) => (
                                    <td key={`ebitda-percent-${row.year}`} className="text-center p-3 border-r last:border-r-0">
                                        {row.ebitdaPercent.toFixed(2)}%
                                    </td>
                                ))}
                                <td className="text-center p-3">
                                    {tableData.length > 0 ? `${tableData[0].ebitdaPercent.toFixed(2)}%` : '-'}
                                </td>
                            </tr>

                            {/* Depreciation */}
                            <tr className="hover:bg-gray-50">
                                <td className="p-3 font-medium sticky left-0 bg-white z-10 border-r">
                                    Depreciation
                                </td>
                                {tableData.map((row) => (
                                    <td key={`depreciation-${row.year}`} className="text-center p-3 border-r last:border-r-0">
                                        {formatNumber(row.depreciation)}
                                    </td>
                                ))}
                                <td className="text-center p-3">
                                    {tableData.length > 0 ? formatNumber(tableData[0].depreciation) : '-'}
                                </td>
                            </tr>

                            {/* EBIT */}
                            <tr className="hover:bg-gray-50">
                                <td className="p-3 font-medium sticky left-0 bg-white z-10 border-r">
                                    EBIT
                                </td>
                                {tableData.map((row) => (
                                    <td key={`ebit-${row.year}`} className="text-center p-3 border-r last:border-r-0">
                                        {formatNumber(row.ebit)}
                                    </td>
                                ))}
                                <td className="text-center p-3">
                                    {tableData.length > 0 ? formatNumber(tableData[0].ebit) : '-'}
                                </td>
                            </tr>

                            {/* Interest */}
                            <tr className="hover:bg-gray-50">
                                <td className="p-3 font-medium sticky left-0 bg-white z-10 border-r">
                                    Interest
                                </td>
                                {tableData.map((row) => (
                                    <td key={`interest-${row.year}`} className="text-center p-3 border-r last:border-r-0">
                                        {formatNumber(row.interest)}
                                    </td>
                                ))}
                                <td className="text-center p-3">
                                    {tableData.length > 0 ? formatNumber(tableData[0].interest) : '-'}
                                </td>
                            </tr>

                            {/* Other Income */}
                            <tr className="hover:bg-gray-50">
                                <td className="p-3 font-medium sticky left-0 bg-white z-10 border-r">
                                    Other Income
                                </td>
                                {tableData.map((row) => (
                                    <td key={`other-income-${row.year}`} className="text-center p-3 border-r last:border-r-0">
                                        {formatNumber(row.otherIncome)}
                                    </td>
                                ))}
                                <td className="text-center p-3">
                                    {tableData.length > 0 ? formatNumber(tableData[0].otherIncome) : '-'}
                                </td>
                            </tr>

                            {/* PBT (Profit Before Tax) */}
                            <tr className="hover:bg-gray-50">
                                <td className="p-3 font-medium sticky left-0 bg-white z-10 border-r">
                                    PBT(Profit Before Tax)
                                </td>
                                {tableData.map((row) => (
                                    <td key={`pbt-${row.year}`} className="text-center p-3 border-r last:border-r-0">
                                        {formatNumber(row.pbt)}
                                    </td>
                                ))}
                                <td className="text-center p-3">
                                    {tableData.length > 0 ? formatNumber(tableData[0].pbt) : '-'}
                                </td>
                            </tr>

                            {/* Tax */}
                            <tr className="hover:bg-gray-50">
                                <td className="p-3 font-medium sticky left-0 bg-white z-10 border-r">
                                    Tax
                                </td>
                                {tableData.map((row) => (
                                    <td key={`tax-${row.year}`} className="text-center p-3 border-r last:border-r-0">
                                        {formatNumber(row.tax)}
                                    </td>
                                ))}
                                <td className="text-center p-3">
                                    {tableData.length > 0 ? formatNumber(tableData[0].tax) : '-'}
                                </td>
                            </tr>

                            {/* PAT (Profit After Tax) */}
                            <tr className="hover:bg-gray-50 font-medium">
                                <td className="p-3 font-semibold sticky left-0 bg-white z-10 border-r">
                                    PAT(Profit After Tax)
                                </td>
                                {tableData.map((row) => (
                                    <td key={`pat-${row.year}`} className="text-center p-3 font-semibold border-r last:border-r-0">
                                        {formatNumber(row.pat)}
                                    </td>
                                ))}
                                <td className="text-center p-3 font-semibold">
                                    {tableData.length > 0 ? formatNumber(tableData[0].pat) : '-'}
                                </td>
                            </tr>

                            {/* EPS */}
                            <tr className="hover:bg-gray-50">
                                <td className="p-3 font-medium sticky left-0 bg-white z-10 border-r">
                                    EPS
                                </td>
                                {tableData.map((row) => (
                                    <td key={`eps-${row.year}`} className="text-center p-3 border-r last:border-r-0">
                                        {row.eps.toFixed(2)}
                                    </td>
                                ))}
                                <td className="text-center p-3">
                                    {tableData.length > 0 ? tableData[0].eps.toFixed(2) : '-'}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className="p-4 text-xs text-gray-500 border-t">
                    <p>
                        Last updated: {new Date(data.metadata.last_update).toLocaleDateString('en-IN')} |
                        Currency: {data.metadata.currency} |
                        Unit: {data.metadata.unit}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}