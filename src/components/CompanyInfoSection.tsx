'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  FileSpreadsheet,
  Plus,
  Edit3,
  ChevronRight,
  Building2,
  Globe,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatMarketCap } from '@/lib/api';


interface CompanyInfoSectionProps {
  symbol: string;
  companyName: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  marketCap: number;
  high: number;
  low: number;
  pe?: number;
  bookValue?: number;
  dividendYield?: number;
  roce?: number;
  roe?: number;
  faceValue?: number;
  website?: string;
  bseCode?: string;
  nseCode?: string;
  description?: string;
  sector?: string;
  businessSegments?: string[];
  className?: string;
}

const CompanyInfoSection: React.FC<CompanyInfoSectionProps> = ({
  symbol,
  companyName,
  currentPrice,
  change,
  changePercent,
  marketCap,
  high,
  low,
  pe,
  bookValue,
  dividendYield,
  roce,
  roe,
  faceValue = 1,
  website,
  bseCode,
  nseCode,
  description,
  sector,
  businessSegments = [],
  className
}) => {
  const [newRatio, setNewRatio] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);



  const isPositive = changePercent >= 0;

  const handleExportToExcel = () => {
    console.log('Export to Excel clicked');
  };

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
    console.log(`${isFollowing ? 'Unfollowed' : 'Followed'} ${companyName}`);
  };

  const handleAddRatio = () => {
    if (newRatio.trim()) {
      console.log('Add ratio:', newRatio);
      setNewRatio('');
    }
  };

  const handleEditRatios = () => {
    console.log('Edit ratios clicked');
  };

  return (
    <div className={cn("w-full bg-white rounded-lg border border-gray-200 p-6", className)}>
      {/* Company Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <h1 className="text-3xl font-bold text-gray-900">{companyName}</h1>
            <span className="text-2xl font-bold text-gray-900">{currentPrice}</span>
            <Badge
              variant="secondary"
              className={cn(
                "text-sm font-medium",
                isPositive ? "bg-red-50 text-red-700" : "bg-red-50 text-red-700"
              )}
            >
              {isPositive ? "+" : ""}{changePercent.toFixed(2)}%
            </Badge>
            <span className="text-sm text-gray-500">
              1D High: {high}
            </span>
          </div>

          {/* Company Links */}
          <div className="flex items-center gap-4 text-sm text-blue-600">
            {website && (
              <a
                href={website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:underline"
              >
                <Globe className="h-3 w-3" />
                hul.co.in
              </a>
            )}
            {bseCode && (
              <span className="flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                BSE: {bseCode}
              </span>
            )}
            {nseCode && (
              <span className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                NSE: HINDUNILVR
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportToExcel}
            className="flex items-center gap-2 text-gray-600 border-gray-300"
          >
            <FileSpreadsheet className="h-4 w-4" />
            EXPORT TO EXCEL
          </Button>
          <Button
            size="sm"
            onClick={handleFollow}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            FOLLOW
          </Button>
        </div>
      </div>

      {/* Financial Metrics Grid */}
      <div className="grid grid-cols-3 gap-x-8 gap-y-4 mb-6">
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Market Cap</span>
          <span className="font-medium">{formatMarketCap(marketCap)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Current Price</span>
          <span className="font-medium">{currentPrice}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">High / Low</span>
          <span className="font-medium">{high} / {low}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Stock P/E</span>
          <span className="font-medium">{pe ? pe.toFixed(1) : '58.1'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Book Value</span>
          <span className="font-medium">{bookValue ? bookValue : '₹ 210'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Dividend Yield</span>
          <span className="font-medium">{dividendYield ? dividendYield.toFixed(1) : '1.63'} %</span>
        </div>

        <div className="flex justify-between">
          <span className="text-sm text-gray-600">ROCE</span>
          <span className="font-medium">{roce ? roce.toFixed(1) : '27.8'} %</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">ROE</span>
          <span className="font-medium">{roe ? roe.toFixed(1) : '20.7'} %</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Face Value</span>
          <span className="font-medium">₹ {faceValue.toFixed(0)}</span>
        </div>
      </div>

      {/* Add Ratio Section */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1">
          <Input
            placeholder="eg. Promoter holding"
            value={newRatio}
            onChange={(e) => setNewRatio(e.target.value)}
            className="text-sm border-gray-300"
          />
        </div>
        <Button
          variant="link"
          size="sm"
          onClick={handleAddRatio}
          className="text-blue-600 hover:text-blue-800 p-0 whitespace-nowrap"
        >
          Add ratio to table
        </Button>
      </div>

      {/* Edit Ratios Button */}
      <div className="flex justify-end mb-6">
        <Button
          variant="link"
          size="sm"
          onClick={handleEditRatios}
          className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          <Edit3 className="h-4 w-4" />
          EDIT RATIOS
        </Button>
      </div>

      {/* About and Key Points Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">ABOUT</h3>
            <p className="text-gray-700 leading-relaxed text-sm">
              Hindustan Unilever is in the FMCG business comprising primarily of Home Care, Beauty &
              Personal Care and Foods & Refreshment segments.
            </p>
          </div>
        </div>

        <div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">KEY POINTS</h3>
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Business Segments & Brand Portfolio</h4>
                <p className="text-sm text-gray-600">
                  The company has a portfolio of over 50 brands.
                </p>
              </div>
              <Button
                variant="link"
                size="sm"
                className="text-blue-600 hover:text-blue-800 p-0 h-auto flex items-center gap-1"
              >
                READ MORE
                <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyInfoSection;