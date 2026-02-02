import React from 'react';
import { Star } from 'lucide-react';
import { Review } from './ReviewList'; 

interface ReviewSectionProps {
    reviews: Review[];
    onReviewClick: () => void;
}

const ReviewSection: React.FC<ReviewSectionProps> = ({ onReviewClick }) => {

    return (
        <div>
            <button 
                onClick={onReviewClick} 
                className="w-full py-3 bg-white text-emerald-700 font-bold rounded-full border-2 border-emerald-100 hover:bg-emerald-50 hover:border-emerald-200 transition-all shadow-sm flex items-center justify-center gap-2"
            >
                <Star className="w-4 h-4" />
                Write a Review
            </button>
        </div>
    );
};

export default ReviewSection;