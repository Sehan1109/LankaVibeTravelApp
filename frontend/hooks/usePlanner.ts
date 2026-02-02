import { useState, useRef } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import { generateItinerary, regenerateSingleDay } from '../services/gemini';
import { PlannerInput, Itinerary } from '../types';

// API Configuration
const LIBRARIES: ("places")[] = ['places'];
const TODAY = new Date().toISOString().split('T')[0];
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL + '/api';

export const usePlanner = () => {
  // --- 1. Google Maps Load ---
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY, 
    libraries: LIBRARIES
  });

  // --- 2. State Definitions ---
  
  // Input Form State
  const [input, setInput] = useState<PlannerInput>({
    arrivalDate: TODAY,
    arrivalTime: '10:00',
    departureDate: TODAY,
    departureTime: '18:00',
    budget: 2500,
    interests: [],
    startPoint: 'Colombo Bandaranaike International Airport (CMB)', 
    endPoint: 'Colombo Bandaranaike International Airport (CMB)',
    nextDestination: '',
    nextDestinations: [],
    userNotes: '', 
    adults: 2,
    children: 0,
    hotelRating: '4',
    vehicleType: 'Car',
    includeGuide: false,
    pace: 'Moderate',
  });

  // Itinerary State
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // History / Undo State
  const [history, setHistory] = useState<Itinerary[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  // Sidebar / UI State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [savedPlans, setSavedPlans] = useState<any[]>([]);
  const [regeneratingDayIndex, setRegeneratingDayIndex] = useState<number | null>(null);

  // Refs for Autocomplete
  const startPointRef = useRef<google.maps.places.Autocomplete | null>(null);
  const nextDestRef = useRef<google.maps.places.Autocomplete | null>(null);
  const endPointRef = useRef<google.maps.places.Autocomplete | null>(null);

  // --- 3. HELPER: Fetch Real Prices (Hybrid Approach) ---
  
  const enrichItineraryWithRealPrices = async (aiItinerary: Itinerary, input: PlannerInput): Promise<Itinerary> => {
    console.log("🔍 Attempting to fetch real prices...");
    
    try {
        // Call the backend endpoint that handles SerpApi logic
        const response = await fetch(`${API_BASE_URL}/plans/refresh-prices`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                itinerary: aiItinerary,
                input: input
            })
        });

        if (!response.ok) {
             throw new Error("Price API not available");
        }

        const updatedItinerary = await response.json();
        
        // Recalculate Grand Total Budget based on new real prices
        const newTotal = updatedItinerary.days.reduce((acc: number, day: any) => {
            const dayTotal = 
                (day.estimatedCost?.accommodation || 0) + 
                (day.estimatedCost?.tickets || 0) + 
                (day.estimatedCost?.transportFuel || 0);
            return acc + dayTotal;
        }, 0);

        return {
            ...updatedItinerary,
            estimatedTotalBudget: `$${newTotal.toLocaleString()}`
        };

    } catch (e) {
        console.warn(`⚠️ Real price fetch failed. Using AI estimates.`, e);
        return aiItinerary; // Fallback to AI data if API fails
    }
  };

  // --- 4. Main Actions ---

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setItinerary(null);
    
    try {
      // Step 1: Generate Plan with Gemini (AI)
      const aiGeneratedItinerary = await generateItinerary(input);
      
      // Step 2: Enrich with Real Prices (Optional Backend Integration)
      const finalItinerary = await enrichItineraryWithRealPrices(aiGeneratedItinerary, input);

      // Step 3: Update State
      setItinerary(finalItinerary);
      addToHistory(finalItinerary);
      setIsSidebarOpen(false); // Auto-close sidebar on success
    } catch (err: any) {
      console.error("Generation Error:", err);
      setError(err.message || "Failed to generate itinerary. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateDay = async (dayIndex: number, newLocation?: string, customRequest?: string) => {
    if (!itinerary) return;
    setRegeneratingDayIndex(dayIndex);
    
    try {
        // 1. Regenerate structure with AI
        const updatedDay = await regenerateSingleDay(dayIndex, itinerary, input, newLocation, customRequest);
        
        // 2. Try to get real prices for the NEW location/day
        // We reuse the logic by mocking a single-day itinerary for the helper
        const tempItinerary = { ...itinerary, days: [updatedDay] };
        const enrichedTemp = await enrichItineraryWithRealPrices(tempItinerary, input);
        const finalDay = enrichedTemp.days[0];

        // 3. Update State
        const newDays = [...itinerary.days];
        newDays[dayIndex] = finalDay;
        
        const newItinerary = { ...itinerary, days: newDays };
        setItinerary(newItinerary);
        addToHistory(newItinerary);

    } catch (err: any) {
        console.error("Regenerate Error:", err);
        setError("Failed to update day. Please try again.");
    } finally {
        setRegeneratingDayIndex(null);
    }
  };

  // --- 5. History Management ---
  const addToHistory = (newItem: Itinerary) => {
    const newHistory = history.slice(0, currentIndex + 1);
    newHistory.push(newItem);
    setHistory(newHistory);
    setCurrentIndex(newHistory.length - 1);
  };

  const switchVersion = (index: number) => {
    if (index >= 0 && index < history.length) {
      setCurrentIndex(index);
      setItinerary(history[index]); // Sync the main itinerary display with the history item
    }
  };

  const startNewPlan = () => {
      setHistory([]);
      setCurrentIndex(-1);
      setItinerary(null);
      setSaveStatus('idle');
      setError(null);
      setInput(prev => ({ ...prev, userNotes: '' })); 
      setIsSidebarOpen(false);
  };

  // --- 6. Database / Saving (Placeholder Logic) ---
  const saveToDatabase = async (userId: string, planName: string) => {
    if (!itinerary) {
        console.error("No itinerary to save");
        return;
    }
    if (!userId) {
        console.error("Cannot save: User not logged in");
        setSaveStatus('error');
        return;
    }

    setSaveStatus('saving');
    
    try {
        const payload = {
            userId: userId,
            name: planName,
            inputData: input,
            itineraryData: itinerary
        };

        const response = await fetch(`${API_BASE_URL}/plans/save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            setSaveStatus('saved');
            
            // Immediately refresh the "My Plans" list
            fetchSavedPlans(userId);
        } else {
            console.error("❌ Save failed:", await response.text());
            setSaveStatus('error');
        }
    } catch (e) {
        console.error("❌ Network error while saving:", e);
        setSaveStatus('error');
    }
  };

  const fetchSavedPlans = async (userId: string) => {
    if (!userId) return;

    try {
        const response = await fetch(`${API_BASE_URL}/plans/user/${userId}`);
        
        if (response.ok) {
            const data = await response.json();
            setSavedPlans(data);
        } else {
            console.error('Failed to fetch saved plans');
        }
    } catch (error) {
        console.error('Error fetching plans:', error);
    }
  };

  const loadSavedPlan = (plan: any) => {
      setItinerary(plan);
      setIsSidebarOpen(false);
  };

  const deletePlan = async (planId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/plans/${planId}`, {
          method: 'DELETE'
      });

      if (response.ok) {
        setSavedPlans(prev => prev.filter(plan => plan._id !== planId));
      } else {
        console.error('Failed to delete plan');
      }
    } catch (error) {
      console.error('Error deleting plan:', error);
    }
  }

  // --- 7. Autocomplete Handlers ---
  const placesHandlers = {
    onStartLoad: (ac: google.maps.places.Autocomplete) => { startPointRef.current = ac; },
    onStartChanged: () => {
       const place = startPointRef.current?.getPlace();
       if(place?.formatted_address) setInput(p => ({...p, startPoint: place.formatted_address!}));
    },
    onEndLoad: (ac: google.maps.places.Autocomplete) => { endPointRef.current = ac; },
    onEndChanged: () => {
       const place = endPointRef.current?.getPlace();
       if(place?.formatted_address) setInput(p => ({...p, endPoint: place.formatted_address!}));
    },
    onNextLoad: (ac: google.maps.places.Autocomplete) => { nextDestRef.current = ac; },
    onNextChanged: () => {
      const place = nextDestRef.current?.getPlace();
       if(place?.formatted_address) {
          setInput(prev => ({
             ...prev,
             nextDestinations: [...prev.nextDestinations, place.formatted_address!], // Add to list
             nextDestination: '' // Clear input field
          }));
       }
    }
  };

  

  const handleBookTrip = async (customerDetails: { name: string; email: string; phone: string }) => {
    // 1. Get the currently active plan
    const activePlan = (history && history.length > 0 && history[currentIndex]) 
        ? history[currentIndex] 
        : itinerary;

    if (!activePlan) return;

    // 2. Prepare the payload
    const bookingPayload = {
        customer: customerDetails,
        tripDetails: {
            travelers: input.travelers,
            budget: input.budget,
            arrivalDate: input.arrivalDate,
            departureDate: input.departureDate,
            startPoint: input.startPoint,
            vehicle: input.vehicleType, // Assuming you have this in input
        },
        // 3. SEND THE FULL AI ITINERARY
        fullItinerary: activePlan 
    };

    try {
        const response = await fetch(`${API_BASE_URL}/bookings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bookingPayload)
        });

        if (response.ok) {
            alert("Booking Request Sent Successfully!");
            // Optional: Redirect to a "Success" page
        } else {
            alert("Failed to send booking request.");
        }
    } catch (error) {
        console.error("Booking Error:", error);
    }
};

// NEW: Function to update ONLY costs (no AI regeneration)
  const handleUpdateCosts = async () => {
    if (!itinerary) return;
    
    setLoading(true); // Or use a separate loading state like 'updatingCosts'
    try {
        console.log("💰 Recalculating costs based on new settings...");
        
        // Call the backend price refresh endpoint with CURRENT itinerary + NEW input
        const updatedItinerary = await enrichItineraryWithRealPrices(itinerary, input);
        
        // Update state
        setItinerary(updatedItinerary);
        
        // Optional: Update history too so if they undo, they go back to old price
        addToHistory(updatedItinerary);
        
    } catch (err) {
        console.error("Failed to update costs:", err);
        setError("Failed to update prices. Please try again.");
    } finally {
        setLoading(false);
    }
  };

  return {
    // State
    input, setInput,
    itinerary, setItinerary,
    history, currentIndex, switchVersion,
    loading, error, isLoaded,
    isSidebarOpen, setIsSidebarOpen,
    saveStatus, savedPlans, deletePlan,
    regeneratingDayIndex,

    // Actions
    handleGenerate,
    handleRegenerateDay,
    startNewPlan,
    saveToDatabase,
    fetchSavedPlans,
    loadSavedPlan,
    placesHandlers,
    handleBookTrip,
    handleUpdateCosts
  };
};