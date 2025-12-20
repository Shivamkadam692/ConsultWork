const User = require('../models/User');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Review = require('../models/Review');
const SupportTicket = require('../models/SupportTicket');
const ServiceCategory = require('../models/ServiceCategory');
const { WORKER_VERIFICATION_STATUS, BOOKING_STATUS, PAYMENT_STATUS } = require('../config/constants');

// Admin dashboard
exports.dashboard = async (req, res) => {
  try {
    // Get statistics
    const totalUsers = await User.countDocuments({ role: 'client' });
    const totalWorkers = await User.countDocuments({ role: 'worker' });
    const totalBookings = await Booking.countDocuments();
    const pendingBookings = await Booking.countDocuments({ status: BOOKING_STATUS.PENDING });
    const completedBookings = await Booking.countDocuments({ status: BOOKING_STATUS.COMPLETED });

    // Revenue statistics
    const totalRevenue = await Payment.aggregate([
      { $match: { status: PAYMENT_STATUS.COMPLETED } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const totalCommission = await Payment.aggregate([
      { $match: { status: PAYMENT_STATUS.COMPLETED } },
      { $group: { _id: null, total: { $sum: '$commission' } } }
    ]);

    // Recent bookings
    const recentBookings = await Booking.find()
      .populate('clientId', 'firstName lastName')
      .populate('workerId', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(10);

    // Pending worker verifications
    const pendingVerifications = await User.countDocuments({
      role: 'worker',
      verificationStatus: WORKER_VERIFICATION_STATUS.PENDING
    });

    res.render('admin/dashboard', {
      title: 'Admin Dashboard',
      stats: {
        totalUsers,
        totalWorkers,
        totalBookings,
        pendingBookings,
        completedBookings,
        totalRevenue: totalRevenue[0]?.total || 0,
        totalCommission: totalCommission[0]?.total || 0,
        pendingVerifications
      },
      recentBookings
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).render('error', {
      title: 'Error',
      error: { status: 500, message: 'Failed to load dashboard' }
    });
  }
};

// User management
exports.viewUsers = async (req, res) => {
  try {
    const { role, status, page = 1, search } = req.query;
    const limit = 20;
    const skip = (page - 1) * limit;

    let query = {};
    if (role) query.role = role;
    if (status === 'active') query.isActive = true;
    if (status === 'inactive') query.isActive = false;
    if (search) {
      query.$or = [
        { firstName: new RegExp(search, 'i') },
        { lastName: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') }
      ];
    }

    const users = await User.find(query)
      .select('firstName lastName email phone role isActive isVerified createdAt')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const total = await User.countDocuments(query);

    res.render('admin/users', {
      title: 'User Management',
      users,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      filters: { role, status, search }
    });
  } catch (error) {
    console.error('View users error:', error);
    res.status(500).render('error', {
      title: 'Error',
      error: { status: 500, message: 'Failed to load users' }
    });
  }
};

// Approve/verify worker
exports.verifyWorker = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'approve' or 'reject'

    const worker = await User.findById(id);
    if (!worker || worker.role !== 'worker') {
      return res.status(404).json({
        success: false,
        message: 'Worker not found'
      });
    }

    if (action === 'approve') {
      worker.verificationStatus = WORKER_VERIFICATION_STATUS.VERIFIED;
      worker.isVerified = true;
    } else if (action === 'reject') {
      worker.verificationStatus = WORKER_VERIFICATION_STATUS.REJECTED;
    }

    await worker.save();

    res.json({
      success: true,
      message: `Worker ${action === 'approve' ? 'verified' : 'rejected'} successfully`
    });
  } catch (error) {
    console.error('Verify worker error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update worker status'
    });
  }
};

// Block/unblock user
exports.toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'blocked'} successfully`,
      isActive: user.isActive
    });
  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status'
    });
  }
};

// View all bookings
exports.viewBookings = async (req, res) => {
  try {
    const { status, page = 1 } = req.query;
    const limit = 20;
    const skip = (page - 1) * limit;

    let query = {};
    if (status) query.status = status;

    const bookings = await Booking.find(query)
      .populate('clientId', 'firstName lastName email')
      .populate('workerId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const total = await Booking.countDocuments(query);

    res.render('admin/bookings', {
      title: 'Booking Management',
      bookings,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      statusFilter: status
    });
  } catch (error) {
    console.error('View bookings error:', error);
    res.status(500).render('error', {
      title: 'Error',
      error: { status: 500, message: 'Failed to load bookings' }
    });
  }
};

// View payments
exports.viewPayments = async (req, res) => {
  try {
    const { status, page = 1 } = req.query;
    const limit = 20;
    const skip = (page - 1) * limit;

    let query = {};
    if (status) query.status = status;

    const payments = await Payment.find(query)
      .populate('clientId', 'firstName lastName')
      .populate('workerId', 'firstName lastName')
      .populate('bookingId', 'serviceCategory')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const total = await Payment.countDocuments(query);

    res.render('admin/payments', {
      title: 'Payment Management',
      payments,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      statusFilter: status
    });
  } catch (error) {
    console.error('View payments error:', error);
    res.status(500).render('error', {
      title: 'Error',
      error: { status: 500, message: 'Failed to load payments' }
    });
  }
};

// Reports and analytics
exports.reports = async (req, res) => {
  try {
    const { startDate, endDate, type } = req.query;

    const start = startDate ? new Date(startDate) : new Date();
    start.setDate(1); // First day of month
    const end = endDate ? new Date(endDate) : new Date();

    let reportData = {};

    if (type === 'bookings' || !type) {
      // Booking statistics
      const bookingsByStatus = await Booking.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);

      const bookingsByCategory = await Booking.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        { $group: { _id: '$serviceCategory', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]);

      reportData.bookings = {
        byStatus: bookingsByStatus,
        byCategory: bookingsByCategory
      };
    }

    if (type === 'revenue' || !type) {
      // Revenue statistics
      const dailyRevenue = await Payment.aggregate([
        { $match: { status: PAYMENT_STATUS.COMPLETED, paymentDate: { $gte: start, $lte: end } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$paymentDate' } },
            total: { $sum: '$amount' },
            commission: { $sum: '$commission' }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      reportData.revenue = {
        daily: dailyRevenue
      };
    }

    res.render('admin/reports', {
      title: 'Reports & Analytics',
      reportData,
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      reportType: type || 'all'
    });
  } catch (error) {
    console.error('Reports error:', error);
    res.status(500).render('error', {
      title: 'Error',
      error: { status: 500, message: 'Failed to generate reports' }
    });
  }
};

