const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const User = require('../models/User');
const { COMMISSION_RATE, PAYMENT_STATUS } = require('../config/constants');
const crypto = require('crypto');

// Generate unique transaction ID
const generateTransactionId = () => {
  return 'TXN' + Date.now() + crypto.randomBytes(4).toString('hex').toUpperCase();
};

// Calculate commission and payout
const calculatePayment = (amount) => {
  const commission = amount * COMMISSION_RATE;
  const workerPayout = amount - commission;
  return {
    amount,
    commission: parseFloat(commission.toFixed(2)),
    workerPayout: parseFloat(workerPayout.toFixed(2))
  };
};

// Create payment record
const createPayment = async (bookingId, clientId, workerId, amount, paymentMethod) => {
  try {
    const { commission, workerPayout } = calculatePayment(amount);
    const transactionId = generateTransactionId();

    const payment = new Payment({
      bookingId,
      clientId,
      workerId,
      amount,
      commission,
      workerPayout,
      paymentMethod,
      transactionId,
      status: PAYMENT_STATUS.PENDING
    });

    await payment.save();
    return payment;
  } catch (error) {
    console.error('Error creating payment:', error);
    throw error;
  }
};

// Update payment status
const updatePaymentStatus = async (transactionId, status) => {
  try {
    const payment = await Payment.findOneAndUpdate(
      { transactionId },
      { status, paymentDate: new Date() },
      { new: true }
    );

    if (status === PAYMENT_STATUS.COMPLETED && payment) {
      // Update worker earnings
      await User.findByIdAndUpdate(payment.workerId, {
        $inc: { totalEarnings: payment.workerPayout }
      });

      // Update booking final amount
      await Booking.findByIdAndUpdate(payment.bookingId, {
        finalAmount: payment.amount
      });
    }

    return payment;
  } catch (error) {
    console.error('Error updating payment status:', error);
    throw error;
  }
};

// Get payment history for user
const getPaymentHistory = async (userId, role, limit = 10, skip = 0) => {
  try {
    const query = role === 'client' ? { clientId: userId } : { workerId: userId };
    const payments = await Payment.find(query)
      .populate('bookingId', 'serviceCategory requestedDate')
      .populate(role === 'client' ? 'workerId' : 'clientId', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    return payments;
  } catch (error) {
    console.error('Error fetching payment history:', error);
    throw error;
  }
};

// Get worker earnings summary
const getWorkerEarningsSummary = async (workerId, startDate, endDate) => {
  try {
    const query = {
      workerId,
      status: PAYMENT_STATUS.COMPLETED,
      paymentDate: {
        $gte: startDate,
        $lte: endDate
      }
    };

    const payments = await Payment.find(query);
    
    const summary = {
      totalEarnings: 0,
      totalCommission: 0,
      totalPayout: 0,
      transactionCount: payments.length
    };

    payments.forEach(payment => {
      summary.totalEarnings += payment.amount;
      summary.totalCommission += payment.commission;
      summary.totalPayout += payment.workerPayout;
    });

    return summary;
  } catch (error) {
    console.error('Error calculating earnings summary:', error);
    throw error;
  }
};

module.exports = {
  createPayment,
  updatePaymentStatus,
  getPaymentHistory,
  getWorkerEarningsSummary,
  calculatePayment,
  generateTransactionId
};

