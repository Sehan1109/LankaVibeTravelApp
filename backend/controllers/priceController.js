// backend/controllers/priceController.js
import { getJson } from "serpapi";
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import VehiclePrice from '../models/VehiclePrice.js';
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

// 1. Transport Cost Calculation (Updated for Vehicle Type)
const getRealTransportCost = async (origin, destination, vehicleType = 'Car') => {
    try {
        // A. Base Price (You can also fetch this from DB if you added baseRate to model)
        let baseCost = 50;

        // B. Fetch Multiplier from Database
        // Try to find the specific vehicle type in DB
        const vehicleData = await VehiclePrice.findOne({ type: vehicleType });

        let multiplier = 1.0;

        if (vehicleData) {
            multiplier = vehicleData.multiplier;
        } else {
            // Fallback hardcoded values if DB fails or type missing
            const defaults = {
                'Bike': 0.3,
                'TukTuk': 0.4,
                'Car': 1.0,
                'Van': 1.3,
                'SUV': 1.5,
                'MiniBus': 1.8,
                'LargeBus': 2.5
            };
            multiplier = defaults[vehicleType] || 1.0;
        }

        return Math.round(baseCost * multiplier);

    } catch (error) {
        console.error("Transport calc error:", error);
        return 50; // Fallback
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
            gl: "us",
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

    const totalTravelers = input.travelers
        ? parseInt(input.travelers)
        : (parseInt(input.adults || 0) + parseInt(input.children || 0));

    input.travelers = totalTravelers > 0 ? totalTravelers : 1;

    console.log(`💰 Refreshing prices for: ${input.travelers} Travelers, ${input.hotelRating || 'Current'} Stars, ${input.vehicleType}`);

    try {
        const updatedDays = await Promise.all(itinerary.days.map(async (day, index) => {
            const prevDay = index > 0 ? itinerary.days[index - 1] : null;
            const origin = prevDay ? prevDay.location : input.startPoint;

            // 🔥 CHECK: මේක අන්තිම දවසද කියලා බලනවා
            const isLastDay = index === itinerary.days.length - 1;

            // 1. Transport: Calculate based on NEW Vehicle Type
            const transportCost = await getRealTransportCost(origin, day.location, input.vehicleType);

            // 2. Hotel Options Logic (Updated for Last Day)
            let hotelData = { selectedPrice: 0, allOptions: [] };
            let finalHotelPrice = 0;

            // 🔥 FIX: අන්තිම දවස නෙවෙයි නම් විතරක් Hotel එකක් හොයන්න
            if (!isLastDay) {
                hotelData = await getHotelOptions(
                    day.location,
                    day.date,
                    input.hotelRating,
                    input.travelers
                );

                finalHotelPrice = hotelData.selectedPrice;

                // Fallback: API එකෙන් 0 ආවොත් පරණ AI ගාණ ගන්න
                if (finalHotelPrice === 0) {
                    finalHotelPrice = (day.estimatedCost?.accommodation || 0);
                }
            }
            // else: අන්තිම දවස නම් finalHotelPrice එක 0 ම යි.

            // 3. Tickets: Calculate based on NEW Traveler Count
            let ticketsTotal = 0;
            if (day.activities && day.activities.length > 0) {
                const ticketPromises = day.activities.map(act =>
                    getRealTicketPrice(typeof act === 'string' ? act : act.name)
                );
                const prices = await Promise.all(ticketPromises);

                // Sum per person
                const perPersonTotal = prices.reduce((a, b) => a + b, 0);

                // Multiply by NEW Number of Travelers
                ticketsTotal = perPersonTotal * parseInt(input.travelers || 1);
            }

            const guideCost = isGuideIncluded ? dailyGuideRate : 0;

            // 4. Fallbacks
            const finalTransport = transportCost > 0 ? transportCost : (day.estimatedCost?.transportFuel || 0);
            const finalTickets = ticketsTotal > 0 ? ticketsTotal : (day.estimatedCost?.tickets || 0);

            // Update the day object
            return {
                ...day,
                hotelOptions: hotelData.allOptions, // Last day එකේදී මේක Empty array එකක් යයි
                estimatedCost: {
                    ...day.estimatedCost,
                    transportFuel: finalTransport,
                    accommodation: finalHotelPrice, // 🔥 Last day එකේදී මේක 0 යි
                    tickets: finalTickets,
                    miscellaneous: (day.estimatedCost?.miscellaneous || 0) + guideCost,
                    // Total එකට ඔක්කොම එකතු කරන්න (Hotel Price 0 නිසා අවුලක් නෑ)
                    total: finalTransport + finalHotelPrice + finalTickets + (day.estimatedCost?.food || 0) + (day.estimatedCost?.miscellaneous || 0) + guideCost
                }
            };
        }));

        // Calculate new total budget for the whole trip
        const newTotalBudget = updatedDays.reduce((sum, day) => sum + (day.estimatedCost?.total || 0), 0);

        res.json({
            ...itinerary,
            days: updatedDays,
            estimatedTotalBudget: newTotalBudget // Update total trip cost
        });

    } catch (error) {
        console.error("Error refreshing prices:", error);
        res.status(500).json({ error: "Failed to refresh prices" });
    }
};