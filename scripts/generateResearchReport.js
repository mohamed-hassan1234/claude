const fs = require('fs');
const path = require('path');

require('../backend/node_modules/dotenv').config({ path: path.resolve(__dirname, '..', 'backend', '.env') });

const mongoose = require('../backend/node_modules/mongoose');

const SurveyResponse = require('../backend/models/SurveyResponse');
const SurveyQuestion = require('../backend/models/SurveyQuestion');
const { normalizeResponseSectors } = require('../backend/services/responseCompatibilityService');
const { buildLocalAnalytics } = require('../backend/services/localAnalyticsService');
const { buildFinalReport } = require('../backend/services/reportAnalyticsService');

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'reports');
const ANALYTICS_JSON = path.join(OUT_DIR, 'cloud-readiness-analytics.json');
const REPORT_MD = path.join(OUT_DIR, 'cloud-computing-readiness-somalia-report.md');

const DELETED_FILTER = { $or: [{ deletedAt: { $exists: false } }, { deletedAt: null }] };

const pct = (value) => `${Number(value || 0).toFixed(2).replace(/\.00$/, '')}%`;
const num = (value) => Number(value || 0).toFixed(2).replace(/\.00$/, '');
const val = (value, fallback = 'No data') => {
  if (value === null || value === undefined || value === '') return fallback;
  return String(value);
};

const esc = (value) => String(value ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');

const mdTable = (headers, rows) => {
  const safeRows = rows.length ? rows : [headers.map(() => 'No data')];
  return [
    `| ${headers.map(esc).join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
    ...safeRows.map((row) => `| ${row.map(esc).join(' | ')} |`)
  ].join('\n');
};

const answers = (analytics, code) => analytics.frequencyAnalysis?.[code]?.answers || [];
const question = (analytics, code) => analytics.frequencyAnalysis?.[code]?.question || code;
const top = (rows, index = 0) => rows[index] || {};

const freqTable = (analytics, code) =>
  mdTable(['Response option', 'Frequency', 'Percentage'], answers(analytics, code).map((item) => [item.answer, item.count, pct(item.percentage)]));

const shortFreq = (analytics, code, limit = 3) =>
  answers(analytics, code)
    .slice(0, limit)
    .map((item) => `${item.answer} (${item.count}, ${pct(item.percentage)})`)
    .join('; ') || 'No responses';

const sectionNarrative = (analytics, code, label) => {
  const rows = answers(analytics, code);
  const first = top(rows);
  const second = top(rows, 1);
  const secondSentence = second.answer
    ? ` The second most common response was ${second.answer}, representing ${pct(second.percentage)}.`
    : '';
  return `Figure ${label} and Table ${label} summarize responses to "${question(analytics, code)}". The dominant response was ${val(first.answer)} with ${first.count || 0} responses (${pct(first.percentage)}).${secondSentence} This distribution is important because it identifies the current operational baseline from which cloud readiness must be interpreted.`;
};

const chartInventory = () => {
  const dir = path.join(ROOT, 'analytics', 'generated');
  if (!fs.existsSync(dir)) return {};
  const files = fs.readdirSync(dir)
    .filter((file) => file.toLowerCase().endsWith('.png'))
    .map((file) => {
      const full = path.join(dir, file);
      return { file, full, mtime: fs.statSync(full).mtimeMs };
    })
    .sort((a, b) => b.mtime - a.mtime);

  const prefixes = ['sector-ranking', 'technology-use', 'barriers', 'adoption-willingness'];
  return Object.fromEntries(
    prefixes.map((prefix) => {
      const match = files.find((item) => item.file.startsWith(prefix));
      return [prefix, match ? path.relative(ROOT, match.full).replace(/\\/g, '/') : ''];
    })
  );
};

const readinessBand = (score) => (score >= 70 ? 'High' : score >= 40 ? 'Medium' : 'Low');

const toPlainAnswers = (answers) => {
  if (!answers) return {};
  if (answers instanceof Map) return Object.fromEntries(answers.entries());
  return answers;
};

const displayValue = (value) => {
  if (Array.isArray(value)) return value.join(', ');
  return value ?? '';
};

const answerByCode = (response, code) => {
  const answers = toPlainAnswers(response.answers);
  if (answers[code] !== undefined && answers[code] !== null && String(displayValue(answers[code])).trim()) {
    return answers[code];
  }

  const detail = (response.answerDetails || []).find((item) => item.code === code);
  return detail ? detail.value : '';
};

const flattenByStableQuestionCode = (response, questions) => {
  const answers = toPlainAnswers(response.answers);
  const sectorValue =
    response.sector?.name ||
    (typeof response.sector === 'string' ? response.sector : '') ||
    displayValue(answers.q2) ||
    '';

  const row = {
    id: response._id.toString(),
    respondentName: response.respondentName,
    organizationName: response.organizationName,
    sector: sectorValue,
    district: response.district,
    phoneNumber: response.phoneNumber,
    awarenessLevel: response.awarenessLevel,
    willingnessToAdopt: response.willingnessToAdopt,
    readinessScore: response.readinessScore,
    readinessBand: response.readinessBand,
    submittedAt: response.submittedAt || response.createdAt
  };

  questions.forEach((question) => {
    row[question.text] = displayValue(answerByCode(response, question.code));
  });

  return row;
};

const rankedSectorRows = (analytics) => analytics.sectorComparison?.rows || [];
const factorRows = (analytics) => analytics.factorSummary || [];
const gapRows = (analytics) => analytics.gapAnalysis?.overall || [];

const buildTopFindings = (analytics) => {
  const totals = analytics.totals || {};
  const sectors = rankedSectorRows(analytics);
  const factors = factorRows(analytics);
  const gaps = gapRows(analytics);
  const bands = analytics.readiness?.distribution || [];
  const high = bands.find((item) => item.band === 'High') || {};
  const medium = bands.find((item) => item.band === 'Medium') || {};
  const low = bands.find((item) => item.band === 'Low') || {};

  return [
    `The survey analyzed ${totals.totalResponses || 0} valid responses across ${totals.totalSectorsCovered || 0} sectors and ${totals.totalDistrictsCovered || 0} districts.`,
    `The average cloud readiness score was ${num(totals.averageCloudReadinessScore)} out of 100, placing the overall sample in the ${readinessBand(totals.averageCloudReadinessScore || 0)} readiness category.`,
    `Cloud awareness stood at ${pct(totals.awarenessRate)}, while willingness to adopt cloud solutions stood at ${pct(totals.adoptionWillingnessRate)}.`,
    `Current cloud-tools usage was ${pct(totals.cloudToolsUsageRate)}, which should be interpreted alongside the leading current cloud tool: ${val(top(answers(analytics, 'q19')).answer)}.`,
    `Backup practice coverage was ${pct(totals.backupPracticeRate)}, but the dominant storage method was ${val(top(answers(analytics, 'q13')).answer)}.`,
    `Infrastructure stability scored ${pct(totals.infrastructureStabilityRate)}, with internet reliability led by ${val(top(answers(analytics, 'q22')).answer)} and power stability led by ${val(top(answers(analytics, 'q23')).answer)}.`,
    `Security trust scored ${pct(totals.securityTrustRate)}; the most frequent cloud concern was ${val(top(analytics.securityConcerns || []).answer)}.`,
    `The strongest readiness factor was ${val(top(factors).label)} at ${pct(top(factors).score)}, while the largest readiness gap was ${val(top(gaps).label)} at ${pct(top(gaps).gap)}.`,
    `The highest-readiness sector was ${val(top(sectors).sector)} with an average score of ${pct(top(sectors).averageReadiness)}.`,
    `Readiness distribution was ${low.count || 0} Low (${pct(low.percentage)}), ${medium.count || 0} Medium (${pct(medium.percentage)}), and ${high.count || 0} High (${pct(high.percentage)}).`
  ];
};

const addQuestionBlock = (analytics, code, figNo, tableNo) => `
#### Figure ${figNo}. ${question(analytics, code)}

${sectionNarrative(analytics, code, figNo)}

Table ${tableNo} provides the numerical distribution behind Figure ${figNo}.

${freqTable(analytics, code)}
`;

const buildReport = (analytics, finalReport, charts) => {
  const totals = analytics.totals || {};
  const sectors = rankedSectorRows(analytics);
  const districts = analytics.districtComparison?.rows || [];
  const factors = factorRows(analytics);
  const gaps = gapRows(analytics);
  const readinessDistribution = analytics.readiness?.distribution || [];
  const findings = buildTopFindings(analytics);
  const generated = new Date(analytics.generatedAt || Date.now()).toLocaleString('en-US', { timeZone: 'Africa/Nairobi' });

  return `# Cloud Computing Readiness, Challenges, and Adoption Across Business Sectors in Somalia

## Research Report

**Generated from:** Cloud Computing Survey Analytics System  
**Generated at:** ${generated} East Africa Time  
**Evidence base:** ${totals.totalResponses || 0} collected survey responses, ${totals.totalSectorsCovered || 0} business sectors, and ${totals.totalDistrictsCovered || 0} districts  

## Abstract

This report examines cloud computing readiness, challenges, and adoption across business sectors in Somalia using the collected responses stored in the Cloud Computing Survey Analytics System. The analysis is based on the system's survey instrument, frequency tables, percentage analysis, open-ended response analysis, sector comparisons, and readiness scoring model. The overall dataset contains ${totals.totalResponses || 0} responses covering ${totals.totalSectorsCovered || 0} sectors and ${totals.totalDistrictsCovered || 0} districts. The average cloud readiness score is ${num(totals.averageCloudReadinessScore)} out of 100. The system reports a cloud awareness rate of ${pct(totals.awarenessRate)}, cloud-tools usage rate of ${pct(totals.cloudToolsUsageRate)}, backup practice rate of ${pct(totals.backupPracticeRate)}, infrastructure stability rate of ${pct(totals.infrastructureStabilityRate)}, security trust rate of ${pct(totals.securityTrustRate)}, and adoption willingness rate of ${pct(totals.adoptionWillingnessRate)}.

The evidence shows that cloud adoption in the surveyed Somali business environment is not a single technical issue. It is shaped by awareness, digital maturity, backup behavior, infrastructure reliability, security confidence, cost sensitivity, and perceived business value. The highest readiness sector is ${val(top(sectors).sector)}, while the strongest readiness factor is ${val(top(factors).label)}. The largest gap is ${val(top(gaps).label)}, meaning this area requires priority attention in adoption planning.

## List of Figures

Figure 1. Sector distribution of respondents  
Figure 2. District distribution of respondents  
Figure 3. Organization employee-size distribution  
Figure 4. Respondent role distribution  
Figure 5. Cloud awareness distribution  
Figure 6. Cloud knowledge level distribution  
Figure 7. Daily technology device usage  
Figure 8. Current software and digital-system usage  
Figure 9. Technology usage maturity rating  
Figure 10. Manual business processes  
Figure 11. Data storage methods  
Figure 12. Backup frequency  
Figure 13. Data loss experience  
Figure 14. Causes of data loss  
Figure 15. Confidence in current data storage  
Figure 16. Current cloud-tool usage  
Figure 17. Cloud tools and online services used  
Figure 18. Importance of cloud applications  
Figure 19. Daily dependency on cloud applications  
Figure 20. Internet reliability  
Figure 21. Power stability  
Figure 22. Backup power availability  
Figure 23. Main technology improvement barriers  
Figure 24. Concern about storing data online  
Figure 25. Main cloud-security concerns  
Figure 26. Desired cloud services  
Figure 27. Belief that cloud computing can improve the organization  
Figure 28. Open-ended response themes  
Figure 29. Sector readiness ranking  
Figure 30. Readiness distribution  

## List of System Chart Files

Where generated PNG charts are available in the analytics system, the latest chart files are:

${mdTable(['Chart type', 'Latest file path'], Object.entries(charts).map(([key, file]) => [key, file || 'No generated PNG found']))}

# Chapter 1 — Introduction

## 1.1 Background of Cloud Computing

Cloud computing refers to the delivery of computing resources over networks, including storage, applications, servers, software platforms, databases, and analytics tools. Instead of owning and maintaining all computing infrastructure locally, organizations can access services on demand and pay according to usage or subscription terms. In business settings, cloud computing is often associated with online file storage, email hosting, accounting systems, collaboration platforms, customer management systems, backup services, and data analytics.

The relevance of cloud computing is especially strong for organizations that need reliability, scalability, data protection, and access to modern digital tools without making large upfront investments in physical infrastructure. For small and medium enterprises, educational institutions, healthcare facilities, finance-related organizations, logistics firms, hospitality services, and online businesses, cloud services can reduce operational barriers by shifting part of the technology burden from local infrastructure to managed online platforms.

## 1.2 Importance of Digital Transformation

Digital transformation is the process through which organizations redesign business processes, information flows, customer engagement, and decision-making using digital technologies. It is not limited to purchasing computers or installing software. It includes changes in management practice, data culture, business continuity planning, staff skills, security behavior, and organizational readiness.

The survey data confirms that digital transformation among the sampled businesses is uneven. The leading technology-use indicators are device usage (${shortFreq(analytics, 'q8')}) and software-system usage (${shortFreq(analytics, 'q10')}). However, manual work remains visible in the responses, particularly in ${shortFreq(analytics, 'q12')}. This means that many organizations have adopted some digital tools while still depending on manual processes in core operational areas.

## 1.3 Importance of Cloud Adoption

Cloud adoption matters because it can improve data availability, backup reliability, remote access, collaboration, financial record management, inventory control, customer service, and reporting. In environments where local devices may be affected by hardware failure, power instability, or limited technical capacity, cloud services can provide continuity if implemented with appropriate security and connectivity planning.

The analytics system shows cloud-tools usage at ${pct(totals.cloudToolsUsageRate)} and adoption willingness at ${pct(totals.adoptionWillingnessRate)}. This gap between current use and willingness is important. It suggests that cloud adoption can grow if organizations receive practical support, if infrastructure barriers are addressed, and if security concerns are explained in operational terms.

## 1.4 Context of Somalia

Somalia's business sectors operate in a context where digital services are increasingly relevant to trade, education, health, communication, finance, logistics, and public-facing services. Mobile connectivity, online communication, and digital payment ecosystems have created opportunities for technology adoption. At the same time, businesses may face constraints linked to internet reliability, electricity stability, technical skills, trust in online systems, cost, and limited access to structured IT support.

This study is therefore situated within a practical development question: how ready are Somali business organizations to adopt cloud computing, and what challenges must be addressed to support responsible and effective adoption?

## 1.5 Problem Statement

Despite growing global reliance on cloud computing, many organizations in Somalia still face uncertainty regarding awareness, infrastructure readiness, security confidence, backup practices, and the practical value of cloud-based systems. Without evidence from actual organizations, cloud adoption discussions can become too general and may overlook sector-specific constraints. This study addresses that gap by analyzing collected survey data from multiple Somali business sectors and identifying readiness levels, barriers, opportunities, and sector differences.

## 1.6 Research Objectives

1. To assess cloud computing awareness among surveyed business sectors in Somalia.
2. To examine current technology usage and digital maturity across sectors.
3. To analyze data storage, backup practices, and data-loss risks.
4. To assess current cloud usage and dependency on cloud applications.
5. To evaluate infrastructure readiness, including internet reliability, electricity stability, and backup power.
6. To identify security concerns and adoption barriers.
7. To compare cloud readiness across sectors and districts.
8. To develop practical recommendations for organizations, sectors, and national stakeholders.

## 1.7 Research Questions

1. What is the level of cloud computing awareness among surveyed organizations?
2. What technologies and software systems are currently used by businesses?
3. How do organizations store and back up important data?
4. What proportion of organizations currently use cloud tools?
5. How reliable are internet and power conditions for cloud adoption?
6. What are the main security concerns and adoption barriers?
7. Which sectors show stronger or weaker cloud readiness?
8. What interventions can improve cloud computing adoption across Somalia's business sectors?

## 1.8 Scope of Study

The study covers ${totals.totalResponses || 0} survey responses from ${totals.totalSectorsCovered || 0} sectors and ${totals.totalDistrictsCovered || 0} districts. The survey instrument includes 30 questions covering organization profile, cloud awareness, technology usage, data storage and backup, cloud usage, infrastructure availability, challenges and security, business needs, adoption willingness, and open-ended views on the possible impact of cloud computing.

## 1.9 Significance of Study

The study is significant for business managers, technology providers, policy stakeholders, academic researchers, and development actors. It identifies practical barriers and readiness gaps using actual collected data. It also provides sector-level evidence that can guide training programs, cloud-service design, infrastructure planning, cybersecurity awareness, and phased adoption strategies.

# Chapter 2 — Literature Review

## 2.1 Cloud Computing Concepts

Cloud computing is commonly understood as an internet-enabled model for accessing computing resources without requiring organizations to own all infrastructure locally. The model supports flexibility, resource sharing, scalability, and managed service delivery. For organizations with limited IT staff or limited capital budgets, cloud computing can reduce technical burdens and provide access to tools that would otherwise require servers, licenses, maintenance, and specialized expertise.

## 2.2 Cloud Service Models

The main cloud service models are Infrastructure as a Service, Platform as a Service, and Software as a Service. Infrastructure as a Service provides virtual machines, storage, and networking resources. Platform as a Service provides development and deployment platforms. Software as a Service provides complete applications such as email, file storage, accounting platforms, collaboration suites, and customer management tools. In this survey, most measured cloud services are practical business-facing services such as Google Drive, Dropbox, OneDrive, Google Workspace, Microsoft 365, Zoom, WhatsApp Business, online accounting systems, cloud storage, online backup, email hosting, inventory systems, customer management, video meetings, and data analytics.

## 2.3 Cloud Deployment Models

Cloud deployment can be public, private, hybrid, or community based. Public cloud services are provided over the internet to many customers. Private cloud services are dedicated to one organization. Hybrid cloud combines local and cloud infrastructure. Community cloud is designed for organizations with shared requirements. For the surveyed organizations, the most realistic early adoption path is often public-cloud or SaaS adoption, because such services are easier to start, require less infrastructure ownership, and match the business needs measured in Q28.

## 2.4 Benefits of Cloud Computing

The benefits of cloud computing include reduced capital expenditure, improved backup, easier collaboration, remote access, faster deployment, scalability, disaster recovery, centralized management, and access to modern applications. These benefits are directly related to the survey findings. For example, the reported desire for ${shortFreq(analytics, 'q28')} indicates demand for services that improve storage, backup, communication, records, and analytics.

## 2.5 Challenges of Cloud Adoption

Cloud adoption challenges include cost, unreliable internet, unstable electricity, limited technical skills, security concerns, weak governance, vendor dependency, and low trust in online data storage. The actual survey data identifies the leading barriers as ${shortFreq(analytics, 'q25')}. These findings support the view that cloud adoption is both a technical and organizational challenge.

## 2.6 Previous Studies

Previous research on cloud adoption commonly emphasizes perceived usefulness, perceived ease of use, security, cost, infrastructure, staff skills, and management support. The present survey aligns with these themes by measuring awareness, current technology use, backup behavior, infrastructure, security concern, and willingness to adopt. The contribution of this report is that it applies those adoption themes to actual collected sector-level data from Somalia.

## 2.7 African Context

Across many African contexts, cloud computing offers opportunities for businesses to modernize without building extensive local IT infrastructure. However, adoption is often affected by internet cost and reliability, electricity supply, digital skills, policy frameworks, trust, and availability of local technical support. The Somali survey data reflects similar conditions: infrastructure stability is ${pct(totals.infrastructureStabilityRate)}, and the leading barriers include ${shortFreq(analytics, 'q25')}.

## 2.8 Somalia Context

In Somalia, cloud computing adoption must be understood in relation to mobile-first business communication, uneven infrastructure, varying organizational sizes, and sector-specific technology maturity. The report's sector comparison shows measurable differences across business sectors, with ${val(top(sectors).sector)} leading in readiness and ${val(sectors[sectors.length - 1]?.sector)} showing the lowest average readiness score. This confirms that cloud adoption strategies should not treat all sectors as identical.

# Chapter 3 — Methodology

## 3.1 Research Design

The study uses a quantitative descriptive survey design supported by open-ended qualitative response analysis. The quantitative component summarizes frequencies, percentages, readiness scores, factor scores, sector comparisons, and district comparisons. The qualitative component analyzes open-ended responses to identify themes, keywords, topic groups, and repeated concerns.

## 3.2 Survey Design

The questionnaire contains 30 questions organized around organization profile, cloud awareness, current technology usage, data storage and backup, cloud usage, infrastructure availability, challenges and security, and business needs and adoption. The instrument includes single-select, multiple-choice, yes/no, Likert-scale, short-text, and paragraph-response questions.

## 3.3 Data Collection Process

The data analyzed in this report was already collected and stored in the Cloud Computing Survey Analytics System. The backend stores each survey response with organization information, sector, district, answer details, readiness score, readiness band, awareness level, willingness to adopt, submission source, and submission date. Deleted responses are excluded from the analytics filter.

## 3.4 Sampling Method

The system contains responses from multiple business sectors in Somalia. The sampling approach is best described as survey-based sectoral sampling of accessible organizations. The data should therefore be interpreted as evidence from the surveyed respondents rather than as a national census of all Somali businesses.

## 3.5 Sample Size

The final analytical sample contains ${totals.totalResponses || 0} valid responses. The survey covers ${totals.totalSectorsCovered || 0} sectors and ${totals.totalDistrictsCovered || 0} districts. Table 1 summarizes the sample coverage.

${mdTable(['Metric', 'Value'], [
  ['Total valid responses', totals.totalResponses || 0],
  ['Sectors covered', totals.totalSectorsCovered || 0],
  ['Districts covered', totals.totalDistrictsCovered || 0],
  ['Average readiness score', num(totals.averageCloudReadinessScore)],
  ['Readiness standard deviation', analytics.descriptiveStatistics?.stdDeviationReadiness || 0]
])}

## 3.6 Business Sectors Covered

The sectors represented in the dataset are shown in Table 2.

${mdTable(['Sector', 'Responses', 'Percentage'], (analytics.sectorDistribution || []).map((item) => [item.answer, item.count, pct(item.percentage)]))}

## 3.7 Questionnaire Structure

The questionnaire measures profile variables such as sector, district, respondent role, and employee size. It then measures cloud awareness, technology maturity, storage and backup behavior, cloud usage, infrastructure readiness, security concerns, adoption barriers, business needs, willingness to adopt, and open-ended views on potential cloud impact.

## 3.8 Data Analysis Approach

The analytics system calculates frequencies and percentages for each question. It also calculates readiness scores using seven factors: cloud awareness, technology usage, infrastructure readiness, data storage and backup, cloud usage, security confidence, and willingness to adopt. Sector and district comparison tables are created by averaging the factor scores and overall readiness scores for each group.

## 3.9 Analytical Tools Used

The analysis uses the Cloud Computing Survey Analytics System backend. The report was generated from the system's MongoDB-backed responses, backend response-flattening service, local analytics service, readiness model, frequency analysis, percentage analysis, text-response theme analysis, and report-summary service.

# Chapter 4 — Respondent Profile Analysis

## 4.1 Sector Distribution

${addQuestionBlock(analytics, 'q2', 1, 3)}

The sector distribution shows the business composition of the sample. The most represented sector is ${val(top(analytics.sectorDistribution || []).answer)} with ${top(analytics.sectorDistribution || []).count || 0} responses (${pct(top(analytics.sectorDistribution || []).percentage)}). This matters because heavily represented sectors have greater influence on the overall percentages and average readiness score. Less represented sectors should be interpreted carefully, especially when making sector-specific recommendations.

## 4.2 District Distribution

Figure 2 summarizes district distribution. The most represented district is ${val(top(analytics.districtDistribution || []).answer)} with ${top(analytics.districtDistribution || []).count || 0} responses (${pct(top(analytics.districtDistribution || []).percentage)}).

${mdTable(['District', 'Responses', 'Percentage'], (analytics.districtDistribution || []).map((item) => [item.answer, item.count, pct(item.percentage)]))}

District distribution has implications for infrastructure interpretation. If one or two districts dominate the sample, internet reliability, electricity stability, and adoption readiness may reflect local operating conditions rather than uniform national conditions.

## 4.3 Organization Types

Organization type is represented by the sector variable. Table 2 shows that the sample includes a range of formal and service-oriented business categories. This diversity supports comparison across technology-intensive sectors and sectors where adoption may still be emerging.

## 4.4 Employee Size

${addQuestionBlock(analytics, 'q5', 3, 4)}

Employee size gives an indication of organizational capacity. Smaller organizations may adopt lightweight cloud services such as storage, backup, and communication tools, while larger organizations may require governance, access controls, and structured migration plans. The dominant employee-size category is ${val(top(answers(analytics, 'q5')).answer)}.

## 4.5 Respondent Roles

${addQuestionBlock(analytics, 'q4', 4, 5)}

Respondent role affects how answers should be interpreted. Owners and managers may understand operational needs and costs, while IT staff may better understand technical infrastructure and security. The leading respondent role is ${val(top(answers(analytics, 'q4')).answer)}, which means the analysis largely reflects the perspective of that role group.

# Chapter 5 — Cloud Awareness Analysis

## 5.1 Awareness of Cloud Computing

${addQuestionBlock(analytics, 'q6', 5, 6)}

The awareness rate calculated by the analytics system is ${pct(totals.awarenessRate)}. This means that awareness exists among a measurable share of respondents, but the exact distribution must be interpreted using the full response pattern in Table 6. Awareness is a foundational readiness factor because organizations cannot intentionally adopt a service model they do not understand.

## 5.2 Knowledge Level

${addQuestionBlock(analytics, 'q7', 6, 7)}

Knowledge level provides a more detailed view than simple awareness. A respondent may have heard of cloud computing but still rate organizational understanding as low or moderate. The dominant knowledge rating is ${val(top(answers(analytics, 'q7')).answer)}, indicating the prevailing self-assessed level of understanding in the sample.

## 5.3 Implications of Awareness Findings

Cloud awareness contributes directly to readiness. The system's factor summary reports Cloud awareness at ${pct((factors.find((item) => item.factor === 'cloudAwareness') || {}).score)}. If awareness is weaker than adoption willingness, training campaigns can quickly convert interest into practical adoption. If awareness is already strong, the priority shifts toward implementation support, security assurance, and service selection.

# Chapter 6 — Technology Usage Analysis

## 6.1 Devices Used

${addQuestionBlock(analytics, 'q8', 7, 8)}

Device usage shows the hardware base available for digital transformation. The leading device response is ${val(top(answers(analytics, 'q8')).answer)}. A device base centered on laptops, desktops, POS systems, and mobile phones can support cloud adoption, but the type of device affects the appropriate cloud service. Mobile-heavy organizations may benefit from mobile-friendly SaaS and communication tools, while desktop-heavy organizations may be better prepared for structured accounting, inventory, and reporting systems.

## 6.2 Software Usage

${addQuestionBlock(analytics, 'q9', 8, 9)}

${addQuestionBlock(analytics, 'q10', 9, 10)}

The software usage findings show whether organizations already rely on digital systems for work. Existing software use reduces the adoption barrier because employees are more familiar with digital workflows. However, the presence of "Ma isticmaalno" or limited software categories indicates organizations that still need basic digitalization before advanced cloud adoption.

## 6.3 Technology Maturity

${addQuestionBlock(analytics, 'q11', 10, 11)}

The system's technology-usage factor score is ${pct((factors.find((item) => item.factor === 'technologyUse') || {}).score)}. This factor combines device use, software use, self-rated technology maturity, and manual-process dependence. It is therefore a stronger indicator than any single question.

## 6.4 Manual Processes

${addQuestionBlock(analytics, 'q12', 11, 12)}

Manual processes identify where cloud adoption could deliver immediate value. The leading manual-process category is ${val(top(answers(analytics, 'q12')).answer)}. Where manual accounting, customer records, inventory, HR, or reporting remain common, cloud services can support process standardization, data accessibility, and faster reporting.

# Chapter 7 — Data Storage & Backup Analysis

## 7.1 Storage Methods

${addQuestionBlock(analytics, 'q13', 12, 13)}

The dominant storage method is ${val(top(answers(analytics, 'q13')).answer)}. Storage method is central to cloud readiness because organizations that rely on paper, phones, or local computers may face higher risk from theft, damage, device failure, and limited access. Organizations already using cloud storage or internal servers have a stronger foundation for structured backup and recovery.

## 7.2 Backup Practices

${addQuestionBlock(analytics, 'q14', 13, 14)}

The analytics system reports a backup practice rate of ${pct(totals.backupPracticeRate)}. This rate counts organizations that report at least some backup practice. The detailed frequency distribution shows whether backups are daily, weekly, monthly, occasional, or never. Occasional backup is better than no backup but still creates recovery risk because recent data may be lost.

## 7.3 Data Loss Experiences

${addQuestionBlock(analytics, 'q15', 14, 15)}

${addQuestionBlock(analytics, 'q16', 15, 16)}

Data-loss experience is an important warning sign. If respondents report loss due to electricity, hardware failure, malware, staff error, or lack of backup, then cloud backup and managed storage should be treated as risk-control measures rather than optional upgrades.

## 7.4 Confidence in Current Data Storage

${addQuestionBlock(analytics, 'q17', 16, 17)}

Confidence in current storage indicates perceived reliability. The leading confidence level is ${val(top(answers(analytics, 'q17')).answer)}. Where confidence is only moderate or low, cloud services can be positioned as a way to strengthen continuity, but adoption must include training and clear explanation of data protection.

# Chapter 8 — Cloud Usage Analysis

## 8.1 Current Cloud Service Usage

${addQuestionBlock(analytics, 'q18', 17, 18)}

The current cloud-tools usage rate is ${pct(totals.cloudToolsUsageRate)}. This rate is a direct measure of present adoption. If cloud use is lower than willingness to adopt, the gap suggests unmet demand.

## 8.2 Cloud Tools Used

${addQuestionBlock(analytics, 'q19', 18, 19)}

The leading cloud or online service is ${val(top(answers(analytics, 'q19')).answer)}. Tools such as online storage, collaboration suites, video meetings, business messaging, and online accounting systems indicate the services organizations already understand and trust. These tools can serve as entry points for broader cloud adoption.

## 8.3 Importance of Cloud Applications

${addQuestionBlock(analytics, 'q20', 19, 20)}

Perceived importance shows business value. If respondents rate cloud apps as important or very important, adoption programs should focus on implementation, cost, and security rather than awareness alone.

## 8.4 Cloud Dependency in Daily Work

${addQuestionBlock(analytics, 'q21', 20, 21)}

Daily dependency is different from simple use. An organization may use a cloud tool occasionally but not depend on it for core work. The leading response is ${val(top(answers(analytics, 'q21')).answer)}, showing the current operational depth of cloud integration.

# Chapter 9 — Infrastructure Analysis

## 9.1 Internet Reliability

${addQuestionBlock(analytics, 'q22', 21, 22)}

Internet reliability is a core requirement for cloud computing. The infrastructure factor cannot be understood without this variable. The leading internet reliability rating is ${val(top(answers(analytics, 'q22')).answer)}. If reliability is moderate or low, cloud adoption should include offline procedures, mobile data backups, service-level planning, and gradual migration.

## 9.2 Power Stability

${addQuestionBlock(analytics, 'q23', 22, 23)}

Power stability affects device access, routers, POS systems, and local network equipment. Even cloud-based services require powered devices and connectivity equipment. The leading power stability rating is ${val(top(answers(analytics, 'q23')).answer)}.

## 9.3 Backup Power Availability

${addQuestionBlock(analytics, 'q24', 23, 24)}

Backup power availability reduces downtime risk. Organizations with generators or solar systems may be more capable of using cloud services consistently. The infrastructure readiness factor score is ${pct((factors.find((item) => item.factor === 'infrastructureReadiness') || {}).score)}.

## 9.4 Infrastructure Readiness Implications

The overall infrastructure stability rate is ${pct(totals.infrastructureStabilityRate)}. This score indicates that infrastructure is a major determinant of cloud adoption. Cloud providers and policymakers should treat internet and electricity as adoption enablers, not background conditions.

# Chapter 10 — Security & Challenges Analysis

## 10.1 Main Adoption Barriers

${addQuestionBlock(analytics, 'q25', 24, 25)}

The most common barrier is ${val(top(analytics.commonBarriers || []).answer)}. This result matters because barriers determine what type of intervention is most useful. Cost barriers require pricing support and low-cost packages. Internet barriers require connectivity planning. Skills barriers require training. Security barriers require trust-building and practical controls.

## 10.2 Concern About Online Data Storage

${addQuestionBlock(analytics, 'q26', 25, 26)}

The security-trust factor score is ${pct((factors.find((item) => item.factor === 'securityTrust') || {}).score)}. This score reflects concern levels and the type of security worries reported by respondents.

## 10.3 Main Cloud Security Concerns

${addQuestionBlock(analytics, 'q27', 26, 27)}

The leading security concern is ${val(top(analytics.securityConcerns || []).answer)}. Cloud adoption programs must address this concern directly through explanations of access control, encryption, backup, user permissions, audit logs, password hygiene, and recovery procedures.

## 10.4 Cost, Skills, Infrastructure, and Security

The barrier data shows that cloud adoption is constrained by several interacting factors. Cost affects willingness to subscribe. Skills affect ability to configure and use services. Infrastructure affects reliability. Security affects trust. A successful strategy must address all four rather than assuming cloud adoption is only a software-purchasing decision.

# Chapter 11 — Business Needs & Adoption Readiness

## 11.1 Desired Cloud Services

${addQuestionBlock(analytics, 'q28', 27, 28)}

The most desired cloud service is ${val(top(analytics.cloudNeeds || []).answer)}. Desired services show where organizations perceive value. The leading categories indicate practical business needs such as storage, backup, email, accounting, inventory, customer management, meetings, and analytics.

## 11.2 Adoption Willingness

${addQuestionBlock(analytics, 'q29', 28, 29)}

The adoption willingness rate is ${pct(totals.adoptionWillingnessRate)}. This is one of the most important findings because willingness indicates perceived relevance. Where willingness is high but current adoption is lower, the main challenge is likely implementation readiness rather than lack of interest.

## 11.3 Perceived Benefits

The open-ended responses, analyzed in Chapter 12, provide evidence of perceived benefits in respondents' own words. The dominant theme is ${val(analytics.businessNeeds?.mostCommonRecommendationTheme)}. This suggests that respondents associate cloud computing with concrete operational improvements rather than only abstract technology modernization.

# Chapter 12 — Open-Ended Response Analysis

## 12.1 Theme Analysis

Figure 29 and Table 30 summarize themes extracted from responses to Q30: "${question(analytics, 'q30')}".

${mdTable(['Theme', 'Frequency', 'Percentage', 'Example responses'], (analytics.businessNeeds?.themeCards || []).map((item) => [item.theme, item.count, pct(item.percentage), (item.examples || []).join(' / ')]))}

The dominant theme is ${val(top(analytics.businessNeeds?.themeCards || []).theme)}. This theme appeared in ${top(analytics.businessNeeds?.themeCards || []).count || 0} responses (${pct(top(analytics.businessNeeds?.themeCards || []).percentage)}). The theme distribution shows the language respondents used when explaining the expected value of cloud computing.

## 12.2 Keyword Analysis

${mdTable(['Keyword', 'Frequency'], (analytics.businessNeeds?.keywordChart || []).slice(0, 20).map((item) => [item.keyword, item.count]))}

The keyword pattern supports the theme analysis. Frequently repeated words point to the operational concerns and expectations respondents associate with cloud computing.

## 12.3 Topic Grouping

${mdTable(['Topic', 'Frequency', 'Percentage'], (analytics.businessNeeds?.groupedTopicBlocks || []).map((item) => [item.topic, item.count, pct(item.percentage)]))}

Topic grouping shows that open-ended responses are not random. They cluster around business continuity, data protection, online access, efficiency, infrastructure or cost, and customer-service improvement. These patterns should inform adoption messaging and training content.

## 12.4 Common Patterns and Suggested Improvements

The repeated concerns suggest that organizations want cloud computing to solve practical problems: safer data storage, easier access, improved management, faster work, better reporting, and stronger service continuity. However, these benefits depend on reliable internet, power availability, staff training, and security trust.

# Chapter 13 — Sector Comparison Analysis

## 13.1 Sector Readiness Ranking

Figure 30 compares sectors by average readiness. The latest generated sector ranking chart file is ${charts['sector-ranking'] || 'not available'}.

${mdTable(['Sector', 'Responses', 'Average readiness', 'Awareness', 'Technology use', 'Infrastructure', 'Backup', 'Cloud use', 'Security', 'Willingness'], sectors.map((item) => [
  item.sector,
  item.responses,
  pct(item.averageReadiness),
  pct(item.cloudAwareness),
  pct(item.technologyUse),
  pct(item.infrastructureReadiness),
  pct(item.backupPractices),
  pct(item.cloudToolsUse),
  pct(item.securityTrust),
  pct(item.willingnessToAdopt)
]))}

The best-performing sector is ${val(top(sectors).sector)} with an average readiness score of ${pct(top(sectors).averageReadiness)}. The weakest sector is ${val(sectors[sectors.length - 1]?.sector)} with an average score of ${pct(sectors[sectors.length - 1]?.averageReadiness)}. The difference between these sectors shows that adoption strategies should be sector-specific.

## 13.2 Awareness by Sector

Cloud awareness differs across sectors because organizations have different exposure to digital systems, customer expectations, and technical staff. Sectors with stronger awareness are better positioned for adoption campaigns that focus on implementation. Sectors with weaker awareness need basic cloud concepts, demonstrations, and simple examples before migration.

## 13.3 Technology Use by Sector

Technology-use scores identify sectors that already use digital systems and devices. High technology-use sectors can be targeted for advanced services such as analytics, online accounting, and integrated systems. Lower technology-use sectors may need foundational digitization, device access, and basic software training.

## 13.4 Cloud Use by Sector

Cloud-use scores reveal actual adoption depth. Sectors with higher cloud-use scores may already depend on online platforms and can benefit from governance and security improvements. Sectors with lower scores require introductory cloud packages and migration support.

## 13.5 Infrastructure and Security by Sector

Infrastructure and security scores explain why some sectors may be willing to adopt cloud services but still delay implementation. Strong willingness with weak infrastructure suggests external constraints. Strong infrastructure with weak security trust suggests a need for awareness, policy, and control mechanisms.

# Chapter 14 — Cloud Readiness Assessment

## 14.1 Overall Readiness

The average readiness score is ${num(totals.averageCloudReadinessScore)} out of 100. According to the system's readiness bands, scores below 40 are Low, scores from 40 to 69 are Medium, and scores of 70 or higher are High. Therefore, the overall sample is classified as ${readinessBand(totals.averageCloudReadinessScore || 0)} readiness.

## 14.2 Readiness Distribution

${mdTable(['Readiness band', 'Responses', 'Percentage'], readinessDistribution.map((item) => [item.band, item.count, pct(item.percentage)]))}

The readiness distribution shows the spread of organizations across readiness categories. This is more informative than the average alone because a moderate average can hide a mix of highly ready and low-ready organizations.

## 14.3 Factor Breakdown

${mdTable(['Readiness factor', 'Score'], factors.map((item) => [item.label, pct(item.score)]))}

The strongest factor is ${val(top(factors).label)} and the weakest factor is ${val(factors[factors.length - 1]?.label)}. Strong factors can be used as entry points for adoption, while weak factors require intervention.

## 14.4 Gap Analysis

${mdTable(['Factor', 'Current score', 'Ideal score', 'Gap'], gaps.map((item) => [item.label, pct(item.current), pct(item.ideal), pct(item.gap)]))}

The largest gap is ${val(top(gaps).label)} at ${pct(top(gaps).gap)}. This gap should be treated as the most urgent improvement area because it has the greatest distance from ideal readiness.

## 14.5 High, Medium, and Low Readiness Sectors

${mdTable(['Readiness category', 'Sectors'], [
  ['High', sectors.filter((item) => item.averageReadiness >= 70).map((item) => item.sector).join(', ') || 'None'],
  ['Medium', sectors.filter((item) => item.averageReadiness >= 40 && item.averageReadiness < 70).map((item) => item.sector).join(', ') || 'None'],
  ['Low', sectors.filter((item) => item.averageReadiness < 40).map((item) => item.sector).join(', ') || 'None']
])}

High-readiness sectors are suitable for advanced cloud adoption, integration, and governance improvements. Medium-readiness sectors require phased adoption and targeted support. Low-readiness sectors require awareness, basic digitalization, infrastructure support, and low-risk pilot services.

# Chapter 15 — Key Findings

${findings.map((item, index) => `${index + 1}. ${item}`).join('\n')}

# Chapter 16 — Recommendations

## 16.1 Organization-Level Recommendations

1. Begin with high-value, low-complexity cloud services such as online backup, cloud storage, email hosting, and business communication tools.
2. Establish routine backup schedules because the system reports a backup practice rate of ${pct(totals.backupPracticeRate)} and storage behavior varies across respondents.
3. Train staff on passwords, access control, file sharing, phishing awareness, and recovery procedures to address security trust concerns.
4. Select cloud services according to actual business needs: ${shortFreq(analytics, 'q28', 5)}.
5. Create simple internal policies for who can access data, who can approve cloud accounts, and how data should be backed up.
6. Use readiness factor scores to plan adoption: strengthen weak areas before migrating critical systems.

## 16.2 Sector-Level Recommendations

1. High-readiness sectors such as ${val(top(sectors).sector)} should move toward structured cloud governance, integrated business applications, and analytics.
2. Medium-readiness sectors should adopt cloud services in phases, beginning with storage, backup, and communication tools before moving to accounting, inventory, or customer management.
3. Low-readiness sectors should receive awareness programs, demonstrations, and basic digital-skills training.
4. Sector associations should negotiate affordable cloud-service bundles with local support.
5. Training content should be sector-specific. For example, healthcare requires privacy and continuity, education requires collaboration and records, retail requires inventory and POS integration, and finance-related businesses require strong security and access controls.

## 16.3 National-Level Recommendations

1. Improve internet reliability and affordability because infrastructure stability is ${pct(totals.infrastructureStabilityRate)} and infrastructure is a key readiness factor.
2. Support digital-skills programs focused on small businesses, managers, and operational staff.
3. Develop cloud-security awareness guidance in Somali and English, including practical examples of encryption, access control, backup, and account recovery.
4. Encourage local technology providers to offer managed cloud onboarding, migration, and support services.
5. Promote business-continuity planning through cloud backup and secure data storage.
6. Build partnerships among universities, business associations, telecom providers, and technology firms to support responsible cloud adoption.

## 16.4 System-Generated Recommendations

${(finalReport.recommendations || analytics.recommendations || []).map((item, index) => `${index + 1}. ${item}`).join('\n')}

# Chapter 17 — Conclusion

This study analyzed cloud computing readiness, challenges, and adoption across surveyed business sectors in Somalia using actual data from the Cloud Computing Survey Analytics System. The evidence base includes ${totals.totalResponses || 0} responses from ${totals.totalSectorsCovered || 0} sectors and ${totals.totalDistrictsCovered || 0} districts. The overall cloud readiness score is ${num(totals.averageCloudReadinessScore)} out of 100, with awareness at ${pct(totals.awarenessRate)}, current cloud-tools usage at ${pct(totals.cloudToolsUsageRate)}, backup practice at ${pct(totals.backupPracticeRate)}, infrastructure stability at ${pct(totals.infrastructureStabilityRate)}, security trust at ${pct(totals.securityTrustRate)}, and adoption willingness at ${pct(totals.adoptionWillingnessRate)}.

The results show that cloud adoption in Somalia is possible but uneven. Some sectors demonstrate stronger readiness, while others require foundational support. The strongest readiness area is ${val(top(factors).label)}, while the largest gap is ${val(top(gaps).label)}. The most common adoption barrier is ${val(top(analytics.commonBarriers || []).answer)}, and the leading cloud-security concern is ${val(top(analytics.securityConcerns || []).answer)}. These findings confirm that successful adoption requires more than access to software. It requires awareness, skills, infrastructure, trust, affordability, backup culture, and sector-sensitive implementation.

The future outlook is positive if stakeholders act on the evidence. Organizations should start with practical cloud services that solve immediate problems. Sectors should design phased adoption pathways according to readiness level. National stakeholders should support infrastructure, skills, cybersecurity awareness, and local technical support. With these measures, cloud computing can contribute to stronger business continuity, better data protection, improved collaboration, and more efficient operations across Somalia's business sectors.

## Appendix A — Question-Level Frequency Tables

${Array.from({ length: 30 }, (_, index) => {
  const code = `q${index + 1}`;
  return `### ${code.toUpperCase()}. ${question(analytics, code)}\n\n${freqTable(analytics, code)}`;
}).join('\n\n')}

## Appendix B — District Comparison

${mdTable(['District', 'Responses', 'Average readiness', 'Awareness', 'Technology use', 'Infrastructure', 'Backup', 'Cloud use', 'Security', 'Willingness'], districts.map((item) => [
  item.district,
  item.responses,
  pct(item.averageReadiness),
  pct(item.cloudAwareness),
  pct(item.technologyUse),
  pct(item.infrastructureReadiness),
  pct(item.backupPractices),
  pct(item.cloudToolsUse),
  pct(item.securityTrust),
  pct(item.willingnessToAdopt)
]))}

## Appendix C — Evidence Files

The analytics evidence JSON used to generate this report is saved at \`reports/cloud-readiness-analytics.json\`. The report text is saved at \`reports/cloud-computing-readiness-somalia-report.md\`.
`;
};

const flattenValues = (value) => {
  if (Array.isArray(value)) return value.map((item) => String(item ?? '').trim()).filter(Boolean);
  const text = String(value ?? '').trim();
  if (!text) return [];
  return text.split(',').map((item) => item.trim()).filter(Boolean);
};

const frequencyFromValues = (values, totalResponses = 0) => {
  const counts = new Map();
  values.forEach((value) => {
    flattenValues(value).forEach((item) => counts.set(item, (counts.get(item) || 0) + 1));
  });
  const total = Array.from(counts.values()).reduce((sum, count) => sum + count, 0);
  return Array.from(counts.entries())
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([answer, count]) => ({
      answer,
      label: answer,
      count,
      percentage: total ? Number(((count / total) * 100).toFixed(2)) : 0,
      responsePercentage: totalResponses ? Number(((count / totalResponses) * 100).toFixed(2)) : 0
    }));
};

const qualityScore = (value) => ({
  'Aad u fiican': 100,
  Fiican: 80,
  Dhexdhexaad: 60,
  Hooseeya: 30,
  Hoose: 30,
  'Aad u hooseeya': 10,
  'Aad u badan': 100,
  Badan: 80,
  Yar: 35,
  Maya: 0,
  Haa: 100
}[String(value ?? '').trim()] ?? 50);

const yesScore = (value) => (String(value ?? '').trim() === 'Haa' ? 100 : 0);
const reverseYesScore = (value) => (String(value ?? '').trim() === 'Haa' ? 0 : 100);

const backupScore = (value) => ({
  Maalinle: 100,
  'Maalin kasta': 100,
  Toddobaadle: 80,
  Bille: 60,
  Mararka: 35,
  Marnaba: 0
}[String(value ?? '').trim()] ?? qualityScore(value));

const interruptionScore = (value) => ({
  Marna: 100,
  'Marar dhif ah': 75,
  Mararka: 55,
  Badanaa: 25,
  'Had iyo jeer': 10
}[String(value ?? '').trim()] ?? 50);

const storageScore = (value) => ({
  Warqado: 10,
  Computer: 40,
  'Computer local ah': 40,
  'External hard disk': 60,
  Cloud: 100,
  'Cloud storage': 100,
  Server: 80
}[String(value ?? '').trim()] ?? 50);

const meanValue = (values) => {
  const clean = values.filter((value) => Number.isFinite(value));
  return clean.length ? clean.reduce((sum, value) => sum + value, 0) / clean.length : 0;
};

const themeRules = [
  { theme: 'Data storage, backup, and document management', keywords: ['backup', 'kayd', 'xog', 'dukumenti', 'document'] },
  { theme: 'Security and data protection', keywords: ['amn', 'sir', 'xatooyo', 'security', 'ilaalin'] },
  { theme: 'Training, awareness, and skills', keywords: ['tababar', 'wacyi', 'xirfad', 'aqoon'] },
  { theme: 'Infrastructure, internet, power, and cost', keywords: ['internet', 'koronto', 'qiime', 'kharash', 'jaban'] },
  { theme: 'Efficiency, management, and collaboration', keywords: ['hufnaan', 'fudud', 'maamul', 'shaqo', 'wada'] },
  { theme: 'Future growth of cloud computing in Somalia', keywords: ['mustaqbal', 'soomaaliya', 'kori', 'cloud'] }
];

const stopWords = new Set(['iyo', 'ama', 'waa', 'wax', 'in', 'la', 'oo', 'ka', 'ku', 'ay', 'uu', 'u', 'ah', 'ee', 'si', 'leh']);

const textAnalysisFor = (responses) => {
  const texts = responses.map((item) => String(item || '').trim()).filter(Boolean);
  const wordCounts = new Map();
  const themes = themeRules.map((rule) => ({ ...rule, count: 0, examples: [] }));

  texts.forEach((text) => {
    const normalized = text.toLowerCase();
    normalized
      .replace(/[^\p{L}\p{N}\s'-]/gu, ' ')
      .split(/\s+/)
      .map((word) => word.trim())
      .filter((word) => word.length > 2 && !stopWords.has(word))
      .forEach((word) => wordCounts.set(word, (wordCounts.get(word) || 0) + 1));

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
  });

  return {
    totalResponses: texts.length,
    themes: themes
      .filter((theme) => theme.count)
      .sort((left, right) => right.count - left.count)
      .map((theme) => ({ ...theme, percentage: texts.length ? Number(((theme.count / texts.length) * 100).toFixed(2)) : 0 })),
    keywords: Array.from(wordCounts.entries())
      .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
      .slice(0, 20)
      .map(([keyword, count]) => ({ keyword, count })),
    sampleResponses: texts.slice(0, 8)
  };
};

const snapshotAnswer = (response, code) => {
  const detail = (response.answerDetails || []).find((item) => item.code === code);
  if (detail) return detail.value;
  return toPlainAnswers(response.answers)[code];
};

const snapshotQuestion = (responses, code) => {
  for (const response of responses) {
    const detail = (response.answerDetails || []).find((item) => item.code === code);
    if (detail?.questionText) return detail.questionText;
  }
  return code;
};

const buildSnapshotAnalytics = (responses) => {
  const total = responses.length;
  const codes = Array.from({ length: 30 }, (_, index) => `q${index + 1}`);
  const frequencyAnalysis = {};
  const questionAnalysis = [];

  codes.forEach((code) => {
    const questionText = snapshotQuestion(responses, code);
    const values = responses.map((response) => snapshotAnswer(response, code));
    const firstDetail = responses.flatMap((response) => response.answerDetails || []).find((detail) => detail.code === code);
    const answers = frequencyFromValues(values, total);
    frequencyAnalysis[code] = { question: questionText, answers };
    questionAnalysis.push({
      code,
      question: questionText,
      type: firstDetail?.type || 'unknown',
      scoringKey: firstDetail?.scoringKey || 'none',
      totalResponses: values.filter((value) => flattenValues(value).length).length,
      answers
    });
  });

  const sectorDistribution = frequencyFromValues(responses.map((response) => snapshotAnswer(response, 'q1') || response.sector?.name), total);
  const districtDistribution = frequencyFromValues(responses.map((response) => response.district), total);
  const readinessScores = responses.map((response) => Number(response.readinessScore || 0)).filter((score) => Number.isFinite(score));
  const sortedScores = [...readinessScores].sort((a, b) => a - b);
  const median = sortedScores.length % 2
    ? sortedScores[Math.floor(sortedScores.length / 2)]
    : meanValue([sortedScores[sortedScores.length / 2 - 1], sortedScores[sortedScores.length / 2]]);

  const scoreResponse = (response) => {
    const indicatorScores = {
      awareness: meanValue([yesScore(snapshotAnswer(response, 'q5')), qualityScore(snapshotAnswer(response, 'q6'))]),
      technology: meanValue([snapshotAnswer(response, 'q8') ? 75 : 0, yesScore(snapshotAnswer(response, 'q9')), yesScore(snapshotAnswer(response, 'q22')), yesScore(snapshotAnswer(response, 'q26'))]),
      infrastructure: meanValue([yesScore(snapshotAnswer(response, 'q10')), qualityScore(snapshotAnswer(response, 'q11')), yesScore(snapshotAnswer(response, 'q18')), interruptionScore(snapshotAnswer(response, 'q19')), reverseYesScore(snapshotAnswer(response, 'q20'))]),
      backup: meanValue([storageScore(snapshotAnswer(response, 'q12')), backupScore(snapshotAnswer(response, 'q13')), interruptionScore(snapshotAnswer(response, 'q14'))]),
      cloudTools: meanValue([yesScore(snapshotAnswer(response, 'q15')), snapshotAnswer(response, 'q16') ? 80 : 0, qualityScore(snapshotAnswer(response, 'q17'))]),
      securityTrust: qualityScore(snapshotAnswer(response, 'q24')),
      willingness: meanValue([yesScore(snapshotAnswer(response, 'q27')), snapshotAnswer(response, 'q28') ? 100 : 0])
    };
    return indicatorScores;
  };

  const enriched = responses.map((response) => ({
    response,
    sector: String(snapshotAnswer(response, 'q1') || response.sector?.name || 'Unknown'),
    district: String(response.district || 'Unknown'),
    readinessScore: Number(response.readinessScore || 0),
    readinessBand: response.readinessBand || readinessBand(Number(response.readinessScore || 0)),
    indicators: scoreResponse(response)
  }));

  const groupRows = (keyName) => {
    const grouped = new Map();
    enriched.forEach((item) => {
      const label = item[keyName] || 'Unknown';
      if (!grouped.has(label)) grouped.set(label, []);
      grouped.get(label).push(item);
    });
    return Array.from(grouped.entries())
      .map(([label, items]) => ({
        [keyName === 'sector' ? 'sector' : 'district']: label,
        label,
        responses: items.length,
        averageReadiness: Number(meanValue(items.map((item) => item.readinessScore)).toFixed(2)),
        awareness: Number(meanValue(items.map((item) => item.indicators.awareness)).toFixed(2)),
        technology: Number(meanValue(items.map((item) => item.indicators.technology)).toFixed(2)),
        infrastructure: Number(meanValue(items.map((item) => item.indicators.infrastructure)).toFixed(2)),
        backup: Number(meanValue(items.map((item) => item.indicators.backup)).toFixed(2)),
        cloudTools: Number(meanValue(items.map((item) => item.indicators.cloudTools)).toFixed(2)),
        securityTrust: Number(meanValue(items.map((item) => item.indicators.securityTrust)).toFixed(2)),
        willingness: Number(meanValue(items.map((item) => item.indicators.willingness)).toFixed(2))
      }))
      .sort((left, right) => right.averageReadiness - left.averageReadiness);
  };

  const bands = ['Low', 'Medium', 'High'].map((band) => {
    const count = enriched.filter((item) => item.readinessBand === band).length;
    return { band, label: band, count, percentage: total ? Number(((count / total) * 100).toFixed(2)) : 0 };
  });

  const factorSummary = [
    ['awareness', 'Cloud awareness'],
    ['technology', 'Technology usage'],
    ['infrastructure', 'Infrastructure readiness'],
    ['backup', 'Data storage and backup'],
    ['cloudTools', 'Cloud usage'],
    ['securityTrust', 'Security confidence'],
    ['willingness', 'Adoption readiness']
  ].map(([factor, label]) => ({
    factor,
    label,
    score: Number(meanValue(enriched.map((item) => item.indicators[factor])).toFixed(2))
  })).sort((left, right) => right.score - left.score);

  const gapAnalysis = factorSummary
    .map((item) => ({ factor: item.factor, label: item.label, current: item.score, ideal: 100, gap: Number((100 - item.score).toFixed(2)) }))
    .sort((left, right) => right.gap - left.gap);

  const textAnalysis = textAnalysisFor([
    ...responses.map((response) => snapshotAnswer(response, 'q7')),
    ...responses.map((response) => snapshotAnswer(response, 'q28')),
    ...responses.map((response) => snapshotAnswer(response, 'q29')),
    ...responses.map((response) => snapshotAnswer(response, 'q30'))
  ]);

  const totals = {
    totalResponses: total,
    totalSectorsCovered: sectorDistribution.length,
    totalDistrictsCovered: districtDistribution.length,
    responsesToday: 0,
    responsesThisWeek: total,
    averageCloudReadinessScore: Number(meanValue(readinessScores).toFixed(2)),
    awarenessRate: frequencyAnalysis.q5.answers.find((item) => item.answer === 'Haa')?.percentage || 0,
    adoptionWillingnessRate: frequencyAnalysis.q27.answers.find((item) => item.answer === 'Haa')?.percentage || 0,
    cloudToolsUsageRate: frequencyAnalysis.q15.answers.find((item) => item.answer === 'Haa')?.percentage || 0,
    backupPracticeRate: frequencyAnalysis.q13.answers.filter((item) => !['Marnaba', 'Marna'].includes(item.answer)).reduce((sum, item) => sum + item.percentage, 0),
    infrastructureStabilityRate: Number(meanValue(enriched.map((item) => item.indicators.infrastructure)).toFixed(2)),
    securityTrustRate: Number(meanValue(enriched.map((item) => item.indicators.securityTrust)).toFixed(2))
  };

  const sectors = groupRows('sector');
  const districts = groupRows('district');
  const variance = meanValue(readinessScores.map((score) => (score - totals.averageCloudReadinessScore) ** 2));

  return {
    generatedAt: new Date().toISOString(),
    totals,
    frequencyAnalysis,
    questionAnalysis,
    sectorDistribution,
    districtDistribution,
    sectorComparison: { rows: sectors },
    districtComparison: { rows: districts },
    readinessStats: {
      average: totals.averageCloudReadinessScore,
      median: Number((median || 0).toFixed(2)),
      min: sortedScores[0] || 0,
      max: sortedScores[sortedScores.length - 1] || 0
    },
    readiness: {
      overallAverage: totals.averageCloudReadinessScore,
      distribution: bands,
      sectorLeaderboard: sectors,
      districtLeaderboard: districts
    },
    factorSummary,
    gapAnalysis: { overall: gapAnalysis },
    commonBarriers: frequencyAnalysis.q21.answers,
    securityConcerns: frequencyAnalysis.q25.answers,
    cloudTools: frequencyAnalysis.q16.answers,
    cloudNeeds: frequencyAnalysis.q28.answers,
    businessNeeds: {
      openEndedQuestions: {
        q7: textAnalysisFor(responses.map((response) => snapshotAnswer(response, 'q7'))),
        q28: textAnalysisFor(responses.map((response) => snapshotAnswer(response, 'q28'))),
        q29: textAnalysisFor(responses.map((response) => snapshotAnswer(response, 'q29'))),
        q30: textAnalysisFor(responses.map((response) => snapshotAnswer(response, 'q30')))
      },
      themeCards: textAnalysis.themes,
      groupedTopicBlocks: textAnalysis.themes.map((item) => ({ topic: item.theme, count: item.count, percentage: item.percentage, examples: item.examples })),
      keywordChart: textAnalysis.keywords,
      mostCommonRecommendationTheme: textAnalysis.themes[0]?.theme || 'No dominant theme'
    },
    summaryFindings: [
      `${total} responses were analyzed across ${sectorDistribution.length} sectors and ${districtDistribution.length} districts.`,
      `The average stored cloud readiness score is ${totals.averageCloudReadinessScore} out of 100.`,
      `The most represented sector is ${sectorDistribution[0]?.answer || 'No sector'}.`,
      `The highest readiness sector is ${sectors[0]?.sector || 'No sector'}.`,
      `The most common adoption barrier is ${frequencyAnalysis.q21.answers[0]?.answer || 'No barrier'}.`,
      `The strongest indicator area is ${factorSummary[0]?.label || 'No factor'}, while the largest indicator gap is ${gapAnalysis[0]?.label || 'No factor'}.`
    ],
    recommendations: [
      'Prioritize low-cost cloud storage and online backup services for organizations still using local or paper-based storage.',
      'Deliver practical cloud-awareness and cybersecurity training in Somali for owners, managers, and operational staff.',
      'Address infrastructure constraints through backup power, reliable connectivity, and phased migration plans.',
      'Use high-readiness sectors as early adoption examples while supporting low-readiness sectors with basic digitization.',
      'Create clear access-control, password, and recovery policies before moving sensitive business data to cloud platforms.'
    ],
    descriptiveStatistics: {
      responsesBySector: sectorDistribution.length,
      responsesByDistrict: districtDistribution.length,
      stdDeviationReadiness: Number(Math.sqrt(variance).toFixed(2))
    },
    dataSourceNote:
      'The populated database stores the collected survey instrument in SurveyResponse.answerDetails snapshots. The current SurveyQuestion master differs from these snapshots, so this report analyzes the stored snapshots to preserve the actual collected answers.'
  };
};

const freq = (analytics, code) => analytics.frequencyAnalysis?.[code]?.answers || [];
const qText = (analytics, code) => analytics.frequencyAnalysis?.[code]?.question || code;
const topAnswer = (analytics, code, index = 0) => freq(analytics, code)[index] || {};
const freqMd = (analytics, code) =>
  mdTable(['Response', 'Frequency', 'Percentage of selections', 'Percentage of respondents'], freq(analytics, code).map((item) => [item.answer, item.count, pct(item.percentage), pct(item.responsePercentage)]));

const interpretBlock = (analytics, code, figure, table) => {
  const first = topAnswer(analytics, code);
  const second = topAnswer(analytics, code, 1);
  return `#### Figure ${figure}. ${qText(analytics, code)}

Figure ${figure} and Table ${table} summarize the actual response distribution for "${qText(analytics, code)}". The leading response is ${val(first.answer)} with ${first.count || 0} selections (${pct(first.percentage)} of selections; ${pct(first.responsePercentage)} of respondents).${second.answer ? ` The next response is ${second.answer} with ${pct(second.percentage)} of selections.` : ''} The implication is that this item should be treated as a practical indicator of the current operating condition among the surveyed organizations.

${freqMd(analytics, code)}`;
};

const buildSnapshotReport = (analytics, charts) => {
  const totals = analytics.totals;
  const sectors = analytics.sectorComparison.rows;
  const districts = analytics.districtComparison.rows;
  const factors = analytics.factorSummary;
  const gaps = analytics.gapAnalysis.overall;
  const readinessRows = analytics.readiness.distribution;
  const generated = new Date(analytics.generatedAt).toLocaleString('en-US', { timeZone: 'Africa/Nairobi' });
  const topFindings = [
    `The analysis covers ${totals.totalResponses} collected responses, ${totals.totalSectorsCovered} sectors, and ${totals.totalDistrictsCovered} districts.`,
    `The average stored readiness score is ${num(totals.averageCloudReadinessScore)} out of 100, with a median of ${num(analytics.readinessStats.median)}.`,
    `Readiness distribution is ${readinessRows.map((item) => `${item.band}: ${item.count} (${pct(item.percentage)})`).join(', ')}.`,
    `Cloud awareness is ${pct(totals.awarenessRate)} based on respondents who answered Haa to prior awareness of cloud computing.`,
    `Current cloud-service usage is ${pct(totals.cloudToolsUsageRate)} based on use of services such as Google Drive, OneDrive, or Dropbox.`,
    `Adoption willingness is ${pct(totals.adoptionWillingnessRate)} based on willingness to use a cloud solution if available.`,
    `The strongest derived indicator area is ${factors[0]?.label} (${pct(factors[0]?.score)}), while the largest indicator gap is ${gaps[0]?.label} (${pct(gaps[0]?.gap)}).`,
    `The highest readiness sector is ${sectors[0]?.sector} with an average readiness score of ${pct(sectors[0]?.averageReadiness)}.`,
    `The most common adoption barrier is ${topAnswer(analytics, 'q21').answer}.`,
    `The dominant open-ended theme is ${analytics.businessNeeds.mostCommonRecommendationTheme}.`
  ];

  return `# Cloud Computing Readiness, Challenges, and Adoption Across Business Sectors in Somalia

## Complete Professional Research Report

**Generated from:** Cloud Computing Survey Analytics System  
**Generated at:** ${generated} East Africa Time  
**Data source:** MongoDB database \`cloud_survey_system\`, using stored \`SurveyResponse.answerDetails\` snapshots  
**Evidence base:** ${totals.totalResponses} collected survey responses, ${totals.totalSectorsCovered} sectors, ${totals.totalDistrictsCovered} districts  

## Abstract

This report analyzes cloud computing readiness, challenges, and adoption across business sectors in Somalia using the actual collected survey responses stored in the Cloud Computing Survey Analytics System. The populated dataset contains ${totals.totalResponses} valid response documents across ${totals.totalSectorsCovered} sectors and ${totals.totalDistrictsCovered} districts. The system-stored average cloud readiness score is ${num(totals.averageCloudReadinessScore)} out of 100, with a minimum score of ${analytics.readinessStats.min}, median score of ${analytics.readinessStats.median}, maximum score of ${analytics.readinessStats.max}, and standard deviation of ${analytics.descriptiveStatistics.stdDeviationReadiness}.

The findings show a medium overall readiness position. Cloud awareness is ${pct(totals.awarenessRate)}, current cloud-service usage is ${pct(totals.cloudToolsUsageRate)}, backup practice coverage is ${pct(totals.backupPracticeRate)}, infrastructure stability is ${pct(totals.infrastructureStabilityRate)}, security confidence is ${pct(totals.securityTrustRate)}, and adoption willingness is ${pct(totals.adoptionWillingnessRate)}. Sector comparison indicates that ${sectors[0]?.sector} has the highest average readiness score, while ${sectors[sectors.length - 1]?.sector} has the lowest. The most repeated adoption barrier is ${topAnswer(analytics, 'q21').answer}, and the most repeated cloud-security concern is ${topAnswer(analytics, 'q25').answer}.

## Methodological Note on Actual Data

The project currently contains two survey layers: the current question master in \`SurveyQuestion\`, and the collected response snapshots stored in \`SurveyResponse.answerDetails\`. The populated database contains 24 collected responses whose stored question snapshots differ from the current question master. To avoid fake data and to avoid blanking legacy responses, this report analyzes the stored response snapshots directly. This preserves the actual question text, answer values, readiness scores, sector names, and dates that exist in the system.

## List of Figures and Available Chart Files

Figures in this report are referenced as analytical figure descriptions based on the system frequency tables. The latest generated PNG chart files available in the analytics system are listed below.

${mdTable(['Chart type', 'Latest generated file'], Object.entries(charts).map(([key, file]) => [key, file || 'No generated PNG found']))}

# Chapter 1 — Introduction

## 1.1 Background of Cloud Computing

Cloud computing is the delivery of computing resources and digital services through internet-based platforms. These resources include online storage, backup, software applications, collaboration tools, databases, communication systems, analytics services, and business-management platforms. For organizations, cloud computing reduces the need to own every server, backup device, and software environment locally. Instead, businesses can access services through subscription, managed hosting, or usage-based arrangements.

In the Somali business context, cloud computing has practical relevance because many organizations need safer storage, reliable backup, mobile access, collaboration, and lower-cost access to modern software. The survey responses show that cloud computing is not only a technical subject; it is connected to business continuity, cost, staff skills, internet reliability, electricity stability, data security, and organizational confidence.

## 1.2 Importance of Digital Transformation

Digital transformation is the process of improving business operations through digital tools, digital records, online systems, automation, and data-driven management. It includes devices, software, employee skills, digital workflows, and the ability to protect and use information. In this dataset, technology use is visible through device usage, business software use, internet access, and demand for modern digital systems.

The key technology indicators show that the leading daily device is ${topAnswer(analytics, 'q8').answer}, while ${pct(topAnswer(analytics, 'q9').responsePercentage)} of respondents selected ${topAnswer(analytics, 'q9').answer} for business-management software usage. These findings indicate the current digital baseline for the surveyed organizations.

## 1.3 Importance of Cloud Adoption

Cloud adoption matters because organizations increasingly need data availability, backup reliability, remote access, communication, and digital continuity. When implemented responsibly, cloud services can reduce the effect of local device failure, improve access to files, support collaboration, and strengthen business recovery.

The dataset reports current cloud-service usage of ${pct(totals.cloudToolsUsageRate)} and adoption willingness of ${pct(totals.adoptionWillingnessRate)}. This relationship is central to the study: willingness indicates perceived value, while current usage indicates actual implementation.

## 1.4 Context of Somalia

Somalia's business environment is shaped by expanding digital communication, mobile money, online services, and a growing need for secure information management. At the same time, organizations may face infrastructure limitations, cost constraints, skills gaps, and security concerns. The survey data captures these issues through responses about internet availability, power continuity, barriers, security concerns, training needs, and cloud adoption willingness.

## 1.5 Problem Statement

Although cloud computing can support business modernization, many Somali organizations face uncertainty about readiness, costs, skills, infrastructure, backup practices, and security. Without empirical survey evidence, cloud adoption discussions risk remaining general and unsupported. This study addresses the problem by analyzing actual collected survey responses across business sectors and identifying readiness levels, adoption barriers, sector differences, and practical recommendations.

## 1.6 Research Objectives

1. To assess cloud computing awareness among surveyed organizations.
2. To examine current technology and software usage.
3. To analyze data storage, backup, and data-loss experience.
4. To assess current cloud usage and perceived cloud benefits.
5. To evaluate infrastructure readiness through internet and electricity indicators.
6. To identify security concerns, training needs, and adoption barriers.
7. To compare readiness across sectors and districts.
8. To provide practical recommendations at organization, sector, and national levels.

## 1.7 Research Questions

1. What level of cloud awareness exists among the surveyed organizations?
2. What technologies and software systems are currently used?
3. How do organizations store and back up business data?
4. How many organizations currently use cloud services?
5. How do internet and electricity conditions affect readiness?
6. What security concerns and barriers limit adoption?
7. Which sectors show stronger or weaker readiness?
8. What actions can improve cloud adoption in Somalia?

## 1.8 Scope of Study

The study covers ${totals.totalResponses} responses collected across ${totals.totalSectorsCovered} sectors and ${totals.totalDistrictsCovered} districts. It focuses on cloud computing readiness, technology use, backup behavior, cloud use, infrastructure, security, business needs, sector comparison, and open-ended respondent recommendations.

## 1.9 Significance of Study

The report is useful for business owners, managers, IT staff, cloud providers, educators, policymakers, and researchers. It provides evidence-based insight into what organizations already know, what they use, what they fear, and what support they need to adopt cloud computing responsibly.

# Chapter 2 — Literature Review

## 2.1 Cloud Computing Concepts

Cloud computing is a service model in which computing resources are delivered through networks. It supports flexibility, shared resources, scalability, remote access, and managed service delivery. In business settings, the most familiar forms are cloud storage, online backup, email hosting, online accounting, collaboration platforms, customer systems, and analytics tools.

## 2.2 Cloud Service Models

Cloud services are commonly grouped into Infrastructure as a Service, Platform as a Service, and Software as a Service. For many surveyed businesses, Software as a Service is the most immediate model because it includes tools such as Google Drive, OneDrive, Dropbox, email platforms, online accounting, and document-management services.

## 2.3 Cloud Deployment Models

Deployment models include public cloud, private cloud, hybrid cloud, and community cloud. The survey responses mostly relate to public and SaaS-based services because respondents mention online storage, backup, and widely available cloud tools. For small and medium organizations, these models are often more realistic than building private cloud infrastructure.

## 2.4 Benefits of Cloud Computing

Benefits include improved backup, lower upfront infrastructure cost, easier collaboration, remote access, faster recovery, better data management, and improved operational efficiency. The open-ended responses repeatedly refer to backup, data storage, document management, training, cost, and the future of cloud computing in Somalia.

## 2.5 Challenges of Cloud Adoption

Common challenges include cost, internet reliability, power stability, limited cloud skills, security concerns, weak trust, and lack of technical support. The survey's leading barrier is ${topAnswer(analytics, 'q21').answer}, which confirms that adoption depends on more than awareness alone.

## 2.6 Previous Studies and African Context

Studies on cloud adoption often emphasize perceived usefulness, ease of use, security, cost, infrastructure, skills, and management support. These themes are also visible in African business environments, where cloud computing can reduce infrastructure burdens but depends heavily on reliable connectivity, electricity, and digital skills.

## 2.7 Somalia Context

In Somalia, cloud computing can support business continuity and digital modernization, but adoption must be grounded in local realities. The survey results show demand for modern digital systems, training, affordable services, secure storage, and improved infrastructure.

# Chapter 3 — Methodology

## 3.1 Research Design

The study uses a descriptive quantitative survey design supported by qualitative open-ended analysis. Frequencies and percentages are used for closed questions. Stored readiness scores are used for readiness assessment. Thematic and keyword analysis is used for open-ended responses.

## 3.2 Survey Design and Data Collection

The analyzed instrument contains 30 stored survey questions. It includes short text, numeric, yes/no, single-select, multiple-choice, and paragraph questions. Responses were collected and stored in MongoDB as survey response documents with answer snapshots, sector, district, readiness score, readiness band, awareness indicator, willingness indicator, and submission metadata.

## 3.3 Sampling Method and Sample Size

The dataset contains ${totals.totalResponses} valid responses. It covers ${totals.totalSectorsCovered} sectors and ${totals.totalDistrictsCovered} districts. The sampling approach is survey-based sectoral sampling of accessible organizations, not a national census.

${mdTable(['Metric', 'Value'], [
  ['Total responses', totals.totalResponses],
  ['Sectors covered', totals.totalSectorsCovered],
  ['Districts covered', totals.totalDistrictsCovered],
  ['Average stored readiness score', num(totals.averageCloudReadinessScore)],
  ['Median readiness score', num(analytics.readinessStats.median)],
  ['Readiness standard deviation', analytics.descriptiveStatistics.stdDeviationReadiness]
])}

## 3.4 Business Sectors Covered

${mdTable(['Sector', 'Responses', 'Percentage'], analytics.sectorDistribution.map((item) => [item.answer, item.count, pct(item.responsePercentage)]))}

## 3.5 Data Analysis Approach

The report uses actual stored answer values. Frequencies were calculated for each question. Sector and district comparison were calculated from stored readiness scores and derived indicator rates. Open-ended answers were grouped into themes using repeated keywords and topic patterns. Readiness assessment uses the readiness scores and bands already stored with each response by the system.

# Chapter 4 — Respondent Profile Analysis

## 4.1 Sector Distribution

${interpretBlock(analytics, 'q1', 1, 1)}

The sector distribution shows that the most represented sector is ${topAnswer(analytics, 'q1').answer}. Sector distribution matters because it affects the weight of the overall readiness average and the interpretation of sector comparisons.

## 4.2 District Distribution

Figure 2 summarizes the district profile. The most represented district is ${analytics.districtDistribution[0]?.answer} with ${analytics.districtDistribution[0]?.count} responses (${pct(analytics.districtDistribution[0]?.responsePercentage)}).

${mdTable(['District', 'Responses', 'Percentage'], analytics.districtDistribution.map((item) => [item.answer, item.count, pct(item.responsePercentage)]))}

## 4.3 Organization Age and Employee Size

${interpretBlock(analytics, 'q2', 3, 3)}

${interpretBlock(analytics, 'q3', 4, 4)}

Organization age and employee size indicate operational maturity and capacity. Smaller and younger organizations may prefer low-cost cloud services, while larger organizations may need governance, access control, and integration planning.

## 4.4 Respondent Department or Role

${interpretBlock(analytics, 'q4', 5, 5)}

Respondent department affects the interpretation of answers. Management respondents may emphasize cost and business value, while technical staff may emphasize infrastructure and security.

# Chapter 5 — Cloud Awareness Analysis

## 5.1 Prior Awareness

${interpretBlock(analytics, 'q5', 6, 6)}

Cloud awareness is ${pct(totals.awarenessRate)}. Awareness is the first readiness condition because organizations cannot adopt a technology intentionally unless they understand its purpose and relevance.

## 5.2 Understanding Level

${interpretBlock(analytics, 'q6', 7, 7)}

The dominant understanding level is ${topAnswer(analytics, 'q6').answer}. This shows whether respondents only recognize the term cloud computing or have deeper confidence in what it means.

## 5.3 Explanation of Cloud Computing

${interpretBlock(analytics, 'q7', 8, 8)}

Open explanations show that respondents commonly associate cloud computing with online storage, internet-based software, and remote access. This is a useful foundation for awareness programs because training can connect formal cloud concepts to familiar services.

# Chapter 6 — Technology Usage Analysis

## 6.1 Devices Used

${interpretBlock(analytics, 'q8', 9, 9)}

Device availability is a practical condition for cloud use. The dominant device category is ${topAnswer(analytics, 'q8').answer}, meaning cloud solutions should be compatible with the hardware already used by organizations.

## 6.2 Business Software Usage

${interpretBlock(analytics, 'q9', 10, 10)}

Software use indicates digital maturity. Organizations that already use management software can move more easily toward cloud-based systems. Organizations that do not use software may first need basic digitization.

## 6.3 Cloud Skills and Digital-System Need

${interpretBlock(analytics, 'q22', 11, 11)}

${interpretBlock(analytics, 'q26', 12, 12)}

The responses show both the available skill base and the perceived need for modern digital systems. Training need is analyzed in Chapter 10 because it directly affects adoption.

# Chapter 7 — Data Storage & Backup Analysis

## 7.1 Data Storage Location

${interpretBlock(analytics, 'q12', 13, 13)}

Storage location is a core risk indicator. Paper and local storage increase exposure to physical loss, device failure, and limited access. Cloud storage and managed backup can reduce these risks if implemented securely.

## 7.2 Backup Practice

${interpretBlock(analytics, 'q13', 14, 14)}

Backup practice coverage is ${pct(totals.backupPracticeRate)}. Frequent backup improves business continuity and reduces the effect of hardware failure, human error, malware, or power-related disruption.

## 7.3 Data Loss Experience

${interpretBlock(analytics, 'q14', 15, 15)}

Data-loss experience provides evidence of operational risk. Even where loss is not frequent, the need for backup remains important because one major loss event can disrupt business operations.

# Chapter 8 — Cloud Usage Analysis

## 8.1 Current Cloud Service Usage

${interpretBlock(analytics, 'q15', 16, 16)}

The current cloud-service usage rate is ${pct(totals.cloudToolsUsageRate)}. This is the direct adoption indicator in the dataset.

## 8.2 Cloud Tools Used

${interpretBlock(analytics, 'q16', 17, 17)}

The most common named cloud service is ${topAnswer(analytics, 'q16').answer}. Familiar tools can become entry points for broader adoption because users already recognize their value.

## 8.3 Perceived Helpfulness of Cloud Systems

${interpretBlock(analytics, 'q17', 18, 18)}

Perceived usefulness is important because organizations are more likely to adopt technologies they believe improve work. The response distribution shows the degree to which cloud systems are seen as helpful.

# Chapter 9 — Infrastructure Analysis

## 9.1 Internet Availability and Quality

${interpretBlock(analytics, 'q10', 19, 19)}

${interpretBlock(analytics, 'q11', 20, 20)}

Internet availability and quality are central to cloud readiness. The derived infrastructure stability indicator is ${pct(totals.infrastructureStabilityRate)}.

## 9.2 Electricity Availability and Work Interruption

${interpretBlock(analytics, 'q18', 21, 21)}

${interpretBlock(analytics, 'q19', 22, 22)}

Cloud services still require powered devices, routers, and network equipment. Power interruption therefore remains a readiness constraint even when applications are hosted online.

## 9.3 Internet as an Adoption Barrier

${interpretBlock(analytics, 'q20', 23, 23)}

If respondents identify internet absence as a major barrier, adoption strategies must include connectivity planning, offline procedures, and phased migration.

# Chapter 10 — Security & Challenges Analysis

## 10.1 Main Adoption Barriers

${interpretBlock(analytics, 'q21', 24, 24)}

The leading barrier is ${topAnswer(analytics, 'q21').answer}. This result should guide intervention design because each barrier requires a different response.

## 10.2 Training Need

${interpretBlock(analytics, 'q23', 25, 25)}

Training need is a direct capacity indicator. Where training need is high, awareness campaigns should be accompanied by practical exercises in account setup, file sharing, backup, password control, and recovery.

## 10.3 Trust in Cloud Storage

${interpretBlock(analytics, 'q24', 26, 26)}

Security confidence is ${pct(totals.securityTrustRate)}. Trust is necessary for adoption, especially where organizations handle sensitive customer, financial, or operational data.

## 10.4 Cloud Security Concerns

${interpretBlock(analytics, 'q25', 27, 27)}

The most repeated security concern is ${topAnswer(analytics, 'q25').answer}. Adoption programs should directly address this issue through encryption, access control, password hygiene, permissions, audit logs, and backup policies.

# Chapter 11 — Business Needs & Adoption Readiness

## 11.1 Need for Modern Digital Systems

${interpretBlock(analytics, 'q26', 28, 28)}

Need for modern systems shows whether organizations perceive digital transformation as necessary. This result supports cloud adoption planning when paired with willingness and service needs.

## 11.2 Willingness to Use Cloud Solutions

${interpretBlock(analytics, 'q27', 29, 29)}

Adoption willingness is ${pct(totals.adoptionWillingnessRate)}. This indicates strong potential demand if cost, training, infrastructure, and security concerns are addressed.

## 11.3 Desired Cloud Services

${interpretBlock(analytics, 'q28', 30, 30)}

Desired services emphasize practical needs such as storage, backup, document management, and business administration. These needs should shape initial cloud-service packages.

# Chapter 12 — Open-Ended Response Analysis

## 12.1 Theme Analysis

${mdTable(['Theme', 'Frequency', 'Percentage', 'Example responses'], analytics.businessNeeds.themeCards.map((item) => [item.theme, item.count, pct(item.percentage), item.examples.join(' / ')]))}

The dominant open-ended theme is ${analytics.businessNeeds.mostCommonRecommendationTheme}. This theme pattern confirms that respondents frame cloud computing in terms of operational improvement rather than abstract technology.

## 12.2 Keyword Analysis

${mdTable(['Keyword', 'Frequency'], analytics.businessNeeds.keywordChart.map((item) => [item.keyword, item.count]))}

## 12.3 Topic Grouping and Response Categorization

${mdTable(['Topic', 'Frequency', 'Percentage'], analytics.businessNeeds.groupedTopicBlocks.map((item) => [item.topic, item.count, pct(item.percentage)]))}

Open-ended responses repeatedly mention backup, data, documents, training, affordability, internet, and the future growth of cloud computing in Somalia. These patterns support practical recommendations focused on training, affordable services, secure storage, and infrastructure improvement.

# Chapter 13 — Sector Comparison Analysis

## 13.1 Sector Readiness Ranking

The latest available sector-ranking chart file is ${charts['sector-ranking'] || 'not available'}.

${mdTable(['Sector', 'Responses', 'Average readiness', 'Awareness indicator', 'Technology indicator', 'Infrastructure indicator', 'Backup indicator', 'Cloud-use indicator', 'Security indicator', 'Willingness indicator'], sectors.map((item) => [
  item.sector,
  item.responses,
  pct(item.averageReadiness),
  pct(item.awareness),
  pct(item.technology),
  pct(item.infrastructure),
  pct(item.backup),
  pct(item.cloudTools),
  pct(item.securityTrust),
  pct(item.willingness)
]))}

The best-performing sector is ${sectors[0]?.sector} with an average readiness score of ${pct(sectors[0]?.averageReadiness)}. The weakest sector is ${sectors[sectors.length - 1]?.sector} with ${pct(sectors[sectors.length - 1]?.averageReadiness)}. These differences show that cloud adoption should be tailored to sector readiness.

## 13.2 Key Differences Across Sectors

Sectors with higher readiness can be targeted for more advanced services such as structured cloud backup, online accounting, access-control policies, and analytics. Sectors with lower readiness require basic cloud awareness, affordable starter packages, and support for infrastructure and skills.

# Chapter 14 — Cloud Readiness Assessment

## 14.1 Stored Readiness Scores

Readiness scores are stored in each survey response by the system. The overall average is ${num(totals.averageCloudReadinessScore)} out of 100. The median is ${num(analytics.readinessStats.median)}, the minimum is ${analytics.readinessStats.min}, and the maximum is ${analytics.readinessStats.max}.

## 14.2 Readiness Distribution

${mdTable(['Readiness band', 'Responses', 'Percentage'], readinessRows.map((item) => [item.band, item.count, pct(item.percentage)]))}

The distribution shows that most organizations are in the ${readinessRows.sort((a, b) => b.count - a.count)[0]?.band} band. This means readiness is present but still requires targeted improvement.

## 14.3 Derived Indicator Breakdown

${mdTable(['Indicator area', 'Score'], factors.map((item) => [item.label, pct(item.score)]))}

These indicators are calculated from actual response values to explain what may be driving the stored readiness scores. They should be interpreted as explanatory indicators, while the official readiness classification comes from the stored system scores.

## 14.4 Gap Analysis

${mdTable(['Indicator area', 'Current score', 'Ideal score', 'Gap'], gaps.map((item) => [item.label, pct(item.current), pct(item.ideal), pct(item.gap)]))}

The largest gap is ${gaps[0]?.label}. This area should receive priority because it is furthest from the ideal readiness condition.

## 14.5 High, Medium, and Low Readiness Sectors

${mdTable(['Readiness category', 'Sectors'], [
  ['High', sectors.filter((item) => item.averageReadiness >= 70).map((item) => item.sector).join(', ') || 'None'],
  ['Medium', sectors.filter((item) => item.averageReadiness >= 40 && item.averageReadiness < 70).map((item) => item.sector).join(', ') || 'None'],
  ['Low', sectors.filter((item) => item.averageReadiness < 40).map((item) => item.sector).join(', ') || 'None']
])}

# Chapter 15 — Key Findings

${topFindings.map((item, index) => `${index + 1}. ${item}`).join('\n')}

# Chapter 16 — Recommendations

## 16.1 Organization-Level Recommendations

1. Start with cloud storage and online backup for organizations that still rely on paper or local storage.
2. Establish regular backup schedules and assign responsibility for backup verification.
3. Train staff on passwords, access control, file sharing, account recovery, and safe use of cloud services.
4. Choose cloud services that match actual needs such as backup, document management, communication, and administration.
5. Use phased adoption: begin with non-critical data, then expand to core systems after staff become confident.

## 16.2 Sector-Level Recommendations

1. High-readiness sectors should implement governance, access-control policies, and more advanced cloud applications.
2. Medium-readiness sectors should adopt basic cloud tools first, then move toward integrated systems.
3. Low-readiness sectors should receive awareness, training, and affordable starter services.
4. Sector associations should negotiate affordable packages and local support services.
5. Sector-specific training should use examples from each sector's actual operations.

## 16.3 National-Level Recommendations

1. Improve internet reliability and affordability to support cloud-based business operations.
2. Support digital-skills and cloud-awareness programs in Somali.
3. Encourage local cloud-support providers to offer onboarding, migration, and helpdesk services.
4. Promote cybersecurity awareness focused on access control, encryption, and backup.
5. Encourage collaboration among universities, telecom providers, business associations, and technology firms.

## 16.4 System-Based Recommendations

${analytics.recommendations.map((item, index) => `${index + 1}. ${item}`).join('\n')}

# Chapter 17 — Conclusion

This report analyzed cloud computing readiness, challenges, and adoption across surveyed business sectors in Somalia using actual collected survey-response snapshots from the Cloud Computing Survey Analytics System. The dataset includes ${totals.totalResponses} responses across ${totals.totalSectorsCovered} sectors and ${totals.totalDistrictsCovered} districts. The average stored readiness score is ${num(totals.averageCloudReadinessScore)} out of 100, indicating a medium readiness position overall.

The findings show that cloud computing adoption is possible but uneven. Awareness, willingness, and perceived need provide a foundation for adoption, while cost, infrastructure, training, and security concerns continue to shape readiness. Sector comparison confirms that some sectors are better prepared than others, so adoption strategies must be tailored rather than uniform.

The future outlook is positive if stakeholders focus on practical implementation. Organizations should begin with storage, backup, and secure collaboration. Sectors should adopt phased strategies according to readiness level. National stakeholders should support infrastructure, skills, cybersecurity confidence, and affordable cloud services. With these measures, cloud computing can strengthen data protection, continuity, efficiency, and digital transformation across Somalia's business sectors.

## Appendix A — Complete Question Frequency Tables

${Array.from({ length: 30 }, (_, index) => {
  const code = `q${index + 1}`;
  return `### ${code.toUpperCase()}. ${qText(analytics, code)}\n\n${freqMd(analytics, code)}`;
}).join('\n\n')}

## Appendix B — District Comparison

${mdTable(['District', 'Responses', 'Average readiness', 'Awareness', 'Technology', 'Infrastructure', 'Backup', 'Cloud use', 'Security', 'Willingness'], districts.map((item) => [
  item.district,
  item.responses,
  pct(item.averageReadiness),
  pct(item.awareness),
  pct(item.technology),
  pct(item.infrastructure),
  pct(item.backup),
  pct(item.cloudTools),
  pct(item.securityTrust),
  pct(item.willingness)
]))}

## Appendix C — Evidence Files

The evidence JSON is saved at \`reports/cloud-readiness-analytics.json\`. The complete report is saved at \`reports/cloud-computing-readiness-somalia-report.md\`.
`;
};

const main = async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGO_URI or MONGODB_URI is required.');
  }
  await mongoose.connect(uri);

  const responses = await normalizeResponseSectors(
    await SurveyResponse.find(DELETED_FILTER).populate('sector').sort({ submittedAt: 1, createdAt: 1 }).lean()
  );
  const analytics = buildSnapshotAnalytics(responses);
  const finalReport = {
    title: 'Somalia Cloud Computing Survey Analytics Report',
    recommendations: analytics.recommendations,
    keyFindings: analytics.summaryFindings
  };
  const charts = chartInventory();

  fs.writeFileSync(ANALYTICS_JSON, JSON.stringify({ analytics, finalReport, charts }, null, 2), 'utf8');
  fs.writeFileSync(REPORT_MD, buildSnapshotReport(analytics, charts), 'utf8');

  await mongoose.disconnect();
  console.info(JSON.stringify({
    responses: analytics.totals?.totalResponses || 0,
    sectors: analytics.totals?.totalSectorsCovered || 0,
    districts: analytics.totals?.totalDistrictsCovered || 0,
    averageReadiness: analytics.totals?.averageCloudReadinessScore || 0,
    analyticsJson: path.relative(ROOT, ANALYTICS_JSON),
    report: path.relative(ROOT, REPORT_MD)
  }, null, 2));
};

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
