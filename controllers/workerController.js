const User = require('../models/User');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const { getPaymentHistory, getWorkerEarningsSummary } = require('../services/paymentService');
const { getUserNotifications } = require('../services/notificationService');
const { geocodeAddress } = require('../services/mapService');

// Worker dashboard
exports.dashboard = async (req, res) => {
  try {
    const userId = req.session.user.id;
    console.log('\n=== WORKER DASHBOARD REQUEST ===');
    console.log('Session user:', req.session.user);
    console.log('Worker ID from session:', userId);

    // Get worker profile
    const worker = await User.findById(userId);
    console.log('Worker profile found:', !!worker);
    if (worker) {
      console.log('Worker details:', {
        id: worker._id,
        firstName: worker.firstName,
        lastName: worker.lastName,
        role: worker.role
      });
    }

    // Get ALL bookings for this worker (for debugging)
    console.log('Fetching all bookings for worker...');
    const allBookings = await Booking.find({ workerId: userId })
      .populate('clientId', 'firstName lastName profileImage phone')
      .sort({ createdAt: -1 })
      .limit(10);
    
    console.log('All bookings found:', allBookings.length);
    allBookings.forEach((booking, index) => {
      console.log(`Booking ${index + 1}:`, {
        id: booking._id,
        clientId: booking.clientId?._id,
        clientName: booking.clientId ? `${booking.clientId.firstName} ${booking.clientId.lastName}` : 'Unknown',
        serviceCategory: booking.serviceCategory,
        status: booking.status,
        createdAt: booking.createdAt
      });
    });

    // Get pending requests
    const pendingRequestsQuery = { workerId: userId, status: 'pending' };
    console.log('Pending requests query:', pendingRequestsQuery);
    
    const pendingRequests = await Booking.find(pendingRequestsQuery)
      .populate('clientId', 'firstName lastName profileImage phone')
      .sort({ createdAt: -1 })
      .limit(5);
    
    console.log('Found pending requests:', pendingRequests.length);
    pendingRequests.forEach((request, index) => {
      console.log(`Pending Request ${index + 1}:`, {
        id: request._id,
        clientId: request.clientId?._id,
        clientName: request.clientId ? `${request.clientId.firstName} ${request.clientId.lastName}` : 'Unknown',
        serviceCategory: request.serviceCategory,
        status: request.status,
        createdAt: request.createdAt
      });
    });

    // Get statistics
    const totalBookings = await Booking.countDocuments({ workerId: userId });
    const pendingCount = await Booking.countDocuments({ workerId: userId, status: 'pending' });
    const completedCount = await Booking.countDocuments({ workerId: userId, status: 'completed' });

    console.log('Statistics:', { totalBookings, pendingCount, completedCount });

    // Get earnings summary (this month)
    const startDate = new Date();
    startDate.setDate(1); // First day of month
    const endDate = new Date();
    const earningsSummary = await getWorkerEarningsSummary(userId, startDate, endDate);

    // Get notifications
    const notifications = await getUserNotifications(userId, 5);

    res.render('worker/dashboard', {
      title: 'Worker Dashboard',
      worker,
      pendingRequests,
      stats: {
        totalBookings,
        pendingCount,
        completedCount
      },
      earningsSummary,
      notifications
    });
  } catch (error) {
    console.error('Worker dashboard error:', error);
    res.status(500).render('error', {
      title: 'Error',
      error: { status: 500, message: 'Failed to load dashboard' }
    });
  }
};

// View profile
exports.viewProfile = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const worker = await User.findById(userId);

    res.render('worker/profile', {
      title: 'My Profile',
      worker
    });
  } catch (error) {
    console.error('View profile error:', error);
    res.status(500).render('error', {
      title: 'Error',
      error: { status: 500, message: 'Failed to load profile' }
    });
  }
};

// Update profile
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

    // Handle rates object
    const rates = {
      hourly: req.body['rates[hourly]'] ? parseFloat(req.body['rates[hourly]']) : undefined,
      daily: req.body['rates[daily]'] ? parseFloat(req.body['rates[daily]']) : undefined
    };

    const updateData = {
      firstName,
      lastName,
      phone,
      address
    };

    // Only update rates if provided
    if (rates.hourly !== undefined || rates.daily !== undefined) {
      updateData.rates = rates;
    }

    // Handle profile image upload
    if (req.file) {
      updateData.profileImage = `/uploads/${req.file.filename}`;
    }

    // Geocode address to get coordinates
    if (address.street && address.city && address.state) {
      const fullAddress = `${address.street}, ${address.city}, ${address.state}`;
      console.log('Geocoding address:', fullAddress);
      
      try {
        const geocoded = await geocodeAddress(fullAddress);
        if (geocoded) {
          console.log('Geocoded result:', geocoded);
          updateData.address.coordinates = {
            latitude: geocoded.latitude,
            longitude: geocoded.longitude
          };
        } else {
          console.log('Geocoding failed for address:', fullAddress);
        }
      } catch (geocodeError) {
        console.error('Geocoding error:', geocodeError);
      }
    }

    await User.findByIdAndUpdate(userId, updateData);

    // Update session
    req.session.user.firstName = firstName;
    req.session.user.lastName = lastName;

    res.redirect('/worker/profile');
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).render('error', {
      title: 'Error',
      error: { status: 500, message: 'Failed to update profile' }
    });
  }
};

// View service requests
exports.viewRequests = async (req, res) => {
  try {
    const userId = req.session.user.id;
    console.log('\n=== WORKER VIEW REQUESTS ===');
    console.log('Worker ID:', userId);
    console.log('Session user:', req.session.user);
    
    const { status, page = 1 } = req.query;
    const limit = 10;
    const skip = (page - 1) * limit;

    let query = { workerId: userId };
    if (status) {
      query.status = status;
    }

    console.log('Search query:', JSON.stringify(query, null, 2));

    const bookings = await Booking.find(query)
      .populate('clientId', 'firstName lastName email profileImage phone address')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    console.log('Found bookings:', bookings.length);
    bookings.forEach((booking, index) => {
      console.log(`Booking ${index + 1}:`, {
        id: booking._id,
        clientId: booking.clientId?._id,
        clientName: booking.clientId ? `${booking.clientId.firstName} ${booking.clientId.lastName}` : 'Unknown',
        serviceCategory: booking.serviceCategory,
        status: booking.status,
        createdAt: booking.createdAt
      });
    });

    const total = await Booking.countDocuments(query);
    console.log('Total bookings:', total);

    res.render('worker/requests', {
      title: 'Service Requests',
      bookings,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      statusFilter: status
    });
  } catch (error) {
    console.error('View requests error:', error);
    res.status(500).render('error', {
      title: 'Error',
      error: { status: 500, message: 'Failed to load requests' }
    });
  }
};

// View earnings
exports.viewEarnings = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { page = 1, startDate, endDate } = req.query;
    const limit = 10;
    const skip = (page - 1) * limit;

    const payments = await getPaymentHistory(userId, 'worker', limit, skip);

    // Get earnings summary
    const summaryStartDate = startDate ? new Date(startDate) : new Date();
    summaryStartDate.setDate(1);
    const summaryEndDate = endDate ? new Date(endDate) : new Date();
    const earningsSummary = await getWorkerEarningsSummary(userId, summaryStartDate, summaryEndDate);

    const total = await Payment.countDocuments({ workerId: userId });

    res.render('worker/earnings', {
      title: 'Earnings',
      payments: payments || [],
      earningsSummary: earningsSummary || { totalEarnings: 0, totalCommission: 0, totalPayout: 0 },
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit) || 1,
      startDate: startDate || summaryStartDate.toISOString().split('T')[0],
      endDate: endDate || summaryEndDate.toISOString().split('T')[0]
    });
  } catch (error) {
    console.error('View earnings error:', error);
    res.status(500).render('error', {
      title: 'Error',
      error: { status: 500, message: 'Failed to load earnings' }
    });
  }
};

// View skills
exports.viewSkills = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const worker = await User.findById(userId);

    res.render('worker/skills', {
      title: 'Manage Skills',
      worker
    });
  } catch (error) {
    console.error('View skills error:', error);
    res.status(500).render('error', {
      title: 'Error',
      error: { status: 500, message: 'Failed to load skills' }
    });
  }
};

// Add skill
exports.addSkill = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { category, subcategory, experience } = req.body;

    // Validate input
    if (!category) {
      return res.status(400).redirect('/worker/add-skills?error=Category is required');
    }

    // Check if skill already exists
    const worker = await User.findById(userId);
    const existingSkill = worker.skills.find(skill => skill.category === category);
    if (existingSkill) {
      return res.status(400).redirect('/worker/add-skills?error=Skill already exists');
    }

    // Add skill
    worker.skills.push({
      category,
      subcategory: subcategory || '',
      experience: parseInt(experience) || 0
    });

    await worker.save();

    res.redirect('/worker/add-skills?success=Skill added successfully');
  } catch (error) {
    console.error('Add skill error:', error);
    res.status(500).redirect('/worker/add-skills?error=Failed to add skill');
  }
};

// Update skill
exports.updateSkill = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { category, subcategory, experience } = req.body;

    // Validate input
    if (!category) {
      return res.status(400).json({ success: false, message: 'Category is required' });
    }

    // Update skill
    await User.updateOne(
      { _id: userId, 'skills.category': category },
      { $set: { 'skills.$.subcategory': subcategory || '', 'skills.$.experience': parseInt(experience) || 0 } }
    );

    res.json({ success: true, message: 'Skill updated successfully' });
  } catch (error) {
    console.error('Update skill error:', error);
    res.status(500).json({ success: false, message: 'Failed to update skill' });
  }
};

// Delete skill
exports.deleteSkill = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { category } = req.body;

    // Validate input
    if (!category) {
      return res.status(400).json({ success: false, message: 'Category is required' });
    }

    // Remove skill
    await User.updateOne(
      { _id: userId },
      { $pull: { skills: { category } } }
    );

    res.json({ success: true, message: 'Skill deleted successfully' });
  } catch (error) {
    console.error('Delete skill error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete skill' });
  }
};

// Add service area
exports.addServiceArea = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { city, radius } = req.body;

    // Validate input
    if (!city) {
      // Redirect back with error
      const worker = await User.findById(userId);
      return res.status(400).render('worker/add-skills', {
        title: 'Add Skills',
        error: 'City is required',
        worker
      });
    }

    // Add service area
    await User.updateOne(
      { _id: userId },
      { $push: { serviceAreas: { city, radius: parseInt(radius) || 10 } } }
    );

    // Redirect to add-skills page with success message
    const worker = await User.findById(userId);
    res.render('worker/add-skills', {
      title: 'Add Skills',
      success: 'Service area added successfully',
      worker
    });
  } catch (error) {
    console.error('Add service area error:', error);
    const userId = req.session.user.id;
    const worker = await User.findById(userId);
    res.status(500).render('worker/add-skills', {
      title: 'Add Skills',
      error: 'Failed to add service area',
      worker
    });
  }
};

// Delete service area
exports.deleteServiceArea = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { city } = req.body;

    // Validate input
    if (!city) {
      return res.status(400).json({ success: false, message: 'City is required' });
    }

    // Remove service area
    await User.updateOne(
      { _id: userId },
      { $pull: { serviceAreas: { city } } }
    );

    // Return success response
    res.json({ success: true, message: 'Service area deleted successfully' });
  } catch (error) {
    console.error('Delete service area error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete service area' });
  }
};

// Update availability
exports.updateAvailability = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { status } = req.body;

    // Validate input
    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required' });
    }

    // Update availability
    await User.updateOne(
      { _id: userId },
      { $set: { 'availability.status': status } }
    );

    res.redirect('/worker/skills');
  } catch (error) {
    console.error('Update availability error:', error);
    res.status(500).json({ success: false, message: 'Failed to update availability' });
  }
};

// Update rates
exports.updateRates = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { hourly, daily } = req.body;

    // Build rates object
    const rates = {};
    if (hourly !== undefined && hourly !== '') {
      rates.hourly = parseFloat(hourly);
    }
    if (daily !== undefined && daily !== '') {
      rates.daily = parseFloat(daily);
    }

    // Update rates
    await User.updateOne(
      { _id: userId },
      { $set: { rates } }
    );

    res.redirect('/worker/skills');
  } catch (error) {
    console.error('Update rates error:', error);
    res.status(500).json({ success: false, message: 'Failed to update rates' });
  }
};

// View reviews
exports.viewReviews = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { page = 1 } = req.query;
    const limit = 10;
    const skip = (page - 1) * limit;

    const reviews = await Review.find({ workerId: userId, isVisible: true })
      .populate('clientId', 'firstName lastName profileImage')
      .populate('bookingId', 'serviceCategory requestedDate')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const total = await Review.countDocuments({ workerId: userId, isVisible: true });

    res.render('worker/reviews', {
      title: 'My Reviews',
      reviews,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('View reviews error:', error);
    res.status(500).render('error', {
      title: 'Error',
      error: { status: 500, message: 'Failed to load reviews' }
    });
  }
};

// View add skills page
exports.viewAddSkills = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const worker = await User.findById(userId);

    res.render('worker/add-skills', {
      title: 'Add Skills',
      worker
    });
  } catch (error) {
    console.error('View add skills error:', error);
    res.status(500).render('error', {
      title: 'Error',
      error: { status: 500, message: 'Failed to load add skills page' }
    });
  }
};

// Add skills
exports.addSkills = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { category, subcategory, experience } = req.body;

    // Validate input
    if (!category) {
      return res.status(400).render('worker/add-skills', {
        title: 'Add Skills',
        error: 'Category is required',
        worker: await User.findById(userId)
      });
    }

    // Check if skill already exists
    const worker = await User.findById(userId);
    const existingSkill = worker.skills.find(skill => skill.category === category);
    if (existingSkill) {
      return res.status(400).render('worker/add-skills', {
        title: 'Add Skills',
        error: 'Skill already exists',
        worker
      });
    }

    // Add skill
    worker.skills.push({
      category,
      subcategory: subcategory || '',
      experience: parseInt(experience) || 0
    });

    await worker.save();

    res.render('worker/add-skills', {
      title: 'Add Skills',
      success: 'Skill added successfully',
      worker: await User.findById(userId)
    });
  } catch (error) {
    console.error('Add skills error:', error);
    const userId = req.session.user.id;
    res.status(500).render('worker/add-skills', {
      title: 'Add Skills',
      error: 'Failed to add skill',
      worker: await User.findById(userId)
    });
  }
};

