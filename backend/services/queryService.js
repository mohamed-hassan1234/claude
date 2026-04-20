const Sector = require('../models/Sector');

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildResponseQuery = (query = {}) => {
  const conditions = [
    {
      $or: [{ deletedAt: { $exists: false } }, { deletedAt: null }]
    }
  ];

  if (query.sector) conditions.push({ sector: query.sector });
  if (query.district) conditions.push({ district: new RegExp(escapeRegex(query.district), 'i') });
  if (query.readinessLevel) conditions.push({ readinessBand: query.readinessLevel });
  if (query.awarenessLevel) conditions.push({ awarenessLevel: query.awarenessLevel });
  if (query.willingnessLevel) conditions.push({ willingnessToAdopt: query.willingnessLevel });

  if (query.search) {
    const search = new RegExp(escapeRegex(query.search), 'i');
    conditions.push({
      $or: [{ organizationName: search }, { respondentName: search }, { district: search }]
    });
  }

  if (query.startDate || query.endDate) {
    const createdAt = {};
    if (query.startDate) createdAt.$gte = new Date(query.startDate);
    if (query.endDate) {
      const end = new Date(query.endDate);
      end.setHours(23, 59, 59, 999);
      createdAt.$lte = end;
    }
    conditions.push({ createdAt });
  }

  return conditions.length === 1 ? conditions[0] : { $and: conditions };
};

const buildCompatibleResponseQuery = async (query = {}) => {
  const base = buildResponseQuery(query);
  if (!query.sector) return base;

  const sectorDoc = await Sector.findById(query.sector).select('name').lean().catch(() => null);
  const sectorName = sectorDoc?.name;
  if (!sectorName) return base;

  const conditions = [];

  if (base.$and) {
    conditions.push(
      ...base.$and.filter((condition) => !(Object.keys(condition).length === 1 && Object.prototype.hasOwnProperty.call(condition, 'sector')))
    );
  } else {
    conditions.push(base);
  }

  conditions.push({
    $or: [{ sector: query.sector }, { sector: sectorName }]
  });

  return { $and: conditions };
};

module.exports = { buildResponseQuery, buildCompatibleResponseQuery };
