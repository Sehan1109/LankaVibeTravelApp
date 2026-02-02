import mongoose from 'mongoose';

const vehiclePriceSchema = mongoose.Schema({
    type: {
        type: String,
        required: true,
        unique: true,
        enum: ['Car', 'Van', 'SUV', 'MiniBus', 'TukTuk', 'Bike', 'LargeBus'] // Ensure consistency with frontend
    },
    multiplier: {
        type: Number,
        required: true,
        default: 1.0
    },
    baseRate: {
        type: Number,
        default: 50 // Optional: allow configuring the base base cost ($50) dynamically too
    }
}, { timestamps: true });

export default mongoose.model('VehiclePrice', vehiclePriceSchema);