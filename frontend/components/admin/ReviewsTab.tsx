import React, { useEffect, useState } from 'react';
import { Trash2, Star, MessageSquare, User, Calendar, MapPin, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'; // 🌟 AlertTriangle එකතු කළා

interface Review {
  _id: string;
  userName: string;
  userImage?: string;
  rating: number;
  comment: string;
  packageName?: string;
  createdAt: string;
}

const ReviewsTab: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  // 🌟 Delete Popup එක පෙන්වීමට අලුත් State එකක්
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const API_URL = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    fetchReviews();
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
        setToast(null);
    }, 3000); 
  };

  const fetchReviews = async () => {
    try {
      const res = await fetch(`${API_URL}/api/reviews/all`);
      
      if (res.ok) {
        const data = await res.json();
        const formattedReviews = data.map((r: any) => ({
            ...r,
            packageName: (r.packageId && typeof r.packageId === 'object') ? r.packageId.title : 'General Review'
        }));
        setReviews(formattedReviews);
      } else {
        showToast("Failed to fetch reviews.", "error");
      }
    } catch (error) {
      console.error("Failed to fetch reviews", error);
      showToast("An error occurred while fetching reviews.", "error");
    } finally {
      setLoading(false);
    }
  };

  // 🌟 Browser Alert එක වෙනුවට අපේ Popup එක Open කරන Function එක
  const handleDeleteClick = (id: string) => {
    setDeleteConfirmId(id);
  };

  // 🌟 Popup එකෙන් "Yes, Delete" එබූ විට ක්‍රියාත්මක වන Function එක
  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    
    const id = deleteConfirmId;
    setDeleteConfirmId(null); // මුලින්ම Popup එක වසා දමන්න

    try {
      const res = await fetch(`${API_URL}/api/reviews/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setReviews(prev => prev.filter(r => r._id !== id));
        showToast("Review Deleted Successfully!", "success");
      } else {
        showToast("Failed to delete review.", "error");
      }
    } catch (error) {
      console.error("Error deleting", error);
      showToast("An error occurred while deleting.", "error");
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star key={i} className={`w-4 h-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'}`} />
    ));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (loading) return <div className="p-10 text-center text-slate-500">Loading reviews...</div>;

  return (
    <div className="space-y-6 relative">
      
      {/* --- Custom Toast Notification --- */}
      {toast && (
        <div className="fixed top-20 right-6 z-[100] animate-fade-in-up">
            <div className={`flex items-center gap-3 px-6 py-4 bg-white rounded-xl shadow-2xl font-medium border ${
                toast.type === 'success' ? 'text-emerald-600 border-amber-500' : 'text-red-600 border-red-500'
            }`}>
                {toast.type === 'success' ? (
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                )}
                {toast.message}
            </div>
        </div>
      )}

      {/* 🌟 --- Custom Delete Confirmation Modal (Popup) --- 🌟 */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 transform transition-all scale-100">
                <div className="flex items-start gap-4 mb-2">
                    <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center shrink-0 border border-red-100">
                        <AlertTriangle className="w-6 h-6 text-red-500" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-900">Delete Review?</h3>
                        <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                            Are you sure you want to delete this user review? This action cannot be undone and will be permanently removed.
                        </p>
                    </div>
                </div>
                <div className="flex gap-3 mt-6 justify-end">
                    <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={confirmDelete}
                        className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition-colors shadow-sm shadow-red-200 flex items-center gap-2"
                    >
                        <Trash2 className="w-4 h-4" /> Yes, Delete
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* --- Header Section --- */}
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-2xl text-slate-800 flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-emerald-600" /> User Reviews
        </h3>
        <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full">
          {reviews.length} Reviews
        </span>
      </div>

      {/* --- Reviews Grid --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {reviews.map((review) => (
          <div key={review._id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative group hover:border-emerald-200 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">{review.userName || 'Anonymous'}</h4>
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <Calendar className="w-3 h-3" /> {formatDate(review.createdAt)}
                  </div>
                </div>
              </div>
              <button 
                onClick={() => handleDeleteClick(review._id)} // 🌟 මෙතන වෙනස් වුණා
                className="text-slate-300 hover:text-red-500 p-2 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete Review"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="mb-3 space-y-2">
              <div className="flex items-center gap-1">{renderStars(review.rating)}</div>
              {review.packageName && (
                <div className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                   <MapPin className="w-3 h-3" /> {review.packageName}
                </div>
              )}
            </div>

            <div className="text-slate-600 text-sm leading-relaxed">"{review.comment}"</div>
          </div>
        ))}

        {reviews.length === 0 && (
            <div className="col-span-full text-center py-10 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-400 font-medium">No reviews found.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default ReviewsTab;