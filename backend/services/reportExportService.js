const ExcelJS = require('exceljs');

const safeCell = (value) => {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object') return JSON.stringify(value);
  return value;
};

const autosize = (worksheet, rows = []) => {
  const widths = new Map();

  rows.forEach((row) => {
    Object.entries(row).forEach(([key, value]) => {
      const width = String(safeCell(value)).length + 4;
      widths.set(key, Math.min(Math.max(widths.get(key) || 16, width), 48));
    });
  });

  worksheet.columns = Object.keys(rows[0] || {}).map((key) => ({
    header: key,
    key,
    width: widths.get(key) || 18
  }));
};

const addTableSheet = (workbook, name, rows = []) => {
  const sheet = workbook.addWorksheet(name);
  const normalizedRows = rows.length ? rows.map((row) => Object.fromEntries(Object.entries(row).map(([key, value]) => [key, safeCell(value)]))) : [{ message: 'No data available' }];
  autosize(sheet, normalizedRows);
  normalizedRows.forEach((row) => sheet.addRow(row));
  sheet.getRow(1).font = { bold: true };
  sheet.views = [{ state: 'frozen', ySplit: 1 }];
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: Math.max(sheet.columns.length, 1) }
  };
  return sheet;
};

const addKeyValueSheet = (workbook, name, rows = []) => {
  const sheet = workbook.addWorksheet(name);
  sheet.columns = [
    { header: 'Key', key: 'key', width: 34 },
    { header: 'Value', key: 'value', width: 80 }
  ];
  rows.forEach((row) => sheet.addRow({ key: row.key, value: safeCell(row.value) }));
  sheet.getRow(1).font = { bold: true };
  sheet.views = [{ state: 'frozen', ySplit: 1 }];
  return sheet;
};

const addListSheet = (workbook, name, items = [], header = 'Item') => {
  const sheet = workbook.addWorksheet(name);
  sheet.columns = [{ header, key: 'item', width: 110 }];
  (items.length ? items : ['No data available']).forEach((item) => sheet.addRow({ item: safeCell(item) }));
  sheet.getRow(1).font = { bold: true };
  return sheet;
};

const buildQuestionAnalysisRows = (analytics) =>
  (analytics.questionAnalysis || []).flatMap((item) => {
    if (item.type === 'text') {
      const themes = item.textAnalysis?.themes || [];
      if (!themes.length) {
        return [
          {
            code: item.code,
            question: item.question,
            type: 'text',
            theme: 'No dominant theme',
            count: 0,
            percentage: 0,
            interpretation: item.interpretation
          }
        ];
      }

      return themes.map((theme) => ({
        code: item.code,
        question: item.question,
        type: 'text',
        theme: theme.theme,
        count: theme.count,
        percentage: theme.percentage,
        keywords: safeCell(theme.keywords),
        examples: safeCell(theme.examples),
        interpretation: item.interpretation
      }));
    }

    const answers = item.answers || [];
    if (!answers.length) {
      return [
        {
          code: item.code,
          question: item.question,
          type: 'closed',
          answer: 'No answer',
          count: 0,
          percentage: 0,
          interpretation: item.interpretation
        }
      ];
    }

    return answers.map((answer) => ({
      code: item.code,
      question: item.question,
      type: 'closed',
      answer: answer.answer,
      count: answer.count,
      percentage: answer.percentage,
      interpretation: item.interpretation
    }));
  });

const stripNestedArrays = (rows = []) =>
  rows.map((row) =>
    Object.fromEntries(
      Object.entries(row)
        .filter(([, value]) => typeof value !== 'object' || Array.isArray(value))
        .map(([key, value]) => [key, safeCell(value)])
    )
  );

const buildAnalyticsSummaryWorkbook = async (analytics) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Cloud Survey System';
  workbook.subject = 'Analytics Summary Export';
  workbook.title = 'Analytics Summary';

  addKeyValueSheet(workbook, 'Overview', [
    { key: 'Generated At', value: analytics.generatedAt },
    { key: 'Total Responses', value: analytics.totals?.totalResponses || 0 },
    { key: 'Total Sectors Covered', value: analytics.totals?.totalSectorsCovered || 0 },
    { key: 'Total Districts Covered', value: analytics.totals?.totalDistrictsCovered || 0 },
    { key: 'Responses Today', value: analytics.totals?.responsesToday || 0 },
    { key: 'Responses This Week', value: analytics.totals?.responsesThisWeek || 0 },
    { key: 'Average Cloud Readiness Score', value: analytics.totals?.averageCloudReadinessScore || 0 },
    { key: 'Awareness Rate', value: `${analytics.totals?.awarenessRate || 0}%` },
    { key: 'Adoption Willingness Rate', value: `${analytics.totals?.adoptionWillingnessRate || 0}%` },
    { key: 'Cloud Tools Usage Rate', value: `${analytics.totals?.cloudToolsUsageRate || 0}%` },
    { key: 'Backup Practice Rate', value: `${analytics.totals?.backupPracticeRate || 0}%` },
    { key: 'Infrastructure Stability Rate', value: `${analytics.totals?.infrastructureStabilityRate || 0}%` },
    { key: 'Security Trust Rate', value: `${analytics.totals?.securityTrustRate || 0}%` },
    { key: 'Executive Summary', value: analytics.overview?.executiveSummary || '' }
  ]);

  addListSheet(workbook, 'Key Findings', analytics.summaryFindings || []);
  addListSheet(workbook, 'Recommendations', analytics.recommendations || []);
  addTableSheet(workbook, 'Factor Summary', analytics.factorSummary || []);
  addTableSheet(workbook, 'Question Analysis', buildQuestionAnalysisRows(analytics));
  addTableSheet(workbook, 'Sector Comparison', stripNestedArrays(analytics.sectorComparison?.rows || []));
  addTableSheet(workbook, 'District Comparison', stripNestedArrays(analytics.districtComparison?.rows || []));
  addTableSheet(workbook, 'Gap Analysis', analytics.gapAnalysis?.overall || []);
  addTableSheet(workbook, 'Barrier Ranking', analytics.barriers?.overallRanking || []);
  addTableSheet(workbook, 'Security Concerns', analytics.security?.securityConcerns || []);
  addTableSheet(workbook, 'Business Themes', analytics.businessNeeds?.themeCards || []);

  return workbook;
};

const buildSectorComparisonWorkbook = async (analytics) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Cloud Survey System';
  workbook.subject = 'Sector Comparison Export';
  workbook.title = 'Sector Comparison';

  addTableSheet(workbook, 'Sector Comparison', stripNestedArrays(analytics.sectorComparison?.rows || []));
  addTableSheet(workbook, 'Sector Gaps', analytics.gapAnalysis?.sectorGaps || []);
  addTableSheet(
    workbook,
    'Sector Barriers',
    (analytics.barriers?.bySector || []).map((item) => ({
      sector: item.sector,
      topBarrier: item.topBarrier,
      trainingNeedRate: `${item.trainingNeedRate}%`,
      skillsGapRate: `${item.skillsGapRate}%`,
      averageReadiness: `${item.averageReadiness}%`
    }))
  );

  return workbook;
};

const buildReadinessRankingWorkbook = async (analytics) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Cloud Survey System';
  workbook.subject = 'Readiness Ranking Export';
  workbook.title = 'Readiness Ranking';

  addTableSheet(workbook, 'Sector Ranking', analytics.readiness?.sectorLeaderboard || []);
  addTableSheet(workbook, 'District Ranking', analytics.readiness?.districtLeaderboard || []);
  addTableSheet(workbook, 'Response Ranking', analytics.readiness?.responseRanking || []);
  addTableSheet(workbook, 'Factor Breakdown', analytics.readiness?.factorBreakdown || []);
  addTableSheet(workbook, 'Readiness Distribution', analytics.readiness?.distribution || []);

  return workbook;
};

const buildPresentationReportWorkbook = async (analytics) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Cloud Survey System';
  workbook.subject = 'Presentation Report Export';
  workbook.title = 'Presentation Report';

  addKeyValueSheet(workbook, 'Report Summary', [
    { key: 'Title', value: analytics.reportView?.title || '' },
    { key: 'Subtitle', value: analytics.reportView?.subtitle || '' },
    { key: 'Executive Summary', value: analytics.reportView?.executiveSummary || '' },
    { key: 'Conclusion', value: analytics.reportView?.conclusion || '' }
  ]);
  addListSheet(workbook, 'Key Findings', analytics.reportView?.keyFindings || []);
  addTableSheet(workbook, 'Readiness Ranking', analytics.reportView?.readinessRanking || []);
  addTableSheet(workbook, 'Top Barriers', analytics.reportView?.topBarriers || []);
  addTableSheet(workbook, 'Top Opportunities', analytics.reportView?.topOpportunities || []);
  addListSheet(workbook, 'Recommendations', analytics.reportView?.recommendations || []);

  return workbook;
};

module.exports = {
  buildAnalyticsSummaryWorkbook,
  buildSectorComparisonWorkbook,
  buildReadinessRankingWorkbook,
  buildPresentationReportWorkbook
};
