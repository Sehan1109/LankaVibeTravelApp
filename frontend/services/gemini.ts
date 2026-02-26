// src/services/gemini.ts

import { GoogleGenAI, Type } from "@google/genai";
import { PlannerInput, Itinerary, ItineraryDay } from "../types";

// Initialize Gemini Client
// Ensure GEMINI_API_KEY is defined in your .env file
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

// USE A STABLE MODEL (You can change this to 'gemini-1.5-flash' if 2.0 gives issues)
const MODEL_NAME = 'gemini-2.0-flash'; 

// --- HELPER: SAFE JSON EXTRACTION (Fixes "response.text is not a function") ---
const cleanResponse = (response: any): string => {
    try {
        let text = '';

        // 1. Try standard function call (Newer SDKs)
        if (typeof response.text === 'function') {
            text = response.text();
        } 
        // 2. Try nested response object
        else if (response.response && typeof response.response.text === 'function') {
            text = response.response.text();
        }
        // 3. Try direct property access
        else if (typeof response.text === 'string') {
            text = response.text;
        }
        // 4. Manual candidate extraction (Fallback)
        else if (response.candidates && response.candidates[0]?.content?.parts?.[0]?.text) {
            text = response.candidates[0].content.parts[0].text;
        }

        if (!text) throw new Error("No text content found in AI response");

        // Remove Markdown code blocks if present
        return text.replace(/```json/g, '').replace(/```/g, '').trim();

    } catch (e) {
        console.error("Failed to extract text from response:", response);
        throw new Error("Invalid AI response structure. Check console.");
    }
};

// --- HELPER: DAYS CALCULATION ---
const calculateDays = (start: string, end: string): number => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return diffDays + 1;
};

// --- HELPER: ROBUST RETRY MECHANISM ---
const callWithRetry = async (fn: () => Promise<any>, retries = 3, delay = 2000): Promise<any> => {
    try {
        return await fn();
    } catch (error: any) {
        const status = error?.status || error?.response?.status;
        const message = error?.message || '';
        
        // Retry on Rate Limits (429) or Server Overload (503)
        if (retries > 0 && (status === 429 || status === 503 || message.includes('429'))) {
            const jitter = Math.random() * 1000;
            const waitTime = delay + jitter;
            console.warn(`⚠️ API Limit hit. Retrying in ${(waitTime/1000).toFixed(1)}s...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            return callWithRetry(fn, retries - 1, delay * 2);
        }
        throw error;
    }
};

// --- SCHEMA DEFINITIONS ---

// 1. COST SCHEMA (Must be NUMBERs for the table calculation)
const COST_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        accommodation: { type: Type.NUMBER, description: "Cost for hotel/stay in USD" },
        tickets: { type: Type.NUMBER, description: "Total entrance fees in USD" },
        food: { type: Type.NUMBER, description: "Estimated cost for 3 meals in USD" },
        transportFuel: { type: Type.NUMBER, description: "Estimated fuel cost based on distance in USD" },
        vehicleRental: { type: Type.NUMBER, description: "Daily rental cost for vehicle in USD" },
        guide: { type: Type.NUMBER, description: "Daily guide fee in USD (0 if not selected)" },
        miscellaneous: { type: Type.NUMBER, description: "Tips, highway tolls, water, snacks in USD" },
        total: { type: Type.NUMBER, description: "Sum of all the above costs" }
    },
    required: ['accommodation', 'tickets', 'food', 'transportFuel', 'vehicleRental', 'guide', 'miscellaneous', 'total']
};

// 2. DAY SCHEMA
const DAY_SCHEMA_PROPERTIES = {
    day: { type: Type.INTEGER },
    date: { type: Type.STRING },
    location: { type: Type.STRING, description: "City name only, e.g. 'Kandy, Sri Lanka' for API search" },
    activities: { 
        type: Type.ARRAY, 
        items: { type: Type.STRING } 
    },
    detailedActivities: {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING },
                category: { type: Type.STRING, description: "Nature, Culture, Adventure, Relaxation, Food, or Shopping" },
                description: { type: Type.STRING },
                openingHours: { type: Type.STRING },
                isClosedToday: { type: Type.BOOLEAN },
                duration: { type: Type.STRING }
            },
            required: ['name', 'category', 'description', 'openingHours', 'isClosedToday', 'duration']
        }
    },
    description: { type: Type.STRING },

    suggestions: {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING },
                description: { type: Type.STRING },
                category: { type: Type.STRING },
                estimatedCost: { type: Type.NUMBER },
                duration: { type: Type.STRING, description: "e.g. '2 hours' or '45 mins'" }
            }
        }
    },
    
    // ATTACH COST SCHEMA HERE
    estimatedCost: COST_SCHEMA,
    
    accommodation: {
        type: Type.OBJECT,
        properties: {
            name: { type: Type.STRING },
            type: { type: Type.STRING },
            rating: { type: Type.STRING },
            estimatedPrice: { type: Type.STRING },
            description: { type: Type.STRING }
        },
        required: ['name', 'type', 'estimatedPrice', 'description', 'rating']
    },
    restaurants: {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING },
                cuisine: { type: Type.STRING },
                priceLevel: { type: Type.STRING },
                recommendedDish: { type: Type.STRING },
                imageKeyword: { type: Type.STRING }
            },
            required: ['name', 'cuisine', 'priceLevel', 'recommendedDish']
        }
    },
    activityImageKeyword: { type: Type.STRING },
    travelTime: { type: Type.STRING },
    travelDistance: { type: Type.STRING },
    isDayBudgetSufficient: { type: Type.BOOLEAN },
    budgetWarningMessage: { type: Type.STRING}
};

// --- MAIN GENERATION FUNCTION ---

export const generateItinerary = async (input: PlannerInput): Promise<Itinerary> => {
    const totalDays = calculateDays(input.arrivalDate, input.departureDate);
    const dailyBudget = Math.floor(input.budget / totalDays);

    console.log("📍 Step 1: සම්පූර්ණ ගමන් මාර්ගය (Master Route) සැලසුම් කරමින්...");

    // ==========================================
    // STEP 1: CREATE THE MASTER ROUTE
    // ==========================================
    const routePrompt = `
        Plan a logical ${totalDays}-day travel route across Sri Lanka for a trip starting at "${input.startPoint}" and ending at "${input.endPoint || 'Flexible'}".
        Include these mandatory stops if geographically logical: [${input.nextDestinations?.join(', ') || ''}].
        ONLY return the City/Location name for each day. Do not generate activities or costs.
    `;

    const routeSchema = {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING },
            summary: { type: Type.STRING },
            routePlan: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        day: { type: Type.NUMBER },
                        location: { type: Type.STRING }
                    },
                    required: ['day', 'location']
                }
            }
        },
        required: ['title', 'summary', 'routePlan']
    };

    const routeResponse = await callWithRetry(async () => {
        return await ai.models.generateContent({
            model: MODEL_NAME,
            contents: [{ role: 'user', parts: [{ text: routePrompt }] }],
            config: { responseMimeType: 'application/json', responseSchema: routeSchema, maxOutputTokens: 2000 }
        });
    });

    const masterRouteData = JSON.parse(cleanResponse(routeResponse));
    const masterRoute = masterRouteData.routePlan; // උදා: [{day: 1, location: "Colombo"}, {day: 2, location: "Kandy"}...]

    console.log("✅ Master Route එක සාර්ථකයි! දින අනුව විස්තර ජනනය ආරම්භ කරයි...");

    // ==========================================
    // STEP 2: CHUNKED DETAILED GENERATION
    // ==========================================
    const CHUNK_SIZE = 7; // දින 7න් 7ට AI එකෙන් ඉල්ලයි

    let allDays: ItineraryDay[] = [];
    let finalItinerary: Partial<Itinerary> = {
        title: masterRouteData.title,
        summary: masterRouteData.summary
    };

    let nextStartLocation = input.startPoint;
    let visitedLocations: string[] = [input.startPoint];

    // 🔥 NEW: Budget Tracking Variables
    let remainingBudget = input.budget;
    let globalIsBudgetSufficient = true;
    let globalBudgetWarning = "";

    // දවස් ගාණ අනුව Loop එක කරකැවීම
    for (let startDay = 1; startDay <= totalDays; startDay += CHUNK_SIZE) {
        const endDay = Math.min(startDay + CHUNK_SIZE - 1, totalDays);
        const isFirstChunk = startDay === 1;
        const isLastChunk = endDay === totalDays;

        // 🔥 NEW: මෙම Chunk එක සඳහා පමණක් වෙන්කළ මුදල ගණනය කිරීම
        const remainingDays = totalDays - startDay + 1;
        const currentChunkDays = endDay - startDay + 1;
        const chunkMaxBudget = Math.floor((remainingBudget / remainingDays) * currentChunkDays);
        const chunkDailyBudget = Math.floor(chunkMaxBudget / currentChunkDays);

        console.log(`⏳ AI Generate වෙමින් පවතී: Day ${startDay} සිට ${endDay} දක්වා... (Chunk Budget: $${chunkMaxBudget})`);

        const chunkLocations = masterRoute.filter((d: any) => d.day >= startDay && d.day <= endDay);
        const masterRouteString = chunkLocations.map((d: any) => `Day ${d.day}: ${d.location}`).join(", ");

        // 1. Mandatory Stops Logic
        const stopsList = input.nextDestinations && input.nextDestinations.length > 0 
            ? input.nextDestinations.join(", ") 
            : "";

        const mandatoryStop = stopsList
            ? `IMPORTANT REQUEST: The route MUST include at least one day/visit to each of these locations: [${stopsList}]. HOWEVER, you MUST ALSO suggest and add OTHER logical and beautiful destinations in Sri Lanka to fill the remaining days of the ${totalDays}-day trip. Do NOT restrict the entire itinerary to only these user-requested locations.`
            : "Feel free to suggest the best logical route and destinations across Sri Lanka.";

        // 2. User Notes Logic
        const specificIdeas = input.userNotes
            ? `USER SPECIFIC PREFERENCES/NOTES: "${input.userNotes}". You MUST prioritize incorporating these requests into the activities, style of travel, or food choices.`
            : "";

        // 3. END POINT LOGIC
        const endLocationName = input.endPoint && input.endPoint.trim() !== '' 
            ? input.endPoint 
            : "Flexible / Linear Route (End at last activity)";

        const endLocationInstruction = (isLastChunk && input.endPoint && input.endPoint.trim() !== '')
            ? `THE FINAL DAY (Day ${endDay}) MUST END AT "${input.endPoint}".`
            : `End Day ${endDay} at a logical location so the trip can continue tomorrow.`;

        const timingInstruction = (isLastChunk && input.endPoint && input.endPoint.toLowerCase().includes('airport'))
            ? `2. Final Day (Day ${endDay}): Since the drop-off is at the Airport, ensure arrival is at least 4 hours before flight time (${input.departureTime}).`
            : ``;

        const visitedInstruction = visitedLocations.length > 1
            ? `CRITICAL AVOIDANCE RULE: You have ALREADY VISITED the following cities in the previous days: [${visitedLocations.join(", ")}]. YOU MUST NOT make these cities the main location or overnight stay again. Please route the journey to NEW regions and cities.`
            : ``;

        // 4. Prompt Construction
        const prompt = `
            Create a detailed ${totalDays}-day Sri Lanka trip for ${input.adults && input.children ? `${input.adults} adults and ${input.children} children` : input.adults ? `${input.adults} adults` : "1 adult"}.
            
            🚨 CRITICAL: YOU MUST ONLY GENERATE DETAILS FOR DAY ${startDay} TO DAY ${endDay}! Do not generate the entire trip.
            
            🔥 MASTER ROUTE TO FOLLOW FOR THESE DAYS:
            ${masterRouteString}
            (Please base your daily locations primarily on this approved route)

            LOGISTICS:
            - Start: ${nextStartLocation}  <-- THIS IS CRITICAL. START DAY ${startDay} FROM HERE!
            - End: ${endLocationName}
            - Vehicle: ${input.vehicleType}
            - Guide: ${input.includeGuide ? "YES (Add ~$25/day)" : "NO"}
            - Hotel Tier: ${input.hotelRating}
            - Arrival: ${input.arrivalDate} at ${input.arrivalTime}
            - Departure: ${input.departureDate} at ${input.departureTime}
            
            👉 Accommodation Preference: "${input.hotelRating}" 
               - If "Homestay": Suggest highly-rated, safe homestays or guesthouses.
               - If "Cabana": Suggest wooden cabanas, beach chalets, or jungle huts.
               - If "Eco-Lodge": Suggest sustainable eco-lodges or glamping sites.
               - If Star Rating: Suggest hotels matching that rating.

            ${mandatoryStop}
            ${specificIdeas}

            CRITICAL ROUTING INSTRUCTIONS:
            1. The trip MUST follow a logical geographic path starting from ${nextStartLocation}.
            ${endLocationInstruction}
            ${visitedInstruction}

            CRITICAL INSTRUCTION FOR TIMING:
            ${isFirstChunk ? `1. Day 1: Activities must start AFTER ${input.arrivalTime}.` : ''}
            ${timingInstruction}

            🔥 CRITICAL BUDGET EVALUATION & ACTIONS (STRICT MATH):
            1. Your absolute MAXIMUM limit for THESE ${currentChunkDays} DAYS (Day ${startDay} to ${endDay}) is $${chunkMaxBudget} USD (approx $${chunkDailyBudget}/day).
            2. THE MATH MUST WORK: The sum of all daily 'estimatedCost.total' values for THESE DAYS MUST BE strictly <= $${chunkMaxBudget}.
            3. If $${chunkMaxBudget} is too low for the requested duration, Hotel Tier, or Vehicle Type:
               - Set "isBudgetSufficient" to false.
               - Write a "budgetWarningMessage" explaining that to stay under budget, you had to downgrade their preferences.
               - YOU MUST OVERRIDE the user's Hotel Tier ("${input.hotelRating}") and Vehicle ("${input.vehicleType}") and use the absolute cheapest options (e.g., $5 hostels, public buses, $0 free activities, cheap street food).
               - FORCE the numbers down. Do not output realistic high prices if they break the $${chunkMaxBudget} limit. You must fit the itinerary into the given budget.

            🔥 EXTRA INSTRUCTION FOR SUGGESTIONS:
            For every single day, populate the 'suggestions' array with 2-3 "Hidden Gems" or "Alternative Stops".
            - These should be interesting places directly ON THE ROUTE for that day.
            - They should NOT be in the main 'activities' list.
            - Include an estimated cost and DURATION (e.g. "1 hour") for each suggestion.

            CRITICAL INSTRUCTION FOR COSTS:
            You MUST break down costs into specific NUMBERS (USD) for each day:
            1. accommodation: Hotel cost based on tier.
            2. vehicleRental: Daily rental.
            3. transportFuel: Fuel estimate based on distance.
            4. guide: Daily fee (if selected).
            5. tickets: Entrance fees.
            6. food: Meals estimate.
            7. miscellaneous: Tips, tolls.
            
            Route should be logical.
        `;

        // 🔥 FIX: සෑම Chunk එකකදීම Budget Warning එක ඉල්ලීමට Schema එක වෙනස් කිරීම
        const schema = {
            type: Type.OBJECT,
            properties: {
                isBudgetSufficient: { type: Type.BOOLEAN },
                budgetWarningMessage: { type: Type.STRING },
                ...(isFirstChunk && {
                    title: { type: Type.STRING },
                    summary: { type: Type.STRING },
                    estimatedTotalBudget: { type: Type.STRING }
                }),
                days: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: DAY_SCHEMA_PROPERTIES, 
                        required: ['day', 'date', 'location', 'activities', 'detailedActivities', 'estimatedCost', 'accommodation', 'travelTime', 'suggestions']
                    }
                }
            },
            required: isFirstChunk ? ['title', 'summary', 'days', 'isBudgetSufficient'] : ['days', 'isBudgetSufficient']
        };

        // Execute Call
        const response = await callWithRetry(async () => {
            return await ai.models.generateContent({
                model: MODEL_NAME,
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: schema,
                    maxOutputTokens: 8192
                }
            });
        });

        // Parse Response
        const jsonStr = cleanResponse(response);
        let chunkData;
        try {
            chunkData = JSON.parse(jsonStr);
        } catch (parseError) {
            console.error(`🚨 JSON Parsing Failed at Chunk (Days ${startDay}-${endDay})! Raw String Length:`, jsonStr.length);
            console.error("Raw String Snippet (Last 200 chars):", jsonStr.slice(-200));
            throw new Error(`AI එක දින ${startDay}-${endDay} ජනනය කිරීමේදී දෝෂයක් ඇතිවිය. කරුණාකර නැවත උත්සාහ කරන්න.`);
        }

        // --- Data Accumulation (ලැබුණු දවස් ටික එකතු කිරීම) ---
        if (chunkData.days && Array.isArray(chunkData.days)) {
            allDays = [...allDays, ...chunkData.days];
            
            const newLocations = chunkData.days.map((d: any) => d.location);
            visitedLocations = [...new Set([...visitedLocations, ...newLocations])]; 

            // ඊළඟ Loop එකේ Start Location එක
            if (chunkData.days.length > 0) {
                nextStartLocation = chunkData.days[chunkData.days.length - 1].location;
            }

            // 🔥 NEW: මේ කොටසට වියදම් වූ මුදල මුළු මුදලෙන් අඩු කිරීම
            const chunkSpent = chunkData.days.reduce((sum: number, day: any) => sum + (day.estimatedCost?.total || 0), 0);
            remainingBudget -= chunkSpent;
        }

        // 🔥 NEW: Budget Warning එකක් ඇත්නම් එය Global ලෙස සටහන් කර ගැනීම
        if (chunkData.isBudgetSufficient === false) {
            globalIsBudgetSufficient = false;
            if (chunkData.budgetWarningMessage) {
                globalBudgetWarning = chunkData.budgetWarningMessage;
            }
        }

        // පළමු කොටසේදී (First Chunk) ලැබෙන Title, Summary අරගෙන Final Object එකට දැමීම
        if (isFirstChunk) {
            finalItinerary.title = chunkData.title;
            finalItinerary.summary = chunkData.summary;
        }
    }

    // --- Final Data Construction ---
    finalItinerary.days = allDays;

    // 🔥 NEW: සම්පූර්ණ ගමනට අදාළ Budget Warnings යාවත්කාලීන කිරීම
    finalItinerary.isBudgetSufficient = globalIsBudgetSufficient;
    finalItinerary.budgetWarningMessage = globalBudgetWarning;

    // සම්පූර්ණ දවස්වල වියදම නැවත එකතු කර Total Budget එක සැදීම
    const calculatedTotal = allDays.reduce((sum, day) => sum + (day.estimatedCost?.total || 0), 0);
    finalItinerary.estimatedTotalBudget = `$${calculatedTotal}`;

    if (calculatedTotal > input.budget) {
        finalItinerary.isBudgetSufficient = false;
        finalItinerary.budgetWarningMessage = `ඔබ ලබාදුන් අයවැය ($${input.budget}) මෙම ගමනට ප්‍රමාණවත් නොවේ. ඇස්තමේන්තුගත සම්පූර්ණ වියදම $${calculatedTotal} කි. කරුණාකර දින ගණන, හෝටල් හෝ වාහන වර්ගය වෙනස් කර නැවත උත්සාහ කරන්න.`;
    }
    
    return finalItinerary as Itinerary;
};
// --- REGENERATE SINGLE DAY FUNCTION ---

export const regenerateSingleDay = async (
    dayIndex: number, 
    fullItinerary: Itinerary, 
    userInputs: PlannerInput,
    newLocation?: string,
    specificRequest?: string
): Promise<ItineraryDay> => {
    
    const currentDay = fullItinerary.days[dayIndex];
    const dailyBudget = Math.floor(userInputs.budget / fullItinerary.days.length);

    const locationInstruction = newLocation 
        ? `CHANGE LOCATION to "${newLocation}". Ignore previous location.`
        : `Keep location: ${currentDay.location}.`;

    const prompt = `
        Regenerate Day ${currentDay.day} (${currentDay.date}).
        ${locationInstruction}
        User Request: "${specificRequest || "Optimize schedule"}".
        
        Constraints:
        - Travelers: ${userInputs.adults && userInputs.children ? `${userInputs.adults} adults and ${userInputs.children} children` : userInputs.adults ? `${userInputs.adults} adults` : "1 adult"}.
        - Vehicle: ${userInputs.vehicleType}
        - Guide: ${userInputs.includeGuide}
        
        🔥 CRITICAL BUDGET ACTIONS:
        - Total Trip Budget Constraint: $${userInputs.budget} USD (~$${dailyBudget}/day).
        - The estimated costs for THIS day MUST fit logically within the ~$${dailyBudget}/day limit.
        - If the requested changes force the cost beyond reasonable limits, set "isDayBudgetSufficient" to false, and OVERRIDE user preferences with the absolute cheapest alternatives (public transport, free activities) to force the daily cost down.

        🔥 SUGGESTIONS:
        Also provide 2-3 new 'suggestions' (Hidden Gems/Alternative Stops) for this specific day/location.

        Ensure "estimatedCost" fields (accommodation, fuel, tickets, etc.) are calculated as NUMBERS (USD).
    `;

    const response = await callWithRetry(async () => {
        return await ai.models.generateContent({
            model: MODEL_NAME,
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: DAY_SCHEMA_PROPERTIES,
                    required: ['day', 'date', 'location', 'activities', 'detailedActivities', 'estimatedCost', 'accommodation', 'suggestions']
                },
                maxOutputTokens: 8192
            }
        });
    });

    const jsonStr = cleanResponse(response);
    try {
        return JSON.parse(jsonStr) as ItineraryDay;
    } catch (parseError) {
        // AI එක කොතනින්ද නතර වුණේ කියලා බලාගන්න අන්තිම අකුරු 200 ප්‍රින්ට් කරමු
        console.error("🚨 JSON Parsing Failed! Raw String Length:", jsonStr.length);
        console.error("Raw String Snippet (Last 200 chars):", jsonStr.slice(-200));
        
        throw new Error("AI එක සම්පූර්ණ නොවුණු පිළිතුරක් ලබා දුන්නා. කරුණාකර දවස් ගාණ අඩු කර නැවත උත්සාහ කරන්න.");
    }
};