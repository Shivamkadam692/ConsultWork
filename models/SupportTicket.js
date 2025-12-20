const mongoose = require('mongoose');
const { TICKET_STATUS, TICKET_PRIORITY } = require('../config/constants');

const supportTicketSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: Object.values(TICKET_STATUS),
    default: TICKET_STATUS.OPEN
  },
  priority: {
    type: String,
    enum: Object.values(TICKET_PRIORITY),
    default: TICKET_PRIORITY.MEDIUM
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminUser'
  },
  messages: [{
    senderId: mongoose.Schema.Types.ObjectId,
    senderRole: String,
    message: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    attachments: [String]
  }],
  resolvedAt: Date
}, {
  timestamps: true
});

// Indexes
supportTicketSchema.index({ userId: 1 });
supportTicketSchema.index({ status: 1 });
supportTicketSchema.index({ priority: 1 });
supportTicketSchema.index({ assignedTo: 1 });

module.exports = mongoose.model('SupportTicket', supportTicketSchema);

