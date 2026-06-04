const {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  HeadingLevel,
  ImageRun,
  Packer,
  PageBreak,
  PageNumber,
  Paragraph,
  Table,
  TableCell,
  TableOfContents,
  TableRow,
  TextRun,
  WidthType
} = require('docx');
const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const SurveyResponse = require('../models/SurveyResponse');
const { buildCompatibleResponseQuery } = require('./queryService');
const { normalizeResponseSectors } = require('./responseCompatibilityService');
const { runPythonAnalytics } = require('./analyticsService');

const POSITIVE = new Set(['Haa', 'Aad u fiican', 'Fiican', 'Aad u badan', 'Badan', 'Toddobaadle', 'Maalin kasta', 'Maalinle']);
const NEGATIVE = new Set(['Maya', 'Aad u hooseeya', 'Hooseeya', 'Hoose', 'Marna', 'Marnaba', 'Badanaa', 'Had iyo jeer']);
const STOP_WORDS = new Set(['iyo', 'ama', 'waa', 'wax', 'in', 'la', 'oo', 'ka', 'ku', 'ay', 'uu', 'u', 'ah', 'ee', 'si', 'leh']);

const THEME_RULES = [
  { theme: 'Data storage, backup, and document management', keywords: ['backup', 'kayd', 'xog', 'dukumenti', 'document'] },
  { theme: 'Security and data protection', keywords: ['amn', 'sir', 'xatooyo', 'security', 'ilaalin'] },
  { theme: 'Training, awareness, and skills', keywords: ['tababar', 'wacyi', 'xirfad', 'aqoon'] },
  { theme: 'Infrastructure, internet, power, and cost', keywords: ['internet', 'koronto', 'qiime', 'kharash', 'jaban'] },
  { theme: 'Efficiency, management, and collaboration', keywords: ['hufnaan', 'fudud', 'maamul', 'shaqo', 'wada'] },
  { theme: 'Future growth of cloud computing in Somalia', keywords: ['mustaqbal', 'soomaaliya', 'kori', 'cloud'] }
];

const LABELS = {
  awareness: 'Cloud Awareness',
  technology: 'Technology Usage',
  infrastructure: 'Infrastructure Readiness',
  backup: 'Data Storage & Backup',
  cloudTools: 'Cloud Usage',
  securityTrust: 'Security Confidence',
  willingness: 'Adoption Readiness'
};

const transparentPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=',
  'base64'
);

const clean = (value, fallback = '') => {
  const text = String(value ?? '').trim();
  return text || fallback;
};

const pct = (value) => `${Number(value || 0).toFixed(Number(value || 0) % 1 === 0 ? 0 : 2)}%`;
const num = (value) => Number(value || 0).toFixed(Number(value || 0) % 1 === 0 ? 0 : 2);
const mean = (values) => {
  const finite = values.map(Number).filter((value) => Number.isFinite(value));
  return finite.length ? finite.reduce((sum, value) => sum + value, 0) / finite.length : 0;
};

const splitValues = (value) => {
  if (Array.isArray(value)) return value.map((item) => clean(item)).filter(Boolean);
  const text = clean(value);
  if (!text) return [];
  return text.split(',').map((item) => clean(item)).filter(Boolean);
};

const getAnswers = (response) => {
  if (!response.answers) return {};
  if (response.answers instanceof Map) return Object.fromEntries(response.answers.entries());
  return response.answers;
};

const answerByCode = (response, code) => {
  const detail = (response.answerDetails || []).find((item) => item.code === code);
  if (detail) return detail.value;
  return getAnswers(response)[code];
};

const questionText = (responses, code, fallback = code) => {
  for (const response of responses) {
    const detail = (response.answerDetails || []).find((item) => item.code === code);
    if (detail?.questionText) return detail.questionText;
  }
  return fallback;
};

const frequency = (values = [], totalResponses = 0) => {
  const counts = new Map();
  values.forEach((value) => {
    splitValues(value).forEach((item) => counts.set(item, (counts.get(item) || 0) + 1));
  });

  const totalSelections = Array.from(counts.values()).reduce((sum, count) => sum + count, 0);
  return Array.from(counts.entries())
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([answer, count]) => ({
      answer,
      label: answer,
      count,
      percentage: totalSelections ? Number(((count / totalSelections) * 100).toFixed(2)) : 0,
      responsePercentage: totalResponses ? Number(((count / totalResponses) * 100).toFixed(2)) : 0
    }));
};

const qualityScore = (value) =>
  ({
    'Aad u fiican': 100,
    Fiican: 80,
    Dhexdhexaad: 60,
    Hooseeya: 30,
    Hoose: 30,
    'Aad u hooseeya': 10,
    'Aad u badan': 100,
    Badan: 80,
    Yar: 35,
    Haa: 100,
    Maya: 0
  })[clean(value)] ?? 50;

const yesScore = (value) => (clean(value) === 'Haa' ? 100 : 0);
const reverseYesScore = (value) => (clean(value) === 'Haa' ? 0 : 100);
const backupScore = (value) =>
  ({
    Maalinle: 100,
    'Maalin kasta': 100,
    Toddobaadle: 80,
    Bille: 60,
    Mararka: 35,
    Marnaba: 0
  })[clean(value)] ?? qualityScore(value);
const interruptionScore = (value) =>
  ({
    Marna: 100,
    'Marar dhif ah': 75,
    Mararka: 55,
    Badanaa: 25,
    'Had iyo jeer': 10
  })[clean(value)] ?? 50;
const storageScore = (value) =>
  ({
    Warqado: 10,
    Computer: 40,
    'Computer local ah': 40,
    'External hard disk': 60,
    Cloud: 100,
    'Cloud storage': 100,
    Server: 80
  })[clean(value)] ?? 50;

const scoreIndicators = (response) => ({
  awareness: mean([yesScore(answerByCode(response, 'q5')), qualityScore(answerByCode(response, 'q6'))]),
  technology: mean([
    answerByCode(response, 'q8') ? 75 : 0,
    yesScore(answerByCode(response, 'q9')),
    yesScore(answerByCode(response, 'q22')),
    yesScore(answerByCode(response, 'q26'))
  ]),
  infrastructure: mean([
    yesScore(answerByCode(response, 'q10')),
    qualityScore(answerByCode(response, 'q11')),
    yesScore(answerByCode(response, 'q18')),
    interruptionScore(answerByCode(response, 'q19')),
    reverseYesScore(answerByCode(response, 'q20'))
  ]),
  backup: mean([storageScore(answerByCode(response, 'q12')), backupScore(answerByCode(response, 'q13')), interruptionScore(answerByCode(response, 'q14'))]),
  cloudTools: mean([yesScore(answerByCode(response, 'q15')), answerByCode(response, 'q16') ? 80 : 0, qualityScore(answerByCode(response, 'q17'))]),
  securityTrust: qualityScore(answerByCode(response, 'q24')),
  willingness: mean([yesScore(answerByCode(response, 'q27')), answerByCode(response, 'q28') ? 100 : 0])
});

const readinessBand = (score) => (score >= 70 ? 'High' : score >= 40 ? 'Moderate' : 'Low');
const urgencyBand = (score) => (score >= 70 ? 'High opportunity' : score >= 40 ? 'Moderate opportunity' : 'High risk');

const analyzeText = (values = []) => {
  const texts = values.map((value) => clean(value)).filter(Boolean);
  const words = new Map();
  const sentiments = { positive: 0, neutral: 0, negative: 0 };
  const themes = THEME_RULES.map((rule) => ({ ...rule, count: 0, examples: [] }));
  const repeatedIdeas = new Map();

  texts.forEach((text) => {
    const normalized = text.toLowerCase();
    const tokens = normalized
      .replace(/[^\p{L}\p{N}\s'-]/gu, ' ')
      .split(/\s+/)
      .map((word) => word.trim())
      .filter((word) => word.length > 2 && !STOP_WORDS.has(word));

    tokens.forEach((word) => words.set(word, (words.get(word) || 0) + 1));

    const positiveHits = splitValues(text).filter((item) => POSITIVE.has(item)).length + ['caawin', 'fudud', 'kori', 'hagaaj', 'jaban'].filter((word) => normalized.includes(word)).length;
    const negativeHits = splitValues(text).filter((item) => NEGATIVE.has(item)).length + ['caqabad', 'kharash', 'darro', 'walwal', 'xatooyo'].filter((word) => normalized.includes(word)).length;
    if (positiveHits > negativeHits) sentiments.positive += 1;
    else if (negativeHits > positiveHits) sentiments.negative += 1;
    else sentiments.neutral += 1;

    let matched = false;
    themes.forEach((theme) => {
      if (theme.keywords.some((keyword) => normalized.includes(keyword))) {
        theme.count += 1;
        matched = true;
        if (theme.examples.length < 3) theme.examples.push(text);
      }
    });
    if (!matched) {
      let other = themes.find((theme) => theme.theme === 'Other operational comments');
      if (!other) {
        other = { theme: 'Other operational comments', keywords: [], count: 0, examples: [] };
        themes.push(other);
      }
      other.count += 1;
      if (other.examples.length < 3) other.examples.push(text);
    }

    tokens.slice(0, 8).forEach((word) => repeatedIdeas.set(word, (repeatedIdeas.get(word) || 0) + 1));
  });

  const toRows = (map) =>
    Array.from(map.entries())
      .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
      .map(([label, count]) => ({ label, answer: label, count, percentage: texts.length ? Number(((count / texts.length) * 100).toFixed(2)) : 0 }));

  return {
    totalResponses: texts.length,
    themes: themes
      .filter((theme) => theme.count)
      .sort((left, right) => right.count - left.count)
      .map((theme) => ({ ...theme, percentage: texts.length ? Number(((theme.count / texts.length) * 100).toFixed(2)) : 0 })),
    keywords: toRows(words).slice(0, 25).map((item) => ({ keyword: item.label, count: item.count, percentage: item.percentage })),
    repeatedIdeas: toRows(repeatedIdeas).filter((item) => item.count > 1).slice(0, 15),
    sentiment: Object.entries(sentiments).map(([label, count]) => ({ label, answer: label, count, percentage: texts.length ? Number(((count / texts.length) * 100).toFixed(2)) : 0 })),
    sampleResponses: texts.slice(0, 8)
  };
};

const runPythonTextAnalysis = (values = []) => {
  const scriptPath = path.resolve(__dirname, '../../analytics/text_analysis.py');
  if (!fs.existsSync(scriptPath)) return null;

  const tempFile = path.join(os.tmpdir(), `cloud-survey-text-${Date.now()}-${Math.random().toString(16).slice(2)}.json`);
  const pythonPath = process.env.PYTHON_PATH || 'python';

  try {
    fs.writeFileSync(tempFile, JSON.stringify(values), 'utf8');
    const result = spawnSync(pythonPath, [scriptPath, tempFile], { encoding: 'utf8', timeout: 30000 });
    if (result.status !== 0 || !result.stdout) return null;
    return JSON.parse(result.stdout);
  } catch (error) {
    return null;
  } finally {
    fs.rmSync(tempFile, { force: true });
  }
};

const buildAcademicAnalytics = (responses, engineAnalytics = {}) => {
  const totalResponses = responses.length;
  const codes = Array.from({ length: 30 }, (_, index) => `q${index + 1}`);
  const frequencyAnalysis = {};
  const questionAnalysis = [];

  codes.forEach((code) => {
    const values = responses.map((response) => answerByCode(response, code));
    const detail = responses.flatMap((response) => response.answerDetails || []).find((item) => item.code === code);
    const answers = frequency(values, totalResponses);
    const text = questionText(responses, code, engineAnalytics.frequencyAnalysis?.[code]?.question || code);
    const textAnalysis = ['paragraph', 'short_text'].includes(detail?.type) ? analyzeText(values) : null;

    frequencyAnalysis[code] = { question: text, answers };
    questionAnalysis.push({
      code,
      question: text,
      type: detail?.type || 'unknown',
      scoringKey: detail?.scoringKey || 'none',
      totalResponses: values.filter((value) => splitValues(value).length).length,
      answers,
      textAnalysis
    });
  });

  const enriched = responses.map((response) => {
    const sector = clean(answerByCode(response, 'q1') || response.sector?.name || response.sector || 'Unknown');
    const score = Number(response.readinessScore || 0);
    return {
      response,
      sector,
      district: clean(response.district, 'Unknown'),
      score,
      band: response.readinessBand === 'Medium' ? 'Moderate' : response.readinessBand || readinessBand(score),
      indicators: scoreIndicators(response)
    };
  });

  const groupBy = (key) => {
    const groups = new Map();
    enriched.forEach((item) => {
      const label = item[key] || 'Unknown';
      if (!groups.has(label)) groups.set(label, []);
      groups.get(label).push(item);
    });

    return Array.from(groups.entries())
      .map(([label, items]) => {
        const avgReadiness = mean(items.map((item) => item.score));
        const indicators = Object.fromEntries(Object.keys(LABELS).map((factor) => [factor, Number(mean(items.map((item) => item.indicators[factor])).toFixed(2))]));
        const mostCommon = (code) => frequency(items.map((item) => answerByCode(item.response, code)), items.length)[0]?.answer || 'No dominant answer';
        const needScore = Number(mean([100 - indicators.infrastructure, 100 - indicators.backup, 100 - indicators.securityTrust, indicators.willingness, 100 - indicators.cloudTools]).toFixed(2));
        return {
          [key]: label,
          label,
          responses: items.length,
          averageReadiness: Number(avgReadiness.toFixed(2)),
          readinessBand: readinessBand(avgReadiness),
          needScore,
          needBand: urgencyBand(needScore),
          topBarrier: mostCommon('q21'),
          topSecurityConcern: mostCommon('q25'),
          topCloudNeed: mostCommon('q28'),
          ...indicators
        };
      })
      .sort((left, right) => right.averageReadiness - left.averageReadiness);
  };

  const sectorRows = groupBy('sector');
  const districtRows = groupBy('district');
  const scores = enriched.map((item) => item.score).sort((a, b) => a - b);
  const median = scores.length % 2 ? scores[Math.floor(scores.length / 2)] : mean([scores[scores.length / 2 - 1], scores[scores.length / 2]]);
  const avgScore = Number(mean(scores).toFixed(2));
  const variance = mean(scores.map((score) => (score - avgScore) ** 2));
  const distribution = ['Low', 'Moderate', 'High'].map((band) => {
    const count = enriched.filter((item) => item.band === band || (band === 'Moderate' && item.band === 'Medium')).length;
    return { band, label: band, count, percentage: totalResponses ? Number(((count / totalResponses) * 100).toFixed(2)) : 0 };
  });

  const factors = Object.entries(LABELS)
    .map(([factor, label]) => ({ factor, label, score: Number(mean(enriched.map((item) => item.indicators[factor])).toFixed(2)) }))
    .sort((left, right) => right.score - left.score);
  const gaps = factors
    .map((item) => ({ factor: item.factor, label: item.label, current: item.score, ideal: 100, gap: Number((100 - item.score).toFixed(2)) }))
    .sort((left, right) => right.gap - left.gap);

  const sectorDistribution = frequency(enriched.map((item) => item.sector), totalResponses);
  const districtDistribution = frequency(enriched.map((item) => item.district), totalResponses);
  const openEndedValues = ['q7', 'q28', 'q29', 'q30'].flatMap((code) => responses.map((response) => answerByCode(response, code)));
  const textAnalysis = runPythonTextAnalysis(openEndedValues) || analyzeText(openEndedValues);
  const cloudNeeds = frequencyAnalysis.q28?.answers || [];

  return {
    generatedAt: new Date().toISOString(),
    source: {
      responseCount: totalResponses,
      usedSnapshotAnswers: responses.some((response) => (response.answerDetails || []).length > 0),
      engineGeneratedAt: engineAnalytics.generatedAt || null
    },
    totals: {
      totalResponses,
      totalSectorsCovered: sectorDistribution.length,
      totalDistrictsCovered: districtDistribution.length,
      averageCloudReadinessScore: avgScore,
      awarenessRate: frequencyAnalysis.q5.answers.find((item) => item.answer === 'Haa')?.responsePercentage || 0,
      adoptionWillingnessRate: frequencyAnalysis.q27.answers.find((item) => item.answer === 'Haa')?.responsePercentage || 0,
      cloudToolsUsageRate: frequencyAnalysis.q15.answers.find((item) => item.answer === 'Haa')?.responsePercentage || 0,
      backupPracticeRate: frequencyAnalysis.q13.answers.filter((item) => !['Marnaba', 'Marna'].includes(item.answer)).reduce((sum, item) => sum + item.responsePercentage, 0),
      infrastructureStabilityRate: Number(mean(enriched.map((item) => item.indicators.infrastructure)).toFixed(2)),
      securityTrustRate: Number(mean(enriched.map((item) => item.indicators.securityTrust)).toFixed(2))
    },
    readinessStats: { average: avgScore, median: Number((median || 0).toFixed(2)), min: scores[0] || 0, max: scores[scores.length - 1] || 0, stdDev: Number(Math.sqrt(variance).toFixed(2)) },
    frequencyAnalysis,
    questionAnalysis,
    sectorDistribution,
    districtDistribution,
    sectorComparison: { rows: sectorRows },
    districtComparison: { rows: districtRows },
    readiness: { distribution, sectorLeaderboard: sectorRows, districtLeaderboard: districtRows },
    factorSummary: factors,
    gapAnalysis: { overall: gaps },
    barriers: { overallRanking: frequencyAnalysis.q21.answers, topFiveChallenges: frequencyAnalysis.q21.answers.slice(0, 5) },
    security: { securityConcerns: frequencyAnalysis.q25.answers, trustLevels: frequencyAnalysis.q24.answers },
    cloudNeeds,
    businessNeeds: {
      digitalNeeds: cloudNeeds,
      willingness: frequencyAnalysis.q27.answers,
      themes: textAnalysis.themes,
      keywords: textAnalysis.keywords,
      sentiment: textAnalysis.sentiment,
      repeatedIdeas: textAnalysis.repeatedIdeas,
      sampleResponses: textAnalysis.sampleResponses
    },
    needAssessment: {
      sectorUrgency: [...sectorRows].sort((left, right) => right.needScore - left.needScore),
      highestRiskSectors: sectorRows.filter((item) => item.averageReadiness < 40 || item.needScore >= 70),
      highestOpportunitySectors: sectorRows.filter((item) => item.averageReadiness >= 40 && item.needScore >= 50),
      highestReadinessSectors: sectorRows.filter((item) => item.averageReadiness >= 70)
    }
  };
};

const svgEscape = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const truncate = (value, max = 28) => {
  const text = clean(value, 'N/A');
  return text.length > max ? `${text.slice(0, max - 3)}...` : text;
};

const chartRows = (rows = [], valueKey = 'count', labelKey = null, limit = 10) =>
  rows
    .map((item) => ({
      label: item[labelKey] || item.label || item.answer || item.sector || item.district || item.theme || item.keyword || item.band || 'N/A',
      value: Number(item[valueKey] ?? item.value ?? item.count ?? item.percentage ?? item.averageReadiness ?? item.score ?? 0)
    }))
    .filter((item) => item.label && Number.isFinite(item.value))
    .sort((left, right) => right.value - left.value)
    .slice(0, limit);

const barChartSvg = (title, rows, options = {}) => {
  const data = chartRows(rows, options.valueKey, options.labelKey, options.limit || 10);
  const width = 900;
  const rowHeight = 42;
  const top = 64;
  const left = 260;
  const height = Math.max(260, top + data.length * rowHeight + 40);
  const max = Math.max(...data.map((item) => item.value), 1);

  const bars = data
    .map((item, index) => {
      const y = top + index * rowHeight;
      const barWidth = Math.max(8, (item.value / max) * 540);
      return `
        <text x="20" y="${y + 20}" font-size="18" fill="#334155">${svgEscape(truncate(item.label, 30))}</text>
        <rect x="${left}" y="${y}" width="${barWidth}" height="24" rx="5" fill="${options.color || '#0f7c90'}"/>
        <text x="${left + barWidth + 12}" y="${y + 19}" font-size="17" font-weight="700" fill="#0f172a">${svgEscape(num(item.value))}</text>`;
    })
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="100%" height="100%" fill="#ffffff"/>
    <text x="20" y="34" font-size="24" font-weight="700" fill="#0f172a">${svgEscape(title)}</text>
    ${bars}
  </svg>`;
};

const donutChartSvg = (title, rows, options = {}) => {
  const data = chartRows(rows, options.valueKey, options.labelKey, options.limit || 8);
  const width = 900;
  const height = 420;
  const colors = ['#0f7c90', '#14b8a6', '#f59e0b', '#ef4444', '#6366f1', '#84cc16', '#0ea5e9', '#64748b'];
  const total = data.reduce((sum, item) => sum + item.value, 0) || 1;
  let cumulative = 0;
  const cx = 220;
  const cy = 225;
  const r = 130;
  const segments = data
    .map((item, index) => {
      const start = (cumulative / total) * Math.PI * 2 - Math.PI / 2;
      cumulative += item.value;
      const end = (cumulative / total) * Math.PI * 2 - Math.PI / 2;
      const large = end - start > Math.PI ? 1 : 0;
      const x1 = cx + r * Math.cos(start);
      const y1 = cy + r * Math.sin(start);
      const x2 = cx + r * Math.cos(end);
      const y2 = cy + r * Math.sin(end);
      return `<path d="M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z" fill="${colors[index % colors.length]}"/>`;
    })
    .join('');
  const legend = data
    .map((item, index) => {
      const y = 110 + index * 34;
      return `<rect x="440" y="${y - 15}" width="18" height="18" rx="4" fill="${colors[index % colors.length]}"/>
        <text x="470" y="${y}" font-size="17" fill="#334155">${svgEscape(truncate(item.label, 36))}: ${svgEscape(num(item.value))} (${svgEscape(pct((item.value / total) * 100))})</text>`;
    })
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="100%" height="100%" fill="#ffffff"/>
    <text x="20" y="34" font-size="24" font-weight="700" fill="#0f172a">${svgEscape(title)}</text>
    ${segments}
    <circle cx="${cx}" cy="${cy}" r="72" fill="#ffffff"/>
    <text x="${cx}" y="${cy - 4}" text-anchor="middle" font-size="26" font-weight="700" fill="#0f172a">${svgEscape(num(total))}</text>
    <text x="${cx}" y="${cy + 24}" text-anchor="middle" font-size="15" fill="#64748b">Total</text>
    ${legend}
  </svg>`;
};

const heatmapSvg = (title, rows = []) => {
  const factors = ['awareness', 'technology', 'infrastructure', 'backup', 'cloudTools', 'securityTrust', 'willingness'];
  const data = rows.slice(0, 14);
  const width = 980;
  const cell = 84;
  const left = 250;
  const top = 92;
  const height = top + data.length * 34 + 60;
  const colorFor = (value) => {
    if (value >= 75) return '#0f766e';
    if (value >= 60) return '#14b8a6';
    if (value >= 45) return '#f59e0b';
    return '#ef4444';
  };
  const header = factors.map((factor, index) => `<text x="${left + index * cell + 4}" y="74" font-size="12" fill="#334155">${svgEscape(truncate(LABELS[factor], 10))}</text>`).join('');
  const body = data
    .map((row, rowIndex) => {
      const y = top + rowIndex * 34;
      const label = row.sector || row.label;
      const cells = factors
        .map((factor, index) => {
          const value = Number(row[factor] || 0);
          return `<rect x="${left + index * cell}" y="${y - 18}" width="${cell - 5}" height="27" rx="4" fill="${colorFor(value)}"/>
            <text x="${left + index * cell + (cell - 5) / 2}" y="${y}" text-anchor="middle" font-size="12" font-weight="700" fill="#ffffff">${num(value)}</text>`;
        })
        .join('');
      return `<text x="20" y="${y}" font-size="15" fill="#334155">${svgEscape(truncate(label, 28))}</text>${cells}`;
    })
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="100%" height="100%" fill="#ffffff"/>
    <text x="20" y="34" font-size="24" font-weight="700" fill="#0f172a">${svgEscape(title)}</text>
    ${header}${body}
  </svg>`;
};

const chartImage = (svg, width = 620, height = 300) =>
  new ImageRun({
    type: 'svg',
    data: Buffer.from(svg, 'utf8'),
    fallback: { type: 'png', data: transparentPng },
    transformation: { width, height }
  });

const p = (text = '', options = {}) =>
  new Paragraph({
    text,
    heading: options.heading,
    alignment: options.alignment,
    spacing: { before: options.before ?? 120, after: options.after ?? 120, line: options.line ?? 300 },
    pageBreakBefore: options.pageBreakBefore,
    thematicBreak: options.thematicBreak
  });

const runs = (children, options = {}) =>
  new Paragraph({
    children,
    heading: options.heading,
    alignment: options.alignment,
    spacing: { before: options.before ?? 120, after: options.after ?? 120, line: options.line ?? 300 },
    pageBreakBefore: options.pageBreakBefore
  });

const caption = (text) =>
  runs([new TextRun({ text, italics: true, color: '475569', size: 20 })], {
    alignment: AlignmentType.CENTER,
    before: 80,
    after: 180
  });

const bullet = (text) =>
  new Paragraph({
    text,
    bullet: { level: 0 },
    spacing: { before: 40, after: 80, line: 280 }
  });

const cell = (text, options = {}) =>
  new TableCell({
    children: [
      new Paragraph({
        children: [new TextRun({ text: clean(text), bold: options.header, color: options.header ? 'ffffff' : '0f172a', size: options.header ? 20 : 18 })]
      })
    ],
    shading: options.header ? { fill: '0f7c90' } : undefined,
    margins: { top: 90, bottom: 90, left: 90, right: 90 }
  });

const table = (headers, rows) =>
  new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: headers.map((header) => cell(header, { header: true })), tableHeader: true }),
      ...(rows.length ? rows : [headers.map(() => 'No data available')]).map((row) => new TableRow({ children: row.map((value) => cell(value)) }))
    ]
  });

const figureBlock = (state, title, svg, interpretation, width = 620, height = 300) => {
  state.figure += 1;
  return [
    runs([chartImage(svg, width, height)], { alignment: AlignmentType.CENTER, before: 120, after: 40 }),
    caption(`Figure ${state.figure}. ${title}`),
    p(interpretation)
  ];
};

const tableBlock = (state, title, headers, rows) => {
  state.table += 1;
  return [caption(`Table ${state.table}. ${title}`), table(headers, rows)];
};

const top = (rows = [], index = 0) => rows[index] || {};

const introAnalysis = (analytics) => {
  const totals = analytics.totals;
  return [
    `The report is generated from ${totals.totalResponses} live survey responses across ${totals.totalSectorsCovered} sectors and ${totals.totalDistrictsCovered} districts.`,
    `The average Cloud Readiness Index is ${num(totals.averageCloudReadinessScore)} out of 100, which places the sample in the ${readinessBand(totals.averageCloudReadinessScore)} readiness category.`,
    `Current cloud usage is ${pct(totals.cloudToolsUsageRate)}, awareness is ${pct(totals.awarenessRate)}, and adoption willingness is ${pct(totals.adoptionWillingnessRate)}.`
  ];
};

const questionInterpretation = (question) => {
  const dominant = top(question.answers);
  const second = top(question.answers, 1);
  const base = `The most frequent answer is "${dominant.answer || 'No answer'}" with ${dominant.count || 0} responses (${pct(dominant.responsePercentage)} of respondents).`;
  const comparison = second.answer ? ` The second most frequent answer is "${second.answer}" with ${pct(second.responsePercentage)} of respondents.` : '';
  return `${base}${comparison} This result indicates the observed baseline for this question and should be interpreted alongside sector readiness, infrastructure conditions, and cloud adoption intentions.`;
};

const recommendationForSector = (sector) => {
  const weaknesses = [
    ['awareness', sector.awareness],
    ['technology', sector.technology],
    ['infrastructure', sector.infrastructure],
    ['backup', sector.backup],
    ['cloud usage', sector.cloudTools],
    ['security confidence', sector.securityTrust],
    ['willingness', sector.willingness]
  ]
    .sort((left, right) => left[1] - right[1])
    .slice(0, 2)
    .map(([label]) => label)
    .join(' and ');
  return `${sector.sector} should prioritize ${weaknesses}. Its leading barrier is ${sector.topBarrier}, and its leading security concern is ${sector.topSecurityConcern}.`;
};

const buildDocChildren = (analytics) => {
  const state = { figure: 0, table: 0 };
  const children = [];
  const totals = analytics.totals;
  const sectorRows = analytics.sectorComparison.rows;
  const districtRows = analytics.districtComparison.rows;
  const factorRows = analytics.factorSummary;
  const gapRows = analytics.gapAnalysis.overall;
  const barrierRows = analytics.barriers.overallRanking;
  const securityRows = analytics.security.securityConcerns;
  const cloudNeeds = analytics.cloudNeeds;

  children.push(
    p('Cloud Computing Readiness, Challenges, and Adoption Across Business Sectors in Somalia', {
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      before: 240,
      after: 400
    }),
    p('Automatically Generated Academic Research Report', { alignment: AlignmentType.CENTER }),
    p(`Generated: ${new Date(analytics.generatedAt).toLocaleString('en-GB')}`, { alignment: AlignmentType.CENTER }),
    p(`Evidence base: ${totals.totalResponses} responses, ${totals.totalSectorsCovered} sectors, ${totals.totalDistrictsCovered} districts`, {
      alignment: AlignmentType.CENTER
    }),
    p('Data source: MongoDB live survey responses, analytics results, readiness scores, sector comparison, and open-ended answer analysis.', {
      alignment: AlignmentType.CENTER
    }),
    new Paragraph({ children: [new PageBreak()] }),
    p('Executive Summary', { heading: HeadingLevel.HEADING_1 })
  );

  introAnalysis(analytics).forEach((item) => children.push(p(item)));
  children.push(
    ...tableBlock(state, 'Executive KPI Summary', ['Metric', 'Value'], [
      ['Total responses', totals.totalResponses],
      ['Sectors covered', totals.totalSectorsCovered],
      ['Districts covered', totals.totalDistrictsCovered],
      ['Average CRI', num(totals.averageCloudReadinessScore)],
      ['Awareness rate', pct(totals.awarenessRate)],
      ['Cloud usage rate', pct(totals.cloudToolsUsageRate)],
      ['Adoption willingness', pct(totals.adoptionWillingnessRate)],
      ['Security confidence', pct(totals.securityTrustRate)]
    ]),
    new Paragraph({ children: [new PageBreak()] }),
    p('Table of Contents', { heading: HeadingLevel.HEADING_1 }),
    new TableOfContents('Summary', { hyperlink: true, headingStyleRange: '1-3' }),
    new Paragraph({ children: [new PageBreak()] })
  );

  children.push(p('Chapter 1: Introduction', { heading: HeadingLevel.HEADING_1 }));
  [
    'Cloud computing provides internet-based access to storage, software, collaboration tools, backup services, analytics, and business applications. It allows organizations to use modern digital capabilities without maintaining every server or application locally.',
    'For Somali organizations, cloud computing is connected to business continuity, safer data storage, remote access, better collaboration, and more efficient management. However, adoption depends on awareness, infrastructure, cost, skills, and trust.',
    `This system-generated report uses live survey data only. The analyzed sample contains ${totals.totalResponses} responses and no statistics are invented or manually assumed.`
  ].forEach((item) => children.push(p(item)));

  children.push(p('Chapter 2: Research Objectives', { heading: HeadingLevel.HEADING_1 }));
  [
    'Assess cloud awareness and understanding across surveyed organizations.',
    'Measure technology usage, cloud usage, data storage, and backup practices.',
    'Evaluate infrastructure, security concerns, and adoption barriers.',
    'Compare readiness across sectors and districts.',
    'Generate a Cloud Readiness Index and Cloud Service Need Assessment.',
    'Provide organization-level, sector-level, and national-level recommendations based on actual findings.'
  ].forEach((item) => children.push(bullet(item)));

  children.push(p('Chapter 3: Literature Review', { heading: HeadingLevel.HEADING_1 }));
  [
    'Cloud computing literature commonly identifies usefulness, ease of use, security, cost, infrastructure readiness, staff capability, and management support as major determinants of adoption.',
    'Service models include Infrastructure as a Service, Platform as a Service, and Software as a Service. For the surveyed organizations, SaaS tools such as storage, backup, accounting, communication, and document management are the most immediate adoption path.',
    'In developing business environments, cloud adoption can reduce local infrastructure burdens but depends heavily on internet reliability, electricity stability, skills, and cybersecurity confidence.'
  ].forEach((item) => children.push(p(item)));

  children.push(p('Chapter 4: Methodology', { heading: HeadingLevel.HEADING_1 }));
  [
    'The report uses a descriptive quantitative design supported by qualitative open-ended analysis.',
    'Frequencies, percentages, sector rankings, district rankings, readiness bands, and derived factor indicators are generated automatically from MongoDB survey responses.',
    'Open-ended responses are analyzed using keyword frequency, theme extraction, sentiment classification, topic clustering, and repeated idea detection.',
    'The Cloud Readiness Index uses readiness scores stored with survey responses and classifies scores as High, Moderate, or Low.'
  ].forEach((item) => children.push(p(item)));

  children.push(
    ...tableBlock(state, 'Methodology Dataset Summary', ['Item', 'Value'], [
      ['Responses analyzed', totals.totalResponses],
      ['Sectors analyzed', totals.totalSectorsCovered],
      ['Districts analyzed', totals.totalDistrictsCovered],
      ['Readiness minimum', analytics.readinessStats.min],
      ['Readiness median', analytics.readinessStats.median],
      ['Readiness maximum', analytics.readinessStats.max],
      ['Readiness standard deviation', analytics.readinessStats.stdDev]
    ])
  );

  children.push(p('Chapter 5: Respondent Profile Analysis', { heading: HeadingLevel.HEADING_1 }));
  children.push(
    ...figureBlock(
      state,
      'Sector distribution of respondents',
      donutChartSvg('Sector Distribution', analytics.sectorDistribution, { valueKey: 'count' }),
      `The sector profile shows that ${top(analytics.sectorDistribution).answer} is the most represented category. Sector mix affects the overall report because sectors with more responses have greater influence on aggregate findings.`
    ),
    ...tableBlock(
      state,
      'Sector Distribution',
      ['Sector', 'Responses', 'Respondent Share'],
      analytics.sectorDistribution.map((item) => [item.answer, item.count, pct(item.responsePercentage)])
    ),
    ...figureBlock(
      state,
      'District distribution of respondents',
      barChartSvg('District Distribution', analytics.districtDistribution),
      `The most represented district is ${top(analytics.districtDistribution).answer}. District distribution matters because infrastructure quality and adoption barriers may differ by location.`
    )
  );

  const chapterGroups = [
    ['Chapter 6: Cloud Awareness Analysis', ['q5', 'q6', 'q7'], 'Cloud awareness is the foundation of adoption because organizations must understand cloud concepts before moving operational data and systems online.'],
    ['Chapter 7: Technology Usage Analysis', ['q8', 'q9', 'q22', 'q26'], 'Technology usage indicates whether organizations already have devices, software, skills, and demand for modern digital systems.'],
    ['Chapter 8: Data Storage & Backup Analysis', ['q12', 'q13', 'q14'], 'Storage and backup practices indicate data-loss exposure and business-continuity readiness.'],
    ['Chapter 9: Cloud Usage Analysis', ['q15', 'q16', 'q17'], 'Cloud usage analysis measures current adoption and perceived usefulness of cloud services.'],
    ['Chapter 10: Infrastructure Analysis', ['q10', 'q11', 'q18', 'q19', 'q20'], 'Infrastructure analysis examines internet and power conditions that influence cloud reliability.'],
    ['Chapter 11: Challenges & Security Analysis', ['q21', 'q23', 'q24', 'q25'], 'Challenges and security concerns explain why organizations may delay or avoid cloud adoption.'],
    ['Chapter 12: Business Needs Analysis', ['q26', 'q27', 'q28'], 'Business needs analysis identifies demand, willingness, and cloud-service priorities.']
  ];

  chapterGroups.forEach(([title, codes, intro]) => {
    children.push(p(title, { heading: HeadingLevel.HEADING_1 }), p(intro));
    codes.forEach((code) => {
      const q = analytics.questionAnalysis.find((item) => item.code === code);
      if (!q) return;
      children.push(p(`${code.toUpperCase()}: ${q.question}`, { heading: HeadingLevel.HEADING_2 }));
      children.push(
        ...figureBlock(
          state,
          `${code.toUpperCase()} response distribution`,
          q.type === 'paragraph' || q.type === 'short_text'
            ? barChartSvg(`${code.toUpperCase()} Top Keywords`, q.textAnalysis?.keywords || [], { labelKey: 'keyword', valueKey: 'count' })
            : barChartSvg(`${code.toUpperCase()} Response Distribution`, q.answers),
          questionInterpretation(q)
        ),
        ...tableBlock(
          state,
          `${code.toUpperCase()} Frequency and Percentage Table`,
          ['Response', 'Frequency', 'Selection %', 'Respondent %'],
          q.answers.map((item) => [item.answer, item.count, pct(item.percentage), pct(item.responsePercentage)])
        )
      );
    });
  });

  children.push(p('Chapter 13: Question-by-Question Analysis', { heading: HeadingLevel.HEADING_1 }));
  analytics.questionAnalysis.forEach((q) => {
    children.push(p(`${q.code.toUpperCase()}: ${q.question}`, { heading: HeadingLevel.HEADING_2 }));
    children.push(
      ...figureBlock(
        state,
        `${q.code.toUpperCase()} main chart`,
        q.type === 'paragraph' || q.type === 'short_text'
          ? barChartSvg(`${q.code.toUpperCase()} Keyword Chart`, q.textAnalysis?.keywords || [], { labelKey: 'keyword', valueKey: 'count', limit: 8 })
          : barChartSvg(`${q.code.toUpperCase()} Frequency Chart`, q.answers, { limit: 8 }),
        questionInterpretation(q),
        600,
        260
      ),
      ...tableBlock(
        state,
        `${q.code.toUpperCase()} Full Frequency Table`,
        ['Response', 'Frequency', 'Selection %', 'Respondent %'],
        q.answers.map((item) => [item.answer, item.count, pct(item.percentage), pct(item.responsePercentage)])
      ),
      p(`Insight summary: ${questionInterpretation(q)}`)
    );
  });

  children.push(p('Chapter 14: Cross-Sector Comparative Analysis', { heading: HeadingLevel.HEADING_1 }));
  children.push(
    ...figureBlock(
      state,
      'Sector vs Readiness',
      barChartSvg('Sector Readiness Ranking', sectorRows, { labelKey: 'sector', valueKey: 'averageReadiness', color: '#14b8a6', limit: 14 }),
      `${top(sectorRows).sector} has the highest readiness score. ${sectorRows[sectorRows.length - 1]?.sector} has the lowest readiness score.`
    ),
    ...figureBlock(
      state,
      'Sector factor heatmap',
      heatmapSvg('Sector Factor Heatmap', sectorRows),
      'The heatmap compares awareness, technology, infrastructure, backup, cloud usage, security, and willingness across sectors. Stronger colors show stronger readiness factors.'
    ),
    ...tableBlock(
      state,
      'Cross-Sector Readiness Comparison',
      ['Sector', 'Responses', 'CRI', 'Awareness', 'Cloud Usage', 'Infrastructure', 'Security', 'Backup', 'Willingness'],
      sectorRows.map((item) => [
        item.sector,
        item.responses,
        pct(item.averageReadiness),
        pct(item.awareness),
        pct(item.cloudTools),
        pct(item.infrastructure),
        pct(item.securityTrust),
        pct(item.backup),
        pct(item.willingness)
      ])
    )
  );
  sectorRows.forEach((sector) => {
    children.push(
      p(`${sector.sector}`, { heading: HeadingLevel.HEADING_2 }),
      p(
        `${sector.sector} has a Cloud Readiness Index of ${pct(sector.averageReadiness)} and is classified as ${sector.readinessBand}. Awareness is ${pct(sector.awareness)}, technology level is ${pct(sector.technology)}, infrastructure is ${pct(sector.infrastructure)}, security confidence is ${pct(sector.securityTrust)}, and adoption willingness is ${pct(sector.willingness)}. ${recommendationForSector(sector)}`
      )
    );
  });

  children.push(p('Chapter 15: Cloud Readiness Assessment', { heading: HeadingLevel.HEADING_1 }));
  children.push(
    ...figureBlock(
      state,
      'Cloud Readiness Index distribution',
      donutChartSvg('Cloud Readiness Bands', analytics.readiness.distribution),
      `The average CRI is ${pct(totals.averageCloudReadinessScore)}. The distribution shows the share of organizations classified as High, Moderate, and Low readiness.`
    ),
    ...tableBlock(
      state,
      'Readiness Factor Breakdown',
      ['Factor', 'Score', 'Gap to Ideal'],
      factorRows.map((item) => [item.label, pct(item.score), pct(100 - item.score)])
    ),
    ...tableBlock(
      state,
      'Readiness Gap Analysis',
      ['Factor', 'Current', 'Ideal', 'Gap'],
      gapRows.map((item) => [item.label, pct(item.current), pct(item.ideal), pct(item.gap)])
    )
  );

  children.push(p('Chapter 16: Cloud Service Need Assessment', { heading: HeadingLevel.HEADING_1 }));
  children.push(
    ...figureBlock(
      state,
      'Cloud service needs',
      barChartSvg('Cloud Service Need Assessment', cloudNeeds, { color: '#6366f1' }),
      `The highest-ranked cloud service need is ${top(cloudNeeds).answer}. Need assessment helps identify which services should be prioritized first.`
    ),
    ...tableBlock(
      state,
      'Sector Urgency Ranking',
      ['Sector', 'Need Score', 'Need Band', 'Top Cloud Need', 'Top Barrier'],
      analytics.needAssessment.sectorUrgency.map((item) => [item.sector, pct(item.needScore), item.needBand, item.topCloudNeed, item.topBarrier])
    )
  );

  children.push(p('Chapter 17: Open-Ended Response Analysis', { heading: HeadingLevel.HEADING_1 }));
  children.push(
    ...figureBlock(
      state,
      'Theme extraction from open-ended responses',
      barChartSvg('Open-Ended Themes', analytics.businessNeeds.themes, { labelKey: 'theme', valueKey: 'count' }),
      `The dominant theme is ${top(analytics.businessNeeds.themes).theme}. This indicates the most repeated idea in written responses.`
    ),
    ...figureBlock(
      state,
      'Keyword frequency',
      barChartSvg('Keyword Frequency', analytics.businessNeeds.keywords, { labelKey: 'keyword', valueKey: 'count', color: '#f59e0b' }),
      `The most repeated keyword is ${top(analytics.businessNeeds.keywords).keyword}. Keyword frequency helps reveal repeated operational concerns.`
    ),
    ...figureBlock(
      state,
      'Sentiment distribution',
      donutChartSvg('Open-Ended Sentiment', analytics.businessNeeds.sentiment),
      'Sentiment analysis classifies written responses as positive, neutral, or negative based on repeated positive and risk-oriented terms.'
    ),
    ...tableBlock(
      state,
      'Repeated Ideas',
      ['Idea / Keyword', 'Frequency', 'Response Share'],
      analytics.businessNeeds.repeatedIdeas.map((item) => [item.answer, item.count, pct(item.percentage)])
    )
  );

  children.push(p('Chapter 18: Key Findings', { heading: HeadingLevel.HEADING_1 }));
  [
    `The survey includes ${totals.totalResponses} responses across ${totals.totalSectorsCovered} sectors and ${totals.totalDistrictsCovered} districts.`,
    `The average Cloud Readiness Index is ${pct(totals.averageCloudReadinessScore)}, indicating ${readinessBand(totals.averageCloudReadinessScore)} readiness.`,
    `Cloud awareness is ${pct(totals.awarenessRate)} and current cloud usage is ${pct(totals.cloudToolsUsageRate)}.`,
    `Adoption willingness is ${pct(totals.adoptionWillingnessRate)}.`,
    `The top barrier is ${top(barrierRows).answer}.`,
    `The top security concern is ${top(securityRows).answer}.`,
    `The strongest readiness factor is ${top(factorRows).label}.`,
    `The largest readiness gap is ${top(gapRows).label}.`,
    `The highest-readiness sector is ${top(sectorRows).sector}.`,
    `The highest cloud-service need is ${top(cloudNeeds).answer}.`
  ].forEach((item) => children.push(bullet(item)));

  children.push(p('Chapter 19: Recommendations', { heading: HeadingLevel.HEADING_1 }));
  children.push(p('Organization-Level Recommendations', { heading: HeadingLevel.HEADING_2 }));
  [
    'Begin with low-risk cloud services such as online backup, cloud storage, and secure document sharing.',
    'Create written backup schedules and assign responsibility for checking backup completion.',
    'Train employees on passwords, account recovery, access control, and safe file sharing.',
    'Use phased migration so critical systems move only after staff and infrastructure are ready.'
  ].forEach((item) => children.push(bullet(item)));
  children.push(p('Sector-Level Recommendations', { heading: HeadingLevel.HEADING_2 }));
  sectorRows.slice(0, 14).forEach((sector) => children.push(bullet(recommendationForSector(sector))));
  children.push(p('National-Level Recommendations', { heading: HeadingLevel.HEADING_2 }));
  [
    'Improve internet reliability and affordability to support business cloud adoption.',
    'Support cloud-awareness and cybersecurity training in Somali and English.',
    'Encourage local cloud support providers to offer migration, onboarding, and helpdesk services.',
    'Build partnerships among universities, telecom providers, business associations, and technology companies.'
  ].forEach((item) => children.push(bullet(item)));

  children.push(p('Chapter 20: Conclusion', { heading: HeadingLevel.HEADING_1 }));
  [
    `This academic report was generated automatically from live database responses and analytics. It analyzed ${totals.totalResponses} responses from ${totals.totalSectorsCovered} sectors and found an overall CRI of ${pct(totals.averageCloudReadinessScore)}.`,
    'The results show that cloud adoption in Somalia is possible but uneven. Readiness is shaped by awareness, technology maturity, infrastructure reliability, backup practices, security trust, and willingness to adopt.',
    'The strongest path forward is phased adoption supported by training, affordable cloud services, secure backup practices, infrastructure improvement, and sector-specific implementation planning.'
  ].forEach((item) => children.push(p(item)));

  children.push(p('Appendices', { heading: HeadingLevel.HEADING_1 }));
  children.push(p('Appendix A: Complete District Comparison', { heading: HeadingLevel.HEADING_2 }));
  children.push(
    ...tableBlock(
      state,
      'District Readiness Comparison',
      ['District', 'Responses', 'CRI', 'Awareness', 'Cloud Usage', 'Infrastructure', 'Security'],
      districtRows.map((item) => [item.district, item.responses, pct(item.averageReadiness), pct(item.awareness), pct(item.cloudTools), pct(item.infrastructure), pct(item.securityTrust)])
    )
  );
  children.push(p('Appendix B: Data Integrity Statement', { heading: HeadingLevel.HEADING_2 }));
  children.push(
    p(
      'This document is generated from MongoDB survey responses and analytics at request time. The generator does not use placeholder statistics or manually invented percentages. If filters are applied, all frequencies, charts, and interpretations reflect the filtered dataset.'
    )
  );

  return children;
};

const buildAcademicResearchReportDocx = async (filters = {}) => {
  const query = await buildCompatibleResponseQuery(filters);
  const responses = await normalizeResponseSectors(
    await SurveyResponse.find(query).populate('sector').sort({ submittedAt: 1, createdAt: 1 }).lean()
  );
  const engineAnalytics = await runPythonAnalytics(filters).catch(() => ({}));
  const analytics = buildAcademicAnalytics(responses, engineAnalytics);

  if (!responses.length) {
    const error = new Error('No survey responses match the selected filters. A research report cannot be generated without live survey data.');
    error.statusCode = 404;
    throw error;
  }

  const doc = new Document({
    creator: 'Cloud Computing Survey Analytics System',
    title: 'Cloud Computing Readiness, Challenges, and Adoption Across Business Sectors in Somalia',
    description: 'Automatically generated academic research report from live survey data.',
    styles: {
      paragraphStyles: [
        { id: 'Normal', name: 'Normal', run: { font: 'Times New Roman', size: 24 }, paragraph: { spacing: { line: 360, after: 160 } } },
        { id: 'Title', name: 'Title', basedOn: 'Normal', run: { font: 'Times New Roman', size: 36, bold: true, color: '0f172a' } },
        { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 30, bold: true, color: '0f7c90' }, paragraph: { spacing: { before: 360, after: 180 }, outlineLevel: 0 } },
        { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 26, bold: true, color: '0f172a' }, paragraph: { spacing: { before: 260, after: 120 }, outlineLevel: 1 } },
        { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 24, bold: true, color: '334155' }, paragraph: { spacing: { before: 180, after: 100 }, outlineLevel: 2 } }
      ]
    },
    sections: [
      {
        properties: {
          page: { margin: { top: 1440, right: 1080, bottom: 1080, left: 1080 } }
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun('Page '), new TextRun({ children: [PageNumber.CURRENT] })]
              })
            ]
          })
        },
        children: buildDocChildren(analytics)
      }
    ]
  });

  return {
    buffer: await Packer.toBuffer(doc),
    analytics,
    filename: `cloud-computing-research-report-${Date.now()}.docx`
  };
};

module.exports = { buildAcademicResearchReportDocx, buildAcademicAnalytics };
