const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { isAuthenticated } = require('../middleware/auth');

// All routes require authentication
router.use(isAuthenticated);

// Process payment
router.post('/process', paymentController.processPayment);

// View payment details
router.get('/:id', paymentController.viewPayment);

// Generate receipt
router.get('/:id/receipt', paymentController.generateReceipt);

module.exports = router;

