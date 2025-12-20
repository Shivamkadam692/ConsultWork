const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');

// Public API endpoints (no authentication required)
router.get('/api/workers/map', clientController.getWorkersForMap);

module.exports = router;