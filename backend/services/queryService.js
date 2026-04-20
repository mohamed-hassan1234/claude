const mongoose = require('mongoose');

const Sector = require('../models/Sector');

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const OBJECT_ID_PATTERN = /^[a-fA-F0-9]{24}$/;
const DELETED_FILTER = { $or: [{ deletedAt: { $exists: false } }, { deletedAt: null }] };

const normalizeValue = (value) => String(value ?? '').trim();
const isObjectIdString = (value) => OBJECT_ID_PATTERN.test(normalizeValue(value));

const parseDate = (value) => {
  const text = normalizeValue(value);
  if (!text) return null;

  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date;
};

const exactMatchRegex = (value) => new RegExp(`^${escapeRegex(value)}$`, 'i');

const mergeConditions = (conditions = []) => {
  const filtered = conditions.filter(Boolean);
  if (!filtered.length) return {};
  if (filtered.length === 1) return filtered[0];
  return { $and: filtered };
};

const impossibleCondition = () => ({ _id: null });

const buildSectorMatchConditions = (ids = [], names = []) => {
  const conditions = [];

  if (ids.length) {
    conditions.push({
      sector: {
        $in: ids.map((id) => new mongoose.Types.ObjectId(id))
      }
    });
  }

  names
    .map(normalizeValue)
    .filter(Boolean)
    .forEach((name) => {
      const matcher = exactMatchRegex(name);
      conditions.push({ 'answers.q1': matcher });
      conditions.push({
        answerDetails: {
          $elemMatch: {
            code: 'q1',
            value: matcher
          }
        }
      });
    });

  return conditions;
};

const buildResponseQuery = (query = {}) => {
  const conditions = [DELETED_FILTER];

  const district = normalizeValue(query.district);
  const readinessLevel = normalizeValue(query.readinessLevel);
  const awarenessLevel = normalizeValue(query.awarenessLevel);
  const willingnessLevel = normalizeValue(query.willingnessLevel);
  const searchValue = normalizeValue(query.search);

  if (district) conditions.push({ district: new RegExp(escapeRegex(district), 'i') });
  if (readinessLevel) conditions.push({ readinessBand: readinessLevel });
  if (awarenessLevel) conditions.push({ awarenessLevel });
  if (willingnessLevel) conditions.push({ willingnessToAdopt: willingnessLevel });

  if (searchValue) {
    const search = new RegExp(escapeRegex(searchValue), 'i');
    conditions.push({
      $or: [{ organizationName: search }, { respondentName: search }, { district: search }]
    });
  }

  if (query.startDate || query.endDate) {
    const createdAt = {};
    const start = parseDate(query.startDate);
    const end = parseDate(query.endDate);

    if (start) createdAt.$gte = start;
    if (end) {
      end.setHours(23, 59, 59, 999);
      createdAt.$lte = end;
    }
    if (Object.keys(createdAt).length) conditions.push({ createdAt });
  }

  return mergeConditions(conditions);
};

const buildCompatibleResponseQuery = async (query = {}) => {
  const sectorFilter = normalizeValue(query.sector);
  const base = buildResponseQuery({ ...query, sector: '' });
  if (!sectorFilter) return base;

  const sectorLookupConditions = [];
  if (isObjectIdString(sectorFilter)) {
    sectorLookupConditions.push({ _id: sectorFilter });
  }
  sectorLookupConditions.push({ name: exactMatchRegex(sectorFilter) });

  const matchingSectors = await Sector.find({ $or: sectorLookupConditions }).select('name').lean();
  const matchedIds = [...new Set(matchingSectors.map((item) => String(item._id)))];
  const matchedNames = [...new Set([sectorFilter, ...matchingSectors.map((item) => item.name).filter(Boolean)])];
  const sectorConditions = buildSectorMatchConditions(matchedIds, matchedNames);

  if (!sectorConditions.length) {
    return mergeConditions([base, impossibleCondition()]);
  }

  return mergeConditions([base, { $or: sectorConditions }]);
};

module.exports = { buildResponseQuery, buildCompatibleResponseQuery };
