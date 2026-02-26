import React, { useState, useMemo, useEffect } from 'react';
import { RefreshCw, Tag, Ticket, Car, BedDouble, DollarSign, ArrowDown, Star, ExternalLink, ChevronUp, ChevronDown, Plus, X, MapPin, Lightbulb, AlertTriangle, ArrowRightLeft, Clock, RotateCcw } from 'lucide-react';
import CostSummary from '@/components/CostSummary';
import { generatePDF } from '../../utils/pdfGenerator';

interface ItineraryDayListProps {
    itinerary: any;
    input: any;
    history: any[];
    currentIndex: number;
    switchVersion: (idx: number) => void;
    regeneratingDayIndex: number | null;
    setRegenerateModal: (data: { isOpen: boolean; dayIndex: number | null }) => void;
    isLoaded: boolean;
    focusedDayIndex: number | null;
    setFocusedDayIndex: (idx: number | null) => void;
    onActivitySelect?: (activity: any) => void;
    activityOverrides: Record<number, any[]>;
    setActivityOverrides: React.Dispatch<React.SetStateAction<Record<number, any[]>>>;
    hotelOverrides: Record<number, any>;
    setHotelOverrides: React.Dispatch<React.SetStateAction<Record<number, any>>>;
}

// --- Helper Functions & Components ---

// Parse duration string to minutes (e.g. "2 hours" -> 120)
const parseDurationToMinutes = (durationStr: string): number => {
    if (!durationStr) return 60; // Default 1 hour
    const num = parseInt(durationStr.replace(/\D/g, '')) || 0;
    if (durationStr.toLowerCase().includes('min')) return num;
    return num * 60; // Hours -> Minutes
};

const ExpandableDescription = ({ text }: { text: string }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    return (
        <div onClick={() => setIsExpanded(!isExpanded)} className="group cursor-pointer transition-all duration-200">
            <p className={`text-gray-500 text-sm leading-relaxed mb-4 ${isExpanded ? '' : 'line-clamp-3'}`}>{text}</p>
            {!isExpanded && text.length > 150 && (<span className="text-[10px] font-bold text-emerald-600 uppercase mt-[-10px] block mb-4 group-hover:underline">Read More</span>)}
        </div>
    );
};

const HotelSection = ({ day, onSelectHotel }: { day: any, onSelectHotel: (hotel: any) => void }) => {
    const selectedHotel = day.accommodation; 
    const [showOptions, setShowOptions] = useState(false);

    if (!selectedHotel) return null;

    const alternatives = day.hotelOptions 
        ? day.hotelOptions.filter((h: any) => h.name !== selectedHotel.name) 
        : [];

    return (
        <div className="flex flex-col gap-3 w-full">
            <div className={`border rounded-xl p-3 w-full flex flex-col gap-2 transition-all duration-300 ${selectedHotel.isRecommended ? 'border-emerald-200 bg-[#F0FDF4] shadow-sm' : 'border-blue-100 bg-blue-50'}`}>
                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                        {selectedHotel.image ? (
                            <img src={selectedHotel.image} alt={selectedHotel.name} className="w-16 h-16 rounded-lg object-cover shadow-sm border border-gray-100" />
                        ) : (
                            <div className={`p-3 rounded-lg shadow-sm ${selectedHotel.isRecommended ? 'bg-white text-emerald-600' : 'bg-white text-blue-600'}`}>
                                <BedDouble className="w-6 h-6" />
                            </div>
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex justify-between items-start">
                            <p className={`text-[10px] font-bold uppercase tracking-wide mb-0.5 ${selectedHotel.isRecommended ? 'text-emerald-600' : 'text-blue-600'}`}>
                                {selectedHotel.isRecommended ? 'Recommended Stay' : 'Selected Option'}
                            </p>
                            {selectedHotel.rating && (
                                <span className="flex items-center text-[10px] font-bold bg-white px-1.5 py-0.5 rounded shadow-sm">
                                    <Star className="w-3 h-3 text-yellow-400 fill-current mr-1" /> {selectedHotel.rating}
                                </span>
                            )}
                        </div>
                        <h4 className="font-bold text-gray-900 text-sm truncate">{selectedHotel.name}</h4>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                            {selectedHotel.description && <span className="text-xs text-gray-500 line-clamp-1">{selectedHotel.description}</span>}
                        </div>
                        <div className="flex justify-between items-end mt-2">
                            {selectedHotel.link ? (
                                <a href={selectedHotel.link} target="_blank" rel="noopener noreferrer" className="text-[10px] flex items-center gap-1 text-gray-400 hover:text-emerald-600 transition-colors">
                                    View Deal <ExternalLink className="w-3 h-3" />
                                </a>
                            ) : <div></div>}
                            <div className="text-sm font-bold text-gray-900">${selectedHotel.price || selectedHotel.estimatedCost || 0}<span className="text-xs font-normal text-gray-400">/night</span></div>
                        </div>
                    </div>
                </div>
            </div>

            {alternatives.length > 0 && (
                <div>
                    <button onClick={() => setShowOptions(!showOptions)} className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-gray-800 transition-colors ml-1">
                        {showOptions ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        {showOptions ? "Hide Alternatives" : `View ${alternatives.length} Other Hotels`}
                    </button>
                    {showOptions && (
                        <div className="mt-3 grid gap-2 animate-fade-in-down">
                            {alternatives.map((hotel: any, idx: number) => (
                                <div key={idx} onClick={() => { onSelectHotel(hotel); setShowOptions(false); }} className="flex items-center gap-3 p-2 rounded-lg border border-gray-100 bg-white hover:border-emerald-200 hover:bg-emerald-50 cursor-pointer transition-all group">
                                    <div className="w-10 h-10 flex-shrink-0 rounded bg-gray-100 overflow-hidden">
                                        {hotel.image ? <img src={hotel.image} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-400"><BedDouble className="w-4 h-4" /></div>}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between"><h5 className="text-xs font-bold text-gray-700 truncate group-hover:text-emerald-700">{hotel.name}</h5><span className="text-xs font-bold text-gray-900">${hotel.price}</span></div>
                                        <div className="flex items-center gap-2"><span className="text-[10px] text-gray-400 flex items-center"><Star className="w-2.5 h-2.5 text-yellow-400 fill-current mr-0.5" /> {hotel.rating}</span></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const SuggestionCard = ({ suggestion, onAdd }: { suggestion: any, onAdd: () => void }) => {
    // 🔥 Check if this is a "Restored" item (was previously removed)
    const isRestored = suggestion.isRestored;

    return (
        <div className={`flex items-center justify-between p-2 rounded-lg mb-2 transition-colors border ${isRestored ? 'bg-gray-50 border-gray-200 hover:bg-gray-100' : 'bg-amber-50 border-amber-100 hover:bg-amber-100'}`}>
            <div className="flex items-center gap-2">
                {isRestored ? (
                    <RotateCcw className="w-4 h-4 text-gray-400" />
                ) : (
                    <Lightbulb className="w-4 h-4 text-amber-500" />
                )}
                <div>
                    <h5 className={`text-xs font-bold ${isRestored ? 'text-gray-600' : 'text-gray-800'}`}>{suggestion.name}</h5>
                    <span className="text-[10px] text-gray-500">{suggestion.category || 'General'} • ${suggestion.estimatedCost || 0} • {suggestion.duration || '1h'}</span>
                </div>
            </div>
            <button 
                onClick={onAdd}
                className={`text-[10px] font-bold px-2 py-1 rounded-md transition-all shadow-sm flex items-center gap-1 ${
                    isRestored 
                    ? 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-200' 
                    : 'bg-white border border-amber-200 text-amber-700 hover:bg-amber-500 hover:text-white'
                }`}
            >
                <Plus className="w-3 h-3" /> {isRestored ? 'Restore' : 'Add'}
            </button>
        </div>
    );
};

// 🔥 Swap Confirmation Modal
const SwapModal = ({ isOpen, onClose, newActivity, currentActivities, onSwap }: any) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-scale-in">
                <div className="flex items-center gap-3 text-amber-600 mb-4">
                    <AlertTriangle className="w-6 h-6" />
                    <h3 className="text-lg font-bold">Day Schedule Full!</h3>
                </div>
                
                <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                    Adding <strong>{newActivity.name}</strong> ({newActivity.duration || '1h'}) will exceed the daily time limit. 
                    Please select an activity to <strong>replace</strong>:
                </p>

                <div className="space-y-2 max-h-60 overflow-y-auto mb-4 pr-1">
                    {currentActivities.map((act: any, idx: number) => {
                         const actName = typeof act === 'string' ? act : act.name;
                         const actDuration = typeof act === 'object' && act.duration ? act.duration : '1 hour';
                         
                         return (
                            <button
                                key={idx}
                                onClick={() => onSwap(idx)}
                                className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-red-400 hover:bg-red-50 transition-all flex justify-between items-center group"
                            >
                                <div>
                                    <div className="font-semibold text-gray-800 text-sm">{actName}</div>
                                    <div className="text-xs text-gray-500 flex items-center gap-1"><Clock className="w-3 h-3"/> {actDuration}</div>
                                </div>
                                <ArrowRightLeft className="w-4 h-4 text-gray-400 group-hover:text-red-500" />
                            </button>
                        );
                    })}
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                    <button onClick={onClose} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors">Cancel</button>
                </div>
            </div>
        </div>
    );
};

// --- MAIN COMPONENT ---
const ItineraryDayList: React.FC<ItineraryDayListProps> = ({
    itinerary, input, history, currentIndex, switchVersion,
    regeneratingDayIndex, setRegenerateModal, isLoaded,
    focusedDayIndex, setFocusedDayIndex, onActivitySelect,
    activityOverrides, setActivityOverrides
}) => {

    const basePlan = (history && history.length > 0 && history[currentIndex]) ? history[currentIndex] : itinerary;
    
    // Override States
    const [hotelOverrides, setHotelOverrides] = useState<Record<number, any>>({});
    const [extraSuggestions, setExtraSuggestions] = useState<Record<number, any[]>>({});
    const [swapModalData, setSwapModalData] = useState<{ dayIndex: number, newSuggestion: any } | null>(null);

    useEffect(() => {
        setHotelOverrides({});
        setActivityOverrides({});
        setExtraSuggestions({}); // Reset extra suggestions on version switch
    }, [currentIndex, history]);

    // Helpers
    const getDayTotalMinutes = (activities: any[]) => {
        return activities.reduce((total, act) => {
            const duration = typeof act === 'object' && act.duration ? act.duration : '1 hour';
            return total + parseDurationToMinutes(duration);
        }, 0);
    };

    // Helper to Standardize Activity Object
    const normalizeActivity = (act: any) => {
        if (typeof act === 'string') {
            return {
                name: act,
                category: 'Sightseeing',
                duration: '1 hour',
                estimatedCost: 0,
                isRestored: true // Mark as restored so we can style it differently
            };
        }
        return { ...act, isRestored: true };
    };

    // 🔥 SMART ADD SUGGESTION (Checks Time)
    const handleTryAddSuggestion = (dayIndex: number, suggestion: any) => {
        const currentActivities = activityOverrides[dayIndex] || basePlan.days[dayIndex].activities;
        const currentTotal = getDayTotalMinutes(currentActivities);
        const newDuration = parseDurationToMinutes(suggestion.duration);
        const MAX_DAY_MINUTES = 660; // 11 Hours

        if (currentTotal + newDuration > MAX_DAY_MINUTES) {
            setSwapModalData({ dayIndex, newSuggestion: suggestion });
        } else {
            directAddSuggestion(dayIndex, suggestion);
        }
    };

    const directAddSuggestion = (dayIndex: number, suggestion: any) => {
        setActivityOverrides(prev => {
            const current = prev[dayIndex] || basePlan.days[dayIndex].activities;
            const newAct = {
                name: suggestion.name,
                category: suggestion.category,
                description: suggestion.description,
                estimatedCost: suggestion.estimatedCost || 0,
                duration: suggestion.duration || '1 hour'
            };
            return { ...prev, [dayIndex]: [...current, newAct] };
        });

        // 🔥 Remove from extraSuggestions if it was there
        setExtraSuggestions(prev => {
            if (!prev[dayIndex]) return prev;
            return {
                ...prev,
                [dayIndex]: prev[dayIndex].filter(a => a.name !== suggestion.name)
            };
        });
    };

    // 🔥 SWAP FUNCTION (Updated to save removed item)
    const handleSwapActivity = (activityIndexToRemove: number) => {
        if (!swapModalData) return;
        const { dayIndex, newSuggestion } = swapModalData;
        
        setActivityOverrides(prev => {
            const current = [...(prev[dayIndex] || basePlan.days[dayIndex].activities)];
            
            // 1. Get the activity we are about to remove
            const removedActivity = current[activityIndexToRemove];

            // 2. Add the NEW activity
            const newAct = {
                name: newSuggestion.name,
                category: newSuggestion.category,
                description: newSuggestion.description,
                estimatedCost: newSuggestion.estimatedCost || 0,
                duration: newSuggestion.duration || '1 hour'
            };
            current.splice(activityIndexToRemove, 1, newAct); // Replace

            // 3. 🔥 Save the REMOVED activity to suggestions
            setExtraSuggestions(prevExtra => {
                const normalizedRemoved = normalizeActivity(removedActivity);
                const currentExtras = prevExtra[dayIndex] || [];
                // Avoid duplicates in suggestions
                if (!currentExtras.some(e => e.name === normalizedRemoved.name)) {
                    return { ...prevExtra, [dayIndex]: [...currentExtras, normalizedRemoved] };
                }
                return prevExtra;
            });

            // 4. Also remove the NEW activity from suggestions if it was there (swap logic)
            setExtraSuggestions(prevExtra => {
                if (!prevExtra[dayIndex]) return prevExtra;
                return {
                    ...prevExtra,
                    [dayIndex]: prevExtra[dayIndex].filter(a => a.name !== newSuggestion.name)
                };
            });

            return { ...prev, [dayIndex]: current };
        });
        setSwapModalData(null);
    };

    // 🔥 REMOVE FUNCTION (Updated to save removed item)
    const handleRemoveActivity = (dayIndex: number, activityName: string) => {
        setActivityOverrides(prev => {
            const currentActivities = prev[dayIndex] || basePlan.days[dayIndex].activities;
            
            // 1. Find the object before removing
            const activityToRemove = currentActivities.find((a: any) => (typeof a === 'string' ? a : a.name) === activityName);

            // 2. 🔥 Add to Extra Suggestions
            if (activityToRemove) {
                setExtraSuggestions(prevExtra => {
                    const normalizedRemoved = normalizeActivity(activityToRemove);
                    const currentExtras = prevExtra[dayIndex] || [];
                    if (!currentExtras.some(e => e.name === normalizedRemoved.name)) {
                        return { ...prevExtra, [dayIndex]: [...currentExtras, normalizedRemoved] };
                    }
                    return prevExtra;
                });
            }

            // 3. Remove from Active List
            return { 
                ...prev, 
                [dayIndex]: currentActivities.filter((a: any) => (typeof a === 'string' ? a : a.name) !== activityName) 
            };
        });
    };

    // Calculation Logic
    const displayedPlan = useMemo(() => {
        if (!basePlan || !basePlan.days) return null;
        const newPlan = JSON.parse(JSON.stringify(basePlan));
        
        newPlan.days.forEach((day: any, index: number) => {
            if (hotelOverrides[index]) {
                const newHotel = hotelOverrides[index];
                const oldHotelPrice = day.estimatedCost?.accommodation || 0;
                const newHotelPrice = newHotel.price || 0;
                day.accommodation = newHotel; 
                if (day.estimatedCost) {
                    day.estimatedCost.accommodation = newHotelPrice;
                    day.estimatedCost.total = (day.estimatedCost.total - oldHotelPrice) + newHotelPrice;
                }
            }
            if (activityOverrides[index]) {
                day.activities = activityOverrides[index];
            }
        });

        const newGrandTotal = newPlan.days.reduce((sum: number, d: any) => sum + (d.estimatedCost?.total || 0), 0);
        newPlan.estimatedTotalBudget = `$${newGrandTotal.toLocaleString()}`;
        return newPlan;
    }, [basePlan, hotelOverrides, activityOverrides]);

    const currentTotalCost = displayedPlan.days.reduce((sum: number, day: any) => sum + (day.estimatedCost?.total || 0), 0);
    const isOverBudget = currentTotalCost > input.budget;

    // 🔥 අලුතින් එකතු කරන ලද කොටස: User විසින් වෙනස් කරන ලද දත්ත PDF එකට යැවීමට සැකසීම
    const handleDownloadPDF = () => {
        // Original plan එකේ Copy එකක් සාදා ගැනීම (State එක වෙනස් නොවන පරිදි)
        const customizedPlan = JSON.parse(JSON.stringify(displayedPlan));

        customizedPlan.days = customizedPlan.days.map((day: any, index: number) => {
            const newDay = { ...day };
            
            // 1. User අලුතින් Add/Remove කරපු Activities තියෙනවද බලලා ඒවා replace කිරීම
            if (activityOverrides && activityOverrides[index]) {
                 newDay.activities = activityOverrides[index];
            }
            
            // 2. User වෙනස් කරපු Hotels තියෙනවද බලලා ඒවා replace කිරීම 
            // (ඔබේ component එකේ hotelOverrides state එකක් ඇතැයි උපකල්පනය කරමි)
            if (typeof hotelOverrides !== 'undefined' && hotelOverrides[index]) {
                 newDay.accommodation = hotelOverrides[index];
            }

            return newDay;
        });

        // අලුත් කරපු Plan එක PDF generator එකට යැවීම
        generatePDF(customizedPlan, input);
    };

    if (!displayedPlan || !displayedPlan.days) return null;

    return (
        <div className="space-y-6">

            {(itinerary?.isBudgetSufficient === false || isOverBudget) && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl shadow-sm animate-fade-in-up mb-6">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <h3 className="font-bold text-red-800 text-lg">
                                Attention: Budget Exceeded
                            </h3>
                            <p className="text-red-700 mt-1 leading-relaxed text-sm">
                                {itinerary?.budgetWarningMessage && itinerary?.isBudgetSufficient === false
                                    ? itinerary.budgetWarningMessage
                                    : `The budget you provided ($${input.budget}) is not sufficient for this trip. The currently calculated total cost is $${currentTotalCost}. This is the plan created with the lowest possible budget.`}
                            </p>
                        </div>
                    </div>
                </div>
            )}
            
            {/* History Tabs */}
            {history.length > 1 && (
                <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-gray-200 w-full sm:w-fit overflow-x-auto scrollbar-hide">
                    <span className="text-xs font-bold text-gray-400 uppercase px-2 whitespace-nowrap">Ver</span>
                    {history.map((_, idx) => (
                        <button key={idx} onClick={() => switchVersion(idx)} className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${currentIndex === idx ? 'bg-[#024231] text-white shadow-md scale-105' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}>{idx + 1}</button>
                    ))}
                </div>
            )}

            {/* Cards List */}
            <div className="space-y-4 sm:space-y-6">
                {displayedPlan.days.map((day: any, index: number) => {
                    const isLastDay = index === displayedPlan.days.length - 1;
                    const isFocused = focusedDayIndex === index;

                    // 🔥 COMBINE SUGGESTIONS (API Suggestions + Removed Activities)
                    const combinedSuggestions = [
                        ...(day.suggestions || []),
                        ...(extraSuggestions[index] || [])
                    ];
                    // Remove duplicates (based on name)
                    const uniqueSuggestions = Array.from(new Map(combinedSuggestions.map(item => [item.name, item])).values());

                    return (
                    <div 
                        key={index} 
                        onClick={() => setFocusedDayIndex(index)}
                        className={`bg-white rounded-xl sm:rounded-[1.5rem] p-3 sm:p-6 shadow-sm border transition-all duration-300 cursor-pointer relative group ${
                            isFocused ? 'border-emerald-500 ring-1 ring-emerald-500 shadow-md' : 'border-gray-100 hover:border-emerald-200'
                        }`}
                    >
                        <div className="flex flex-row items-start gap-3 sm:gap-6">
                            {/* Date Badge */}
                            <div className="flex-shrink-0 w-[65px] sm:w-24 md:w-28">
                                <div className={`rounded-xl sm:rounded-2xl py-3 px-1 sm:p-4 flex flex-col items-center justify-center text-center h-full max-h-[100px] sm:max-h-[120px] transition-colors ${isFocused ? 'bg-emerald-600 text-white' : 'bg-[#E0F2F1] text-[#00695C]'}`}>
                                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-0.5 sm:mb-1">Day {day.day}</span>
                                    <span className="text-sm sm:text-lg font-black leading-tight break-all">
                                        {input.startDate ? new Date(new Date(input.startDate).setDate(new Date(input.startDate).getDate() + index)).toISOString().slice(5, 10) : `Day ${index + 1}`}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="flex-1 min-w-0 flex flex-col justify-center"> 
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="text-lg sm:text-2xl font-black text-gray-900 leading-tight flex items-center gap-2">
                                        {day.location}
                                        {isFocused && <MapPin className="w-4 h-4 text-emerald-500 animate-bounce" />}
                                    </h3>
                                    {currentIndex === history.length - 1 && (
                                        <button onClick={(e) => { e.stopPropagation(); setRegenerateModal({ isOpen: true, dayIndex: index }); }} disabled={regeneratingDayIndex === index} className="text-gray-400 hover:text-[#00695C] transition-colors p-1 ml-2 flex-shrink-0">
                                            <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 ${regeneratingDayIndex === index ? 'animate-spin' : ''}`} />
                                        </button>
                                    )}
                                </div>
                                
                                <ExpandableDescription text={day.description} />
                                
                                {/* 🔥 ACTIVITIES SECTION */}
                                <div className="mb-4 w-full">
                                    <p className="text-xs font-bold text-gray-400 uppercase mb-2">Activities (Click to view details)</p>
                                    <div className="flex flex-wrap gap-2">
                                        {day.activities.map((act: any, i: number) => {
                                            const actName = typeof act === 'string' ? act : act.name;
                                            return (
                                                <div 
                                                    key={i} 
                                                    onClick={(e) => {
                                                        e.stopPropagation(); 
                                                        if (onActivitySelect) {
                                                            onActivitySelect({
                                                                name: actName,
                                                                category: typeof act !== 'string' && act.category ? act.category : (actName.includes('Temple') ? 'Culture' : 'Sightseeing'),
                                                                dayLocation: day.location,
                                                                dayNumber: day.day,
                                                                description: typeof act !== 'string' ? act.description : `Visit to ${actName}`
                                                            });
                                                        }
                                                    }}
                                                    className="group/tag relative px-2.5 py-1 sm:px-3 sm:py-1.5 bg-gray-100 text-gray-600 rounded-full text-[10px] sm:text-xs font-bold flex items-center gap-1 hover:bg-emerald-100 hover:text-emerald-700 transition-colors cursor-pointer border border-transparent hover:border-emerald-200"
                                                >
                                                    {actName.includes('Temple') ? <Tag className="w-3 h-3" /> : <Ticket className="w-3 h-3" />} 
                                                    {actName}
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleRemoveActivity(index, actName);
                                                        }}
                                                        className="ml-1 opacity-0 group-hover/tag:opacity-100 hover:bg-red-200 text-gray-400 hover:text-red-500 rounded-full p-0.5 transition-all"
                                                        title="Remove Activity"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* 🔥 SUGGESTIONS SECTION (Includes Removed Activities) */}
                                {uniqueSuggestions.length > 0 && (
                                <div className="mb-4 animate-fade-in">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                                            Available Stops & Suggestions
                                        </span>
                                    </div>
                                    <div className="grid gap-1">
                                        {uniqueSuggestions.map((sug: any, sIdx: number) => {
                                            // Ensure we don't show suggestion if it's already in the active list
                                            const isAdded = day.activities.some((act: any) => (typeof act === 'string' ? act : act.name) === sug.name);
                                            if (isAdded) return null;

                                            return (
                                                <SuggestionCard 
                                                    key={sIdx} 
                                                    suggestion={sug} 
                                                    onAdd={(e: any) => {
                                                        if (e) e.stopPropagation();
                                                        handleTryAddSuggestion(index, sug);
                                                    }} 
                                                />
                                            );
                                        })}
                                    </div>
                                </div>
                                )}

                                {/* COSTS */}
                                <div className="bg-gray-50 rounded-xl p-3 sm:p-4 mb-4 border border-gray-100 w-full">
                                    <div className="grid grid-cols-2 sm:flex sm:flex-wrap justify-between items-center gap-y-3 gap-x-2">
                                        <div className="flex flex-col"><span className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1"><Car className="w-3 h-3" /> Transport</span><span className="font-bold text-gray-900 text-sm">${(day.estimatedCost?.transportFuel || 0).toLocaleString()}</span></div>
                                        <div className="w-px h-8 bg-gray-200 hidden sm:block"></div>
                                        <div className="flex flex-col"><span className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1"><BedDouble className="w-3 h-3" /> Hotel</span><span className="font-bold text-gray-900 text-sm">${(day.estimatedCost?.accommodation || 0).toLocaleString()}</span></div>
                                        <div className="w-px h-8 bg-gray-200 hidden sm:block"></div>
                                        <div className="flex flex-col"><span className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1"><Ticket className="w-3 h-3" /> Tickets</span><span className="font-bold text-gray-900 text-sm">${(day.estimatedCost?.tickets || 0).toLocaleString()}</span></div>
                                        <div className="col-span-2 sm:col-span-1 flex items-center justify-end gap-1 text-[#00695C] pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-200 mt-1 sm:mt-0"><DollarSign className="w-3.5 h-3.5" /><span className="font-black text-base sm:text-lg">{((day.estimatedCost?.total || 0)).toLocaleString()}</span></div>
                                    </div>
                                </div>
                                {!isLastDay && (<HotelSection day={day} onSelectHotel={(newHotel) => setHotelOverrides(prev => ({ ...prev, [index]: newHotel }))} />)}
                            </div>
                        </div>
                    </div>
                    );
                })}
            </div>

            <div className="mb-12 animate-fade-in-up delay-200">
                <CostSummary itinerary={displayedPlan} travelerCount={input.adults + input.children} />
            </div>

            <div className="mt-12 text-center pb-8">
                <button onClick={handleDownloadPDF} className="w-full sm:w-auto px-10 py-5 bg-emerald-600 text-white font-black rounded-full text-lg shadow-2xl hover:bg-emerald-700 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3 mx-auto">
                    Download This Trip as a PDF <ArrowDown className="w-8 h-8 animate-bounce" />
                </button>
            </div>

            {/* 🔥 RENDER SWAP MODAL */}
            {swapModalData && (
                <SwapModal 
                    isOpen={true}
                    onClose={() => setSwapModalData(null)}
                    newActivity={swapModalData.newSuggestion}
                    currentActivities={activityOverrides[swapModalData.dayIndex] || basePlan.days[swapModalData.dayIndex].activities}
                    onSwap={handleSwapActivity}
                />
            )}
        </div>
    );
};

export default ItineraryDayList;