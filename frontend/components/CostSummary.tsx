import React, { useMemo } from 'react';
import { Calculator, RefreshCw, Loader2 } from 'lucide-react';
import { Itinerary } from '../types';

interface CostSummaryProps {
  itinerary: Itinerary;
  travelerCount: number;
  onRefreshPrices?: () => void;
  isRefreshing?: boolean;
}

const CostSummary: React.FC<CostSummaryProps> = ({ 
  itinerary, 
  travelerCount,
  onRefreshPrices,
  isRefreshing = false
}) => {
  
  // Calculate Totals automatically
  const totals = useMemo(() => {
    const initial = {
      accommodation: 0,
      tickets: 0,
      food: 0,
      transportFuel: 0,
      vehicleRental: 0,
      guide: 0,
      miscellaneous: 0,
      grandTotal: 0
    };

    if (!itinerary || !itinerary.days) return initial;

    return itinerary.days.reduce((acc, day) => {
      const c = day.estimatedCost || {}; 
      
      return {
        accommodation: acc.accommodation + (Number(c.accommodation) || 0),
        tickets: acc.tickets + (Number(c.tickets) || 0),
        food: acc.food + (Number(c.food) || 0),
        transportFuel: acc.transportFuel + (Number(c.transportFuel) || 0),
        vehicleRental: acc.vehicleRental + (Number(c.vehicleRental) || 0),
        guide: acc.guide + (Number(c.guide) || 0),
        miscellaneous: acc.miscellaneous + (Number(c.miscellaneous) || 0),
        grandTotal: acc.grandTotal + (Number(c.total) || 0) 
      };
    }, initial);
  }, [itinerary]);

  // Recalculate Grand Total locally to be safe
  const calculatedGrandTotal = 
    totals.accommodation + 
    totals.tickets + 
    totals.food + 
    totals.transportFuel + 
    totals.vehicleRental + 
    totals.guide + 
    totals.miscellaneous;

  const fmt = (val: number) => `$${val.toLocaleString()}`;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden w-full">
      {/* Header: Flex-col on mobile for space, Row on sm+ */}
      <div className="p-4 border-b border-gray-100 bg-emerald-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
        <div className="flex items-center gap-2 text-emerald-800 font-bold">
            <Calculator className="w-5 h-5" />
            <h3>Estimated Costs</h3>
        </div>
        
        {/* NEW: Live Price Button */}
        {onRefreshPrices && (
            <button 
                onClick={onRefreshPrices}
                disabled={isRefreshing}
                className="w-full sm:w-auto text-xs bg-white border border-emerald-200 text-emerald-700 px-3 py-2 sm:py-1.5 rounded-lg font-bold hover:bg-emerald-50 transition flex items-center justify-center sm:justify-start gap-1.5 disabled:opacity-50"
            >
                {isRefreshing ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                    <RefreshCw className="w-3 h-3" />
                )}
                {isRefreshing ? 'Checking...' : 'Check Live Prices'}
            </button>
        )}
      </div>

      {/* Table Wrapper: overflow-x-auto ensures it doesn't break layout on very small screens */}
      <div className="p-0 overflow-x-auto">
        <table className="w-full text-sm min-w-[300px]">
          <tbody className="divide-y divide-gray-50">
            {/* ACCOMMODATION */}
            <tr>
              {/* Responsive Padding: px-4 on mobile, px-6 on larger screens */}
              <td className="px-4 sm:px-6 py-3 sm:py-4">
                <span className="font-bold text-gray-700 block text-xs sm:text-sm">Accommodation</span>
                <span className="text-[10px] sm:text-xs text-gray-400 font-normal block sm:inline">
                  {itinerary.days.length} Nights • {travelerCount} Travelers
                </span>
              </td>
              <td className="px-4 sm:px-6 py-3 sm:py-4 text-right font-bold text-gray-700 text-xs sm:text-sm">
                {fmt(totals.accommodation)}
              </td>
              <td className="px-6 py-4 text-right text-gray-500 hidden sm:table-cell">
                {Math.round((totals.accommodation / calculatedGrandTotal) * 100) || 0}%
              </td>
            </tr>

            {/* TICKETS */}
            <tr>
              <td className="px-4 sm:px-6 py-3 sm:py-4">
                <span className="font-bold text-gray-700 block text-xs sm:text-sm">Entrance Tickets</span>
                <span className="text-[10px] sm:text-xs text-gray-400 font-normal">Sites & Activities</span>
              </td>
              <td className="px-4 sm:px-6 py-3 sm:py-4 text-right font-bold text-gray-700 text-xs sm:text-sm">
                {fmt(totals.tickets)}
              </td>
              <td className="px-6 py-4 text-right text-gray-500 hidden sm:table-cell">
                {Math.round((totals.tickets / calculatedGrandTotal) * 100) || 0}%
              </td>
            </tr>

            {/* VEHICLE */}
            <tr>
              <td className="px-4 sm:px-6 py-3 sm:py-4">
                <span className="font-bold text-gray-700 block text-xs sm:text-sm">Vehicle</span>
                <span className="text-[10px] sm:text-xs text-gray-400 font-normal">Rental</span>
              </td>
              <td className="px-4 sm:px-6 py-3 sm:py-4 text-right font-bold text-gray-700 text-xs sm:text-sm">
                {fmt(totals.vehicleRental)}
              </td>
              <td className="px-6 py-4 text-right text-gray-500 hidden sm:table-cell">
                 {Math.round((totals.vehicleRental / calculatedGrandTotal) * 100) || 0}%
              </td>
            </tr>

            {/* FUEL */}
            <tr>
              <td className="px-4 sm:px-6 py-3 sm:py-4">
                <span className="font-bold text-gray-700 block text-xs sm:text-sm">Fuel</span>
                <span className="text-[10px] sm:text-xs text-gray-400 font-normal">Estimated</span>
              </td>
              <td className="px-4 sm:px-6 py-3 sm:py-4 text-right font-bold text-gray-700 text-xs sm:text-sm">
                {fmt(totals.transportFuel)}
              </td>
              <td className="px-6 py-4 text-right text-gray-500 hidden sm:table-cell">
                 {Math.round((totals.transportFuel / calculatedGrandTotal) * 100) || 0}%
              </td>
            </tr>

            {/* GUIDE */}
            <tr>
              <td className="px-4 sm:px-6 py-3 sm:py-4">
                <span className="font-bold text-gray-700 block text-xs sm:text-sm">Guide</span>
                <span className="text-[10px] sm:text-xs text-gray-400 font-normal">Services</span>
              </td>
              <td className="px-4 sm:px-6 py-3 sm:py-4 text-right font-bold text-gray-700 text-xs sm:text-sm">
                {fmt(totals.guide)}
              </td>
              <td className="px-6 py-4 text-right text-gray-500 hidden sm:table-cell">
                 {Math.round((totals.guide / calculatedGrandTotal) * 100) || 0}%
              </td>
            </tr>

            {/* FOOD */}
            <tr>
              <td className="px-4 sm:px-6 py-3 sm:py-4">
                <span className="font-bold text-gray-700 block text-xs sm:text-sm">Food</span>
                <span className="text-[10px] sm:text-xs text-gray-400 font-normal">Meals & Dining</span>
              </td>
              <td className="px-4 sm:px-6 py-3 sm:py-4 text-right font-bold text-gray-700 text-xs sm:text-sm">
                {fmt(totals.food)}
              </td>
              <td className="px-6 py-4 text-right text-gray-500 hidden sm:table-cell">
                 {Math.round((totals.food / calculatedGrandTotal) * 100) || 0}%
              </td>
            </tr>

            {/* MISCELLANEOUS */}
            <tr>
              <td className="px-4 sm:px-6 py-3 sm:py-4">
                <span className="font-bold text-gray-700 block text-xs sm:text-sm">Miscellaneous</span>
                <span className="text-[10px] sm:text-xs text-gray-400 font-normal">Other</span>
              </td>
              <td className="px-4 sm:px-6 py-3 sm:py-4 text-right font-bold text-gray-700 text-xs sm:text-sm">
                {fmt(totals.miscellaneous)}
              </td>
              <td className="px-6 py-4 text-right text-gray-500 hidden sm:table-cell">
                 {Math.round((totals.miscellaneous / calculatedGrandTotal) * 100) || 0}%
              </td>
            </tr>

            {/* TOTAL ROW */}
            <tr className="bg-emerald-50 border-t-2 border-emerald-100">
              {/* Adjusted font sizes for mobile to ensure it fits on one line */}
              <td className="px-4 sm:px-6 py-4 text-base sm:text-lg font-bold text-emerald-900">
                TOTAL COST
              </td>
              <td className="px-4 sm:px-6 py-4 text-right text-base sm:text-lg font-bold text-emerald-700">
                {fmt(calculatedGrandTotal)}
              </td>
              <td className="px-6 py-4 text-right text-emerald-600 hidden sm:table-cell">
                100%
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CostSummary;