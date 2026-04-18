const AuditLog = require('../models/AuditLog');
const asyncHandler = require('../utils/asyncHandler');

const listAuditLogs = asyncHandler(async (req, res) => {
  const logs = await AuditLog.find().populate('actor', 'name email').sort({ createdAt: -1 }).limit(100);
  res.json({ logs });
});

module.exports = { listAuditLogs };
