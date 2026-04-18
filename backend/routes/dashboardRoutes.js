const express = require('express');
const { dashboardStats } = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/stats', protect, authorize('admin'), dashboardStats);

module.exports = router;
