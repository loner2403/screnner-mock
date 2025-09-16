import StockChart from "@/components/StockChart/StockChart";

export default function ChartPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-full mx-auto py-6 px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">JINDAL WORLDWIDE Stock Chart</h1>
          <p className="text-gray-600">Real-time stock data with technical indicators</p>
        </div>
        
        <div className="w-full">
          <StockChart symbol="JINDWORLD" className="w-full shadow-lg" />
        </div>
      </div>
    </div>
  );
}