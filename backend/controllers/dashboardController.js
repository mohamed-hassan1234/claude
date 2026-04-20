const SurveyResponse = require('../models/SurveyResponse');
const Sector = require('../models/Sector');
const asyncHandler = require('../utils/asyncHandler');
const { normalizeResponseSectors } = require('../services/responseCompatibilityService');

const startOfDay = (date) => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const dashboardStats = asyncHandler(async (req, res) => {
  const today = startOfDay(new Date());
  const baseFilter = { $or: [{ deletedAt: { $exists: false } }, { deletedAt: null }] };

  const [totalResponses, totalSectors, districts, responsesToday, rawResponses] = await Promise.all([
    SurveyResponse.countDocuments(baseFilter),
    Sector.countDocuments({ isActive: true }),
    SurveyResponse.distinct('district', baseFilter),
    SurveyResponse.countDocuments({ ...baseFilter, createdAt: { $gte: today } }),
    SurveyResponse.find(baseFilter).lean()
  ]);
  const allResponses = await normalizeResponseSectors(rawResponses);

  const awareCount = allResponses.filter((item) => item.awarenessLevel === 'Haa').length;
  const willingCount = allResponses.filter((item) => ['Haa', 'Waxaa ku xiran qiimaha'].includes(item.willingnessToAdopt)).length;

  const sectorMap = new Map();
  for (const response of allResponses) {
    const name = response.sector?.name || 'Unknown';
    const current = sectorMap.get(name) || { sector: name, responses: 0, readinessTotal: 0 };
    current.responses += 1;
    current.readinessTotal += response.readinessScore || 0;
    sectorMap.set(name, current);
  }

  const sectorComparison = Array.from(sectorMap.values())
    .map((item) => ({
      sector: item.sector,
      responses: item.responses,
      averageReadiness: Math.round(item.readinessTotal / item.responses)
    }))
    .sort((a, b) => b.averageReadiness - a.averageReadiness);

  const readinessBands = ['Low', 'Medium', 'High'].map((band) => ({
    name: band,
    value: allResponses.filter((item) => item.readinessBand === band).length
  }));

  const districtCounts = districts.map((district) => ({
    district,
    responses: allResponses.filter((item) => item.district === district).length
  }));

  const dailyTrend = Array.from({ length: 7 }).map((_, index) => {
    const date = startOfDay(new Date());
    date.setDate(date.getDate() - (6 - index));
    const next = new Date(date);
    next.setDate(next.getDate() + 1);
    return {
      date: date.toISOString().slice(0, 10),
      submissions: allResponses.filter((item) => {
        const created = new Date(item.createdAt);
        return created >= date && created < next;
      }).length
    };
  });

  res.json({
    cards: {
      totalResponses,
      totalSectors,
      totalDistricts: districts.length,
      dailySubmissions: responsesToday,
      readinessAverage: totalResponses
        ? Math.round(allResponses.reduce((sum, item) => sum + (item.readinessScore || 0), 0) / totalResponses)
        : 0,
      adoptionWillingnessPercentage: totalResponses ? Math.round((willingCount / totalResponses) * 100) : 0,
      awarePercentage: totalResponses ? Math.round((awareCount / totalResponses) * 100) : 0
    },
    charts: {
      sectorComparison,
      sectorRanking: sectorComparison,
      readinessBands,
      districtCounts,
      dailyTrend
    }
  });
});

module.exports = { dashboardStats };
