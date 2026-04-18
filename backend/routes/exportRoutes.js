const express = require('express');
const { exportExcel, exportCsv } = require('../controllers/exportController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/responses.xlsx', protect, authorize('admin'), exportExcel);
router.get('/responses.csv', protect, authorize('admin'), exportCsv);

module.exports = router;
