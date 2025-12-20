module.exports = {
  USER_ROLES: {
    CLIENT: 'client',
    WORKER: 'worker',
    ADMIN: 'admin'
  },
  
  BOOKING_STATUS: {
    PENDING: 'pending',
    ACCEPTED: 'accepted',
    REJECTED: 'rejected',
    IN_PROGRESS: 'in-progress',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
  },
  
  PAYMENT_STATUS: {
    PENDING: 'pending',
    COMPLETED: 'completed',
    FAILED: 'failed',
    REFUNDED: 'refunded'
  },
  
  NOTIFICATION_TYPES: {
    BOOKING: 'booking',
    PAYMENT: 'payment',
    REVIEW: 'review',
    SYSTEM: 'system'
  },
  
  TICKET_STATUS: {
    OPEN: 'open',
    IN_PROGRESS: 'in-progress',
    RESOLVED: 'resolved',
    CLOSED: 'closed'
  },
  
  TICKET_PRIORITY: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    URGENT: 'urgent'
  },
  
  WORKER_VERIFICATION_STATUS: {
    PENDING: 'pending',
    VERIFIED: 'verified',
    REJECTED: 'rejected'
  },
  
  AVAILABILITY_STATUS: {
    AVAILABLE: 'available',
    BUSY: 'busy',
    UNAVAILABLE: 'unavailable'
  },
  
  COMMISSION_RATE: 0.15, // 15% commission
  
  PAGINATION_LIMIT: 10,
  
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  
  ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
};

