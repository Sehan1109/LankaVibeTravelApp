// backend/controllers/priceController.js
import { getJson } from "serpapi";
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import VehiclePrice from '../models/VehiclePrice.js';
import FuelPrice from '../models/FuelPrice.js';
dotenv.config();

const SERP_API_KEY = process.env.SERPAPI_API_KEY;

// ---------------------------------------------------------
// 🔥 CACHING SYSTEM 
// ---------------------------------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CACHE_FILE_PATH = path.join(__dirname, 'api_cache.json');

const readCache = () => {
    try {
        if (fs.existsSync(CACHE_FILE_PATH)) {
            const data = fs.readFileSync(CACHE_FILE_PATH, 'utf8');
            return JSON.parse(data);
        }
    } catch (err) {
        console.error("Error reading cache:", err);
    }
    return {};
};

// 3. Cache එකට ලිවීම (Write Cache)
const writeCache = (data) => {
    try {
        fs.writeFileSync(CACHE_FILE_PATH, JSON.stringify(data, null, 2), 'utf8');
    } catch (err) {
        console.error("Error writing cache:", err);
    }
};

// ---------------------------------------------------------
// HELPER FUNCTIONS (API Calls)
// ---------------------------------------------------------

//Helper to wrap SerpApi
const fetchSerpApi = (params) => {
    return new Promise((resolve, reject) => {
        const cacheKey = `${params.engine}_${params.q}`;

        // B. CACHE CHECK කිරීම
        const cache = readCache();
        const CACHE_DURATION = 30 * 24 * 60 * 60 * 1000;

        if (cache[cacheKey]) {
            const cachedItem = cache[cacheKey];
            const now = Date.now();

            if (cachedItem.timestamp && (now - cachedItem.timestamp < CACHE_DURATION)) {
                console.log(`⚡ Serving from CACHE (Valid): ${params.q.substring(0, 30)}...`);
                return resolve(cachedItem.data); // data object එක විතරක් යවනවා
            } else {
                console.log(`⌛ Cache Expired for: ${params.q.substring(0, 30)}...`);
                // මාසයකට වඩා පරණ නම් අලුතෙන් API call එක ගනී
            }
        }

        console.log(`🌐 Calling SERP API: ${params.q.substring(0, 30)}...`);

        // C. API CALL එක ගැනීම (Cache එකේ නැත්නම් විතරයි)
        if (!SERP_API_KEY) {
            return reject("No API Key Provided");
        }

        getJson({ ...params, api_key: SERP_API_KEY }, (json) => {
            if (json.error) {
                console.error("⚠️ API Error:", json.error);
                // Error ආවොත් Cache කරන්නේ නෑ, නිකන්ම reject කරනවා
                reject(json.error);
            } else {
                // D. SUCCESS නම් CACHE එකට SAVE කිරීම
                cache[cacheKey] = {
                    data: json,
                    timestamp: Date.now()
                };
                writeCache(cache); // ෆයිල් එකට ලියනවා
                resolve(json);
            }
        });
    });
};



// ---------------------------------------------------------
// HELPER FUNCTIONS (API Calls - MOCKED FOR DEVELOPMENT)
// ---------------------------------------------------------

// 🔥 DEVELOPMENT MODE: Real SerpApi එක වෙනුවට මේ Fake Function එක පාවිච්චි කරන්න.
// මෙය සැබෑ API call එකක් ගන්නේ නැත, නමුත් code එක වැඩ කිරීමට අවශ්‍ය බොරු data එවයි.
// const fetchSerpApi = (params) => {
//     return new Promise((resolve) => {
//         console.log(`⚠️ DEV MODE: Mocking API for ${params.engine} | Query: ${params.q}`);

//         // 1. HOTELS Mock Data
//         if (params.engine === "google_hotels") {
//             resolve({
//                 properties: [
//                     {
//                         name: "Mock Hotel 1 (Dev Mode)",
//                         rate_per_night: { lowest: "$50" },
//                         overall_rating: 4.5,
//                         images: [{ thumbnail: "https://via.placeholder.com/150" }],
//                         description: "This is a fake hotel for testing.",
//                         link: "#"
//                     },
//                     {
//                         name: "Mock Hotel 2 (Dev Mode)",
//                         rate_per_night: { lowest: "$75" },
//                         overall_rating: 4.0,
//                         images: [{ thumbnail: "https://via.placeholder.com/150" }],
//                         description: "Another fake hotel.",
//                         link: "#"
//                     }
//                 ]
//             });
//         }

//         // 2. TICKETS / GENERAL Mock Data
//         else {
//             resolve({
//                 answer_box: { price: "$15" }, // ටිකට් එකකට $15 වගේ බොරු ගාණක්
//                 knowledge_graph: { ticket_admission: "$20" }
//             });
//         }
//     });
// };

// Google Maps API හරහා නගර දෙක අතර සැබෑ දුර (Km) ලබා ගැනීම සහ Cache කිරීම (කාල සීමාවක් නොමැතිව)
const getRealDistanceBetweenCities = async (origin, destination) => {
    try {
        // 1. නගර වල නම් සකසා ගැනීම
        const safeOrigin = origin.includes("Sri Lanka") ? origin : `${origin}, Sri Lanka`;
        const safeDestination = destination.includes("Sri Lanka") ? destination : `${destination}, Sri Lanka`;

        // 2. Cache Key එක සෑදීම
        const cacheKey = `distance_${safeOrigin.toLowerCase()}_${safeDestination.toLowerCase()}`;

        // 3. Cache එක කියවීම
        const cache = readCache();

        // Cache එකේ දුර තියෙනවා නම්, කාලය නොබලා කෙලින්ම යවන්න
        if (cache[cacheKey] && cache[cacheKey].distance !== undefined) {
            console.log(`⚡ Serving DISTANCE from CACHE (Permanent): ${safeOrigin} to ${safeDestination} -> ${cache[cacheKey].distance} km`);
            return cache[cacheKey].distance;
        }

        // 4. Cache එකේ නැත්නම් පමණක් Google Maps API එකට Call කිරීම
        const API_KEY = process.env.GOOGLE_MAPS_API_KEY;

        if (!API_KEY) {
            console.warn("⚠️ Google Maps API Key is missing. Using default distance (100km).");
            return 100;
        }

        const encodedOrigin = encodeURIComponent(safeOrigin);
        const encodedDestination = encodeURIComponent(safeDestination);
        const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodedOrigin}&destinations=${encodedDestination}&key=${API_KEY}`;

        const response = await fetch(url);
        const data = await response.json();

        const distanceValue = data?.rows?.[0]?.elements?.[0]?.distance?.value;
        const elementStatus = data?.rows?.[0]?.elements?.[0]?.status;

        if (data.status === "OK" && elementStatus === "OK" && distanceValue !== undefined) {
            const distanceInKm = distanceValue / 1000;
            console.log(`📍 Real Distance from API: ${safeOrigin} to ${safeDestination} -> ${distanceInKm} km`);

            // 5. අලුත් දුර Cache එකට Save කිරීම (Timestamp අවශ්‍ය නැත)
            cache[cacheKey] = {
                distance: distanceInKm
            };
            writeCache(cache); // api_cache.json එකට ලියනවා

            return distanceInKm;
        } else {
            console.error(`⚠️ Route Error for ${safeOrigin} to ${safeDestination}: Status ${elementStatus || 'UNKNOWN'}`);
            return 100;
        }
    } catch (error) {
        console.error("Error fetching distance from Google Maps:", error.message);
        return 100;
    }
};

// 1. Transport Cost Calculation
const getRealTransportCost = async (origin, destination, vehicleType) => {
    try {
        // A. Vehicle type එක 'Car (Sedan)' වගේ ආවොත් එය 'Car' විදිහට හදාගැනීම
        let normalizedType = vehicleType;
        if (vehicleType && vehicleType.includes('Car')) {
            normalizedType = 'Car';
        }

        // B. DB එකෙන් වාහනයේ Daily Price එක ගැනීම
        const vehicle = await VehiclePrice.findOne({ type: normalizedType });
        const dailyRate = vehicle ? vehicle.price : 40;

        // C. DB එකෙන් වර්තමාන ඉන්ධන මිල (Petrol සහ Diesel දෙකම) ගැනීම
        const petrolSetting = await FuelPrice.findOne({ key: 'petrol_price_usd' });
        const dieselSetting = await FuelPrice.findOne({ key: 'diesel_price_usd' });

        const petrolPrice = petrolSetting ? petrolSetting.value : 1.10;
        const dieselPrice = dieselSetting ? dieselSetting.value : 1.00;

        // D. වාහනයේ වර්ගය අනුව භාවිතා වන ඉන්ධන වර්ගය සහ කාර්යක්ෂමතාව (Efficiency)
        const efficiencies = {
            'Bike': { kmpl: 45, fuelType: 'petrol' },
            'TukTuk': { kmpl: 22, fuelType: 'petrol' },
            'Car': { kmpl: 14, fuelType: 'petrol' },
            'Van': { kmpl: 9, fuelType: 'diesel' },
            'SUV': { kmpl: 8, fuelType: 'diesel' },
            'MiniBus': { kmpl: 6, fuelType: 'diesel' },
            'LargeBus': { kmpl: 3.5, fuelType: 'diesel' }
        };

        const vehicleStats = efficiencies[normalizedType] || { kmpl: 12, fuelType: 'petrol' };

        const kmPerLiter = vehicleStats.kmpl;
        const fuelPricePerLiter = vehicleStats.fuelType === 'diesel' ? dieselPrice : petrolPrice;

        const safeOrigin = origin || "Colombo";
        const safeDestination = destination || "Kandy";

        const distance = await getRealDistanceBetweenCities(safeOrigin, safeDestination);

        // G. ඉන්ධන වියදම ගණනය කිරීම (අදාළ ඉන්ධන මිල අනුව)
        const fuelNeeded = distance / kmPerLiter;
        const fuelCost = fuelNeeded * fuelPricePerLiter;

        // 🔥 වෙනස් කළ කොටස: මුළු මුදල එකට යවන්නේ නැතිව, වාහන කුලිය සහ ඉන්ධන වියදම වෙන් වෙන්ව යවමු
        return {
            vehicleCost: Math.round(dailyRate),
            fuelCost: Math.round(fuelCost)
        };
    } catch (error) {
        console.error("Transport cost calculation failed:", error);
        // Error එකක් ආවොත් fallback අගයත් object එකක් විදිහටම යවන්න
        return { vehicleCost: 40, fuelCost: 10 };
    }
};

// 2. Hotel Price Calculation (Updated for Star Rating Logic)
const getHotelOptions = async (location, checkInDate, starRating, travelers) => {
    try {
        // 1. Check-In Date
        const startDate = checkInDate ? new Date(checkInDate) : new Date();

        // 2. Check-Out Date (Check-in + 1 Day)
        const nextDay = new Date(startDate);
        nextDay.setDate(startDate.getDate() + 1);

        // Date Format (YYYY-MM-DD)
        const formattedCheckIn = startDate.toISOString().split('T')[0];
        const formattedCheckOut = nextDay.toISOString().split('T')[0];

        // Search Query 
        const query = starRating
            ? `${starRating} star hotel in ${location}`
            : `best hotels in ${location}`;

        const json = await fetchSerpApi({
            engine: "google_hotels",
            q: query,
            check_in_date: formattedCheckIn,
            check_out_date: formattedCheckOut,
            currency: "USD",
            adults: travelers ? travelers.toString() : "2",
            gl: "lk",
            hl: "en",
            sort_by: "8"
        });

        let options = [];

        if (json.properties && json.properties.length > 0) {
            const allHotels = json.properties.map((hotel, index) => {
                const priceStr = hotel.rate_per_night?.lowest || "0";
                const priceVal = parseFloat(priceStr.replace(/[^0-9.]/g, '')) || 0;

                return {
                    name: hotel.name,
                    price: priceVal,
                    rating: hotel.overall_rating || "N/A",
                    image: hotel.images ? hotel.images[0]?.thumbnail : "", // Image එකත් යවනවා
                    description: hotel.description || "",
                    link: hotel.link || "",
                    isRecommended: index === 0 // පළවෙනි එක තමයි Recommended
                };
            });

            const validHotels = allHotels.filter(hotel => hotel.price > 0);

            // පියවර 3: දැන් ඉතිරි අයගෙන් මුල් 5 දෙනා ගන්න (Slice) & Recommended එක දාන්න
            options = validHotels.slice(0, 5).map((hotel, index) => ({
                ...hotel,
                isRecommended: index === 0 // දැන් පළවෙනියට ඉන්න කෙනා තමයි Recommended
            }));
        }

        return {
            selectedPrice: options.length > 0 ? options[0].price : 0, // Default price
            allOptions: options
        }
    } catch (error) {
        console.error("Hotel price error:", error);
        return { selectedPrice: 0, allOptions: [] };
    }
};

// 3. Ticket Price Calculation
const getRealTicketPrice = async (activityName) => {
    try {
        const json = await fetchSerpApi({
            engine: "google",
            q: `${activityName} ticket price`,
            google_domain: "google.com",
            gl: "us",
            hl: "en"
        });

        // Search for price in Answer Box or Knowledge Graph
        if (json.answer_box && json.answer_box.price) {
            return parseFloat(json.answer_box.price.replace(/[^0-9.]/g, '')) || 0;
        }
        if (json.knowledge_graph && json.knowledge_graph.ticket_admission) {
            return parseFloat(json.knowledge_graph.ticket_admission.replace(/[^0-9.]/g, '')) || 0;
        }
        return 0; // Price not found
    } catch (error) {
        return 0;
    }
};


// ---------------------------------------------------------
// MAIN CONTROLLER FUNCTION
// ---------------------------------------------------------

export const refreshItineraryPrices = async (req, res) => {
    const { itinerary, input } = req.body;

    if (!itinerary || !itinerary.days) {
        return res.status(400).json({ error: "Invalid itinerary data" });
    }

    const isGuideIncluded = input?.includeGuide === true || input?.includeGuide === "true";
    const dailyGuideRate = 35;

    // 🔥 FIX: Safety check logic for travelers count
    const adults = parseInt(input?.adults) || 0;
    const children = parseInt(input?.children) || 0;
    const travelersInInput = parseInt(input?.travelers) || 0;

    // මුලින්ම input.travelers බලනවා, ඒක නැත්නම් adults + children බලනවා, ඒ දෙකම නැත්නම් default 1 දානවා
    const totalTravelers = travelersInInput > 0 ? travelersInInput : (adults + children > 0 ? (adults + children) : 1);

    // input object එක update කරනවා පල්ලෙහා functions වලට පාවිච්චි කරන්න පුළුවන් වෙන්න
    if (input) {
        input.travelers = totalTravelers;
    }

    console.log(`💰 Refreshing prices for: ${totalTravelers} Travelers, ${input?.hotelRating || 'Current'} Stars, ${input?.vehicleType}`);

    try {
        const updatedDays = await Promise.all(itinerary.days.map(async (day, index) => {
            const prevDay = index > 0 ? itinerary.days[index - 1] : null;
            const origin = prevDay ? prevDay.location : input?.startPoint;

            const isLastDay = index === itinerary.days.length - 1;

            // 1. Transport (දැන් එන්නේ Object එකක්)
            const transportData = await getRealTransportCost(origin, day.location, input?.vehicleType);

            // 2. Hotel Options
            let hotelData = { selectedPrice: 0, allOptions: [] };
            let finalHotelPrice = 0;

            if (!isLastDay) {
                hotelData = await getHotelOptions(
                    day.location,
                    day.date,
                    input?.hotelRating,
                    totalTravelers // Use the calculated constant
                );

                finalHotelPrice = hotelData.selectedPrice;

                if (finalHotelPrice === 0) {
                    finalHotelPrice = (day.estimatedCost?.accommodation || 0);
                }
            }

            // 3. Tickets
            let ticketsTotal = 0;
            if (day.activities && day.activities.length > 0) {
                const ticketPromises = day.activities.map(act =>
                    getRealTicketPrice(typeof act === 'string' ? act : act.name)
                );
                const prices = await Promise.all(ticketPromises);

                const perPersonTotal = prices.reduce((a, b) => a + b, 0);

                // Multiply by NEW Number of Travelers
                ticketsTotal = perPersonTotal * totalTravelers;
            }

            const guideCost = isGuideIncluded ? dailyGuideRate : 0;

            // 🔥 වෙනස් කළ කොටස: Object එකෙන් Fuel සහ Vehicle Cost වෙන වෙනම ගැනීම
            const finalFuel = transportData.fuelCost > 0 ? transportData.fuelCost : (day.estimatedCost?.transportFuel || 0);
            const finalVehicle = transportData.vehicleCost > 0 ? transportData.vehicleCost : (day.estimatedCost?.vehicleRental || 0);

            const finalTickets = ticketsTotal > 0 ? ticketsTotal : (day.estimatedCost?.tickets || 0);

            return {
                ...day,
                hotelOptions: hotelData.allOptions,
                estimatedCost: {
                    ...day.estimatedCost,
                    transportFuel: finalFuel,    // ඉන්ධන වියදම
                    vehicleRental: finalVehicle, // වාහන කුලිය
                    accommodation: finalHotelPrice,
                    tickets: finalTickets,
                    miscellaneous: (day.estimatedCost?.miscellaneous || 0) + guideCost,
                    // 🔥 Total එකට finalVehicle එකත් අලුතින් එකතු කළා
                    total: finalFuel + finalVehicle + finalHotelPrice + finalTickets + (day.estimatedCost?.food || 0) + (day.estimatedCost?.miscellaneous || 0) + guideCost
                }
            };
        }));

        const newTotalBudget = updatedDays.reduce((sum, day) => sum + (day.estimatedCost?.total || 0), 0);

        res.json({
            ...itinerary,
            days: updatedDays,
            estimatedTotalBudget: newTotalBudget
        });

    } catch (error) {
        console.error("Error refreshing prices:", error);
        res.status(500).json({ error: "Failed to refresh prices" });
    }
};