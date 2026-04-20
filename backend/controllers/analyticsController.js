const SurveyQuestion = require('../models/SurveyQuestion');
const SurveyResponse = require('../models/SurveyResponse');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { runPythonAnalytics } = require('../services/analyticsService');
const { writeAudit } = require('../services/auditService');
const {
  createEmptyAnalyticsPayload,
  localeSort,
  normalizeAnalyticsPayload,
  buildNoDataQuestionReport,
  buildQuestionReport,
  buildOverviewReport,
  buildFinalReport
} = require('../services/reportAnalyticsService');

const BASE_FILTER = { $or: [{ deletedAt: { $exists: false } }, { deletedAt: null }] };

const logAnalyticsError = (scope, error, metadata = {}) => {
  const message = error?.message || 'Unknown analytics error';
  console.error(`[Analytics:${scope}] ${message}`, metadata);
  if (error?.stack) {
    console.error(error.stack);
  }
};

const safeWriteAudit = async (payload) => {
  try {
    await writeAudit(payload);
  } catch (error) {
    logAnalyticsError('audit', error, payload?.metadata || {});
  }
};

const getNormalizedAnalytics = async (req) => normalizeAnalyticsPayload(await runPythonAnalytics(req.query), req);

const getAnalytics = asyncHandler(async (req, res) => {
  try {
    const analytics = await getNormalizedAnalytics(req);
    await safeWriteAudit({ req, action: 'run', entity: 'Analytics', metadata: req.query });
    return res.json({ analytics });
  } catch (error) {
    logAnalyticsError('all', error, { filters: req.query });
    return res.status(200).json({
      analytics: normalizeAnalyticsPayload(createEmptyAnalyticsPayload(), req),
      warning: 'Analytics fallback used'
    });
  }
});

const getOverviewAnalytics = asyncHandler(async (req, res) => {
  try {
    const analytics = await getNormalizedAnalytics(req);
    await safeWriteAudit({ req, action: 'run_overview_analysis', entity: 'Analytics', metadata: req.query });
    return res.json({ overviewReport: buildOverviewReport(analytics) });
  } catch (error) {
    logAnalyticsError('overview', error, { filters: req.query });
    return res.status(200).json({
      overviewReport: buildOverviewReport(createEmptyAnalyticsPayload()),
      warning: 'Analytics fallback used'
    });
  }
});

const getFilterOptions = asyncHandler(async (req, res) => {
  try {
    const districts = localeSort(
      (await SurveyResponse.distinct('district', BASE_FILTER)).filter((item) => String(item || '').trim())
    );

    return res.json({ filters: { districts } });
  } catch (error) {
    logAnalyticsError('filter-options', error);
    return res.status(200).json({ filters: { districts: [] }, warning: 'Filter fallback used' });
  }
});

const getQuestionAnalytics = asyncHandler(async (req, res) => {
  const code = String(req.params.code || '').toLowerCase();
  const question = await SurveyQuestion.findOne({ code }).lean();

  if (!question) {
    throw new ApiError(404, 'Question analysis not found');
  }

  try {
    const analytics = await getNormalizedAnalytics(req);
    const questionReport = buildQuestionReport(question, analytics);

    await safeWriteAudit({
      req,
      action: 'run_question_analysis',
      entity: 'Analytics',
      metadata: { ...req.query, questionCode: code }
    });

    return res.json({ questionReport });
  } catch (error) {
    logAnalyticsError('question', error, { questionCode: code, filters: req.query });
    return res.status(200).json({
      questionReport: buildNoDataQuestionReport(question, 0, 'Xog lagama helin filter-kan.'),
      warning: 'Analytics fallback used'
    });
  }
});

const getFinalReport = asyncHandler(async (req, res) => {
  try {
    const analytics = await getNormalizedAnalytics(req);
    const finalReport = buildFinalReport(analytics);

    await safeWriteAudit({ req, action: 'run_final_report', entity: 'Analytics', metadata: req.query });
    return res.json({ finalReport });
  } catch (error) {
    logAnalyticsError('final-report', error, { filters: req.query });
    return res.status(200).json({
      finalReport: buildFinalReport(createEmptyAnalyticsPayload()),
      warning: 'Analytics fallback used'
    });
  }
});

const getReportSummary = asyncHandler(async (req, res) => {
  try {
    const analytics = await getNormalizedAnalytics(req);
    return res.json({ report: buildFinalReport(analytics) });
  } catch (error) {
    logAnalyticsError('report-summary', error, { filters: req.query });
    return res.status(200).json({
      report: buildFinalReport(createEmptyAnalyticsPayload()),
      warning: 'Analytics fallback used'
    });
  }
});

module.exports = {
  getAnalytics,
  getOverviewAnalytics,
  getFilterOptions,
  getQuestionAnalytics,
  getFinalReport,
  getReportSummary
};
