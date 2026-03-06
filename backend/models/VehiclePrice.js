import mongoose from 'mongoose';

const vehiclePriceSchema = mongoose.Schema({
    type: {
        type: String,
        required: true,
        unique: true,
        enum: ['Car', 'Van', 'SUV', 'MiniBus', 'TukTuk', 'Bike', 'LargeBus']
    },
    price: { // කෙලින්ම USD අගය
        type: Number,
        required: true,
        default: 0
    }
}, { timestamps: true });

export default mongoose.model('VehiclePrice', vehiclePriceSchema);