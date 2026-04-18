const SurveyResponse = require('../models/SurveyResponse');
const asyncHandler = require('../utils/asyncHandler');
const { buildResponseQuery } = require('../services/queryService');
const { buildWorkbook, buildCsv } = require('../services/exportService');
const { writeAudit } = require('../services/auditService');

const getExportResponses = (query) =>
  SurveyResponse.find(buildResponseQuery(query)).populate('sector', 'name').sort({ createdAt: -1 });

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

module.exports = { exportExcel, exportCsv };
