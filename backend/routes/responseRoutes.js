const express = require('express');
const {
  responseValidators,
  listResponses,
  getResponse,
  createResponse,
  updateResponse,
  deleteResponse,
  bulkDeleteResponses
} = require('../controllers/responseController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/public', responseValidators, createResponse);
router.use(protect, authorize('admin'));
router.get('/', listResponses);
router.get('/:id', getResponse);
router.post('/', responseValidators, createResponse);
router.put('/:id', updateResponse);
router.delete('/:id', deleteResponse);
router.post('/bulk-delete', bulkDeleteResponses);

module.exports = router;
