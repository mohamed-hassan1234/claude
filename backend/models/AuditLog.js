const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser' },
    action: { type: String, required: true },
    entity: { type: String, required: true },
    entityId: String,
    metadata: { type: Object, default: {} },
    ipAddress: String
  },
  { timestamps: true }
);

module.exports = mongoose.model('AuditLog', auditLogSchema);
