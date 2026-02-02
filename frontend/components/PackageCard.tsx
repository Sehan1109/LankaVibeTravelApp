import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Plus } from 'lucide-react';
import { TravelPackage } from '../types'; 

interface PackageCardProps {
  pkg: TravelPackage;
  onQuickView?: (pkg: TravelPackage) => void; // Made optional if not used directly anymore
}

const PackageCard: React.FC<PackageCardProps> = ({ pkg }) => {
  return (
    <motion.div 
      whileHover={{ y: -8 }}
      className="group relative bg-white rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl shadow-slate-200/50 h-full w-full flex flex-col hover:shadow-emerald-200/40 transition-shadow duration-300 "
    >
      <Link 
        to={`/packages/${pkg._id}`} 
        className="flex flex-col h-full w-full cursor-pointer"
      >
        
        {/* Image Area */}
        <div className="relative h-48 sm:h-56 overflow-hidden shrink-0">
          <div className="absolute top-4 left-4 z-20 flex gap-2">
            {pkg.tags.slice(0, 1).map((tag, i) => (
              <span key={i} className="bg-white/90 backdrop-blur text-emerald-800 text-[10px] sm:text-xs font-bold px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full uppercase tracking-wider">
                {tag}
              </span>
            ))}
          </div>
          <img 
            src={pkg.image} 
            alt={pkg.title}
            className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-in-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-60" />
        </div>

        {/* Content Area */}
        <div className="p-5 sm:p-4 flex-grow flex flex-col relative">
          {/* Floating Price Tag */}
          <div className="absolute -top-8 sm:-top-10 right-4 sm:right-8 bg-emerald-500 text-white w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex flex-col items-center justify-center shadow-lg shadow-emerald-500/30 border-4 border-white transition-all z-10">
              <span className="text-[10px] sm:text-xs font-medium opacity-90">From</span>
              <span className="text-base sm:text-lg font-bold">${pkg.price}</span>
          </div>

          <div className="text-slate-400 text-xs sm:text-sm font-medium mb-2 flex items-center gap-2 mt-2">
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> {pkg.duration}
          </div>
          
          <h3 className="text-xl sm:text-2xl font-bold text-slate-800 mb-2 sm:mb-3 leading-tight group-hover:text-emerald-600 transition-colors">
            {pkg.title}
          </h3>
          
          <p className="text-slate-500 text-xs sm:text-sm leading-relaxed mb-0 line-clamp-3">
            {pkg.description}
          </p>
        </div>

        {/* Footer / Call to Action */}
        <div className="w-full h-10 sm:h-14 flex items-center justify-center bg-white text-emerald-600 transition-all mt-auto relative overflow-hidden">
             <span className="flex items-center gap-2 font-bold tracking-wide">
                Explore 
                <Plus className="w-5 h-5 transition-transform duration-300 group-hover:rotate-90" />
             </span>
        </div>

      </Link>
    </motion.div>
  );
};

export default PackageCard;