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

const questions = [
  {
    code: 'q1',
    section: 'MACLUUMAADKA GUUD',
    text: 'Ganacsigaaga ama hay’addaadu noocee ah ayey tahay?',
    type: 'short_text',
    required: true,
    scoringKey: 'none'
  },
  {
    code: 'q2',
    section: 'MACLUUMAADKA GUUD',
    text: 'Immisa sano ayuu ganacsigaagu shaqeynayay?',
    type: 'numeric',
    required: true,
    scoringKey: 'none'
  },
  {
    code: 'q3',
    section: 'MACLUUMAADKA GUUD',
    text: 'Immisa shaqaale ayaa ka shaqeeya hay’addaada?',
    type: 'numeric',
    required: true,
    scoringKey: 'none'
  },
  {
    code: 'q4',
    section: 'MACLUUMAADKA GUUD',
    text: 'Waaxdee ayaad ka shaqeysaa?',
    type: 'short_text',
    required: true,
    scoringKey: 'none'
  },
  {
    code: 'q5',
    section: 'FAHAMKA CLOUD COMPUTING',
    text: 'Ma maqashay erayga “Cloud Computing” hore?',
    type: 'yes_no',
    options: [option('Haa'), option('Maya')],
    required: true,
    scoringKey: 'awareness'
  },
  {
    code: 'q6',
    section: 'FAHAMKA CLOUD COMPUTING',
    text: 'Sidee baad u qiimeyn lahayd fahamkaaga cloud computing?',
    type: 'single_select',
    options: [option('Aad u fiican'), option('Fiican'), option('Dhexdhexaad'), option('Yar'), option('Midna ma aqaan')],
    required: true,
    scoringKey: 'awareness'
  },
  {
    code: 'q7',
    section: 'FAHAMKA CLOUD COMPUTING',
    text: 'Maxaad u fahantaa cloud computing?',
    type: 'paragraph',
    required: true,
    scoringKey: 'none'
  },
  {
    code: 'q8',
    section: 'TEKNOOLOJIYADDA HADDA LA ADEEGSADO',
    text: 'Noocee qalab ah ayaad inta badan isticmaashaan?',
    type: 'single_select',
    options: [option('Desktop'), option('Laptop'), option('Tablet'), option('Mobile phone')],
    required: true,
    scoringKey: 'technology'
  },
  {
    code: 'q9',
    section: 'TEKNOOLOJIYADDA HADDA LA ADEEGSADO',
    text: 'Ma isticmaashaan software maamulka ganacsiga?',
    type: 'yes_no',
    options: [option('Haa'), option('Maya')],
    required: true,
    scoringKey: 'technology'
  },
  {
    code: 'q10',
    section: 'TEKNOOLOJIYADDA HADDA LA ADEEGSADO',
    text: 'Internet joogto ah ma haysataan?',
    type: 'yes_no',
    options: [option('Haa'), option('Maya')],
    required: true,
    scoringKey: 'infrastructure'
  },
  {
    code: 'q11',
    section: 'TEKNOOLOJIYADDA HADDA LA ADEEGSADO',
    text: 'Tayada internet-kiinnu sidee tahay?',
    type: 'single_select',
    options: [option('Aad u fiican'), option('Fiican'), option('Dhexdhexaad'), option('Liita')],
    required: true,
    scoringKey: 'infrastructure'
  },
  {
    code: 'q12',
    section: 'KAYDINTA XOGTA & BACKUP',
    text: 'Xogta ganacsiga xaggee ku kaydsataan?',
    type: 'single_select',
    options: [option('Warqado'), option('Computer local ah'), option('External hard disk'), option('Cloud storage')],
    required: true,
    scoringKey: 'backup'
  },
  {
    code: 'q13',
    section: 'KAYDINTA XOGTA & BACKUP',
    text: 'Ma sameysaan backup joogto ah?',
    type: 'single_select',
    options: [option('Haa maalin kasta'), option('Toddobaadle'), option('Mararka qaar'), option('Maya')],
    required: true,
    scoringKey: 'backup'
  },
  {
    code: 'q14',
    section: 'KAYDINTA XOGTA & BACKUP',
    text: 'Immisa jeer ayay xog kaa luntay?',
    type: 'single_select',
    options: [option('Marna'), option('Hal mar'), option('In ka badan hal mar')],
    required: true,
    scoringKey: 'none'
  },
  {
    code: 'q15',
    section: 'ADEEGSIGA CLOUD TOOLS',
    text: 'Ma isticmaashaan adeegyada cloud sida Google Drive, OneDrive, Dropbox?',
    type: 'yes_no',
    options: [option('Haa'), option('Maya')],
    required: true,
    scoringKey: 'cloudTools'
  },
  {
    code: 'q16',
    section: 'ADEEGSIGA CLOUD TOOLS',
    text: 'Haddii haa, adeeggee ugu badan ayaad isticmaashaan?',
    type: 'short_text',
    required: false,
    scoringKey: 'none'
  },
  {
    code: 'q17',
    section: 'ADEEGSIGA CLOUD TOOLS',
    text: 'Cloud systems ma ka caawiyeen shaqadaada?',
    type: 'single_select',
    options: [option('Aad u badan'), option('Dhexdhexaad'), option('Wax yar'), option('Maya')],
    required: true,
    scoringKey: 'cloudTools'
  },
  {
    code: 'q18',
    section: 'INFRASTRUCTURE AVAILABILITY',
    text: 'Koronto joogto ah ma haysataan?',
    type: 'yes_no',
    options: [option('Haa'), option('Maya')],
    required: true,
    scoringKey: 'infrastructure'
  },
  {
    code: 'q19',
    section: 'INFRASTRUCTURE AVAILABILITY',
    text: 'Koronto la’aantu intee jeer ayay shaqada hakisaa?',
    type: 'single_select',
    options: [option('Badanaa'), option('Mararka qaar'), option('Marar dhif ah'), option('Marnaba')],
    required: true,
    scoringKey: 'infrastructure'
  },
  {
    code: 'q20',
    section: 'INFRASTRUCTURE AVAILABILITY',
    text: 'Internet la’aantu ma caqabad weyn bay idiin tahay?',
    type: 'yes_no',
    options: [option('Haa'), option('Maya')],
    required: true,
    scoringKey: 'infrastructure'
  },
  {
    code: 'q21',
    section: 'CAQABADAHA & DHIBAATOOYINKA',
    text: 'Maxay yihiin caqabadaha ugu waaweyn ee kaa hor istaagaya cloud adoption?',
    type: 'multiple_choice',
    options: [option('Kharash badan'), option('Internet liita'), option('Aqoonta oo yar'), option('Amni darro')],
    required: true,
    scoringKey: 'none'
  },
  {
    code: 'q22',
    section: 'CAQABADAHA & DHIBAATOOYINKA',
    text: 'Shaqaalahaagu ma leeyihiin xirfad ku filan cloud technology?',
    type: 'single_select',
    options: [option('Haa'), option('Maya'), option('Qaar kaliya')],
    required: true,
    scoringKey: 'none'
  },
  {
    code: 'q23',
    section: 'CAQABADAHA & DHIBAATOOYINKA',
    text: 'Tababar ma u baahan tihiin?',
    type: 'yes_no',
    options: [option('Haa'), option('Maya')],
    required: true,
    scoringKey: 'none'
  },
  {
    code: 'q24',
    section: 'SECURITY & TRUST',
    text: 'Ma ku kalsoon tahay in xogtaada lagu kaydiyo cloud?',
    type: 'single_select',
    options: [option('Aad baan ugu kalsoonahay'), option('Waan ku kalsoonahay'), option('Dhexdhexaad'), option('Kuma kalsooni')],
    required: true,
    scoringKey: 'securityTrust'
  },
  {
    code: 'q25',
    section: 'SECURITY & TRUST',
    text: 'Maxaa kaa walwal geliya cloud security?',
    type: 'multiple_choice',
    options: [option('Xatooyo xog'), option('Hackers'), option('Sirta oo baxda'), option('Access control la’aan')],
    required: true,
    scoringKey: 'none'
  },
  {
    code: 'q26',
    section: 'BAAHIYAHA GANACSIGA & MUSTAQBALKA',
    text: 'Ganacsigaagu ma u baahan yahay nidaam digital casri ah?',
    type: 'yes_no',
    options: [option('Haa'), option('Maya')],
    required: true,
    scoringKey: 'none'
  },
  {
    code: 'q27',
    section: 'BAAHIYAHA GANACSIGA & MUSTAQBALKA',
    text: 'Haddii cloud solution la heli karo, ma diyaar baad u tahay inaad isticmaasho?',
    type: 'single_select',
    options: [option('Haa'), option('Maya'), option('Waxaa ku xiran qiimaha')],
    required: true,
    scoringKey: 'willingness'
  },
  {
    code: 'q28',
    section: 'BAAHIYAHA GANACSIGA & MUSTAQBALKA',
    text: 'Maxay yihiin adeegyada aad rabto in cloud kuu xalliyo?',
    type: 'paragraph',
    required: true,
    scoringKey: 'none'
  },
  {
    code: 'q29',
    section: 'BAAHIYAHA GANACSIGA & MUSTAQBALKA',
    text: 'Sidee ayaad u aragtaa mustaqbalka cloud computing ee Soomaaliya?',
    type: 'paragraph',
    required: true,
    scoringKey: 'none'
  },
  {
    code: 'q30',
    section: 'BAAHIYAHA GANACSIGA & MUSTAQBALKA',
    text: 'Maxaad kula talin lahayd dowladda ama shirkadaha si loo kordhiyo cloud adoption-ka Soomaaliya?',
    type: 'paragraph',
    required: true,
    scoringKey: 'none'
  }
];

module.exports = { sectors, questions };
