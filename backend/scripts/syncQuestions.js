require('dotenv').config();
const mongoose = require('mongoose');

const connectDB = require('../config/db');
const SurveyQuestion = require('../models/SurveyQuestion');
const { questions } = require('../data/defaults');

const syncQuestions = async () => {
  await connectDB();

  const codes = questions.map((question) => question.code);
  const operations = questions.map((question, index) => ({
    updateOne: {
      filter: { code: question.code },
      update: {
        $set: {
          ...question,
          order: index + 1,
          isActive: true
        }
      },
      upsert: true
    }
  }));

  if (operations.length) {
    await SurveyQuestion.bulkWrite(operations, { ordered: true });
  }

  await SurveyQuestion.updateMany({ code: { $nin: codes } }, { $set: { isActive: false } });

  console.log(`Synced ${questions.length} active survey questions.`);
  console.log('Existing responses were not deleted. Old-response answer snapshots will not be reused for the new question text.');
  await mongoose.connection.close();
};

syncQuestions().catch(async (error) => {
  console.error(error);
  await mongoose.connection.close();
  process.exit(1);
});
