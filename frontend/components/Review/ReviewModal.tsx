import React, { useState, useEffect } from 'react';
import { Star, X, Send, Loader2, MapPin } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SimplePackage {
    _id: string;
    title: string;
}

interface ReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    packageId?: string;
    packages?: SimplePackage[];   
    onReviewAdded: (newReview: any) => void;
}

const ReviewModal: React.FC<ReviewModalProps> = ({ 
    isOpen, 
    onClose, 
    packageId, 
    packages = [], 
    onReviewAdded 
}) => {
    const { user } = useAuth();
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    
    const [selectedPackageId, setSelectedPackageId] = useState<string>(
        (typeof packageId === 'string' ? packageId : '')
    );
    
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (typeof packageId === 'string' && packageId) {
            setSelectedPackageId(packageId);
        } else {
            setSelectedPackageId('');
        }
    }, [packageId]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return alert("Please login first");

        setSubmitting(true);
        try {
            let url = '';
            if (selectedPackageId) {
                 url = `${import.meta.env.VITE_BACKEND_URL}/api/reviews/${selectedPackageId}/reviews`;
            } else {
                 url = `${import.meta.env.VITE_BACKEND_URL}/api/reviews/`;
            }

            const payload: any = {
                userId: user.id,
                userName: user.name,
                rating,
                comment
            };

            if (selectedPackageId && typeof selectedPackageId === 'string') {
                payload.packageId = selectedPackageId;
            }

            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const data = await res.json();
                onReviewAdded(data.review);
                
                setComment('');
                setRating(5);
                if (!packageId) setSelectedPackageId('');
                onClose(); 
            } else {
                const errData = await res.json().catch(() => ({ error: "Failed to submit" }));
                alert(errData.error || "Failed to submit review.");
            }
        } catch (error) {
            console.error("Submit Error:", error);
            alert("Error submitting review");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-[95%] sm:max-w-lg rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 relative flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="bg-slate-50 p-5 sm:p-6 flex justify-between items-center border-b border-slate-100 shrink-0">
                    <h3 className="font-black text-lg sm:text-xl text-slate-800">
                        {packageId ? "Rate Experience" : "Write a Review"}
                    </h3>
                    <button onClick={onClose} className="p-1.5 sm:p-2 hover:bg-slate-200 rounded-full transition-colors">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                {/* Form - Scrollable on small screens */}
                <div className="overflow-y-auto custom-scrollbar">
                    <form onSubmit={handleSubmit} className="p-5 sm:p-8">
                        {!packageId && (
                            <div className="mb-6">
                                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Select Service</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                                    <select 
                                        value={selectedPackageId}
                                        onChange={(e) => setSelectedPackageId(e.target.value)}
                                        className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-xl border-2 border-slate-100 focus:border-emerald-500 focus:ring-0 outline-none bg-slate-50 appearance-none font-medium text-slate-700 cursor-pointer"
                                    >
                                        <option value="">General Review (No specific package)</option>
                                        {packages.map(p => (
                                            <option key={p._id} value={p._id}>{p.title}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-center gap-2 sm:gap-3 mb-6 sm:mb-8">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    className="group focus:outline-none transition-transform hover:scale-110 active:scale-95"
                                >
                                    <Star
                                        className={`w-9 h-9 sm:w-12 sm:h-12 transition-colors ${
                                            star <= rating 
                                                ? 'fill-yellow-400 text-yellow-400 drop-shadow-sm' 
                                                : 'text-slate-200 group-hover:text-yellow-200'
                                        }`}
                                    />
                                </button>
                            ))}
                        </div>

                        <div className="space-y-4">
                            <label className="block text-sm font-bold text-slate-700 ml-1">Your Feedback</label>
                            <textarea
                                className="w-full p-3 sm:p-4 rounded-xl text-sm sm:text-base border-2 border-slate-100 focus:border-emerald-500 focus:ring-0 outline-none transition-all bg-slate-50 focus:bg-white resize-none"
                                rows={4}
                                placeholder="Share your experience..."
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                required
                            />
                        </div>

                        <div className="mt-6 sm:mt-8">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-3 sm:py-4 bg-emerald-600 text-white font-bold text-sm sm:text-base rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 disabled:opacity-70"
                            >
                                {submitting ? <Loader2 className="animate-spin w-5 h-5" /> : <Send className="w-4 h-4 sm:w-5 sm:h-5" />}
                                Submit Review
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ReviewModal;