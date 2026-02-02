import express from 'express';
import { getVehiclePrices, updateVehiclePrice } from '../controllers/vehicleController.js';

const router = express.Router();

router.get('/', getVehiclePrices);
router.post('/update', updateVehiclePrice);

export default router;