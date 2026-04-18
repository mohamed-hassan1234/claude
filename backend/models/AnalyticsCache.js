const mongoose = require('mongoose');

const analyticsCacheSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    filters: { type: Object, default: {} },
    payload: { type: Object, required: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } }
  },
  { timestamps: true }
);

module.exports = mongoose.model('AnalyticsCache', analyticsCacheSchema);
