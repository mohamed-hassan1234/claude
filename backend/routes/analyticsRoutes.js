const express = require('express');
const { getAnalytics, getReportSummary } = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, authorize('admin'), getAnalytics);
router.get('/report', protect, authorize('admin'), getReportSummary);

module.exports = router;
