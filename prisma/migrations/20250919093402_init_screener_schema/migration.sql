-- CreateTable
CREATE TABLE "public"."companies" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sector" TEXT,
    "industry" TEXT,
    "marketCap" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."financial_metrics" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "quarter" INTEGER,
    "peRatio" DOUBLE PRECISION,
    "pbRatio" DOUBLE PRECISION,
    "priceToSales" DOUBLE PRECISION,
    "evEbitda" DOUBLE PRECISION,
    "roe" DOUBLE PRECISION,
    "roa" DOUBLE PRECISION,
    "roce" DOUBLE PRECISION,
    "grossMargin" DOUBLE PRECISION,
    "operatingMargin" DOUBLE PRECISION,
    "netMargin" DOUBLE PRECISION,
    "currentRatio" DOUBLE PRECISION,
    "quickRatio" DOUBLE PRECISION,
    "debtToEquity" DOUBLE PRECISION,
    "interestCoverage" DOUBLE PRECISION,
    "revenueGrowth" DOUBLE PRECISION,
    "earningsGrowth" DOUBLE PRECISION,
    "bookValueGrowth" DOUBLE PRECISION,
    "revenue" DOUBLE PRECISION,
    "netIncome" DOUBLE PRECISION,
    "totalAssets" DOUBLE PRECISION,
    "totalEquity" DOUBLE PRECISION,
    "totalDebt" DOUBLE PRECISION,
    "freeCashFlow" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "financial_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "companies_symbol_key" ON "public"."companies"("symbol");

-- CreateIndex
CREATE UNIQUE INDEX "financial_metrics_companyId_year_quarter_key" ON "public"."financial_metrics"("companyId", "year", "quarter");

-- AddForeignKey
ALTER TABLE "public"."financial_metrics" ADD CONSTRAINT "financial_metrics_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
