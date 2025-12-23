const express = require('express');
const router = express.Router();
const workerController = require('../controllers/workerController');
const { isAuthenticated, isWorker } = require('../middleware/auth');
const { uploadSingle } = require('../middleware/upload');

// All routes require authentication and worker role
router.use(isAuthenticated);
router.use(isWorker);

// Dashboard
router.get('/dashboard', workerController.dashboard);

// Profile
router.get('/profile', workerController.viewProfile);
router.post('/profile', uploadSingle('profileImage'), workerController.updateProfile);

// Service requests
router.get('/requests', workerController.viewRequests);

// Accept/reject client from search
router.post('/client-action/:id/:action', workerController.handleClientAction);

// Earnings
router.get('/earnings', workerController.viewEarnings);

// Skills management
router.get('/skills', workerController.viewSkills);
router.get('/add-skills', workerController.viewAddSkills);
router.post('/add-skills', workerController.addSkills);
router.post('/add-skill', workerController.addSkill);
router.post('/update-skill', workerController.updateSkill);
router.post('/delete-skill', workerController.deleteSkill);

// Service areas
router.post('/add-service-area', workerController.addServiceArea);
router.post('/delete-service-area', workerController.deleteServiceArea);

// Availability
router.post('/update-availability', workerController.updateAvailability);

// Rates
router.post('/update-rates', workerController.updateRates);

// Reviews
router.get('/reviews', workerController.viewReviews);


module.exports = router;

