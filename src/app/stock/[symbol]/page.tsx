'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, TrendingDown } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { type StockData } from '@/lib/api';
import CompanyInfoSection from '@/components/CompanyInfoSection';
import StockChart from '@/components/StockChart/StockChart';
import { QuarterlyResultsTable } from '@/components/QuarterlyResults';
import { BalanceSheetTable } from '@/components/BalanceSheet';
import { ProfitAndLossTable } from '@/components/ProfitAndLoss';
import { CashFlowTable } from '@/components/CashFlow';
import { RatiosTable } from '@/components/Ratios';



// Extended interface for detailed stock data as per design document
interface DetailedStockData extends StockData {
    // Company Information
    sector?: string;
    industry?: string;
    employees?: number;
    website?: string;
    description?: string;
    headquarters?: string;
    founded?: string;

    // Financial Health
    debt_to_equity?: number;
    current_ratio?: number;
    quick_ratio?: number;
    interest_coverage?: number;

    // Valuation Metrics
    price_to_sales?: number;
    enterprise_value?: number;
    ev_to_ebitda?: number;
    ev_to_sales?: number;

    // Profitability
    gross_margin?: number;
    operating_margin?: number;
    net_margin?: number;

    // Efficiency
    asset_turnover?: number;
    inventory_turnover?: number;
    receivables_turnover?: number;

    // Growth Rates
    revenue_growth_1y?: number;
    revenue_growth_3y?: number;
    earnings_growth_1y?: number;
    earnings_growth_3y?: number;

    // Performance Returns
    return_1_week?: number;
    return_1_month?: number;
    return_3_months?: number;
    return_6_months?: number;
    return_1_year?: number;
    return_3_years?: number;
    return_5_years?: number;

    // Risk Metrics
    volatility_1_month?: number;
    volatility_1_year?: number;
    max_drawdown?: number;
    sharpe_ratio?: number;

    // Dividend Information
    dividend_frequency?: 'Annual' | 'Semi-Annual' | 'Quarterly' | 'Monthly';
    last_dividend_date?: string;
    next_dividend_date?: string;
    dividend_growth_rate?: number;

    // Trading Information
    average_volume_30d?: number;
    shares_outstanding?: number;
    float_shares?: number;
    insider_ownership?: number;
    institutional_ownership?: number;
}

interface StockDetailPageProps {
    params: Promise<{ symbol: string }>;
}

// Loading skeleton component
const LoadingSkeleton = () => (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <div className="container mx-auto px-4 py-8">
            {/* Header skeleton */}
            <div className="flex items-center gap-4 mb-8">
                <div className="w-8 h-8 bg-gray-200 rounded animate-pulse" />
                <div className="flex-1">
                    <div className="h-8 bg-gray-200 rounded w-64 mb-2 animate-pulse" />
                    <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
                </div>
                <div className="flex gap-2">
                    <div className="w-24 h-8 bg-gray-200 rounded animate-pulse" />
                    <div className="w-24 h-8 bg-gray-200 rounded animate-pulse" />
                </div>
            </div>

            {/* Price section skeleton */}
            <Card className="mb-8">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <div className="h-12 bg-gray-200 rounded w-48 mb-2 animate-pulse" />
                            <div className="h-6 bg-gray-200 rounded w-32 animate-pulse" />
                        </div>
                        <div className="h-8 bg-gray-200 rounded w-24 animate-pulse" />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="space-y-2">
                                <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
                                <div className="h-6 bg-gray-200 rounded w-24 animate-pulse" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Content skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardContent className="p-6">
                            <div className="h-64 bg-gray-200 rounded animate-pulse" />
                        </CardContent>
                    </Card>
                </div>
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="h-6 bg-gray-200 rounded w-32 animate-pulse" />
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {[...Array(6)].map((_, i) => (
                                    <div key={i} className="flex justify-between">
                                        <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
                                        <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    </div>
);

// Error component
const ErrorState = ({ error, onRetry }: { error: string; onRetry: () => void }) => (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <div className="container mx-auto px-4 py-8">
            <div className="flex items-center gap-4 mb-8">
                <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-2xl font-bold">Stock Details</h1>
            </div>

            <Card className="max-w-md mx-auto">
                <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <TrendingDown className="h-8 w-8 text-red-500" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Unable to Load Stock Data</h3>
                    <p className="text-muted-foreground mb-4">{error}</p>
                    <div className="flex gap-2 justify-center">
                        <Button onClick={onRetry}>Try Again</Button>
                        <Button variant="outline" onClick={() => window.history.back()}>
                            Go Back
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    </div>
);

function StockDetailPage({ params }: StockDetailPageProps) {
    const router = useRouter();
    const [stockData, setStockData] = useState<DetailedStockData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isInWatchlist, setIsInWatchlist] = useState(false);
    const [symbol, setSymbol] = useState<string>('');

    // Resolve params and decode the symbol parameter
    useEffect(() => {
        params.then(resolvedParams => {
            setSymbol(decodeURIComponent(resolvedParams.symbol));
        });
    }, [params]);

    const fetchStockData = async () => {
        setLoading(true);
        setError(null);

        try {
            // For now, we'll use the existing stocks API to get basic data
            // This will be replaced with the detailed API endpoint in task 2
            const response = await fetch('/api/stocks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    searchTerm: symbol,
                    limit: 1,
                }),
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch stock data: ${response.status}`);
            }

            const data = await response.json();

            if (!data.data || data.data.length === 0) {
                throw new Error(`Stock with symbol "${symbol}" not found`);
            }

            // Find exact match or closest match
            const exactMatch = data.data.find((stock: StockData) =>
                stock.symbol_code.toLowerCase() === symbol.toLowerCase() ||
                stock.symbol_code.split(':')[1]?.toLowerCase() === symbol.toLowerCase()
            );

            if (!exactMatch) {
                throw new Error(`Stock with symbol "${symbol}" not found`);
            }

            setStockData(exactMatch);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
            setError(errorMessage);
            console.error('Error fetching stock data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (symbol) {
            fetchStockData();
        }
    }, [symbol]);

    const handleWatchlistToggle = () => {
        setIsInWatchlist(!isInWatchlist);
        // TODO: Implement actual watchlist functionality in task 13
        console.log(`${isInWatchlist ? 'Removed from' : 'Added to'} watchlist:`, symbol);
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: `${stockData?.name} (${symbol})`,
                text: `Check out ${stockData?.name} stock details`,
                url: window.location.href,
            });
        } else {
            navigator.clipboard.writeText(window.location.href);
            // TODO: Show toast notification
            console.log('URL copied to clipboard');
        }
    };



    // Show loading state
    if (loading) {
        return <LoadingSkeleton />;
    }

    // Show error state
    if (error || !stockData) {
        return <ErrorState error={error || 'Stock data not available'} onRetry={fetchStockData} />;
    }

    const isPositive = stockData.change && stockData.change >= 0;
    const changeColor = isPositive ? 'text-green-600' : 'text-red-600';
    const changeBgColor = isPositive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700';

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            <div className="container mx-auto px-4 py-8">
                {/* Company Info Section - USD values are automatically converted to INR in crores format */}
                <CompanyInfoSection
                    symbol={symbol}
                    companyName={stockData.name}
                    currentPrice={stockData.close} // USD price, converted to INR in component
                    change={stockData.change || 0}
                    changePercent={stockData.change || 0}
                    marketCap={stockData.market_cap} // USD market cap, will be converted to INR crores in component
                    high={stockData.high || stockData.close} // USD high, converted to INR in component
                    low={stockData.low || stockData.close} // USD low, converted to INR in component
                    pe={stockData.price_earnings_ttm}
                    bookValue={stockData.price_book_fq} // USD book value, converted to INR in component
                    dividendYield={stockData.dividends_yield}
                    roce={stockData.return_on_invested_capital_fq}
                    roe={stockData.return_on_equity_fq}
                    faceValue={1}
                    website="https://hul.co.in"
                    bseCode="500696"
                    nseCode="HINDUNILVR"
                    description={`${stockData.name} is in the FMCG business comprising primarily of Home Care, Beauty & Personal Care and Foods & Refreshment segments.`}
                    sector={stockData.sector || "Consumer Goods"}
                    businessSegments={["Home Care", "Beauty & Personal Care", "Foods & Refreshment"]}
                    className="mb-8"
                />

                {/* Stock Chart Section - Full Width */}
                <div className="mb-8">
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">Stock Chart</h2>
                        <p className="text-gray-600">Real-time stock data with technical indicators and financial metrics</p>
                    </div>
                    <StockChart
                        symbol={symbol}
                        className="w-full shadow-lg"
                    />
                </div>

                

                {/* Quarterly Results Section */}
                        <QuarterlyResultsTable
                            symbol={symbol}
                            companyName={stockData.name}
                            sector={stockData.sector}
                            className="mt-8"
                        />

                {/* Balance Sheet Section */}
                        <BalanceSheetTable
                            symbol={symbol}
                            companyName={stockData.name}
                            sector={stockData.sector}
                            className="mt-8"
                        />

                {/* Profit and Loss Section */}
                        <ProfitAndLossTable
                            symbol={symbol}
                            companyName={stockData.name}
                            className="mt-8"
                        />

                {/* Cash Flow Section */}
                        <CashFlowTable
                            symbol={symbol}
                            companyName={stockData.name}
                            sector={stockData.sector}
                            className="mt-8"
                        />

                {/* Ratios Section */}
                        <RatiosTable
                            symbol={symbol}
                            companyName={stockData.name}
                            sector={stockData.sector}
                            className="mt-8"
                        />
            </div>
        </div>
    );
}
export
    default StockDetailPage;