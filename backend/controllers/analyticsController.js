const SurveyQuestion = require('../models/SurveyQuestion');
const SurveyResponse = require('../models/SurveyResponse');
const asyncHandler = require('../utils/asyncHandler');
const { runPythonAnalytics } = require('../services/analyticsService');
const { writeAudit } = require('../services/auditService');

const TEXT_TYPES = new Set(['paragraph', 'short_text']);
const CHOICE_TYPES = new Set(['multiple_choice', 'single_select']);
const BASE_FILTER = { $or: [{ deletedAt: { $exists: false } }, { deletedAt: null }] };

const attachChartUrls = (files = {}, req) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const chartFiles = {};

  for (const [key, value] of Object.entries(files || {})) {
    if (!value) {
      chartFiles[key] = '';
      continue;
    }

    const filename = value.replace(/\\/g, '/').split('/').pop();
    chartFiles[key] = `${baseUrl}/analytics-files/${filename}`;
  }

  return chartFiles;
};

const normalizeAnalytics = (analytics, req) => {
  const next = { ...analytics };

  if (!next.chartFiles && next.charts) {
    const stringCharts = Object.fromEntries(
      Object.entries(next.charts).filter(([, value]) => typeof value === 'string')
    );

    if (Object.keys(stringCharts).length) {
      next.chartFiles = stringCharts;
      next.charts = {};
    }
  }

  next.chartFiles = attachChartUrls(next.chartFiles, req);
  return next;
};

const numberValue = (value) => Number(value || 0);

const percent = (value) => Number(numberValue(value).toFixed(2));

const localeSort = (values = []) => [...values].sort((a, b) => String(a).localeCompare(String(b), 'so'));

const sortAnswersForQuestion = (answers = [], questionType = '') => {
  if (questionType !== 'numeric') return answers;

  return [...answers].sort((a, b) => {
    const left = Number(a.answer);
    const right = Number(b.answer);
    if (Number.isFinite(left) && Number.isFinite(right)) return left - right;
    return String(a.answer).localeCompare(String(b.answer));
  });
};

const getChartPreset = (questionType = '') => {
  if (questionType === 'yes_no') return 'yes_no';
  if (questionType === 'likert') return 'likert';
  if (questionType === 'numeric') return 'numeric';
  if (TEXT_TYPES.has(questionType)) return 'open_text';
  return 'choice';
};

const buildNoDataQuestionReport = (question) => ({
  code: question.code,
  order: question.order,
  title: question.text,
  section: question.section,
  questionType: question.type,
  chartPreset: getChartPreset(question.type),
  totalResponses: 0,
  frequencyBreakdown: [],
  mainChartData: [],
  secondaryChartData: [],
  yesNoSummary: null,
  topThemes: [],
  keywords: [],
  groupedCategories: [],
  interpretation: 'Wax jawaabo ah lama helin su’aashan iyadoo la adeegsanayo filtarrada hadda jira.',
  insightSummary: ['Wax jawaabo ah lama helin su’aashan.']
});

const buildYesNoSummary = (answers = []) => {
  const yes = answers.find((item) => item.answer === 'Haa');
  const no = answers.find((item) => item.answer === 'Maya');

  return {
    yesCount: yes?.count || 0,
    yesPercentage: yes?.percentage || 0,
    noCount: no?.count || 0,
    noPercentage: no?.percentage || 0
  };
};

const buildSomaliInterpretation = (question, analysis) => {
  const questionType = question.type;

  if (TEXT_TYPES.has(questionType)) {
    const themes = analysis.textAnalysis?.themes || [];
    const keywords = analysis.textAnalysis?.keywords || [];
    if (!themes.length) {
      return 'Jawaabaha furan ee su’aashan ma aysan lahayn mawduuc si cad u soo baxay marka filtarradan la adeegsaday.';
    }

    const topTheme = themes[0];
    const secondTheme = themes[1];
    const topKeyword = keywords[0]?.keyword;

    if (secondTheme) {
      return `Jawaabaha furan ee su’aashan waxay inta badan ku urureen mawduucyada ${topTheme.theme} (${topTheme.count}) iyo ${secondTheme.theme} (${secondTheme.count}).${topKeyword ? ` Erayga ugu soo noqnoqda waa "${topKeyword}".` : ''}`;
    }

    return `Jawaabaha su’aashan waxay si weyn ugu urureen mawduuca ${topTheme.theme} (${topTheme.count}).${topKeyword ? ` Erayga ugu badan ee la adeegsaday waa "${topKeyword}".` : ''}`;
  }

  const answers = sortAnswersForQuestion(analysis.answers || [], questionType);
  if (!answers.length) {
    return 'Wax jawaabo ah lama helin su’aashan iyadoo la adeegsanayo filtarrada hadda jira.';
  }

  const top = answers[0];
  const second = answers[1];

  if (questionType === 'yes_no') {
    const yesNo = buildYesNoSummary(answers);
    return `Su’aashan, ${top.answer} ayaa ahayd jawaabta ugu badan (${top.count} jawaabood, ${top.percentage}%). Haa waxay gaartay ${yesNo.yesPercentage}% halka Maya ay ahayd ${yesNo.noPercentage}%.`;
  }

  if (questionType === 'likert') {
    return `Heerka ${top.answer} ayaa ahaa kan ugu badan (${top.count} jawaabood, ${top.percentage}%), taas oo muujineysa jihada ugu weyn ee aragtida ka muuqata su’aashan.${second ? ` Heerka ${second.answer} ayaa ku xiga.` : ''}`;
  }

  if (questionType === 'numeric') {
    return `Qiimaha ugu badan ee lagu jawaabay su’aashan waa ${top.answer} (${top.count} jawaabood, ${top.percentage}%). Tani waxay muujineysaa halka jawaabaha intooda badan ku urureen.`;
  }

  return `Inta badan jawaab bixiyeyaashu waxay doorteen ${top.answer} (${top.count} jawaabood, ${top.percentage}%).${second ? ` Doorashada ${second.answer} ayaa ahayd tan ku xigtay (${second.percentage}%).` : ''}`;
};

const buildInsightSummary = (question, analysis) => {
  const questionType = question.type;

  if (TEXT_TYPES.has(questionType)) {
    const themes = analysis.textAnalysis?.themes || [];
    const keywords = analysis.textAnalysis?.keywords || [];
    const grouped = analysis.textAnalysis?.groupedTopics || [];
    const bullets = [];

    if (themes[0]) bullets.push(`${themes[0].theme} ayaa ah mawduuca ugu badan ee ka muuqda jawaabaha.`);
    if (themes[1]) bullets.push(`${themes[1].theme} ayaa sidoo kale si muuqata uga dhex muuqata jawaabaha.`);
    if (keywords[0]) bullets.push(`Erayga "${keywords[0].keyword}" ayaa ah kan ugu badan ee la adeegsaday.`);
    if (grouped[0]?.count) bullets.push(`${grouped[0].count} jawaabood ayaa ku ururay qaybta ${grouped[0].topic}.`);

    return bullets.length ? bullets.slice(0, 3) : ['Mawduuc muuqda lama helin su’aashan.'];
  }

  const answers = sortAnswersForQuestion(analysis.answers || [], questionType);
  if (!answers.length) return ['Wax jawaabo ah lama helin su’aashan.'];

  const top = answers[0];
  const second = answers[1];
  const bullets = [`${top.answer} ayaa hoggaamineysa jawaabaha (${top.percentage}%).`];

  if (second) bullets.push(`${second.answer} ayaa ku xigta (${second.percentage}%).`);
  if (top.percentage >= 60) {
    bullets.push('Jawaabaha waxay muujinayaan is-afgarad xooggan.');
  } else if (second && top.percentage - second.percentage <= 10) {
    bullets.push('Jawaabaha waxay muujinayaan kala qaybsanaan u dhow.');
  } else {
    bullets.push('Hal jawaab ayaa ka muuqata, laakiin weli waxaa jira kala duwanaansho la dareemi karo.');
  }

  return bullets.slice(0, 3);
};

const buildQuestionReport = (question, analytics) => {
  const analysis = (analytics.questionAnalysis || []).find((item) => item.code === question.code);
  if (!analysis) return buildNoDataQuestionReport(question);

  const chartPreset = getChartPreset(question.type);
  const answers = sortAnswersForQuestion(analysis.answers || [], question.type);
  const topThemes = (analysis.textAnalysis?.themes || []).slice(0, 6);
  const keywords = (analysis.textAnalysis?.keywords || []).slice(0, 10);
  const groupedCategories = (analysis.textAnalysis?.groupedTopics || []).map((item) => ({
    label: item.topic,
    topic: item.topic,
    count: item.count,
    percentage: item.percentage,
    examples: item.examples || []
  }));
  const frequencyBreakdown = TEXT_TYPES.has(question.type)
    ? groupedCategories.length
      ? groupedCategories
      : topThemes.map((item) => ({
          label: item.theme,
          topic: item.theme,
          count: item.count,
          percentage: item.percentage,
          examples: item.examples || []
        }))
    : answers.map((item) => ({
        label: item.answer,
        answer: item.answer,
        count: item.count,
        percentage: item.percentage
      }));

  return {
    code: question.code,
    order: question.order,
    title: question.text,
    section: question.section,
    questionType: question.type,
    chartPreset,
    totalResponses: analysis.totalResponses || 0,
    frequencyBreakdown,
    mainChartData: TEXT_TYPES.has(question.type) ? keywords : answers,
    secondaryChartData:
      question.type === 'yes_no' || CHOICE_TYPES.has(question.type) || question.type === 'likert'
        ? answers
        : [],
    yesNoSummary: question.type === 'yes_no' ? buildYesNoSummary(answers) : null,
    topThemes,
    keywords,
    groupedCategories,
    interpretation: buildSomaliInterpretation(question, analysis),
    insightSummary: buildInsightSummary(question, analysis)
  };
};

const buildFinalReport = (analytics) => {
  const factorSummary = analytics.factorSummary || [];
  const strongestFactor = factorSummary[0];
  const weakestFactor = factorSummary[factorSummary.length - 1];
  const topPatterns = [
    analytics.questionAnalysis?.find((item) => item.code === 'q5')?.answers?.[0]
      ? `Su’aasha Q5, jawaabta ugu badan waa ${analytics.questionAnalysis.find((item) => item.code === 'q5').answers[0].answer}.`
      : '',
    analytics.questionAnalysis?.find((item) => item.code === 'q8')?.answers?.[0]
      ? `Qalabka ugu badan ee la adeegsado waa ${analytics.questionAnalysis.find((item) => item.code === 'q8').answers[0].answer}.`
      : '',
    analytics.questionAnalysis?.find((item) => item.code === 'q11')?.answers?.[0]
      ? `Heerka internet-ka ee ugu badan waa ${analytics.questionAnalysis.find((item) => item.code === 'q11').answers[0].answer}.`
      : '',
    analytics.questionAnalysis?.find((item) => item.code === 'q12')?.answers?.[0]
      ? `Habka kaydinta ugu badan waa ${analytics.questionAnalysis.find((item) => item.code === 'q12').answers[0].answer}.`
      : '',
    analytics.questionAnalysis?.find((item) => item.code === 'q27')?.answers?.[0]
      ? `Q27, jawaabta ugu badan waa ${analytics.questionAnalysis.find((item) => item.code === 'q27').answers[0].answer}.`
      : ''
  ].filter(Boolean).slice(0, 5);

  const topProblems = [
    ...(analytics.barriers?.overallRanking || []).slice(0, 5).map(
      (item) => `${item.answer} waxay saamayn ku leedahay ${item.percentage}% jawaab bixiyeyaasha.`
    )
  ];

  const topOpportunities = [
    ...(analytics.readiness?.highReadinessOpportunities || []).slice(0, 5).map(
      (item) => `${item.sector} waxay leedahay fursad sare oo diyaar-garow ah (${item.averageReadiness}%).`
    )
  ];

  const recommendations = analytics.reportView?.recommendations?.length
    ? analytics.reportView.recommendations
    : analytics.recommendationBlocks?.summary || analytics.recommendations || [];

  return {
    title: analytics.reportView?.title || 'Somalia Cloud Computing Survey Report',
    generatedAt: analytics.generatedAt || new Date(),
    executiveSummary: analytics.reportView?.executiveSummary || analytics.summaryFindings?.[0] || '',
    keyFindings: analytics.reportView?.keyFindings || analytics.summaryFindings || [],
    topPatterns,
    topProblems,
    topOpportunities,
    cloudReadinessSummary: {
      overallAverage: analytics.readiness?.overallAverage || analytics.readinessStats?.average || 0,
      distribution: analytics.readiness?.distribution || [],
      strongestFactor: strongestFactor
        ? `${strongestFactor.label} (${strongestFactor.score}%)`
        : 'No factor identified',
      weakestFactor: weakestFactor
        ? `${weakestFactor.label} (${weakestFactor.score}%)`
        : 'No factor identified',
      summaryText: `Celceliska cloud readiness waa ${analytics.readiness?.overallAverage || analytics.readinessStats?.average || 0}%.${strongestFactor ? ` Qodobka ugu xooggan waa ${strongestFactor.label}.` : ''}${weakestFactor ? ` Qodobka ugu daciifsan waa ${weakestFactor.label}.` : ''}`
    },
    recommendations: recommendations.slice(0, 6),
    conclusion:
      analytics.reportView?.conclusion ||
      'Warbixintani waxay muujineysaa in horumarka cloud adoption-ku uu u baahan yahay isku xidhnaan ka dhexeysa wacyigelin, kaabayaal, amni, iyo tababar.'
  };
};

const getAnalytics = asyncHandler(async (req, res) => {
  const analytics = normalizeAnalytics(await runPythonAnalytics(req.query), req);
  await writeAudit({ req, action: 'run', entity: 'Analytics', metadata: req.query });
  res.json({ analytics });
});

const getFilterOptions = asyncHandler(async (req, res) => {
  const districts = localeSort(
    (await SurveyResponse.distinct('district', BASE_FILTER)).filter((item) => String(item || '').trim())
  );

  res.json({ filters: { districts } });
});

const getQuestionAnalytics = asyncHandler(async (req, res) => {
  const code = String(req.params.code || '').toLowerCase();
  const question = await SurveyQuestion.findOne({ code }).lean();
  if (!question) {
    return res.status(404).json({ message: 'Question analysis not found' });
  }

  const analytics = normalizeAnalytics(await runPythonAnalytics(req.query), req);
  const questionReport = buildQuestionReport(question, analytics);

  await writeAudit({
    req,
    action: 'run_question_analysis',
    entity: 'Analytics',
    metadata: { ...req.query, questionCode: code }
  });

  res.json({ questionReport });
});

const getFinalReport = asyncHandler(async (req, res) => {
  const analytics = normalizeAnalytics(await runPythonAnalytics(req.query), req);
  const finalReport = buildFinalReport(analytics);

  await writeAudit({ req, action: 'run_final_report', entity: 'Analytics', metadata: req.query });
  res.json({ finalReport });
});

const getReportSummary = asyncHandler(async (req, res) => {
  const analytics = normalizeAnalytics(await runPythonAnalytics(req.query), req);
  res.json({
    report: buildFinalReport(analytics)
  });
});

module.exports = {
  getAnalytics,
  getFilterOptions,
  getQuestionAnalytics,
  getFinalReport,
  getReportSummary
};
