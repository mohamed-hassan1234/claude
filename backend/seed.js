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
const unique = (items) => [...new Set(items)];

const sampleAnswersFor = (sectorName, index) => ({
  q1: `${sectorName} ${index + 1}`,
  q2: sectorName,
  q3: pick(sampleDistricts, index),
  q4: pick(['Mulkiile', 'Maamule', 'Shaqaale IT', 'Shaqaale Maamul', 'Shaqaale kale'], index),
  q5: pick(['1-5', '6-10', '11-25', '26-50', '51+'], index),
  q6: pick(['Haa', 'Maya'], index),
  q7: pick(['Aad u sarreeya', 'Sarreeya', 'Dhexdhexaad', 'Hooseeya', 'Aad u hooseeya'], index),
  q8: unique([pick(['Desktop', 'Laptop', 'Tablet', 'Mobile phone', 'Printer', 'POS system'], index), pick(['Laptop', 'Mobile phone', 'POS system'], index + 1)]),
  q9: pick(['Haa', 'Maya'], index + 1),
  q10: [pick(['Accounting software', 'Inventory system', 'POS system', 'HR system', 'CRM system', 'Email system', 'WhatsApp Business', 'Ma isticmaalno'], index)],
  q11: pick(['Aad u sarreeya', 'Sarreeya', 'Dhexdhexaad', 'Hooseeya', 'Aad u hooseeya'], index + 1),
  q12: [pick(['Xisaabaadka', 'Kaydinta xogta', 'Macaamiisha', 'Iibka', 'Inventory', 'HR / shaqaalaha', 'Warbixinada', 'Waxba'], index)],
  q13: pick(['Warqado', 'Computer local ah', 'External hard disk', 'Mobile phone', 'Cloud storage', 'Server gudaha xarunta'], index),
  q14: pick(['Maalin kasta', 'Toddobaadle', 'Bille', 'Mararka qaar', 'Marnaba'], index + 1),
  q15: pick(['Haa', 'Maya'], index),
  q16: pick(['Koronto la’aan', 'Qalab xumaaday', 'Virus / malware', 'Qalad shaqaale', 'Backup la’aan', 'Ma jirto xog lumis'], index),
  q17: pick(['Aad baan ugu kalsoonahay', 'Waan ku kalsoonahay', 'Dhexdhexaad', 'Kalsooni yar', 'Kuma kalsooni'], index),
  q18: pick(['Haa', 'Maya'], index + 1),
  q19: unique([pick(['Google Drive', 'Dropbox', 'OneDrive', 'Google Workspace', 'Microsoft 365', 'Zoom', 'WhatsApp Business', 'Online accounting system', 'Ma isticmaalno'], index), pick(['Google Drive', 'Zoom', 'WhatsApp Business'], index + 2)]),
  q20: pick(['Aad muhiim u ah', 'Muhiim', 'Dhexdhexaad', 'Muhiim ma aha'], index),
  q21: pick(['Maalin kasta', 'Marar badan', 'Mararka qaar', 'Marar dhif ah', 'Marnaba'], index),
  q22: pick(['Aad u sarreeya', 'Sarreeya', 'Dhexdhexaad', 'Hooseeya', 'Aad u hooseeya'], index + 2),
  q23: pick(['Aad u sarreeya', 'Sarreeya', 'Dhexdhexaad', 'Hooseeya', 'Aad u hooseeya'], index),
  q24: pick(['Haa', 'Maya'], index + 1),
  q25: pick(['Kharash badan', 'Internet liita', 'Koronto aan degganeyn', 'Aqoonta shaqaalaha oo yar', 'Amni iyo xog ilaalin', 'Taageero farsamo la’aan'], index),
  q26: pick(['Aad baan uga welwelsanahay', 'Waan ka welwelsanahay', 'Dhexdhexaad', 'Wax yar', 'Ma welwelsani'], index),
  q27: pick(['Xatooyo xog', 'Hackers', 'Sirta oo baxda', 'Qiimaha adeegga', 'Internet la’aan', 'Access control la’aan'], index),
  q28: unique([pick(['Cloud storage', 'Online backup', 'Email hosting', 'Accounting system', 'Inventory system', 'Customer management', 'Video meetings', 'Data analytics'], index), pick(['Online backup', 'Data analytics', 'Cloud storage'], index + 1)]),
  q29: pick(['Haa', 'Maya'], index),
  q30: pick([
    'Cloud Computing wuxuu naga caawin karaa backup joogto ah iyo in xogtu noqoto mid ammaan ah.',
    'Waxay fududeyn kartaa wada shaqeynta shaqaalaha, kaydinta dukumentiyada, iyo adeegyada macaamiisha.',
    'Haddii qiimaha iyo internet-ka la hagaajiyo, cloud apps waxay kordhin karaan hufnaanta shaqada.'
  ], index)
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
      awarenessLevel: extractAnswerByCode(answers, 'q6'),
      willingnessToAdopt: extractAnswerByCode(answers, 'q29'),
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
