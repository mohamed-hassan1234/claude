const { body, validationResult } = require('express-validator');

const SurveyResponse = require('../models/SurveyResponse');
const SurveyQuestion = require('../models/SurveyQuestion');
const Sector = require('../models/Sector');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { scoreResponse, extractAnswerByCode } = require('../services/readinessService');
const { buildResponseQuery } = require('../services/queryService');
const { writeAudit } = require('../services/auditService');

const responseValidators = [
  body('organizationName').trim().notEmpty().withMessage('Organization/business name is required'),
  body('sector').isMongoId().withMessage('Sector is required'),
  body('district').trim().notEmpty().withMessage('District is required'),
  body('answers').custom((value) => value && typeof value === 'object' && !Array.isArray(value)).withMessage('Answers must be an object keyed by q1, q2, q3...')
];

const normalizeScalar = (value) => String(value ?? '').trim();

const normalizeAnswerValue = (question, value) => {
  if (question.type === 'multiple_choice') {
    const values = Array.isArray(value) ? value : value ? [value] : [];
    return values.map(normalizeScalar).filter(Boolean);
  }
  return normalizeScalar(value);
};

const assertRealOptionLabels = (question, value) => {
  if (!['multiple_choice', 'single_select', 'likert', 'yes_no'].includes(question.type)) return;

  const optionLabels = question.type === 'yes_no' && (!question.options || question.options.length === 0)
    ? ['Haa', 'Maya']
    : (question.options || []).map((item) => item.label);
  const allowed = new Set(optionLabels);
  const selected = Array.isArray(value) ? value : value ? [value] : [];

  for (const item of selected) {
    if (!allowed.has(item)) {
      throw new ApiError(400, `Invalid answer for ${question.code}. Answers must use the real option text, not indexes or IDs.`);
    }
  }
};

const hydrateAnswers = async (submittedAnswers = {}) => {
  const questions = await SurveyQuestion.find({ isActive: true }).sort({ order: 1 });
  const answers = {};
  const answerDetails = [];

  for (const question of questions) {
    const hasAnswer = Object.prototype.hasOwnProperty.call(submittedAnswers, question.code);
    const normalized = normalizeAnswerValue(question, submittedAnswers[question.code]);
    const isEmpty = Array.isArray(normalized) ? normalized.length === 0 : normalized === '';

    if (question.required && (!hasAnswer || isEmpty)) {
      throw new ApiError(400, `Required question missing: ${question.text}`);
    }

    if (!hasAnswer || isEmpty) continue;

    assertRealOptionLabels(question, normalized);
    answers[question.code] = normalized;
    answerDetails.push({
      code: question.code,
      questionId: question._id,
      questionText: question.text,
      section: question.section,
      type: question.type,
      scoringKey: question.scoringKey,
      value: normalized
    });
  }

  return { answers, answerDetails };
};

const listResponses = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);
  const filter = buildResponseQuery(req.query);

  const [responses, total] = await Promise.all([
    SurveyResponse.find(filter)
      .populate('sector', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    SurveyResponse.countDocuments(filter)
  ]);

  res.json({ responses, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

const getResponse = asyncHandler(async (req, res) => {
  const response = await SurveyResponse.findOne({ _id: req.params.id, deletedAt: { $exists: false } }).populate('sector', 'name');
  if (!response) throw new ApiError(404, 'Response not found');
  res.json({ response });
});

const createResponse = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw new ApiError(400, errors.array()[0].msg);

  const sector = await Sector.findById(req.body.sector);
  if (!sector || !sector.isActive) throw new ApiError(400, 'Selected sector is invalid');

  const { answers, answerDetails } = await hydrateAnswers(req.body.answers);
  const { readinessScore, readinessBand } = scoreResponse(answerDetails);

  const response = await SurveyResponse.create({
    respondentName: req.body.respondentName || '',
    organizationName: req.body.organizationName,
    sector: req.body.sector,
    district: req.body.district,
    phoneNumber: req.body.phoneNumber || '',
    answers,
    answerDetails,
    readinessScore,
    readinessBand,
    awarenessLevel: extractAnswerByCode(answers, 'q5'),
    willingnessToAdopt: extractAnswerByCode(answers, 'q27'),
    submittedBy: req.user ? 'admin' : 'public'
  });

  if (req.user) await writeAudit({ req, action: 'create', entity: 'SurveyResponse', entityId: response._id.toString() });
  res.status(201).json({ response });
});

const updateResponse = asyncHandler(async (req, res) => {
  const hydrated = req.body.answers ? await hydrateAnswers(req.body.answers) : null;
  const scoring = hydrated ? scoreResponse(hydrated.answerDetails) : {};

  const payload = {
    respondentName: req.body.respondentName,
    organizationName: req.body.organizationName,
    sector: req.body.sector,
    district: req.body.district,
    phoneNumber: req.body.phoneNumber,
    ...(hydrated
      ? {
          answers: hydrated.answers,
          answerDetails: hydrated.answerDetails,
          readinessScore: scoring.readinessScore,
          readinessBand: scoring.readinessBand,
          awarenessLevel: extractAnswerByCode(hydrated.answers, 'q5'),
          willingnessToAdopt: extractAnswerByCode(hydrated.answers, 'q27')
        }
      : {}),
    editedBy: req.user._id
  };

  Object.keys(payload).forEach((key) => payload[key] === undefined && delete payload[key]);

  const response = await SurveyResponse.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
  if (!response) throw new ApiError(404, 'Response not found');
  await writeAudit({ req, action: 'update', entity: 'SurveyResponse', entityId: response._id.toString() });
  res.json({ response });
});

const deleteResponse = asyncHandler(async (req, res) => {
  const response = await SurveyResponse.findByIdAndUpdate(req.params.id, { deletedAt: new Date(), editedBy: req.user._id });
  if (!response) throw new ApiError(404, 'Response not found');
  await writeAudit({ req, action: 'delete', entity: 'SurveyResponse', entityId: response._id.toString() });
  res.json({ message: 'Response deleted' });
});

const bulkDeleteResponses = asyncHandler(async (req, res) => {
  const ids = req.body.ids || [];
  await SurveyResponse.updateMany({ _id: { $in: ids } }, { deletedAt: new Date(), editedBy: req.user._id });
  await writeAudit({ req, action: 'bulk_delete', entity: 'SurveyResponse', metadata: { count: ids.length } });
  res.json({ message: 'Selected responses deleted' });
});

module.exports = {
  responseValidators,
  listResponses,
  getResponse,
  createResponse,
  updateResponse,
  deleteResponse,
  bulkDeleteResponses
};
