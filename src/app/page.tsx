'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  TrendingDown, 
  Search as SearchIcon,
  Activity,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Star
} from 'lucide-react';
import { searchStocks, type StockData, formatMarketCap } from '@/lib/api';

export default function HomePage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [stocks, setStocks] = useState<StockData[]>([]);
  const [loading, setLoading] = useState(false);
  const [marketOpen, setMarketOpen] = useState(true);

  useEffect(() => {
    // Load initial stocks
    loadStocks();
  }, []);

  const loadStocks = async (search = '') => {
    setLoading(true);
    try {
      const response = await searchStocks({
        searchTerm: search,
        page: 1,
        sortBy: 'market_cap',
        sortOrder: 'desc',
      });
      setStocks(response.data || []);
    } catch (error) {
      console.error('Error loading stocks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadStocks(searchTerm);
  };

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };



  const indices = [
    { name: 'NIFTY 50', value: 22513.70, change: 1.56, icon: BarChart3 },
    { name: 'SENSEX', value: 73667.96, change: 0.56, icon: TrendingUp },
    { name: 'BANK NIFTY', value: 48125.35, change: -0.32, icon: Activity },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* Logo */}
              <div className="relative h-10 w-10">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <path 
                    d="M25 45 Q20 35 15 30 Q15 25 20 25 Q25 30 30 35 L35 40 Q40 35 50 35 Q60 35 65 40 L70 35 Q75 30 80 25 Q85 25 85 30 Q80 35 75 45 M35 40 Q30 50 30 60 Q30 75 50 75 Q70 75 70 60 Q70 50 65 40"
                    fill="none"
                    stroke="hsl(187, 92%, 43%)"
                    strokeWidth="3"
                  />
                  <path 
                    d="M75 70 L75 25 M65 35 L75 25 L85 35"
                    stroke="hsl(187, 92%, 43%)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold">BullScreen</h1>
                <p className="text-xs text-muted-foreground">Indian Stock Screener</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Badge variant={marketOpen ? "default" : "secondary"} className="gap-1">
                <div className={`w-2 h-2 rounded-full ${marketOpen ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                Market {marketOpen ? 'Open' : 'Closed'}
              </Badge>
              <Button variant="outline" size="sm">
                <Star className="h-4 w-4 mr-1" />
                Watchlist
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold mb-4">
            Track Indian Markets in <span className="text-primary">Real-Time</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Analyze NSE & BSE stocks with advanced screening tools and live market data
          </p>
        </div>

        {/* Market Indices */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {indices.map((index) => {
            const Icon = index.icon;
            const isPositive = index.change >= 0;
            return (
              <Card key={index.name} className="hover:shadow-lg transition-all duration-300">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">{index.name}</CardTitle>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-2xl font-bold">{index.value.toLocaleString()}</p>
                      <div className="flex items-center mt-1">
                        {isPositive ? (
                          <ArrowUpRight className="h-4 w-4 text-green-500" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4 text-red-500" />
                        )}
                        <span className={`text-sm font-medium ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                          {isPositive ? '+' : ''}{index.change}%
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Search Bar */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search by company name or symbol..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button type="submit" className="bg-primary hover:bg-primary/90">
                Search
              </Button>
            </form>
            
            {/* Quick Search Tags */}
            <div className="flex flex-wrap gap-2 mt-4">
              <span className="text-sm text-muted-foreground">Popular:</span>
              {['RELIANCE', 'TCS', 'HDFC BANK', 'INFOSYS', 'ICICI BANK'].map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                  onClick={() => {
                    setSearchTerm(tag);
                    loadStocks(tag);
                  }}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Stocks Grid */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-4">
            <TabsTrigger value="all">All Stocks</TabsTrigger>
            <TabsTrigger value="gainers">Top Gainers</TabsTrigger>
            <TabsTrigger value="losers">Top Losers</TabsTrigger>
            <TabsTrigger value="active">Most Active</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-6">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {stocks.map((stock) => {
                  const isPositive = stock.change && stock.change >= 0;
                  return (
                    <Card
                      key={stock.symbol_code}
                      className="hover:shadow-xl transition-all duration-300 cursor-pointer group"
                      onClick={() => {
                        const symbolParam = encodeURIComponent(stock.symbol_code);
                        router.push(`/stock/${symbolParam}`);
                      }}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-base font-semibold line-clamp-1">
                              {stock.name}
                            </CardTitle>
                            <CardDescription className="text-xs">
                              {stock.symbol_code}
                            </CardDescription>
                          </div>
                          <Badge variant={isPositive ? "default" : "destructive"} className="text-xs">
                            {isPositive ? '+' : ''}{stock.change?.toFixed(2)}%
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between items-end">
                            <span className="text-2xl font-bold">{formatPrice(stock.close)}</span>
                            {isPositive ? (
                              <TrendingUp className="h-5 w-5 text-green-500" />
                            ) : (
                              <TrendingDown className="h-5 w-5 text-red-500" />
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <p className="text-muted-foreground">Market Cap</p>
                              <p className="font-medium">{formatMarketCap(stock.market_cap)}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Volume</p>
                              <p className="font-medium">{(stock.volume / 1000000).toFixed(1)}M</p>
                            </div>
                          </div>
                          
                          {stock.high && stock.low && (
                            <div className="pt-2 border-t">
                              <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Day Range</span>
                                <span className="font-medium">
                                  {formatPrice(stock.low)} - {formatPrice(stock.high)}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </section>

      {/* Features Section */}
      <section className="bg-muted/50 py-12 mt-12">
        <div className="container mx-auto px-4">
          <h3 className="text-2xl font-bold text-center mb-8">Why Choose BullScreen?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <BarChart3 className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">Advanced Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Comprehensive financial metrics, ratios, and technical indicators
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <Clock className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">Real-Time Data</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Live price updates and instant market movements monitoring
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <SearchIcon className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">Smart Screening</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Filter stocks by multiple parameters to find opportunities
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
