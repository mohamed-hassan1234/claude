# Cloud Computing Readiness, Challenges, and Adoption Across Business Sectors in Somalia

## Complete Professional Research Report

**Generated from:** Cloud Computing Survey Analytics System  
**Generated at:** 6/4/2026, 5:15:11 PM East Africa Time  
**Data source:** MongoDB database `cloud_survey_system`, using stored `SurveyResponse.answerDetails` snapshots  
**Evidence base:** 24 collected survey responses, 14 sectors, 7 districts  

## Abstract

This report analyzes cloud computing readiness, challenges, and adoption across business sectors in Somalia using the actual collected survey responses stored in the Cloud Computing Survey Analytics System. The populated dataset contains 24 valid response documents across 14 sectors and 7 districts. The system-stored average cloud readiness score is 56.25 out of 100, with a minimum score of 36, median score of 56.5, maximum score of 77, and standard deviation of 9.9.

The findings show a medium overall readiness position. Cloud awareness is 50%, current cloud-service usage is 50%, backup practice coverage is 100%, infrastructure stability is 54.50%, security confidence is 52.50%, and adoption willingness is 33.33%. Sector comparison indicates that Media & Communication Companies has the highest average readiness score, while Real Estate / Property Management has the lowest. The most repeated adoption barrier is Amni darro, and the most repeated cloud-security concern is Access control la’aan.

## Methodological Note on Actual Data

The project currently contains two survey layers: the current question master in `SurveyQuestion`, and the collected response snapshots stored in `SurveyResponse.answerDetails`. The populated database contains 24 collected responses whose stored question snapshots differ from the current question master. To avoid fake data and to avoid blanking legacy responses, this report analyzes the stored response snapshots directly. This preserves the actual question text, answer values, readiness scores, sector names, and dates that exist in the system.

## List of Figures and Available Chart Files

Figures in this report are referenced as analytical figure descriptions based on the system frequency tables. The latest generated PNG chart files available in the analytics system are listed below.

| Chart type | Latest generated file |
| --- | --- |
| sector-ranking | analytics/generated/sector-ranking-ea9a5590.png |
| technology-use | analytics/generated/technology-use-c7d5ec74.png |
| barriers | analytics/generated/barriers-83eb6891.png |
| adoption-willingness | analytics/generated/adoption-willingness-72aafaf1.png |

# Chapter 1 — Introduction

## 1.1 Background of Cloud Computing

Cloud computing is the delivery of computing resources and digital services through internet-based platforms. These resources include online storage, backup, software applications, collaboration tools, databases, communication systems, analytics services, and business-management platforms. For organizations, cloud computing reduces the need to own every server, backup device, and software environment locally. Instead, businesses can access services through subscription, managed hosting, or usage-based arrangements.

In the Somali business context, cloud computing has practical relevance because many organizations need safer storage, reliable backup, mobile access, collaboration, and lower-cost access to modern software. The survey responses show that cloud computing is not only a technical subject; it is connected to business continuity, cost, staff skills, internet reliability, electricity stability, data security, and organizational confidence.

## 1.2 Importance of Digital Transformation

Digital transformation is the process of improving business operations through digital tools, digital records, online systems, automation, and data-driven management. It includes devices, software, employee skills, digital workflows, and the ability to protect and use information. In this dataset, technology use is visible through device usage, business software use, internet access, and demand for modern digital systems.

The key technology indicators show that the leading daily device is Desktop, while 50% of respondents selected Haa for business-management software usage. These findings indicate the current digital baseline for the surveyed organizations.

## 1.3 Importance of Cloud Adoption

Cloud adoption matters because organizations increasingly need data availability, backup reliability, remote access, communication, and digital continuity. When implemented responsibly, cloud services can reduce the effect of local device failure, improve access to files, support collaboration, and strengthen business recovery.

The dataset reports current cloud-service usage of 50% and adoption willingness of 33.33%. This relationship is central to the study: willingness indicates perceived value, while current usage indicates actual implementation.

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

The study covers 24 responses collected across 14 sectors and 7 districts. It focuses on cloud computing readiness, technology use, backup behavior, cloud use, infrastructure, security, business needs, sector comparison, and open-ended respondent recommendations.

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

Common challenges include cost, internet reliability, power stability, limited cloud skills, security concerns, weak trust, and lack of technical support. The survey's leading barrier is Amni darro, which confirms that adoption depends on more than awareness alone.

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

The dataset contains 24 valid responses. It covers 14 sectors and 7 districts. The sampling approach is survey-based sectoral sampling of accessible organizations, not a national census.

| Metric | Value |
| --- | --- |
| Total responses | 24 |
| Sectors covered | 14 |
| Districts covered | 7 |
| Average stored readiness score | 56.25 |
| Median readiness score | 56.50 |
| Readiness standard deviation | 9.9 |

## 3.4 Business Sectors Covered

| Sector | Responses | Percentage |
| --- | --- | --- |
| Banks / Financial Institutions | 2 | 8.33% |
| E-commerce / Online Businesses | 2 | 8.33% |
| Hospitals / Clinics | 2 | 8.33% |
| Hotels / Hospitality Services | 2 | 8.33% |
| Logistics & Transportation | 2 | 8.33% |
| Schools / Educational Institutions | 2 | 8.33% |
| Supermarkets / Retail Shops | 2 | 8.33% |
| Tech-based Restaurants / Cafes | 2 | 8.33% |
| Telecom / Mobile Money Agents | 2 | 8.33% |
| Universities | 2 | 8.33% |
| Media & Communication Companies | 1 | 4.17% |
| NGOs / Non-Profit Organizations | 1 | 4.17% |
| Real Estate / Property Management | 1 | 4.17% |
| SMEs | 1 | 4.17% |

## 3.5 Data Analysis Approach

The report uses actual stored answer values. Frequencies were calculated for each question. Sector and district comparison were calculated from stored readiness scores and derived indicator rates. Open-ended answers were grouped into themes using repeated keywords and topic patterns. Readiness assessment uses the readiness scores and bands already stored with each response by the system.

# Chapter 4 — Respondent Profile Analysis

## 4.1 Sector Distribution

#### Figure 1. Ganacsigaaga ama hay’addaadu noocee ah ayey tahay?

Figure 1 and Table 1 summarize the actual response distribution for "Ganacsigaaga ama hay’addaadu noocee ah ayey tahay?". The leading response is Banks / Financial Institutions with 2 selections (8.33% of selections; 8.33% of respondents). The next response is E-commerce / Online Businesses with 8.33% of selections. The implication is that this item should be treated as a practical indicator of the current operating condition among the surveyed organizations.

| Response | Frequency | Percentage of selections | Percentage of respondents |
| --- | --- | --- | --- |
| Banks / Financial Institutions | 2 | 8.33% | 8.33% |
| E-commerce / Online Businesses | 2 | 8.33% | 8.33% |
| Hospitals / Clinics | 2 | 8.33% | 8.33% |
| Hotels / Hospitality Services | 2 | 8.33% | 8.33% |
| Logistics & Transportation | 2 | 8.33% | 8.33% |
| Schools / Educational Institutions | 2 | 8.33% | 8.33% |
| Supermarkets / Retail Shops | 2 | 8.33% | 8.33% |
| Tech-based Restaurants / Cafes | 2 | 8.33% | 8.33% |
| Telecom / Mobile Money Agents | 2 | 8.33% | 8.33% |
| Universities | 2 | 8.33% | 8.33% |
| Media & Communication Companies | 1 | 4.17% | 4.17% |
| NGOs / Non-Profit Organizations | 1 | 4.17% | 4.17% |
| Real Estate / Property Management | 1 | 4.17% | 4.17% |
| SMEs | 1 | 4.17% | 4.17% |

The sector distribution shows that the most represented sector is Banks / Financial Institutions. Sector distribution matters because it affects the weight of the overall readiness average and the interpretation of sector comparisons.

## 4.2 District Distribution

Figure 2 summarizes the district profile. The most represented district is Hodan with 4 responses (16.67%).

| District | Responses | Percentage |
| --- | --- | --- |
| Hodan | 4 | 16.67% |
| Karaan | 4 | 16.67% |
| Wadajir | 4 | 16.67% |
| Baidoa | 3 | 12.50% |
| Garowe | 3 | 12.50% |
| Hargeisa | 3 | 12.50% |
| Kismayo | 3 | 12.50% |

## 4.3 Organization Age and Employee Size

#### Figure 3. Immisa sano ayuu ganacsigaagu shaqeynayay?

Figure 3 and Table 3 summarize the actual response distribution for "Immisa sano ayuu ganacsigaagu shaqeynayay?". The leading response is 1 with 2 selections (8.33% of selections; 8.33% of respondents). The next response is 10 with 8.33% of selections. The implication is that this item should be treated as a practical indicator of the current operating condition among the surveyed organizations.

| Response | Frequency | Percentage of selections | Percentage of respondents |
| --- | --- | --- | --- |
| 1 | 2 | 8.33% | 8.33% |
| 10 | 2 | 8.33% | 8.33% |
| 11 | 2 | 8.33% | 8.33% |
| 12 | 2 | 8.33% | 8.33% |
| 2 | 2 | 8.33% | 8.33% |
| 3 | 2 | 8.33% | 8.33% |
| 4 | 2 | 8.33% | 8.33% |
| 5 | 2 | 8.33% | 8.33% |
| 6 | 2 | 8.33% | 8.33% |
| 7 | 2 | 8.33% | 8.33% |
| 8 | 2 | 8.33% | 8.33% |
| 9 | 2 | 8.33% | 8.33% |

#### Figure 4. Immisa shaqaale ayaa ka shaqeeya hay’addaada?

Figure 4 and Table 4 summarize the actual response distribution for "Immisa shaqaale ayaa ka shaqeeya hay’addaada?". The leading response is 10 with 1 selections (4.17% of selections; 4.17% of respondents). The next response is 12 with 4.17% of selections. The implication is that this item should be treated as a practical indicator of the current operating condition among the surveyed organizations.

| Response | Frequency | Percentage of selections | Percentage of respondents |
| --- | --- | --- | --- |
| 10 | 1 | 4.17% | 4.17% |
| 12 | 1 | 4.17% | 4.17% |
| 14 | 1 | 4.17% | 4.17% |
| 16 | 1 | 4.17% | 4.17% |
| 18 | 1 | 4.17% | 4.17% |
| 20 | 1 | 4.17% | 4.17% |
| 22 | 1 | 4.17% | 4.17% |
| 24 | 1 | 4.17% | 4.17% |
| 26 | 1 | 4.17% | 4.17% |
| 28 | 1 | 4.17% | 4.17% |
| 30 | 1 | 4.17% | 4.17% |
| 32 | 1 | 4.17% | 4.17% |
| 34 | 1 | 4.17% | 4.17% |
| 36 | 1 | 4.17% | 4.17% |
| 38 | 1 | 4.17% | 4.17% |
| 4 | 1 | 4.17% | 4.17% |
| 40 | 1 | 4.17% | 4.17% |
| 42 | 1 | 4.17% | 4.17% |
| 44 | 1 | 4.17% | 4.17% |
| 46 | 1 | 4.17% | 4.17% |
| 48 | 1 | 4.17% | 4.17% |
| 50 | 1 | 4.17% | 4.17% |
| 6 | 1 | 4.17% | 4.17% |
| 8 | 1 | 4.17% | 4.17% |

Organization age and employee size indicate operational maturity and capacity. Smaller and younger organizations may prefer low-cost cloud services, while larger organizations may need governance, access control, and integration planning.

## 4.4 Respondent Department or Role

#### Figure 5. Waaxdee ayaad ka shaqeysaa?

Figure 5 and Table 5 summarize the actual response distribution for "Waaxdee ayaad ka shaqeysaa?". The leading response is Howlgallada with 6 selections (25% of selections; 25% of respondents). The next response is IT with 25% of selections. The implication is that this item should be treated as a practical indicator of the current operating condition among the surveyed organizations.

| Response | Frequency | Percentage of selections | Percentage of respondents |
| --- | --- | --- | --- |
| Howlgallada | 6 | 25% | 25% |
| IT | 6 | 25% | 25% |
| Maamulka | 6 | 25% | 25% |
| Xisaabaadka | 6 | 25% | 25% |

Respondent department affects the interpretation of answers. Management respondents may emphasize cost and business value, while technical staff may emphasize infrastructure and security.

# Chapter 5 — Cloud Awareness Analysis

## 5.1 Prior Awareness

#### Figure 6. Ma maqashay erayga “Cloud Computing” hore?

Figure 6 and Table 6 summarize the actual response distribution for "Ma maqashay erayga “Cloud Computing” hore?". The leading response is Haa with 12 selections (50% of selections; 50% of respondents). The next response is Maya with 50% of selections. The implication is that this item should be treated as a practical indicator of the current operating condition among the surveyed organizations.

| Response | Frequency | Percentage of selections | Percentage of respondents |
| --- | --- | --- | --- |
| Haa | 12 | 50% | 50% |
| Maya | 12 | 50% | 50% |

Cloud awareness is 50%. Awareness is the first readiness condition because organizations cannot adopt a technology intentionally unless they understand its purpose and relevance.

## 5.2 Understanding Level

#### Figure 7. Sidee baad u qiimeyn lahayd fahamkaaga cloud computing?

Figure 7 and Table 7 summarize the actual response distribution for "Sidee baad u qiimeyn lahayd fahamkaaga cloud computing?". The leading response is Aad u fiican with 5 selections (20.83% of selections; 20.83% of respondents). The next response is Dhexdhexaad with 20.83% of selections. The implication is that this item should be treated as a practical indicator of the current operating condition among the surveyed organizations.

| Response | Frequency | Percentage of selections | Percentage of respondents |
| --- | --- | --- | --- |
| Aad u fiican | 5 | 20.83% | 20.83% |
| Dhexdhexaad | 5 | 20.83% | 20.83% |
| Fiican | 5 | 20.83% | 20.83% |
| Yar | 5 | 20.83% | 20.83% |
| Midna ma aqaan | 4 | 16.67% | 16.67% |

The dominant understanding level is Aad u fiican. This shows whether respondents only recognize the term cloud computing or have deeper confidence in what it means.

## 5.3 Explanation of Cloud Computing

#### Figure 8. Maxaad u fahantaa cloud computing?

Figure 8 and Table 8 summarize the actual response distribution for "Maxaad u fahantaa cloud computing?". The leading response is Cloud computing waa adeeg internet lagu kaydiyo xogta laguna isticmaalo software online ah. with 24 selections (100% of selections; 100% of respondents). The implication is that this item should be treated as a practical indicator of the current operating condition among the surveyed organizations.

| Response | Frequency | Percentage of selections | Percentage of respondents |
| --- | --- | --- | --- |
| Cloud computing waa adeeg internet lagu kaydiyo xogta laguna isticmaalo software online ah. | 24 | 100% | 100% |

Open explanations show that respondents commonly associate cloud computing with online storage, internet-based software, and remote access. This is a useful foundation for awareness programs because training can connect formal cloud concepts to familiar services.

# Chapter 6 — Technology Usage Analysis

## 6.1 Devices Used

#### Figure 9. Noocee qalab ah ayaad inta badan isticmaashaan?

Figure 9 and Table 9 summarize the actual response distribution for "Noocee qalab ah ayaad inta badan isticmaashaan?". The leading response is Desktop with 6 selections (25% of selections; 25% of respondents). The next response is Laptop with 25% of selections. The implication is that this item should be treated as a practical indicator of the current operating condition among the surveyed organizations.

| Response | Frequency | Percentage of selections | Percentage of respondents |
| --- | --- | --- | --- |
| Desktop | 6 | 25% | 25% |
| Laptop | 6 | 25% | 25% |
| Mobile phone | 6 | 25% | 25% |
| Tablet | 6 | 25% | 25% |

Device availability is a practical condition for cloud use. The dominant device category is Desktop, meaning cloud solutions should be compatible with the hardware already used by organizations.

## 6.2 Business Software Usage

#### Figure 10. Ma isticmaashaan software maamulka ganacsiga?

Figure 10 and Table 10 summarize the actual response distribution for "Ma isticmaashaan software maamulka ganacsiga?". The leading response is Haa with 12 selections (50% of selections; 50% of respondents). The next response is Maya with 50% of selections. The implication is that this item should be treated as a practical indicator of the current operating condition among the surveyed organizations.

| Response | Frequency | Percentage of selections | Percentage of respondents |
| --- | --- | --- | --- |
| Haa | 12 | 50% | 50% |
| Maya | 12 | 50% | 50% |

Software use indicates digital maturity. Organizations that already use management software can move more easily toward cloud-based systems. Organizations that do not use software may first need basic digitization.

## 6.3 Cloud Skills and Digital-System Need

#### Figure 11. Shaqaalahaagu ma leeyihiin xirfad ku filan cloud technology?

Figure 11 and Table 11 summarize the actual response distribution for "Shaqaalahaagu ma leeyihiin xirfad ku filan cloud technology?". The leading response is Haa with 8 selections (33.33% of selections; 33.33% of respondents). The next response is Maya with 33.33% of selections. The implication is that this item should be treated as a practical indicator of the current operating condition among the surveyed organizations.

| Response | Frequency | Percentage of selections | Percentage of respondents |
| --- | --- | --- | --- |
| Haa | 8 | 33.33% | 33.33% |
| Maya | 8 | 33.33% | 33.33% |
| Qaar kaliya | 8 | 33.33% | 33.33% |

#### Figure 12. Ganacsigaagu ma u baahan yahay nidaam digital casri ah?

Figure 12 and Table 12 summarize the actual response distribution for "Ganacsigaagu ma u baahan yahay nidaam digital casri ah?". The leading response is Haa with 12 selections (50% of selections; 50% of respondents). The next response is Maya with 50% of selections. The implication is that this item should be treated as a practical indicator of the current operating condition among the surveyed organizations.

| Response | Frequency | Percentage of selections | Percentage of respondents |
| --- | --- | --- | --- |
| Haa | 12 | 50% | 50% |
| Maya | 12 | 50% | 50% |

The responses show both the available skill base and the perceived need for modern digital systems. Training need is analyzed in Chapter 10 because it directly affects adoption.

# Chapter 7 — Data Storage & Backup Analysis

## 7.1 Data Storage Location

#### Figure 13. Xogta ganacsiga xaggee ku kaydsataan?

Figure 13 and Table 13 summarize the actual response distribution for "Xogta ganacsiga xaggee ku kaydsataan?". The leading response is Cloud storage with 6 selections (25% of selections; 25% of respondents). The next response is Computer local ah with 25% of selections. The implication is that this item should be treated as a practical indicator of the current operating condition among the surveyed organizations.

| Response | Frequency | Percentage of selections | Percentage of respondents |
| --- | --- | --- | --- |
| Cloud storage | 6 | 25% | 25% |
| Computer local ah | 6 | 25% | 25% |
| External hard disk | 6 | 25% | 25% |
| Warqado | 6 | 25% | 25% |

Storage location is a core risk indicator. Paper and local storage increase exposure to physical loss, device failure, and limited access. Cloud storage and managed backup can reduce these risks if implemented securely.

## 7.2 Backup Practice

#### Figure 14. Ma sameysaan backup joogto ah?

Figure 14 and Table 14 summarize the actual response distribution for "Ma sameysaan backup joogto ah?". The leading response is Haa maalin kasta with 6 selections (25% of selections; 25% of respondents). The next response is Mararka qaar with 25% of selections. The implication is that this item should be treated as a practical indicator of the current operating condition among the surveyed organizations.

| Response | Frequency | Percentage of selections | Percentage of respondents |
| --- | --- | --- | --- |
| Haa maalin kasta | 6 | 25% | 25% |
| Mararka qaar | 6 | 25% | 25% |
| Maya | 6 | 25% | 25% |
| Toddobaadle | 6 | 25% | 25% |

Backup practice coverage is 100%. Frequent backup improves business continuity and reduces the effect of hardware failure, human error, malware, or power-related disruption.

## 7.3 Data Loss Experience

#### Figure 15. Immisa jeer ayay xog kaa luntay?

Figure 15 and Table 15 summarize the actual response distribution for "Immisa jeer ayay xog kaa luntay?". The leading response is Hal mar with 8 selections (33.33% of selections; 33.33% of respondents). The next response is In ka badan hal mar with 33.33% of selections. The implication is that this item should be treated as a practical indicator of the current operating condition among the surveyed organizations.

| Response | Frequency | Percentage of selections | Percentage of respondents |
| --- | --- | --- | --- |
| Hal mar | 8 | 33.33% | 33.33% |
| In ka badan hal mar | 8 | 33.33% | 33.33% |
| Marna | 8 | 33.33% | 33.33% |

Data-loss experience provides evidence of operational risk. Even where loss is not frequent, the need for backup remains important because one major loss event can disrupt business operations.

# Chapter 8 — Cloud Usage Analysis

## 8.1 Current Cloud Service Usage

#### Figure 16. Ma isticmaashaan adeegyada cloud sida Google Drive, OneDrive, Dropbox?

Figure 16 and Table 16 summarize the actual response distribution for "Ma isticmaashaan adeegyada cloud sida Google Drive, OneDrive, Dropbox?". The leading response is Haa with 12 selections (50% of selections; 50% of respondents). The next response is Maya with 50% of selections. The implication is that this item should be treated as a practical indicator of the current operating condition among the surveyed organizations.

| Response | Frequency | Percentage of selections | Percentage of respondents |
| --- | --- | --- | --- |
| Haa | 12 | 50% | 50% |
| Maya | 12 | 50% | 50% |

The current cloud-service usage rate is 50%. This is the direct adoption indicator in the dataset.

## 8.2 Cloud Tools Used

#### Figure 17. Haddii haa, adeeggee ugu badan ayaad isticmaashaan?

Figure 17 and Table 17 summarize the actual response distribution for "Haddii haa, adeeggee ugu badan ayaad isticmaashaan?". The leading response is Dropbox with 6 selections (25% of selections; 25% of respondents). The next response is Google Drive with 25% of selections. The implication is that this item should be treated as a practical indicator of the current operating condition among the surveyed organizations.

| Response | Frequency | Percentage of selections | Percentage of respondents |
| --- | --- | --- | --- |
| Dropbox | 6 | 25% | 25% |
| Google Drive | 6 | 25% | 25% |
| Ma isticmaalno | 6 | 25% | 25% |
| OneDrive | 6 | 25% | 25% |

The most common named cloud service is Dropbox. Familiar tools can become entry points for broader adoption because users already recognize their value.

## 8.3 Perceived Helpfulness of Cloud Systems

#### Figure 18. Cloud systems ma ka caawiyeen shaqadaada?

Figure 18 and Table 18 summarize the actual response distribution for "Cloud systems ma ka caawiyeen shaqadaada?". The leading response is Aad u badan with 6 selections (25% of selections; 25% of respondents). The next response is Dhexdhexaad with 25% of selections. The implication is that this item should be treated as a practical indicator of the current operating condition among the surveyed organizations.

| Response | Frequency | Percentage of selections | Percentage of respondents |
| --- | --- | --- | --- |
| Aad u badan | 6 | 25% | 25% |
| Dhexdhexaad | 6 | 25% | 25% |
| Maya | 6 | 25% | 25% |
| Wax yar | 6 | 25% | 25% |

Perceived usefulness is important because organizations are more likely to adopt technologies they believe improve work. The response distribution shows the degree to which cloud systems are seen as helpful.

# Chapter 9 — Infrastructure Analysis

## 9.1 Internet Availability and Quality

#### Figure 19. Internet joogto ah ma haysataan?

Figure 19 and Table 19 summarize the actual response distribution for "Internet joogto ah ma haysataan?". The leading response is Haa with 12 selections (50% of selections; 50% of respondents). The next response is Maya with 50% of selections. The implication is that this item should be treated as a practical indicator of the current operating condition among the surveyed organizations.

| Response | Frequency | Percentage of selections | Percentage of respondents |
| --- | --- | --- | --- |
| Haa | 12 | 50% | 50% |
| Maya | 12 | 50% | 50% |

#### Figure 20. Tayada internet-kiinnu sidee tahay?

Figure 20 and Table 20 summarize the actual response distribution for "Tayada internet-kiinnu sidee tahay?". The leading response is Aad u fiican with 6 selections (25% of selections; 25% of respondents). The next response is Dhexdhexaad with 25% of selections. The implication is that this item should be treated as a practical indicator of the current operating condition among the surveyed organizations.

| Response | Frequency | Percentage of selections | Percentage of respondents |
| --- | --- | --- | --- |
| Aad u fiican | 6 | 25% | 25% |
| Dhexdhexaad | 6 | 25% | 25% |
| Fiican | 6 | 25% | 25% |
| Liita | 6 | 25% | 25% |

Internet availability and quality are central to cloud readiness. The derived infrastructure stability indicator is 54.50%.

## 9.2 Electricity Availability and Work Interruption

#### Figure 21. Koronto joogto ah ma haysataan?

Figure 21 and Table 21 summarize the actual response distribution for "Koronto joogto ah ma haysataan?". The leading response is Haa with 12 selections (50% of selections; 50% of respondents). The next response is Maya with 50% of selections. The implication is that this item should be treated as a practical indicator of the current operating condition among the surveyed organizations.

| Response | Frequency | Percentage of selections | Percentage of respondents |
| --- | --- | --- | --- |
| Haa | 12 | 50% | 50% |
| Maya | 12 | 50% | 50% |

#### Figure 22. Koronto la’aantu intee jeer ayay shaqada hakisaa?

Figure 22 and Table 22 summarize the actual response distribution for "Koronto la’aantu intee jeer ayay shaqada hakisaa?". The leading response is Badanaa with 6 selections (25% of selections; 25% of respondents). The next response is Marar dhif ah with 25% of selections. The implication is that this item should be treated as a practical indicator of the current operating condition among the surveyed organizations.

| Response | Frequency | Percentage of selections | Percentage of respondents |
| --- | --- | --- | --- |
| Badanaa | 6 | 25% | 25% |
| Marar dhif ah | 6 | 25% | 25% |
| Mararka qaar | 6 | 25% | 25% |
| Marnaba | 6 | 25% | 25% |

Cloud services still require powered devices, routers, and network equipment. Power interruption therefore remains a readiness constraint even when applications are hosted online.

## 9.3 Internet as an Adoption Barrier

#### Figure 23. Internet la’aantu ma caqabad weyn bay idiin tahay?

Figure 23 and Table 23 summarize the actual response distribution for "Internet la’aantu ma caqabad weyn bay idiin tahay?". The leading response is Haa with 12 selections (50% of selections; 50% of respondents). The next response is Maya with 50% of selections. The implication is that this item should be treated as a practical indicator of the current operating condition among the surveyed organizations.

| Response | Frequency | Percentage of selections | Percentage of respondents |
| --- | --- | --- | --- |
| Haa | 12 | 50% | 50% |
| Maya | 12 | 50% | 50% |

If respondents identify internet absence as a major barrier, adoption strategies must include connectivity planning, offline procedures, and phased migration.

# Chapter 10 — Security & Challenges Analysis

## 10.1 Main Adoption Barriers

#### Figure 24. Maxay yihiin caqabadaha ugu waaweyn ee kaa hor istaagaya cloud adoption?

Figure 24 and Table 24 summarize the actual response distribution for "Maxay yihiin caqabadaha ugu waaweyn ee kaa hor istaagaya cloud adoption?". The leading response is Amni darro with 6 selections (25% of selections; 25% of respondents). The next response is Aqoonta oo yar with 25% of selections. The implication is that this item should be treated as a practical indicator of the current operating condition among the surveyed organizations.

| Response | Frequency | Percentage of selections | Percentage of respondents |
| --- | --- | --- | --- |
| Amni darro | 6 | 25% | 25% |
| Aqoonta oo yar | 6 | 25% | 25% |
| Internet liita | 6 | 25% | 25% |
| Kharash badan | 6 | 25% | 25% |

The leading barrier is Amni darro. This result should guide intervention design because each barrier requires a different response.

## 10.2 Training Need

#### Figure 25. Tababar ma u baahan tihiin?

Figure 25 and Table 25 summarize the actual response distribution for "Tababar ma u baahan tihiin?". The leading response is Haa with 12 selections (50% of selections; 50% of respondents). The next response is Maya with 50% of selections. The implication is that this item should be treated as a practical indicator of the current operating condition among the surveyed organizations.

| Response | Frequency | Percentage of selections | Percentage of respondents |
| --- | --- | --- | --- |
| Haa | 12 | 50% | 50% |
| Maya | 12 | 50% | 50% |

Training need is a direct capacity indicator. Where training need is high, awareness campaigns should be accompanied by practical exercises in account setup, file sharing, backup, password control, and recovery.

## 10.3 Trust in Cloud Storage

#### Figure 26. Ma ku kalsoon tahay in xogtaada lagu kaydiyo cloud?

Figure 26 and Table 26 summarize the actual response distribution for "Ma ku kalsoon tahay in xogtaada lagu kaydiyo cloud?". The leading response is Aad baan ugu kalsoonahay with 6 selections (25% of selections; 25% of respondents). The next response is Dhexdhexaad with 25% of selections. The implication is that this item should be treated as a practical indicator of the current operating condition among the surveyed organizations.

| Response | Frequency | Percentage of selections | Percentage of respondents |
| --- | --- | --- | --- |
| Aad baan ugu kalsoonahay | 6 | 25% | 25% |
| Dhexdhexaad | 6 | 25% | 25% |
| Kuma kalsooni | 6 | 25% | 25% |
| Waan ku kalsoonahay | 6 | 25% | 25% |

Security confidence is 52.50%. Trust is necessary for adoption, especially where organizations handle sensitive customer, financial, or operational data.

## 10.4 Cloud Security Concerns

#### Figure 27. Maxaa kaa walwal geliya cloud security?

Figure 27 and Table 27 summarize the actual response distribution for "Maxaa kaa walwal geliya cloud security?". The leading response is Access control la’aan with 6 selections (25% of selections; 25% of respondents). The next response is Hackers with 25% of selections. The implication is that this item should be treated as a practical indicator of the current operating condition among the surveyed organizations.

| Response | Frequency | Percentage of selections | Percentage of respondents |
| --- | --- | --- | --- |
| Access control la’aan | 6 | 25% | 25% |
| Hackers | 6 | 25% | 25% |
| Sirta oo baxda | 6 | 25% | 25% |
| Xatooyo xog | 6 | 25% | 25% |

The most repeated security concern is Access control la’aan. Adoption programs should directly address this issue through encryption, access control, password hygiene, permissions, audit logs, and backup policies.

# Chapter 11 — Business Needs & Adoption Readiness

## 11.1 Need for Modern Digital Systems

#### Figure 28. Ganacsigaagu ma u baahan yahay nidaam digital casri ah?

Figure 28 and Table 28 summarize the actual response distribution for "Ganacsigaagu ma u baahan yahay nidaam digital casri ah?". The leading response is Haa with 12 selections (50% of selections; 50% of respondents). The next response is Maya with 50% of selections. The implication is that this item should be treated as a practical indicator of the current operating condition among the surveyed organizations.

| Response | Frequency | Percentage of selections | Percentage of respondents |
| --- | --- | --- | --- |
| Haa | 12 | 50% | 50% |
| Maya | 12 | 50% | 50% |

Need for modern systems shows whether organizations perceive digital transformation as necessary. This result supports cloud adoption planning when paired with willingness and service needs.

## 11.2 Willingness to Use Cloud Solutions

#### Figure 29. Haddii cloud solution la heli karo, ma diyaar baad u tahay inaad isticmaasho?

Figure 29 and Table 29 summarize the actual response distribution for "Haddii cloud solution la heli karo, ma diyaar baad u tahay inaad isticmaasho?". The leading response is Haa with 8 selections (33.33% of selections; 33.33% of respondents). The next response is Maya with 33.33% of selections. The implication is that this item should be treated as a practical indicator of the current operating condition among the surveyed organizations.

| Response | Frequency | Percentage of selections | Percentage of respondents |
| --- | --- | --- | --- |
| Haa | 8 | 33.33% | 33.33% |
| Maya | 8 | 33.33% | 33.33% |
| Waxaa ku xiran qiimaha | 8 | 33.33% | 33.33% |

Adoption willingness is 33.33%. This indicates strong potential demand if cost, training, infrastructure, and security concerns are addressed.

## 11.3 Desired Cloud Services

#### Figure 30. Maxay yihiin adeegyada aad rabto in cloud kuu xalliyo?

Figure 30 and Table 30 summarize the actual response distribution for "Maxay yihiin adeegyada aad rabto in cloud kuu xalliyo?". The leading response is backup with 24 selections (33.33% of selections; 100% of respondents). The next response is iyo maamulka dukumentiyada. with 33.33% of selections. The implication is that this item should be treated as a practical indicator of the current operating condition among the surveyed organizations.

| Response | Frequency | Percentage of selections | Percentage of respondents |
| --- | --- | --- | --- |
| backup | 24 | 33.33% | 100% |
| iyo maamulka dukumentiyada. | 24 | 33.33% | 100% |
| Waxaan rabnaa kayd xogeed | 24 | 33.33% | 100% |

Desired services emphasize practical needs such as storage, backup, document management, and business administration. These needs should shape initial cloud-service packages.

# Chapter 12 — Open-Ended Response Analysis

## 12.1 Theme Analysis

| Theme | Frequency | Percentage | Example responses |
| --- | --- | --- | --- |
| Infrastructure, internet, power, and cost | 72 | 75% | Cloud computing waa adeeg internet lagu kaydiyo xogta laguna isticmaalo software online ah. / Cloud computing waa adeeg internet lagu kaydiyo xogta laguna isticmaalo software online ah. / Cloud computing waa adeeg internet lagu kaydiyo xogta laguna isticmaalo software online ah. |
| Data storage, backup, and document management | 48 | 50% | Cloud computing waa adeeg internet lagu kaydiyo xogta laguna isticmaalo software online ah. / Cloud computing waa adeeg internet lagu kaydiyo xogta laguna isticmaalo software online ah. / Cloud computing waa adeeg internet lagu kaydiyo xogta laguna isticmaalo software online ah. |
| Training, awareness, and skills | 48 | 50% | Mustaqbalka cloud computing ee Soomaaliya wuu kori karaa haddii internet iyo tababar la helo. / Mustaqbalka cloud computing ee Soomaaliya wuu kori karaa haddii internet iyo tababar la helo. / Mustaqbalka cloud computing ee Soomaaliya wuu kori karaa haddii internet iyo tababar la helo. |
| Future growth of cloud computing in Somalia | 48 | 50% | Cloud computing waa adeeg internet lagu kaydiyo xogta laguna isticmaalo software online ah. / Cloud computing waa adeeg internet lagu kaydiyo xogta laguna isticmaalo software online ah. / Cloud computing waa adeeg internet lagu kaydiyo xogta laguna isticmaalo software online ah. |
| Efficiency, management, and collaboration | 24 | 25% | Waxaan rabnaa kayd xogeed, backup, iyo maamulka dukumentiyada. / Waxaan rabnaa kayd xogeed, backup, iyo maamulka dukumentiyada. / Waxaan rabnaa kayd xogeed, backup, iyo maamulka dukumentiyada. |

The dominant open-ended theme is Infrastructure, internet, power, and cost. This theme pattern confirms that respondents frame cloud computing in terms of operational improvement rather than abstract technology.

## 12.2 Keyword Analysis

| Keyword | Frequency |
| --- | --- |
| cloud | 48 |
| computing | 48 |
| internet | 48 |
| tababar | 48 |
| adeeg | 24 |
| adeegyo | 24 |
| backup | 24 |
| dowladda | 24 |
| dukumentiyada | 24 |
| haddii | 24 |
| helo | 24 |
| isticmaalo | 24 |
| jaban | 24 |
| karaa | 24 |
| kayd | 24 |
| kaydiyo | 24 |
| kordhiyaan | 24 |
| kori | 24 |
| lagu | 24 |
| laguna | 24 |

## 12.3 Topic Grouping and Response Categorization

| Topic | Frequency | Percentage |
| --- | --- | --- |
| Infrastructure, internet, power, and cost | 72 | 75% |
| Data storage, backup, and document management | 48 | 50% |
| Training, awareness, and skills | 48 | 50% |
| Future growth of cloud computing in Somalia | 48 | 50% |
| Efficiency, management, and collaboration | 24 | 25% |

Open-ended responses repeatedly mention backup, data, documents, training, affordability, internet, and the future growth of cloud computing in Somalia. These patterns support practical recommendations focused on training, affordable services, secure storage, and infrastructure improvement.

# Chapter 13 — Sector Comparison Analysis

## 13.1 Sector Readiness Ranking

The latest available sector-ranking chart file is analytics/generated/sector-ranking-ea9a5590.png.

| Sector | Responses | Average readiness | Awareness indicator | Technology indicator | Infrastructure indicator | Backup indicator | Cloud-use indicator | Security indicator | Willingness indicator |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Media & Communication Companies | 1 | 74% | 80% | 68.75% | 45% | 63.33% | 93.33% | 50% | 100% |
| Banks / Financial Institutions | 2 | 67% | 95% | 56.25% | 46% | 50% | 85% | 55% | 75% |
| Hospitals / Clinics | 2 | 64% | 87.50% | 56.25% | 46% | 50% | 85% | 55% | 75% |
| Telecom / Mobile Money Agents | 2 | 58.50% | 85% | 43.75% | 46% | 41.67% | 85% | 55% | 50% |
| Schools / Educational Institutions | 2 | 57% | 71.25% | 56.25% | 46% | 50% | 85% | 55% | 75% |
| Hotels / Hospitality Services | 2 | 56.50% | 73.75% | 43.75% | 46% | 41.67% | 85% | 55% | 50% |
| Tech-based Restaurants / Cafes | 2 | 55% | 23.75% | 56.25% | 63% | 65% | 36.67% | 50% | 75% |
| Supermarkets / Retail Shops | 2 | 53.50% | 45% | 56.25% | 63% | 65% | 36.67% | 50% | 75% |
| Logistics & Transportation | 2 | 52.50% | 35% | 56.25% | 63% | 65% | 36.67% | 50% | 75% |
| E-commerce / Online Businesses | 2 | 52.50% | 21.25% | 56.25% | 63% | 65% | 36.67% | 50% | 75% |
| SMEs | 1 | 50% | 100% | 43.75% | 47% | 36.67% | 76.67% | 60% | 50% |
| NGOs / Non-Profit Organizations | 1 | 50% | 40% | 43.75% | 60% | 66.67% | 26.67% | 50% | 50% |
| Universities | 2 | 48% | 37.50% | 43.75% | 63% | 56.67% | 36.67% | 50% | 50% |
| Real Estate / Property Management | 1 | 47% | 17.50% | 43.75% | 66% | 46.67% | 46.67% | 50% | 50% |

The best-performing sector is Media & Communication Companies with an average readiness score of 74%. The weakest sector is Real Estate / Property Management with 47%. These differences show that cloud adoption should be tailored to sector readiness.

## 13.2 Key Differences Across Sectors

Sectors with higher readiness can be targeted for more advanced services such as structured cloud backup, online accounting, access-control policies, and analytics. Sectors with lower readiness require basic cloud awareness, affordable starter packages, and support for infrastructure and skills.

# Chapter 14 — Cloud Readiness Assessment

## 14.1 Stored Readiness Scores

Readiness scores are stored in each survey response by the system. The overall average is 56.25 out of 100. The median is 56.50, the minimum is 36, and the maximum is 77.

## 14.2 Readiness Distribution

| Readiness band | Responses | Percentage |
| --- | --- | --- |
| Low | 1 | 4.17% |
| Medium | 20 | 83.33% |
| High | 3 | 12.50% |

The distribution shows that most organizations are in the Medium band. This means readiness is present but still requires targeted improvement.

## 14.3 Derived Indicator Breakdown

| Indicator area | Score |
| --- | --- |
| Adoption readiness | 66.67% |
| Cloud usage | 60.83% |
| Cloud awareness | 57.81% |
| Data storage and backup | 54.72% |
| Infrastructure readiness | 54.50% |
| Security confidence | 52.50% |
| Technology usage | 52.08% |

These indicators are calculated from actual response values to explain what may be driving the stored readiness scores. They should be interpreted as explanatory indicators, while the official readiness classification comes from the stored system scores.

## 14.4 Gap Analysis

| Indicator area | Current score | Ideal score | Gap |
| --- | --- | --- | --- |
| Technology usage | 52.08% | 100% | 47.92% |
| Security confidence | 52.50% | 100% | 47.50% |
| Infrastructure readiness | 54.50% | 100% | 45.50% |
| Data storage and backup | 54.72% | 100% | 45.28% |
| Cloud awareness | 57.81% | 100% | 42.19% |
| Cloud usage | 60.83% | 100% | 39.17% |
| Adoption readiness | 66.67% | 100% | 33.33% |

The largest gap is Technology usage. This area should receive priority because it is furthest from the ideal readiness condition.

## 14.5 High, Medium, and Low Readiness Sectors

| Readiness category | Sectors |
| --- | --- |
| High | Media & Communication Companies |
| Medium | Banks / Financial Institutions, Hospitals / Clinics, Telecom / Mobile Money Agents, Schools / Educational Institutions, Hotels / Hospitality Services, Tech-based Restaurants / Cafes, Supermarkets / Retail Shops, Logistics & Transportation, E-commerce / Online Businesses, SMEs, NGOs / Non-Profit Organizations, Universities, Real Estate / Property Management |
| Low | None |

# Chapter 15 — Key Findings

1. The analysis covers 24 collected responses, 14 sectors, and 7 districts.
2. The average stored readiness score is 56.25 out of 100, with a median of 56.50.
3. Readiness distribution is Low: 1 (4.17%), Medium: 20 (83.33%), High: 3 (12.50%).
4. Cloud awareness is 50% based on respondents who answered Haa to prior awareness of cloud computing.
5. Current cloud-service usage is 50% based on use of services such as Google Drive, OneDrive, or Dropbox.
6. Adoption willingness is 33.33% based on willingness to use a cloud solution if available.
7. The strongest derived indicator area is Adoption readiness (66.67%), while the largest indicator gap is Technology usage (47.92%).
8. The highest readiness sector is Media & Communication Companies with an average readiness score of 74%.
9. The most common adoption barrier is Amni darro.
10. The dominant open-ended theme is Infrastructure, internet, power, and cost.

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

1. Prioritize low-cost cloud storage and online backup services for organizations still using local or paper-based storage.
2. Deliver practical cloud-awareness and cybersecurity training in Somali for owners, managers, and operational staff.
3. Address infrastructure constraints through backup power, reliable connectivity, and phased migration plans.
4. Use high-readiness sectors as early adoption examples while supporting low-readiness sectors with basic digitization.
5. Create clear access-control, password, and recovery policies before moving sensitive business data to cloud platforms.

# Chapter 17 — Conclusion

This report analyzed cloud computing readiness, challenges, and adoption across surveyed business sectors in Somalia using actual collected survey-response snapshots from the Cloud Computing Survey Analytics System. The dataset includes 24 responses across 14 sectors and 7 districts. The average stored readiness score is 56.25 out of 100, indicating a medium readiness position overall.

The findings show that cloud computing adoption is possible but uneven. Awareness, willingness, and perceived need provide a foundation for adoption, while cost, infrastructure, training, and security concerns continue to shape readiness. Sector comparison confirms that some sectors are better prepared than others, so adoption strategies must be tailored rather than uniform.

The future outlook is positive if stakeholders focus on practical implementation. Organizations should begin with storage, backup, and secure collaboration. Sectors should adopt phased strategies according to readiness level. National stakeholders should support infrastructure, skills, cybersecurity confidence, and affordable cloud services. With these measures, cloud computing can strengthen data protection, continuity, efficiency, and digital transformation across Somalia's business sectors.

## Appendix A — Complete Question Frequency Tables

### Q1. Ganacsigaaga ama hay’addaadu noocee ah ayey tahay?

| Response | Frequency | Percentage of selections | Percentage of respondents |
| --- | --- | --- | --- |
| Banks / Financial Institutions | 2 | 8.33% | 8.33% |
| E-commerce / Online Businesses | 2 | 8.33% | 8.33% |
| Hospitals / Clinics | 2 | 8.33% | 8.33% |
| Hotels / Hospitality Services | 2 | 8.33% | 8.33% |
| Logistics & Transportation | 2 | 8.33% | 8.33% |
| Schools / Educational Institutions | 2 | 8.33% | 8.33% |
| Supermarkets / Retail Shops | 2 | 8.33% | 8.33% |
| Tech-based Restaurants / Cafes | 2 | 8.33% | 8.33% |
| Telecom / Mobile Money Agents | 2 | 8.33% | 8.33% |
| Universities | 2 | 8.33% | 8.33% |
| Media & Communication Companies | 1 | 4.17% | 4.17% |
| NGOs / Non-Profit Organizations | 1 | 4.17% | 4.17% |
| Real Estate / Property Management | 1 | 4.17% | 4.17% |
| SMEs | 1 | 4.17% | 4.17% |

### Q2. Immisa sano ayuu ganacsigaagu shaqeynayay?

| Response | Frequency | Percentage of selections | Percentage of respondents |
| --- | --- | --- | --- |
| 1 | 2 | 8.33% | 8.33% |
| 10 | 2 | 8.33% | 8.33% |
| 11 | 2 | 8.33% | 8.33% |
| 12 | 2 | 8.33% | 8.33% |
| 2 | 2 | 8.33% | 8.33% |
| 3 | 2 | 8.33% | 8.33% |
| 4 | 2 | 8.33% | 8.33% |
| 5 | 2 | 8.33% | 8.33% |
| 6 | 2 | 8.33% | 8.33% |
| 7 | 2 | 8.33% | 8.33% |
| 8 | 2 | 8.33% | 8.33% |
| 9 | 2 | 8.33% | 8.33% |

### Q3. Immisa shaqaale ayaa ka shaqeeya hay’addaada?

| Response | Frequency | Percentage of selections | Percentage of respondents |
| --- | --- | --- | --- |
| 10 | 1 | 4.17% | 4.17% |
| 12 | 1 | 4.17% | 4.17% |
| 14 | 1 | 4.17% | 4.17% |
| 16 | 1 | 4.17% | 4.17% |
| 18 | 1 | 4.17% | 4.17% |
| 20 | 1 | 4.17% | 4.17% |
| 22 | 1 | 4.17% | 4.17% |
| 24 | 1 | 4.17% | 4.17% |
| 26 | 1 | 4.17% | 4.17% |
| 28 | 1 | 4.17% | 4.17% |
| 30 | 1 | 4.17% | 4.17% |
| 32 | 1 | 4.17% | 4.17% |
| 34 | 1 | 4.17% | 4.17% |
| 36 | 1 | 4.17% | 4.17% |
| 38 | 1 | 4.17% | 4.17% |
| 4 | 1 | 4.17% | 4.17% |
| 40 | 1 | 4.17% | 4.17% |
| 42 | 1 | 4.17% | 4.17% |
| 44 | 1 | 4.17% | 4.17% |
| 46 | 1 | 4.17% | 4.17% |
| 48 | 1 | 4.17% | 4.17% |
| 50 | 1 | 4.17% | 4.17% |
| 6 | 1 | 4.17% | 4.17% |
| 8 | 1 | 4.17% | 4.17% |

### Q4. Waaxdee ayaad ka shaqeysaa?

| Response | Frequency | Percentage of selections | Percentage of respondents |
| --- | --- | --- | --- |
| Howlgallada | 6 | 25% | 25% |
| IT | 6 | 25% | 25% |
| Maamulka | 6 | 25% | 25% |
| Xisaabaadka | 6 | 25% | 25% |

### Q5. Ma maqashay erayga “Cloud Computing” hore?

| Response | Frequency | Percentage of selections | Percentage of respondents |
| --- | --- | --- | --- |
| Haa | 12 | 50% | 50% |
| Maya | 12 | 50% | 50% |

### Q6. Sidee baad u qiimeyn lahayd fahamkaaga cloud computing?

| Response | Frequency | Percentage of selections | Percentage of respondents |
| --- | --- | --- | --- |
| Aad u fiican | 5 | 20.83% | 20.83% |
| Dhexdhexaad | 5 | 20.83% | 20.83% |
| Fiican | 5 | 20.83% | 20.83% |
| Yar | 5 | 20.83% | 20.83% |
| Midna ma aqaan | 4 | 16.67% | 16.67% |

### Q7. Maxaad u fahantaa cloud computing?

| Response | Frequency | Percentage of selections | Percentage of respondents |
| --- | --- | --- | --- |
| Cloud computing waa adeeg internet lagu kaydiyo xogta laguna isticmaalo software online ah. | 24 | 100% | 100% |

### Q8. Noocee qalab ah ayaad inta badan isticmaashaan?

| Response | Frequency | Percentage of selections | Percentage of respondents |
| --- | --- | --- | --- |
| Desktop | 6 | 25% | 25% |
| Laptop | 6 | 25% | 25% |
| Mobile phone | 6 | 25% | 25% |
| Tablet | 6 | 25% | 25% |

### Q9. Ma isticmaashaan software maamulka ganacsiga?

| Response | Frequency | Percentage of selections | Percentage of respondents |
| --- | --- | --- | --- |
| Haa | 12 | 50% | 50% |
| Maya | 12 | 50% | 50% |

### Q10. Internet joogto ah ma haysataan?

| Response | Frequency | Percentage of selections | Percentage of respondents |
| --- | --- | --- | --- |
| Haa | 12 | 50% | 50% |
| Maya | 12 | 50% | 50% |

### Q11. Tayada internet-kiinnu sidee tahay?

| Response | Frequency | Percentage of selections | Percentage of respondents |
| --- | --- | --- | --- |
| Aad u fiican | 6 | 25% | 25% |
| Dhexdhexaad | 6 | 25% | 25% |
| Fiican | 6 | 25% | 25% |
| Liita | 6 | 25% | 25% |

### Q12. Xogta ganacsiga xaggee ku kaydsataan?

| Response | Frequency | Percentage of selections | Percentage of respondents |
| --- | --- | --- | --- |
| Cloud storage | 6 | 25% | 25% |
| Computer local ah | 6 | 25% | 25% |
| External hard disk | 6 | 25% | 25% |
| Warqado | 6 | 25% | 25% |

### Q13. Ma sameysaan backup joogto ah?

| Response | Frequency | Percentage of selections | Percentage of respondents |
| --- | --- | --- | --- |
| Haa maalin kasta | 6 | 25% | 25% |
| Mararka qaar | 6 | 25% | 25% |
| Maya | 6 | 25% | 25% |
| Toddobaadle | 6 | 25% | 25% |

### Q14. Immisa jeer ayay xog kaa luntay?

| Response | Frequency | Percentage of selections | Percentage of respondents |
| --- | --- | --- | --- |
| Hal mar | 8 | 33.33% | 33.33% |
| In ka badan hal mar | 8 | 33.33% | 33.33% |
| Marna | 8 | 33.33% | 33.33% |

### Q15. Ma isticmaashaan adeegyada cloud sida Google Drive, OneDrive, Dropbox?

| Response | Frequency | Percentage of selections | Percentage of respondents |
| --- | --- | --- | --- |
| Haa | 12 | 50% | 50% |
| Maya | 12 | 50% | 50% |

### Q16. Haddii haa, adeeggee ugu badan ayaad isticmaashaan?

| Response | Frequency | Percentage of selections | Percentage of respondents |
| --- | --- | --- | --- |
| Dropbox | 6 | 25% | 25% |
| Google Drive | 6 | 25% | 25% |
| Ma isticmaalno | 6 | 25% | 25% |
| OneDrive | 6 | 25% | 25% |

### Q17. Cloud systems ma ka caawiyeen shaqadaada?

| Response | Frequency | Percentage of selections | Percentage of respondents |
| --- | --- | --- | --- |
| Aad u badan | 6 | 25% | 25% |
| Dhexdhexaad | 6 | 25% | 25% |
| Maya | 6 | 25% | 25% |
| Wax yar | 6 | 25% | 25% |

### Q18. Koronto joogto ah ma haysataan?

| Response | Frequency | Percentage of selections | Percentage of respondents |
| --- | --- | --- | --- |
| Haa | 12 | 50% | 50% |
| Maya | 12 | 50% | 50% |

### Q19. Koronto la’aantu intee jeer ayay shaqada hakisaa?

| Response | Frequency | Percentage of selections | Percentage of respondents |
| --- | --- | --- | --- |
| Badanaa | 6 | 25% | 25% |
| Marar dhif ah | 6 | 25% | 25% |
| Mararka qaar | 6 | 25% | 25% |
| Marnaba | 6 | 25% | 25% |

### Q20. Internet la’aantu ma caqabad weyn bay idiin tahay?

| Response | Frequency | Percentage of selections | Percentage of respondents |
| --- | --- | --- | --- |
| Haa | 12 | 50% | 50% |
| Maya | 12 | 50% | 50% |

### Q21. Maxay yihiin caqabadaha ugu waaweyn ee kaa hor istaagaya cloud adoption?

| Response | Frequency | Percentage of selections | Percentage of respondents |
| --- | --- | --- | --- |
| Amni darro | 6 | 25% | 25% |
| Aqoonta oo yar | 6 | 25% | 25% |
| Internet liita | 6 | 25% | 25% |
| Kharash badan | 6 | 25% | 25% |

### Q22. Shaqaalahaagu ma leeyihiin xirfad ku filan cloud technology?

| Response | Frequency | Percentage of selections | Percentage of respondents |
| --- | --- | --- | --- |
| Haa | 8 | 33.33% | 33.33% |
| Maya | 8 | 33.33% | 33.33% |
| Qaar kaliya | 8 | 33.33% | 33.33% |

### Q23. Tababar ma u baahan tihiin?

| Response | Frequency | Percentage of selections | Percentage of respondents |
| --- | --- | --- | --- |
| Haa | 12 | 50% | 50% |
| Maya | 12 | 50% | 50% |

### Q24. Ma ku kalsoon tahay in xogtaada lagu kaydiyo cloud?

| Response | Frequency | Percentage of selections | Percentage of respondents |
| --- | --- | --- | --- |
| Aad baan ugu kalsoonahay | 6 | 25% | 25% |
| Dhexdhexaad | 6 | 25% | 25% |
| Kuma kalsooni | 6 | 25% | 25% |
| Waan ku kalsoonahay | 6 | 25% | 25% |

### Q25. Maxaa kaa walwal geliya cloud security?

| Response | Frequency | Percentage of selections | Percentage of respondents |
| --- | --- | --- | --- |
| Access control la’aan | 6 | 25% | 25% |
| Hackers | 6 | 25% | 25% |
| Sirta oo baxda | 6 | 25% | 25% |
| Xatooyo xog | 6 | 25% | 25% |

### Q26. Ganacsigaagu ma u baahan yahay nidaam digital casri ah?

| Response | Frequency | Percentage of selections | Percentage of respondents |
| --- | --- | --- | --- |
| Haa | 12 | 50% | 50% |
| Maya | 12 | 50% | 50% |

### Q27. Haddii cloud solution la heli karo, ma diyaar baad u tahay inaad isticmaasho?

| Response | Frequency | Percentage of selections | Percentage of respondents |
| --- | --- | --- | --- |
| Haa | 8 | 33.33% | 33.33% |
| Maya | 8 | 33.33% | 33.33% |
| Waxaa ku xiran qiimaha | 8 | 33.33% | 33.33% |

### Q28. Maxay yihiin adeegyada aad rabto in cloud kuu xalliyo?

| Response | Frequency | Percentage of selections | Percentage of respondents |
| --- | --- | --- | --- |
| backup | 24 | 33.33% | 100% |
| iyo maamulka dukumentiyada. | 24 | 33.33% | 100% |
| Waxaan rabnaa kayd xogeed | 24 | 33.33% | 100% |

### Q29. Sidee ayaad u aragtaa mustaqbalka cloud computing ee Soomaaliya?

| Response | Frequency | Percentage of selections | Percentage of respondents |
| --- | --- | --- | --- |
| Mustaqbalka cloud computing ee Soomaaliya wuu kori karaa haddii internet iyo tababar la helo. | 24 | 100% | 100% |

### Q30. Maxaad kula talin lahayd dowladda ama shirkadaha si loo kordhiyo cloud adoption-ka Soomaaliya?

| Response | Frequency | Percentage of selections | Percentage of respondents |
| --- | --- | --- | --- |
| Dowladda iyo shirkaduhu ha kordhiyaan wacyigelin | 24 | 33.33% | 100% |
| iyo adeegyo qiimo jaban. | 24 | 33.33% | 100% |
| tababar | 24 | 33.33% | 100% |

## Appendix B — District Comparison

| District | Responses | Average readiness | Awareness | Technology | Infrastructure | Backup | Cloud use | Security | Willingness |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Garowe | 3 | 60.33% | 69.17% | 52.08% | 52.67% | 48.89% | 72.22% | 53.33% | 66.67% |
| Hodan | 4 | 58.25% | 61.25% | 56.25% | 54.50% | 57.50% | 60.83% | 52.50% | 75% |
| Baidoa | 3 | 56.67% | 51.67% | 52.08% | 57% | 58.89% | 55.56% | 50% | 66.67% |
| Karaan | 4 | 55.50% | 53.13% | 50% | 54.50% | 53.33% | 60.83% | 52.50% | 62.50% |
| Wadajir | 4 | 55% | 59.38% | 50% | 54.50% | 53.33% | 60.83% | 52.50% | 62.50% |
| Kismayo | 3 | 54.67% | 60.83% | 52.08% | 50.67% | 55.56% | 65.56% | 53.33% | 66.67% |
| Hargeisa | 3 | 53.33% | 49.17% | 52.08% | 57.67% | 55.56% | 50% | 53.33% | 66.67% |

## Appendix C — Evidence Files

The evidence JSON is saved at `reports/cloud-readiness-analytics.json`. The complete report is saved at `reports/cloud-computing-readiness-somalia-report.md`.
