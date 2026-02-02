import mongoose from 'mongoose';

const ResourceSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: ['hotel', 'restaurant', 'driver', 'guide', 'vehicle']
    },
    name: { type: String, required: true },
    location: { type: String, required: true }, // The readable address

    // --- NEW GOOGLE MAPS FIELDS ---
    googlePlaceId: { type: String }, // Stores the unique Google Place ID
    googleRating: { type: Number },  // Stores the official Google Rating
    coordinates: {                   // Stores Lat/Lng for map pins
        lat: { type: Number },
        lng: { type: Number }
    },
    // -----------------------------

    contactInfo: { type: String },
    description: { type: String }
});

export default mongoose.model('Resource', ResourceSchema);