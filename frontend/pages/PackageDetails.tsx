import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, FileDown, Hotel, BedDouble, Star, MapPin, Calendar } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas'; // Import html2canvas
import { useAuth } from '../hooks/useAuth';
import ReviewSection from '../components/Review/ReviewSection';
import ReviewList, { Review } from '../components/Review/ReviewList';
import ReviewModal from '../components/Review/ReviewModal';

interface ItineraryDay {
  day: number;
  title: string;
  description: string;
  image?: string;
  hotel: string;
  meals: string;
  roomType: string;
  activities: string;
}

interface PackageData {
  _id: string;
  title: string;
  description: string;
  price: number;
  duration: string;
  image: string;
  gallery: string[];
  location: string;
  inclusions: string[];
  exclusions: string[];
  itinerary: ItineraryDay[];
  manualUrl?: string;
}

const PackageDetails: React.FC = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const pdfRef = useRef<HTMLDivElement>(null); // Ref for the PDF content

  // State
  const [pkg, setPkg] = useState<PackageData | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Fetch Data
  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        const pkgRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/packages/${id}`);
        const pkgData = await pkgRes.json();
        setPkg(pkgData);

        const reviewRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/reviews/${id}/reviews`);
        const reviewData = await reviewRes.json();
        setReviews(Array.isArray(reviewData) ? reviewData : []);
      } catch (error) {
        console.error("Error fetching details:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleReviewButtonClick = () => {
    if (!user) {
      alert("Please login to write a review");
      return;
    }
    setIsReviewModalOpen(true);
  };

  const handleReviewAdded = (newReview: Review) => {
    setReviews([newReview, ...reviews]);
  };

  // --- NEW PDF DOWNLOAD LOGIC ---
  const handleDownload = async () => {
    if (!pkg) return;
    setIsGeneratingPdf(true);

    try {
      if (pkg.manualUrl) {
        try {
          const response = await fetch(pkg.manualUrl);
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          
          const link = document.createElement('a');
          link.href = url;
          link.download = `${pkg.title.replace(/\s+/g, '_')}_Manual.pdf`;
          document.body.appendChild(link);
          link.click();
          
          // Cleanup
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        } catch (downloadError) {
          console.error("Blob download failed, trying direct link", downloadError);
          const link = document.createElement('a');
          link.href = pkg.manualUrl;
          link.target = "_blank";
          link.download = `${pkg.title.replace(/\s+/g, '_')}_Manual.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      } 
      else {
        const input = pdfRef.current;
        if (input) {
          const canvas = await html2canvas(input, {
            scale: 2, 
            useCORS: true,
            logging: false,
            scrollY: -window.scrollY,
          });

          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF('p', 'mm', 'a4');
          
          const pdfWidth = 210;
          const pdfHeight = 297;
          const margin = 10;
          const contentWidth = pdfWidth - (margin * 2);
          const contentHeight = (canvas.height * contentWidth) / canvas.width;
          
          const xOffset = margin;
          let yOffset = margin;

          // First Page
          pdf.addImage(imgData, 'PNG', xOffset, yOffset, contentWidth, contentHeight);

          // Multi-page logic
          let heightLeft = contentHeight - (pdfHeight - (margin * 2));
          let pageCount = 1;

          while (heightLeft > 0) {
            pdf.addPage();
            pageCount++;
            // Calculate position for next page
            const position = margin - (pdfHeight * (pageCount - 1)) + (margin * (pageCount - 1)); 
            pdf.addImage(imgData, 'PNG', xOffset, position, contentWidth, contentHeight);
            heightLeft -= (pdfHeight - (margin * 2));
          }

          pdf.save(`${pkg.title.replace(/\s+/g, '_')}_Itinerary.pdf`);
        }
      }

    } catch (err) {
      console.error("Failed to process download", err);
      alert("Could not download. Please try again.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 text-emerald-600 animate-spin" /></div>;
  if (!pkg) return <div>Package not found</div>;

  return (
    <div className="bg-white min-h-screen pb-20 font-poppins text-slate-800">

      {/* Hero Section */}
      <div className="relative h-[50vh] sm:h-[60vh] w-full overflow-hidden">
        <img src={pkg.image} alt={pkg.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute bottom-0 left-0 p-4 sm:p-8 text-white max-w-7xl mx-auto w-full">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black mb-2 leading-tight">{pkg.title}</h1>
          <p className="text-base sm:text-xl opacity-90">{pkg.duration} • {pkg.location}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-0 lg:px-0 py-8 sm:py-12 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8">

        {/* --- LEFT COLUMN --- */}
        <div className="lg:col-span-9 space-y-12 sm:space-y-16">
          <section>
            <h2 className="text-2xl sm:text-3xl font-black mb-4 sm:mb-6">Overview</h2>
            <p className="text-slate-600 leading-relaxed text-base sm:text-lg whitespace-pre-line">{pkg.description}</p>
          </section>

          <section>
            <h2 className="text-2xl sm:text-3xl font-black mb-6 sm:mb-10 text-center">Itinerary Details</h2>
            <div className="space-y-12 md:space-y-16 relative">
              <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-emerald-100 rounded-full"></div>
              {pkg.itinerary.map((day, index) => {
                const isEven = index % 2 === 0;
                const displayImage = day.image || (pkg.gallery && pkg.gallery[index % pkg.gallery.length]) || pkg.image;
                const activityList = day.activities ? day.activities.split(',').map(act => act.trim()).filter(Boolean) : [];

                return (
                  <div key={index} className={`flex flex-col md:flex-row items-center justify-between w-full relative ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                    <div className="w-full md:w-5/12 bg-white p-0 rounded-3xl shadow-lg border border-slate-100 relative z-10 mb-6 md:mb-0">
                      <span className="text-xl font-black uppercase tracking-widest text-emerald-600 mb-2 block">Day {day.day}</span>
                      <h3 className="text-xl sm:text-2xl font-black mb-3">{day.title}</h3>
                      <p className="text-slate-600 text-sm leading-relaxed">{day.description}</p>
                      
                      <div className="grid grid-cols-2 gap-3 mt-4">
                        <div className="flex items-center gap-3 bg-purple-50/50 p-3 rounded-2xl">
                          <div className="w-10 h-10 rounded-full bg-emerald-200 flex items-center justify-center text-emerald-600 shrink-0"><Hotel className="w-5 h-5" /></div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-500 uppercase truncate">Stay At</div>
                            <div className="font-bold text-slate-800 text-sm truncate">{day.hotel || 'Not set'}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 bg-emerald-50/50 p-3 rounded-2xl">
                          <div className="w-10 h-10 rounded-full bg-emerald-200 flex items-center justify-center text-emerald-600 shrink-0"><BedDouble className="w-5 h-5" /></div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-500 uppercase truncate">Room Type</div>
                            <div className="font-bold text-slate-800 text-sm truncate">{day.roomType || 'Standard'}</div>
                          </div>
                        </div>
                      </div>

                      {activityList.length > 0 && (
                        <div className="relative mt-8">
                          <div className="absolute -top-5 left-0 bg-emerald-500 text-white px-6 py-2.5 rounded-full shadow-lg shadow-emerald-200 flex items-center gap-2 z-10">
                            <Star className="w-4 h-4 fill-current" />What You'll Experience
                          </div>
                          <div className="bg-slate-100 rounded-3xl p-6 pt-8 mt-2">
                            <ul className="space-y-3 mt-2">
                              {activityList.map((act, i) => (
                                <li key={i} className="flex items-start gap-3 text-slate-700">
                                  <div className="w-2 h-2 mt-2 rounded-full bg-emerald-500 shrink-0" />
                                  <span className="font-sm text-sm">{act}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="hidden md:flex absolute left-1/2 transform -translate-x-1/2 items-center justify-center w-8 h-8 bg-emerald-500 rounded-full z-20 border-4 border-white shadow"></div>
                    <div className="w-full md:w-5/12 h-48 sm:h-64 rounded-3xl overflow-hidden shadow-xl relative z-10">
                      <img src={displayImage} alt={`Day ${day.day}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section id="reviews">
            <ReviewList reviews={reviews} />
          </section>
        </div>

        {/* --- RIGHT COLUMN --- */}
        <div className="lg:col-span-3">
          <div className="sticky top-24 space-y-6">
            <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-100 space-y-4">
              <div>
                <div className="text-3xl sm:text-4xl font-black text-emerald-600 mb-2">${pkg.price}</div>
                <p className="text-slate-500 mb-2">per person</p>
              </div>
              <button
                onClick={handleDownload}
                disabled={isGeneratingPdf}
                className="w-full py-3 sm:py-4 bg-emerald-600 text-white font-bold rounded-full border-2 border-emerald-100 hover:bg-emerald-700 hover:border-emerald-200 transition-all text-base sm:text-lg flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGeneratingPdf ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileDown className="w-5 h-5 group-hover:scale-110 transition-transform" />}
                {isGeneratingPdf ? "Generating..." : "Download Itinerary"}
              </button>
              <ReviewSection reviews={reviews} onReviewClick={handleReviewButtonClick} />
            </div>
          </div>
        </div>
      </div>

      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        packageId={pkg._id}
        onReviewAdded={handleReviewAdded}
      />

      {/* ==================================================================================== */}
      {/* HIDDEN PRINT TEMPLATE - This is what generates the PDF */}
      {/* ==================================================================================== */}
      <div 
        ref={pdfRef} 
        className="absolute left-[-9999px] top-0 w-[794px] min-h-[1123px] bg-white p-10 font-poppins text-slate-800 flex flex-col"
      >
        {/* Header */}
        <div className="mb-8 border-b-2 border-emerald-500 pb-6">
          <div className="flex justify-between items-start">
            <h1 className="text-4xl font-black text-emerald-800 mb-2 max-w-[70%]">{pkg.title}</h1>
            {/* Added a logo placeholder or company name if needed */}
            
          </div>
          
          <div className="flex items-center gap-6 text-slate-600 font-medium mt-2">
            <span className="flex items-center gap-2"><Calendar className="w-5 h-5 text-emerald-600"/> {pkg.duration}</span>
            <span className="flex items-center gap-2"><MapPin className="w-5 h-5 text-emerald-600"/> {pkg.location}</span>
          </div>
        </div>

        <style>
        {`
          @media print {
            .pdf-page-break-avoid {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              -webkit-column-break-inside: avoid !important;
              display: block; /* Flex භාවිතා කරන විට සමහර විට අවුල් විය හැක, ඒ නිසා block දමමු */
            }
          }
          /* html2canvas සඳහා print media query එකෙන් පිටතත් මෙය අවශ්‍ය විය හැක */
          .pdf-page-break-avoid {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              -webkit-column-break-inside: avoid !important;
          }
        `}
      </style>

        {/* Hero Image in PDF */}
        <div className="w-full h-[350px] rounded-3xl overflow-hidden mb-8 shadow-sm border border-slate-100">
          <img src={pkg.image} alt="Main" className="w-full h-full object-cover" />
        </div>

        {/* Overview */}
        <div className="mb-8 bg-emerald-50/30 p-8 rounded-2xl border border-emerald-100">
          <h2 className="text-2xl font-bold mb-3 text-emerald-800">Trip Overview</h2>
          <p className="text-slate-700 leading-relaxed whitespace-pre-line text-justify">{pkg.description}</p>
        </div>

        {/* Itinerary Days */}
        <div className="space-y-8 flex-grow">
          <h2 className="text-2xl font-bold mb-6 text-emerald-800 border-b border-slate-200 pb-2">Detailed Itinerary</h2>
          
          {pkg.itinerary.map((day, idx) => {
            const displayImage = day.image || (pkg.gallery && pkg.gallery[idx % pkg.gallery.length]) || pkg.image;
            const activityList = day.activities ? day.activities.split(',').map(act => act.trim()).filter(Boolean) : [];

            return (
              <div key={idx} className="flex gap-6 mb-16 pb-4 relative pdf-page-break-avoid">
                 {/* Timeline Line (Visual only) */}
                 {idx !== pkg.itinerary.length - 1 && (
                    <div className="absolute left-[31px] top-16 bottom-[-40px] w-[2px] bg-slate-200"></div>
                 )}

                 {/* Day Number */}
                <div className="flex-shrink-0 z-10">
                   <div className="w-16 h-16 bg-emerald-600 text-white rounded-2xl flex items-center justify-center flex-col shadow-md border-4 border-white ring-1 ring-emerald-100">
                      <span className="text-xs font-bold uppercase opacity-80">Day</span>
                      <span className="text-2xl font-black">{day.day}</span>
                   </div>
                </div>

                {/* Content */}
                <div className="flex-grow pt-1">
                  <h3 className="text-xl font-bold text-slate-800 mb-3">{day.title}</h3>
                  
                  {/* Image & Text Grid */}
                  <div className="grid grid-cols-12 gap-4 mb-4">
                     <div className="col-span-4 h-32 rounded-xl overflow-hidden border border-slate-100 shadow-sm">
                        <img src={displayImage} className="w-full h-full object-cover" alt="Day Img"/>
                     </div>
                     <div className="col-span-8 text-sm text-slate-600 leading-relaxed text-justify flex items-center">
                        {day.description}
                     </div>
                  </div>
                  
                  {/* Details Box */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 grid grid-cols-2 gap-4 shadow-sm">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                           <Hotel className="w-4 h-4"/> 
                         </div>
                         <div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase">Accommodation</div>
                            <div className="text-sm font-bold text-slate-800">{day.hotel}</div>
                         </div>
                      </div>
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                           <BedDouble className="w-4 h-4"/> 
                         </div>
                         <div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase">Room Type</div>
                            <div className="text-sm font-bold text-slate-800">{day.roomType}</div>
                         </div>
                      </div>
                  </div>
                  
                  {/* Activities Tags */}
                  {activityList.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                        {activityList.map((act, i) => (
                           <span key={i} className="bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full text-xs font-semibold text-emerald-700">
                              • {act}
                           </span>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        {/* Footer */}
        <div className="mt-10 pt-6 border-t-2 border-emerald-500 flex justify-between items-center text-slate-400 text-sm">
            <div>{pkg.title} - {pkg.location}</div>
            <div>Generated on {new Date().toLocaleDateString()}</div>
        </div>
      </div>

    </div>
  );
};

export default PackageDetails;