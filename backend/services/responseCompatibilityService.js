const Sector = require('../models/Sector');

const OBJECT_ID_PATTERN = /^[a-fA-F0-9]{24}$/;

const isPlainObject = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const isObjectIdString = (value) => OBJECT_ID_PATTERN.test(String(value || '').trim());

const normalizeText = (value) => String(value ?? '').trim();

const toPlainAnswers = (answers) => {
  if (!answers) return {};
  if (answers instanceof Map) return Object.fromEntries(answers.entries());
  return answers;
};

const extractAnswerValue = (response, code) => {
  const answers = toPlainAnswers(response.answers);
  const fromAnswers = answers[code];
  if (Array.isArray(fromAnswers)) return fromAnswers.join(', ');
  if (fromAnswers !== undefined && fromAnswers !== null && String(fromAnswers).trim()) return String(fromAnswers).trim();

  const detail = (response.answerDetails || []).find((item) => item.code === code);
  if (!detail) return '';
  if (Array.isArray(detail.value)) return detail.value.join(', ');
  return normalizeText(detail.value);
};

const getSectorCandidate = (response) => {
  const value = response?.sector;

  if (!value) return { id: '', name: '' };

  if (typeof value === 'string') {
    const text = normalizeText(value);
    return isObjectIdString(text) ? { id: text, name: '' } : { id: '', name: text };
  }

  if (isPlainObject(value)) {
    const id = value._id ? normalizeText(value._id) : '';
    const name = value.name ? normalizeText(value.name) : '';
    if (name) return { id, name };
    if (id) return { id, name: '' };
  }

  const raw = normalizeText(value);
  return isObjectIdString(raw) ? { id: raw, name: '' } : { id: '', name: raw };
};

const collectSectorLookups = (responses = []) => {
  const ids = new Set();
  const names = new Set();

  responses.forEach((response) => {
    const sector = getSectorCandidate(response);
    if (sector.id) ids.add(sector.id);
    if (sector.name) names.add(sector.name.toLowerCase());
  });

  return { ids: Array.from(ids), names: Array.from(names) };
};

const normalizeResponseSectors = async (responses = []) => {
  if (!responses.length) return responses;

  const { ids, names } = collectSectorLookups(responses);
  const sectors = ids.length || names.length ? await Sector.find({}).select('name').lean() : [];
  const byId = new Map(sectors.map((sector) => [String(sector._id), sector]));
  const byName = new Map(sectors.map((sector) => [sector.name.toLowerCase(), sector]));

  return responses.map((response) => {
    const candidate = getSectorCandidate(response);
    const legacyName = extractAnswerValue(response, 'q1');
    const sectorFromId = candidate.id ? byId.get(candidate.id) : null;
    const sectorFromName = candidate.name ? byName.get(candidate.name.toLowerCase()) : null;
    const matched = sectorFromId || sectorFromName;
    const fallbackName = candidate.name || legacyName || 'Unknown';

    return {
      ...response,
      sector: matched
        ? { _id: String(matched._id), name: matched.name }
        : { _id: candidate.id || null, name: fallbackName }
    };
  });
};

module.exports = {
  extractAnswerValue,
  getSectorCandidate,
  isObjectIdString,
  normalizeResponseSectors
};
