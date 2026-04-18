const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    value: { type: String, required: true }
  },
  { _id: false }
);

const surveyQuestionSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, trim: true, index: { unique: true, sparse: true } },
    section: { type: String, required: true, trim: true },
    text: { type: String, required: true, trim: true },
    helpText: { type: String, trim: true, default: '' },
    type: {
      type: String,
      enum: ['short_text', 'paragraph', 'multiple_choice', 'single_select', 'likert', 'yes_no', 'numeric'],
      required: true
    },
    options: [optionSchema],
    order: { type: Number, required: true, index: true },
    required: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    scoringKey: {
      type: String,
      enum: ['awareness', 'technology', 'infrastructure', 'backup', 'cloudTools', 'securityTrust', 'willingness', 'none'],
      default: 'none'
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('SurveyQuestion', surveyQuestionSchema);
