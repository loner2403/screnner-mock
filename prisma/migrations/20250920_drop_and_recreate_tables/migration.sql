-- Drop existing tables in correct order (due to foreign key constraints)
DROP TABLE IF EXISTS "financial_metrics" CASCADE;
DROP TABLE IF EXISTS "balance_sheets" CASCADE;
DROP TABLE IF EXISTS "companies" CASCADE;

-- CreateTable: companies
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "ticker" TEXT,
    "name" TEXT NOT NULL,
    "sector" TEXT,
    "industry" TEXT,
    "marketCap" DOUBLE PRECISION,
    "exchange" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable: balance_sheets
CREATE TABLE "balance_sheets" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "quarter" INTEGER,
    "fiscalYear" TEXT,
    "period" TEXT,
    "periodLabel" TEXT,
    "cashAndCashEquivalents" DOUBLE PRECISION,
    "cashNearCashItem" DOUBLE PRECISION,
    "marketableSecurities" DOUBLE PRECISION,
    "accountsReceivable" DOUBLE PRECISION,
    "otherCurrentReceivable" DOUBLE PRECISION,
    "inventory" DOUBLE PRECISION,
    "inventoryRawMaterials" DOUBLE PRECISION,
    "inventoryInProgress" DOUBLE PRECISION,
    "inventoryFinishedGoods" DOUBLE PRECISION,
    "otherInventory" DOUBLE PRECISION,
    "otherCurrentAssets" DOUBLE PRECISION,
    "currentAssets" DOUBLE PRECISION,
    "netFixedAssets" DOUBLE PRECISION,
    "grossFixedAssets" DOUBLE PRECISION,
    "accumulatedDepreciation" DOUBLE PRECISION,
    "otherNonCurrentAssets" DOUBLE PRECISION,
    "disclosedIntangibles" DOUBLE PRECISION,
    "goodwill" DOUBLE PRECISION,
    "otherIntangibleAssets" DOUBLE PRECISION,
    "otherNonCurrentAssetsDetailed" DOUBLE PRECISION,
    "totalNonCurrentAssets" DOUBLE PRECISION,
    "totalAssets" DOUBLE PRECISION,
    "accountsPayable" DOUBLE PRECISION,
    "taxesPayable" DOUBLE PRECISION,
    "accruals" DOUBLE PRECISION,
    "shortTermBorrowings" DOUBLE PRECISION,
    "shortTermDebtDetailed" DOUBLE PRECISION,
    "otherCurrentLiabilities" DOUBLE PRECISION,
    "deferredTaxLiabilitiesST" DOUBLE PRECISION,
    "otherCurrentLiabsDetailed" DOUBLE PRECISION,
    "currentLiabilities" DOUBLE PRECISION,
    "longTermBorrowings" DOUBLE PRECISION,
    "longTermBorrowingsDetailed" DOUBLE PRECISION,
    "otherNonCurrentLiabilities" DOUBLE PRECISION,
    "otherNonCurrentLiabsDetailed" DOUBLE PRECISION,
    "nonCurrentLiabilities" DOUBLE PRECISION,
    "totalLiabilities" DOUBLE PRECISION,
    "shareCapitalAndAPIC" DOUBLE PRECISION,
    "commonStock" DOUBLE PRECISION,
    "additionalPaidInCapital" DOUBLE PRECISION,
    "retainedEarnings" DOUBLE PRECISION,
    "equityBeforeMinority" DOUBLE PRECISION,
    "minorityInterest" DOUBLE PRECISION,
    "totalEquity" DOUBLE PRECISION,
    "totalLiabilitiesAndEquity" DOUBLE PRECISION,
    "sharesOutstanding" DOUBLE PRECISION,
    "netDebt" DOUBLE PRECISION,
    "netDebtToEquityPercent" DOUBLE PRECISION,
    "tceRatio" DOUBLE PRECISION,
    "currentRatio" DOUBLE PRECISION,
    "cashConversionCycle" DOUBLE PRECISION,
    "workingCapital" DOUBLE PRECISION,
    "debtToAssets" DOUBLE PRECISION,
    "equityRatio" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "balance_sheets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: Companies
CREATE UNIQUE INDEX "companies_symbol_key" ON "companies"("symbol");
CREATE UNIQUE INDEX "companies_ticker_key" ON "companies"("ticker");
CREATE INDEX "companies_symbol_idx" ON "companies"("symbol");
CREATE INDEX "companies_ticker_idx" ON "companies"("ticker");
CREATE INDEX "companies_marketCap_idx" ON "companies"("marketCap");
CREATE INDEX "companies_sector_idx" ON "companies"("sector");

-- CreateIndex: Balance Sheets (Critical for Screener Performance)
CREATE UNIQUE INDEX "balance_sheets_companyId_year_quarter_key" ON "balance_sheets"("companyId", "year", "quarter");
CREATE INDEX "balance_sheets_companyId_idx" ON "balance_sheets"("companyId");
CREATE INDEX "balance_sheets_year_idx" ON "balance_sheets"("year");
CREATE INDEX "balance_sheets_year_quarter_idx" ON "balance_sheets"("year", "quarter");
CREATE INDEX "balance_sheets_currentRatio_idx" ON "balance_sheets"("currentRatio");
CREATE INDEX "balance_sheets_netDebtToEquityPercent_idx" ON "balance_sheets"("netDebtToEquityPercent");
CREATE INDEX "balance_sheets_totalAssets_idx" ON "balance_sheets"("totalAssets");
CREATE INDEX "balance_sheets_totalEquity_idx" ON "balance_sheets"("totalEquity");
CREATE INDEX "balance_sheets_currentLiabilities_idx" ON "balance_sheets"("currentLiabilities");
CREATE INDEX "balance_sheets_workingCapital_idx" ON "balance_sheets"("workingCapital");
CREATE INDEX "balance_sheets_debtToAssets_idx" ON "balance_sheets"("debtToAssets");
CREATE INDEX "balance_sheets_tceRatio_idx" ON "balance_sheets"("tceRatio");

-- AddForeignKey
ALTER TABLE "balance_sheets" ADD CONSTRAINT "balance_sheets_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;