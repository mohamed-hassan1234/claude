const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema(
  {
    code: { type: String, required: true },
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'SurveyQuestion', required: true },
    questionText: { type: String, required: true },
    section: { type: String, required: true },
    type: { type: String, required: true },
    scoringKey: { type: String, default: 'none' },
    value: mongoose.Schema.Types.Mixed
  },
  { _id: false }
);

const surveyResponseSchema = new mongoose.Schema(
  {
    respondentName: { type: String, trim: true, default: '' },
    organizationName: { type: String, required: true, trim: true },
    sector: { type: mongoose.Schema.Types.ObjectId, ref: 'Sector', required: true },
    district: { type: String, required: true, trim: true, index: true },
    phoneNumber: { type: String, trim: true, default: '' },
    // Strict storage contract: answers are stored by stable question code using
    // the real answer text selected or typed by the respondent.
    answers: { type: Map, of: mongoose.Schema.Types.Mixed, default: {} },
    // Snapshot used for exports and detail views if question text changes later.
    answerDetails: [answerSchema],
    readinessScore: { type: Number, default: 0, min: 0, max: 100 },
    readinessBand: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Low' },
    awarenessLevel: { type: String, default: 'Unknown' },
    willingnessToAdopt: { type: String, default: 'Unknown' },
    submittedBy: { type: String, enum: ['public', 'admin'], default: 'public' },
    editedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser' },
    deletedAt: Date
  },
  { timestamps: true, toJSON: { flattenMaps: true }, toObject: { flattenMaps: true } }
);

surveyResponseSchema.index({ organizationName: 'text', respondentName: 'text', district: 'text' });

module.exports = mongoose.model('SurveyResponse', surveyResponseSchema);
