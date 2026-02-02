import mongoose from 'mongoose';

const ReviewSchema = new mongoose.Schema({
    packageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Package',
        required: false
    },
    user: {
        // Assuming you have a User model. 
        // If not, you can just store a string name for now.
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    userName: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
}, {
    timestamps: true
});

export default mongoose.model('Review', ReviewSchema);