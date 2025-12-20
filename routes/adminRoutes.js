const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

// All routes require authentication and admin role
router.use(isAuthenticated);
router.use(isAdmin);

// Dashboard
router.get('/dashboard', adminController.dashboard);

// User management
router.get('/users', adminController.viewUsers);
router.post('/users/:id/verify', adminController.verifyWorker);
router.post('/users/:id/toggle-status', adminController.toggleUserStatus);

// Booking management
router.get('/bookings', adminController.viewBookings);

// Payment management
router.get('/payments', adminController.viewPayments);

// Reports and analytics
router.get('/reports', adminController.reports);

module.exports = router;

