import React, { useState, useEffect } from 'react';

// සරල අගයන් පෙන්වන helper function එක
const displayValue = (value: any) => {
    if (value === null || value === undefined || value === '') return '-';
    if (Array.isArray(value)) {
        return value.length > 0 ? value.join(', ') : '-';
    }
    if (typeof value === 'boolean') {
        return value ? 'Yes' : 'No';
    }
    return value;
};

const DraftsTab = () => {
    const [drafts, setDrafts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    // Modal එක සඳහා state එක
    const [selectedDraft, setSelectedDraft] = useState<any | null>(null);

    useEffect(() => {
        const fetchDrafts = async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/plans/drafts`);
                if (res.ok) {
                    const data = await res.json();
                    setDrafts(data);
                }
            } catch (err) {
                console.error("Failed to fetch drafts", err);
            } finally {
                setLoading(false);
            }
        };

        fetchDrafts();
        const interval = setInterval(fetchDrafts, 5000);
        return () => clearInterval(interval);
    }, []);

    if (loading) return <div className="p-4 text-emerald-700">Loading live inputs...</div>;

    return (
        <div className="relative">
            {/* Main Table Container */}
            <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden">
                <div className="p-6 border-b border-emerald-50">
                    <h3 className="font-bold text-lg text-emerald-950">Live User Inputs</h3>
                    <p className="text-sm text-gray-500">Users currently planning trips (Auto-saved)</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left whitespace-nowrap">
                        <thead className="bg-emerald-50 text-emerald-900 font-bold">
                            <tr>
                                <th className="p-4">User Info</th>
                                <th className="p-4">Dates</th>
                                <th className="p-4">Route</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Last Updated</th>
                                <th className="p-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {drafts.length === 0 ? (
                                <tr><td colSpan={6} className="p-8 text-center text-gray-400">No active users right now.</td></tr>
                            ) : (
                                drafts.map((draft, idx) => {
                                    const input = draft.inputData || {};

                                    return (
                                        <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                            {/* User Info */}
                                            <td className="p-4">
                                                <div className="font-medium text-emerald-700">
                                                    {draft.userId ? "Registered User" : "Guest"}
                                                </div>
                                                <div className="text-[10px] text-gray-400 font-mono">
                                                    {draft.userId || draft.guestId}
                                                </div>
                                            </td>

                                            {/* Dates */}
                                            <td className="p-4">
                                                {input.arrivalDate ? (
                                                    <div className="flex flex-col">
                                                        <span className="text-xs">In: {input.arrivalDate}</span>
                                                        <span className="text-xs">Out: {input.departureDate}</span>
                                                    </div>
                                                ) : '-'}
                                            </td>

                                            {/* Route (Start & End combined) */}
                                            <td className="p-4 max-w-[200px] truncate">
                                                <div className="text-xs font-medium text-emerald-900">{displayValue(input.startPoint)}</div>
                                                <div className="text-xs text-gray-500">to {input.endPoint ? displayValue(input.endPoint) : 'Last Dest.'}</div>
                                            </td>

                                            {/* Status */}
                                            <td className="p-4">
                                                {draft.isGenerated ? (
                                                    <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-xs font-bold">
                                                        Generated
                                                    </span>
                                                ) : (
                                                    <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-bold">
                                                        Draft {draft.lastCompletedStep ? `(Step ${draft.lastCompletedStep})` : ''}
                                                    </span>
                                                )}
                                            </td>

                                            {/* Time */}
                                            <td className="p-4 text-gray-400 text-xs">
                                                {new Date(draft.lastUpdated).toLocaleTimeString()}
                                            </td>

                                            {/* Actions - View Button */}
                                            <td className="p-4 text-center">
                                                <button 
                                                    onClick={() => setSelectedDraft(draft)}
                                                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-lg text-xs font-medium transition-colors"
                                                >
                                                    View Details
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Details Modal */}
            {selectedDraft && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
                        
                        {/* Modal Header */}
                        <div className="flex justify-between items-center p-6 border-b border-gray-100">
                            <div>
                                <h3 className="font-bold text-xl text-emerald-950">Trip Details</h3>
                                <p className="text-xs text-gray-500 font-mono mt-1">
                                    ID: {selectedDraft.userId || selectedDraft.guestId}
                                </p>
                            </div>
                            <button 
                                onClick={() => setSelectedDraft(null)}
                                className="text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Modal Body (Scrollable) */}
                        <div className="p-6 overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Step 1 Details */}
                                <div className="bg-emerald-50/50 p-4 rounded-xl">
                                    <h4 className="font-semibold text-emerald-800 border-b border-emerald-100 pb-2 mb-3">Step 1: Routing & Dates</h4>
                                    <ul className="space-y-2 text-sm">
                                        <li><span className="text-gray-500">Arrival:</span> <span className="font-medium">{displayValue(selectedDraft.inputData?.arrivalDate)}</span></li>
                                        <li><span className="text-gray-500">Departure:</span> <span className="font-medium">{displayValue(selectedDraft.inputData?.departureDate)}</span></li>
                                        <li><span className="text-gray-500">Start Point:</span> <span className="font-medium">{displayValue(selectedDraft.inputData?.startPoint)}</span></li>
                                        <li><span className="text-gray-500">End Point:</span> <span className="font-medium">{displayValue(selectedDraft.inputData?.endPoint)}</span></li>
                                    </ul>
                                </div>

                                {/* Step 2 Details */}
                                <div className="bg-blue-50/50 p-4 rounded-xl">
                                    <h4 className="font-semibold text-blue-800 border-b border-blue-100 pb-2 mb-3">Step 2: Preferences</h4>
                                    <ul className="space-y-2 text-sm">
                                        <li><span className="text-gray-500">Budget:</span> <span className="font-medium">{selectedDraft.inputData?.budget !== undefined ? `$${selectedDraft.inputData.budget}` : '-'}</span></li>
                                        <li><span className="text-gray-500">Travelers:</span> <span className="font-medium">{selectedDraft.inputData?.adults !== undefined ? `${selectedDraft.inputData.adults} Adults, ${selectedDraft.inputData.children} Kids` : '-'}</span></li>
                                        <li><span className="text-gray-500">Vehicle:</span> <span className="font-medium">{displayValue(selectedDraft.inputData?.vehicleType)}</span></li>
                                        <li><span className="text-gray-500">Need Guide:</span> <span className="font-medium">{displayValue(selectedDraft.inputData?.includeGuide)}</span></li>
                                    </ul>
                                </div>

                                {/* Step 3 & 4 Details */}
                                <div className="bg-purple-50/50 p-4 rounded-xl md:col-span-2">
                                    <h4 className="font-semibold text-purple-800 border-b border-purple-100 pb-2 mb-3">Step 3 & 4: Interests & Notes</h4>
                                    <ul className="space-y-3 text-sm">
                                        <li>
                                            <span className="text-gray-500 block mb-1">Hotel Rating:</span> 
                                            <span className="font-medium">{displayValue(selectedDraft.inputData?.hotelRating)}</span>
                                        </li>
                                        <li>
                                            <span className="text-gray-500 block mb-1">Interests:</span> 
                                            <span className="font-medium">{displayValue(selectedDraft.inputData?.interests)}</span>
                                        </li>
                                        <li>
                                            <span className="text-gray-500 block mb-1">Must Visit:</span> 
                                            <span className="font-medium">{displayValue(selectedDraft.inputData?.nextDestinations)}</span>
                                        </li>
                                        <li>
                                            <span className="text-gray-500 block mb-1">Extra Notes:</span> 
                                            <span className="font-medium bg-white p-2 rounded border block mt-1">{displayValue(selectedDraft.inputData?.userNotes)}</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-gray-100 bg-gray-50 text-right">
                            <button 
                                onClick={() => setSelectedDraft(null)}
                                className="bg-gray-800 hover:bg-gray-900 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DraftsTab;