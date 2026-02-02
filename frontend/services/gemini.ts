// src/services/gemini.ts

import { GoogleGenAI, Type } from "@google/genai";
import { PlannerInput, Itinerary, ItineraryDay } from "../types";

// Initialize Gemini Client
// Ensure GEMINI_API_KEY is defined in your .env file
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

// USE A STABLE MODEL (You can change this to 'gemini-1.5-flash' if 2.0 gives issues)
const MODEL_NAME = 'gemini-2.5-flash'; 

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
    meals: { type: Type.ARRAY, items: { type: Type.STRING }},
    
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
    travelDistance: { type: Type.STRING }
};

// --- MAIN GENERATION FUNCTION ---

export const generateItinerary = async (input: PlannerInput): Promise<Itinerary> => {
    const totalDays = calculateDays(input.arrivalDate, input.departureDate);

    const stopsList = input.nextDestinations && input.nextDestinations.length > 0 
        ? input.nextDestinations.join(", ") 
        : "";

    const mandatoryStop = stopsList
        ? `IMPORTANT REQUEST: The route MUST include visits to the following locations: [${stopsList}]. Plan the itinerary order logically to accommodate these stops.`
        : "";

    const specificIdeas = input.userNotes
        ? `USER SPECIFIC PREFERENCES/NOTES: "${input.userNotes}". You MUST prioritize incorporating these requests into the activities, style of travel, or food choices.`
        : "";

    const endPoint = input.endPoint?.trim() || "Bandaranaike International Airport (CMB)";

    // Prompt Construction
    const prompt = `
        Create a detailed ${totalDays}-day Sri Lanka trip for ${input.adults && input.children ? `${input.adults} adults and ${input.children} children` : input.adults ? `${input.adults} adults` : "1 adult"}.
        
        LOGISTICS:
        - Budget: $${input.budget} (Total)
        - Start: ${input.startPoint}
        - End: ${endPoint}
        - Vehicle: ${input.vehicleType} (Rates: Car ~$45, Van ~$60, SUV ~$80)
        - Guide: ${input.includeGuide ? "YES (Add ~$25/day)" : "NO"}
        - Hotel Tier: ${input.hotelRating}
        - Arrival: ${input.arrivalDate} at ${input.arrivalTime}
        - Departure: ${input.departureDate} at ${input.departureTime}

        ${mandatoryStop}
        ${specificIdeas}

        CRITICAL ROUTING INSTRUCTIONS:
        1. The trip MUST follow a logical geographic path starting from ${input.startPoint}.
        2. THE FINAL DAY (Day ${totalDays}) MUST END AT "${endPoint}". 
        3. The 'location' field for Day ${totalDays} in the JSON response must be "${endPoint}" or its immediate vicinity.

        CRITICAL INSTRUCTION FOR TIMING:
        1. Day 1: Activities must start AFTER ${input.arrivalTime}.
        2. Final Day (Day ${totalDays}): The itinerary MUST end at ${endPoint} least 4 hours before ${input.departureTime} to allow for airport check-in. If the departure time is early (e.g., before 14:00), the final day should focus mostly on travel to the airport with minimal activities.

        CRITICAL INSTRUCTION FOR COSTS:
        You MUST break down costs into specific NUMBERS (USD) for each day:
        1. accommodation: Hotel cost.
        2. vehicleRental: Daily rental.
        3. transportFuel: Fuel estimate based on distance.
        4. guide: Daily fee (if selected).
        5. tickets: Entrance fees.
        6. food: Meals estimate.
        7. miscellaneous: Tips, tolls.
        
        Route should be logical.
    `;

    // Define Schema
    const schema = {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING },
            summary: { type: Type.STRING },
            days: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: DAY_SCHEMA_PROPERTIES,
                    required: ['day', 'date', 'location', 'activities', 'detailedActivities', 'estimatedCost', 'accommodation', 'travelTime']
                }
            },
            estimatedTotalBudget: { type: Type.STRING }
        },
        required: ['title', 'summary', 'days', 'estimatedTotalBudget']
    };

    // Execute Call
    const response = await callWithRetry(async () => {
        return await ai.models.generateContent({
            model: MODEL_NAME,
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: {
                responseMimeType: 'application/json',
                responseSchema: schema
            }
        });
    });

    // Parse Response
    const jsonStr = cleanResponse(response);
    return JSON.parse(jsonStr) as Itinerary;
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
                    required: ['day', 'date', 'location', 'activities', 'detailedActivities', 'estimatedCost', 'accommodation']
                }
            }
        });
    });

    const jsonStr = cleanResponse(response);
    return JSON.parse(jsonStr) as ItineraryDay;
};