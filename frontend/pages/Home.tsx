import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Compass,
  Sparkles,
  Cpu,
  Map as MapIcon,
  Calendar,
  MapPin,
  Star,
  ArrowRight
} from 'lucide-react';

// Imported Components
import PackageCard from '../components/PackageCard';
import { api } from '../services/api';
import { TravelPackage } from '../types';
import ReviewList from '@/components/Review/ReviewList';
import ReviewModal from '@/components/Review/ReviewModal';
import ReviewSection from '@/components/Review/ReviewSection';

// --- Utility Components ---

const GlassCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`backdrop-blur-md bg-white/70 border border-white/20 shadow-xl ${className}`}>
    {children}
  </div>
);

const FadeIn = ({ children, delay = 0 }: { children: React.ReactNode, delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-100px" }}
    transition={{ duration: 0.6, delay, ease: "easeOut" }}
  >
    {children}
  </motion.div>
);

const Home: React.FC = () => {
  const [packages, setPackages] = useState<TravelPackage[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [user, setUser] = useState<any>({ id: 'guest', name: 'Guest User' }); // Placeholder for logic
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // Review States
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  const handleReviewButtonClick = () => {
      // In real implementation, check actual auth context
      if (!user) {
          alert("Please login to write a review");
          return;
      }
      setIsReviewModalOpen(true);
  };
  
  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setReviewsLoading(true);

        // 1. Fetch Packages (for the grid)
        const packagesData = await api.getPackages();
        setPackages(packagesData);

        // 2. Fetch ALL Reviews (using the new efficient endpoint)
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/reviews/all`);
        
        if (response.ok) {
            const reviewsData = await response.json();
            if (Array.isArray(reviewsData)) {
                setReviews(reviewsData);
            }
        } else {
            console.error("Failed to fetch reviews");
        }

      } catch (error) {
        console.error("Error fetching home data:", error);
      } finally {
        setLoading(false);
        setReviewsLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="bg-slate-50 min-h-screen font-poppins selection:bg-emerald-200 selection:text-emerald-900">

      {/* --- HERO SECTION --- */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-50 pt-24 lg:pt-30 pb-20 lg:pb-0">
        {/* Background Animation Layers */}
        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
          <motion.div
            animate={{ x: [0, 100, 0], y: [0, -50, 0], scale: [1, 1.2, 1] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute top-[-10%] left-[-10%] w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-emerald-300/30 rounded-full blur-[80px] md:blur-[100px]"
          />
          <motion.div
            animate={{ x: [0, -100, 0], y: [0, 50, 0], scale: [1, 1.5, 1] }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-[-10%] right-[-10%] w-[400px] md:w-[600px] h-[400px] md:h-[600px] bg-teal-200/40 rounded-full blur-[100px] md:blur-[120px]"
          />
        </div>

        <div className="container relative z-10 mx-auto px-6 md:px-12 lg:px-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* LEFT: Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center lg:text-left"
          >
            <div className="mt-10 lg:-mt-20">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/50 border border-emerald-200 text-emerald-700 text-sm font-semibold mb-6 mx-auto lg:mx-0">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                AI V4.0 Now Live 
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-slate-900 leading-[1.1] mb-6 tracking-tight">
                Travel Smarter, <br />
                Not <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-400">Harder.</span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 mb-8 max-w-lg mx-auto lg:mx-0 leading-relaxed">
                Experience Sri Lanka through the lens of intelligent planning. We combine local expertise with neural networks to craft your perfect journey.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link to="/planner" className="w-full sm:w-auto">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-full sm:w-auto px-8 py-4 bg-emerald-500 text-white rounded-full font-bold flex items-center justify-center gap-3 shadow-xl shadow-slate-900/20 hover:bg-emerald-400 transition-all"
                  >
                    <Cpu className="w-5 h-5 text-slate-700" />
                    Generate Itinerary
                  </motion.button>
                </Link>
                <Link to="/packages" className="w-full sm:w-auto">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-full sm:w-auto px-8 py-4 bg-white text-slate-900 border border-slate-200 rounded-full font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-all shadow-xl shadow-slate-900/20"
                  >
                    Explore Manual
                  </motion.button>
                </Link>
              </div>
            </div>
          </motion.div>

          {/* RIGHT: Hero Image Collage */}
          <div className="relative hidden lg:block h-[600px] xl:h-[700px] w-full max-w-[700px] ml-auto scale-90 xl:scale-100">
            <svg className="absolute inset-0 w-full h-full z-0 pointer-events-none overflow-visible">
              <motion.path
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 2, ease: "easeInOut" }}
                d="M 50 100 Q 200 0 500 80"
                fill="none" stroke="#d8b4fe" strokeWidth="2" strokeDasharray="8 8"
              />
              <motion.path
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 2, delay: 1, ease: "easeInOut" }}
                d="M 540 100 Q 650 150 620 500"
                fill="none" stroke="#d8b4fe" strokeWidth="2" strokeDasharray="8 8"
              />
            </svg>

            {/* Floating Icons */}
            <motion.div
              animate={{ x: [0, 20, 0], y: [0, -10, 0], rotate: [10, 15, 10] }}
              transition={{ duration: 5, repeat: Infinity }}
              className="absolute top-[80px] left-[100px] text-purple-500 z-0"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="transform rotate-12">
                <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
              </svg>
            </motion.div>

            <motion.div
              animate={{ x: [0, -10, 0], y: [0, 20, 0], rotate: [90, 100, 90] }}
              transition={{ duration: 6, repeat: Infinity }}
              className="absolute top-[300px] right-[-10px] text-pink-500 z-0"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="transform rotate-90">
                <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
              </svg>
            </motion.div>

            {/* Images */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="absolute top-32 left-0 w-56 h-72 rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white z-10"
            >
              <img src={"/resources/img01.jpg"} className="w-full h-full object-cover" alt="Temple" />
            </motion.div>

            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="absolute top-0 left-52 w-44 h-44 rounded-[2rem] overflow-hidden shadow-xl border-4 border-white z-20"
            >
              <img src={"/resources/img04.jpg"} className="w-full h-full object-cover" alt="Fishing" />
              <div className="absolute -top-4 -right-4 w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="3 11 22 2 13 21 11 13 3 11" />
                </svg>
              </div>
            </motion.div>

            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="absolute top-52 left-64 w-48 h-48 rounded-[2rem] overflow-hidden shadow-xl border-4 border-white z-20"
            >
              <img src={"/resources/img03.jpg"} className="w-full h-full object-cover" alt="Surf" />
            </motion.div>

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.8, type: "spring" }}
              className="absolute top-[400px] left-[320px] w-14 h-14 bg-sky-400 rounded-full flex items-center justify-center border-4 border-white shadow-lg z-30"
            >
              <MapPin className="text-white w-7 h-7 fill-white/20" />
            </motion.div>

            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="absolute top-10 right-10 w-48 h-64 rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white z-10"
            >
              <img src="/resources/img02.jpg" className="w-full h-full object-cover" alt="Colombo" />
            </motion.div>

            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="absolute top-64 right-0 w-52 h-80 rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white z-10"
            >
              <img src="/resources/img05.jpg" className="w-full h-full object-cover" alt="Ella Train" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* --- STATS / FEATURES BANNER --- */}
      <section className="relative z-20 mt-0 lg:-mt-20 px-6 md:px-12">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">

            <FadeIn delay={0.1}>
              <GlassCard className="rounded-3xl p-6 lg:p-8 text-center hover:scale-[1.02] transition-transform h-full">
                <div className="bg-emerald-100 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 text-emerald-600">
                  <Compass className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Smart Routing</h3>
                <p className="text-slate-500 mt-2 text-sm">
                  Routes optimized by AI for scenery and time efficiency.
                </p>
              </GlassCard>
            </FadeIn>

            <FadeIn delay={0.2}>
              <GlassCard className="rounded-3xl p-6 lg:p-8 text-center hover:scale-[1.02] transition-transform h-full">
                <div className="bg-emerald-100 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 text-emerald-600">
                  <MapIcon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Hidden Gems</h3>
                <p className="text-slate-500 mt-2 text-sm">
                  Access to exclusive locations off the beaten path.
                </p>
              </GlassCard>
            </FadeIn>

            <FadeIn delay={0.3}>
              <GlassCard className="rounded-3xl p-6 lg:p-8 text-center hover:scale-[1.02] transition-transform h-full">
                <div className="bg-emerald-100 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 text-emerald-600">
                  <Calendar className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Dynamic Scheduling</h3>
                <p className="text-slate-500 mt-2 text-sm">
                  Flexible itineraries that adapt to your pace.
                </p>
              </GlassCard>
            </FadeIn>

          </div>
        </div>
      </section>

      {/* --- PACKAGES GRID --- */}
      <section className="py-12 md:py-20 px-6 md:px-12 lg:px-20">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 md:mb-16 gap-4">
            <div>
              <motion.span
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                className="text-emerald-600 font-bold tracking-widest uppercase text-xs"
              >
                Curated Experiences
              </motion.span>
              <motion.h2
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 mt-2"
              >
                Trending Destinations
              </motion.h2>
            </div>
            
            {/* Removed the top link to keep the focus on the grid header */}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-white rounded-[2rem] h-[500px] animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {packages.slice(0, 3).map((pkg, index) => (
                <div key={pkg._id}>
                  <FadeIn delay={index * 0.1}>
                    <PackageCard
                      pkg={pkg}
                    />
                  </FadeIn>
                </div>
              ))}
            </div>
          )}

          {/* --- CENTERED EMERALD BUTTON --- */}
          <div className="mt-10 flex justify-center">
            <Link 
              to="/packages" 
              className="group relative inline-flex items-center gap-3 bg-emerald-600 text-white px-8 py-4 rounded-full font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <span>View all packages</span>
              <motion.div
                animate={{ x: [-3, 3, -3] }}
                transition={{ 
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
              <ArrowRight className="w-5 h-5" />
              </motion.div>
            </Link>
          </div>

        </div>
      </section>

      {/* --- REVIEWS LIST SECTION (ALL REVIEWS) --- */}
      <section id="reviews" className="py-12 md:py-20 px-6 md:px-12 lg:px-20 bg-white">
          <div className="container mx-auto max-w-5xl">
              <div className="text-center mb-12">
                  <span className="text-emerald-600 font-bold tracking-widest uppercase text-xs">Community Feedback</span>
                  <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mt-2 flex items-center justify-center gap-3">
                      Traveler Stories
                      <div className="bg-yellow-100 text-yellow-600 px-3 py-1 rounded-full text-base font-bold flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-600" />
                          {reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : "5.0"}
                      </div>
                  </h2>
                  <p className="text-slate-500 mt-4 max-w-2xl mx-auto">
                      Real experiences from travelers who have explored Sri Lanka with our AI planner and curated packages.
                  </p>
              </div>

              {/* Using ReviewList component to display aggregated reviews */}
              <ReviewList reviews={reviews} isLoading={reviewsLoading} />
              
              <div className="mt-8 text-center">
              <ReviewSection reviews={reviews} onReviewClick={handleReviewButtonClick} />
              </div>
          </div>
          <ReviewModal 
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        packageId={packages}
        onReviewAdded={(newReview) => setReviews([newReview, ...reviews])}
      />
      </section>

      {/* --- CTA SECTION --- */}
      <section className="py-10 px-4 md:px-6">
        <div className="container mx-auto">
          <div className="relative rounded-[2rem] md:rounded-[3rem] overflow-hidden bg-emerald-900 text-white p-8 md:p-12 lg:p-24 text-center">
            <div className="absolute inset-0 opacity-20">
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path d="M0 0 L100 0 L100 100 Z" fill="url(#grad1)" />
              </svg>
            </div>

            <div className="relative z-10 max-w-3xl mx-auto">
              <h2 className="text-3xl sm:text-4xl md:text-6xl font-black mb-4 md:mb-6">Ready for the Future of Travel?</h2>
              <p className="text-emerald-100 text-base md:text-lg mb-8 md:mb-10 font-light">
                Stop planning, start experiencing. Let our AI craft your perfect Sri Lankan getaway in seconds.
              </p>
              <Link
                to="/planner"
                className="inline-flex items-center gap-3 bg-white text-emerald-900 px-8 md:px-10 py-4 md:py-5 rounded-full font-bold text-base md:text-lg hover:bg-emerald-50 transition-colors shadow-2xl"
              >
                Create My Itinerary
                <Sparkles className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
    
  );
};

export default Home;