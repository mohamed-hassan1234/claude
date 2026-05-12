const sectors = [
  'Hospitals / Clinics',
  'Supermarkets / Retail Shops',
  'Telecom / Mobile Money Agents',
  'Tech-based Restaurants / Cafes',
  'Schools / Educational Institutions',
  'Universities',
  'Banks / Financial Institutions',
  'Logistics & Transportation',
  'Hotels / Hospitality Services',
  'E-commerce / Online Businesses',
  'SMEs',
  'NGOs / Non-Profit Organizations',
  'Media & Communication Companies',
  'Real Estate / Property Management'
];

const option = (label) => ({ label, value: label });

const scaleOptions = ['Aad u sarreeya', 'Sarreeya', 'Dhexdhexaad', 'Hooseeya', 'Aad u hooseeya'].map(option);
const importanceOptions = ['Aad muhiim u ah', 'Muhiim', 'Dhexdhexaad', 'Muhiim ma aha'].map(option);
const frequencyOptions = ['Maalin kasta', 'Marar badan', 'Mararka qaar', 'Marar dhif ah', 'Marnaba'].map(option);
const concernOptions = ['Aad baan uga welwelsanahay', 'Waan ka welwelsanahay', 'Dhexdhexaad', 'Wax yar', 'Ma welwelsani'].map(option);

const questions = [
  {
    code: 'q1',
    section: 'SECTION 2 — Organization Profile',
    text: 'Magaca Ganacsiga / Hay’adda',
    type: 'short_text',
    required: true,
    scoringKey: 'none'
  },
  {
    code: 'q2',
    section: 'SECTION 2 — Organization Profile',
    text: 'Nooca Ganacsiga',
    type: 'single_select',
    options: sectors.map(option),
    required: true,
    scoringKey: 'none'
  },
  {
    code: 'q3',
    section: 'SECTION 2 — Organization Profile',
    text: 'Degmada / Goobta',
    type: 'short_text',
    required: true,
    scoringKey: 'none'
  },
  {
    code: 'q4',
    section: 'SECTION 2 — Organization Profile',
    text: 'Waa maxay doorkaaga xaruntan ama ganacsigan?',
    type: 'single_select',
    options: ['Mulkiile', 'Maamule', 'Shaqaale IT', 'Shaqaale Maamul', 'Shaqaale kale'].map(option),
    required: true,
    scoringKey: 'none'
  },
  {
    code: 'q5',
    section: 'SECTION 2 — Organization Profile',
    text: 'Immisa shaqaale ah ayuu xaruntaan/ganacsigani leeyahay?',
    type: 'single_select',
    options: ['1-5', '6-10', '11-25', '26-50', '51+'].map(option),
    required: true,
    scoringKey: 'none'
  },
  {
    code: 'q6',
    section: 'SECTION 2 — Organization Profile',
    text: 'Hore ma u maqashay erayga “Cloud Computing”?',
    type: 'yes_no',
    options: [option('Haa'), option('Maya')],
    required: true,
    scoringKey: 'awareness'
  },
  {
    code: 'q7',
    section: 'SECTION 3 — Current Technology Usage',
    text: 'Sidee ayaad u qiimeyn lahayd heerka wacyiga xaruntaada ee ku saabsan Cloud Computing?',
    type: 'likert',
    options: scaleOptions,
    required: true,
    scoringKey: 'awareness'
  },
  {
    code: 'q8',
    section: 'SECTION 3 — Current Technology Usage',
    text: 'Qalabkee ayay xaruntaada si maalinle ah u isticmaashaa?',
    type: 'multiple_choice',
    options: ['Desktop', 'Laptop', 'Tablet', 'Mobile phone', 'Printer', 'POS system'].map(option),
    required: true,
    scoringKey: 'technology'
  },
  {
    code: 'q9',
    section: 'SECTION 3 — Current Technology Usage',
    text: 'Hadda xaruntaada ma isticmaaleysaa softwares ama nidaamyo dijitaal ah oo hawlaha loo adeegsado?',
    type: 'yes_no',
    options: [option('Haa'), option('Maya')],
    required: true,
    scoringKey: 'technology'
  },
  {
    code: 'q10',
    section: 'SECTION 3 — Current Technology Usage',
    text: 'Nidaamyada soo socda kee ayay xaruntaada hadda isticmaalshaa?',
    type: 'multiple_choice',
    options: ['Accounting software', 'Inventory system', 'POS system', 'HR system', 'CRM system', 'Email system', 'WhatsApp Business', 'Ma isticmaalno'].map(option),
    required: true,
    scoringKey: 'technology'
  },
  {
    code: 'q11',
    section: 'SECTION 3 — Current Technology Usage',
    text: 'Sidee ayaad u qiimeyn lahayd heerka isticmaalka teknoolojiyadda ee xaruntaada?',
    type: 'likert',
    options: scaleOptions,
    required: true,
    scoringKey: 'technology'
  },
  {
    code: 'q12',
    section: 'SECTION 3 — Current Technology Usage',
    text: 'Hawlaha xaruntaada kee ayaa weli inta badan gacanta lagu qabtaa?',
    type: 'multiple_choice',
    options: ['Xisaabaadka', 'Kaydinta xogta', 'Macaamiisha', 'Iibka', 'Inventory', 'HR / shaqaalaha', 'Warbixinada', 'Waxba'].map(option),
    required: true,
    scoringKey: 'technology'
  },
  {
    code: 'q13',
    section: 'SECTION 4 — Data Storage & Backup',
    text: 'Halkee ayay xaruntaadu inta badan ku kaydisaa xogta muhiimka ah?',
    type: 'single_select',
    options: ['Warqado', 'Computer local ah', 'External hard disk', 'Mobile phone', 'Cloud storage', 'Server gudaha xarunta'].map(option),
    required: true,
    scoringKey: 'backup'
  },
  {
    code: 'q14',
    section: 'SECTION 4 — Data Storage & Backup',
    text: 'Intee jeer ayay xaruntaadu backup u samaysaa xogta muhiimka ah?',
    type: 'single_select',
    options: ['Maalin kasta', 'Toddobaadle', 'Bille', 'Mararka qaar', 'Marnaba'].map(option),
    required: true,
    scoringKey: 'backup'
  },
  {
    code: 'q15',
    section: 'SECTION 4 — Data Storage & Backup',
    text: 'Xaruntaadu waligeed ma la kulantay xog lumis?',
    type: 'yes_no',
    options: [option('Haa'), option('Maya')],
    required: true,
    scoringKey: 'backup'
  },
  {
    code: 'q16',
    section: 'SECTION 4 — Data Storage & Backup',
    text: 'Sababta ugu weyn ee luminta xogta ee xaruntaada waa?',
    type: 'single_select',
    options: ['Koronto la’aan', 'Qalab xumaaday', 'Virus / malware', 'Qalad shaqaale', 'Backup la’aan', 'Ma jirto xog lumis'].map(option),
    required: false,
    scoringKey: 'backup'
  },
  {
    code: 'q17',
    section: 'SECTION 4 — Data Storage & Backup',
    text: 'Kalsooni intee le’eg ayaad ku qabtaa habka aad hadda u keydisaan xogta?',
    type: 'likert',
    options: ['Aad baan ugu kalsoonahay', 'Waan ku kalsoonahay', 'Dhexdhexaad', 'Kalsooni yar', 'Kuma kalsooni'].map(option),
    required: true,
    scoringKey: 'backup'
  },
  {
    code: 'q18',
    section: 'SECTION 5 — Cloud Usage',
    text: 'Xaruntaada hadda ma isticmaaleysaa qalab ku salaysan Cloud?',
    type: 'yes_no',
    options: [option('Haa'), option('Maya')],
    required: true,
    scoringKey: 'cloudTools'
  },
  {
    code: 'q19',
    section: 'SECTION 5 — Cloud Usage',
    text: 'Qalabka Cloud-ka ama adeegyada online-ka ah kee ayay xaruntaada isticmaashaa?',
    type: 'multiple_choice',
    options: ['Google Drive', 'Dropbox', 'OneDrive', 'Google Workspace', 'Microsoft 365', 'Zoom', 'WhatsApp Business', 'Online accounting system', 'Ma isticmaalno'].map(option),
    required: true,
    scoringKey: 'cloudTools'
  },
  {
    code: 'q20',
    section: 'SECTION 5 — Cloud Usage',
    text: 'Intee in la eg ayuu muhiin u yahay xaruntaada isticmaalka cloud apps?',
    type: 'likert',
    options: importanceOptions,
    required: true,
    scoringKey: 'cloudTools'
  },
  {
    code: 'q21',
    section: 'SECTION 5 — Cloud Usage',
    text: 'Shaqada maalinlaha ah, intee in la eg ayay xaruntaada isticmaashaa cloud apps?',
    type: 'single_select',
    options: frequencyOptions,
    required: true,
    scoringKey: 'cloudTools'
  },
  {
    code: 'q22',
    section: 'SECTION 6 — Infrastructure Availability',
    text: 'Heerkee ayuu gaarsiisan yahay isku halaynta adeegyada internet-ka ee xaruntaada?',
    type: 'likert',
    options: scaleOptions,
    required: true,
    scoringKey: 'infrastructure'
  },
  {
    code: 'q23',
    section: 'SECTION 6 — Infrastructure Availability',
    text: 'Inta lagu guda jiro xilliga shaqada, deganaanta korontada (stability), heerkee ayuu gaarsiisan yahay?',
    type: 'likert',
    options: scaleOptions,
    required: true,
    scoringKey: 'infrastructure'
  },
  {
    code: 'q24',
    section: 'SECTION 6 — Infrastructure Availability',
    text: 'Xaruntaadu ma leedahay koronto kayd ah (generator ama solar)?',
    type: 'yes_no',
    options: [option('Haa'), option('Maya')],
    required: true,
    scoringKey: 'infrastructure'
  },
  {
    code: 'q25',
    section: 'SECTION 7 — Challenges & Security',
    text: 'Waa maxay caqabadda ugu weyn ee ka hor istaagta xaruntaada inay horumariso isticmaalka teknoolojiyadda?',
    type: 'single_select',
    options: ['Kharash badan', 'Internet liita', 'Koronto aan degganeyn', 'Aqoonta shaqaalaha oo yar', 'Amni iyo xog ilaalin', 'Taageero farsamo la’aan'].map(option),
    required: true,
    scoringKey: 'none'
  },
  {
    code: 'q26',
    section: 'SECTION 7 — Challenges & Security',
    text: 'Ku keydinta xogta internet-ka, intee in la eg ayaad welwel ka qabtaa?',
    type: 'likert',
    options: concernOptions,
    required: true,
    scoringKey: 'securityTrust'
  },
  {
    code: 'q27',
    section: 'SECTION 7 — Challenges & Security',
    text: 'Waa maxay welwelka ugu weyn ee xaruntaada ka qabo nidaamyada Cloud-ka?',
    type: 'single_select',
    options: ['Xatooyo xog', 'Hackers', 'Sirta oo baxda', 'Qiimaha adeegga', 'Internet la’aan', 'Access control la’aan'].map(option),
    required: true,
    scoringKey: 'securityTrust'
  },
  {
    code: 'q28',
    section: 'SECTION 8 — Business Needs & Adoption',
    text: 'Waa kuwee adeegyada Cloud-ka ee waxtar u leh xaruntaada?',
    type: 'multiple_choice',
    options: ['Cloud storage', 'Online backup', 'Email hosting', 'Accounting system', 'Inventory system', 'Customer management', 'Video meetings', 'Data analytics'].map(option),
    required: true,
    scoringKey: 'willingness'
  },
  {
    code: 'q29',
    section: 'SECTION 8 — Business Needs & Adoption',
    text: 'Ma isleedahay Cloud Computing wax weyn ayuu ka bedeli karaa xaruntaada?',
    type: 'yes_no',
    options: [option('Haa'), option('Maya')],
    required: true,
    scoringKey: 'willingness'
  },
  {
    code: 'q30',
    section: 'SECTION 8 — Business Needs & Adoption',
    text: 'Sidee ayuu Cloud Computing u saameyn karaa ama u horumarin karaa xaruntaada?',
    type: 'paragraph',
    required: true,
    scoringKey: 'none'
  }
];

module.exports = { sectors, questions };
