import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';

interface RegenerateModalProps {
    isOpen: boolean;
    dayIndex: number | null;
    onClose: () => void;
    onRegenerate: (index: number, request: string) => void;
}

const RegenerateModal: React.FC<RegenerateModalProps> = ({ isOpen, dayIndex, onClose, onRegenerate }) => {
    const [customRequest, setCustomRequest] = useState('');

    if (!isOpen) return null;

    const handleConfirm = () => {
        if (dayIndex !== null) {
            onRegenerate(dayIndex, customRequest);
            onClose();
            setCustomRequest('');
        }
    };

    const handleCancel = () => {
        onClose();
        setCustomRequest('');
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            
            <div className="bg-white rounded-3xl p-5 md:p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 mx-auto">
                
                <h3 className="text-xl font-bold mb-4 text-gray-900">Regenerate Day {dayIndex! + 1}</h3>
                
                <textarea
                    placeholder="E.g., I want more beach time instead of temples..."
                    className="w-full p-4 border border-gray-200 rounded-xl mb-4 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 outline-none h-32 resize-none text-base sm:text-sm"
                    value={customRequest}
                    onChange={(e) => setCustomRequest(e.target.value)}
                />

                <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
                    <button
                        onClick={handleCancel}
                        className="w-full sm:w-auto px-5 py-3 sm:py-2.5 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors flex justify-center items-center"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="w-full sm:w-auto px-5 py-3 sm:py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-200/50"
                    >
                        <RefreshCw className="w-4 h-4" /> Update Plan
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RegenerateModal;