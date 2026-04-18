const buildResponseQuery = (query) => {
  const filter = { deletedAt: { $exists: false } };

  if (query.sector) filter.sector = query.sector;
  if (query.district) filter.district = new RegExp(query.district, 'i');
  if (query.search) {
    filter.$or = [
      { organizationName: new RegExp(query.search, 'i') },
      { respondentName: new RegExp(query.search, 'i') },
      { district: new RegExp(query.search, 'i') }
    ];
  }
  if (query.startDate || query.endDate) {
    filter.createdAt = {};
    if (query.startDate) filter.createdAt.$gte = new Date(query.startDate);
    if (query.endDate) {
      const end = new Date(query.endDate);
      end.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = end;
    }
  }

  return filter;
};

module.exports = { buildResponseQuery };
