const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { isNotAuthenticated, isAuthenticated } = require('../middleware/auth');
const { validateRegistration, validateLogin } = require('../middleware/validation');

// Register
router.get('/register', isNotAuthenticated, (req, res) => {
  res.render('auth/register', { title: 'Register' });
});

router.post('/register', isNotAuthenticated, validateRegistration, authController.register);

// Login
router.get('/login', isNotAuthenticated, (req, res) => {
  res.render('auth/login', { title: 'Login' });
});

router.post('/login', isNotAuthenticated, validateLogin, authController.login);

// Logout
router.get('/logout', isAuthenticated, authController.logout);

// Forgot password
router.get('/forgot-password', isNotAuthenticated, (req, res) => {
  res.render('auth/forgot-password', { title: 'Forgot Password' });
});

router.post('/forgot-password', isNotAuthenticated, authController.forgotPassword);

// Reset password
router.get('/reset-password', isNotAuthenticated, (req, res) => {
  const { token } = req.query;
  res.render('auth/reset-password', { title: 'Reset Password', token });
});

router.post('/reset-password', isNotAuthenticated, authController.resetPassword);

// Verify email
router.get('/verify-email', authController.verifyEmail);

module.exports = router;

