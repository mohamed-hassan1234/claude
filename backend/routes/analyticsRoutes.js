const express = require('express');
const {
  getAnalytics,
  getOverviewAnalytics,
  getFilterOptions,
  getQuestionAnalytics,
  getFinalReport,
  getReportSummary
} = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/filter-options', protect, authorize('admin'), getFilterOptions);
router.get('/overview', protect, authorize('admin'), getOverviewAnalytics);
router.get('/questions/:code', protect, authorize('admin'), getQuestionAnalytics);
router.get('/final-report', protect, authorize('admin'), getFinalReport);
router.get('/', protect, authorize('admin'), getAnalytics);
router.get('/report', protect, authorize('admin'), getReportSummary);

module.exports = router;
