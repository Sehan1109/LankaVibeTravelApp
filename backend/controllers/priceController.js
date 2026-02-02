// backend/controllers/priceController.js
import { getJson } from "serpapi";
import dotenv from 'dotenv';
import VehiclePrice from '../models/VehiclePrice.js';
dotenv.config();

const SERP_API_KEY = process.env.SERPAPI_API_KEY;

// ---------------------------------------------------------
// HELPER FUNCTIONS (API Calls)
// ---------------------------------------------------------

// Helper to wrap SerpApi
const fetchSerpApi = (params) => {
    return new Promise((resolve, reject) => {
        getJson({ ...params, api_key: SERP_API_KEY }, (json) => {
            if (json.error) reject(json.error);
            else resolve(json);
        });
    });
};

// 1. Transport Cost Calculation (Updated for Vehicle Type)
const getRealTransportCost = async (vehicleType = 'Car') => {
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
const getRealHotelPrice = async (hotelName, location, checkInDate, starRating) => {
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
            : `${hotelName} ${location}`;

        const json = await fetchSerpApi({
            engine: "google_hotels",
            q: query,
            check_in_date: formattedCheckIn,
            check_out_date: formattedCheckOut,
            currency: "USD",
            adults: "2",
            gl: "us",
            hl: "en"
        });

        if (json.properties && json.properties.length > 0) {
            const priceVal = json.properties[0]?.rate_per_night?.lowest || "0";
            return parseFloat(priceVal.replace(/[^0-9.]/g, '')) || 0;
        }

        return 0;
    } catch (error) {
        console.error("Hotel price error:", error);
        return 0;
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

    console.log(`💰 Refreshing prices for: ${input.travelers} Travelers, ${input.hotelRating || 'Current'} Stars, ${input.vehicleType}`);

    try {
        const updatedDays = await Promise.all(itinerary.days.map(async (day, index) => {
            const prevDay = index > 0 ? itinerary.days[index - 1] : null;
            const origin = prevDay ? prevDay.location : input.startPoint;

            // 1. Transport: Calculate based on NEW Vehicle Type
            const transportCost = await getRealTransportCost(origin, day.location, input.vehicleType);

            // 2. Hotel: Calculate based on NEW Star Rating (if provided)
            const hotelCost = await getRealHotelPrice(
                day.accommodation?.name,
                day.location,
                day.date || new Date().toISOString().split('T')[0],
                input.hotelRating // <--- Pass the new rating preference!
            );

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

            // 4. Fallbacks (Use previous AI estimates if API returned 0, but adjust logic)
            // Note: If API returns 0, we try to use the old value. 

            const finalTransport = transportCost > 0 ? transportCost : (day.estimatedCost?.transportFuel || 0);

            let finalHotel = hotelCost;
            if (finalHotel === 0) {
                finalHotel = (day.estimatedCost?.accommodation || 0);
            }

            const finalTickets = ticketsTotal > 0 ? ticketsTotal : (day.estimatedCost?.tickets || 0);

            // Update the day object
            return {
                ...day,
                estimatedCost: {
                    ...day.estimatedCost,
                    transportFuel: finalTransport,
                    accommodation: finalHotel,
                    tickets: finalTickets,
                    total: finalTransport + finalHotel + finalTickets + (day.estimatedCost?.food || 0) + (day.estimatedCost?.miscellaneous || 0)
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