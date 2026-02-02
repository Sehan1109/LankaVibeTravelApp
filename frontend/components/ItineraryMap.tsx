import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleMap, DirectionsRenderer, Marker, InfoWindow } from '@react-google-maps/api';
import { Map as MapIcon, Navigation, Clock, Tag } from 'lucide-react';

// Modified to 100% height so the parent div controls responsiveness
const containerStyle = {
  width: '100%',
  height: '100%', 
  borderRadius: '1rem'
};

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

const ItineraryMap: React.FC<ItineraryMapProps> = ({ locations, days, isLoaded, startPoint }) => {
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [distanceInfo, setDistanceInfo] = useState<{ distance: string, duration: string } | null>(null);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [selectedMarker, setSelectedMarker] = useState<MarkerData | null>(null);
  
  const processedRef = useRef<Set<string>>(new Set());

  // --- 1. CALCULATE ROUTE ---
  const calculateRoute = useCallback(() => {
    if (!isLoaded || locations.length < 1 || !window.google) return;

    const directionsService = new google.maps.DirectionsService();
    
    // Helper to format location strings for Google API
    const formatLoc = (loc: string) => loc.length > 20 || loc.toLowerCase().includes("sri lanka") ? loc : `${loc}, Sri Lanka`;

    // 1. Determine Origin
    const hasStartPoint = !!startPoint && startPoint.trim() !== "";
    const origin = hasStartPoint ? formatLoc(startPoint!) : formatLoc(locations[0]);
    
    // 2. Determine Destination (Last City)
    const destination = formatLoc(locations[locations.length - 1]);
    
    // 3. Determine Waypoints (All stops in between)
    let waypoints: google.maps.DirectionsWaypoint[] = [];

    if (hasStartPoint) {
        // Route: Start Point -> City 1 -> City 2 ... -> City N-1 -> Destination
        // So we add ALL locations except the very last one as waypoints
        waypoints = locations.slice(0, -1).map(loc => ({
            location: formatLoc(loc),
            stopover: true
        }));
    } else {
        // Fallback: City 1 -> City 2 ...
        waypoints = locations.slice(1, -1).map(loc => ({
            location: formatLoc(loc),
            stopover: true
        }));
    }

    directionsService.route(
      {
        origin: origin,
        destination: destination,
        waypoints: waypoints,
        travelMode: google.maps.TravelMode.DRIVING,
        region: 'LK' 
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          setDirections(result);
          
          let totalDist = 0; let totalDur = 0;
          result.routes[0].legs.forEach(leg => {
            totalDist += leg.distance?.value || 0;
            totalDur += leg.duration?.value || 0;
          });
          
          setDistanceInfo({
            distance: `${(totalDist / 1000).toFixed(0)} km`,
            duration: `${Math.floor(totalDur / 3600)}h ${Math.floor((totalDur % 3600) / 60)}m`
          });
        } else {
           console.error("Routing failed:", status);
        }
      }
    );
  }, [isLoaded, locations, startPoint]);

  // --- 2. FETCH MARKERS ---
  useEffect(() => {
    if (!mapInstance || !days || !window.google) return;

    setMarkers([]); 
    processedRef.current.clear(); 

    const service = new google.maps.places.PlacesService(mapInstance);
    let isMounted = true;
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    const findPlace = (query: string) => {
      return new Promise<google.maps.places.PlaceResult | null>((resolve) => {
        service.findPlaceFromQuery({ query, fields: ['name', 'geometry'] }, (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results && results[0]) resolve(results[0]);
          else resolve(null);
        });
      });
    };

    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const fetchAllMarkers = async () => {
      // 1. Start Point Marker (S)
      if (startPoint && startPoint.trim() !== "" && !processedRef.current.has('start-point')) {
         processedRef.current.add('start-point');
         const place = await findPlace(startPoint); // Use raw string for accuracy
         if (place?.geometry?.location && isMounted) {
            setMarkers(prev => [{
               id: 'start-point',
               position: { lat: place.geometry!.location!.lat(), lng: place.geometry!.location!.lng() },
               title: "Start: " + startPoint,
               category: "Start",
               day: 0,
               label: "S",
               isActivity: false
            }, ...prev]);
         }
      }

      // 2. Main Day Locations (A, B, C...)
      for (let i = 0; i < days.length; i++) {
         if (!isMounted) break;
         const day = days[i];
         const cityKey = `city-${day.day}`;
         
         if (!processedRef.current.has(cityKey)) {
             processedRef.current.add(cityKey);
             const cityPlace = await findPlace(`${day.location}, Sri Lanka`);
             const mainCategory = day.detailedActivities?.[0]?.category || 'General';

             if (cityPlace?.geometry?.location && isMounted) {
                setMarkers(prev => [...prev, {
                   id: cityKey,
                   position: { lat: cityPlace.geometry!.location!.lat(), lng: cityPlace.geometry!.location!.lng() },
                   title: `Day ${day.day}: ${day.location}`,
                   category: mainCategory,
                   day: day.day,
                   label: alphabet[i % alphabet.length],
                   isActivity: false
                }]);
             }
         }
         await delay(150);

         // 3. Activity Dots (Colored, no label)
         const activities = day.detailedActivities ? day.detailedActivities.slice(0, 3) : [];
         for (const activity of activities) {
            if (!isMounted) break;
            const actKey = `act-${day.day}-${activity.name}`;
            if (processedRef.current.has(actKey)) continue;
            processedRef.current.add(actKey);

            const actPlace = await findPlace(`${activity.name} in ${day.location}, Sri Lanka`);
            if (actPlace?.geometry?.location && isMounted) {
               setMarkers(prev => [...prev, {
                 id: actKey,
                 position: { lat: actPlace.geometry!.location!.lat(), lng: actPlace.geometry!.location!.lng() },
                 title: activity.name,
                 category: activity.category || 'General',
                 day: day.day,
                 label: undefined,
                 isActivity: true
               }]);
            }
            await delay(150);
         }
      }
    };

    fetchAllMarkers();
    return () => { isMounted = false; };
  }, [mapInstance, days, startPoint]); 

  useEffect(() => { calculateRoute(); }, [calculateRoute]);

  // Responsive Loading State
  if (!isLoaded) return <div className="h-[300px] sm:h-[400px] md:h-[500px] bg-gray-100 rounded-[1.5rem] flex items-center justify-center text-sm sm:text-base">Loading Map...</div>;

  return (
    // Responsive outer container padding
    <div className="bg-white p-3 sm:p-4 rounded-[1.5rem] sm:rounded-[2rem] shadow-sm border border-emerald-50 mb-8 relative group">
      
      {/* Header: Flex-col on mobile, Row on larger screens */}
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

      {/* Map Wrapper: Responsive Height (300px on mobile -> 500px on desktop) */}
      <div className="rounded-[1rem] sm:rounded-[1.5rem] overflow-hidden border border-gray-100 relative h-[300px] sm:h-[400px] md:h-[500px]">
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={7.5}
          onLoad={(map) => setMapInstance(map)} 
          options={{
            disableDefaultUI: false,
            zoomControl: true,
            fullscreenControl: false, // Optional: clearer on mobile
            streetViewControl: false, // Optional: clearer on mobile
            mapTypeControl: false, // Optional: cleaner look
            styles: [{ featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] }]
          }}
        >
          {directions && (
            <DirectionsRenderer
              directions={directions}
              options={{
                suppressMarkers: true,
                polylineOptions: { strokeColor: '#059669', strokeWeight: 5, strokeOpacity: 0.7 }
              }}
            />
          )}

          {markers.map((marker) => (
            <Marker
              key={marker.id}
              position={marker.position}
              onClick={() => setSelectedMarker(marker)}
              zIndex={marker.isActivity ? 1 : 10}
              label={marker.label ? {
                text: marker.label, 
                color: "white",
                fontWeight: "bold",
                fontSize: "14px"
              } : undefined}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: getCategoryColor(marker.category), 
                fillOpacity: 1,
                strokeWeight: 2,
                strokeColor: "white", 
                scale: marker.label ? 16 : 7 
              }}
            />
          ))}

          {selectedMarker && (
            <InfoWindow
              position={selectedMarker.position}
              onCloseClick={() => setSelectedMarker(null)}
            >
              <div className="p-1 sm:p-2 min-w-[160px] sm:min-w-[200px] max-w-[250px]">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="bg-gray-100 text-gray-600 text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full uppercase whitespace-nowrap">
                      {selectedMarker.label === 'S' ? 'Start' : `Day ${selectedMarker.day}`}
                  </span>
                  <span 
                    className="text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full uppercase text-white whitespace-nowrap"
                    style={{ backgroundColor: getCategoryColor(selectedMarker.category) }}
                  >
                    {selectedMarker.category}
                  </span>
                </div>
                <h4 className="font-bold text-gray-900 mb-1 text-xs sm:text-sm">{selectedMarker.title}</h4>
                {selectedMarker.isActivity && (
                   <div className="flex items-center gap-1 text-[10px] sm:text-xs text-gray-500 mt-1">
                     <Tag className="w-3 h-3" /> {selectedMarker.category}
                   </div>
                )}
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </div>
    </div>
  );
};

export default ItineraryMap;