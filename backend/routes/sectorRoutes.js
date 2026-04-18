const express = require('express');
const {
  sectorValidators,
  listSectors,
  createSector,
  updateSector,
  deleteSector
} = require('../controllers/sectorController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', listSectors);
router.post('/', protect, authorize('admin'), sectorValidators, createSector);
router.put('/:id', protect, authorize('admin'), updateSector);
router.delete('/:id', protect, authorize('admin'), deleteSector);

module.exports = router;
