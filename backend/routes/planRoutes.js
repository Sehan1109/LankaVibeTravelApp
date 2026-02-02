import express from 'express';
import {
    savePlan,
    deletePlan,
    getUserPlans,
    getPlanByShareId,
} from '../controllers/planController.js';
import { refreshItineraryPrices } from '../controllers/priceController.js';

const router = express.Router();

// Route: /api/plans/save
router.post('/save', savePlan);

// Route: /api/plans/:id
router.delete('/:id', deletePlan);

// Route: /api/plans/user/:userId
router.get('/user/:userId', getUserPlans);

// Route: /api/plans/:shareId
router.get('/:shareId', getPlanByShareId);

// Route: /api/plans/:shareId
router.get('/:shareId', getPlanByShareId);

// Route: /api/plans/refresh-prices/:shareId
router.post('/refresh-prices', refreshItineraryPrices);

export default router;