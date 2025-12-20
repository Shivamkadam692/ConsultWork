const Review = require('../models/Review');
const Booking = require('../models/Booking');
const User = require('../models/User');

// Create review
exports.createReview = async (req, res) => {
  try {
    const { bookingId, rating, reviewText } = req.body;
    const clientId = req.session.user.id;

    // Check if booking exists and belongs to client
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.clientId.toString() !== clientId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    if (booking.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Can only review completed bookings'
      });
    }

    // Check if review already exists
    const existingReview = await Review.findOne({ bookingId });
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'Review already exists for this booking'
      });
    }

    // Create review
    const review = new Review({
      bookingId,
      clientId,
      workerId: booking.workerId,
      rating: parseInt(rating),
      reviewText: reviewText || ''
    });

    await review.save();

    // Update worker's average rating
    await updateWorkerRating(booking.workerId);

    res.json({
      success: true,
      message: 'Review submitted successfully',
      review
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit review'
    });
  }
};

// Update review
exports.updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, reviewText } = req.body;
    const clientId = req.session.user.id;

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    if (review.clientId.toString() !== clientId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    review.rating = parseInt(rating);
    review.reviewText = reviewText || '';
    review.isEdited = true;
    await review.save();

    // Update worker's average rating
    await updateWorkerRating(review.workerId);

    res.json({
      success: true,
      message: 'Review updated successfully',
      review
    });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update review'
    });
  }
};

// Delete review
exports.deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const clientId = req.session.user.id;

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    if (review.clientId.toString() !== clientId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const workerId = review.workerId;
    review.isVisible = false;
    await review.save();

    // Update worker's average rating
    await updateWorkerRating(workerId);

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete review'
    });
  }
};

// Worker response to review
exports.respondToReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { response } = req.body;
    const workerId = req.session.user.id;

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    if (review.workerId.toString() !== workerId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    review.workerResponse = {
      text: response,
      respondedAt: new Date()
    };
    await review.save();

    res.json({
      success: true,
      message: 'Response added successfully',
      review
    });
  } catch (error) {
    console.error('Respond to review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add response'
    });
  }
};

// Helper function to update worker's average rating
async function updateWorkerRating(workerId) {
  try {
    const reviews = await Review.find({ workerId, isVisible: true });
    if (reviews.length === 0) {
      await User.findByIdAndUpdate(workerId, { averageRating: 0 });
      return;
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    await User.findByIdAndUpdate(workerId, {
      averageRating: parseFloat(averageRating.toFixed(2))
    });
  } catch (error) {
    console.error('Update worker rating error:', error);
  }
}

