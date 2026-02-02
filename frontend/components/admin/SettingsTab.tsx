import React, { useEffect, useState } from 'react';
import { Save, Car, Truck, RefreshCw } from 'lucide-react';

interface VehiclePrice {
  type: string;
  multiplier: number;
}

const SettingsTab: React.FC = () => {
  const [prices, setPrices] = useState<VehiclePrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  // Default list ensures UI shows all types even if API is empty initially
  const vehicleTypes = ['Bike', 'TukTuk', 'Car', 'Van', 'SUV', 'MiniBus', 'LargeBus'];

  useEffect(() => {
    fetchPrices();
  }, []);

  const fetchPrices = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/vehicles`);
      if (res.ok) {
        const data = await res.json();
        // Merge API data with default types to ensure all rows exist
        const merged = vehicleTypes.map(type => {
            const found = data.find((d: any) => d.type === type);
            return found ? found : { type, multiplier: 1.0 };
        });
        setPrices(merged);
      }
    } catch (error) {
      console.error("Failed to fetch settings", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (type: string, newVal: string) => {
    // Update local state for input fluidity
    const val = parseFloat(newVal);
    setPrices(prev => prev.map(p => p.type === type ? { ...p, multiplier: val } : p));
  };

  const savePrice = async (vehicle: VehiclePrice) => {
    setSaving(vehicle.type);
    try {
      await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/vehicles/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vehicle)
      });
      // Optional: Add toast success here
    } catch (error) {
      console.error("Error saving", error);
    } finally {
      setSaving(null);
    }
  };

  if (loading) return <div className="p-10 text-center text-emerald-600">Loading settings...</div>;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-4 sm:p-6 md:p-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
        <div className="p-3 bg-emerald-100 rounded-xl text-emerald-600 shrink-0">
            <Car className="w-6 h-6" />
        </div>
        <div>
            <h3 className="text-xl font-bold text-emerald-950">Transport Pricing Configuration</h3>
            <p className="text-sm text-emerald-600/70">Manage cost multipliers for different vehicle types.</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-emerald-100 bg-white">
        <table className="w-full text-left text-sm block md:table">
          {/* Header - Hidden on Mobile */}
          <thead className="hidden md:table-header-group bg-emerald-50/50 text-emerald-900 font-semibold border-b border-emerald-100">
            <tr>
              <th className="p-4">Vehicle Type</th>
              <th className="p-4">Price Multiplier (Base x Value)</th>
              <th className="p-4 text-right">Action</th>
            </tr>
          </thead>
          
          <tbody className="block md:table-row-group divide-y divide-emerald-50">
            {prices.map((vehicle) => (
              <tr key={vehicle.type} className="block md:table-row p-4 md:p-0 hover:bg-emerald-50/30 transition-colors border-b border-emerald-50 last:border-0">
                
                {/* Vehicle Type Name */}
                <td className="block md:table-cell md:p-4 font-medium text-emerald-800 mb-2 md:mb-0">
                    <span className="md:hidden text-xs text-emerald-400 font-bold uppercase tracking-wider block mb-1">Vehicle Type</span>
                    <span className="text-lg md:text-sm">{vehicle.type}</span>
                </td>

                {/* Input Area */}
                <td className="block md:table-cell md:p-4 mb-4 md:mb-0">
                  <span className="md:hidden text-xs text-emerald-400 font-bold uppercase tracking-wider block mb-2">Multiplier Settings</span>
                  <div className="flex items-center gap-3 bg-emerald-50/50 md:bg-transparent p-3 md:p-0 rounded-lg">
                    <input 
                      type="number" 
                      step="0.1" 
                      value={vehicle.multiplier}
                      onChange={(e) => handleUpdate(vehicle.type, e.target.value)}
                      className="w-full md:w-24 px-3 py-2 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-emerald-900 font-bold bg-white"
                    />
                    <span className="text-xs text-emerald-600 whitespace-nowrap">
                        Est: <span className="font-bold">${(50 * vehicle.multiplier).toFixed(0)}</span>
                    </span>
                  </div>
                </td>

                {/* Action Button */}
                <td className="block md:table-cell md:p-4 text-right">
                  <button 
                    onClick={() => savePrice(vehicle)}
                    disabled={saving === vehicle.type}
                    className="w-full md:w-auto inline-flex justify-center items-center gap-2 px-4 py-3 md:py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all text-sm md:text-xs font-bold disabled:opacity-50 shadow-sm"
                  >
                    {saving === vehicle.type ? <RefreshCw className="w-3 h-3 animate-spin"/> : <Save className="w-4 h-4 md:w-3 md:h-3"/>}
                    {saving === vehicle.type ? 'Saving...' : 'Update Price'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="mt-6 p-4 bg-blue-50 text-blue-700 text-sm rounded-xl flex flex-col sm:flex-row gap-3 items-start">
        <Truck className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <p>
            <strong>Note:</strong> The base calculation uses a standard rate of <strong>$50</strong> for inter-city travel. 
            Changing the multiplier above will immediately affect new trip generations and price refreshes.
        </p>
      </div>
    </div>
  );
};

export default SettingsTab;