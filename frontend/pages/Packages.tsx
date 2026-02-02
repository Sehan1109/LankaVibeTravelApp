import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

// Shared Components
import PackageCard from '../components/PackageCard';

// Services & Types
import { api } from '../services/api'; 
import { TravelPackage } from '../types';

const Packages: React.FC = () => {
  const [packages, setPackages] = useState<TravelPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<TravelPackage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const data = await api.getPackages();
        setPackages(data);
      } catch (err) {
        console.error('Failed to fetch packages', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-emerald-600 w-10 h-10" />
      </div>
    );
  }

  return (
    // Adjusted padding: py-12 on mobile, scaling up to py-20 on desktop
    // Adjusted horizontal padding: px-4 mobile -> px-6 sm -> px-8 lg
    <div className="bg-slate-50 min-h-screen py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 font-poppins">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        {/* Adjusted margin bottom: mb-10 mobile -> mb-16 desktop */}
        <div className="text-center mb-10 sm:mb-12 md:mb-16 space-y-3 sm:space-y-4">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            // Font size: text-3xl mobile -> text-4xl sm -> text-5xl md
            className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900"
          >
            Our Travel Packages
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            // Font size: text-base mobile -> text-lg sm
            className="text-slate-600 max-w-2xl mx-auto text-base sm:text-lg px-2 sm:px-0"
          >
            Explore our curated selection of unforgettable journeys, optimized by AI for the perfect balance of adventure and relaxation.
          </motion.p>
        </div>
        
        {/* Packages Grid */}
        {/* Added explicit grid-cols-1 for mobile, gap-6 for mobile -> gap-8 for larger screens */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {packages.map((pkg, index) => (
            <motion.div
              key={pkg._id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <PackageCard 
                pkg={pkg} 
                onQuickView={(p) => setSelectedPackage(p)} 
              />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Packages;