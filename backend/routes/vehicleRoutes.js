import express from 'express';
import { getVehiclePrices, updateVehiclePrice } from '../controllers/vehicleController.js';
import { getFuelPrice, updateFuelPrice } from '../controllers/vehicleController.js'; // 1. Fuel price controller functions import කරලා තියෙනවා

const router = express.Router();

router.get('/', getVehiclePrices);
router.post('/update', updateVehiclePrice);
router.get('/fuel', getFuelPrice);
router.post('/fuel/update', updateFuelPrice);

export default router;