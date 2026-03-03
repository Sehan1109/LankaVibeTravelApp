import express from 'express';
import {
    savePlan,
    deletePlan,
    getUserPlans,
    getPlanByShareId,
    autoSaveDraft,
    getAllDrafts,
    getDashboardStats
} from '../controllers/planController.js';
import { refreshItineraryPrices } from '../controllers/priceController.js';

const router = express.Router();

router.get('/stats', getDashboardStats);

// Route: /api/plans/save
router.post('/save', savePlan);

// User type කරන විට auto-save වීමට
router.post('/auto-save', autoSaveDraft);

// Route: /api/plans/refresh-prices/:shareId
router.post('/refresh-prices', refreshItineraryPrices);

// Admin ට සියලුම live users ලා බලාගැනීමට
router.get('/drafts', getAllDrafts);

// Route: /api/plans/user/:userId
router.get('/user/:userId', getUserPlans);

// Route: /api/plans/:shareId
router.get('/:shareId', getPlanByShareId);

// Route: /api/plans/:id
router.delete('/:id', deletePlan);

export default router;