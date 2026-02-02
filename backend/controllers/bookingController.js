import Booking from '../models/Booking.js';

// @desc    Create a new booking
// @route   POST /api/bookings
// @access  Public
export const createBooking = async (req, res) => {
    try {
        const {
            customerName,
            email,
            phone,
            arrivalDate,
            departureDate,
            guests,
            packageName,
            packageId,
            itineraryDetails // For Custom AI Plans
        } = req.body;

        // Basic Validation
        if (!customerName || !email || !arrivalDate || !departureDate) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const newBooking = new Booking({
            customerName,
            email,
            phone,
            arrivalDate,
            departureDate,
            guests,
            packageName,
            packageId,
            itineraryDetails
        });

        await newBooking.save();

        res.status(201).json({
            message: 'Booking request submitted successfully',
            booking: newBooking
        });
    } catch (error) {
        console.error('Booking Error:', error);
        res.status(500).json({ error: 'Error creating booking' });
    }
};

// @desc    Get all bookings (Admin)
// @route   GET /api/bookings
// @access  Public (Protected in production)
export const getBookings = async (req, res) => {
    try {
        // Sort by newest first
        const bookings = await Booking.find().sort({ createdAt: -1 });
        res.json(bookings);
    } catch (error) {
        console.error('Fetch Bookings Error:', error);
        res.status(500).json({ error: 'Error fetching bookings' });
    }
};

// @desc    Update booking status
// @route   PUT /api/bookings/:id
// @access  Public (Protected in production)
export const updateBookingStatus = async (req, res) => {
    try {
        const { status } = req.body;

        const booking = await Booking.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true } // Return the updated document
        );

        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        res.json(booking);
    } catch (error) {
        console.error('Update Booking Error:', error);
        res.status(400).json({ error: 'Error updating booking' });
    }
};

// @desc    Delete a booking
// @route   DELETE /api/bookings/:id
// @access  Public (Protected in production)
export const deleteBooking = async (req, res) => {
    try {
        const booking = await Booking.findByIdAndDelete(req.params.id);

        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        res.json({ message: 'Booking deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting booking' });
    }
};