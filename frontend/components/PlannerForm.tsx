import React, { useState, useEffect } from 'react';
import {
  Calendar, MapPin, Wallet, Heart, Users, Star, Car,
  UserCheck, Loader2, RefreshCw, Sparkles, MessageSquare,
  Clock, Activity,
  DollarSign, X, Plus
} from 'lucide-react';
import { Autocomplete } from '@react-google-maps/api';
import { PlannerInput, Interest } from '../types';

export interface PlacesHandlers {
  onStartLoad: (autocomplete: google.maps.places.Autocomplete) => void;
  onStartChanged: () => void;
  onEndLoad: (autocomplete: google.maps.places.Autocomplete) => void;
  onEndChanged: () => void;
  onNextLoad: (autocomplete: google.maps.places.Autocomplete) => void;
  onNextChanged: () => void;
}

interface PlannerFormProps {
  input: PlannerInput;
  setInput: React.Dispatch<React.SetStateAction<PlannerInput>>;
  isLoaded: boolean;
  placesHandlers: PlacesHandlers;
  loading: boolean;
  handleGenerate: () => void;
  handleUpdateCosts: () => void;
  itineraryExists: boolean;
  error: string | null;
}

// Defined capacities to be used in validation
const VEHICLE_CAPACITIES: Record<string, number> = {
  'Bike': 2,
  'TukTuk': 3,
  'Car': 4, 
  'Car (Sedan)': 4,
  'SUV': 4,
  'Passenger Van': 12,
  'Mini Bus': 25,
  'Large Bus': 50,
  'Large Bus (Coach)': 50
};

const INTERESTS: Interest[] = ['Nature', 'Culture', 'Adventure', 'Nightlife', 'Beaches', 'Wildlife'];

const PlannerForm: React.FC<PlannerFormProps> = ({
  input,
  setInput,
  isLoaded,
  placesHandlers,
  loading,
  handleGenerate,
  handleUpdateCosts,
  itineraryExists,
  error
}) => {
  // Local state for validation errors (e.g. date logic)
  const [validationError, setValidationError] = useState<string | null>(null);

  const toggleInterest = (interest: Interest) => {
    setInput(prev => {
      if (prev.interests.includes(interest)) {
        return { ...prev, interests: prev.interests.filter(i => i !== interest) };
      }
      return { ...prev, interests: [...prev.interests, interest] };
    });
  };

  // ---------------------------------------------------------
  // 3. AUTO-SELECT VEHICLE BASED ON PASSENGERS
  // ---------------------------------------------------------
  useEffect(() => {
    const totalPassengers = input.adults + input.children;
    
    let recommendedVehicle = input.vehicleType; 

    // Logic to pick the smallest vehicle that fits the group
    if (totalPassengers <= 2) {
       // Prefer TukTuk generally, but allow bike if explicitly wanted later. 
       // For auto-select, we usually default to TukTuk for comfort.
       recommendedVehicle = 'TukTuk'; 
    } else if (totalPassengers <= 3) {
       recommendedVehicle = 'TukTuk';
    } else if (totalPassengers <= 4) {
       recommendedVehicle = 'Car (Sedan)';
    } else if (totalPassengers <= 10) {
       recommendedVehicle = 'Passenger Van';
    } else if (totalPassengers <= 25) {
       recommendedVehicle = 'Mini Bus';
    } else {
       recommendedVehicle = 'Large Bus (Coach)';
    }

    // Only update state if the recommended vehicle is different to avoid unnecessary renders
    // logic: strictly map ONLY when numbers change.
    setInput(prev => ({ ...prev, vehicleType: recommendedVehicle }));
    
  }, [input.adults, input.children]); // Run only when pax count changes


  // ---------------------------------------------------------
  // 4. UPDATED VALIDATION LOGIC
  // ---------------------------------------------------------
  const validateAndGenerate = () => {
    setValidationError(null);

    // 1. Check Dates
    if (!input.arrivalDate || !input.departureDate) {
      setValidationError("Please select both Arrival and Departure dates.");
      return;
    }

    // 2. Check Date Logic
    const arrival = new Date(input.arrivalDate);
    const departure = new Date(input.departureDate);

    if (departure <= arrival) {
      setValidationError("Departure date must be at least one day after the Arrival date.");
      return;
    }

    // 3. CHECK VEHICLE CAPACITY (New Logic using the Object)
    const totalPassengers = input.adults + input.children;
    
    // Find max capacity by matching the selected string to the key in VEHICLE_CAPACITIES
    // We use a flexible lookup or default to 50
    let maxCapacity = 50;
    
    // Check specific matches first
    if (VEHICLE_CAPACITIES[input.vehicleType]) {
        maxCapacity = VEHICLE_CAPACITIES[input.vehicleType];
    } else {
        // Fallback for partial matches (e.g. if string varies slightly)
        if (input.vehicleType.includes('Bike')) maxCapacity = 2;
        else if (input.vehicleType.includes('TukTuk')) maxCapacity = 3;
        else if (input.vehicleType.includes('Car')) maxCapacity = 4;
        else if (input.vehicleType.includes('SUV')) maxCapacity = 4;
        else if (input.vehicleType.includes('Van')) maxCapacity = 12;
        else if (input.vehicleType.includes('Mini Bus')) maxCapacity = 25;
        else if (input.vehicleType.includes('Large Bus')) maxCapacity = 50;
    }

    if (totalPassengers > maxCapacity) {
      setValidationError(`Too many people (${totalPassengers}) for a ${input.vehicleType}. Please choose a larger vehicle.`);
      return;
    }

    // 4. Call Parent
    handleGenerate();
  };

  const removeStop = (index: number) => {
    setInput(prev => ({
      ...prev,
      nextDestinations: prev.nextDestinations.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="lg:col-span-4 space-y-4 sm:space-y-6">
      {/* Adjusted padding and border radius for mobile vs desktop */}
      <div className="bg-white p-5 sm:p-6 md:p-8 rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[2.5rem] shadow-sm border border-emerald-50 space-y-5 sm:space-y-6">

        {/* ============================================================ */}
        {/* SECTION 1: LOGISTICS (DATES & LOCATIONS)                     */}
        {/* ============================================================ */}
        {!itineraryExists && (
          <div className="space-y-5 sm:space-y-6 animate-fade-in-down">
            
            {/* Arrival Row */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4">
              {/* Arrival Date */}
              <div className="sm:col-span-7 space-y-2">
                <label className="flex items-center gap-2 font-bold text-gray-700 text-sm sm:text-base">
                  <Calendar className="w-4 h-4 text-emerald-600" /> Arrival Date
                </label>
                <input
                  type="date"
                  value={input.arrivalDate}
                  onChange={e => {
                    setValidationError(null);
                    setInput({ ...input, arrivalDate: e.target.value });
                  }}
                  className="w-full p-3 bg-gray-50 rounded-xl sm:rounded-2xl border-none focus:ring-2 focus:ring-emerald-500 font-bold text-gray-600 text-sm sm:text-base"
                />
              </div>

              {/* Arrival Time */}
              <div className="sm:col-span-5 space-y-2">
                <label className="flex items-center gap-2 font-bold text-gray-700 text-sm sm:text-base">
                  <Clock className="w-4 h-4 text-emerald-600" /> Time
                </label>
                <input
                  type="time"
                  value={input.arrivalTime}
                  onChange={e => setInput({ ...input, arrivalTime: e.target.value })}
                  className="w-full p-3 bg-gray-50 rounded-xl sm:rounded-2xl border-none focus:ring-2 focus:ring-emerald-500 font-bold text-gray-600 text-sm sm:text-base"
                />
              </div>
            </div>

            {/* Departure Row */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4">
              {/* Departure Date */}
              <div className="sm:col-span-7 space-y-2">
                <label className="flex items-center gap-2 font-bold text-gray-700 text-sm sm:text-base">
                  <Calendar className="w-4 h-4 text-emerald-600" /> Departure Date
                </label>
                <input
                  type="date"
                  value={input.departureDate}
                  min={input.arrivalDate} 
                  onChange={e => {
                    setValidationError(null);
                    setInput({ ...input, departureDate: e.target.value });
                  }}
                  className="w-full p-3 bg-gray-50 rounded-xl sm:rounded-2xl border-none focus:ring-2 focus:ring-emerald-500 font-bold text-gray-600 text-sm sm:text-base"
                />
              </div>

              {/* Departure Time */}
              <div className="sm:col-span-5 space-y-2">
                <label className="flex items-center gap-2 font-bold text-gray-700 text-sm sm:text-base">
                  <Clock className="w-4 h-4 text-emerald-600" /> Time
                </label>
                <input
                  type="time"
                  value={input.departureTime} 
                  onChange={e => setInput({ ...input, departureTime: e.target.value })}
                  className="w-full p-3 bg-gray-50 rounded-xl sm:rounded-2xl border-none focus:ring-2 focus:ring-emerald-500 font-bold text-gray-600 text-sm sm:text-base"
                />
              </div>
            </div>

            {/* Start Point */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 font-bold text-gray-700 text-sm sm:text-base">
                <MapPin className="w-4 h-4 text-emerald-600" /> Start Point
              </label>
              {isLoaded ? (
                <Autocomplete
                  onLoad={placesHandlers.onStartLoad}
                  onPlaceChanged={placesHandlers.onStartChanged}
                  options={{ componentRestrictions: { country: "lk" } }}
                >
                  <input
                    type="text"
                    value={input.startPoint}
                    onChange={(e) => setInput({ ...input, startPoint: e.target.value })}
                    placeholder="e.g. Colombo Airport..."
                    className="w-full p-3 sm:p-4 bg-gray-50 rounded-xl sm:rounded-2xl border-none focus:ring-2 focus:ring-emerald-500 font-medium text-gray-700 text-sm sm:text-base"
                  />
                </Autocomplete>
              ) : (
                <div className="w-full p-3 sm:p-4 bg-gray-50 rounded-xl sm:rounded-2xl text-gray-400 text-sm">Loading Maps...</div>
              )}
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 font-bold text-gray-700 text-sm sm:text-base">
                <MapPin className="w-4 h-4 text-emerald-600" /> End Point
              </label>
              {isLoaded ? (
                <Autocomplete
                  onLoad={placesHandlers.onEndLoad}
                  onPlaceChanged={placesHandlers.onEndChanged}
                  options={{ componentRestrictions: { country: "lk" } }}
                >
                  <input
                    type="text"
                    value={input.endPoint}
                    onChange={(e) => setInput({ ...input, endPoint: e.target.value })}
                    placeholder="e.g. Colombo Airport..."
                    className="w-full p-3 sm:p-4 bg-gray-50 rounded-xl sm:rounded-2xl border-none focus:ring-2 focus:ring-emerald-500 font-medium text-gray-700 text-sm sm:text-base"
                  />
                </Autocomplete>
              ) : (
                <div className="w-full p-3 sm:p-4 bg-gray-50 rounded-xl sm:rounded-2xl text-gray-400 text-sm">Loading Maps...</div>
              )}
            </div>

            {/* Next Destination (Optional) */}
            <div className="space-y-2 pt-4 border-t border-gray-100">
              <label className="flex items-center gap-2 font-bold text-gray-700 text-sm">
                Specific Stops (Optional)
              </label>

              {/* Render Added Stops */}
              <div className="flex flex-wrap gap-2 mb-2">
                {input.nextDestinations.map((stop, index) => (
                  <span 
                    key={index} 
                    className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full"
                  >
                    {stop}
                    <button 
                      onClick={() => removeStop(index)}
                      className="p-0.5 hover:bg-emerald-200 rounded-full transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>

              {/* Input for New Stop */}
              {isLoaded ? (
                <Autocomplete
                  onLoad={placesHandlers.onNextLoad}
                  onPlaceChanged={placesHandlers.onNextChanged}
                  options={{ componentRestrictions: { country: "lk" } }}
                >
                  <div className="relative">
                    <input
                      type="text"
                      value={input.nextDestination} 
                      onChange={(e) => setInput({ ...input, nextDestination: e.target.value })}
                      placeholder="Add a city (e.g. Ella, Sigiriya)..."
                      className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                    <div className="absolute right-3 top-3 text-gray-400 pointer-events-none">
                        <Plus className="w-4 h-4" />
                    </div>
                  </div>
                </Autocomplete>
              ) : null}
              <p className="text-[10px] text-gray-400">Search and select a location to add it to your route.</p>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* SECTION 2: UPDATABLE PREFERENCES (ALWAYS VISIBLE)            */}
        {/* ============================================================ */}
        
        {itineraryExists && (
            <div className="pb-2 border-b border-gray-100 mb-4">
                <h3 className="text-emerald-800 font-bold text-lg flex items-center gap-2">
                    <RefreshCw className="w-5 h-5" /> Refine Your Plan
                </h3>
                <p className="text-xs text-gray-400">Update these settings to recalculate costs or regenerate the plan.</p>
            </div>
        )}

        {/* Budget */}
        <div className="space-y-4">
          <label className="flex items-center justify-between font-bold text-gray-700 text-sm sm:text-base">
            <span className="flex items-center gap-2"><Wallet className="w-4 h-4 text-emerald-600" /> Budget (USD)</span>
            <span className="text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full text-xs font-bold">${input.budget}</span>
          </label>
          <input
            type="range"
            min="500"
            max="10000"
            step="100"
            value={input.budget}
            onChange={e => setInput({ ...input, budget: Number(e.target.value) })}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
          />
        </div>

        {/* Adults & Children & Hotel Grid - Responsive adjustment */}
        <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="space-y-2">
            <label className="flex items-center gap-2 font-bold text-gray-700 text-sm sm:text-base">
              <Users className="w-4 h-4 text-emerald-600" /> Adults
            </label>
            <select
              value={input.adults}
              onChange={e => setInput({ ...input, adults: Number(e.target.value) })}
              className="w-full p-3 bg-gray-50 rounded-xl sm:rounded-2xl border-none font-bold text-gray-600 text-sm sm:text-base"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20, 25, 30, 40, 50].map(n => <option key={n} value={n}>{n} Pax</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2 font-bold text-gray-700 text-sm sm:text-base">
              <span className="text-emerald-600 text-lg">👶</span> Children
            </label>
            <select
              value={input.children}
              onChange={e => setInput({ ...input, children: Number(e.target.value) })}
              className="w-full p-3 bg-gray-50 rounded-xl sm:rounded-2xl border-none font-bold text-gray-600 text-sm sm:text-base"
            >
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                <option key={n} value={n}>{n} Kids</option>
              ))}
            </select>
          </div>
          {/* On mobile (grid-cols-2), this takes full width of the second row if needed, or sits nicely in grid-cols-3 on tablet */}
          <div className="col-span-2 sm:col-span-1 space-y-2">
            <label className="flex items-center gap-2 font-bold text-gray-700 text-sm sm:text-base">
              <Star className="w-4 h-4 text-emerald-600" /> Hotel
            </label>
            <select
              value={input.hotelRating}
              onChange={e => setInput({ ...input, hotelRating: e.target.value })}
              className="w-full p-3 bg-gray-50 rounded-xl sm:rounded-2xl border-none font-bold text-gray-600 text-sm sm:text-base"
            >
              <option value="3">3 Star</option>
              <option value="4">4 Star</option>
              <option value="5">5 Star</option>
              <option value="Luxury">Luxury</option>
            </select>
          </div>
        </div>

        {/* Trip Pace & Preferences Section */}
        <div className="grid grid-cols-1 gap-4 pt-4 border-t border-gray-100">
          <div className="space-y-2">
            <label className="flex items-center gap-2 font-bold text-gray-700 text-sm sm:text-base">
              <Activity className="w-4 h-4 text-emerald-600" /> Trip Pace
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['Relaxed', 'Moderate', 'Packed'].map((p) => (
                <button
                  key={p}
                  onClick={() => setInput({ ...input, pace: p as any })}
                  className={`py-2 px-1 rounded-xl text-[10px] sm:text-xs font-bold border transition-all ${input.pace === p
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-gray-50 text-gray-600 border-transparent hover:bg-emerald-50'
                    }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Vehicle */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 font-bold text-gray-700 text-sm sm:text-base">
            <Car className="w-4 h-4 text-emerald-600" /> Vehicle
          </label>
          <select
            value={input.vehicleType}
            onChange={e => setInput({ ...input, vehicleType: e.target.value })}
            className="w-full p-3 bg-gray-50 rounded-xl sm:rounded-2xl border-none font-bold text-gray-600 text-sm sm:text-base"
          >
            <option value="Bike">Bike (Max 2)</option>
            <option value="TukTuk">TukTuk (Max 3)</option>
            <option value="Car (Sedan)">Car (Max 4)</option>
            <option value="SUV">SUV (Max 4)</option>
            <option value="Passenger Van">Passenger Van (Max 12)</option>
            <option value="Mini Bus">Mini Bus (Max 25)</option>
            <option value="Large Bus (Coach)">Large Bus (Max 50)</option>
          </select>
          <p className="text-[10px] text-gray-400 pl-1">
              Recommended for {input.adults + input.children} passengers
          </p>
        </div>

        {/* Interests */}
        <div className="space-y-4">
          <label className="flex items-center gap-2 font-bold text-gray-700 text-sm sm:text-base">
            <Heart className="w-4 h-4 text-emerald-600" /> Interests
          </label>
          <div className="flex flex-wrap gap-2">
            {INTERESTS.map(i => (
              <button
                key={i}
                onClick={() => toggleInterest(i)}
                className={`px-3 py-2 sm:py-1.5 rounded-full text-xs font-bold border transition-all ${input.interests.includes(i)
                  ? 'bg-cyan-600 text-white border-cyan-600'
                  : 'bg-white text-gray-600 border-gray-100 hover:bg-cyan-50'
                  }`}
              >
                {i}
              </button>
            ))}
          </div>
        </div>

        {/* Additional Ideas / User Notes */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 font-bold text-gray-700 text-sm sm:text-base">
            <MessageSquare className="w-4 h-4 text-emerald-600" /> Any Specific Ideas?
          </label>
          <textarea
            value={input.userNotes}
            onChange={(e) => setInput({ ...input, userNotes: e.target.value })}
            placeholder="E.g., I want to see elephants, I need a wheelchair, etc."
            className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-emerald-500 text-sm text-gray-700 resize-none h-24"
          />
        </div>

        {/* Guide Toggle */}
        <div className="flex items-center justify-between p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
          <label className="flex items-center gap-2 text-sm font-bold text-emerald-800">
            <UserCheck className="w-4 h-4" /> Include Tour Guide?
          </label>
          <input
            type="checkbox"
            checked={input.includeGuide}
            onChange={(e) => setInput({ ...input, includeGuide: e.target.checked })}
            className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500"
          />
        </div>

        {/* ERROR MESSAGES */}
        {/* 1. Validation Error (Local) */}
        {validationError && (
          <div className="animate-fade-in bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg">
            <div className="flex items-center gap-2 text-yellow-800 font-bold text-sm">
              <span className="text-xl">⚠️</span> {validationError}
            </div>
          </div>
        )}

        {/* 2. API Error (Props) */}
        {error && (
          <div className="animate-fade-in bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
            <div className="flex items-center gap-2 text-red-700 font-bold text-sm">
              <span className="text-xl">⚠️</span> {error}
            </div>
          </div>
        )}

        {/* ACTION BUTTONS AREA */}
        <div className="pt-4 border-t border-gray-100">
          {!itineraryExists ? (
            // SCENARIO 1: Generate (Big Button)
            <button
              onClick={validateAndGenerate} // CHANGED: Calls local validation first
              disabled={loading}
              className="group relative w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-lg rounded-2xl shadow-xl shadow-emerald-100 transition-all active:scale-95 disabled:opacity-70 disabled:pointer-events-none overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
              <div className="relative flex items-center justify-center gap-3">
                {loading ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="text-base sm:text-lg">Designing Your Dream Trip...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
                    <span className="text-base sm:text-lg">Generate My Plan</span>
                  </>
                )}
              </div>
            </button>
          ) : (
            // SCENARIO 2: Update Buttons
            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={handleUpdateCosts}
                disabled={loading}
                className="relative py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-70 disabled:pointer-events-none"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <DollarSign className="w-5 h-5" />}
                <span>Update the Plan</span>
              </button>
            </div>
          )}

          {itineraryExists && !loading && (
            <div className="text-center mt-4">
               <button 
                  onClick={() => window.location.reload()} 
                  className="text-xs text-gray-400 hover:text-red-500 font-semibold underline transition-colors"
                >
                  Start a Completely New Plan (Reset All)
                </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlannerForm;