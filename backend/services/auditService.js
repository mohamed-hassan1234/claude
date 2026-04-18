const AuditLog = require('../models/AuditLog');

const writeAudit = async ({ req, action, entity, entityId, metadata = {} }) => {
  try {
    await AuditLog.create({
      actor: req.user?._id,
      action,
      entity,
      entityId,
      metadata,
      ipAddress: req.ip
    });
  } catch (error) {
    // Audit logging should never break the user-facing workflow.
    console.warn('Audit log skipped:', error.message);
  }
};

module.exports = { writeAudit };
