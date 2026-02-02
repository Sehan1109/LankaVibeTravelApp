import mongoose from 'mongoose';

// 1. Enhanced Day Schema (Matches your new UI Structure)
const DaySchema = new mongoose.Schema({
    day: { type: Number, required: true },

    // Updated to match your frontend 'destination' field
    destination: { type: String },
    description: { type: String },

    // New Fields for Itinerary Details
    hotel: { type: String },      // Stay At
    roomType: { type: String },   // Room Type

    // Changed to String to match the <textarea> input in your frontend
    activities: { type: String },

    // Day-specific image
    image: { type: String }
});

const PackageSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    duration: { type: String, required: true }, // e.g., "5 Days"

    // Images
    image: { type: String },    // Main Cover Image
    gallery: [String],

    manualUrl: { type: String }, // URL to the downloadable PDF manual

    // Details
    location: String,            // Main region (e.g., "Sri Lanka")
    tags: [String],              // e.g., ["Wildlife", "Beach"]
    highlights: [String],

    // The detailed itinerary
    itinerary: [DaySchema],

    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Package', PackageSchema);