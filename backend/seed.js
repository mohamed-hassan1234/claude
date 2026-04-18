require('dotenv').config();
const mongoose = require('mongoose');

const connectDB = require('./config/db');
const AdminUser = require('./models/AdminUser');
const Sector = require('./models/Sector');
const SurveyQuestion = require('./models/SurveyQuestion');
const SurveyResponse = require('./models/SurveyResponse');
const { sectors, questions } = require('./data/defaults');
const { scoreResponse, extractAnswerByCode } = require('./services/readinessService');

const sampleDistricts = ['Hodan', 'Wadajir', 'Karaan', 'Hargeisa', 'Kismayo', 'Baidoa', 'Garowe'];

const pick = (items, index) => items[index % items.length];

const sampleAnswersFor = (sectorName, index) => ({
  q1: sectorName,
  q2: String(1 + (index % 12)),
  q3: String(4 + index * 2),
  q4: pick(['Maamulka', 'IT', 'Xisaabaadka', 'Howlgallada'], index),
  q5: pick(['Haa', 'Maya'], index),
  q6: pick(['Aad u fiican', 'Fiican', 'Dhexdhexaad', 'Yar', 'Midna ma aqaan'], index),
  q7: 'Cloud computing waa adeeg internet lagu kaydiyo xogta laguna isticmaalo software online ah.',
  q8: pick(['Desktop', 'Laptop', 'Tablet', 'Mobile phone'], index),
  q9: pick(['Haa', 'Maya'], index + 1),
  q10: pick(['Haa', 'Maya'], index + 2),
  q11: pick(['Aad u fiican', 'Fiican', 'Dhexdhexaad', 'Liita'], index),
  q12: pick(['Warqado', 'Computer local ah', 'External hard disk', 'Cloud storage'], index),
  q13: pick(['Haa maalin kasta', 'Toddobaadle', 'Mararka qaar', 'Maya'], index + 1),
  q14: pick(['Marna', 'Hal mar', 'In ka badan hal mar'], index),
  q15: pick(['Haa', 'Maya'], index),
  q16: pick(['Google Drive', 'OneDrive', 'Dropbox', 'Ma isticmaalno'], index),
  q17: pick(['Aad u badan', 'Dhexdhexaad', 'Wax yar', 'Maya'], index),
  q18: pick(['Haa', 'Maya'], index + 1),
  q19: pick(['Badanaa', 'Mararka qaar', 'Marar dhif ah', 'Marnaba'], index),
  q20: pick(['Haa', 'Maya'], index),
  q21: [pick(['Kharash badan', 'Internet liita', 'Aqoonta oo yar', 'Amni darro'], index)],
  q22: pick(['Haa', 'Maya', 'Qaar kaliya'], index),
  q23: pick(['Haa', 'Maya'], index),
  q24: pick(['Aad baan ugu kalsoonahay', 'Waan ku kalsoonahay', 'Dhexdhexaad', 'Kuma kalsooni'], index),
  q25: [pick(['Xatooyo xog', 'Hackers', 'Sirta oo baxda', 'Access control la’aan'], index)],
  q26: pick(['Haa', 'Maya'], index),
  q27: pick(['Haa', 'Maya', 'Waxaa ku xiran qiimaha'], index),
  q28: 'Waxaan rabnaa kayd xogeed, backup, iyo maamulka dukumentiyada.',
  q29: 'Mustaqbalka cloud computing ee Soomaaliya wuu kori karaa haddii internet iyo tababar la helo.',
  q30: 'Dowladda iyo shirkaduhu ha kordhiyaan wacyigelin, tababar, iyo adeegyo qiimo jaban.'
});

const buildAnswerDetails = (dbQuestions, answers) =>
  dbQuestions.map((question) => ({
    code: question.code,
    questionId: question._id,
    questionText: question.text,
    section: question.section,
    type: question.type,
    scoringKey: question.scoringKey,
    value: answers[question.code]
  }));

const seed = async () => {
  await connectDB();

  const passwordHash = await AdminUser.hashPassword(process.env.ADMIN_SEED_PASSWORD || 'Admin@12345');
  await AdminUser.findOneAndUpdate(
    { email: (process.env.ADMIN_SEED_EMAIL || 'admin@example.com').toLowerCase() },
    {
      name: process.env.ADMIN_SEED_NAME || 'System Admin',
      email: (process.env.ADMIN_SEED_EMAIL || 'admin@example.com').toLowerCase(),
      passwordHash,
      role: 'admin',
      isActive: true
    },
    { upsert: true, new: true }
  );

  for (const name of sectors) {
    await Sector.findOneAndUpdate({ name }, { name, isActive: true }, { upsert: true });
  }

  await SurveyQuestion.deleteMany({});
  await SurveyQuestion.insertMany(questions.map((question, index) => ({ ...question, order: index + 1 })));

  await SurveyResponse.deleteMany({});
  const dbSectors = await Sector.find();
  const dbQuestions = await SurveyQuestion.find().sort({ order: 1 });

  const responses = Array.from({ length: 24 }).map((_, index) => {
    const sector = pick(dbSectors, index);
    const answers = sampleAnswersFor(sector.name, index);
    const answerDetails = buildAnswerDetails(dbQuestions, answers);
    const scoring = scoreResponse(answerDetails);
    return {
      respondentName: `Respondent ${index + 1}`,
      organizationName: `${sector.name} ${index + 1}`,
      sector: sector._id,
      district: pick(sampleDistricts, index),
      phoneNumber: `061${String(1000000 + index).slice(0, 7)}`,
      answers,
      answerDetails,
      ...scoring,
      awarenessLevel: extractAnswerByCode(answers, 'q5'),
      willingnessToAdopt: extractAnswerByCode(answers, 'q27'),
      submittedBy: 'public'
    };
  });

  await SurveyResponse.insertMany(responses);

  console.log('Seed complete');
  console.log(`Admin email: ${process.env.ADMIN_SEED_EMAIL || 'admin@example.com'}`);
  console.log(`Admin password: ${process.env.ADMIN_SEED_PASSWORD || 'Admin@12345'}`);
  await mongoose.connection.close();
};

seed().catch(async (error) => {
  console.error(error);
  await mongoose.connection.close();
  process.exit(1);
});
