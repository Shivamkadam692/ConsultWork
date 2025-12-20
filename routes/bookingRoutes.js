const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { isAuthenticated } = require('../middleware/auth');
const { validateBooking } = require('../middleware/validation');

// All routes require authentication
router.use(isAuthenticated);

// Create booking
router.post('/', validateBooking, bookingController.createBooking);

// View booking details
router.get('/:id', bookingController.viewBooking);

// Accept booking (worker only)
router.post('/:id/accept', bookingController.acceptBooking);

// Reject booking (worker only)
router.post('/:id/reject', bookingController.rejectBooking);

// Update booking status
router.put('/:id/status', bookingController.updateStatus);

// Cancel booking
router.post('/:id/cancel', bookingController.cancelBooking);

module.exports = router;

