const SurveyQuestion = require('../models/SurveyQuestion');
const SurveyResponse = require('../models/SurveyResponse');
const Sector = require('../models/Sector');
const ApiError = require('../utils/ApiError');
const { scoreResponse, extractAnswerByCode } = require('./readinessService');
const { hydrateAnswersFromQuestions } = require('./responseHydrationService');

const TIMESTAMP_HEADERS = ['timestamp', 'submittedat', 'submitted at', 'submission time', 'waqtiga'];
const METADATA_HEADERS = new Set([
  'id',
  '_id',
  'respondentname',
  'respondent name',
  'organizationname',
  'organization name',
  'businessname',
  'business name',
  'sector',
  'district',
  'phonenumber',
  'phone number',
  'awarenesslevel',
  'awareness level',
  'willingnesstoadopt',
  'willingness to adopt',
  'readinessscore',
  'readiness score',
  'readinessband',
  'readiness band',
  'submittedat',
  'submitted at',
  'createdat',
  'created at',
  'updatedat',
  'updated at',
  'importedat',
  'imported at',
  'importsource',
  'import source',
  'deletedat',
  'deleted at'
]);

const FIELD_ALIASES = {
  organizationName: [
    'organizationname',
    'organization name',
    'businessname',
    'business name',
    'magaca ganacsiga / hay’adda',
    'magaca ganacsiga / hayadda',
    'magaca ganacsiga',
    'magaca hayadda'
  ],
  sector: ['sector', 'nooca ganacsiga', 'ganacsigaaga ama hay’addaadu noocee ah ayey tahay?', 'ganacsigaaga ama hayaddaadu noocee ah ayey tahay?'],
  district: ['district', 'degmada / goobta', 'degmada', 'goobta'],
  phoneNumber: ['phonenumber', 'phone number', 'telephone', 'mobile', 'number'],
  awarenessLevel: ['awarenesslevel', 'awareness level', 'hore ma u maqashay erayga cloud computing?', 'hore ma u maqashay erayga “cloud computing”?'],
  willingnessToAdopt: ['willingnesstoadopt', 'willingness to adopt'],
  readinessScore: ['readinessscore', 'readiness score'],
  readinessBand: ['readinessband', 'readiness band']
};

const SECTOR_ALIASES = new Map([
  ['hotel / hospitality', 'Hotels / Hospitality Services'],
  ['hotel/hospitality', 'Hotels / Hospitality Services'],
  ['hotels / hospitality', 'Hotels / Hospitality Services'],
  ['hospitality', 'Hotels / Hospitality Services'],
  ['hospital / clinic', 'Hospitals / Clinics'],
  ['hospitals / clinics', 'Hospitals / Clinics'],
  ['clinic', 'Hospitals / Clinics'],
  ['retail / supermarket', 'Supermarkets / Retail Shops'],
  ['supermarket', 'Supermarkets / Retail Shops'],
  ['retail', 'Supermarkets / Retail Shops'],
  ['telecommunications', 'Telecom / Mobile Money Agents'],
  ['telecom', 'Telecom / Mobile Money Agents'],
  ['mobile money', 'Telecom / Mobile Money Agents'],
  ['university', 'Universities'],
  ['school', 'Schools / Educational Institutions'],
  ['education', 'Schools / Educational Institutions'],
  ['bank', 'Banks / Financial Institutions'],
  ['financial institution', 'Banks / Financial Institutions'],
  ['logistics', 'Logistics & Transportation'],
  ['transportation', 'Logistics & Transportation'],
  ['ngo', 'NGOs / Non-Profit Organizations'],
  ['non-profit', 'NGOs / Non-Profit Organizations'],
  ['media', 'Media & Communication Companies'],
  ['real estate', 'Real Estate / Property Management'],
  ['property management', 'Real Estate / Property Management'],
  ['ecommerce', 'E-commerce / Online Businesses'],
  ['e-commerce', 'E-commerce / Online Businesses'],
  ['sme', 'SMEs'],
  ['restaurant / cafe', 'Tech-based Restaurants / Cafes'],
  ['restaurant / café', 'Tech-based Restaurants / Cafes'],
  ['restaurant/cafe', 'Tech-based Restaurants / Cafes'],
  ['restaurant/café', 'Tech-based Restaurants / Cafes'],
  ['restaurant', 'Tech-based Restaurants / Cafes']
]);

const normalizeText = (value) => String(value ?? '').trim();
const normalizeLookup = (value) => normalizeText(value).toLowerCase();
const simplifyLookup = (value) =>
  normalizeLookup(value)
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[?]/g, '')
    .replace(/café/g, 'cafe')
    .replace(/^q(?:uestion)?\s*\d+\s*[:.)-]?\s*/i, '')
    .replace(/^\d+\s*[:.)-]?\s*/, '')
    .replace(/[^a-z0-9\u00c0-\u024f\u0600-\u06ff]+/gi, '');

const compactLookup = (value) => simplifyLookup(value);

const isMetadataColumn = (column = '') => {
  const normalized = normalizeLookup(column);
  return METADATA_HEADERS.has(normalized) || METADATA_HEADERS.has(compactLookup(column));
};

const findColumn = (columns = [], aliases = []) => {
  const byNormalized = new Map(columns.map((column) => [normalizeLookup(column), column]));
  const byCompact = new Map(columns.map((column) => [compactLookup(column), column]));

  for (const alias of aliases) {
    const exact = byNormalized.get(normalizeLookup(alias));
    if (exact) return exact;
    const compact = byCompact.get(compactLookup(alias));
    if (compact) return compact;
  }

  return '';
};

const detectMetadataColumns = (columns = []) =>
  Object.fromEntries(Object.entries(FIELD_ALIASES).map(([field, aliases]) => [field, findColumn(columns, aliases)]));

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
  columns.find((column) => TIMESTAMP_HEADERS.includes(normalizeLookup(column)) || TIMESTAMP_HEADERS.includes(compactLookup(column))) ||
  findColumn(columns, ['submittedAt', 'submitted at', 'createdAt', 'created at']) ||
  '';

const loadQuestions = () => SurveyQuestion.find({ isActive: true }).sort({ order: 1 }).lean();

const buildAutoMapping = (columns = [], questions = [], timestampColumn = '') => {
  const metadataColumns = detectMetadataColumns(columns);
  const answerColumns = columns.filter((column) => column !== timestampColumn && !isMetadataColumn(column));
  const byHeader = new Map(answerColumns.map((column) => [normalizeLookup(column), column]));
  const bySimpleHeader = new Map(answerColumns.map((column) => [simplifyLookup(column), column]));
  const mapping = {};
  const usedColumns = new Set();

  for (const question of questions) {
    const exactText = byHeader.get(normalizeLookup(question.text));
    const exactCode = byHeader.get(normalizeLookup(question.code));
    const fuzzyText = bySimpleHeader.get(simplifyLookup(question.text));
    const fuzzyCode = bySimpleHeader.get(simplifyLookup(question.code));
    const matched = exactText || exactCode || fuzzyText || fuzzyCode || '';
    mapping[question.code] = matched;
    if (matched) usedColumns.add(matched);
  }

  if (!mapping.q1 && metadataColumns.organizationName) mapping.q1 = metadataColumns.organizationName;
  if (!mapping.q2 && metadataColumns.sector) mapping.q2 = metadataColumns.sector;
  if (!mapping.q3 && metadataColumns.district) mapping.q3 = metadataColumns.district;
  if (!mapping.q6 && metadataColumns.awarenessLevel) mapping.q6 = metadataColumns.awarenessLevel;

  return mapping;
};

const previewCsvImport = async (csvText = '') => {
  const { columns, records } = parseCsv(csvText);
  const questions = await loadQuestions();
  const timestampColumn = detectTimestampColumn(columns);

  return {
    columns,
    totalRows: records.length,
    sampleRows: records.slice(0, 5).map((item) => item.record),
    timestampColumn,
    metadataColumns: detectMetadataColumns(columns),
    questions: questions.map((question) => ({
      _id: question._id,
      code: question.code,
      text: question.text,
      type: question.type,
      required: question.required,
      options: question.options || []
    })),
    mapping: buildAutoMapping(columns, questions, timestampColumn)
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

const normalizeBand = (value) => {
  const text = normalizeText(value);
  if (/^high$/i.test(text)) return 'High';
  if (/^(medium|moderate)$/i.test(text)) return 'Medium';
  if (/^low$/i.test(text)) return 'Low';
  return '';
};

const valueFromRecord = (record = {}, column = '') => (column ? record[column] : '');

const applyMetadataDerivedAnswers = (answers, record, metadataColumns) => {
  const organizationName = normalizeText(valueFromRecord(record, metadataColumns.organizationName));
  const sector = normalizeText(valueFromRecord(record, metadataColumns.sector));
  const district = normalizeText(valueFromRecord(record, metadataColumns.district));
  const awareness = normalizeText(valueFromRecord(record, metadataColumns.awarenessLevel));
  const willingness = normalizeText(valueFromRecord(record, metadataColumns.willingnessToAdopt));

  if (!normalizeText(answers.q1) && organizationName) answers.q1 = organizationName;
  if (!normalizeText(answers.q2) && sector) answers.q2 = sector;
  if (!normalizeText(answers.q3) && district) answers.q3 = district;
  if (!normalizeText(answers.q6) && awareness) answers.q6 = awareness;
  if (!normalizeText(answers.q29) && willingness) answers.q29 = willingness;
};

const loadSectorsByName = async () => {
  const sectors = await Sector.find({ isActive: true }).lean();
  const byName = new Map(sectors.map((sector) => [normalizeLookup(sector.name), sector]));
  sectors.forEach((sector) => byName.set(compactLookup(sector.name), sector));

  for (const [alias, canonical] of SECTOR_ALIASES.entries()) {
    const sector = byName.get(normalizeLookup(canonical));
    if (sector) {
      byName.set(normalizeLookup(alias), sector);
      byName.set(compactLookup(alias), sector);
    }
  }

  return byName;
};

const resolveSector = (sectorsByName, sectorName) =>
  sectorsByName.get(normalizeLookup(sectorName)) || sectorsByName.get(compactLookup(sectorName));

const findExistingDuplicate = async (organizationName, submittedAt) =>
  SurveyResponse.findOne({
    organizationName: new RegExp(`^${organizationName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
    submittedAt,
    $or: [{ deletedAt: { $exists: false } }, { deletedAt: null }]
  }).select('_id').lean();

const buildRowPayload = ({ row, questions, mapping, timestampColumn, metadataColumns, sectorsByName, seenKeys }) => {
  const errors = [];
  const rawTimestamp = row.record[timestampColumn];
  const parsedSubmittedAt = parseSubmittedAt(rawTimestamp);
  const submittedAt = parsedSubmittedAt || new Date();
  const answers = {};

  if (!timestampColumn || !rawTimestamp) {
    // Imported exports may occasionally omit submittedAt; keep the row importable
    // and use the current import time rather than shifting columns positionally.
  }
  if (rawTimestamp && !parsedSubmittedAt) errors.push(`Timestamp is invalid: ${rawTimestamp}`);

  for (const question of questions) {
    const column = mapping[question.code];
    if (!column) {
      continue;
    }

    const value = valueForQuestion(question, row.record[column]);
    const isEmpty = Array.isArray(value) ? value.length === 0 : !value;

    if (!isEmpty) {
      answers[question.code] = value;
    }
  }

  applyMetadataDerivedAnswers(answers, row.record, metadataColumns);

  const organizationName = normalizeText(valueFromRecord(row.record, metadataColumns.organizationName)) || normalizeText(answers.q1);
  const district = normalizeText(valueFromRecord(row.record, metadataColumns.district)) || normalizeText(answers.q3);
  const sectorName = normalizeText(valueFromRecord(row.record, metadataColumns.sector)) || normalizeText(answers.q2);
  const sector = resolveSector(sectorsByName, sectorName);
  const phoneNumber = normalizeText(valueFromRecord(row.record, metadataColumns.phoneNumber));

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

  const hydrated = hydrateAnswersFromQuestions(questions, answers, {
    skipOptionValidation: true,
    skipRequiredValidation: true
  });
  const storedReadinessScore = Number(valueFromRecord(row.record, metadataColumns.readinessScore));
  const storedReadinessBand = normalizeBand(valueFromRecord(row.record, metadataColumns.readinessBand));
  const calculated = scoreResponse(hydrated.answerDetails);
  const readinessScore = Number.isFinite(storedReadinessScore) && storedReadinessScore >= 0 && storedReadinessScore <= 100 ? storedReadinessScore : calculated.readinessScore;
  const readinessBand = storedReadinessBand || calculated.readinessBand;

  return {
    rowNumber: row.rowNumber,
    status: 'ready',
    duplicateKey,
    payload: {
      respondentName: '',
      organizationName,
      sector: sector._id,
      district,
      phoneNumber,
      answers: hydrated.answers,
      answerDetails: hydrated.answerDetails,
      readinessScore,
      readinessBand,
      awarenessLevel: normalizeText(valueFromRecord(row.record, metadataColumns.awarenessLevel)) || extractAnswerByCode(hydrated.answers, 'q6'),
      willingnessToAdopt: normalizeText(valueFromRecord(row.record, metadataColumns.willingnessToAdopt)) || extractAnswerByCode(hydrated.answers, 'q29'),
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
  const resolvedMapping = { ...buildAutoMapping(columns, questions, resolvedTimestampColumn), ...mapping };
  const metadataColumns = detectMetadataColumns(columns);
  const seenKeys = new Set();
  const rowResults = [];
  const toInsert = [];

  for (const row of records) {
    const result = buildRowPayload({
      row,
      questions,
      mapping: resolvedMapping,
      timestampColumn: resolvedTimestampColumn,
      metadataColumns,
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
    metadataColumns,
    mapping: resolvedMapping
  };
};

module.exports = {
  importCsvResponses,
  parseCsv,
  previewCsvImport
};
