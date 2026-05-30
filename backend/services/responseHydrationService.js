const SurveyQuestion = require('../models/SurveyQuestion');
const ApiError = require('../utils/ApiError');

const normalizeScalar = (value) => String(value ?? '').trim();

const normalizeAnswerValue = (question, value) => {
  if (question.type === 'multiple_choice') {
    const values = Array.isArray(value) ? value : value ? [value] : [];
    return values.map(normalizeScalar).filter(Boolean);
  }
  return normalizeScalar(value);
};

const optionLabelsForQuestion = (question) => {
  if (question.type === 'yes_no' && (!question.options || question.options.length === 0)) {
    return ['Haa', 'Maya'];
  }
  return (question.options || []).map((item) => item.label);
};

const assertRealOptionLabels = (question, value) => {
  if (!['multiple_choice', 'single_select', 'likert', 'yes_no'].includes(question.type)) return;

  const optionLabels = optionLabelsForQuestion(question);
  if (!optionLabels.length) return;

  const allowed = new Set(optionLabels);
  const selected = Array.isArray(value) ? value : value ? [value] : [];

  for (const item of selected) {
    if (!allowed.has(item)) {
      throw new ApiError(400, `Invalid answer for ${question.code}. Answers must use the real option text, not indexes or IDs.`);
    }
  }
};

const hydrateAnswersFromQuestions = (questions = [], submittedAnswers = {}, options = {}) => {
  const answers = {};
  const answerDetails = [];

  for (const question of questions) {
    const hasAnswer = Object.prototype.hasOwnProperty.call(submittedAnswers, question.code);
    const normalized = normalizeAnswerValue(question, submittedAnswers[question.code]);
    const isEmpty = Array.isArray(normalized) ? normalized.length === 0 : normalized === '';

    if (question.required && (!hasAnswer || isEmpty)) {
      throw new ApiError(400, `Required question missing: ${question.text}`);
    }

    if (!hasAnswer || isEmpty) continue;

    if (!options.skipOptionValidation) {
      assertRealOptionLabels(question, normalized);
    }
    answers[question.code] = normalized;
    answerDetails.push({
      code: question.code,
      questionId: question._id,
      questionText: question.text,
      section: question.section,
      type: question.type,
      scoringKey: question.scoringKey,
      value: normalized
    });
  }

  return { answers, answerDetails };
};

const hydrateAnswers = async (submittedAnswers = {}) => {
  const questions = await SurveyQuestion.find({ isActive: true }).sort({ order: 1 });
  return hydrateAnswersFromQuestions(questions, submittedAnswers);
};

module.exports = {
  hydrateAnswers,
  hydrateAnswersFromQuestions,
  normalizeAnswerValue,
  optionLabelsForQuestion
};
