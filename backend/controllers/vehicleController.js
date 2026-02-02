import VehiclePrice from '../models/VehiclePrice.js';

// Default values to use if DB is empty
const DEFAULTS = [
    { type: 'Bike', multiplier: 0.3 },
    { type: 'Car', multiplier: 1.0 },
    { type: 'TukTuk', multiplier: 0.4 },
    { type: 'Van', multiplier: 1.3 },
    { type: 'SUV', multiplier: 1.5 },
    { type: 'MiniBus', multiplier: 1.8 },
    { type: 'LargeBus', multiplier: 2.5 }
];

// Get all prices (Initialize with defaults if empty)
export const getVehiclePrices = async (req, res) => {
    try {
        let prices = await VehiclePrice.find({});

        // If DB is empty, return defaults (or seed them)
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
    const { type, multiplier } = req.body;
    try {
        const updated = await VehiclePrice.findOneAndUpdate(
            { type },
            { type, multiplier }, // Update fields
            { new: true, upsert: true } // Create if doesn't exist
        );
        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};