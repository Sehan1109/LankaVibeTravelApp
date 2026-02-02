import React, { useEffect, useState } from 'react';
import { Trash2, Star, MessageSquare, User, Calendar, MapPin } from 'lucide-react';

interface Review {
  _id: string;
  userName: string;
  userImage?: string;
  rating: number;
  comment: string;
  packageName?: string; // We will map this from the backend data
  createdAt: string;
}

const ReviewsTab: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const API_URL = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      // FIX 1: Matches your backend route router.get('/reviews/all', ...)
      // Assuming your router is mounted at /api/packages
      const res = await fetch(`${API_URL}/api/reviews/all`);
      
      if (res.ok) {
        const data = await res.json();
        
        // FIX 2: Map the backend populated object to a simple string
        const formattedReviews = data.map((r: any) => ({
            ...r,
            // If packageId is populated (is an object), use .title, otherwise it might be null/general
            packageName: (r.packageId && typeof r.packageId === 'object') ? r.packageId.title : 'General Review'
        }));

        setReviews(formattedReviews);
      }
    } catch (error) {
      console.error("Failed to fetch reviews", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this review?")) return;

    try {
      // FIX 3: Matches your backend route router.delete('/reviews/:id', ...)
      const res = await fetch(`${API_URL}/api/reviews/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setReviews(prev => prev.filter(r => r._id !== id));
      } else {
        alert("Failed to delete. Check server logs.");
      }
    } catch (error) {
      console.error("Error deleting", error);
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-2xl text-slate-800 flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-emerald-600" /> User Reviews
        </h3>
        <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full">
          {reviews.length} Reviews
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {reviews.map((review) => (
          <div key={review._id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative group">
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
              <button onClick={() => handleDelete(review._id)} className="text-slate-300 hover:text-red-500 p-2 hover:bg-red-50 rounded-lg">
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
      </div>
    </div>
  );
};

export default ReviewsTab;