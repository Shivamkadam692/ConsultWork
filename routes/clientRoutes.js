const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const { isAuthenticated, isClient } = require('../middleware/auth');

// All routes require authentication and client role
router.use(isAuthenticated);
router.use(isClient);

// Dashboard
router.get('/dashboard', clientController.dashboard);

// Search workers
router.get('/search', clientController.searchWorkers);

// Get workers for map (API endpoint)
router.get('/api/workers/map', clientController.getWorkersForMap);

// View worker profile
router.get('/worker/:id', clientController.viewWorker);

// Bookings
router.get('/bookings', clientController.viewBookings);

// Payments
router.get('/payments', clientController.viewPayments);

// Profile
router.get('/profile', clientController.viewProfile);
router.post('/profile', clientController.updateProfile);

module.exports = router;

