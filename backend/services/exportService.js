const ExcelJS = require('exceljs');
const { Parser } = require('json2csv');

const SurveyQuestion = require('../models/SurveyQuestion');

const toPlainAnswers = (response) => {
  if (!response.answers) return {};
  if (response.answers instanceof Map) return Object.fromEntries(response.answers.entries());
  return response.answers;
};

const displayValue = (value) => {
  if (Array.isArray(value)) return value.join(', ');
  return value ?? '';
};

const flattenResponse = (response, questions = []) => {
  const answers = toPlainAnswers(response);
  const row = {
    id: response._id.toString(),
    respondentName: response.respondentName,
    organizationName: response.organizationName,
    sector: response.sector?.name || '',
    district: response.district,
    phoneNumber: response.phoneNumber,
    awarenessLevel: response.awarenessLevel,
    willingnessToAdopt: response.willingnessToAdopt,
    readinessScore: response.readinessScore,
    readinessBand: response.readinessBand,
    submittedAt: response.createdAt
  };

  const questionList = questions.length ? questions : response.answerDetails || [];
  for (const question of questionList) {
    const code = question.code;
    const text = question.text || question.questionText;
    row[text] = displayValue(answers[code]);
  }

  return row;
};

const getQuestions = () => SurveyQuestion.find().sort({ order: 1, createdAt: 1 }).lean();

const buildWorkbook = async (responses) => {
  const questions = await getQuestions();
  const rows = responses.map((response) => flattenResponse(response, questions));
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Cloud Survey System';
  const worksheet = workbook.addWorksheet('Survey Responses');

  const metadataColumns = [
    'id',
    'respondentName',
    'organizationName',
    'sector',
    'district',
    'phoneNumber',
    'awarenessLevel',
    'willingnessToAdopt',
    'readinessScore',
    'readinessBand',
    'submittedAt'
  ];
  const questionColumns = questions.map((question) => question.text);
  const columns = [...metadataColumns, ...questionColumns];

  worksheet.columns = columns.map((key) => ({
    header: key,
    key,
    width: Math.min(Math.max(key.length + 4, 16), 60)
  }));

  rows.forEach((row) => worksheet.addRow(row));
  worksheet.getRow(1).font = { bold: true };
  worksheet.views = [{ state: 'frozen', ySplit: 1 }];
  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: columns.length || 1 }
  };

  return workbook;
};

const buildCsv = async (responses) => {
  const questions = await getQuestions();
  const rows = responses.map((response) => flattenResponse(response, questions));
  const fields = [
    'id',
    'respondentName',
    'organizationName',
    'sector',
    'district',
    'phoneNumber',
    'awarenessLevel',
    'willingnessToAdopt',
    'readinessScore',
    'readinessBand',
    'submittedAt',
    ...questions.map((question) => question.text)
  ];
  return new Parser({ fields }).parse(rows);
};

const flattenResponsesForAnalytics = async (responses) => {
  const questions = await getQuestions();
  return responses.map((response) => flattenResponse(response, questions));
};

module.exports = { buildWorkbook, buildCsv, flattenResponse, flattenResponsesForAnalytics };
