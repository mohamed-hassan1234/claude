const express = require('express');
const {
  questionValidators,
  listQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  reorderQuestions
} = require('../controllers/questionController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', listQuestions);
router.post('/', protect, authorize('admin'), questionValidators, createQuestion);
router.patch('/reorder', protect, authorize('admin'), reorderQuestions);
router.put('/:id', protect, authorize('admin'), updateQuestion);
router.delete('/:id', protect, authorize('admin'), deleteQuestion);

module.exports = router;
