const express = require('express');
const {
  exportExcel,
  exportCsv,
  exportAnalyticsSummary,
  exportSectorComparison,
  exportReadinessRanking,
  exportReportSummary
} = require('../controllers/exportController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/responses.xlsx', protect, authorize('admin'), exportExcel);
router.get('/responses.csv', protect, authorize('admin'), exportCsv);
router.get('/analytics-summary.xlsx', protect, authorize('admin'), exportAnalyticsSummary);
router.get('/sector-comparison.xlsx', protect, authorize('admin'), exportSectorComparison);
router.get('/readiness-ranking.xlsx', protect, authorize('admin'), exportReadinessRanking);
router.get('/report-summary.xlsx', protect, authorize('admin'), exportReportSummary);

module.exports = router;
