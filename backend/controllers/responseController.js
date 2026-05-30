const { body, validationResult } = require('express-validator');

const SurveyResponse = require('../models/SurveyResponse');
const Sector = require('../models/Sector');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { scoreResponse, extractAnswerByCode } = require('../services/readinessService');
const { buildCompatibleResponseQuery } = require('../services/queryService');
const { normalizeResponseSectors } = require('../services/responseCompatibilityService');
const { hydrateAnswers } = require('../services/responseHydrationService');
const { importCsvResponses, previewCsvImport } = require('../services/csvImportService');
const { writeAudit } = require('../services/auditService');

const responseValidators = [
  body('organizationName').trim().notEmpty().withMessage('Organization/business name is required'),
  body('sector').isMongoId().withMessage('Sector is required'),
  body('district').trim().notEmpty().withMessage('District is required'),
  body('answers').custom((value) => value && typeof value === 'object' && !Array.isArray(value)).withMessage('Answers must be an object keyed by q1, q2, q3...')
];

const listResponses = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);
  const filter = await buildCompatibleResponseQuery(req.query);

  const [responses, total] = await Promise.all([
    SurveyResponse.find(filter)
      .lean()
      .sort({ submittedAt: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    SurveyResponse.countDocuments(filter)
  ]);

  res.json({
    responses: await normalizeResponseSectors(responses),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) }
  });
});

const getResponse = asyncHandler(async (req, res) => {
  const response = await SurveyResponse.findOne({
    _id: req.params.id,
    $or: [{ deletedAt: { $exists: false } }, { deletedAt: null }]
  }).lean();

  if (!response) throw new ApiError(404, 'Response not found');
  const [normalized] = await normalizeResponseSectors([response]);
  res.json({ response: normalized });
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
    awarenessLevel: extractAnswerByCode(answers, 'q6'),
    willingnessToAdopt: extractAnswerByCode(answers, 'q29'),
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
          awarenessLevel: extractAnswerByCode(hydrated.answers, 'q6'),
          willingnessToAdopt: extractAnswerByCode(hydrated.answers, 'q29')
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

const previewImportResponses = asyncHandler(async (req, res) => {
  if (!req.body.csv) throw new ApiError(400, 'CSV content is required');
  const preview = await previewCsvImport(req.body.csv);
  res.json({ preview });
});

const importResponses = asyncHandler(async (req, res) => {
  if (!req.body.csv) throw new ApiError(400, 'CSV content is required');

  const result = await importCsvResponses({
    csvText: req.body.csv,
    mapping: req.body.mapping || {},
    timestampColumn: req.body.timestampColumn || '',
    importedBy: req.user?._id,
    source: req.body.filename || 'Google Forms CSV'
  });

  await writeAudit({
    req,
    action: 'import_csv',
    entity: 'SurveyResponse',
    metadata: result.summary
  });

  res.status(201).json({ importResult: result });
});

module.exports = {
  responseValidators,
  listResponses,
  getResponse,
  createResponse,
  updateResponse,
  deleteResponse,
  bulkDeleteResponses,
  previewImportResponses,
  importResponses
};
