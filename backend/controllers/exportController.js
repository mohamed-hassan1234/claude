const SurveyResponse = require('../models/SurveyResponse');
const asyncHandler = require('../utils/asyncHandler');
const { buildCompatibleResponseQuery } = require('../services/queryService');
const { buildWorkbook, buildCsv } = require('../services/exportService');
const { runPythonAnalytics } = require('../services/analyticsService');
const {
  buildAnalyticsSummaryWorkbook,
  buildSectorComparisonWorkbook,
  buildReadinessRankingWorkbook,
  buildPresentationReportWorkbook
} = require('../services/reportExportService');
const { normalizeResponseSectors } = require('../services/responseCompatibilityService');
const { writeAudit } = require('../services/auditService');

const getExportResponses = async (query) => {
  const filter = await buildCompatibleResponseQuery(query);
  const responses = await SurveyResponse.find(filter).sort({ createdAt: -1 }).lean();
  return normalizeResponseSectors(responses);
};

const exportExcel = asyncHandler(async (req, res) => {
  const responses = await getExportResponses(req.query);
  const workbook = await buildWorkbook(responses);
  const filename = `cloud-survey-responses-${Date.now()}.xlsx`;

  await writeAudit({ req, action: 'export_excel', entity: 'SurveyResponse', metadata: { count: responses.length } });
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  await workbook.xlsx.write(res);
  res.end();
});

const exportCsv = asyncHandler(async (req, res) => {
  const responses = await getExportResponses(req.query);
  const csv = await buildCsv(responses);

  await writeAudit({ req, action: 'export_csv', entity: 'SurveyResponse', metadata: { count: responses.length } });
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="cloud-survey-responses-${Date.now()}.csv"`);
  res.send(csv);
});

const sendWorkbook = async (req, res, workbook, filename, action) => {
  await writeAudit({ req, action, entity: 'AnalyticsExport', metadata: req.query });
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  await workbook.xlsx.write(res);
  res.end();
};

const exportAnalyticsSummary = asyncHandler(async (req, res) => {
  const analytics = await runPythonAnalytics(req.query);
  const workbook = await buildAnalyticsSummaryWorkbook(analytics);
  await sendWorkbook(req, res, workbook, `cloud-survey-analytics-summary-${Date.now()}.xlsx`, 'export_analytics_summary');
});

const exportSectorComparison = asyncHandler(async (req, res) => {
  const analytics = await runPythonAnalytics(req.query);
  const workbook = await buildSectorComparisonWorkbook(analytics);
  await sendWorkbook(req, res, workbook, `cloud-survey-sector-comparison-${Date.now()}.xlsx`, 'export_sector_comparison');
});

const exportReadinessRanking = asyncHandler(async (req, res) => {
  const analytics = await runPythonAnalytics(req.query);
  const workbook = await buildReadinessRankingWorkbook(analytics);
  await sendWorkbook(req, res, workbook, `cloud-survey-readiness-ranking-${Date.now()}.xlsx`, 'export_readiness_ranking');
});

const exportReportSummary = asyncHandler(async (req, res) => {
  const analytics = await runPythonAnalytics(req.query);
  const workbook = await buildPresentationReportWorkbook(analytics);
  await sendWorkbook(req, res, workbook, `cloud-survey-report-summary-${Date.now()}.xlsx`, 'export_report_summary');
});

module.exports = {
  exportExcel,
  exportCsv,
  exportAnalyticsSummary,
  exportSectorComparison,
  exportReadinessRanking,
  exportReportSummary
};
