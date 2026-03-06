import mongoose from 'mongoose';

const globalSettingSchema = mongoose.Schema({
    key: { type: String, required: true, unique: true }, // උදා: 'fuel_price_usd'
    value: { type: Number, required: true }
}, { timestamps: true });

export default mongoose.model('FuelPrice', globalSettingSchema);