// src/pages/Planner.tsx

import React, { useState, useEffect } from 'react';
import { Loader2, Compass } from 'lucide-react';
import { usePlanner } from '../hooks/usePlanner';
import { useAuth } from '../context/AuthContext';
import PlannerForm from '../components/PlannerForm';
import AuthModal from '../components/AuthModal';

// New Components
import PlannerHeader from '../components/planner/PlannerHeader';
import SavedPlansSidebar from '../components/planner/SavedPlansSidebar';
import ItineraryDayList from '../components/planner/ItineraryDayList';
import RegenerateModal from '../components/planner/RegenerateModal';

const Planner: React.FC = () => {
    // --- 1. HOOKS & CONTEXT ---
    const { user } = useAuth();

    const {
        input, setInput,
        itinerary,
        history, currentIndex, switchVersion,
        loading, error, isLoaded,
        handleGenerate, handleRegenerateDay, regeneratingDayIndex, handleUpdateCosts,
        placesHandlers,
        saveStatus, saveToDatabase,
        savedPlans, fetchSavedPlans, loadSavedPlan, startNewPlan, deletePlan,
        isSidebarOpen, setIsSidebarOpen
    } = usePlanner();

    // --- 2. LOCAL STATE ---
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [regenerateModal, setRegenerateModal] = useState<{ isOpen: boolean, dayIndex: number | null }>({
        isOpen: false,
        dayIndex: null
    });

    // Fetch saved plans on load
    useEffect(() => {
        if (isSidebarOpen && user) {
            // Ensure we use the correct ID property (usually _id for MongoDB)
            const userId = user._id || user.id; 
            fetchSavedPlans(userId);
        }
    }, [isSidebarOpen, user]);

    if (!isLoaded) return <div className="h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-600" /></div>;

    return (
        <div className="min-h-screen bg-gray-50 pb-12 sm:pb-20 relative overflow-x-hidden font-poppins">
            <PlannerHeader
                user={user}
                startNewPlan={startNewPlan}
                setIsSidebarOpen={setIsSidebarOpen}
                onSave={() => user && saveToDatabase(user._id || user.id, `Trip to ${input.nextDestination || 'Sri Lanka Adventure'}`)}
                saveStatus={saveStatus}
                itinerary={itinerary}
                input={input}
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-4 xl:px-8 py-4 sm:py-6 lg:py-8">

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-6 xl:gap-8">
                    
                    {/* LEFT COLUMN: INPUT FORM */}
                    <div className="lg:col-span-5 xl:col-span-4 h-fit relative lg:sticky lg:top-24 z-10">
                        <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100">
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
                            />
                        </div>
                    </div>

                    {/* RIGHT COLUMN: RESULTS */}
                    <div className="lg:col-span-7 xl:col-span-8">
                        
                        {/* Empty State */}
                        {!itinerary && !loading && (
                            <div className="bg-white rounded-2xl sm:rounded-3xl border-2 border-dashed border-gray-200 p-6 sm:p-12 text-center h-[350px] sm:h-[400px] lg:h-[500px] flex flex-col items-center justify-center group hover:border-emerald-300 transition-colors">
                                <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-emerald-50 rounded-full flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300">
                                    <Compass className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-emerald-500" />
                                </div>
                                <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">Ready to explore?</h3>
                                <p className="text-sm sm:text-base text-gray-500 max-w-md px-4 sm:px-0">
                                    Fill in your preferences on the left and let our AI craft a personalized itinerary just for you.
                                </p>
                            </div>
                        )}

                        {/* Loading State */}
                        {loading && (
                            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl p-8 sm:p-12 text-center h-[350px] sm:h-[400px] lg:h-[500px] flex flex-col items-center justify-center">
                                <Loader2 className="w-12 h-12 sm:w-16 sm:h-16 text-emerald-600 animate-spin mb-4 sm:mb-6" />
                                <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Curating Your Experience...</h3>
                                <p className="text-sm sm:text-base text-gray-500">Checking routes, hotels, and hidden gems.</p>
                            </div>
                        )}

                        {/* Itinerary Results */}
                        {itinerary && !loading && (
                            <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-6 sm:space-y-8">
                                <ItineraryDayList
                                    itinerary={itinerary}
                                    input={input}
                                    history={history}
                                    currentIndex={currentIndex}
                                    switchVersion={switchVersion}
                                    regeneratingDayIndex={regeneratingDayIndex}
                                    setRegenerateModal={setRegenerateModal}
                                    isLoaded={isLoaded}
                                    onBookClick={() => setShowBookingModal(true)}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* MODALS & SIDEBARS */}
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