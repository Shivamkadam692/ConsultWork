const { body, validationResult } = require('express-validator');

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Check if it's an AJAX/API request
    if (req.xhr || req.headers['content-type']?.includes('application/json')) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    // For form submissions, pass errors to the next middleware/controller
    // The controller will handle rendering with errors
    req.validationErrors = errors.array();
    return next();
  }
  next();
};

// Registration validation rules
const validateRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/\d/)
    .withMessage('Password must contain at least one number')
    .matches(/[@$!%*?&]/)
    .withMessage('Password must contain at least one special character (@$!%*?&)'),
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required'),
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required'),
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  validate
];

// Login validation rules
const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  validate
];

// Booking validation rules
const validateBooking = [
  body('serviceCategory')
    .notEmpty()
    .withMessage('Service category is required'),
  body('serviceDescription')
    .trim()
    .notEmpty()
    .isLength({ min: 10 })
    .withMessage('Service description must be at least 10 characters'),
  body('requestedDate')
    .isISO8601()
    .withMessage('Please provide a valid date'),
  body('requestedTime')
    .notEmpty()
    .withMessage('Time is required'),
  body('budget')
    .isFloat({ min: 0 })
    .withMessage('Budget must be a positive number'),
  validate
];

// Review validation rules
const validateReview = [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('reviewText')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Review text must not exceed 1000 characters'),
  validate
];

module.exports = {
  validate,
  validateRegistration,
  validateLogin,
  validateBooking,
  validateReview
};

