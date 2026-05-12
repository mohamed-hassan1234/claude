const { questions } = require('../data/defaults');
const { SCORE_KEYS, VALUE_SCORES } = require('./readinessService');

const QUESTIONS = Object.fromEntries(questions.map((question) => [question.code, question.text]));
const QUESTION_TYPES = Object.fromEntries(questions.map((question) => [question.code, question.type]));
const TEXT_QUESTIONS = new Set(questions.filter((question) => ['short_text', 'paragraph'].includes(question.type)).map((question) => question.code));
const OPEN_TEXT_ANALYSIS_QUESTIONS = new Set(['q30']);

const FACTOR_QUESTIONS = {
  cloudAwareness: ['q6', 'q7'],
  technologyUse: ['q8', 'q9', 'q10', 'q11', 'q12'],
  infrastructureReadiness: ['q22', 'q23', 'q24'],
  backupPractices: ['q13', 'q14', 'q15', 'q16', 'q17'],
  cloudToolsUse: ['q18', 'q19', 'q20', 'q21'],
  securityTrust: ['q26', 'q27'],
  willingnessToAdopt: ['q28', 'q29']
};

const FACTOR_LABELS = {
  cloudAwareness: 'Cloud awareness',
  technologyUse: 'Technology usage',
  infrastructureReadiness: 'Infrastructure readiness',
  backupPractices: 'Data storage and backup',
  cloudToolsUse: 'Cloud usage',
  securityTrust: 'Security confidence',
  willingnessToAdopt: 'Adoption readiness'
};

const STOP_WORDS = new Set([
  'iyo',
  'ama',
  'waa',
  'wax',
  'in',
  'la',
  'oo',
  'ka',
  'ku',
  'ay',
  'uu',
  'u',
  'ah',
  'ee',
  'si',
  'leh',
  'naga',
  'nagu',
  'karo',
  'kartaa'
]);

const THEME_RULES = [
  { theme: 'Backup iyo kaydinta xogta', keywords: ['backup', 'kayd', 'kaydin', 'xog', 'dukumenti'] },
  { theme: 'Amniga xogta', keywords: ['amn', 'sir', 'xatooyo', 'hack', 'ilaalin'] },
  { theme: 'Wada shaqeyn iyo helitaan', keywords: ['wada', 'shaqeyn', 'online', 'hel', 'fog'] },
  { theme: 'Hufnaan shaqo', keywords: ['hufnaan', 'fudud', 'degdeg', 'maamul', 'warbixin'] },
  { theme: 'Qiime iyo kaabayaal', keywords: ['qiime', 'kharash', 'internet', 'koronto'] },
  { theme: 'Adeegga macaamiisha', keywords: ['macaamiil', 'customer', 'iib', 'adeeg'] }
];

const roundNumber = (value, decimals = 0) => Number((Number(value) || 0).toFixed(decimals));
const mean = (values) => (values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0);
const safeString = (value) => String(value ?? '').trim();

const splitAnswer = (value) => {
  if (Array.isArray(value)) return value.map(safeString).filter(Boolean);
  const text = safeString(value);
  if (!text) return [];
  return text.split(',').map((item) => item.trim()).filter(Boolean);
};

const frequencyForValues = (values = []) => {
  const counts = new Map();
  for (const value of values) {
    for (const answer of splitAnswer(value)) {
      counts.set(answer, (counts.get(answer) || 0) + 1);
    }
  }

  const total = Array.from(counts.values()).reduce((sum, value) => sum + value, 0);
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([answer, count]) => ({
      answer,
      label: answer,
      count,
      percentage: total ? roundNumber((count / total) * 100, 2) : 0
    }));
};

const frequencyForColumn = (rows, column) => frequencyForValues(rows.map((row) => row[column]));

const allFrequencyAnalysis = (rows) =>
  Object.entries(QUESTIONS).reduce((result, [code, text]) => {
    result[code] = {
      question: text,
      answers: frequencyForColumn(rows, text)
    };
    return result;
  }, {});

const scoreAnswer = (code, value) => {
  const answers = splitAnswer(value);
  if (!answers.length) return 0;
  const scoreMap = VALUE_SCORES[code] || {};
  return mean(answers.map((answer) => scoreMap[answer] ?? 40));
};

const withFactorScores = (rows) =>
  rows.map((row) => {
    const factorValues = {};

    for (const [factor, codes] of Object.entries(FACTOR_QUESTIONS)) {
      const scores = codes.map((code) => scoreAnswer(code, row[QUESTIONS[code]])).filter((value) => Number.isFinite(value));
      factorValues[factor] = scores.length ? mean(scores) : 0;
    }

    return {
      ...row,
      ...factorValues,
      calculatedReadiness: mean(Object.values(factorValues))
    };
  });

const readinessStats = (rows) => {
  const scores = rows
    .map((row) => {
      const stored = Number(row.readinessScore);
      return Number.isFinite(stored) && stored > 0 ? stored : row.calculatedReadiness || 0;
    })
    .filter((value) => Number.isFinite(value));

  if (!scores.length) return { average: 0, median: 0, min: 0, max: 0 };

  const sorted = [...scores].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];

  return {
    average: roundNumber(mean(scores)),
    median: roundNumber(median),
    min: roundNumber(sorted[0]),
    max: roundNumber(sorted[sorted.length - 1])
  };
};

const groupBy = (rows, key) => {
  const grouped = new Map();
  for (const row of rows) {
    const label = safeString(row[key]) || 'Unknown';
    if (!grouped.has(label)) grouped.set(label, []);
    grouped.get(label).push(row);
  }
  return grouped;
};

const comparisonRows = (rows, key, labelKey) =>
  Array.from(groupBy(rows, key).entries())
    .map(([label, items]) => ({
      [labelKey]: label,
      label,
      responses: items.length,
      cloudAwareness: roundNumber(mean(items.map((item) => item.cloudAwareness || 0))),
      technologyUse: roundNumber(mean(items.map((item) => item.technologyUse || 0))),
      infrastructureReadiness: roundNumber(mean(items.map((item) => item.infrastructureReadiness || 0))),
      backupPractices: roundNumber(mean(items.map((item) => item.backupPractices || 0))),
      cloudToolsUse: roundNumber(mean(items.map((item) => item.cloudToolsUse || 0))),
      securityTrust: roundNumber(mean(items.map((item) => item.securityTrust || 0))),
      willingnessToAdopt: roundNumber(mean(items.map((item) => item.willingnessToAdopt || 0))),
      averageReadiness: roundNumber(mean(items.map((item) => item.calculatedReadiness || 0)))
    }))
    .sort((a, b) => b.averageReadiness - a.averageReadiness);

const gapAnalysis = (rows) =>
  Object.entries(FACTOR_LABELS)
    .map(([factor, label]) => {
      const current = mean(rows.map((row) => row[factor] || 0));
      return { factor, label, current: roundNumber(current), ideal: 100, gap: roundNumber(100 - current) };
    })
    .sort((a, b) => b.gap - a.gap);

const factorSummary = (rows) =>
  Object.entries(FACTOR_LABELS)
    .map(([factor, label]) => ({ factor, label, score: roundNumber(mean(rows.map((row) => row[factor] || 0))) }))
    .sort((a, b) => b.score - a.score);

const readinessBands = (rows) => {
  const counts = { Low: 0, Medium: 0, High: 0 };
  for (const row of rows) {
    const score = Number(row.readinessScore) || row.calculatedReadiness || 0;
    const band = score >= 70 ? 'High' : score >= 40 ? 'Medium' : 'Low';
    counts[band] += 1;
  }
  const total = rows.length || 1;
  return Object.entries(counts).map(([band, count]) => ({ band, label: band, count, percentage: roundNumber((count / total) * 100, 2) }));
};

const dailyResponses = (rows) => {
  const counts = new Map();
  for (const row of rows) {
    const date = row.submittedAt ? new Date(row.submittedAt) : null;
    if (!date || Number.isNaN(date.getTime())) continue;
    const label = date.toISOString().slice(0, 10);
    counts.set(label, (counts.get(label) || 0) + 1);
  }
  return Array.from(counts.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([date, responses]) => ({ date, responses }));
};

const answerRate = (rows, code, positiveAnswers) => {
  const column = QUESTIONS[code];
  const positive = new Set(positiveAnswers);
  const values = rows.map((row) => splitAnswer(row[column])).filter((items) => items.length);
  if (!values.length) return 0;
  const count = values.filter((items) => items.some((item) => positive.has(item))).length;
  return roundNumber((count / values.length) * 100, 2);
};

const extractWords = (text) =>
  safeString(text)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s’'-]/gu, ' ')
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word));

const analyzeTextQuestion = (rows, code) => {
  const column = QUESTIONS[code];
  const responses = rows.map((row) => safeString(row[column])).filter(Boolean);
  const wordCounts = new Map();
  const themes = THEME_RULES.map((rule) => ({ theme: rule.theme, count: 0, examples: [], keywords: rule.keywords }));

  for (const response of responses) {
    const words = extractWords(response);
    words.forEach((word) => wordCounts.set(word, (wordCounts.get(word) || 0) + 1));
    const normalized = response.toLowerCase();
    let matched = false;

    for (const theme of themes) {
      if (theme.keywords.some((keyword) => normalized.includes(keyword))) {
        theme.count += 1;
        matched = true;
        if (theme.examples.length < 3) theme.examples.push(response);
      }
    }

    if (!matched) {
      let other = themes.find((theme) => theme.theme === 'Fikrado kale');
      if (!other) {
        other = { theme: 'Fikrado kale', count: 0, examples: [], keywords: [] };
        themes.push(other);
      }
      other.count += 1;
      if (other.examples.length < 3) other.examples.push(response);
    }
  }

  const total = responses.length || 1;
  const topThemes = themes
    .filter((theme) => theme.count)
    .sort((a, b) => b.count - a.count)
    .map((theme) => ({ ...theme, percentage: roundNumber((theme.count / total) * 100, 2) }));

  const keywords = Array.from(wordCounts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 20)
    .map(([keyword, count]) => ({ keyword, count }));

  return {
    question: column,
    totalResponses: responses.length,
    themes: topThemes,
    keywords,
    groupedTopics: topThemes.map((theme) => ({ topic: theme.theme, count: theme.count, percentage: theme.percentage, examples: theme.examples })),
    sampleResponses: responses.slice(0, 5),
    summary: topThemes[0]
      ? `${topThemes[0].theme} ayaa ah mawduuca ugu badan ee ka muuqda jawaabaha furan.`
      : 'No open-ended responses were available for this question.'
  };
};

const buildQuestionAnalysis = (rows, frequencies, textAnalysis) =>
  questions.map((question) => {
    const values = rows.map((row) => row[question.text]);
    const totalResponses = values.filter((value) => splitAnswer(value).length).length;

    if (OPEN_TEXT_ANALYSIS_QUESTIONS.has(question.code)) {
      const analysis = textAnalysis[question.code] || analyzeTextQuestion(rows, question.code);
      return {
        code: question.code,
        question: question.text,
        type: 'text',
        totalResponses: analysis.totalResponses,
        answers: frequencies[question.code]?.answers || [],
        textAnalysis: analysis,
        interpretation: analysis.summary
      };
    }

    return {
      code: question.code,
      question: question.text,
      type: TEXT_QUESTIONS.has(question.code) ? 'text' : 'closed',
      totalResponses,
      answers: frequencies[question.code]?.answers || [],
      interpretation: ''
    };
  });

const importantQuestionAnalysis = (frequencies) =>
  ['q2', 'q6', 'q8', 'q10', 'q11', 'q13', 'q18', 'q19', 'q22', 'q25', 'q26', 'q28', 'q29'].map((code) => {
    const item = frequencies[code] || {};
    const answers = item.answers || [];
    return {
      code,
      question: item.question || QUESTIONS[code],
      topAnswer: answers[0]?.answer || 'No answer',
      topCount: answers[0]?.count || 0,
      topPercentage: answers[0]?.percentage || 0,
      answers
    };
  });

const recommendations = (stats, gaps, frequencies) => {
  const recs = [];
  const barrier = frequencies.q25?.answers?.[0]?.answer;
  const cloudUse = frequencies.q18?.answers?.[0]?.answer;

  if (stats.average < 40) {
    recs.push('Mudnaanta sii wacyigelin Cloud Computing, tababar aasaasi ah, iyo adeegyo tijaabo ah oo qiimo jaban.');
  } else if (stats.average < 70) {
    recs.push('Xooji backup joogto ah, isticmaalka cloud apps, iyo hagitaan amni oo shaqaalaha la fahamsiin karo.');
  } else {
    recs.push('Ballaarinta cloud systems-ka ku dhis governance, access control, iyo cabbir joogto ah oo waxqabadka ah.');
  }

  for (const gap of gaps.slice(0, 3)) {
    recs.push(`Qodobka ${gap.label} wuxuu leeyahay farqi ${gap.gap}%, sidaas darteed wuxuu u baahan yahay qorshe gaar ah.`);
  }

  if (barrier) recs.push(`Caqabadda ugu badan waa ${barrier}; qorshaha horumarintu waa inuu si toos ah u xalliyo.`);
  if (cloudUse === 'Maya') recs.push('Hay’adaha aan weli isticmaalin cloud tools ha ku bilaabaan kayd xogeed iyo online backup fudud.');

  return recs.slice(0, 6);
};

const emptyPayload = () => ({
  totalResponses: 0,
  frequencyAnalysis: {},
  percentageAnalysis: {},
  readinessStats: { average: 0, median: 0, min: 0, max: 0 },
  factorSummary: [],
  sectorComparison: { rows: [] },
  readinessRanking: [],
  gapAnalysis: { overall: [] },
  importantQuestionAnalysis: [],
  questionAnalysis: [],
  districtDistribution: [],
  awarenessDistribution: [],
  willingnessDistribution: [],
  commonBarriers: [],
  securityConcerns: [],
  charts: {},
  summaryFindings: ['No survey responses match the selected filters yet.'],
  recommendations: ['Collect more responses before drawing operational conclusions.'],
  descriptiveStatistics: { responsesBySector: 0, responsesByDistrict: 0, stdDeviationReadiness: 0 }
});

const buildLocalAnalytics = (rawRows = []) => {
  if (!rawRows.length) return emptyPayload();

  const rows = withFactorScores(rawRows);
  const frequencies = allFrequencyAnalysis(rows);
  const textAnalysis = { q30: analyzeTextQuestion(rows, 'q30') };
  const questionAnalysis = buildQuestionAnalysis(rows, frequencies, textAnalysis);
  const stats = readinessStats(rows);
  const sectors = comparisonRows(rows, 'sector', 'sector');
  const districts = comparisonRows(rows, 'district', 'district');
  const gaps = gapAnalysis(rows);
  const factors = factorSummary(rows);
  const readinessValues = rows.map((row) => row.calculatedReadiness || 0);
  const readinessMean = mean(readinessValues);
  const variance = readinessValues.length ? mean(readinessValues.map((value) => (value - readinessMean) ** 2)) : 0;
  const today = new Date().toISOString().slice(0, 10);
  const responsesToday = rows.filter((row) => row.submittedAt && new Date(row.submittedAt).toISOString().slice(0, 10) === today).length;
  const sectorDistribution = frequencyForColumn(rows, 'sector');
  const districtDistribution = frequencyForColumn(rows, 'district');
  const barriers = frequencies.q25?.answers || [];
  const securityConcerns = frequencies.q27?.answers || [];
  const cloudTools = frequencies.q19?.answers || [];
  const cloudNeeds = frequencies.q28?.answers || [];
  const awarenessDistribution = frequencies.q6?.answers || [];
  const willingnessDistribution = frequencies.q29?.answers || [];
  const topSector = sectors[0]?.sector || 'No sector';
  const topBarrier = barriers[0]?.answer || 'No dominant barrier';
  const strongestFactor = factors[0]?.label || 'No factor';
  const weakestFactor = gaps[0]?.label || 'No factor';
  const recs = recommendations(stats, gaps, frequencies);

  const totals = {
    totalResponses: rows.length,
    totalSectorsCovered: new Set(rows.map((row) => safeString(row.sector)).filter(Boolean)).size,
    totalDistrictsCovered: new Set(rows.map((row) => safeString(row.district)).filter(Boolean)).size,
    responsesToday,
    responsesThisWeek: rows.length,
    averageCloudReadinessScore: stats.average,
    awarenessRate: answerRate(rows, 'q6', ['Haa']),
    adoptionWillingnessRate: answerRate(rows, 'q29', ['Haa']),
    cloudToolsUsageRate: answerRate(rows, 'q18', ['Haa']),
    backupPracticeRate: answerRate(rows, 'q14', ['Maalin kasta', 'Toddobaadle', 'Bille', 'Mararka qaar']),
    infrastructureStabilityRate: roundNumber(mean(rows.map((row) => row.infrastructureReadiness || 0))),
    securityTrustRate: roundNumber(mean(rows.map((row) => row.securityTrust || 0)))
  };

  const summaryFindings = [
    `${rows.length} responses were analyzed across ${totals.totalSectorsCovered} sectors and ${totals.totalDistrictsCovered} districts.`,
    `The average cloud readiness score is ${stats.average} out of 100.`,
    `The most represented sector is ${sectorDistribution[0]?.answer || 'No sector'}.`,
    `The highest readiness sector is ${topSector}.`,
    `The most common technology improvement barrier is ${topBarrier}.`,
    `The strongest readiness area is ${strongestFactor}, while the largest gap is ${weakestFactor}.`
  ];

  return {
    generatedAt: new Date().toISOString(),
    totalResponses: rows.length,
    totals,
    filterOptions: {
      districts: districtDistribution.map((item) => item.answer),
      awarenessLevels: awarenessDistribution.map((item) => item.answer),
      willingnessLevels: willingnessDistribution.map((item) => item.answer),
      readinessLevels: ['Low', 'Medium', 'High']
    },
    overview: {
      totals,
      insightCards: [
        { label: 'Sector Distribution', value: sectorDistribution[0]?.answer || 'No sector', helper: 'Most represented sector' },
        { label: 'Cloud Awareness', value: `${totals.awarenessRate}%`, helper: 'Q6 Haa responses' },
        { label: 'Technology Usage', value: `${roundNumber(mean(rows.map((row) => row.technologyUse || 0)))}%`, helper: 'Combined Q8-Q12 score' },
        { label: 'Adoption Readiness', value: `${totals.adoptionWillingnessRate}%`, helper: 'Q29 Haa responses' }
      ],
      executiveSummary: summaryFindings[0],
      timeSeries: { dailyResponses: dailyResponses(rows), readinessTrend: [], awarenessTrend: [] },
      readinessBands: readinessBands(rows)
    },
    questionAnalysis,
    frequencyAnalysis: frequencies,
    percentageAnalysis: frequencies,
    readinessStats: stats,
    factorSummary: factors,
    sectorComparison: { rows: sectors, readinessLeaderboard: sectors, stackedReadiness: sectors },
    districtComparison: { rows: districts, ranking: districts },
    readiness: {
      overallAverage: stats.average,
      distribution: readinessBands(rows),
      sectorLeaderboard: sectors,
      districtLeaderboard: districts,
      responseRanking: [],
      radar: factors,
      factorBreakdown: factors,
      lowReadinessAlerts: sectors.filter((item) => item.averageReadiness < 40),
      highReadinessOpportunities: sectors.filter((item) => item.averageReadiness >= 70),
      interpretation: `Average cloud readiness is ${stats.average}%.`,
      explanation: 'Readiness combines awareness, technology usage, backup, cloud usage, infrastructure, security, and adoption readiness.'
    },
    gapAnalysis: {
      overall: gaps,
      progressToIdeal: gaps.map((item) => ({ ...item, value: item.current })),
      sectorGaps: sectors,
      districtGaps: districts,
      largestGapFactor: gaps[0]?.label || 'No factor',
      largestGapSector: sectors[sectors.length - 1]?.sector || 'No sector',
      largestGapDistrict: districts[districts.length - 1]?.district || 'No district',
      narrative: gaps.slice(0, 3).map((item) => `${item.label} has a ${item.gap}% gap to ideal readiness.`)
    },
    infrastructure: {
      internetAvailability: frequencies.q22?.answers || [],
      internetQuality: frequencies.q22?.answers || [],
      electricityAvailability: frequencies.q24?.answers || [],
      interruptionFrequency: frequencies.q23?.answers || [],
      sectorComparison: sectors,
      riskSummary: gaps.filter((item) => item.factor === 'infrastructureReadiness')
    },
    security: {
      trustLevels: frequencies.q26?.answers || [],
      securityConcerns,
      sectorTrustComparison: sectors.map((item) => ({ sector: item.sector, trust: item.securityTrust, responses: item.responses })),
      topConcernLeaderboard: securityConcerns,
      fearSummary: securityConcerns,
      trustBuildingRecommendations: ['Sharax encryption, access control, iyo backup policies si loo dhiso kalsoonida cloud-ka.']
    },
    barriers: {
      overallRanking: barriers,
      challengeFrequency: barriers,
      topFiveChallenges: barriers.slice(0, 5),
      bySector: sectors,
      byDistrict: districts,
      mostCommonBarrier: topBarrier
    },
    businessNeeds: {
      digitalNeeds: cloudNeeds,
      willingness: willingnessDistribution,
      openEndedQuestions: textAnalysis,
      themeCards: textAnalysis.q30.themes || [],
      groupedTopicBlocks: textAnalysis.q30.groupedTopics || [],
      keywordChart: textAnalysis.q30.keywords || [],
      insightSummaries: [textAnalysis.q30.summary],
      mostCommonRecommendationTheme: textAnalysis.q30.themes?.[0]?.theme || 'No dominant theme'
    },
    recommendationBlocks: {
      overall: recs,
      sectorSpecific: sectors.slice(0, 5).map((item) => ({ sector: item.sector, recommendation: `${item.sector}: focus on the weakest readiness factors.` })),
      districtSpecific: districts.slice(0, 5).map((item) => ({ district: item.district, recommendation: `${item.district}: prioritize infrastructure and cloud usage support.` })),
      summary: recs
    },
    reportView: {
      title: 'Somalia Cloud Computing Survey Analytics Report',
      subtitle: `${rows.length} filtered responses`,
      executiveSummary: `This report analyzes ${rows.length} responses using the updated 30-question Cloud Computing survey instrument.`,
      keyFindings: summaryFindings,
      readinessRanking: sectors,
      topBarriers: barriers,
      topOpportunities: cloudNeeds.slice(0, 5),
      recommendations: recs,
      conclusion: 'The updated responses show where cloud adoption can grow through better awareness, practical cloud tools, reliable infrastructure, security confidence, and clear business value.'
    },
    importantQuestionAnalysis: importantQuestionAnalysis(frequencies),
    districtDistribution,
    sectorDistribution,
    awarenessDistribution,
    willingnessDistribution,
    commonBarriers: barriers,
    infrastructureChallenges: frequencies.q22?.answers || [],
    securityConcerns,
    cloudTools,
    cloudNeeds,
    charts: {},
    summaryFindings,
    recommendations: recs,
    descriptiveStatistics: {
      responsesBySector: totals.totalSectorsCovered,
      responsesByDistrict: totals.totalDistrictsCovered,
      stdDeviationReadiness: Number(Math.sqrt(variance).toFixed(2))
    }
  };
};

module.exports = { buildLocalAnalytics };
