import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { GoogleMap, DirectionsRenderer, Marker, InfoWindow } from '@react-google-maps/api';
import { Map as MapIcon, Navigation, Clock, Tag, Minimize2, Maximize2, X, MapPin, Calendar, Star, MapPinned, User } from 'lucide-react';

const center = { lat: 7.8731, lng: 80.7718 };

// --- Interfaces ---
interface ActivityDetail { name: string; category: string; }
interface DayData {
  day: number;
  location: string;
  detailedActivities?: ActivityDetail[];
  activities?: string[];
  description: string;
}

interface ItineraryMapProps {
  locations: string[]; 
  days: DayData[];     
  isLoaded: boolean;
  startPoint?: string;
  focusedDayIndex?: number | null;
  selectedActivity?: any;
  onCloseActivity?: () => void;
  activityOverrides?: Record<number, any[]>;
}

interface MarkerData {
  id: string;
  position: google.maps.LatLngLiteral;
  title: string;
  category: string;
  day: number | string;
  label?: string; 
  isActivity: boolean;
}

const getCategoryColor = (category: string) => {
  const cat = (category || '').toLowerCase();
  if (cat.includes('nature')) return '#16A34A';    
  if (cat.includes('culture') || cat.includes('history')) return '#EA580C'; 
  if (cat.includes('adventure')) return '#DC2626'; 
  if (cat.includes('relax')) return '#2563EB';     
  if (cat.includes('food')) return '#9333EA';      
  if (cat.includes('shop')) return '#DB2777';      
  if (cat.includes('start')) return '#000000';     
  return '#F59E0B'; 
};

const ItineraryMap: React.FC<ItineraryMapProps> = ({ 
    locations, days, isLoaded, startPoint, focusedDayIndex,
    selectedActivity, onCloseActivity,
    activityOverrides 
}) => {
  const [distanceInfo, setDistanceInfo] = useState<{ distance: string, duration: string } | null>(null);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [selectedMarker, setSelectedMarker] = useState<MarkerData | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [directionsResponse, setDirectionsResponse] = useState<google.maps.DirectionsResult | null>(null);
  
  // Details & Reviews State
  const [placeDetails, setPlaceDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Cache
  const locationCache = useRef<Map<string, google.maps.LatLngLiteral>>(new Map());
  
  // Ref to track previous locations
  const prevLocationsRef = useRef<string>('');

  // Memoized Options
  const directionsOptions = useMemo(() => ({
      suppressMarkers: true,
      preserveViewport: true, 
      polylineOptions: { strokeColor: '#059669', strokeWeight: 5, strokeOpacity: 0.7 }
  }), []);

  // 🔥 Map Container Style (Dynamic based on fullscreen)
  const containerStyle = useMemo(() => ({
    width: '100%',
    height: '100%', 
    borderRadius: isFullscreen ? '0px' : '1rem' // Remove radius in fullscreen
  }), [isFullscreen]);

  // --- 1. CALCULATE ROUTE ---
  const calculateRoute = useCallback(() => {
    if (!isLoaded || locations.length < 1 || !window.google) return;

    const currentLocString = JSON.stringify(locations) + startPoint;
    if (prevLocationsRef.current === currentLocString && directionsResponse) {
        return; 
    }

    const directionsService = new google.maps.DirectionsService();
    const formatLoc = (loc: string) => loc.length > 20 || loc.toLowerCase().includes("sri lanka") ? loc : `${loc}, Sri Lanka`;
    const origin = startPoint ? formatLoc(startPoint) : formatLoc(locations[0]);
    const destination = formatLoc(locations[locations.length - 1]);
    const waypoints = locations.slice(startPoint ? 0 : 1, -1).map(loc => ({ location: formatLoc(loc), stopover: true }));

    directionsService.route(
      { origin, destination, waypoints, travelMode: google.maps.TravelMode.DRIVING, region: 'LK' },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          setDirectionsResponse(result);
          prevLocationsRef.current = currentLocString; 

          if (mapInstance && !prevLocationsRef.current) {
             const bounds = result.routes[0]?.bounds;
             if (bounds) mapInstance.fitBounds(bounds);
          }

          let totalDist = 0; let totalDur = 0;
          result.routes[0].legs.forEach(leg => {
            totalDist += leg.distance?.value || 0;
            totalDur += leg.duration?.value || 0;
          });
          setDistanceInfo({
            distance: `${(totalDist / 1000).toFixed(0)} km`,
            duration: `${Math.floor(totalDur / 3600)}h ${Math.floor((totalDur % 3600) / 60)}m`
          });
        }
      }
    );
  }, [isLoaded, locations, startPoint, mapInstance, directionsResponse]);

  // --- 2. FETCH MARKERS ---
  useEffect(() => {
    if (!mapInstance || !days || !window.google) return;
    setMarkers([]); 
    
    let isMounted = true;
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    const fetchPlaceLocation = async (query: string) => {
        if (locationCache.current.has(query)) return locationCache.current.get(query);
        try {
            const { Place } = await google.maps.importLibrary("places") as google.maps.PlacesLibrary;
            const { places } = await Place.searchByText({ textQuery: query, fields: ['location'], maxResultCount: 1 });
            const loc = places[0]?.location;
            if (loc) {
                const latLng = { lat: loc.lat(), lng: loc.lng() };
                locationCache.current.set(query, latLng);
                return latLng;
            }
        } catch (error) { console.error(error); }
        return null;
    };

    const fetchAllMarkers = async () => {
       if (startPoint) {
           const loc = await fetchPlaceLocation(startPoint);
           if(loc && isMounted) {
               setMarkers(prev => [{ 
                   id: 'start', position: loc, title: "Start: " + startPoint, 
                   category: "Start", day: 0, label: "S", isActivity: false 
               }, ...prev]);
           }
       }

       for (let i = 0; i < days.length; i++) {
           if(!isMounted) break;
           const day = days[i];
           const cityQuery = `${day.location}, Sri Lanka`;
           
           const loc = await fetchPlaceLocation(cityQuery);
           if(loc && isMounted) {
               setMarkers(prev => [...prev, { 
                   id: `city-${day.day}-${i}`, 
                   position: loc, 
                   title: `Day ${day.day}: ${day.location}`, 
                   category: 'City', 
                   day: day.day, 
                   label: alphabet[i % alphabet.length], 
                   isActivity: false 
               }]);
           }
           
           const activitiesToShow = (activityOverrides && activityOverrides[i]) 
                ? activityOverrides[i] 
                : (day.detailedActivities ? day.detailedActivities.slice(0,3) : []);

           for(const activity of activitiesToShow) {
               const actName = typeof activity === 'string' ? activity : activity.name;
               const actCategory = typeof activity === 'object' && activity.category ? activity.category : 'Sightseeing';
               const actQuery = `${actName} in ${day.location}, Sri Lanka`;
               const actLoc = await fetchPlaceLocation(actQuery);
               
               if(actLoc && isMounted) {
                   setMarkers(prev => [...prev, { 
                       id: `act-${day.day}-${actName}`, 
                       position: actLoc, 
                       title: actName, 
                       category: actCategory, 
                       day: day.day, 
                       label: undefined, 
                       isActivity: true 
                   }]);
               }
           }
       }
    };
    
    fetchAllMarkers();
    return () => { isMounted = false; };
  }, [mapInstance, days, startPoint, activityOverrides]);

  useEffect(() => { calculateRoute(); }, [calculateRoute]);


  // --- 3. FOCUS ON DAY CLICK ---
  useEffect(() => {
    if (mapInstance && focusedDayIndex !== undefined && focusedDayIndex !== null && days.length > 0 && markers.length > 0) {
        
        const targetDay = days[focusedDayIndex];
        
        if (targetDay) {
            const cityMarker = markers.find(m => m.day === targetDay.day && m.category === 'City');
            
            if (cityMarker) {
                mapInstance.panTo(cityMarker.position);
                mapInstance.setZoom(13); 
                setSelectedMarker(cityMarker); 
            } else {
                const anyDayMarker = markers.find(m => m.day === targetDay.day);
                if (anyDayMarker) {
                    mapInstance.panTo(anyDayMarker.position);
                    mapInstance.setZoom(12);
                    setSelectedMarker(anyDayMarker);
                }
            }
        }
    }
  }, [focusedDayIndex, mapInstance, markers, days]);


  // --- 4. FETCH REVIEWS & DETAILS ---
  useEffect(() => {
    if (!mapInstance || !selectedActivity) {
        setPlaceDetails(null);
        return;
    }

    setLoadingDetails(true);
    setPlaceDetails(null);

    const targetMarker = markers.find(m => m.title === selectedActivity.name);
    if (targetMarker) {
        mapInstance.panTo(targetMarker.position);
        mapInstance.setZoom(15);
        setSelectedMarker(targetMarker);
    } 

    const fetchDetails = async () => {
        try {
            if (!window.google) return;
            const { Place } = await google.maps.importLibrary("places") as google.maps.PlacesLibrary;

            const request = {
                textQuery: `${selectedActivity.name} in ${selectedActivity.dayLocation}, Sri Lanka`,
                fields: ['displayName', 'formattedAddress', 'rating', 'userRatingCount', 'photos', 'reviews'],
                maxResultCount: 1
            };

            const { places } = await Place.searchByText(request);

            if (places.length > 0) {
                const place = places[0];
                // @ts-ignore
                const processedReviews = place.reviews?.slice(0, 3).map((r: any) => ({
                    author: r.authorAttribution?.displayName || "Anonymous",
                    photo: r.authorAttribution?.photoUri || null,
                    text: r.text || "No comment",
                    rating: r.rating,
                    time: r.relativePublishTimeDescription
                })) || [];

                setPlaceDetails({
                    formatted_address: place.formattedAddress,
                    rating: place.rating,
                    user_ratings_total: place.userRatingCount,
                    photoUrl: place.photos && place.photos.length > 0 
                        ? place.photos[0].getURI({ maxWidth: 500, maxHeight: 400 }) 
                        : null,
                    reviews: processedReviews
                });
            }
        } catch (err) {
            console.error("Failed to fetch activity details:", err);
        } finally {
            setLoadingDetails(false);
        }
    };

    fetchDetails();
  }, [selectedActivity, mapInstance, markers]);


  const onLoad = useCallback((map: google.maps.Map) => setMapInstance(map), []);
  const onUnmount = useCallback(() => setMapInstance(null), []);

  if (!isLoaded) return <div className="h-[400px] bg-gray-100 rounded-2xl flex items-center justify-center">Loading...</div>;

  return (
    <div className={`bg-white p-3 rounded-2xl shadow-sm border border-emerald-50 mb-8 relative flex flex-col transition-all duration-300 ${isFullscreen ? 'fixed inset-0 z-[5000] w-screen h-screen m-0 rounded-none' : 'h-full'}`}>
       
      {/* Map Header (Only show if NOT fullscreen to save space) */}
      {!isFullscreen && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 sm:mb-4 px-1 sm:px-2 gap-2 sm:gap-0">
            <h3 className="font-black text-gray-800 flex items-center gap-2 text-base sm:text-lg">
            <MapIcon className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" /> Trip Overview
            </h3>
            {distanceInfo && (
            <div className="w-full sm:w-auto flex justify-between sm:justify-start gap-4 text-[10px] sm:text-xs font-bold bg-emerald-50 px-3 py-1.5 sm:py-1 rounded-full text-emerald-800">
                <span className="flex items-center gap-1"><Navigation className="w-3 h-3"/> {distanceInfo.distance}</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> {distanceInfo.duration} driving</span>
            </div>
            )}
        </div>
      )}

      {/* Map Container */}
      <div className={`transition-all duration-300 ease-in-out ${
          isFullscreen 
          ? 'fixed inset-0 z-[9999] w-screen h-screen bg-white' // 🔥 Fullscreen Styles
          : 'relative rounded-2xl overflow-hidden flex-grow h-full min-h-[500px]' // 🔥 Normal Styles
      }`}>
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={7.5}
          onLoad={onLoad}
          onUnmount={onUnmount}
          options={{ mapId: "DEMO_MAP_ID", disableDefaultUI: false }}
        >
          {directionsResponse && (
            <DirectionsRenderer 
                directions={directionsResponse} 
                options={directionsOptions}
            />
          )}
          
          {markers.map((marker) => (
             <Marker 
                key={marker.id} 
                position={marker.position} 
                zIndex={marker.isActivity ? 1 : 10}
                label={marker.label ? { text: marker.label, color: "white", fontWeight: "bold", fontSize: "14px" } : undefined}
                icon={{ 
                    path: google.maps.SymbolPath.CIRCLE, 
                    scale: marker.isActivity ? 6 : 16, 
                    fillColor: getCategoryColor(marker.category), 
                    fillOpacity: 1, 
                    strokeColor: 'white', 
                    strokeWeight: 2 
                }} 
                onClick={() => setSelectedMarker(marker)} 
             />
          ))}

          {selectedMarker && (
            <InfoWindow position={selectedMarker.position} onCloseClick={() => setSelectedMarker(null)}>
               <div className="p-2 min-w-[150px]">
                 <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: getCategoryColor(selectedMarker.category) }}>
                        {selectedMarker.category}
                    </span>
                 </div>
                 <h4 className="font-bold text-gray-900 text-sm">{selectedMarker.title}</h4>
               </div>
            </InfoWindow>
          )}
        </GoogleMap>

        {selectedActivity && (
            <div className="absolute bottom-4 left-4 right-4 sm:left-6 sm:right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
                <div className="bg-white rounded-xl shadow-2xl border border-gray-100 max-w-3xl mx-auto flex flex-col md:flex-row overflow-hidden max-h-[60vh] md:max-h-[350px]">
                    <button onClick={onCloseActivity} className="absolute top-2 right-2 p-1 bg-white/80 hover:bg-red-50 rounded-full z-20">
                        <X className="w-5 h-5 text-gray-500 hover:text-red-500" />
                    </button>
                    <div className="w-full md:w-5/12 h-40 md:h-auto bg-gray-100 relative shrink-0">
                        {loadingDetails ? (
                            <div className="w-full h-full flex items-center justify-center"><div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>
                        ) : placeDetails?.photoUrl ? (
                            <img src={placeDetails.photoUrl} alt="Location" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50"><MapIcon className="w-8 h-8 mb-2 opacity-20"/> <span className="text-xs font-bold uppercase">No Image</span></div>
                        )}
                        {!loadingDetails && placeDetails?.rating && (
                            <div className="absolute bottom-2 left-2 bg-black/60 text-white px-2 py-1 rounded text-xs font-bold flex items-center gap-1 backdrop-blur-sm">
                                <Star className="w-3 h-3 text-yellow-400 fill-current" /> {placeDetails.rating} <span className="opacity-70">({placeDetails.user_ratings_total})</span>
                            </div>
                        )}
                    </div>
                    <div className="flex-1 flex flex-col p-4 md:p-5 overflow-hidden">
                        <div className="mb-4">
                            <h3 className="text-lg font-black text-gray-900 mb-1">{selectedActivity.name}</h3>
                            <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                                <MapPin className="w-3 h-3 text-emerald-600" /> 
                                <span className="truncate max-w-[200px]">{placeDetails?.formatted_address || selectedActivity.dayLocation}</span>
                            </div>
                            <p className="text-xs text-gray-600 line-clamp-2">{selectedActivity.description}</p>
                        </div>
                        <div className="flex-1 overflow-y-auto pr-1">
                            <h4 className="text-xs font-bold text-gray-800 uppercase mb-2 sticky top-0 bg-white z-10 py-1">Recent Reviews</h4>
                            {loadingDetails ? (
                                <div className="space-y-2 opacity-50 animate-pulse"><div className="h-10 bg-gray-100 rounded"></div><div className="h-10 bg-gray-100 rounded"></div></div>
                            ) : placeDetails?.reviews && placeDetails.reviews.length > 0 ? (
                                <div className="space-y-3">
                                    {placeDetails.reviews.map((review: any, idx: number) => (
                                        <div key={idx} className="bg-gray-50 p-2 rounded-lg text-xs border border-gray-100">
                                            <div className="flex items-center gap-2 mb-1">
                                                {review.photo ? <img src={review.photo} alt={review.author} className="w-5 h-5 rounded-full" /> : <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center text-[8px] font-bold text-emerald-700">{review.author.charAt(0)}</div>}
                                                <span className="font-bold text-gray-700 truncate max-w-[100px]">{review.author}</span>
                                                <div className="flex items-center ml-auto"><Star className="w-2.5 h-2.5 text-yellow-500 fill-current" /><span className="font-bold ml-0.5 text-gray-600">{review.rating}</span></div>
                                            </div>
                                            <p className="text-gray-600 leading-snug line-clamp-3 italic">"{review.text}"</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-4 text-xs text-gray-400 bg-gray-50 rounded border border-dashed border-gray-200">No reviews available.</div>
                            )}
                        </div>
                        <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedActivity.name + " " + selectedActivity.dayLocation + " Sri Lanka")}`} target="_blank" rel="noreferrer" className="mt-3 block w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold text-center rounded-lg transition-colors">
                            View on Google Maps
                        </a>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default ItineraryMap;