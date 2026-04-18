const { body, validationResult } = require('express-validator');

const SurveyQuestion = require('../models/SurveyQuestion');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { writeAudit } = require('../services/auditService');

const questionValidators = [
  body('code').trim().notEmpty().withMessage('Question code is required'),
  body('section').trim().notEmpty().withMessage('Section is required'),
  body('text').trim().notEmpty().withMessage('Question text is required'),
  body('type').isIn(['short_text', 'paragraph', 'multiple_choice', 'single_select', 'likert', 'yes_no', 'numeric']),
  body('order').isNumeric().withMessage('Order is required')
];

const listQuestions = asyncHandler(async (req, res) => {
  const filter = req.query.includeInactive === 'true' ? {} : { isActive: true };
  const questions = await SurveyQuestion.find(filter).sort({ order: 1, createdAt: 1 });
  res.json({ questions });
});

const createQuestion = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw new ApiError(400, errors.array()[0].msg);

  const question = await SurveyQuestion.create({ ...req.body, createdBy: req.user._id });
  await writeAudit({ req, action: 'create', entity: 'SurveyQuestion', entityId: question._id.toString() });
  res.status(201).json({ question });
});

const updateQuestion = asyncHandler(async (req, res) => {
  const question = await SurveyQuestion.findByIdAndUpdate(
    req.params.id,
    { ...req.body, updatedBy: req.user._id },
    { new: true, runValidators: true }
  );
  if (!question) throw new ApiError(404, 'Question not found');
  await writeAudit({ req, action: 'update', entity: 'SurveyQuestion', entityId: question._id.toString() });
  res.json({ question });
});

const deleteQuestion = asyncHandler(async (req, res) => {
  const question = await SurveyQuestion.findByIdAndDelete(req.params.id);
  if (!question) throw new ApiError(404, 'Question not found');
  await writeAudit({ req, action: 'delete', entity: 'SurveyQuestion', entityId: question._id.toString() });
  res.json({ message: 'Question deleted' });
});

const reorderQuestions = asyncHandler(async (req, res) => {
  const items = req.body.items || [];
  await Promise.all(items.map((item) => SurveyQuestion.findByIdAndUpdate(item.id, { order: item.order })));
  await writeAudit({ req, action: 'reorder', entity: 'SurveyQuestion', metadata: { count: items.length } });
  res.json({ message: 'Question order updated' });
});

module.exports = {
  questionValidators,
  listQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  reorderQuestions
};
