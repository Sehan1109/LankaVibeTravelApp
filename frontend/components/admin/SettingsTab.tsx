import React, { useEffect, useState } from 'react';
import { Save, Car, Truck, RefreshCw, Droplets, CheckCircle } from 'lucide-react';

interface VehiclePrice {
  type: string;
  price: number;
}

const defaultVehicles: VehiclePrice[] = [
  { type: 'Bike', price: 10 },
  { type: 'TukTuk', price: 15 },
  { type: 'Car', price: 35 },
  { type: 'Van', price: 65 },
  { type: 'SUV', price: 90 },
  { type: 'MiniBus', price: 85 },
  { type: 'LargeBus', price: 150 }
];

const SettingsTab: React.FC = () => {
  const [prices, setPrices] = useState<VehiclePrice[]>([]);
  // Petrol සහ Diesel සඳහා වෙන වෙනම states
  const [petrolPrice, setPetrolPrice] = useState(1.10);
  const [dieselPrice, setDieselPrice] = useState(1.00);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // 1. වාහන මිල ගණන් ලබාගැනීම
      const vehRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/vehicles`);
      if (vehRes.ok) {
        const data = await vehRes.json();
        const merged = defaultVehicles.map(def => {
            const found = data.find((d: any) => d.type === def.type);
            return found ? found : def;
        });
        setPrices(merged);
      }

      // 2. ඉන්ධන මිල ගණන් ලබාගැනීම
      const fuelRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/vehicles/fuel`);
      if (fuelRes.ok) {
          const fuelData = await fuelRes.json();
          setPetrolPrice(fuelData.petrol_price_usd);
          setDieselPrice(fuelData.diesel_price_usd);
      }
    } catch (error) {
      console.error("Failed to fetch settings", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = (type: string, newVal: string) => {
    const val = parseFloat(newVal) || 0;
    setPrices(prev => prev.map(p => p.type === type ? { ...p, price: val } : p));
  };

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => {
        setToast(null);
    }, 3000); // තත්පර 3කින් ඉබේම අතුරුදහන් වේ
  };

  const savePrice = async (vehicle: VehiclePrice) => {
    setSaving(vehicle.type);
    try {
      await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/vehicles/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vehicle)
      });
      showToast(`${vehicle.type} Price Saved Successfully!`);
    } catch (error) {
      console.error("Error saving", error);
    } finally {
      setSaving(null);
    }
  };

  const saveFuelPrice = async (fuelType: 'petrol' | 'diesel') => {
    const key = fuelType === 'petrol' ? 'petrol_price_usd' : 'diesel_price_usd';
    const value = fuelType === 'petrol' ? petrolPrice : dieselPrice;

    await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/vehicles/fuel/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value })
    });
    const formattedType = fuelType.charAt(0).toUpperCase() + fuelType.slice(1);
    showToast(`${formattedType} Price Updated Successfully!`);
  };

  if (loading) return <div className="p-10 text-center text-emerald-600">Loading settings...</div>;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-4 sm:p-6 md:p-8">
      {toast && (
        <div className="fixed top-20 right-6 z-50 animate-fade-in-up">
            <div className="flex items-center gap-3 px-6 py-4 bg-white text-emerald-600 rounded-xl shadow-2xl font-medium border border-amber-500">
                <CheckCircle className="w-5 h-5 text-emerald-100" />
                {toast}
            </div>
        </div>
      )}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
        <div className="p-3 bg-emerald-100 rounded-xl text-emerald-600 shrink-0">
            <Car className="w-6 h-6" />
        </div>
        <div>
            <h3 className="text-xl font-bold text-emerald-950">Vehicle Daily Rates (USD)</h3>
            <p className="text-sm text-emerald-600/70">Set the fixed daily rental price in USD for each vehicle type.</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-emerald-100 bg-white">
        <table className="w-full text-left text-sm block md:table">
          <thead className="hidden md:table-header-group bg-emerald-50/50 text-emerald-900 font-semibold border-b border-emerald-100">
            <tr>
              <th className="p-4">Vehicle Type</th>
              <th className="p-4">Price Per Day (USD)</th>
              <th className="p-4 text-right">Action</th>
            </tr>
          </thead>
          
          <tbody className="block md:table-row-group divide-y divide-emerald-50">
            {prices.map((vehicle) => (
              <tr key={vehicle.type} className="block md:table-row p-4 md:p-0 hover:bg-emerald-50/30 transition-colors border-b border-emerald-50 last:border-0">
                <td className="block md:table-cell md:p-4 font-medium text-emerald-800 mb-2 md:mb-0">
                    <span className="md:hidden text-xs text-emerald-400 font-bold uppercase tracking-wider block mb-1">Vehicle Type</span>
                    <span className="text-lg md:text-sm">{vehicle.type}</span>
                </td>
                <td className="block md:table-cell md:p-4 mb-4 md:mb-0">
                  <span className="md:hidden text-xs text-emerald-400 font-bold uppercase tracking-wider block mb-2">Price Per Day (USD)</span>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-700 font-bold">$</span>
                    <input 
                      type="number" 
                      step="1" 
                      value={vehicle.price}
                      onChange={(e) => handleUpdate(vehicle.type, e.target.value)}
                      onFocus={(e) => e.target.select()}
                      className="w-full md:w-24 px-3 py-2 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-emerald-900 font-bold bg-white"
                    />
                  </div>
                </td>
                <td className="block md:table-cell md:p-4 text-right">
                  <button 
                    onClick={() => savePrice(vehicle)}
                    disabled={saving === vehicle.type}
                    className="w-full md:w-auto inline-flex justify-center items-center gap-2 px-4 py-3 md:py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all text-sm md:text-xs font-bold disabled:opacity-50 shadow-sm"
                  >
                    {saving === vehicle.type ? <RefreshCw className="w-3 h-3 animate-spin"/> : <Save className="w-4 h-4 md:w-3 md:h-3"/>}
                    {saving === vehicle.type ? 'Saving...' : 'Save Price'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Fuel Settings Section */}
      <div className="mt-8 p-6 bg-emerald-50 rounded-2xl border border-emerald-100">
        <h4 className="text-lg font-bold text-emerald-900 mb-2 flex items-center gap-2">
            <Droplets className="w-5 h-5"/> Global Transport Fuel Settings
        </h4>
        <p className="text-sm text-emerald-700 mb-4">Set current fuel prices per liter in USD to calculate transport costs accurately.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Petrol */}
            <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-emerald-800">Petrol Price (Bike, TukTuk, Car)</label>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-emerald-900">$</span>
                        <input 
                            value={petrolPrice}
                            onChange={(e) => setPetrolPrice(parseFloat(e.target.value))}
                            onFocus={(e) => e.target.select()}
                            className="w-32 px-3 py-2 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>
                    <button onClick={() => saveFuelPrice('petrol')} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-sm shadow-sm transition-all">
                        Save Petrol
                    </button>
                </div>
            </div>

            {/* Diesel */}
            <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-emerald-800">Diesel Price (Van, SUV, Minibus, Large Bus)</label>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-emerald-900">$</span>
                        <input 
                            type="number" 
                            value={dieselPrice}
                            onChange={(e) => setDieselPrice(parseFloat(e.target.value))}
                            onFocus={(e) => e.target.select()}
                            className="w-32 px-3 py-2 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>
                    <button onClick={() => saveFuelPrice('diesel')} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-sm shadow-sm transition-all">
                        Save Diesel
                    </button>
                </div>
            </div>
        </div>
      </div>
      
      <div className="mt-6 p-4 bg-blue-50 text-blue-700 text-sm rounded-xl flex flex-col sm:flex-row gap-3 items-start">
        <Truck className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <p>
            <strong>Note:</strong> Enter the direct daily price in USD. This price will be used directly for customer plans.
        </p>
      </div>
    </div>
  );
};

export default SettingsTab;