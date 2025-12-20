const User = require('../models/User');
const AdminUser = require('../models/AdminUser');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/emailService');
const crypto = require('crypto');
const { geocodeAddress } = require('../services/mapService');

// Register user
exports.register = async (req, res) => {
  try {
    // Check for validation errors
    if (req.validationErrors && req.validationErrors.length > 0) {
      const errorMessages = req.validationErrors.map(err => err.msg).join(', ');
      return res.status(400).render('auth/register', {
        title: 'Register',
        error: errorMessages,
        formData: req.body
      });
    }

    const { email, password, confirmPassword, firstName, lastName, phone, role, address } = req.body;

    // Check password confirmation
    if (password !== confirmPassword) {
      return res.status(400).render('auth/register', {
        title: 'Register',
        error: 'Passwords do not match',
        formData: req.body
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).render('auth/register', {
        title: 'Register',
        error: 'Email already registered',
        formData: req.body
      });
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    // Create user
    const userData = {
      email,
      password,
      firstName,
      lastName,
      phone,
      role: role || 'client',
      address,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires
    };

    // Add worker-specific fields if role is worker
    if (role === 'worker') {
      // Parse skills from registration form
      const primarySkill = req.body.primarySkill;
      const experience = parseInt(req.body.experience) || 0;
      const secondarySkills = req.body.secondarySkills ? 
        req.body.secondarySkills.split(',').map(skill => skill.trim()).filter(skill => skill) : [];
      
      // Create skills array
      userData.skills = [];
      
      // Add primary skill
      if (primarySkill) {
        userData.skills.push({
          category: primarySkill,
          experience: experience
        });
      }
      
      // Add secondary skills
      secondarySkills.forEach(skill => {
        userData.skills.push({
          category: skill,
          experience: 0 // Default to 0 for secondary skills
        });
      });
      
      // Add service area
      if (req.body.serviceCity) {
        userData.serviceAreas = [{
          city: req.body.serviceCity,
          radius: parseInt(req.body.serviceRadius) || 10
        }];
      } else {
        userData.serviceAreas = [];
      }
      
      userData.rates = req.body.rates || {};
      
      // Geocode address to get coordinates
      if (address && address.street && address.city && address.state) {
        const fullAddress = `${address.street}, ${address.city}, ${address.state}`;
        console.log('Geocoding address during registration:', fullAddress);
        
        try {
          const geocoded = await geocodeAddress(fullAddress);
          if (geocoded) {
            console.log('Geocoded result:', geocoded);
            userData.address.coordinates = {
              latitude: geocoded.latitude,
              longitude: geocoded.longitude
            };
          } else {
            console.log('Geocoding failed for address:', fullAddress);
          }
        } catch (geocodeError) {
          console.error('Geocoding error during registration:', geocodeError);
        }
      }
    }

    console.log('Creating user with data:', JSON.stringify(userData, null, 2));
    const user = new User(userData);
    await user.save();
    console.log('User created successfully:', user._id);

    // Send verification email
    await sendVerificationEmail(user, verificationToken);

    req.session.user = {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role
    };

    res.redirect('/');
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).render('auth/register', {
      title: 'Register',
      error: 'Registration failed. Please try again.',
      formData: req.body
    });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    // Check for validation errors
    if (req.validationErrors && req.validationErrors.length > 0) {
      const errorMessages = req.validationErrors.map(err => err.msg).join(', ');
      return res.status(400).render('auth/login', {
        title: 'Login',
        error: errorMessages
      });
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email, isActive: true });
    if (!user) {
      return res.status(401).render('auth/login', {
        title: 'Login',
        error: 'Invalid email or password'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).render('auth/login', {
        title: 'Login',
        error: 'Invalid email or password'
      });
    }

    // Set session
    req.session.user = {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role
    };

    // Redirect based on role
    const returnTo = req.session.returnTo || '/';
    delete req.session.returnTo;

    if (user.role === 'client') {
      res.redirect(returnTo || '/client/dashboard');
    } else if (user.role === 'worker') {
      res.redirect(returnTo || '/worker/dashboard');
    } else if (user.role === 'admin') {
      res.redirect(returnTo || '/admin/dashboard');
    } else {
      res.redirect('/');
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).render('auth/login', {
      title: 'Login',
      error: 'Login failed. Please try again.'
    });
  }
};

// Logout
exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.redirect('/');
  });
};

// Forgot password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.render('auth/forgot-password', {
        title: 'Forgot Password',
        message: 'If an account exists with this email, a password reset link has been sent.'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    // Send reset email
    await sendPasswordResetEmail(user, resetToken);

    res.render('auth/forgot-password', {
      title: 'Forgot Password',
      message: 'If an account exists with this email, a password reset link has been sent.'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).render('auth/forgot-password', {
      title: 'Forgot Password',
      error: 'An error occurred. Please try again.'
    });
  }
};

// Reset password
exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.render('auth/reset-password', {
        title: 'Reset Password',
        error: 'Invalid or expired reset token',
        token
      });
    }

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.redirect('/login');
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).render('auth/reset-password', {
      title: 'Reset Password',
      error: 'An error occurred. Please try again.',
      token: req.body.token
    });
  }
};

// Verify email
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.render('auth/verify-email', {
        title: 'Email Verification',
        error: 'Invalid or expired verification token'
      });
    }

    user.isVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.render('auth/verify-email', {
      title: 'Email Verification',
      success: 'Email verified successfully'
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).render('auth/verify-email', {
      title: 'Email Verification',
      error: 'An error occurred during verification'
    });
  }
};

