const express = require('express');
const { listAuditLogs } = require('../controllers/auditController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, authorize('admin'), listAuditLogs);

module.exports = router;
