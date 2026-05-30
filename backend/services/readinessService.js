const SCORE_KEYS = ['awareness', 'technology', 'infrastructure', 'backup', 'cloudTools', 'securityTrust', 'willingness'];

const VALUE_SCORES = {
  q6: { Haa: 100, Maya: 0 },
  q7: { 'Aad u sarreeya': 100, Sarreeya: 80, Dhexdhexaad: 60, Hooseeya: 30, 'Aad u hooseeya': 10 },
  q8: { Desktop: 75, Laptop: 85, Tablet: 65, 'Mobile phone': 55, Printer: 55, 'POS system': 85 },
  q9: { Haa: 100, Maya: 20 },
  q10: {
    'Accounting software': 90,
    'Inventory system': 90,
    'POS system': 85,
    'HR system': 85,
    'CRM system': 85,
    'Email system': 80,
    'WhatsApp Business': 65,
    'Ma isticmaalno': 0
  },
  q11: { 'Aad u sarreeya': 100, Sarreeya: 80, Dhexdhexaad: 60, Hooseeya: 30, 'Aad u hooseeya': 10 },
  q12: {
    Xisaabaadka: 30,
    'Kaydinta xogta': 25,
    Macaamiisha: 35,
    Iibka: 40,
    Inventory: 35,
    'HR / shaqaalaha': 40,
    Warbixinada: 30,
    Waxba: 100
  },
  q13: {
    Warqado: 10,
    'Computer local ah': 40,
    'External hard disk': 60,
    'Mobile phone': 30,
    'Cloud storage': 100,
    'Server gudaha xarunta': 80
  },
  q14: { 'Maalin kasta': 100, Toddobaadle: 80, Bille: 60, 'Mararka qaar': 35, Marnaba: 0 },
  q15: { Haa: 30, Maya: 100 },
  q16: {
    'Koronto la’aan': 35,
    'Qalab xumaaday': 30,
    'Virus / malware': 20,
    'Qalad shaqaale': 45,
    'Backup la’aan': 10,
    'Ma jirto xog lumis': 100
  },
  q17: { 'Aad baan ugu kalsoonahay': 100, 'Waan ku kalsoonahay': 80, Dhexdhexaad: 60, 'Kalsooni yar': 30, 'Kuma kalsooni': 10 },
  q18: { Haa: 100, Maya: 0 },
  q19: {
    'Google Drive': 85,
    Dropbox: 80,
    OneDrive: 80,
    'Google Workspace': 95,
    'Microsoft 365': 95,
    Zoom: 75,
    'WhatsApp Business': 65,
    'Online accounting system': 90,
    'Ma isticmaalno': 0
  },
  q20: { 'Aad muhiim u ah': 100, Muhiim: 80, Dhexdhexaad: 60, 'Muhiim ma aha': 10 },
  q21: { 'Maalin kasta': 100, 'Marar badan': 80, 'Mararka qaar': 55, 'Marar dhif ah': 25, Marnaba: 0 },
  q22: { 'Aad u sarreeya': 100, Sarreeya: 80, Dhexdhexaad: 60, Hooseeya: 30, 'Aad u hooseeya': 10 },
  q23: { 'Aad u sarreeya': 100, Sarreeya: 80, Dhexdhexaad: 60, Hooseeya: 30, 'Aad u hooseeya': 10 },
  q24: { Haa: 100, Maya: 20 },
  q26: {
    'Aad baan uga welwelsanahay': 10,
    'Waan ka welwelsanahay': 30,
    Dhexdhexaad: 60,
    'Wax yar': 80,
    'Ma welwelsani': 100
  },
  q27: {
    'Xatooyo xog': 25,
    Hackers: 25,
    'Sirta oo baxda': 25,
    'Qiimaha adeegga': 55,
    'Internet la’aan': 45,
    'Access control la’aan': 30
  },
  q28: {
    'Cloud storage': 85,
    'Online backup': 90,
    'Email hosting': 75,
    'Accounting system': 85,
    'Inventory system': 85,
    'Customer management': 85,
    'Video meetings': 70,
    'Data analytics': 95
  },
  q29: { Haa: 100, Maya: 0 }
};

const FALLBACK_SCORES = {
  Haa: 100,
  Maya: 0,
  'Aad u sarreeya': 100,
  Sarreeya: 80,
  Dhexdhexaad: 60,
  Hooseeya: 30,
  'Aad u hooseeya': 10,
  Muhiim: 80
};

const normalizeScoreLookup = (value) =>
  String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/café/g, 'cafe')
    .replace(/\s+/g, ' ');

const VALUE_ALIASES = {
  q2: {
    'hotel / hospitality': 'Hotels / Hospitality Services',
    university: 'Universities',
    'restaurant / cafe': 'Tech-based Restaurants / Cafes'
  },
  q5: {
    '11-20': '11-25',
    '11–20': '11-25',
    '11 - 20': '11-25',
    '21-50': '26-50',
    '21–50': '26-50',
    '21 - 50': '26-50',
    'in ka badan 50': '51+'
  },
  q6: {
    'haa, waan maqlay': 'Haa',
    'maya, maanan maqlin': 'Maya',
    'maya, maanan maqal wali': 'Maya',
    'maya maanan maqal wali': 'Maya'
  },
  q7: {
    'aad ayuu u sarreeya': 'Aad u sarreeya',
    'aad ayuu sarreeya': 'Aad u sarreeya',
    'wuu sareeyaa': 'Sarreeya',
    sareeyaa: 'Sarreeya',
    hoose: 'Hooseeya',
    'fikir kama heysto': 'Aad u hooseeya',
    'fikir kama haysto': 'Aad u hooseeya'
  },
  q11: {
    'aad ayuu u sarreeya': 'Aad u sarreeya',
    'aad ayuu sarreeya': 'Aad u sarreeya',
    'wuu sareeyaa': 'Sarreeya',
    sareeyaa: 'Sarreeya',
    hoose: 'Hooseeya',
    'fikir kama heysto': 'Aad u hooseeya',
    'fikir kama haysto': 'Aad u hooseeya'
  },
  q13: {
    'local computers': 'Computer local ah',
    'computer local': 'Computer local ah',
    'external hard drive': 'External hard disk',
    'usb / flash drive': 'External hard disk',
    'usb/ flash.': 'External hard disk',
    buugaag: 'Warqado',
    'ku keydinta cloud-ka': 'Cloud storage'
  },
  q14: {
    maalinle: 'Maalin kasta',
    'marar dhif ah': 'Mararka qaar',
    'waligeed ma sameyn backup': 'Marnaba',
    'shirkada service ka nasiiso ayaa backup ka qaado': 'Toddobaadle'
  },
  q15: {
    'haa, way la kulantay': 'Haa',
    'maya, lama kulmin wali': 'Maya',
    'maya lama kulmin': 'Maya'
  },
  q16: {
    'khalad bini’aadan': 'Qalad shaqaale',
    "khalad bini'aadam": 'Qalad shaqaale',
    'harware failure': 'Qalab xumaaday',
    'hardware failure': 'Qalab xumaaday',
    'fayras / malware': 'Virus / malware',
    'fayras /malware': 'Virus / malware',
    'waligeed lama kulmin lumis xog': 'Ma jirto xog lumis'
  },
  q17: {
    'aad ayaan ugu kalsoonahay': 'Aad baan ugu kalsoonahay',
    'kuma kalsoonin': 'Kuma kalsooni'
  },
  q18: {
    'haa, waa isticmaashaa': 'Haa',
    'maya, ma isticmaasho': 'Maya'
  },
  q21: {
    badanaa: 'Marar badan',
    'inta badan waan isticmaalnaa': 'Marar badan',
    'in badan ayay isticmaashaa': 'Marar badan',
    'waligeed ma isticmaalin': 'Marnaba'
  },
  q22: {
    'isku halayn sare': 'Sarreeya',
    fiican: 'Sarreeya'
  },
  q23: {
    'aad u deggan': 'Aad u sarreeya',
    'aad u degan': 'Aad u sarreeya',
    deggan: 'Sarreeya',
    degan: 'Sarreeya',
    'aan degganayn': 'Hooseeya'
  },
  q24: {
    'haa, waa leedahay': 'Haa',
    'maya, malahan': 'Maya',
    haa: 'Haa',
    maya: 'Maya'
  },
  q26: {
    'aad ayaan uga welwelsanahay': 'Aad baan uga welwelsanahay',
    'wan ka welwelsanahay': 'Waan ka welwelsanahay',
    'waan ka welwelsanahay': 'Waan ka welwelsanahay',
    'welwel ma qabo': 'Ma welwelsani'
  },
  q29: {
    'haa, waan qabaa fikir kaas': 'Haa',
    'maya, ma qabo fikir kaas': 'Maya'
  }
};

const resolveScoreAlias = (code, value) => {
  const text = String(value ?? '').trim();
  const aliases = VALUE_ALIASES[code] || {};
  return aliases[normalizeScoreLookup(text)] || text;
};

const scoreText = (code, value) => {
  if (Array.isArray(value)) {
    if (!value.length) return 0;
    return Math.round(value.reduce((sum, item) => sum + scoreText(code, item), 0) / value.length);
  }

  const text = String(value ?? '').trim();
  if (!text) return 0;
  if (text.includes(',')) {
    const values = text.split(',').map((item) => item.trim()).filter(Boolean);
    if (values.length > 1) return scoreText(code, values);
  }

  const scoreValue = resolveScoreAlias(code, text);
  if (VALUE_SCORES[code] && Object.prototype.hasOwnProperty.call(VALUE_SCORES[code], scoreValue)) {
    return VALUE_SCORES[code][scoreValue];
  }
  if (Object.prototype.hasOwnProperty.call(FALLBACK_SCORES, scoreValue)) {
    return FALLBACK_SCORES[scoreValue];
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
