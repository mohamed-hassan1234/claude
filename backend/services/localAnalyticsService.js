const QUESTIONS = {
  q1: 'Ganacsigaaga ama hay’addaadu noocee ah ayey tahay?',
  q2: 'Immisa sano ayuu ganacsigaagu shaqeynayay?',
  q3: 'Immisa shaqaale ayaa ka shaqeeya hay’addaada?',
  q4: 'Waaxdee ayaad ka shaqeysaa?',
  q5: 'Ma maqashay erayga “Cloud Computing” hore?',
  q6: 'Sidee baad u qiimeyn lahayd fahamkaaga cloud computing?',
  q7: 'Maxaad u fahantaa cloud computing?',
  q8: 'Noocee qalab ah ayaad inta badan isticmaashaan?',
  q9: 'Ma isticmaashaan software maamulka ganacsiga?',
  q10: 'Internet joogto ah ma haysataan?',
  q11: 'Tayada internet-kiinnu sidee tahay?',
  q12: 'Xogta ganacsiga xaggee ku kaydsataan?',
  q13: 'Ma sameysaan backup joogto ah?',
  q14: 'Immisa jeer ayay xog kaa luntay?',
  q15: 'Ma isticmaashaan adeegyada cloud sida Google Drive, OneDrive, Dropbox?',
  q16: 'Haddii haa, adeeggee ugu badan ayaad isticmaashaan?',
  q17: 'Cloud systems ma ka caawiyeen shaqadaada?',
  q18: 'Koronto joogto ah ma haysataan?',
  q19: 'Koronto la’aantu intee jeer ayay shaqada hakisaa?',
  q20: 'Internet la’aantu ma caqabad weyn bay idiin tahay?',
  q21: 'Maxay yihiin caqabadaha ugu waaweyn ee kaa hor istaagaya cloud adoption?',
  q22: 'Shaqaalahaagu ma leeyihiin xirfad ku filan cloud technology?',
  q23: 'Tababar ma u baahan tihiin?',
  q24: 'Ma ku kalsoon tahay in xogtaada lagu kaydiyo cloud?',
  q25: 'Maxaa kaa walwal geliya cloud security?',
  q26: 'Ganacsigaagu ma u baahan yahay nidaam digital casri ah?',
  q27: 'Haddii cloud solution la heli karo, ma diyaar baad u tahay inaad isticmaasho?',
  q28: 'Maxay yihiin adeegyada aad rabto in cloud kuu xalliyo?',
  q29: 'Sidee ayaad u aragtaa mustaqbalka cloud computing ee Soomaaliya?',
  q30: 'Maxaad kula talin lahayd dowladda ama shirkadaha si loo kordhiyo cloud adoption-ka Soomaaliya?'
};

const FACTOR_QUESTIONS = {
  cloudAwareness: ['q5', 'q6'],
  technologyUse: ['q8', 'q9'],
  infrastructureReadiness: ['q10', 'q11', 'q18', 'q19', 'q20'],
  backupPractices: ['q12', 'q13'],
  cloudToolsUse: ['q15', 'q17'],
  securityTrust: ['q24'],
  willingnessToAdopt: ['q27']
};

const CLOSED_ENDED_QUESTIONS = [
  'q5',
  'q6',
  'q8',
  'q9',
  'q10',
  'q11',
  'q12',
  'q13',
  'q14',
  'q15',
  'q17',
  'q18',
  'q19',
  'q20',
  'q21',
  'q22',
  'q23',
  'q24',
  'q25',
  'q26',
  'q27'
];

const FACTOR_LABELS = {
  cloudAwareness: 'Cloud awareness',
  technologyUse: 'Technology use',
  infrastructureReadiness: 'Infrastructure readiness',
  backupPractices: 'Backup practices',
  cloudToolsUse: 'Cloud tools use',
  securityTrust: 'Security trust',
  willingnessToAdopt: 'Willingness to adopt'
};

const SCORES = {
  q5: { Haa: 100, Maya: 0 },
  q6: { 'Aad u fiican': 100, Fiican: 80, Dhexdhexaad: 60, Yar: 30, 'Midna ma aqaan': 0 },
  q8: { Desktop: 70, Laptop: 85, Tablet: 65, 'Mobile phone': 50 },
  q9: { Haa: 100, Maya: 20 },
  q10: { Haa: 100, Maya: 0 },
  q11: { 'Aad u fiican': 100, Fiican: 80, Dhexdhexaad: 60, Liita: 20 },
  q12: { Warqado: 10, 'Computer local ah': 45, 'External hard disk': 60, 'Cloud storage': 100 },
  q13: { 'Haa maalin kasta': 100, Toddobaadle: 80, 'Mararka qaar': 45, Maya: 0 },
  q15: { Haa: 100, Maya: 0 },
  q17: { 'Aad u badan': 100, Dhexdhexaad: 60, 'Wax yar': 30, Maya: 0 },
  q18: { Haa: 100, Maya: 0 },
  q19: { Badanaa: 10, 'Mararka qaar': 45, 'Marar dhif ah': 75, Marnaba: 100 },
  q20: { Haa: 20, Maya: 100 },
  q24: { 'Aad baan ugu kalsoonahay': 100, 'Waan ku kalsoonahay': 80, Dhexdhexaad: 60, 'Kuma kalsooni': 10 },
  q27: { Haa: 100, Maya: 0, 'Waxaa ku xiran qiimaha': 60 }
};

const roundNumber = (value) => Math.round(Number(value) || 0);

const mean = (values) => {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

const safeString = (value) => {
  if (value === null || value === undefined) return '';
  return String(value).trim();
};

const splitAnswer = (value) => {
  const text = safeString(value);
  if (!text) return [];
  return text
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const frequencyForColumn = (rows, column) => {
  const counts = new Map();

  for (const row of rows) {
    for (const answer of splitAnswer(row[column])) {
      counts.set(answer, (counts.get(answer) || 0) + 1);
    }
  }

  const total = Array.from(counts.values()).reduce((sum, value) => sum + value, 0);

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([answer, count]) => ({
      answer,
      count,
      percentage: total ? roundNumber((count / total) * 10000) / 100 : 0
    }));
};

const allFrequencyAnalysis = (rows) =>
  Object.entries(QUESTIONS).reduce((result, [code, text]) => {
    result[code] = {
      question: text,
      answers: frequencyForColumn(rows, text)
    };
    return result;
  }, {});

const importantQuestionAnalysis = (frequencies) =>
  CLOSED_ENDED_QUESTIONS.map((code) => {
    const item = frequencies[code];
    const answers = item?.answers || [];

    return {
      code,
      question: item?.question || QUESTIONS[code],
      topAnswer: answers[0]?.answer || 'No answer',
      topCount: answers[0]?.count || 0,
      topPercentage: answers[0]?.percentage || 0,
      answers
    };
  });

const scoreAnswer = (code, value) => {
  const answers = splitAnswer(value);
  if (!answers.length) return 0;
  const scoreMap = SCORES[code] || {};
  return mean(answers.map((answer) => scoreMap[answer] ?? 40));
};

const withFactorScores = (rows) =>
  rows.map((row) => {
    const factorValues = {};

    for (const [factor, codes] of Object.entries(FACTOR_QUESTIONS)) {
      const scores = codes
        .map((code) => scoreAnswer(code, row[QUESTIONS[code]]))
        .filter((value) => Number.isFinite(value));
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
      const value = Number(row.readinessScore);
      return Number.isFinite(value) ? value : row.calculatedReadiness || 0;
    })
    .filter((value) => Number.isFinite(value));

  if (!scores.length) {
    return { average: 0, median: 0, min: 0, max: 0 };
  }

  const sorted = [...scores].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];

  return {
    average: roundNumber(mean(scores)),
    median: roundNumber(median),
    min: roundNumber(sorted[0]),
    max: roundNumber(sorted[sorted.length - 1])
  };
};

const sectorComparison = (rows) => {
  const grouped = new Map();

  for (const row of rows) {
    const sector = safeString(row.sector) || 'Unknown';
    if (!grouped.has(sector)) {
      grouped.set(sector, []);
    }
    grouped.get(sector).push(row);
  }

  return Array.from(grouped.entries())
    .map(([sector, items]) => ({
      sector,
      responses: items.length,
      cloudAwareness: roundNumber(mean(items.map((item) => item.cloudAwareness || 0))),
      technologyUse: roundNumber(mean(items.map((item) => item.technologyUse || 0))),
      infrastructureReadiness: roundNumber(mean(items.map((item) => item.infrastructureReadiness || 0))),
      backupPractices: roundNumber(mean(items.map((item) => item.backupPractices || 0))),
      willingnessToAdopt: roundNumber(mean(items.map((item) => item.willingnessToAdopt || 0))),
      averageReadiness: roundNumber(mean(items.map((item) => item.calculatedReadiness || 0)))
    }))
    .sort((a, b) => b.averageReadiness - a.averageReadiness);
};

const gapAnalysis = (rows) =>
  Object.keys(FACTOR_QUESTIONS)
    .map((factor) => {
      const current = mean(rows.map((row) => row[factor] || 0));
      return {
        factor,
        current: roundNumber(current),
        ideal: 100,
        gap: roundNumber(100 - current)
      };
    })
    .sort((a, b) => b.gap - a.gap);

const factorSummary = (rows) =>
  Object.entries(FACTOR_LABELS)
    .map(([factor, label]) => ({
      factor,
      label,
      score: roundNumber(mean(rows.map((row) => row[factor] || 0)))
    }))
    .sort((a, b) => b.score - a.score);

const recommendations = (stats, gaps, frequencies) => {
  const recs = [];

  if (stats.average < 40) {
    recs.push('Kor u qaad wacyigelinta cloud computing, tababarka aasaasiga ah, iyo tijaabooyin qiimo jaban.');
  } else if (stats.average < 70) {
    recs.push('Xooji backup joogto ah, tababar shaqaale, iyo hagitaan ku saabsan isticmaalka cloud tools.');
  } else {
    recs.push('Diiradda saar amniga xogta, governance, iyo ballaarinta cloud systems-ka waaxyaha kala duwan.');
  }

  const gapNames = gaps.slice(0, 3).map((item) => item.factor);
  if (gapNames.includes('infrastructureReadiness')) {
    recs.push('Mudnaanta sii koronto joogto ah iyo internet la isku halleyn karo si adoption-ku u noqdo mid macquul ah.');
  }
  if (gapNames.includes('backupPractices')) {
    recs.push('Samee siyaasad backup ah oo cad, gaar ahaan hay’adaha weli isticmaala Warqado ama Computer local ah.');
  }
  if (gapNames.includes('securityTrust')) {
    recs.push('Bixi wacyigelin ku saabsan encryption, access control, iyo ilaalinta sirta xogta.');
  }

  const barriers = frequencies.q21?.answers || [];
  if (barriers.length) {
    recs.push(`Caqabadda ugu badan waa ${barriers[0].answer}; qorshaha hirgelintu waa inuu si gaar ah u xalliyo.`);
  }

  return recs;
};

const buildLocalAnalytics = (rawRows = []) => {
  if (!rawRows.length) {
    return {
      totalResponses: 0,
      frequencyAnalysis: {},
      percentageAnalysis: {},
      readinessStats: { average: 0, median: 0, min: 0, max: 0 },
      factorSummary: [],
      sectorComparison: [],
      readinessRanking: [],
      gapAnalysis: [],
      importantQuestionAnalysis: [],
      districtDistribution: [],
      awarenessDistribution: [],
      willingnessDistribution: [],
      commonBarriers: [],
      infrastructureChallenges: [],
      securityConcerns: [],
      charts: {},
      summaryFindings: ['No survey responses match the selected filters yet.'],
      recommendations: ['Collect more responses before drawing operational conclusions.'],
      descriptiveStatistics: {
        responsesBySector: 0,
        responsesByDistrict: 0,
        stdDeviationReadiness: 0
      }
    };
  }

  const rows = withFactorScores(rawRows);
  const frequencies = allFrequencyAnalysis(rows);
  const important = importantQuestionAnalysis(frequencies);
  const stats = readinessStats(rows);
  const sectors = sectorComparison(rows);
  const gaps = gapAnalysis(rows);
  const factors = factorSummary(rows);
  const q27Frequency = frequencies.q27?.answers || [];
  const q21Frequency = frequencies.q21?.answers || [];
  const topSector = sectors[0]?.sector || 'No sector';
  const topBarrier = q21Frequency[0]?.answer || 'No dominant barrier';
  const weakestFactor = gaps[0]?.factor || 'No factor';
  const strongestFactor = factors[0]?.label || 'No factor';
  const readinessValues = rows.map((row) => row.calculatedReadiness || 0);
  const readinessMean = mean(readinessValues);
  const variance = readinessValues.length
    ? mean(readinessValues.map((value) => (value - readinessMean) ** 2))
    : 0;

  return {
    totalResponses: rows.length,
    frequencyAnalysis: frequencies,
    percentageAnalysis: frequencies,
    readinessStats: stats,
    factorSummary: factors,
    sectorComparison: sectors,
    readinessRanking: sectors,
    gapAnalysis: gaps,
    importantQuestionAnalysis: important,
    districtDistribution: frequencyForColumn(rows, 'district'),
    awarenessDistribution: frequencies.q5?.answers || [],
    willingnessDistribution: q27Frequency,
    commonBarriers: q21Frequency,
    infrastructureChallenges: frequencies.q20?.answers || [],
    securityConcerns: frequencies.q25?.answers || [],
    charts: {},
    summaryFindings: [
      `${rows.length} responses were analyzed.`,
      `The average cloud readiness score is ${stats.average} out of 100.`,
      `The highest readiness sector is ${topSector}.`,
      `The most common cloud adoption barrier is ${topBarrier}.`,
      `The strongest readiness area is ${strongestFactor}.`,
      `The largest readiness gap is ${FACTOR_LABELS[weakestFactor] || weakestFactor}.`
    ],
    recommendations: recommendations(stats, gaps, frequencies),
    descriptiveStatistics: {
      responsesBySector: new Set(rows.map((row) => safeString(row.sector)).filter(Boolean)).size,
      responsesByDistrict: new Set(rows.map((row) => safeString(row.district)).filter(Boolean)).size,
      stdDeviationReadiness: Number(Math.sqrt(variance).toFixed(2))
    }
  };
};

module.exports = { buildLocalAnalytics };
