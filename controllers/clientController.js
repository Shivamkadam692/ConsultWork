const User = require('../models/User');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const { getPaymentHistory } = require('../services/paymentService');
const { getUserNotifications } = require('../services/notificationService');

// Client dashboard
exports.dashboard = async (req, res) => {
  try {
    const userId = req.session.user.id;

    // Get recent bookings
    const recentBookings = await Booking.find({ clientId: userId })
      .populate('workerId', 'firstName lastName profileImage averageRating')
      .sort({ createdAt: -1 })
      .limit(5);

    // Get booking statistics
    const totalBookings = await Booking.countDocuments({ clientId: userId });
    const pendingBookings = await Booking.countDocuments({ clientId: userId, status: 'pending' });
    const completedBookings = await Booking.countDocuments({ clientId: userId, status: 'completed' });

    // Get notifications
    const notifications = await getUserNotifications(userId, 5);

    res.render('client/dashboard', {
      title: 'Client Dashboard',
      recentBookings,
      stats: {
        totalBookings,
        pendingBookings,
        completedBookings
      },
      notifications
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).render('error', {
      title: 'Error',
      error: { status: 500, message: 'Failed to load dashboard' }
    });
  }
};

// Search workers
exports.searchWorkers = async (req, res) => {
  try {
    const { category, location, rating, budget, page = 1 } = req.query;
    const limit = 10;
    const skip = (page - 1) * limit;

    let query = { role: 'worker', isActive: true };

    // Apply filters
    if (category) {
      query['skills.category'] = category;
    }

    if (rating) {
      query.averageRating = { $gte: parseFloat(rating) };
    }

    if (budget) {
      query['rates.hourly'] = { $lte: parseFloat(budget) };
    }

    // Location-based search
    if (location) {
      // Search by worker address city or service areas
      query.$or = [
        { 'address.city': new RegExp(location, 'i') },
        { 'serviceAreas.city': new RegExp(location, 'i') }
      ];
    }

    // Log the query for debugging
    console.log('Search query:', JSON.stringify(query, null, 2));
    
    const workers = await User.find(query)
      .select('firstName lastName profileImage rates averageRating totalBookings address skills serviceAreas')
      .limit(limit)
      .skip(skip);
    
    // Log the results for debugging
    console.log('Found workers:', workers.length);
    
    // Log worker details for debugging
    workers.forEach((worker, index) => {
      console.log(`Worker ${index + 1}:`, {
        id: worker._id,
        name: worker.firstName + ' ' + worker.lastName,
        skills: worker.skills,
        serviceAreas: worker.serviceAreas,
        address: worker.address
      });
    });

    const total = await User.countDocuments(query);

    res.render('client/search', {
      title: 'Search Workers',
      workers,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      filters: { category, location, rating, budget }
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).render('error', {
      title: 'Error',
      error: { status: 500, message: 'Search failed' }
    });
  }
};

// Get workers for map (API endpoint)
exports.getWorkersForMap = async (req, res) => {
  try {
    const { lat, lng, radius = 50 } = req.query; // radius in km

    let query = { 
      role: 'worker', 
      isActive: true,
      'address.coordinates.latitude': { $exists: true, $ne: null },
      'address.coordinates.longitude': { $exists: true, $ne: null }
    };

    let workers;

    // If user location provided, calculate distance and filter
    if (lat && lng) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);
      const radiusKm = parseFloat(radius);

      // Get all workers with coordinates
      workers = await User.find(query)
        .select('firstName lastName profileImage rates averageRating address serviceAreas')
        .limit(500); // Get more to filter by distance

      // Calculate distance and filter
      const { calculateDistance } = require('../services/mapService');
      workers = workers.filter(worker => {
        if (!worker.address?.coordinates?.latitude || !worker.address?.coordinates?.longitude) {
          return false;
        }
        const distance = calculateDistance(
          userLat,
          userLng,
          worker.address.coordinates.latitude,
          worker.address.coordinates.longitude
        );
        return distance <= radiusKm;
      }).slice(0, 100); // Limit to 100 for performance
    } else {
      // Get all workers without distance filter
      workers = await User.find(query)
        .select('firstName lastName profileImage rates averageRating address serviceAreas')
        .limit(100);
    }

    const workersData = workers.map(worker => ({
      id: worker._id.toString(),
      name: `${worker.firstName} ${worker.lastName}`,
      lat: worker.address?.coordinates?.latitude,
      lng: worker.address?.coordinates?.longitude,
      city: worker.address?.city || 'N/A',
      rating: worker.averageRating || 0,
      rate: worker.rates?.hourly || 'N/A',
      profileImage: worker.profileImage || '/images/default-avatar.png',
      serviceAreas: worker.serviceAreas || []
    })).filter(worker => worker.lat && worker.lng); // Only include workers with coordinates

    res.json(workersData);
  } catch (error) {
    console.error('Get workers for map error:', error);
    res.status(500).json({ success: false, message: 'Failed to load workers' });
  }
};

// View worker profile
exports.viewWorker = async (req, res) => {
  try {
    const { id } = req.params;
    const worker = await User.findById(id)
      .populate('serviceAreas');

    if (!worker || worker.role !== 'worker') {
      return res.status(404).render('error', {
        title: 'Not Found',
        error: { status: 404, message: 'Worker not found' }
      });
    }

    // Get worker reviews
    const reviews = await Review.find({ workerId: id, isVisible: true })
      .populate('clientId', 'firstName lastName profileImage')
      .sort({ createdAt: -1 })
      .limit(10);

    // Get worker bookings count
    const completedBookings = await Booking.countDocuments({
      workerId: id,
      status: 'completed'
    });

    res.render('client/worker-detail', {
      title: `${worker.firstName} ${worker.lastName} - Worker Profile`,
      worker,
      reviews,
      completedBookings
    });
  } catch (error) {
    console.error('View worker error:', error);
    res.status(500).render('error', {
      title: 'Error',
      error: { status: 500, message: 'Failed to load worker profile' }
    });
  }
};

// View bookings
exports.viewBookings = async (req, res) => {
  try {
    const userId = req.session.user.id;
    console.log('\n=== CLIENT VIEW BOOKINGS ===');
    console.log('Client ID:', userId);
    console.log('Session user:', req.session.user);
    
    const { status, page = 1 } = req.query;
    const limit = 10;
    const skip = (page - 1) * limit;

    let query = { clientId: userId };
    if (status) {
      query.status = status;
    }

    console.log('Search query:', JSON.stringify(query, null, 2));

    const bookings = await Booking.find(query)
      .populate('workerId', 'firstName lastName profileImage phone')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    console.log('Found bookings:', bookings.length);
    bookings.forEach((booking, index) => {
      console.log(`Booking ${index + 1}:`, {
        id: booking._id,
        workerId: booking.workerId?._id,
        workerName: booking.workerId ? `${booking.workerId.firstName} ${booking.workerId.lastName}` : 'Unknown',
        serviceCategory: booking.serviceCategory,
        status: booking.status,
        createdAt: booking.createdAt
      });
    });

    const total = await Booking.countDocuments(query);
    console.log('Total bookings:', total);

    res.render('client/bookings', {
      title: 'My Bookings',
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

// View payment history
exports.viewPayments = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { page = 1 } = req.query;
    const limit = 10;
    const skip = (page - 1) * limit;

    const payments = await getPaymentHistory(userId, 'client', limit, skip);
    const total = payments.length; // This should be a count query in production

    res.render('client/payments', {
      title: 'Payment History',
      payments,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('View payments error:', error);
    res.status(500).render('error', {
      title: 'Error',
      error: { status: 500, message: 'Failed to load payment history' }
    });
  }
};

// Profile management
exports.viewProfile = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const user = await User.findById(userId);

    // Get booking statistics
    const totalBookings = await Booking.countDocuments({ clientId: userId });
    const pendingBookings = await Booking.countDocuments({ clientId: userId, status: 'pending' });
    const completedBookings = await Booking.countDocuments({ clientId: userId, status: 'completed' });

    res.render('client/profile', {
      title: 'My Profile',
      user,
      stats: {
        totalBookings,
        pendingBookings,
        completedBookings
      }
    });
  } catch (error) {
    console.error('View profile error:', error);
    res.status(500).render('error', {
      title: 'Error',
      error: { status: 500, message: 'Failed to load profile' }
    });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { firstName, lastName, phone } = req.body;
    
    // Handle address object
    const address = {
      street: req.body['address[street]'] || req.body.address?.street,
      city: req.body['address[city]'] || req.body.address?.city,
      state: req.body['address[state]'] || req.body.address?.state,
      zipCode: req.body['address[zipCode]'] || req.body.address?.zipCode
    };

    const updateData = {
      firstName,
      lastName,
      phone,
      address
    };

    await User.findByIdAndUpdate(userId, updateData);

    // Update session
    req.session.user.firstName = firstName;
    req.session.user.lastName = lastName;

    res.redirect('/client/profile');
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).render('error', {
      title: 'Error',
      error: { status: 500, message: 'Failed to update profile' }
    });
  }
};

