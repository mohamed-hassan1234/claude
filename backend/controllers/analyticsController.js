const SurveyResponse = require('../models/SurveyResponse');
const asyncHandler = require('../utils/asyncHandler');
const { runPythonAnalytics } = require('../services/analyticsService');
const { writeAudit } = require('../services/auditService');

const attachChartUrls = (analytics, req) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const charts = {};
  for (const [key, value] of Object.entries(analytics.charts || {})) {
    if (!value) {
      charts[key] = '';
      continue;
    }
    const filename = value.replace(/\\/g, '/').split('/').pop();
    charts[key] = `${baseUrl}/analytics-files/${filename}`;
  }
  return { ...analytics, charts };
};

const getAnalytics = asyncHandler(async (req, res) => {
  const analytics = attachChartUrls(await runPythonAnalytics(req.query), req);
  await writeAudit({ req, action: 'run', entity: 'Analytics', metadata: req.query });
  res.json({ analytics });
});

const getReportSummary = asyncHandler(async (req, res) => {
  const analytics = attachChartUrls(await runPythonAnalytics(req.query), req);
  res.json({
    report: {
      generatedAt: new Date(),
      summaryFindings: analytics.summaryFindings,
      sectorComparisons: analytics.sectorComparison,
      mostCommonBarriers: analytics.commonBarriers,
      readinessRanking: analytics.readinessRanking,
      recommendations: analytics.recommendations
    }
  });
});

module.exports = { getAnalytics, getReportSummary };
