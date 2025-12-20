const mongoose = require('mongoose');
const { BOOKING_STATUS } = require('../config/constants');

const bookingSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  workerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  serviceCategory: {
    type: String,
    required: true
  },
  serviceDescription: {
    type: String,
    required: true
  },
  requestedDate: {
    type: Date,
    required: true
  },
  requestedTime: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: Object.values(BOOKING_STATUS),
    default: BOOKING_STATUS.PENDING
  },
  budget: {
    type: Number,
    required: true
  },
  finalAmount: {
    type: Number,
    default: 0
  },
  location: {
    address: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  acceptedAt: Date,
  completedAt: Date,
  cancelledAt: Date,
  cancellationReason: String,
  clientNotes: String,
  workerNotes: String
}, {
  timestamps: true
});

// Indexes
bookingSchema.index({ clientId: 1 });
bookingSchema.index({ workerId: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ requestedDate: 1 });
bookingSchema.index({ workerId: 1, status: 1 });

module.exports = mongoose.model('Booking', bookingSchema);

