const SurveyQuestion = require('../models/SurveyQuestion');
const SurveyResponse = require('../models/SurveyResponse');
const Sector = require('../models/Sector');
const ApiError = require('../utils/ApiError');
const { scoreResponse, extractAnswerByCode } = require('./readinessService');
const { hydrateAnswersFromQuestions, optionLabelsForQuestion } = require('./responseHydrationService');

const TIMESTAMP_HEADERS = ['timestamp', 'submittedat', 'submitted at', 'submission time', 'waqtiga'];

const normalizeText = (value) => String(value ?? '').trim();
const normalizeLookup = (value) => normalizeText(value).toLowerCase();

const parseCsv = (csvText = '') => {
  const text = String(csvText || '').replace(/^\uFEFF/, '');
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        cell += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      row.push(cell);
      cell = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') index += 1;
      row.push(cell);
      if (row.some((item) => normalizeText(item))) rows.push(row);
      row = [];
      cell = '';
      continue;
    }

    cell += char;
  }

  row.push(cell);
  if (row.some((item) => normalizeText(item))) rows.push(row);

  if (!rows.length) throw new ApiError(400, 'CSV file is empty');
  const columns = rows[0].map((header) => normalizeText(header));
  if (!columns.length || columns.some((header) => !header)) throw new ApiError(400, 'CSV headers are missing or invalid');

  const records = rows.slice(1).map((values, rowIndex) => {
    const record = {};
    columns.forEach((column, columnIndex) => {
      record[column] = normalizeText(values[columnIndex]);
    });
    return { rowNumber: rowIndex + 2, record };
  });

  return { columns, records };
};

const detectTimestampColumn = (columns = []) =>
  columns.find((column) => TIMESTAMP_HEADERS.includes(normalizeLookup(column))) || columns[0] || '';

const loadQuestions = () => SurveyQuestion.find({ isActive: true }).sort({ order: 1 }).lean();

const buildAutoMapping = (columns = [], questions = []) => {
  const byHeader = new Map(columns.map((column) => [normalizeLookup(column), column]));
  const mapping = {};

  for (const question of questions) {
    const exactText = byHeader.get(normalizeLookup(question.text));
    const exactCode = byHeader.get(normalizeLookup(question.code));
    mapping[question.code] = exactText || exactCode || '';
  }

  return mapping;
};

const previewCsvImport = async (csvText = '') => {
  const { columns, records } = parseCsv(csvText);
  const questions = await loadQuestions();

  return {
    columns,
    totalRows: records.length,
    sampleRows: records.slice(0, 5).map((item) => item.record),
    timestampColumn: detectTimestampColumn(columns),
    questions: questions.map((question) => ({
      _id: question._id,
      code: question.code,
      text: question.text,
      type: question.type,
      required: question.required,
      options: question.options || []
    })),
    mapping: buildAutoMapping(columns, questions)
  };
};

const parseSubmittedAt = (value) => {
  const text = normalizeText(value);
  if (!text) return null;

  const direct = new Date(text);
  if (!Number.isNaN(direct.getTime())) return direct;

  const match = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
  if (!match) return null;

  const first = Number(match[1]);
  const second = Number(match[2]);
  const year = Number(match[3].length === 2 ? `20${match[3]}` : match[3]);
  const day = first > 12 ? first : second;
  const month = first > 12 ? second : first;
  const hour = Number(match[4] || 0);
  const minute = Number(match[5] || 0);
  const secondValue = Number(match[6] || 0);
  const parsed = new Date(year, month - 1, day, hour, minute, secondValue);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const splitCheckboxValue = (value) =>
  normalizeText(value)
    .split(',')
    .map((item) => normalizeText(item))
    .filter(Boolean);

const valueForQuestion = (question, rawValue) => {
  if (question.type === 'multiple_choice') return splitCheckboxValue(rawValue);
  return normalizeText(rawValue);
};

const validateOptionValues = (question, value, errors) => {
  if (question.type === 'multiple_choice') return;
  if (!['multiple_choice', 'single_select', 'likert', 'yes_no'].includes(question.type)) return;

  const labels = optionLabelsForQuestion(question);
  if (!labels.length) return;

  const allowed = new Set(labels);
  const values = Array.isArray(value) ? value : value ? [value] : [];
  const invalid = values.filter((item) => !allowed.has(item));
  if (invalid.length) {
    errors.push(`${question.code} has invalid value(s): ${invalid.join(', ')}`);
  }
};

const loadSectorsByName = async () => {
  const sectors = await Sector.find({ isActive: true }).lean();
  return new Map(sectors.map((sector) => [normalizeLookup(sector.name), sector]));
};

const findExistingDuplicate = async (organizationName, submittedAt) =>
  SurveyResponse.findOne({
    organizationName: new RegExp(`^${organizationName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
    submittedAt,
    $or: [{ deletedAt: { $exists: false } }, { deletedAt: null }]
  }).select('_id').lean();

const buildRowPayload = ({ row, questions, mapping, timestampColumn, sectorsByName, seenKeys }) => {
  const errors = [];
  const rawTimestamp = row.record[timestampColumn];
  const submittedAt = parseSubmittedAt(rawTimestamp);
  const answers = {};

  if (!timestampColumn || !rawTimestamp) errors.push('Timestamp is required');
  if (rawTimestamp && !submittedAt) errors.push(`Timestamp is invalid: ${rawTimestamp}`);

  for (const question of questions) {
    const column = mapping[question.code];
    if (!column) {
      if (question.required) errors.push(`Missing mapping for required question ${question.code}`);
      continue;
    }

    const value = valueForQuestion(question, row.record[column]);
    const isEmpty = Array.isArray(value) ? value.length === 0 : !value;

    if (question.required && isEmpty) {
      errors.push(`${question.code} is required`);
      continue;
    }

    if (!isEmpty) {
      validateOptionValues(question, value, errors);
      answers[question.code] = value;
    }
  }

  const organizationName = normalizeText(answers.q1);
  const district = normalizeText(answers.q3);
  const sectorName = normalizeText(answers.q2);
  const sector = sectorsByName.get(normalizeLookup(sectorName));

  if (!organizationName) errors.push('Business name is required');
  if (!district) errors.push('District is required');
  if (!sectorName) errors.push('Sector is required');
  if (sectorName && !sector) errors.push(`Sector not found: ${sectorName}`);

  const duplicateKey = organizationName && submittedAt ? `${normalizeLookup(organizationName)}|${submittedAt.toISOString()}` : '';
  const duplicateInFile = duplicateKey && seenKeys.has(duplicateKey);
  if (duplicateKey && !duplicateInFile) seenKeys.add(duplicateKey);

  if (errors.length) {
    return { rowNumber: row.rowNumber, status: 'error', errors };
  }

  if (duplicateInFile) {
    return {
      rowNumber: row.rowNumber,
      status: 'skipped',
      reason: 'Duplicate row in CSV for business name and timestamp'
    };
  }

  const importQuestions = questions.map((question) =>
    question.type === 'multiple_choice' ? { ...question, options: [] } : question
  );
  const hydrated = hydrateAnswersFromQuestions(importQuestions, answers);
  const { readinessScore, readinessBand } = scoreResponse(hydrated.answerDetails);

  return {
    rowNumber: row.rowNumber,
    status: 'ready',
    duplicateKey,
    payload: {
      respondentName: '',
      organizationName,
      sector: sector._id,
      district,
      phoneNumber: '',
      answers: hydrated.answers,
      answerDetails: hydrated.answerDetails,
      readinessScore,
      readinessBand,
      awarenessLevel: extractAnswerByCode(hydrated.answers, 'q6'),
      willingnessToAdopt: extractAnswerByCode(hydrated.answers, 'q29'),
      submittedBy: 'admin',
      submittedAt
    }
  };
};

const importCsvResponses = async ({ csvText = '', mapping = {}, timestampColumn = '', importedBy, source = '' }) => {
  const { columns, records } = parseCsv(csvText);
  const questions = await loadQuestions();
  const sectorsByName = await loadSectorsByName();
  const resolvedTimestampColumn = timestampColumn || detectTimestampColumn(columns);
  const resolvedMapping = { ...buildAutoMapping(columns, questions), ...mapping };
  const seenKeys = new Set();
  const rowResults = [];
  const toInsert = [];

  for (const row of records) {
    const result = buildRowPayload({
      row,
      questions,
      mapping: resolvedMapping,
      timestampColumn: resolvedTimestampColumn,
      sectorsByName,
      seenKeys
    });

    if (result.status === 'error' || result.status === 'skipped') {
      rowResults.push(result);
      continue;
    }

    const existing = await findExistingDuplicate(result.payload.organizationName, result.payload.submittedAt);
    if (existing) {
      rowResults.push({
        rowNumber: result.rowNumber,
        status: 'skipped',
        reason: 'Duplicate response already exists for this business name and timestamp',
        existingResponseId: existing._id
      });
      continue;
    }

    toInsert.push({
      ...result.payload,
      importedAt: new Date(),
      importSource: source,
      editedBy: importedBy
    });
    rowResults.push({ rowNumber: result.rowNumber, status: 'imported' });
  }

  const inserted = toInsert.length ? await SurveyResponse.insertMany(toInsert, { ordered: false }) : [];

  return {
    summary: {
      totalRows: records.length,
      importedRows: inserted.length,
      skippedRows: rowResults.filter((item) => item.status === 'skipped').length,
      errorRows: rowResults.filter((item) => item.status === 'error').length
    },
    rows: rowResults,
    columns,
    timestampColumn: resolvedTimestampColumn,
    mapping: resolvedMapping
  };
};

module.exports = {
  importCsvResponses,
  parseCsv,
  previewCsvImport
};
