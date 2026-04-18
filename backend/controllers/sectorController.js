const { body, validationResult } = require('express-validator');

const Sector = require('../models/Sector');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { writeAudit } = require('../services/auditService');

const sectorValidators = [body('name').trim().notEmpty().withMessage('Sector name is required')];

const listSectors = asyncHandler(async (req, res) => {
  const filter = req.query.includeInactive === 'true' ? {} : { isActive: true };
  const sectors = await Sector.find(filter).sort({ name: 1 });
  res.json({ sectors });
});

const createSector = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw new ApiError(400, errors.array()[0].msg);

  const sector = await Sector.create({
    name: req.body.name,
    description: req.body.description || '',
    isActive: req.body.isActive ?? true,
    createdBy: req.user._id
  });
  await writeAudit({ req, action: 'create', entity: 'Sector', entityId: sector._id.toString() });
  res.status(201).json({ sector });
});

const updateSector = asyncHandler(async (req, res) => {
  const sector = await Sector.findByIdAndUpdate(
    req.params.id,
    { ...req.body, updatedBy: req.user._id },
    { new: true, runValidators: true }
  );
  if (!sector) throw new ApiError(404, 'Sector not found');
  await writeAudit({ req, action: 'update', entity: 'Sector', entityId: sector._id.toString() });
  res.json({ sector });
});

const deleteSector = asyncHandler(async (req, res) => {
  const sector = await Sector.findByIdAndDelete(req.params.id);
  if (!sector) throw new ApiError(404, 'Sector not found');
  await writeAudit({ req, action: 'delete', entity: 'Sector', entityId: sector._id.toString() });
  res.json({ message: 'Sector deleted' });
});

module.exports = { sectorValidators, listSectors, createSector, updateSector, deleteSector };
