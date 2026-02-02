// src/types.ts

// --- PACKAGES & SHARED ---
export interface TravelPackage {
  _id?: string;
  id?: string;
  title: string;
  description: string;
  price: number;
  duration: string;
  image: string;
  tags: string[];
  highlights: string[];
  location?: string;
}

export interface Accommodation {
  name: string;
  type: string;
  rating: string;
  estimatedPrice: string;
  description: string;
}

export interface Dining {
  name: string;
  cuisine: string;
  priceLevel: string;
  recommendedDish: string;
  imageKeyword: string;
}

// --- NEW STRUCTURED COST OBJECT ---
// Changed to 'number' to allow calculation of totals in the cost table
export interface CostBreakdown {
  accommodation: number;  // Cost for Hotels
  tickets: number;        // Cost for Entrance Tickets
  food: number;           // Cost for Meals (Breakfast/Lunch/Dinner)
  transportFuel: number;  // Cost for Fuel only
  vehicleRental: number;  // Cost for Vehicle Rental (daily rate)
  guide: number;          // Cost for Guide/Driver (daily rate)
  miscellaneous: number;  // Tips, Highway charges, Water, Parking (Forgotten costs)
  total: number;          // Sum of all above for the day
}

// --- ITINERARY DETAILS ---
export interface ActivityDetail {
  name: string;
  description: string;
  openingHours: string;     // e.g. "08:00 AM - 05:00 PM"
  isClosedToday: boolean;   // AI checks if day of week matches closure
  duration: string;         // e.g. "2 hours"
}

export interface ItineraryDay {
  day: number;
  date: string;
  location: string;
  activities: string[];
  detailedActivities: ActivityDetail[];
  description: string;
  meals: string[];
  
  // UPDATED: Uses the granular number-based breakdown
  estimatedCost: CostBreakdown; 
  
  accommodation?: Accommodation;
  restaurants?: Dining[];
  activityImageKeyword: string;
  travelTime: string;       // e.g. "Colombo -> Kandy: 3.5 Hours drive"
  travelDistance: string;
}

export interface Itinerary {
  title: string;
  summary: string;
  days: ItineraryDay[];
  estimatedTotalBudget: string; // Keeps the string format for the header summary if needed
}

// --- INPUT FORM ---
export type BudgetLevel = 'Budget' | 'Comfort' | 'Luxury';
export type Interest = 'Nature' | 'Culture' | 'Adventure' | 'Nightlife' | 'Beaches' | 'Wildlife';

export interface PlannerInput {
  departureTime: string;
  arrivalDate: string;
  departureDate: string;
  arrivalTime: string;      // Changed from 'any' to 'string' for better type safety
  budget: number;
  adults: number;
  children: number;
  
  startPoint: string;
  endPoint: string;
  nextDestination?: string;
  nextDestinations?: string[];
  
  interests: Interest[];
  pace: string;
  hotelRating: string;
  
  // Specific Transport Options
  vehicleType: string;      // e.g. 'Car', 'Van', 'SUV'
  includeGuide: boolean;    // affects the 'guide' cost field
  
  accessibility: string[];  // Changed from 'any' to string array if multiple options
  dietaryRestrictions: string[]; // Changed from 'any' to string array
  userNotes?: string;
}

// --- USER & SYSTEM ---
export interface Testimonial {
  id: string;
  name: string;
  country: string;
  comment: string;
  avatar: string;
}

export interface Booking {
  _id?: string;
  customerName: string;
  email: string;
  phone: string;
  itineraryDetails: Itinerary;
  packageName?: string;
  status: 'Pending' | 'Contacted';
  createdAt?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'customer';
}

export interface AuthResponse {
  token: string;
  user: User;
}