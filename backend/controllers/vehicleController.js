import VehiclePrice from '../models/VehiclePrice.js';
import FuelPrice from '../models/FuelPrice.js';

// 1. පරණ Multiplier අයින් කරලා අලුත් USD Price එකට අදාළ Default values දැම්මා
const DEFAULTS = [
    { type: 'Bike', price: 10 },
    { type: 'TukTuk', price: 15 },
    { type: 'Car', price: 35 },
    { type: 'Van', price: 65 },
    { type: 'SUV', price: 90 },
    { type: 'MiniBus', price: 85 },
    { type: 'LargeBus', price: 150 }
];

// Get all prices (Initialize with defaults if empty)
export const getVehiclePrices = async (req, res) => {
    try {
        let prices = await VehiclePrice.find({});

        // If DB is empty, return defaults
        if (prices.length === 0) {
            return res.json(DEFAULTS);
        }

        res.json(prices);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update or Create a price
export const updateVehiclePrice = async (req, res) => {
    // 2. මෙතන req.body එකෙන් එන multiplier එක වෙනුවට 'price' කියන එක ලබාගන්න හැදුවා
    const { type, price } = req.body;

    try {
        const updated = await VehiclePrice.findOneAndUpdate(
            { type },
            { type, price }, // 3. Update වෙන්නෙත් price එක විදිහට හැදුවා
            { new: true, upsert: true }
        );
        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getFuelPrice = async (req, res) => {
    try {
        // පෙට්‍රල් සහ ඩීසල් මිල ගණන් දෙකම DB එකෙන් ගන්නවා
        const petrol = await FuelPrice.findOne({ key: 'petrol_price_usd' });
        const diesel = await FuelPrice.findOne({ key: 'diesel_price_usd' });

        res.json({
            petrol_price_usd: petrol ? petrol.value : 1.10,
            diesel_price_usd: diesel ? diesel.value : 1.00 // ඩීසල් වලට default 1.00
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateFuelPrice = async (req, res) => {
    const { key, value } = req.body;
    try {
        const updated = await FuelPrice.findOneAndUpdate(
            { key },
            { value },
            { upsert: true, new: true }
        );
        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};