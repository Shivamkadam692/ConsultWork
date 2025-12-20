const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { isAuthenticated } = require('../middleware/auth');
const { validateReview } = require('../middleware/validation');

// All routes require authentication
router.use(isAuthenticated);

// Create review
router.post('/', validateReview, reviewController.createReview);

// Update review
router.put('/:id', validateReview, reviewController.updateReview);

// Delete review
router.delete('/:id', reviewController.deleteReview);

// Worker response to review
router.post('/:id/respond', reviewController.respondToReview);

module.exports = router;

