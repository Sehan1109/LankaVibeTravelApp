import React, { useState } from 'react';
import { RefreshCw, Tag, Ticket, Car, BedDouble, DollarSign, ArrowDown } from 'lucide-react';
import ItineraryMap from '../ItineraryMap'; 
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
}

// Small helper component for the Expandable Description
const ExpandableDescription = ({ text }: { text: string }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div 
            onClick={() => setIsExpanded(!isExpanded)}
            className="group cursor-pointer transition-all duration-200"
        >
            <p className={`text-gray-500 text-sm leading-relaxed mb-4 ${isExpanded ? '' : 'line-clamp-3'}`}>
                {text}
            </p>
            {/* Optional: Show a tiny hint if truncated, removing if expanded */}
            {!isExpanded && text.length > 150 && (
                <span className="text-[10px] font-bold text-emerald-600 uppercase mt-[-10px] block mb-4 group-hover:underline">
                    Read More
                </span>
            )}
        </div>
    );
};

const ItineraryDayList: React.FC<ItineraryDayListProps> = ({
    itinerary, input, history, currentIndex, switchVersion,
    regeneratingDayIndex, setRegenerateModal, isLoaded,
}) => {

    const activePlan = (history && history.length > 0 && history[currentIndex]) 
        ? history[currentIndex] 
        : itinerary;

    if (!activePlan || !activePlan.days) return null;

    return (
        <div className="space-y-6 sm:space-y-8">
            {/* MAP SECTION */}
            <div className="rounded-xl sm:rounded-[2rem] overflow-hidden border border-gray-200 shadow-sm h-64 sm:h-80 md:h-96">
                <ItineraryMap
                    locations={activePlan.days.map((d: any) => d.location)}
                    days={activePlan.days}
                    isLoaded={isLoaded}
                    startPoint={input.startPoint} 
                />
            </div>

            {/* HISTORY VERSIONS */}
            {history.length > 1 && (
                <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-gray-200 w-full sm:w-fit overflow-x-auto scrollbar-hide">
                    <span className="text-xs font-bold text-gray-400 uppercase px-2 whitespace-nowrap">Ver</span>
                    {history.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => switchVersion(idx)}
                            className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                                currentIndex === idx
                                ? 'bg-[#024231] text-white shadow-md scale-105'
                                : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                            }`}
                        >
                            {idx + 1}
                        </button>
                    ))}
                </div>
            )}

            {/* DAY CARDS */}
            <div className="space-y-4 sm:space-y-6">
                {activePlan.days.map((day: any, index: number) => (
                    // Reduced padding on mobile (p-3) to give more internal space
                    <div key={index} className="bg-white rounded-xl sm:rounded-[1.5rem] p-3 sm:p-6 shadow-[0_2px_20px_rgba(0,0,0,0.06)] border border-gray-100 relative group">
                        
                        {/* Flex Container: Align Badge and Content Side-by-Side */}
                        <div className="flex flex-row items-start gap-3 sm:gap-6">
                            
                            {/* LEFT SIDE: Date Badge */}
                            {/* Fixed width ensures alignment. w-[65px] is compact for mobile */}
                            <div className="flex-shrink-0 w-[65px] sm:w-24 md:w-28">
                                <div className="bg-[#E0F2F1] text-[#00695C] rounded-xl sm:rounded-2xl py-3 px-1 sm:p-4 flex flex-col items-center justify-center text-center h-full max-h-[100px] sm:max-h-[120px]">
                                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-0.5 sm:mb-1">Day {day.day}</span>
                                    <span className="text-sm sm:text-lg font-black leading-tight break-all">
                                        {input.startDate
                                            ? new Date(new Date(input.startDate).setDate(new Date(input.startDate).getDate() + index)).toISOString().slice(5, 10)
                                            : `Day ${index + 1}`}
                                    </span>
                                </div>
                            </div>

                            {/* RIGHT SIDE: Main Content */}
                            {/* flex-1 ensures this takes ALL remaining width */}
                            <div className="flex-1 min-w-0 flex flex-col justify-center"> 
                                
                                {/* Header Section */}
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="text-lg sm:text-2xl font-black text-gray-900 leading-tight">
                                        {day.location}
                                    </h3>
                                    
                                    {currentIndex === history.length - 1 && (
                                        <button
                                            onClick={() => setRegenerateModal({ isOpen: true, dayIndex: index })}
                                            disabled={regeneratingDayIndex === index}
                                            className="text-gray-400 hover:text-[#00695C] transition-colors p-1 ml-2 flex-shrink-0"
                                        >
                                            <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 ${regeneratingDayIndex === index ? 'animate-spin' : ''}`} />
                                        </button>
                                    )}
                                </div>

                                {/* Description with Click-to-Expand logic */}
                                <ExpandableDescription text={day.description} />

                                {/* Tags - Perfectly balanced width */}
                                <div className="flex flex-wrap gap-2 mb-4 w-full">
                                    {day.activities.map((act: any, i: number) => (
                                        <span key={i} className="px-2.5 py-1 sm:px-3 sm:py-1.5 bg-gray-100 text-gray-600 rounded-full text-[10px] sm:text-xs font-bold flex items-center gap-1">
                                            {(typeof act === 'string' ? act : act.name).includes('Temple') ? <Tag className="w-3 h-3" /> : <Ticket className="w-3 h-3" />}
                                            {typeof act === 'string' ? act : act.name}
                                        </span>
                                    ))}
                                </div>

                                {/* COSTS GRID - Balanced Layout */}
                                <div className="bg-gray-50 rounded-xl p-3 sm:p-4 mb-4 border border-gray-100 w-full">
                                    {/* Mobile: Grid with 2 columns to balance left/right. Desktop: Flex row */}
                                    <div className="grid grid-cols-2 sm:flex sm:flex-wrap justify-between items-center gap-y-3 gap-x-2">
                                        
                                        {/* Transport */}
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1">
                                                <Car className="w-3 h-3" /> Transport
                                            </span>
                                            <span className="font-bold text-gray-900 text-sm">
                                                ${(day.estimatedCost?.transportFuel || 0).toLocaleString()}
                                            </span>
                                        </div>
                                        
                                        {/* Desktop Divider */}
                                        <div className="w-px h-8 bg-gray-200 hidden sm:block"></div>
                                        
                                        {/* Hotel */}
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1">
                                                <BedDouble className="w-3 h-3" /> Hotel
                                            </span>
                                            <span className="font-bold text-gray-900 text-sm">
                                                ${(day.estimatedCost?.accommodation || 0).toLocaleString()}
                                            </span>
                                        </div>

                                        {/* Desktop Divider */}
                                        <div className="w-px h-8 bg-gray-200 hidden sm:block"></div>
                                        
                                        {/* Tickets */}
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1">
                                                <Ticket className="w-3 h-3" /> Tickets
                                            </span>
                                            <span className="font-bold text-gray-900 text-sm">
                                                ${(day.estimatedCost?.tickets || 0).toLocaleString()}
                                            </span>
                                        </div>

                                        {/* Total - Full width on very small screens if needed, otherwise aligns right */}
                                        <div className="col-span-2 sm:col-span-1 flex items-center justify-end gap-1 text-[#00695C] pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-200 mt-1 sm:mt-0">
                                            <DollarSign className="w-3.5 h-3.5" />
                                            <span className="font-black text-base sm:text-lg">
                                                {((day.estimatedCost?.transportFuel || 0) +
                                                    (day.estimatedCost?.accommodation || 0) +
                                                    (day.estimatedCost?.tickets || 0)).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* ACCOMMODATION - Full Width Balance */}
                                {day.accommodation && (
                                    <div className="border border-emerald-100 bg-[#F0FDF4] rounded-xl p-3 w-full flex flex-col gap-2">
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-white rounded-lg text-emerald-600 shadow-sm flex-shrink-0">
                                                <BedDouble className="w-5 h-5" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide mb-0.5">Recommended Stay</p>
                                                <h4 className="font-bold text-gray-900 text-sm truncate">{day.accommodation.name}</h4>
                                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                                    <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded border border-emerald-100">{day.accommodation.type}</span>
                                                    <span className="text-xs font-bold text-emerald-600">★ {day.accommodation.rating}</span>
                                                </div>
                                            </div>
                                        </div>
                                        {/* Price Right Aligned at Bottom */}
                                        <div className="flex justify-end mt-1">
                                             <div className="text-sm font-bold text-emerald-700">
                                                 ${(day.estimatedCost?.accommodation || 0).toLocaleString()}<span className="text-xs font-normal text-gray-400">/night</span>
                                             </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mb-12 animate-fade-in-up delay-200">
                <CostSummary itinerary={activePlan} travelerCount={input.adults + input.children} />
            </div>

            <div className="mt-12 text-center pb-8">
                <button
                    onClick={() => generatePDF(activePlan, input)}
                    className="w-full sm:w-auto px-10 py-5 bg-emerald-600 text-white font-black rounded-full text-lg shadow-2xl hover:bg-emerald-700 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3 mx-auto"
                >
                    Download This Trip as a PDF <ArrowDown className="w-8 h-8 animate-bounce" />
                </button>
            </div>
        </div>
    );
};

export default ItineraryDayList;