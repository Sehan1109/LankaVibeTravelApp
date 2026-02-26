import React, { useState, useEffect } from 'react';
import {
  MapPin, Wallet, Heart, Users, Car,
  ArrowRight, ArrowLeft, CheckCircle2,
  Sparkles, Loader2, RefreshCw, X, Plus, ChevronUp,
  BedDouble, Baby, UserCheck,
  FileText
} from 'lucide-react';
import { Autocomplete } from '@react-google-maps/api';
import { PlannerInput, Interest } from '../types';

// --- Interfaces ---
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
  onSaveProgress?: (step: number) => void;
}

const INTERESTS: Interest[] = ['Nature', 'Culture', 'Adventure', 'Nightlife', 'Beaches', 'Wildlife'];
const HOTEL_TYPES = ['Budget / Homestay', '3-Star Standard', '4-Star Comfort', '5-Star Luxury', 'Boutique Villa'];

const PlannerForm: React.FC<PlannerFormProps> = ({
  input, setInput, isLoaded, placesHandlers, loading,
  handleGenerate, itineraryExists, error, onSaveProgress
}) => {

  // --- State ---
  const [currentStep, setCurrentStep] = useState(1);
  const [isExpanded, setIsExpanded] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isCustomEndPoint, setIsCustomEndPoint] = useState(false);

  // Auto-collapse form when itinerary exists
  useEffect(() => {
    if (itineraryExists) {
      setIsExpanded(false);
    }
  }, [itineraryExists]);

  // --- Handlers ---
  const toggleInterest = (interest: Interest) => {
    setInput(prev => {
      if (prev.interests.includes(interest)) {
        return { ...prev, interests: prev.interests.filter(i => i !== interest) };
      }
      return { ...prev, interests: [...prev.interests, interest] };
    });
  };

  const removeStop = (index: number) => {
    setInput(prev => ({
      ...prev,
      nextDestinations: prev.nextDestinations.filter((_, i) => i !== index)
    }));
  };

  // --- Validation ---
  const validateStep = (step: number): boolean => {
    setValidationError(null);
    if (step === 1) {
      if (!input.arrivalDate || !input.departureDate) {
        setValidationError("Please select Arrival and Departure dates.");
        return false;
      }
      if (new Date(input.departureDate) <= new Date(input.arrivalDate)) {
        setValidationError("Departure must be after Arrival.");
        return false;
      }
      if (!input.startPoint) {
        setValidationError("Please select a Start Point.");
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
  if (validateStep(currentStep)) {
    
    if (onSaveProgress) {
        onSaveProgress(currentStep); 
    }

    setCurrentStep(prev => prev + 1);
  }
};

  const handlePrev = () => {
    setValidationError(null);
    setCurrentStep(prev => prev - 1);
  };

  const handleGenerateClick = () => {
    if (onSaveProgress) {
        // අන්තිම step එකේ data ටිකත් generate වෙන්න කලින් save කරන්න
        onSaveProgress(4); 
    }
    // ඉන්පසු සාමාන්‍ය handleGenerate function එක කතා කරන්න
    handleGenerate();
  };

  // --- Render Steps ---

  // STEP 1: Dates & Route
  const renderStep1 = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Arrival */}
        <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
          <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Arrival</label>
          <div className="flex gap-6">
            <input
              type="date"
              value={input.arrivalDate}
              onChange={e => setInput({ ...input, arrivalDate: e.target.value })}
              onClick={(e) => e.currentTarget.showPicker()}
              className="w-full bg-transparent font-bold text-gray-700 outline-none cursor-pointer"
            />
            <input
              type="time"
              value={input.arrivalTime}
              onChange={e => setInput({ ...input, arrivalTime: e.target.value })}
              onClick={(e) => e.currentTarget.showPicker()}
              className="w-32 bg-transparent font-bold text-gray-700 outline-none text-right cursor-pointer"
            />
          </div>
        </div>

        {/* Departure */}
        <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
          <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Departure</label>
          <div className="flex gap-6">
            <input
              type="date"
              value={input.departureDate}
              min={input.arrivalDate}
              onChange={e => setInput({ ...input, departureDate: e.target.value })}
              onClick={(e) => e.currentTarget.showPicker()}
              className="w-full bg-transparent font-bold text-gray-700 outline-none cursor-pointer"
            />
            <input
              type="time"
              value={input.departureTime}
              onChange={e => setInput({ ...input, departureTime: e.target.value })}
              onClick={(e) => e.currentTarget.showPicker()}
              className="w-32 bg-transparent font-bold text-gray-700 outline-none text-right cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Locations */}
      <div className="space-y-4">
        <div>
          <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
            <MapPin className="w-4 h-4 text-emerald-600" /> Start Point
          </label>
          {isLoaded ? (
            <Autocomplete onLoad={placesHandlers.onStartLoad} onPlaceChanged={placesHandlers.onStartChanged} options={{ componentRestrictions: { country: "lk" } }}>
              <input
                type="text"
                value={input.startPoint}
                onChange={(e) => setInput({ ...input, startPoint: e.target.value })}
                placeholder="Where does your journey begin?"
                className="w-full p-4 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
              />
            </Autocomplete>
          ) : <div className="p-4 bg-gray-50 rounded-xl text-gray-400">Loading Maps...</div>}
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
            <MapPin className="w-4 h-4 text-emerald-600" /> End Point (Optional)
          </label>
          <select
            value={isCustomEndPoint ? 'custom' : input.endPoint || 'linear'}
            onChange={(e) => {
              const val = e.target.value;
              if (val === 'custom') { setIsCustomEndPoint(true); setInput({ ...input, endPoint: '' }); }
              else {
                setIsCustomEndPoint(false);
                if (val === 'linear') setInput({ ...input, endPoint: '' });
                else setInput({ ...input, endPoint: val === 'round_trip' ? input.startPoint : val });
              }
            }}
            className="w-full p-3 mb-2 bg-gray-50 border-none rounded-xl font-medium text-gray-600 focus:ring-2 focus:ring-emerald-500"
          >
            <option value="linear">End at Last Destination (Default)</option>
            <option value="round_trip">Round Trip (Back to Start)</option>
            <option value="Colombo Bandaranaike International Airport (CMB)">Drop at Airport (CMB)</option>
            <option value="custom">Custom Location...</option>
          </select>
          {isCustomEndPoint && isLoaded && (
            <Autocomplete onLoad={placesHandlers.onEndLoad} onPlaceChanged={placesHandlers.onEndChanged} options={{ componentRestrictions: { country: "lk" } }}>
              <input type="text" value={input.endPoint} onChange={(e) => setInput({ ...input, endPoint: e.target.value })} placeholder="Enter drop-off city..." className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" />
            </Autocomplete>
          )}
        </div>
      </div>
    </div>
  );

  // STEP 2: Travelers & Vehicle
  const renderStep2 = () => (
    <div className="space-y-6 animate-fade-in">
      {/* Budget */}
      <div className="bg-emerald-50 p-5 rounded-2xl flex items-center justify-between">
        <div>
          <span className="flex items-center gap-2 text-emerald-800 font-bold mb-1"><Wallet className="w-4 h-4" /> Budget (USD)</span>
          <p className="text-xs text-emerald-600">Approx. per person excluding flights</p>
        </div>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-700 font-bold">$</span>
          <input
            type="number"
            value={input.budget}
            onChange={e => setInput({ ...input, budget: Number(e.target.value) })}
            className="w-32 pl-6 pr-3 py-2 bg-white text-right font-bold rounded-lg border-2 border-emerald-200 focus:border-emerald-500 outline-none"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 border border-gray-200 rounded-2xl text-center hover:border-emerald-400 transition-colors">
          <Users className="w-6 h-6 mx-auto text-emerald-600 mb-2" />
          <label className="block text-sm font-bold text-gray-600 mb-2">Adults</label>
          <select value={input.adults} onChange={e => setInput({ ...input, adults: Number(e.target.value) })} className="w-full text-center font-bold text-lg bg-transparent outline-none">
            {[1, 2, 3, 4, 5, 6, 8, 10, 15, 20].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div className="bg-white p-4 border border-gray-200 rounded-2xl text-center hover:border-emerald-400 transition-colors">
          <Baby className="w-6 h-6 mx-auto text-emerald-600 mb-2" />
          <label className="block text-sm font-bold text-gray-600 mb-2">Children</label>
          <select value={input.children} onChange={e => setInput({ ...input, children: Number(e.target.value) })} className="w-full text-center font-bold text-lg bg-transparent outline-none">
            {[0, 1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
          <Car className="w-4 h-4 text-emerald-600" /> Preferred Vehicle
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {['TukTuk', 'Car (Sedan)', 'SUV', 'Passenger Van', 'Mini Bus'].map((v) => (
            <button
              key={v}
              onClick={() => setInput({ ...input, vehicleType: v })}
              className={`p-3 rounded-xl text-sm font-bold border ${input.vehicleType === v ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>
      <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-white p-2 rounded-full text-emerald-600 shadow-sm">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-gray-700 text-sm">Need a Tour Guide?</h4>
            <p className="text-xs text-emerald-700">Add a professional guide for the trip</p>
          </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={input.includeGuide || false}
            onChange={(e) => setInput({ ...input, includeGuide: e.target.checked })}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
        </label>
      </div>
    </div>
  );

  // STEP 3: Vibe, Hotels & Budget
  const renderStep3 = () => (
    <div className="space-y-6 animate-fade-in">

      {/* Accommodation Section */}
      <div>
        <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
          <BedDouble className="w-4 h-4 text-emerald-600" /> Accommodation Preference
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {HOTEL_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => setInput({ ...input, hotelRating: type })}
              className={`p-3 rounded-xl text-xs sm:text-sm font-bold border transition-all ${input.hotelRating === type
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-400'
                }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Interests */}
      <div>
        <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
          <Heart className="w-4 h-4 text-red-500" /> What do you love?
        </label>
        <div className="flex flex-wrap gap-2">
          {INTERESTS.map(i => (
            <button
              key={i}
              onClick={() => toggleInterest(i)}
              className={`px-4 py-2 rounded-full text-xs font-bold border transition-all ${input.interests.includes(i) ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-600 border-gray-200'}`}
            >
              {i}
            </button>
          ))}
        </div>
      </div>

      {/* Specific Stops */}
      <div className="space-y-2">
        <label className="text-sm font-bold text-gray-700">Must-visit places (Optional)</label>
        <div className="flex flex-wrap gap-2">
          {input.nextDestinations.map((stop, idx) => (
            <span key={idx} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
              {stop} <button onClick={() => removeStop(idx)}><X className="w-3 h-3 hover:text-red-500" /></button>
            </span>
          ))}
        </div>
        {isLoaded && (
          <Autocomplete onLoad={placesHandlers.onNextLoad} onPlaceChanged={placesHandlers.onNextChanged} options={{ componentRestrictions: { country: "lk" } }}>
            <div className="relative">
              <input type="text" value={input.nextDestination} onChange={(e) => setInput({ ...input, nextDestination: e.target.value })} placeholder="+ Add stop (e.g. Ella)" className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-emerald-500 outline-none" />
              <Plus className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
            </div>
          </Autocomplete>
        )}
      </div>
    </div>
  );

  // STEP 4: Special Notes & Finalize (NEW SECTION)
  const renderStep4 = () => (
    <div className="space-y-6 animate-fade-in flex flex-col h-full justify-between">
      <div>
        <div className="text-center mb-6">
          <div className="bg-emerald-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
            <FileText className="w-6 h-6 text-emerald-600" />
          </div>
          <h3 className="text-xl font-black text-gray-800">Final Touches</h3>
          <p className="text-gray-500 text-sm">Anything else we should know before planning?</p>
        </div>

        <div className="relative">
          <textarea
            value={input.userNotes}
            onChange={(e) => setInput({ ...input, userNotes: e.target.value })}
            placeholder="Tell us about dietary restrictions, allergies, specific interests, or any special occasions like anniversaries..."
            className="w-full p-5 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none min-h-[160px] text-sm font-medium resize-none shadow-sm transition-all focus:border-emerald-300"
          />
          <div className="absolute bottom-3 right-3 text-xs text-gray-400 font-medium">
            Optional
          </div>
        </div>
      </div>
    </div>
  );

  // --- Main Render ---

  if (!isExpanded && itineraryExists) {
    return (
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in-down">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-100 p-2 rounded-full text-emerald-600"><CheckCircle2 className="w-5 h-5" /></div>
          <div>
            <h3 className="font-bold text-gray-800">Trip Plan Ready!</h3>
            <p className="text-xs text-gray-500">{input.adults + input.children} Travelers • {input.hotelType || 'Standard'} • ${input.budget}</p>
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button onClick={() => setIsExpanded(true)} className="flex-1 sm:flex-none px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-bold flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4" /> Edit Plan
          </button>
          <button 
  onClick={handleGenerateClick} 
  disabled={loading}
  className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-70 disabled:pointer-events-none"
>
  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
  Regenerate Plan
</button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[2rem] shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden relative">

      {/* Header / Progress Bar */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
        <div className="flex gap-2">
          {/* Changed loop to 4 steps */}
          {[1, 2, 3, 4].map(step => (
            <div key={step} className={`h-2 rounded-full transition-all duration-300 ${step <= currentStep ? 'w-8 bg-emerald-500' : 'w-2 bg-gray-300'}`} />
          ))}
        </div>
        <button onClick={() => itineraryExists ? setIsExpanded(false) : null} className="text-gray-400 hover:text-gray-600">
          {itineraryExists && <ChevronUp className="w-5 h-5" />}
        </button>
      </div>

      <div className="p-6 sm:p-8">
        <h2 className="text-2xl font-black text-gray-800 mb-1">
          {currentStep === 1 && "Plan Your Journey"}
          {currentStep === 2 && "Who is Traveling?"}
          {currentStep === 3 && "Customize Experience"}
          {currentStep === 4 && "Almost There!"}
        </h2>
        <p className="text-sm text-gray-500 mb-6">Step {currentStep} of 4</p>

        {validationError && (
          <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm font-bold mb-4 flex items-center gap-2">
            <span className="text-lg">⚠️</span> {validationError}
          </div>
        )}
        {error && <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm mb-4">{error}</div>}

        <div className="min-h-[300px]">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
        </div>

        <div className="flex items-center justify-between pt-6 mt-2 border-t border-gray-50">
          {currentStep > 1 ? (
            <button onClick={handlePrev} className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 flex items-center gap-2 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          ) : <div></div>}

          {/* Changed Button Logic for 4 Steps */}
          {currentStep < 4 ? (
            <button onClick={handleNext} className="px-8 py-3 rounded-xl font-bold bg-gray-900 text-white hover:bg-black flex items-center gap-2 shadow-lg hover:shadow-xl transition-all active:scale-95">
              Next Step <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleGenerateClick}
              disabled={loading}
              className="px-8 py-3 rounded-xl font-bold bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-2 shadow-lg shadow-emerald-200 hover:shadow-xl transition-all active:scale-95 disabled:opacity-70 disabled:pointer-events-none"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              {itineraryExists ? "Regenerate Plan" : "Generate Itinerary"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlannerForm;