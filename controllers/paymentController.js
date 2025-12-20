const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const { createPayment, updatePaymentStatus } = require('../services/paymentService');
const { createNotification } = require('../services/notificationService');
const { PAYMENT_STATUS } = require('../config/constants');

// Process payment
exports.processPayment = async (req, res) => {
  try {
    const { bookingId, paymentMethod } = req.body;
    const clientId = req.session.user.id;

    // Find booking
    const booking = await Booking.findById(bookingId)
      .populate('clientId workerId');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.clientId._id.toString() !== clientId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    if (booking.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Payment can only be processed for completed bookings'
      });
    }

    // Check if payment already exists
    const existingPayment = await Payment.findOne({ bookingId });
    if (existingPayment && existingPayment.status === PAYMENT_STATUS.COMPLETED) {
      return res.status(400).json({
        success: false,
        message: 'Payment already processed'
      });
    }

    // Calculate amount (use finalAmount if set, otherwise use budget)
    const amount = booking.finalAmount || booking.budget;

    // Create payment record
    const payment = await createPayment(
      bookingId,
      clientId,
      booking.workerId._id,
      amount,
      paymentMethod
    );

    // In a real application, integrate with payment gateway here
    // For now, we'll simulate successful payment
    // TODO: Integrate with Stripe, PayPal, Razorpay, etc.

    // Update payment status to completed (simulated)
    await updatePaymentStatus(payment.transactionId, PAYMENT_STATUS.COMPLETED);

    // Send notifications
    await createNotification(
      clientId,
      'payment',
      'Payment Successful',
      `Your payment of $${amount} has been processed successfully`,
      `/client/payments`
    );

    await createNotification(
      booking.workerId._id,
      'payment',
      'Payment Received',
      `You have received a payment of $${payment.workerPayout} for a completed service`,
      `/worker/earnings`
    );

    res.json({
      success: true,
      message: 'Payment processed successfully',
      payment
    });
  } catch (error) {
    console.error('Process payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Payment processing failed'
    });
  }
};

// View payment details
exports.viewPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.session.user.id;
    const userRole = req.session.user.role;

    const payment = await Payment.findById(id)
      .populate('bookingId', 'serviceCategory requestedDate serviceDescription')
      .populate('clientId', 'firstName lastName')
      .populate('workerId', 'firstName lastName');

    if (!payment) {
      return res.status(404).render('error', {
        title: 'Not Found',
        error: { status: 404, message: 'Payment not found' }
      });
    }

    // Check access
    if (userRole === 'client' && payment.clientId._id.toString() !== userId) {
      return res.status(403).render('error', {
        title: 'Access Denied',
        error: { status: 403, message: 'You do not have access to this payment' }
      });
    }

    if (userRole === 'worker' && payment.workerId._id.toString() !== userId) {
      return res.status(403).render('error', {
        title: 'Access Denied',
        error: { status: 403, message: 'You do not have access to this payment' }
      });
    }

    res.render('payment/detail', {
      title: 'Payment Details',
      payment
    });
  } catch (error) {
    console.error('View payment error:', error);
    res.status(500).render('error', {
      title: 'Error',
      error: { status: 500, message: 'Failed to load payment' }
    });
  }
};

// Generate receipt
exports.generateReceipt = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.session.user.id;

    const payment = await Payment.findById(id)
      .populate('bookingId', 'serviceCategory requestedDate')
      .populate('clientId', 'firstName lastName email address')
      .populate('workerId', 'firstName lastName');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    if (payment.clientId._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    // Render receipt template
    res.render('payment/receipt', {
      title: 'Payment Receipt',
      payment,
      layout: false
    });
  } catch (error) {
    console.error('Generate receipt error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate receipt'
    });
  }
};

