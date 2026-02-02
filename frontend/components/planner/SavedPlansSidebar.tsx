import React, { useState } from 'react';
import { History, X, Calendar, ChevronRight, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';

interface SavedPlansSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    savedPlans: any[];
    loadSavedPlan: (plan: any) => void;
    // Ensure onDelete returns a Promise so we can wait for it
    onDelete: (id: string) => Promise<boolean> | void; 
}

const SavedPlansSidebar: React.FC<SavedPlansSidebarProps> = ({ 
    isOpen, onClose, savedPlans, loadSavedPlan, onDelete 
}) => {
    
    // --- STATE ---
    const [planToDelete, setPlanToDelete] = useState<{ id: string, name: string } | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // 1. Open confirmation modal
    const handleDeleteClick = (e: React.MouseEvent, plan: any) => {
        e.stopPropagation(); 
        setPlanToDelete({ id: plan._id, name: plan.name || "Untitled Trip" });
    };

    // 2. Perform delete and show notification
    const confirmDelete = async () => {
        if (!planToDelete) return;

        setIsDeleting(true);
        
        // Call the delete function passed from parent
        // We await it to know when it's done
        const result = await onDelete(planToDelete.id);

        setIsDeleting(false);
        setPlanToDelete(null); // Close Modal

        // Check if delete was successful (assuming onDelete returns true or void)
        if (result !== false) {
            // Show Success Message
            setSuccessMessage("Plan deleted successfully");
            
            // Hide Message after 3 seconds
            setTimeout(() => {
                setSuccessMessage(null);
            }, 3000);
        }
    };

    return (
        <>
            {/* ========================================================= */}
            {/* DELETE CONFIRMATION MODAL (Overlay)                       */}
            {/* ========================================================= */}
            {planToDelete && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div 
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
                        onClick={() => !isDeleting && setPlanToDelete(null)}
                    />

                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 transform transition-all scale-100 animate-in fade-in zoom-in-95 duration-200">
                        {!isDeleting && (
                            <button 
                                onClick={() => setPlanToDelete(null)}
                                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}

                        <div className="flex flex-col items-center text-center">
                            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4">
                                <AlertTriangle className="w-6 h-6 text-red-500" />
                            </div>

                            <h3 className="text-lg font-black text-gray-900 mb-2">Delete this plan?</h3>
                            
                            <p className="text-gray-500 text-sm mb-6">
                                Are you sure you want to delete <span className="font-bold text-gray-800">"{planToDelete.name}"</span>? 
                                This action cannot be undone.
                            </p>

                            <div className="flex gap-3 w-full">
                                <button
                                    onClick={() => setPlanToDelete(null)}
                                    disabled={isDeleting}
                                    className="flex-1 py-2.5 px-4 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    disabled={isDeleting}
                                    className="flex-1 py-2.5 px-4 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 shadow-lg shadow-red-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                                >
                                    {isDeleting ? 'Deleting...' : <><Trash2 className="w-4 h-4" /> Delete</>}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* SIDEBAR UI                                                */}
            {/* ========================================================= */}
            
            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm transition-opacity duration-300"
                    onClick={onClose}
                />
            )}
            
            {/* Sidebar Panel */}
            <div className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-white shadow-2xl z-[110] transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                
                {/* Header */}
                <div className="p-4 md:p-6 border-b border-gray-100 flex justify-between items-center bg-white relative shrink-0">
                    <h3 className="font-black text-xl text-gray-900 flex items-center gap-2">
                        <History className="w-5 h-5 text-emerald-600" /> Saved Trips
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* --- SUCCESS NOTIFICATION --- */}
                {successMessage && (
                    <div className="mx-4 mt-4 p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2 fade-in duration-300 shrink-0">
                        <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                        <p className="text-sm font-bold text-emerald-800">{successMessage}</p>
                    </div>
                )}

                {/* List of Plans */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {!savedPlans || savedPlans.length === 0 ? (
                        <div className="text-center py-20 text-gray-400">
                            <History className="w-16 h-16 mx-auto mb-4 opacity-20" />
                            <p className="font-medium">No saved plans yet.</p>
                            <p className="text-sm opacity-60">Create a plan and save it to see it here.</p>
                        </div>
                    ) : (
                        savedPlans.map((plan) => (
                            <div
                                key={plan._id || plan.shareId}
                                onClick={() => loadSavedPlan({ ...plan.itineraryData, _id: plan._id })}
                                className="group relative bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-emerald-200 cursor-pointer transition-all"
                            >
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 rounded-l-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                
                                <div className="flex justify-between items-start gap-3">
                                    <h4 className="font-bold text-gray-800 group-hover:text-emerald-700 mb-2 truncate flex-1">
                                        {plan.name || "Untitled Trip"}
                                    </h4>

                                    {/* DELETE BUTTON */}
                                    <button
                                        onClick={(e) => handleDeleteClick(e, plan)}
                                        className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                                        title="Delete Plan"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                                
                                <div className="flex items-center justify-between mt-2 pt-3 border-t border-gray-50">
                                    <span className="flex items-center gap-1.5 text-xs font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
                                        <Calendar className="w-3 h-3" />
                                        {plan.createdAt 
                                            ? new Date(plan.createdAt).toLocaleDateString() 
                                            : 'Unknown Date'}
                                    </span>
                                    
                                    <span className="w-8 h-8 flex items-center justify-center rounded-full bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                        <ChevronRight className="w-4 h-4" />
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </>
    );
};

export default SavedPlansSidebar;