// models/SavedPlan.js
import mongoose from 'mongoose';

const SavedPlanSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    name: { type: String, required: true },
    inputData: { type: Object, required: true }, // Stores budget, travelers, etc.
    itineraryData: { type: Object, required: true }, // Stores the generated days
    shareId: { type: String, unique: true }, // For sharing links (e.g., lankavibe.com/plan/abc-123)
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('SavedPlan', SavedPlanSchema);