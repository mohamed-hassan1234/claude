const TEXT_TYPES = new Set(['paragraph', 'short_text']);
const CHOICE_TYPES = new Set(['multiple_choice', 'single_select']);

const numberValue = (value) => Number(value || 0);

const percent = (value) => Number(numberValue(value).toFixed(2));

const localeSort = (values = []) => [...values].sort((a, b) => String(a).localeCompare(String(b), 'so'));

const baseSummaryRecommendation = 'Collect more responses before drawing operational conclusions.';

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

const createEmptyAnalyticsPayload = () => ({
  generatedAt: new Date().toISOString(),
  filters: {},
  filterOptions: {
    districts: [],
    awarenessLevels: [],
    willingnessLevels: [],
    readinessLevels: ['Low', 'Medium', 'High']
  },
  totals: {
    totalResponses: 0,
    totalSectorsCovered: 0,
    totalDistrictsCovered: 0,
    responsesToday: 0,
    responsesThisWeek: 0,
    averageCloudReadinessScore: 0,
    awarenessRate: 0,
    adoptionWillingnessRate: 0,
    cloudToolsUsageRate: 0,
    backupPracticeRate: 0,
    infrastructureStabilityRate: 0,
    securityTrustRate: 0,
    lowReadinessCount: 0,
    mediumReadinessCount: 0,
    highReadinessCount: 0
  },
  overview: {
    totals: {},
    insightCards: [],
    executiveSummary: 'No data available.',
    timeSeries: { dailyResponses: [], readinessTrend: [], awarenessTrend: [] },
    readinessBands: []
  },
  questionAnalysis: [],
  sectorComparison: { rows: [], readinessLeaderboard: [], stackedReadiness: [], heatmap: { columns: [], rows: [] }, highlights: {} },
  districtComparison: { rows: [], ranking: [], heatmap: { columns: [], rows: [] }, highlights: {} },
  readiness: {
    overallAverage: 0,
    distribution: [],
    sectorLeaderboard: [],
    districtLeaderboard: [],
    responseRanking: [],
    radar: [],
    factorBreakdown: [],
    lowReadinessAlerts: [],
    highReadinessOpportunities: [],
    interpretation: 'No readiness data.',
    explanation: 'No readiness data.'
  },
  gapAnalysis: {
    overall: [],
    progressToIdeal: [],
    sectorGaps: [],
    districtGaps: [],
    largestGapFactor: 'No factor',
    largestGapSector: 'No sector',
    largestGapDistrict: 'No district',
    narrative: []
  },
  infrastructure: {
    internetAvailability: [],
    internetQuality: [],
    electricityAvailability: [],
    interruptionFrequency: [],
    internetImpact: [],
    sectorComparison: [],
    heatmap: { columns: [], rows: [] },
    riskSummary: [],
    mostAffectedInternet: [],
    mostAffectedPower: []
  },
  security: {
    trustLevels: [],
    securityConcerns: [],
    sectorTrustComparison: [],
    topConcernLeaderboard: [],
    fearSummary: [],
    trustBuildingRecommendations: []
  },
  barriers: {
    overallRanking: [],
    challengeFrequency: [],
    topFiveChallenges: [],
    bySector: [],
    byDistrict: [],
    mostCommonBarrier: 'No dominant barrier'
  },
  businessNeeds: {
    digitalNeeds: [],
    willingness: [],
    openEndedQuestions: {},
    themeCards: [],
    groupedTopicBlocks: [],
    keywordChart: [],
    insightSummaries: [],
    mostCommonRecommendationTheme: 'No dominant theme'
  },
  recommendationBlocks: {
    overall: [],
    sectorSpecific: [],
    districtSpecific: [],
    summary: [baseSummaryRecommendation]
  },
  reportView: {
    title: 'Somalia Cloud Computing Survey Analytics Report',
    subtitle: '0 filtered responses',
    executiveSummary: 'No data available.',
    keyFindings: ['No survey responses match the selected filters yet.'],
    readinessRanking: [],
    topBarriers: [],
    topOpportunities: [],
    recommendations: [baseSummaryRecommendation],
    conclusion: 'No conclusion yet.'
  },
  chartFiles: {},
  summaryFindings: ['No survey responses match the selected filters yet.'],
  recommendations: [baseSummaryRecommendation],
  frequencyAnalysis: {},
  percentageAnalysis: {},
  readinessStats: { average: 0, median: 0, min: 0, max: 0 },
  factorSummary: [],
  readinessRanking: [],
  importantQuestionAnalysis: [],
  commonBarriers: [],
  securityConcerns: [],
  districtDistribution: [],
  awarenessDistribution: [],
  willingnessDistribution: [],
  descriptiveStatistics: { responsesBySector: 0, responsesByDistrict: 0, stdDeviationReadiness: 0 }
});

const mergeAnalyticsPayload = (analytics = {}) => {
  const empty = createEmptyAnalyticsPayload();
  const derivedTotalResponses = analytics.totals?.totalResponses ?? analytics.totalResponses ?? 0;
  const derivedAverageReadiness =
    analytics.totals?.averageCloudReadinessScore ?? analytics.readinessStats?.average ?? empty.totals.averageCloudReadinessScore;

  return {
    ...empty,
    ...analytics,
    filterOptions: { ...empty.filterOptions, ...(analytics.filterOptions || {}) },
    totals: {
      ...empty.totals,
      ...(analytics.totals || {}),
      totalResponses: derivedTotalResponses,
      averageCloudReadinessScore: derivedAverageReadiness
    },
    overview: { ...empty.overview, ...(analytics.overview || {}) },
    sectorComparison: { ...empty.sectorComparison, ...(analytics.sectorComparison || {}) },
    districtComparison: { ...empty.districtComparison, ...(analytics.districtComparison || {}) },
    readiness: { ...empty.readiness, ...(analytics.readiness || {}) },
    gapAnalysis: { ...empty.gapAnalysis, ...(analytics.gapAnalysis || {}) },
    infrastructure: { ...empty.infrastructure, ...(analytics.infrastructure || {}) },
    security: { ...empty.security, ...(analytics.security || {}) },
    barriers: { ...empty.barriers, ...(analytics.barriers || {}) },
    businessNeeds: { ...empty.businessNeeds, ...(analytics.businessNeeds || {}) },
    recommendationBlocks: { ...empty.recommendationBlocks, ...(analytics.recommendationBlocks || {}) },
    reportView: { ...empty.reportView, ...(analytics.reportView || {}) },
    descriptiveStatistics: { ...empty.descriptiveStatistics, ...(analytics.descriptiveStatistics || {}) }
  };
};

const normalizeAnalyticsPayload = (analytics = {}, req) => {
  const payload = mergeAnalyticsPayload(analytics);

  if (!payload.chartFiles && payload.charts) {
    const stringCharts = Object.fromEntries(
      Object.entries(payload.charts).filter(([, value]) => typeof value === 'string')
    );

    if (Object.keys(stringCharts).length) {
      payload.chartFiles = stringCharts;
      payload.charts = {};
    }
  }

  payload.chartFiles = attachChartUrls(payload.chartFiles, req);
  return payload;
};

const sortAnswersForQuestion = (answers = [], questionType = '') => {
  if (questionType !== 'numeric') return answers;

  return [...answers].sort((left, right) => {
    const leftNumber = Number(left.answer);
    const rightNumber = Number(right.answer);

    if (Number.isFinite(leftNumber) && Number.isFinite(rightNumber)) {
      return leftNumber - rightNumber;
    }

    return String(left.answer).localeCompare(String(right.answer));
  });
};

const getChartPreset = (questionType = '', analysis = null) => {
  if (analysis?.type === 'text' || analysis?.textAnalysis) return 'open_text';
  if (questionType === 'yes_no') return 'yes_no';
  if (questionType === 'likert') return 'likert';
  if (questionType === 'numeric') return 'numeric';
  if (TEXT_TYPES.has(questionType)) return 'open_text';
  return 'choice';
};

const buildHighlights = (rows = [], isText = false) => {
  const ordered = [...rows].sort((left, right) => (right.count || 0) - (left.count || 0));
  const dominant = ordered[0];
  const second = ordered[1];
  const least = ordered[ordered.length - 1];

  return [
    {
      label: isText ? 'Mawduuca ugu badan' : 'Jawaabta ugu badan',
      value: dominant?.label || dominant?.answer || dominant?.topic || 'Xog ma jirto',
      helper: dominant ? `${dominant.count} jawaabood` : 'Wax jawaab ah lama helin.'
    },
    {
      label: isText ? 'Mawduuca labaad' : 'Jawaabta labaad',
      value: second?.label || second?.answer || second?.topic || 'Xog ma jirto',
      helper: second ? `${percent(second.percentage)}%` : 'Hal jawaab oo muuqata ma jiro.'
    },
    {
      label: isText ? 'Mawduuca ugu yar' : 'Jawaabta ugu yar',
      value: least?.label || least?.answer || least?.topic || 'Xog ma jirto',
      helper: least ? `${least.count} jawaabood` : 'Wax jawaab ah lama helin.'
    },
    {
      label: 'Boqolleyda ugu sareysa',
      value: dominant ? `${percent(dominant.percentage)}%` : '0%',
      helper: dominant ? 'Saamiga ugu weyn ee jawaabaha' : 'Wax xog ah lama hayo.'
    }
  ];
};

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

const buildFallbackQuestionAnalysis = (question, analytics) => {
  const frequency = analytics.frequencyAnalysis?.[question.code];
  const answers = sortAnswersForQuestion(frequency?.answers || [], question.type);
  const overallTotal = numberValue(analytics.totals?.totalResponses || analytics.totalResponses);
  const summedCount = answers.reduce((sum, item) => sum + numberValue(item.count), 0);
  const totalResponses = overallTotal ? Math.min(summedCount, overallTotal) : summedCount;

  return {
    code: question.code,
    question: question.text,
    type: TEXT_TYPES.has(question.type) ? 'text' : 'closed',
    totalResponses,
    answers,
    labels: answers.map((item) => item.answer),
    interpretation: '',
    textAnalysis:
      TEXT_TYPES.has(question.type) && answers.length
        ? {
            totalResponses,
            themes: answers.slice(0, 6).map((item) => ({
              theme: item.answer,
              count: item.count,
              percentage: item.percentage,
              keywords: [],
              examples: []
            })),
            keywords: answers.slice(0, 10).map((item) => ({
              keyword: item.answer,
              count: item.count
            })),
            groupedTopics: answers.slice(0, 6).map((item) => ({
              topic: item.answer,
              count: item.count,
              percentage: item.percentage,
              examples: []
            })),
            summary: ''
          }
        : null
  };
};

const buildNoDataQuestionReport = (question, overallTotal = 0, message = 'Xog lagama helin filter-kan.') => ({
  code: question.code,
  order: question.order,
  title: question.text,
  section: question.section,
  questionType: question.type,
  chartPreset: getChartPreset(question.type),
  totalResponses: 0,
  responseCompletionRate: overallTotal ? 0 : 0,
  frequencyBreakdown: [],
  mainChartData: [],
  secondaryChartData: [],
  yesNoSummary: null,
  topThemes: [],
  keywords: [],
  groupedCategories: [],
  interpretation: message,
  insightSummary: ['Jawaabo kuma jiraan qeybtan.', 'Fadlan dooro filter kale.'],
  highlights: buildHighlights([], TEXT_TYPES.has(question.type)),
  dominantAnswer: null,
  secondMostCommonAnswer: null,
  leastSelectedAnswer: null
});

const buildSomaliInterpretation = (question, analysis, isTextQuestion) => {
  if (isTextQuestion) {
    const themes = analysis.textAnalysis?.themes || [];
    const keywords = analysis.textAnalysis?.keywords || [];

    if (!themes.length) {
      return 'Jawaabaha furan ee su’aashan ma lahayn mawduuc si cad u soo baxay marka filtarradan la adeegsaday.';
    }

    const lead = themes[0];
    const second = themes[1];
    const keyword = keywords[0]?.keyword;

    if (second) {
      return `Jawaabaha su'aashan waxay inta badan ku urureen mawduucyada ${lead.theme} iyo ${second.theme}. ${lead.theme} ayaa ah mawduuca ugu badan (${lead.count} jawaabood).${keyword ? ` Erayga ugu soo noqnoqda waa "${keyword}".` : ''}`;
    }

    return `Inta badan jawaabaha su'aashan waxay ku urureen mawduuca ${lead.theme} (${lead.count} jawaabood).${keyword ? ` Erayga ugu badan ee la adeegsaday waa "${keyword}".` : ''}`;
  }

  const answers = sortAnswersForQuestion(analysis.answers || [], question.type);
  if (!answers.length) {
    return 'Xog lagama helin filter-kan.';
  }

  const lead = answers[0];
  const second = answers[1];

  if (question.type === 'yes_no') {
    const yesNo = buildYesNoSummary(answers);
    return `Su'aashan, ${lead.answer} ayaa ahayd jawaabta ugu badan (${lead.count} jawaabood, ${lead.percentage}%). Haa waxay gaartay ${yesNo.yesPercentage}% halka Maya ay gaartay ${yesNo.noPercentage}%.`;
  }

  if (question.type === 'likert') {
    return `Heerka ${lead.answer} ayaa ahaa kan ugu badan (${lead.count} jawaabood, ${lead.percentage}%), taasoo muujineysa jihada ugu weyn ee ka muuqata jawaabaha.${second ? ` Heerka ${second.answer} ayaa ku xiga.` : ''}`;
  }

  if (question.type === 'numeric') {
    return `Qiimaha ${lead.answer} ayaa ahaa kan ugu badan (${lead.count} jawaabood, ${lead.percentage}%). Tani waxay muujineysaa halka jawaabaha intooda badan ku urureen.`;
  }

  return `Inta badan dadka ka jawaabay su'aashan waxay doorteen ${lead.answer} (${lead.count} jawaabood, ${lead.percentage}%).${second ? ` ${second.answer} ayaa ahayd jawaabta ku xigtay (${second.percentage}%).` : ''}`;
};

const buildInsightSummary = (question, analysis, isTextQuestion) => {
  if (isTextQuestion) {
    const themes = analysis.textAnalysis?.themes || [];
    const keywords = analysis.textAnalysis?.keywords || [];
    const groups = analysis.textAnalysis?.groupedTopics || [];
    const summary = [];

    if (themes[0]) summary.push(`${themes[0].theme} ayaa ah mawduuca ugu badan ee ka muuqda jawaabaha.`);
    if (themes[1]) summary.push(`${themes[1].theme} ayaa si cad uga dhex muuqata jawaabaha kale.`);
    if (keywords[0]) summary.push(`Erayga "${keywords[0].keyword}" ayaa ah kan ugu badan ee la adeegsaday.`);
    if (groups[0]) summary.push(`${groups[0].count} jawaabood ayaa ku ururay qaybta ${groups[0].topic}.`);

    return summary.length ? summary.slice(0, 3) : ['Mawduuc muuqda lama helin su’aashan.'];
  }

  const answers = sortAnswersForQuestion(analysis.answers || [], question.type);
  if (!answers.length) return ['Jawaabo kuma jiraan qeybtan.'];

  const lead = answers[0];
  const second = answers[1];
  const summary = [`${lead.answer} ayaa hoggaamineysa jawaabaha (${lead.percentage}%).`];

  if (second) summary.push(`${second.answer} ayaa ku xigta (${second.percentage}%).`);
  if (lead.percentage >= 60) {
    summary.push('Jawaabaha waxay muujinayaan is-afgarad xooggan.');
  } else if (second && lead.percentage - second.percentage <= 10) {
    summary.push('Jawaabaha waxay muujinayaan kala qaybsanaan u dhow.');
  } else {
    summary.push('Hal jawaab ayaa ka muuqata, laakiin weli waxaa jira kala duwanaansho la dareemi karo.');
  }

  return summary.slice(0, 3);
};

const buildQuestionReport = (question, analytics = {}, options = {}) => {
  const payload = mergeAnalyticsPayload(analytics);
  const overallTotal = numberValue(payload.totals?.totalResponses || payload.totalResponses);
  const analysis =
    (payload.questionAnalysis || []).find((item) => item.code === question.code) || buildFallbackQuestionAnalysis(question, payload);

  const isTextQuestion = analysis?.type === 'text' || Boolean(analysis?.textAnalysis) || TEXT_TYPES.has(question.type);
  const chartPreset = getChartPreset(question.type, analysis);
  const answers = sortAnswersForQuestion(analysis.answers || [], question.type);
  const topThemes = (analysis.textAnalysis?.themes || []).slice(0, 6);
  const keywords = (analysis.textAnalysis?.keywords || []).slice(0, 12);
  const groupedCategories = (analysis.textAnalysis?.groupedTopics || []).map((item) => ({
    label: item.topic,
    topic: item.topic,
    count: item.count,
    percentage: item.percentage,
    examples: item.examples || []
  }));
  const frequencyBreakdown = isTextQuestion
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

  const totalResponses = numberValue(analysis.totalResponses || frequencyBreakdown.reduce((sum, item) => sum + numberValue(item.count), 0));
  const responseCompletionRate = overallTotal ? percent((Math.min(totalResponses, overallTotal) / overallTotal) * 100) : 0;

  if (!totalResponses || !frequencyBreakdown.length) {
    return buildNoDataQuestionReport(question, overallTotal, options.emptyMessage);
  }

  const interpretation = options.errorMessage || buildSomaliInterpretation(question, { ...analysis, answers }, isTextQuestion);
  const insightSummary = buildInsightSummary(question, { ...analysis, answers }, isTextQuestion);
  const orderedBreakdown = [...frequencyBreakdown].sort((left, right) => (right.count || 0) - (left.count || 0));

  return {
    code: question.code,
    order: question.order,
    title: question.text,
    section: question.section,
    questionType: question.type,
    chartPreset,
    totalResponses,
    responseCompletionRate,
    frequencyBreakdown,
    mainChartData: isTextQuestion ? keywords : answers,
    secondaryChartData:
      question.type === 'yes_no' || CHOICE_TYPES.has(question.type) || question.type === 'likert'
        ? answers
        : [],
    yesNoSummary: question.type === 'yes_no' ? buildYesNoSummary(answers) : null,
    topThemes,
    keywords,
    groupedCategories,
    interpretation,
    insightSummary,
    highlights: buildHighlights(frequencyBreakdown, isTextQuestion),
    dominantAnswer: orderedBreakdown[0] || null,
    secondMostCommonAnswer: orderedBreakdown[1] || null,
    leastSelectedAnswer: orderedBreakdown[orderedBreakdown.length - 1] || null
  };
};

const buildOverviewReport = (analytics = {}) => {
  const payload = mergeAnalyticsPayload(analytics);
  const totals = payload.totals || {};
  const overview = payload.overview || {};
  const sectorRanking = Array.isArray(payload.readiness?.sectorLeaderboard) && payload.readiness.sectorLeaderboard.length
    ? payload.readiness.sectorLeaderboard
    : Array.isArray(payload.sectorComparison)
      ? payload.sectorComparison
      : payload.readinessRanking || [];
  const commonPatterns = (payload.importantQuestionAnalysis || []).slice(0, 4).map((item) => ({
    question: item.question,
    answer: item.topAnswer,
    percentage: item.topPercentage
  }));

  return {
    title: 'Overview',
    executiveSummary:
      overview.executiveSummary ||
      `${totals.totalResponses || 0} responses were analyzed across ${totals.totalSectorsCovered || 0} sectors.`,
    summaryCards: [
      { label: 'Total Responses', value: totals.totalResponses || 0, helper: 'All filtered responses' },
      { label: 'Total Sectors', value: totals.totalSectorsCovered || 0, helper: 'Sectors represented in the filtered data' },
      { label: 'Total Districts', value: totals.totalDistrictsCovered || 0, helper: 'Districts represented in the filtered data' },
      { label: 'Responses Today', value: totals.responsesToday || 0, helper: 'Submissions received today' },
      { label: 'Responses This Week', value: totals.responsesThisWeek || 0, helper: 'Submissions received in the last 7 days' },
      {
        label: 'Average Readiness',
        value: `${totals.averageCloudReadinessScore || payload.readinessStats?.average || 0}%`,
        helper: 'Average cloud readiness score'
      },
      { label: 'Awareness Rate', value: `${totals.awarenessRate || 0}%`, helper: 'Respondents who have heard of cloud computing' },
      {
        label: 'Adoption Willingness',
        value: `${totals.adoptionWillingnessRate || 0}%`,
        helper: 'Respondents willing to adopt cloud solutions'
      },
      { label: 'Cloud Tools Usage', value: `${totals.cloudToolsUsageRate || 0}%`, helper: 'Current cloud-tools usage rate' },
      { label: 'Backup Practice Rate', value: `${totals.backupPracticeRate || 0}%`, helper: 'Respondents with some backup practice' },
      {
        label: 'Infrastructure Stability',
        value: `${totals.infrastructureStabilityRate || 0}%`,
        helper: 'Infrastructure readiness score'
      },
      { label: 'Security Trust', value: `${totals.securityTrustRate || 0}%`, helper: 'Trust in cloud storage and security' }
    ],
    highlightCards: overview.insightCards || [],
    insightSummary: payload.summaryFindings || [],
    commonPatterns,
    charts: {
      readinessBands: overview.readinessBands || [],
      dailyResponses: overview.timeSeries?.dailyResponses || [],
      awarenessTrend: overview.timeSeries?.awarenessTrend || [],
      sectorRanking,
      awarenessDistribution: payload.awarenessDistribution || [],
      willingnessDistribution: payload.willingnessDistribution || [],
      barrierRanking: payload.commonBarriers || payload.barriers?.overallRanking || [],
      securityTrust: payload.security?.trustLevels || []
    }
  };
};

const buildFinalReport = (analytics = {}) => {
  const payload = mergeAnalyticsPayload(analytics);
  const factorSummary = payload.factorSummary || [];
  const strongestFactor = factorSummary[0];
  const weakestFactor = factorSummary[factorSummary.length - 1];
  const topPatterns = [
    payload.questionAnalysis?.find((item) => item.code === 'q5')?.answers?.[0]
      ? `Su'aasha Q5, jawaabta ugu badan waa ${payload.questionAnalysis.find((item) => item.code === 'q5').answers[0].answer}.`
      : '',
    payload.questionAnalysis?.find((item) => item.code === 'q8')?.answers?.[0]
      ? `Qalabka ugu badan ee la adeegsado waa ${payload.questionAnalysis.find((item) => item.code === 'q8').answers[0].answer}.`
      : '',
    payload.questionAnalysis?.find((item) => item.code === 'q11')?.answers?.[0]
      ? `Heerka internet-ka ee ugu badan waa ${payload.questionAnalysis.find((item) => item.code === 'q11').answers[0].answer}.`
      : '',
    payload.questionAnalysis?.find((item) => item.code === 'q12')?.answers?.[0]
      ? `Habka kaydinta ugu badan waa ${payload.questionAnalysis.find((item) => item.code === 'q12').answers[0].answer}.`
      : '',
    payload.questionAnalysis?.find((item) => item.code === 'q27')?.answers?.[0]
      ? `Q27, jawaabta ugu badan waa ${payload.questionAnalysis.find((item) => item.code === 'q27').answers[0].answer}.`
      : ''
  ]
    .filter(Boolean)
    .slice(0, 5);

  const topProblems = (payload.barriers?.overallRanking || []).slice(0, 5).map(
    (item) => `${item.answer} waxay saamayn ku leedahay ${item.percentage}% jawaab bixiyeyaasha.`
  );

  const topOpportunities = (payload.readiness?.highReadinessOpportunities || []).slice(0, 5).map(
    (item) => `${item.sector} waxay leedahay fursad sare oo diyaar-garow ah (${item.averageReadiness}%).`
  );

  const recommendations = payload.reportView?.recommendations?.length
    ? payload.reportView.recommendations
    : payload.recommendationBlocks?.summary || payload.recommendations || [baseSummaryRecommendation];

  return {
    title: payload.reportView?.title || 'Somalia Cloud Computing Survey Report',
    generatedAt: payload.generatedAt || new Date().toISOString(),
    executiveSummary: payload.reportView?.executiveSummary || payload.summaryFindings?.[0] || 'No data available.',
    keyFindings: payload.reportView?.keyFindings || payload.summaryFindings || ['No survey responses match the selected filters yet.'],
    readinessRanking: payload.reportView?.readinessRanking || payload.readiness?.sectorLeaderboard || [],
    topBarriers: payload.reportView?.topBarriers || payload.barriers?.overallRanking || [],
    topPatterns,
    topProblems,
    topOpportunities,
    cloudReadinessSummary: {
      overallAverage: payload.readiness?.overallAverage || payload.readinessStats?.average || 0,
      distribution: payload.readiness?.distribution || [],
      strongestFactor: strongestFactor ? `${strongestFactor.label} (${strongestFactor.score}%)` : 'No factor identified',
      weakestFactor: weakestFactor ? `${weakestFactor.label} (${weakestFactor.score}%)` : 'No factor identified',
      summaryText: `Celceliska cloud readiness waa ${payload.readiness?.overallAverage || payload.readinessStats?.average || 0}%.${strongestFactor ? ` Qodobka ugu xooggan waa ${strongestFactor.label}.` : ''}${weakestFactor ? ` Qodobka ugu daciifsan waa ${weakestFactor.label}.` : ''}`
    },
    recommendations: recommendations.slice(0, 6),
    conclusion:
      payload.reportView?.conclusion ||
      'Warbixintani waxay muujineysaa in horumarka cloud adoption-ku uu u baahan yahay isku xidhnaan ka dhexeysa wacyigelin, kaabayaal, amni, iyo tababar.'
  };
};

module.exports = {
  createEmptyAnalyticsPayload,
  localeSort,
  normalizeAnalyticsPayload,
  buildNoDataQuestionReport,
  buildQuestionReport,
  buildOverviewReport,
  buildFinalReport
};
