import React, { useRef, useState, useEffect } from 'react';
import { Star, User, Calendar, X, Quote } from 'lucide-react';
import { 
    motion, 
    useMotionValue, 
    useAnimationFrame, 
    useSpring,
    AnimatePresence 
} from 'framer-motion';

export interface Review {
    _id: string;
    userName: string;
    rating: number;
    comment: string;
    createdAt: string;
    packageId?: { title: string };
}

interface ReviewListProps {
    reviews: Review[];
    isLoading?: boolean;
}

const ReviewList: React.FC<ReviewListProps> = ({ reviews, isLoading = false }) => {
    
    // --- STATE & REFS ---
    const containerRef = useRef<HTMLDivElement>(null);
    const [contentWidth, setContentWidth] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    
    // State for the "Read Review" Popup
    const [selectedReview, setSelectedReview] = useState<Review | null>(null);

    // --- ANIMATION VALUES ---
    const x = useMotionValue(0);
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const springX = useSpring(mouseX, { stiffness: 150, damping: 15 });
    const springY = useSpring(mouseY, { stiffness: 150, damping: 15 });

    // --- CONFIG ---
    const baseSpeed = 0.5;  
    const hoverSpeed = 0.1; 

    // --- MEASURE WIDTH ---
    useEffect(() => {
        if (containerRef.current) {
            setContentWidth(containerRef.current.scrollWidth / 2);
        }
    }, [reviews]);

    // --- ANIMATION LOOP ---
    useAnimationFrame(() => {
        if (contentWidth === 0 || selectedReview) return; // Stop scrolling if modal is open

        const currentSpeed = isHovered ? hoverSpeed : baseSpeed;
        let newX = x.get() - currentSpeed;

        if (newX <= -contentWidth) {
            newX = 0;
        }
        x.set(newX);
    });

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        mouseX.set(e.clientX - rect.left);
        mouseY.set(e.clientY - rect.top);
    };

    // --- LOADING STATE ---
    if (isLoading) return <div className="h-48 sm:h-64 md:h-72 bg-slate-50 animate-pulse rounded-2xl mt-8" />;
    if (reviews.length === 0) return <div className="text-center p-8 sm:p-12 text-slate-500">No reviews yet.</div>;

    // --- RENDER CARD (Responsive Size) ---
    const ReviewCard = ({ rev, key }: { rev: Review; key?: string }) => (
        <div 
            onClick={() => setSelectedReview(rev)}
            className="
                /* Responsive Width & Height */
                w-[280px] h-[140px] 
                sm:w-[340px] sm:h-[140px] 
                md:w-[380px] 
                
                flex-shrink-0 
                bg-white 
                p-4 sm:p-5 md:p-6 
                rounded-2xl sm:rounded-3xl 
                border border-slate-100 
                shadow-sm hover:shadow-lg hover:border-emerald-200 
                transition-all duration-300 
                mx-2 sm:mx-3 md:mx-4 
                flex flex-col relative z-10 cursor-pointer group/card
            "
        > 
            {/* Header */}
            <div className="flex items-start justify-between mb-3 sm:mb-4">
                <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-100 text-emerald-600 shrink-0">
                        <User className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-900 text-sm sm:text-base leading-tight truncate w-24 sm:w-32">{rev.userName}</h4>
                        <div className="flex items-center gap-2 text-[10px] sm:text-xs text-slate-400 mt-0.5">
                            <Calendar className="w-3 h-3" />
                            {new Date(rev.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' })}
                        </div>
                    </div>
                </div>
                <div className="flex bg-yellow-50 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg border border-yellow-100">
                    <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-yellow-400 text-yellow-400" />
                    <span className="ml-1 text-xs font-bold text-yellow-700">{rev.rating}.0</span>
                </div>
            </div>

            {/* Content (Responsive Text & Spacing) */}
            <div className="flex-grow bg-slate-50 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-100 relative overflow-hidden">
                <Quote className="absolute top-2 right-2 w-6 h-6 sm:w-8 sm:h-8 text-slate-200/50 fill-current rotate-180" />
                <p className="text-slate-600 text-xs sm:text-sm italic leading-relaxed line-clamp-4">
                    "{rev.comment}"
                </p>
                <span className="absolute bottom-2 right-3 sm:right-4 text-[10px] sm:text-xs font-bold text-emerald-600 opacity-0 group-hover/card:opacity-100 transition-opacity">
                    Read more
                </span>
            </div>

            {/* Package Badge */}
            {rev.packageId?.title && (
                <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-slate-50">
                    <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider flex items-center gap-1">
                        Review for: <span className="text-slate-500 truncate max-w-[100px] sm:max-w-[150px] normal-case">{rev.packageId.title}</span>
                    </span>
                </div>
            )}
        </div>
    );

    return (
        <>
            <div 
                className="mt-8 sm:mt-12 relative overflow-hidden group"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onMouseMove={handleMouseMove}
            >
                {/* Gradient Masks (Responsive widths) */}
                <div className="absolute left-0 top-0 bottom-0 w-8 sm:w-20 md:w-32 bg-gradient-to-r from-white to-transparent z-30 pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-0 w-8 sm:w-20 md:w-32 bg-gradient-to-l from-white to-transparent z-30 pointer-events-none" />

                {/* Mouse Shadow (Hidden on small mobile if needed, usually fine) */}
                <motion.div
                    className="pointer-events-none absolute z-20 w-[400px] h-[400px] sm:w-[600px] sm:h-[600px] rounded-full bg-emerald-400/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ left: springX, top: springY, translateX: "-50%", translateY: "-50%" }}
                />

                {/* Scrolling Track */}
                <div className="py-6 sm:py-10 -my-6 sm:-my-10">
                    <motion.div 
                        ref={containerRef}
                        className="flex flex-nowrap w-max"
                        style={{ x }}
                    >
                        {[...reviews, ...reviews].map((rev, index) => (
                            <ReviewCard key={`${rev._id}-${index}`} rev={rev} />
                        ))}
                    </motion.div>
                </div>
            </div>

            {/* --- READ REVIEW MODAL (Responsive) --- */}
            <AnimatePresence>
                {selectedReview && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedReview(null)}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm cursor-pointer"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            onClick={(e) => e.stopPropagation()} 
                            className="bg-white w-full max-w-lg rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden cursor-default max-h-[90vh] flex flex-col"
                        >
                            {/* Modal Header */}
                            <div className="bg-slate-50 p-4 sm:p-6 flex justify-between items-start border-b border-slate-100 shrink-0">
                                <div className="flex items-center gap-3 sm:gap-4">
                                    <div className="w-10 h-10 sm:w-14 sm:h-14 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 border-2 border-white shadow-sm">
                                        <User className="w-5 h-5 sm:w-7 sm:h-7" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 text-lg sm:text-xl">{selectedReview.userName}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className="flex">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${i < selectedReview.rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200'}`} />
                                                ))}
                                            </div>
                                            <span className="text-slate-400 text-xs sm:text-sm">•</span>
                                            <span className="text-slate-500 text-xs sm:text-sm">
                                                {new Date(selectedReview.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setSelectedReview(null)}
                                    className="p-1.5 sm:p-2 hover:bg-slate-200 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5 sm:w-6 sm:h-6 text-slate-500" />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-5 sm:p-8 overflow-y-auto custom-scrollbar">
                                {selectedReview.packageId?.title && (
                                    <div className="mb-4 sm:mb-6 inline-flex items-center gap-2 bg-emerald-50 border border-emerald-100 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-emerald-700 text-xs sm:text-sm font-bold">
                                        <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" />
                                        Review for: {selectedReview.packageId.title}
                                    </div>
                                )}
                                <div className="relative">
                                    <Quote className="absolute -top-2 -left-2 w-8 h-8 sm:w-10 sm:h-10 text-slate-100 fill-current" />
                                    <p className="text-slate-700 text-base sm:text-lg leading-relaxed relative z-10 whitespace-pre-line">
                                        {selectedReview.comment}
                                    </p>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="p-4 sm:p-6 border-t border-slate-100 bg-slate-50 flex justify-end shrink-0">
                                <button 
                                    onClick={() => setSelectedReview(null)}
                                    className="px-5 py-2 sm:px-6 sm:py-2 bg-slate-900 text-white text-sm sm:text-base font-bold rounded-xl hover:bg-slate-800 transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default ReviewList;