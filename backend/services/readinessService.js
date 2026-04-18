const SCORE_KEYS = ['awareness', 'technology', 'infrastructure', 'backup', 'cloudTools', 'securityTrust', 'willingness'];

const VALUE_SCORES = {
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

const FALLBACK_SCORES = {
  Haa: 100,
  Maya: 0,
  'Aad u fiican': 100,
  Fiican: 80,
  Dhexdhexaad: 60
};

const scoreText = (code, value) => {
  if (Array.isArray(value)) {
    if (!value.length) return 0;
    return Math.round(value.reduce((sum, item) => sum + scoreText(code, item), 0) / value.length);
  }

  const text = String(value ?? '').trim();
  if (!text) return 0;
  if (VALUE_SCORES[code] && Object.prototype.hasOwnProperty.call(VALUE_SCORES[code], text)) {
    return VALUE_SCORES[code][text];
  }
  if (Object.prototype.hasOwnProperty.call(FALLBACK_SCORES, text)) {
    return FALLBACK_SCORES[text];
  }
  return 40;
};

const scoreResponse = (answerDetails = []) => {
  const scoresByFactor = {};

  for (const answer of answerDetails) {
    if (!SCORE_KEYS.includes(answer.scoringKey)) continue;
    scoresByFactor[answer.scoringKey] = scoresByFactor[answer.scoringKey] || [];
    scoresByFactor[answer.scoringKey].push(scoreText(answer.code, answer.value));
  }

  const factorScores = SCORE_KEYS.map((key) => {
    const values = scoresByFactor[key] || [];
    if (!values.length) return 0;
    return values.reduce((sum, item) => sum + item, 0) / values.length;
  });

  // Transparent model: each readiness factor carries equal weight.
  // Score = average of seven factors: awareness, technology usage, backup
  // practice, cloud tools use, infrastructure, security trust, and willingness.
  const readinessScore = Math.round(factorScores.reduce((sum, item) => sum + item, 0) / SCORE_KEYS.length);
  const readinessBand = readinessScore >= 70 ? 'High' : readinessScore >= 40 ? 'Medium' : 'Low';

  return { readinessScore, readinessBand, factorScores: Object.fromEntries(SCORE_KEYS.map((key, index) => [key, Math.round(factorScores[index])])) };
};

const extractAnswerByCode = (answers = {}, code) => {
  const value = answers instanceof Map ? answers.get(code) : answers[code];
  if (Array.isArray(value)) return value.join(', ');
  return String(value ?? 'Unknown');
};

module.exports = { scoreResponse, extractAnswerByCode, SCORE_KEYS, VALUE_SCORES };
