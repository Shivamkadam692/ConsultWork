const Booking = require('../models/Booking');
const User = require('../models/User');
const { sendBookingConfirmationEmail } = require('../services/emailService');
const { createNotification } = require('../services/notificationService');
const { BOOKING_STATUS } = require('../config/constants');

// Create booking request
exports.createBooking = async (req, res) => {
  try {
    const clientId = req.session.user.id;
    const { workerId, serviceCategory, serviceDescription, requestedDate, requestedTime, budget, location, clientNotes } = req.body;
    
    console.log('=== CREATE BOOKING REQUEST ===');
    console.log('Request data:', { clientId, workerId, serviceCategory, budget, requestedDate, requestedTime });

    // Check if worker exists and is active
    const worker = await User.findById(workerId);
    console.log('Worker lookup result:', worker ? {
      id: worker._id,
      firstName: worker.firstName,
      lastName: worker.lastName,
      role: worker.role,
      isActive: worker.isActive
    } : 'NOT FOUND');
    
    if (!worker || worker.role !== 'worker' || !worker.isActive) {
      console.log('Worker validation failed:', { 
        workerExists: !!worker, 
        role: worker?.role, 
        expectedRole: 'worker',
        isActive: worker?.isActive 
      });
      return res.status(404).json({
        success: false,
        message: 'Worker not found or inactive'
      });
    }

    // Validate required fields
    if (!serviceCategory || !serviceDescription || !requestedDate || !requestedTime || !budget) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Validate service description length
    if (serviceDescription.length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Service description must be at least 10 characters long'
      });
    }

    // Create booking
    const bookingData = {
      clientId,
      workerId,
      serviceCategory,
      serviceDescription,
      requestedDate: new Date(requestedDate),
      requestedTime,
      budget: parseFloat(budget),
      location: JSON.parse(location || '{}'),
      status: BOOKING_STATUS.PENDING
    };
    
    console.log('Creating booking with data:', bookingData);
    const booking = new Booking(bookingData);

    await booking.save();
    console.log('Booking created successfully:', {
      id: booking._id,
      clientId: booking.clientId,
      workerId: booking.workerId,
      serviceCategory: booking.serviceCategory,
      status: booking.status,
      createdAt: booking.createdAt
    });

    // Populate for email
    await booking.populate('clientId', 'firstName lastName email');
    await booking.populate('workerId', 'firstName lastName email');

    console.log('Sending notifications...');
    // Send notifications
    await sendBookingConfirmationEmail(booking.clientId, booking);
    await createNotification(
      workerId,
      'booking',
      'New Service Request',
      `You have a new service request from ${booking.clientId.firstName} ${booking.clientId.lastName}`,
      `/worker/requests/${booking._id}`
    );
    console.log('Notifications sent successfully');

    res.json({
      success: true,
      message: 'Booking request created successfully',
      booking
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create booking request'
    });
  }
};

// Accept booking
exports.acceptBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const workerId = req.session.user.id;
    
    console.log('Accept booking request:', { id, workerId });

    const booking = await Booking.findOne({ _id: id, workerId });
    console.log('Booking found:', booking ? 'yes' : 'no');
    
    if (!booking) {
      console.log('Booking not found for worker:', workerId);
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.status !== BOOKING_STATUS.PENDING) {
      console.log('Booking status not pending:', booking.status);
      return res.status(400).json({
        success: false,
        message: 'Booking cannot be accepted'
      });
    }

    booking.status = BOOKING_STATUS.ACCEPTED;
    booking.acceptedAt = new Date();
    await booking.save();
    console.log('Booking accepted successfully');

    await booking.populate('clientId', 'firstName lastName email');
    await createNotification(
      booking.clientId._id,
      'booking',
      'Booking Accepted',
      `Your booking request has been accepted by ${req.session.user.firstName}`,
      `/client/bookings/${booking._id}`
    );

    res.json({
      success: true,
      message: 'Booking accepted successfully',
      booking
    });
  } catch (error) {
    console.error('Accept booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to accept booking'
    });
  }
};

// Reject booking
exports.rejectBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const workerId = req.session.user.id;
    
    console.log('Reject booking request:', { id, workerId, reason });

    const booking = await Booking.findOne({ _id: id, workerId });
    console.log('Booking found:', booking ? 'yes' : 'no');
    
    if (!booking) {
      console.log('Booking not found for worker:', workerId);
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.status !== BOOKING_STATUS.PENDING) {
      console.log('Booking status not pending:', booking.status);
      return res.status(400).json({
        success: false,
        message: 'Booking cannot be rejected'
      });
    }

    booking.status = BOOKING_STATUS.REJECTED;
    booking.cancelledAt = new Date();
    booking.cancellationReason = reason;
    await booking.save();
    console.log('Booking rejected successfully');

    await booking.populate('clientId', 'firstName lastName');
    await createNotification(
      booking.clientId._id,
      'booking',
      'Booking Rejected',
      `Your booking request has been rejected. ${reason ? 'Reason: ' + reason : ''}`,
      `/client/bookings`
    );

    res.json({
      success: true,
      message: 'Booking rejected',
      booking
    });
  } catch (error) {
    console.error('Reject booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject booking'
    });
  }
};

// Update booking status
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const userId = req.session.user.id;
    const userRole = req.session.user.role;

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check permissions
    if (userRole === 'worker' && booking.workerId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    if (userRole === 'client' && booking.clientId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    // Update status
    booking.status = status;
    if (notes) {
      if (userRole === 'worker') {
        booking.workerNotes = notes;
      } else {
        booking.clientNotes = notes;
      }
    }

    if (status === BOOKING_STATUS.COMPLETED) {
      booking.completedAt = new Date();
    }

    await booking.save();

    res.json({
      success: true,
      message: 'Booking status updated',
      booking
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update booking status'
    });
  }
};

// View booking details
exports.viewBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.session.user.id;
    const userRole = req.session.user.role;

    const booking = await Booking.findById(id)
      .populate('clientId', 'firstName lastName email phone profileImage')
      .populate('workerId', 'firstName lastName email phone profileImage rates');

    if (!booking) {
      return res.status(404).render('error', {
        title: 'Not Found',
        error: { status: 404, message: 'Booking not found' }
      });
    }

    // Check access
    if (userRole === 'client' && booking.clientId._id.toString() !== userId) {
      return res.status(403).render('error', {
        title: 'Access Denied',
        error: { status: 403, message: 'You do not have access to this booking' }
      });
    }

    if (userRole === 'worker' && booking.workerId._id.toString() !== userId) {
      return res.status(403).render('error', {
        title: 'Access Denied',
        error: { status: 403, message: 'You do not have access to this booking' }
      });
    }

    const viewPath = userRole === 'client' ? 'client/booking-detail' : 'worker/booking-detail';

    res.render(viewPath, {
      title: 'Booking Details',
      booking
    });
  } catch (error) {
    console.error('View booking error:', error);
    res.status(500).render('error', {
      title: 'Error',
      error: { status: 500, message: 'Failed to load booking' }
    });
  }
};

// Cancel booking
exports.cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.session.user.id;
    const userRole = req.session.user.role;

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check permissions
    if (userRole === 'client' && booking.clientId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    if (userRole === 'worker' && booking.workerId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    // Only allow cancellation if pending or accepted
    if (![BOOKING_STATUS.PENDING, BOOKING_STATUS.ACCEPTED].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: 'Booking cannot be cancelled'
      });
    }

    booking.status = BOOKING_STATUS.CANCELLED;
    booking.cancelledAt = new Date();
    booking.cancellationReason = reason;
    await booking.save();

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      booking
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel booking'
    });
  }
};

