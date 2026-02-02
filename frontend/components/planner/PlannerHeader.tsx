import React from 'react';
import { PlusCircle, History, Save, Check, Loader2, Download } from 'lucide-react';
import { generatePDF } from '../../utils/pdfGenerator';

interface PlannerHeaderProps {
    user: any;
    startNewPlan: () => void;
    setIsSidebarOpen: (isOpen: boolean) => void;
    onSave: () => void;
    saveStatus: string;
    itinerary: any;
    input: any;
}

const PlannerHeader: React.FC<PlannerHeaderProps> = ({ 
    user, startNewPlan, setIsSidebarOpen, onSave, saveStatus, itinerary, input 
}) => {

    // LOGIC FIX: A plan is considered "Saved" if the save action completed 
    const isSaved = saveStatus === 'saved' || (itinerary && itinerary._id);

    return (
        <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 md:py-4">
                <div className="flex flex-col md:flex-row justify-between items-center gap-3 md:gap-4">
                    
                    {/* NEW PLAN BUTTON */}
                    {/* Mobile: Full Width, Desktop: Auto Width */}
                    <button
                        onClick={startNewPlan}
                        className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-emerald-600 border border-gray-200 rounded-xl hover:bg-emerald-700 transition-all shadow-sm order-1 md:order-none"
                    >
                        <PlusCircle className="w-4 h-4" />
                        <span className="whitespace-nowrap">Generate New Plan</span>
                    </button>

                    {/* Action Buttons Group */}
                    {/* Mobile: 3-Column Grid, Desktop: Flex Row */}
                    <div className="grid grid-cols-3 gap-2 w-full md:flex md:w-auto md:items-center md:gap-3 order-2 md:order-none">
                        
                        {/* SAVE BUTTON */}
                        {user && (
                            <button
                                onClick={onSave}
                                disabled={saveStatus === 'saving' || isSaved}
                                className={`flex items-center justify-center gap-2 px-3 md:px-4 py-2.5 text-xs md:text-sm font-bold rounded-xl transition-all shadow-sm w-full md:w-auto
                                    ${isSaved 
                                        ? 'bg-green-100 text-green-700 border border-green-200' 
                                        : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                {saveStatus === 'saving' ? (
                                    <><Loader2 className="w-3 h-3 md:w-4 md:h-4 animate-spin" /> <span className="truncate">Saving...</span></>
                                ) : isSaved ? (
                                    <><Check className="w-3 h-3 md:w-4 md:h-4" /> <span className="truncate">Saved</span></>
                                ) : (
                                    <><Save className="w-3 h-3 md:w-4 md:h-4 text-emerald-600" /> <span className="truncate">Save</span></>
                                )}
                            </button>
                        )}

                        {/* PDF DOWNLOAD BUTTON */}
                        <button
                            onClick={() => generatePDF(itinerary, input)}
                            className="flex items-center justify-center gap-2 px-3 md:px-5 py-2.5 bg-white border border-gray-200 text-gray-700 text-xs md:text-sm font-bold rounded-xl hover:bg-gray-50 transition-colors w-full md:w-auto"
                        >
                            <Download className="w-3 h-3 md:w-4 md:h-4" /> 
                            <span>PDF</span>
                        </button>

                        {/* MY PLANS BUTTON */}
                        {user && (
                            <button
                                onClick={() => setIsSidebarOpen(true)}
                                className="flex items-center justify-center gap-2 px-3 md:px-4 py-2.5 text-xs md:text-sm font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 w-full md:w-auto"
                            >
                                <History className="w-3 h-3 md:w-4 md:h-4" />
                                <span className="truncate">My Plans</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlannerHeader;