import React, { useState, useEffect } from 'react';

// සරල අගයන් පෙන්වන helper function එක
const displayValue = (value: any) => {
    // 1. අගයක් නැත්නම් හෝ හිස් නම්
    if (value === null || value === undefined || value === '') return '-';

    // 2. Array එකක් නම්
    if (Array.isArray(value)) {
        return value.length > 0 ? value.join(', ') : '-';
    }

    // 3. Boolean අගයක් නම් (e.g., includeGuide)
    if (typeof value === 'boolean') {
        return value ? 'Yes' : 'No';
    }

    return value;
};

const DraftsTab = () => {
    const [drafts, setDrafts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

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

    if (loading) return <div>Loading live inputs...</div>;

    return (
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

                            {/* Step 1 */}
                            <th className="p-4">Dates</th>
                            <th className="p-4">Start Point</th>
                            <th className="p-4">End Point</th>

                            {/* Step 2 */}
                            <th className="p-4">Budget</th>
                            <th className="p-4">Travelers</th>
                            <th className="p-4">Vehicle</th>
                            <th className="p-4">Guide</th>

                            {/* Step 3 */}
                            <th className="p-4">Hotel</th>
                            <th className="p-4">Interests</th>
                            <th className="p-4">Must-Visit</th>

                            {/* Step 4 */}
                            <th className="p-4">Notes</th>

                            {/* Meta */}
                            <th className="p-4">Status</th>
                            <th className="p-4">Last Updated</th>
                        </tr>
                    </thead>
                    <tbody>
                        {drafts.length === 0 ? (
                            <tr><td colSpan={13} className="p-8 text-center text-gray-400">No active users right now.</td></tr>
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

                                        {/* STEP 1: Dates */}
                                        <td className="p-4">
                                            {input.arrivalDate ? (
                                                <div className="flex flex-col">
                                                    <span className="text-xs">In: {input.arrivalDate}</span>
                                                    <span className="text-xs">Out: {input.departureDate}</span>
                                                </div>
                                            ) : '-'}
                                        </td>

                                        {/* STEP 1: Start Point */}
                                        <td className="p-4 font-medium text-emerald-900 max-w-[150px] truncate" title={input.startPoint}>
                                            {displayValue(input.startPoint)}
                                        </td>

                                        {/* STEP 1: End Point */}
                                        <td className="p-4 max-w-[150px] truncate" title={input.endPoint}>
                                            {input.endPoint ? displayValue(input.endPoint) : (input.startPoint ? 'End at Last Destination' : '-')}
                                        </td>

                                        {/* STEP 2: Budget */}
                                        <td className="p-4 text-emerald-600 font-bold">
                                            {input.budget !== undefined ? `$${input.budget}` : '-'}
                                        </td>

                                        {/* STEP 2: Travelers */}
                                        <td className="p-4">
                                            {input.adults !== undefined ? (
                                                <span>{input.adults} Adults, {input.children} Kids</span>
                                            ) : '-'}
                                        </td>

                                        {/* STEP 2: Vehicle */}
                                        <td className="p-4">
                                            {displayValue(input.vehicleType)}
                                        </td>

                                        {/* STEP 2: Guide */}
                                        <td className="p-4">
                                            {input.includeGuide !== undefined ? displayValue(input.includeGuide) : '-'}
                                        </td>

                                        {/* STEP 3: Hotel Rating */}
                                        <td className="p-4">
                                            {input.hotelRating ? `${input.hotelRating}` : '-'}
                                        </td>

                                        {/* STEP 3: Interests */}
                                        <td className="p-4 max-w-[200px] truncate" title={Array.isArray(input.interests) ? input.interests.join(', ') : ''}>
                                            {displayValue(input.interests)}
                                        </td>

                                        {/* STEP 3: Must-Visit (Next Destinations) */}
                                        <td className="p-4 max-w-[200px] truncate" title={Array.isArray(input.nextDestinations) ? input.nextDestinations.join(', ') : ''}>
                                            {displayValue(input.nextDestinations)}
                                        </td>

                                        {/* STEP 4: Notes */}
                                        <td className="p-4 max-w-[150px] truncate" title={input.userNotes}>
                                            {displayValue(input.userNotes)}
                                        </td>

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
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DraftsTab;