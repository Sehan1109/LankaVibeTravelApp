import mongoose from 'mongoose';

const DraftPlanSchema = new mongoose.Schema({
    userId: {
        type: String,
        default: null
    },
    guestId: {
        type: String,
        default: null
    },
    sessionId: {
        type: String,
        required: true
    },
    inputData: {
        type: Object,
        required: true
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    },
    isGenerated: { type: Boolean, default: false }
}, { timestamps: true });


const DraftPlan = mongoose.model('DraftPlan', DraftPlanSchema);

export default DraftPlan;