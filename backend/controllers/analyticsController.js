const SurveyResponse = require('../models/SurveyResponse');
const asyncHandler = require('../utils/asyncHandler');
const { runPythonAnalytics } = require('../services/analyticsService');
const { writeAudit } = require('../services/auditService');

const attachChartUrls = (files = {}, req) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const chartFiles = {};
  for (const [key, value] of Object.entries(files || {})) {
    if (!value) {
      chartFiles[key] = '';
      continue;
    }
    const filename = value.replace(/\\/g, '/').split('/').pop();
    chartFiles[key] = `${baseUrl}/analytics-files/${filename}`;
  }
  return chartFiles;
};

const normalizeAnalytics = (analytics, req) => {
  const next = { ...analytics };

  if (!next.chartFiles && next.charts) {
    const stringCharts = Object.fromEntries(
      Object.entries(next.charts).filter(([, value]) => typeof value === 'string')
    );
    if (Object.keys(stringCharts).length) {
      next.chartFiles = stringCharts;
      next.charts = {};
    }
  }

  next.chartFiles = attachChartUrls(next.chartFiles, req);
  return next;
};

const getAnalytics = asyncHandler(async (req, res) => {
  const analytics = normalizeAnalytics(await runPythonAnalytics(req.query), req);
  await writeAudit({ req, action: 'run', entity: 'Analytics', metadata: req.query });
  res.json({ analytics });
});

const getReportSummary = asyncHandler(async (req, res) => {
  const analytics = normalizeAnalytics(await runPythonAnalytics(req.query), req);
  res.json({
    report: {
      generatedAt: analytics.generatedAt || new Date(),
      executiveSummary: analytics.reportView?.executiveSummary || '',
      summaryFindings: analytics.summaryFindings,
      sectorComparisons: analytics.sectorComparison?.rows || analytics.sectorComparison || [],
      mostCommonBarriers: analytics.barriers?.overallRanking || analytics.commonBarriers || [],
      readinessRanking: analytics.readiness?.sectorLeaderboard || analytics.readinessRanking || [],
      recommendations: analytics.recommendationBlocks?.overall || analytics.recommendations || [],
      topOpportunities: analytics.reportView?.topOpportunities || [],
      conclusion: analytics.reportView?.conclusion || ''
    }
  });
});

module.exports = { getAnalytics, getReportSummary };
