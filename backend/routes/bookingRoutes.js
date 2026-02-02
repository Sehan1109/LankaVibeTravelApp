import express from 'express';
import {
    createBooking,
    getBookings,
    updateBookingStatus,
    deleteBooking
} from '../controllers/bookingController.js';

// If you want to protect routes later, import middleware here:
// import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Route: /api/bookings
router.route('/')
    .post(createBooking)
    .get(getBookings); // Add middleware here like .get(protect, admin, getBookings)

// Route: /api/bookings/:id
router.route('/:id')
    .put(updateBookingStatus)
    .delete(deleteBooking);

export default router;