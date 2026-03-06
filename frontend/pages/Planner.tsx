// src/pages/Planner.tsx

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Loader2, Compass, Map as MapIcon } from 'lucide-react';
import { usePlanner } from '../hooks/usePlanner';
import { useAuth } from '../hooks/useAuth';
import PlannerForm from '../components/PlannerForm';
import AuthModal from '../components/AuthModal';

// Components
import PlannerHeader from '../components/planner/PlannerHeader';
import SavedPlansSidebar from '../components/planner/SavedPlansSidebar';
import ItineraryDayList from '../components/planner/ItineraryDayList';
import RegenerateModal from '../components/planner/RegenerateModal';
import ItineraryMap from '../components/ItineraryMap';
import LoadingScreen from '@/components/planner/LoadingScreen';

const getValidPrice = (item: any, fallbackCost: number) => {
    if (!item) return fallbackCost;
    const rawPrice = item.price ?? item.estimatedCost ?? item.cost ?? item.ticketPrice ?? fallbackCost;
    const parsed = parseFloat(String(rawPrice).replace(/[^0-9.]/g, ''));
    return isNaN(parsed) ? fallbackCost : parsed;
};

const Planner: React.FC = () => {
    // Hooks & Context
    const { user } = useAuth();
    const {
        input, setInput, itinerary, history, currentIndex, switchVersion,
        loading, error, isLoaded, handleGenerate, handleRegenerateDay,
        regeneratingDayIndex, handleUpdateCosts, placesHandlers,
        saveStatus, saveToDatabase, savedPlans, fetchSavedPlans,
        loadSavedPlan, deletePlan, isSidebarOpen, setIsSidebarOpen,
    } = usePlanner();

    const [showAuthModal, setShowAuthModal] = useState(false);
    const [regenerateModal, setRegenerateModal] = useState<{ isOpen: boolean, dayIndex: number | null }>({
        isOpen: false, dayIndex: null
    });
    const [focusedDayIndex, setFocusedDayIndex] = useState<number | null>(null);
    const [selectedActivity, setSelectedActivity] = useState<any>(null);
    const [activityOverrides, setActivityOverrides] = useState<Record<number, any[]>>({});
    const [hotelOverrides, setHotelOverrides] = useState<Record<number, any>>({});
    const [grandTotalCost, setGrandTotalCost] = useState<number>(0);

    useEffect(() => {
        if (isSidebarOpen && user) {
            fetchSavedPlans(user._id || user.id);
        }
    }, [isSidebarOpen, user]);

    // Save Progress to Backend when User clicks Next
    const handleSaveProgress = async (currentStep: number) => {
        try {
            // 1. Get or create a guest ID if the user isn't logged in (මේක ඔයාගේ කලින් කෝඩ් එකමයි)
            let guestId = localStorage.getItem('planner_guest_id');
            if (!guestId && !user) {
                guestId = 'guest_' + Math.random().toString(36).substr(2, 9);
                localStorage.setItem('planner_guest_id', guestId);
            }

            // 2. 🔥 අලුතෙන් එකතු කරපු Session ID Logic එක
            // sessionStorage එකේ ID එකක් තියෙනවද බලනවා. නැත්නම් අලුතෙන් එකක් හදනවා.
            let currentSessionId = sessionStorage.getItem('planner_session_id');
            if (!currentSessionId) {
                currentSessionId = 'session_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
                sessionStorage.setItem('planner_session_id', currentSessionId);
            }

            // 3. Send the data to the correct existing endpoint
            await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/plans/auto-save`, {
                sessionId: currentSessionId, // 🔥 'session_progress' වෙනුවට අර හැදුව අලුත් ID එක යවනවා
                userId: user?._id || user?.id || null,
                guestId: guestId,
                inputData: input,
                status: 'draft',
                lastCompletedStep: currentStep // This tells the admin panel what step they just finished!
            });
            console.log(`Step ${currentStep} saved to backend with Session ID: ${currentSessionId}`);
        } catch (err) {
            console.error("Failed to sync progress:", err);
        }
    };

    if (!isLoaded) return <div className="h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-600" /></div>;

    return (
        <div className="min-h-screen bg-gray-50 pb-20 font-poppins">
            {/* Header Area */}
            <PlannerHeader
                user={user}
                startNewPlan={() => window.location.reload()}
                setIsSidebarOpen={setIsSidebarOpen}
                onSave={() => user && saveToDatabase(user._id || user.id, `Trip to ${input.nextDestination || 'Sri Lanka'}`)}
                saveStatus={saveStatus}
                itinerary={itinerary}
                input={input}
                activityOverrides={activityOverrides}
                hotelOverrides={hotelOverrides}
                setActivityOverrides={setActivityOverrides}
                setHotelOverrides={setHotelOverrides}
            />

            {/* 🔥 CHANGE 1: Increased Max Width to give map more room (was max-w-7xl) */}
            <div className="max-w-[1800px] mx-auto px-4 sm:px-6 py-6 space-y-8">

                {/* 1. PLANNER FORM (WIZARD) */}
                <div className="relative z-20 max-w-7xl mx-auto w-full">
                    <PlannerForm
                        input={input}
                        setInput={setInput}
                        isLoaded={isLoaded}
                        placesHandlers={placesHandlers}
                        loading={loading}
                        handleGenerate={handleGenerate}
                        handleUpdateCosts={handleUpdateCosts}
                        itineraryExists={!!itinerary}
                        error={error}
                        onSaveProgress={handleSaveProgress}
                    />
                </div>

                {/* 2. RESULTS AREA */}
                <div className="relative z-10 min-h-[400px]">

                    {/* Scenario A: Loading */}
                    <div id="itinerary-results-section">
                        {loading && (
                            <div className="max-w-4xl mx-auto animate-in fade-in duration-500">
                                <LoadingScreen />
                            </div>
                        )}
                    </div>

                    {/* Scenario B: Empty State */}
                    {!itinerary && !loading && (
                        <div className="text-center py-12 opacity-50">
                            <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto flex items-center justify-center mb-4">
                                <MapIcon className="w-10 h-10 text-gray-400" />
                            </div>
                            <p className="text-gray-500 font-medium">Fill out the steps above to see your customized plan here.</p>
                        </div>
                    )}

                    {/* Scenario C: The Itinerary (SPLIT VIEW) */}
                    {itinerary && !loading && (
                        <div className="animate-in slide-in-from-bottom-10 fade-in duration-700">
                            {/* Section Title */}
                            <div className="flex items-center justify-between mb-6 max-w-7xl mx-auto">
                                <h3 className="text-2xl font-black text-gray-800">Your Itinerary</h3>
                                <span className="text-sm font-bold bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">
                                    {itinerary.days?.length} Days
                                </span>
                            </div>

                            {/* 🔥 GRID LAYOUT CHANGED: Map gets more space now */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative">

                                {/* LEFT COLUMN: Scrollable Itinerary */}
                                {/* 🔥 CHANGE 2: Reduced List Width (was col-span-7) */}
                                <div className="lg:col-span-7 xl:col-span-6">
                                    <ItineraryDayList
                                        itinerary={itinerary}
                                        input={input}
                                        history={history}
                                        currentIndex={currentIndex}
                                        switchVersion={switchVersion}
                                        regeneratingDayIndex={regeneratingDayIndex}
                                        setRegenerateModal={setRegenerateModal}
                                        isLoaded={isLoaded}
                                        focusedDayIndex={focusedDayIndex}
                                        setFocusedDayIndex={setFocusedDayIndex}
                                        onActivitySelect={(activity) => setSelectedActivity(activity)}
                                        activityOverrides={activityOverrides}
                                        setActivityOverrides={setActivityOverrides}
                                        hotelOverrides={hotelOverrides}
                                        setHotelOverrides={setHotelOverrides}
                                        onTotalChange={setGrandTotalCost}
                                    />
                                </div>

                                {/* RIGHT COLUMN: Sticky Map */}
                                {/* 🔥 CHANGE 3: Increased Map Width (was col-span-5) */}
                                <div className="hidden lg:block lg:col-span-5 xl:col-span-6">

                                    {/* Sticky Wrapper - මේක ඇතුලේ තමයි Card එකයි Map එකයි gap එකක් එක්ක තියෙන්නේ */}
                                    <div className="sticky top-24 flex flex-col gap-4">

                                        {/* 1. Total Cost Card */}
                                        <div className="bg-white p-5 rounded-2xl shadow-lg border border-gray-200 flex justify-between items-center transition-all duration-300">
                                            <div>
                                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                                                    Estimated Total Cost
                                                </h4>
                                                <div className="text-3xl font-black text-emerald-600">
                                                    ${grandTotalCost.toLocaleString()}
                                                </div>
                                            </div>
                                            <div className="text-right text-xs text-gray-500 max-w-[130px] leading-tight">
                                                Price updates automatically as you change activities or hotels.
                                            </div>
                                        </div>

                                        {/* 2. Map Container - Height එක calc(100vh-240px) කරලා තියෙන්නේ Card එකට ඉඩ දෙන්න */}
                                        <div className="h-[calc(100vh-240px)] w-full rounded-2xl overflow-hidden shadow-xl border border-gray-200">
                                            <ItineraryMap
                                                locations={itinerary.days.map((d: any) => d.location)}
                                                days={itinerary.days}
                                                isLoaded={isLoaded}
                                                startPoint={input.startPoint}
                                                focusedDayIndex={focusedDayIndex}
                                                selectedActivity={selectedActivity}
                                                onCloseActivity={() => setSelectedActivity(null)}
                                                activityOverrides={activityOverrides}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            </div>
                    )}
                        </div>
            </div>

                {/* Sidebars & Modals */}
                <SavedPlansSidebar
                    isOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)}
                    savedPlans={savedPlans}
                    loadSavedPlan={loadSavedPlan}
                    onDelete={deletePlan}
                />
                <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
                <RegenerateModal
                    isOpen={regenerateModal.isOpen}
                    dayIndex={regenerateModal.dayIndex}
                    onClose={() => setRegenerateModal({ isOpen: false, dayIndex: null })}
                    onRegenerate={(index, request) => handleRegenerateDay(index, undefined, request)}
                />
            </div>
            );
};

export default Planner;