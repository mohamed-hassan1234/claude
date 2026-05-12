"""Analytics engine for the updated 30-question Cloud Computing survey."""

from __future__ import annotations

import json
import math
import re
import statistics
import sys
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path


QUESTIONS = {
    "q1": "Magaca Ganacsiga / Hay’adda",
    "q2": "Nooca Ganacsiga",
    "q3": "Degmada / Goobta",
    "q4": "Waa maxay doorkaaga xaruntan ama ganacsigan?",
    "q5": "Immisa shaqaale ah ayuu xaruntaan/ganacsigani leeyahay?",
    "q6": "Hore ma u maqashay erayga “Cloud Computing”?",
    "q7": "Sidee ayaad u qiimeyn lahayd heerka wacyiga xaruntaada ee ku saabsan Cloud Computing?",
    "q8": "Qalabkee ayay xaruntaada si maalinle ah u isticmaashaa?",
    "q9": "Hadda xaruntaada ma isticmaaleysaa softwares ama nidaamyo dijitaal ah oo hawlaha loo adeegsado?",
    "q10": "Nidaamyada soo socda kee ayay xaruntaada hadda isticmaalshaa?",
    "q11": "Sidee ayaad u qiimeyn lahayd heerka isticmaalka teknoolojiyadda ee xaruntaada?",
    "q12": "Hawlaha xaruntaada kee ayaa weli inta badan gacanta lagu qabtaa?",
    "q13": "Halkee ayay xaruntaadu inta badan ku kaydisaa xogta muhiimka ah?",
    "q14": "Intee jeer ayay xaruntaadu backup u samaysaa xogta muhiimka ah?",
    "q15": "Xaruntaadu waligeed ma la kulantay xog lumis?",
    "q16": "Sababta ugu weyn ee luminta xogta ee xaruntaada waa?",
    "q17": "Kalsooni intee le’eg ayaad ku qabtaa habka aad hadda u keydisaan xogta?",
    "q18": "Xaruntaada hadda ma isticmaaleysaa qalab ku salaysan Cloud?",
    "q19": "Qalabka Cloud-ka ama adeegyada online-ka ah kee ayay xaruntaada isticmaashaa?",
    "q20": "Intee in la eg ayuu muhiin u yahay xaruntaada isticmaalka cloud apps?",
    "q21": "Shaqada maalinlaha ah, intee in la eg ayay xaruntaada isticmaashaa cloud apps?",
    "q22": "Heerkee ayuu gaarsiisan yahay isku halaynta adeegyada internet-ka ee xaruntaada?",
    "q23": "Inta lagu guda jiro xilliga shaqada, deganaanta korontada (stability), heerkee ayuu gaarsiisan yahay?",
    "q24": "Xaruntaadu ma leedahay koronto kayd ah (generator ama solar)?",
    "q25": "Waa maxay caqabadda ugu weyn ee ka hor istaagta xaruntaada inay horumariso isticmaalka teknoolojiyadda?",
    "q26": "Ku keydinta xogta internet-ka, intee in la eg ayaad welwel ka qabtaa?",
    "q27": "Waa maxay welwelka ugu weyn ee xaruntaada ka qabo nidaamyada Cloud-ka?",
    "q28": "Waa kuwee adeegyada Cloud-ka ee waxtar u leh xaruntaada?",
    "q29": "Ma isleedahay Cloud Computing wax weyn ayuu ka bedeli karaa xaruntaada?",
    "q30": "Sidee ayuu Cloud Computing u saameyn karaa ama u horumarin karaa xaruntaada?",
}

TEXT_QUESTIONS = {"q1", "q3", "q30"}
OPEN_TEXT_ANALYSIS_QUESTIONS = {"q30"}

FACTOR_QUESTIONS = {
    "cloudAwareness": ["q6", "q7"],
    "technologyUse": ["q8", "q9", "q10", "q11", "q12"],
    "infrastructureReadiness": ["q22", "q23", "q24"],
    "backupPractices": ["q13", "q14", "q15", "q16", "q17"],
    "cloudToolsUse": ["q18", "q19", "q20", "q21"],
    "securityTrust": ["q26", "q27"],
    "willingnessToAdopt": ["q28", "q29"],
}

FACTOR_LABELS = {
    "cloudAwareness": "Cloud awareness",
    "technologyUse": "Technology usage",
    "infrastructureReadiness": "Infrastructure readiness",
    "backupPractices": "Data storage and backup",
    "cloudToolsUse": "Cloud usage",
    "securityTrust": "Security confidence",
    "willingnessToAdopt": "Adoption readiness",
}

SCORES = {
    "q6": {"Haa": 100, "Maya": 0},
    "q7": {"Aad u sarreeya": 100, "Sarreeya": 80, "Dhexdhexaad": 60, "Hooseeya": 30, "Aad u hooseeya": 10},
    "q8": {"Desktop": 75, "Laptop": 85, "Tablet": 65, "Mobile phone": 55, "Printer": 55, "POS system": 85},
    "q9": {"Haa": 100, "Maya": 20},
    "q10": {
        "Accounting software": 90,
        "Inventory system": 90,
        "POS system": 85,
        "HR system": 85,
        "CRM system": 85,
        "Email system": 80,
        "WhatsApp Business": 65,
        "Ma isticmaalno": 0,
    },
    "q11": {"Aad u sarreeya": 100, "Sarreeya": 80, "Dhexdhexaad": 60, "Hooseeya": 30, "Aad u hooseeya": 10},
    "q12": {"Xisaabaadka": 30, "Kaydinta xogta": 25, "Macaamiisha": 35, "Iibka": 40, "Inventory": 35, "HR / shaqaalaha": 40, "Warbixinada": 30, "Waxba": 100},
    "q13": {"Warqado": 10, "Computer local ah": 40, "External hard disk": 60, "Mobile phone": 30, "Cloud storage": 100, "Server gudaha xarunta": 80},
    "q14": {"Maalin kasta": 100, "Toddobaadle": 80, "Bille": 60, "Mararka qaar": 35, "Marnaba": 0},
    "q15": {"Haa": 30, "Maya": 100},
    "q16": {"Koronto la’aan": 35, "Qalab xumaaday": 30, "Virus / malware": 20, "Qalad shaqaale": 45, "Backup la’aan": 10, "Ma jirto xog lumis": 100},
    "q17": {"Aad baan ugu kalsoonahay": 100, "Waan ku kalsoonahay": 80, "Dhexdhexaad": 60, "Kalsooni yar": 30, "Kuma kalsooni": 10},
    "q18": {"Haa": 100, "Maya": 0},
    "q19": {"Google Drive": 85, "Dropbox": 80, "OneDrive": 80, "Google Workspace": 95, "Microsoft 365": 95, "Zoom": 75, "WhatsApp Business": 65, "Online accounting system": 90, "Ma isticmaalno": 0},
    "q20": {"Aad muhiim u ah": 100, "Muhiim": 80, "Dhexdhexaad": 60, "Muhiim ma aha": 10},
    "q21": {"Maalin kasta": 100, "Marar badan": 80, "Mararka qaar": 55, "Marar dhif ah": 25, "Marnaba": 0},
    "q22": {"Aad u sarreeya": 100, "Sarreeya": 80, "Dhexdhexaad": 60, "Hooseeya": 30, "Aad u hooseeya": 10},
    "q23": {"Aad u sarreeya": 100, "Sarreeya": 80, "Dhexdhexaad": 60, "Hooseeya": 30, "Aad u hooseeya": 10},
    "q24": {"Haa": 100, "Maya": 20},
    "q26": {"Aad baan uga welwelsanahay": 10, "Waan ka welwelsanahay": 30, "Dhexdhexaad": 60, "Wax yar": 80, "Ma welwelsani": 100},
    "q27": {"Xatooyo xog": 25, "Hackers": 25, "Sirta oo baxda": 25, "Qiimaha adeegga": 55, "Internet la’aan": 45, "Access control la’aan": 30},
    "q28": {"Cloud storage": 85, "Online backup": 90, "Email hosting": 75, "Accounting system": 85, "Inventory system": 85, "Customer management": 85, "Video meetings": 70, "Data analytics": 95},
    "q29": {"Haa": 100, "Maya": 0},
}

STOP_WORDS = {"iyo", "ama", "waa", "wax", "in", "la", "oo", "ka", "ku", "ay", "uu", "u", "ah", "ee", "si", "leh", "naga", "nagu", "karo", "kartaa"}
THEME_RULES = [
    ("Backup iyo kaydinta xogta", ["backup", "kayd", "kaydin", "xog", "dukumenti"]),
    ("Amniga xogta", ["amn", "sir", "xatooyo", "hack", "ilaalin"]),
    ("Wada shaqeyn iyo helitaan", ["wada", "shaqeyn", "online", "hel", "fog"]),
    ("Hufnaan shaqo", ["hufnaan", "fudud", "degdeg", "maamul", "warbixin"]),
    ("Qiime iyo kaabayaal", ["qiime", "kharash", "internet", "koronto"]),
    ("Adeegga macaamiisha", ["macaamiil", "customer", "iib", "adeeg"]),
]


def safe_str(value) -> str:
    if value is None:
        return ""
    return str(value).strip()


def round_number(value, digits=0):
    try:
        return round(float(value), digits)
    except (TypeError, ValueError):
        return 0


def mean(values):
    values = [float(value) for value in values if isinstance(value, (int, float)) or str(value).strip()]
    return sum(values) / len(values) if values else 0


def split_answer(value):
    if isinstance(value, list):
        return [safe_str(item) for item in value if safe_str(item)]
    text = safe_str(value)
    if not text:
        return []
    return [item.strip() for item in text.split(",") if item.strip()]


def frequency(values):
    counts = Counter()
    for value in values:
        for answer in split_answer(value):
            counts[answer] += 1
    total = sum(counts.values())
    return [
        {"answer": answer, "label": answer, "count": count, "percentage": round_number((count / total) * 100, 2) if total else 0}
        for answer, count in sorted(counts.items(), key=lambda item: (-item[1], item[0]))
    ]


def frequency_for(rows, key):
    return frequency(row.get(key) for row in rows)


def score_answer(code, value):
    answers = split_answer(value)
    if not answers:
        return 0
    score_map = SCORES.get(code, {})
    return mean([score_map.get(answer, 40) for answer in answers])


def enrich_rows(rows):
    enriched = []
    for row in rows:
        item = dict(row)
        factor_values = {}
        for factor, codes in FACTOR_QUESTIONS.items():
            scores = [score_answer(code, row.get(QUESTIONS[code])) for code in codes]
            factor_values[factor] = mean(scores)
        item.update(factor_values)
        item["calculatedReadiness"] = mean(factor_values.values())
        enriched.append(item)
    return enriched


def readiness_stats(rows):
    scores = []
    for row in rows:
        stored = round_number(row.get("readinessScore"))
        scores.append(stored if stored > 0 else round_number(row.get("calculatedReadiness")))
    if not scores:
        return {"average": 0, "median": 0, "min": 0, "max": 0}
    return {"average": round_number(mean(scores)), "median": round_number(statistics.median(scores)), "min": round_number(min(scores)), "max": round_number(max(scores))}


def comparison_rows(rows, key, label_key):
    grouped = defaultdict(list)
    for row in rows:
        grouped[safe_str(row.get(key)) or "Unknown"].append(row)
    result = []
    for label, items in grouped.items():
        entry = {
            label_key: label,
            "label": label,
            "responses": len(items),
            "averageReadiness": round_number(mean([item.get("calculatedReadiness", 0) for item in items])),
        }
        for factor in FACTOR_QUESTIONS:
            entry[factor] = round_number(mean([item.get(factor, 0) for item in items]))
        result.append(entry)
    return sorted(result, key=lambda item: item["averageReadiness"], reverse=True)


def factor_summary(rows):
    return sorted(
        [{"factor": factor, "label": FACTOR_LABELS[factor], "score": round_number(mean([row.get(factor, 0) for row in rows]))} for factor in FACTOR_LABELS],
        key=lambda item: item["score"],
        reverse=True,
    )


def gap_analysis(rows):
    return sorted(
        [{"factor": factor, "label": label, "current": round_number(mean([row.get(factor, 0) for row in rows])), "ideal": 100, "gap": round_number(100 - mean([row.get(factor, 0) for row in rows]))} for factor, label in FACTOR_LABELS.items()],
        key=lambda item: item["gap"],
        reverse=True,
    )


def readiness_bands(rows):
    counts = Counter()
    for row in rows:
        score = round_number(row.get("readinessScore")) or round_number(row.get("calculatedReadiness"))
        counts["High" if score >= 70 else "Medium" if score >= 40 else "Low"] += 1
    total = len(rows) or 1
    return [{"band": band, "label": band, "count": counts[band], "percentage": round_number((counts[band] / total) * 100, 2)} for band in ["Low", "Medium", "High"]]


def daily_responses(rows):
    counts = Counter()
    for row in rows:
        text = safe_str(row.get("submittedAt"))
        if not text:
            continue
        counts[text[:10]] += 1
    return [{"date": date, "responses": count} for date, count in sorted(counts.items())]


def answer_rate(rows, code, positives):
    column = QUESTIONS[code]
    positive_set = set(positives)
    answered = [split_answer(row.get(column)) for row in rows if split_answer(row.get(column))]
    if not answered:
        return 0
    return round_number((sum(1 for items in answered if any(item in positive_set for item in items)) / len(answered)) * 100, 2)


def analyze_text_question(rows, code):
    column = QUESTIONS[code]
    responses = [safe_str(row.get(column)) for row in rows if safe_str(row.get(column))]
    word_counts = Counter()
    themes = {theme: {"theme": theme, "count": 0, "examples": [], "keywords": keywords} for theme, keywords in THEME_RULES}

    for response in responses:
        words = [word for word in re.sub(r"[^\w\s’'-]", " ", response.lower()).split() if len(word) > 2 and word not in STOP_WORDS]
        word_counts.update(words)
        normalized = response.lower()
        matched = False
        for theme, keywords in THEME_RULES:
            if any(keyword in normalized for keyword in keywords):
                themes[theme]["count"] += 1
                matched = True
                if len(themes[theme]["examples"]) < 3:
                    themes[theme]["examples"].append(response)
        if not matched:
            themes.setdefault("Fikrado kale", {"theme": "Fikrado kale", "count": 0, "examples": [], "keywords": []})
            themes["Fikrado kale"]["count"] += 1
            if len(themes["Fikrado kale"]["examples"]) < 3:
                themes["Fikrado kale"]["examples"].append(response)

    total = len(responses) or 1
    theme_rows = [
        {**theme, "percentage": round_number((theme["count"] / total) * 100, 2)}
        for theme in themes.values()
        if theme["count"]
    ]
    theme_rows.sort(key=lambda item: item["count"], reverse=True)
    keywords = [{"keyword": word, "count": count} for word, count in word_counts.most_common(20)]
    summary = f"{theme_rows[0]['theme']} ayaa ah mawduuca ugu badan ee ka muuqda jawaabaha furan." if theme_rows else "No open-ended responses were available for this question."
    return {
        "question": column,
        "totalResponses": len(responses),
        "themes": theme_rows,
        "keywords": keywords,
        "groupedTopics": [{"topic": item["theme"], "count": item["count"], "percentage": item["percentage"], "examples": item["examples"]} for item in theme_rows],
        "sampleResponses": responses[:5],
        "summary": summary,
    }


def build_question_analysis(rows, frequencies, text_analysis):
    result = []
    for code, question in QUESTIONS.items():
        values = [row.get(question) for row in rows]
        total = sum(1 for value in values if split_answer(value))
        if code in OPEN_TEXT_ANALYSIS_QUESTIONS:
            analysis = text_analysis.get(code) or analyze_text_question(rows, code)
            result.append({"code": code, "question": question, "type": "text", "totalResponses": analysis["totalResponses"], "answers": frequencies[code]["answers"], "textAnalysis": analysis, "interpretation": analysis["summary"]})
        else:
            result.append({"code": code, "question": question, "type": "text" if code in TEXT_QUESTIONS else "closed", "totalResponses": total, "answers": frequencies[code]["answers"], "interpretation": ""})
    return result


def important_questions(frequencies):
    codes = ["q2", "q6", "q8", "q10", "q11", "q13", "q18", "q19", "q22", "q25", "q26", "q28", "q29"]
    result = []
    for code in codes:
        answers = frequencies.get(code, {}).get("answers", [])
        result.append({"code": code, "question": QUESTIONS[code], "topAnswer": answers[0]["answer"] if answers else "No answer", "topCount": answers[0]["count"] if answers else 0, "topPercentage": answers[0]["percentage"] if answers else 0, "answers": answers})
    return result


def recommendations(stats, gaps, frequencies):
    recs = []
    if stats["average"] < 40:
        recs.append("Mudnaanta sii wacyigelin Cloud Computing, tababar aasaasi ah, iyo adeegyo tijaabo ah oo qiimo jaban.")
    elif stats["average"] < 70:
        recs.append("Xooji backup joogto ah, isticmaalka cloud apps, iyo hagitaan amni oo shaqaalaha la fahamsiin karo.")
    else:
        recs.append("Ballaarinta cloud systems-ka ku dhis governance, access control, iyo cabbir joogto ah oo waxqabadka ah.")
    for gap in gaps[:3]:
        recs.append(f"Qodobka {gap['label']} wuxuu leeyahay farqi {gap['gap']}%, sidaas darteed wuxuu u baahan yahay qorshe gaar ah.")
    barrier = (frequencies.get("q25", {}).get("answers") or [{}])[0].get("answer")
    if barrier:
        recs.append(f"Caqabadda ugu badan waa {barrier}; qorshaha horumarintu waa inuu si toos ah u xalliyo.")
    return recs[:6]


def empty_payload():
    return {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "totalResponses": 0,
        "totals": {"totalResponses": 0},
        "frequencyAnalysis": {},
        "percentageAnalysis": {},
        "questionAnalysis": [],
        "readinessStats": {"average": 0, "median": 0, "min": 0, "max": 0},
        "factorSummary": [],
        "summaryFindings": ["No survey responses match the selected filters yet."],
        "recommendations": ["Collect more responses before drawing operational conclusions."],
    }


def analyze(rows):
    if not rows:
        return empty_payload()

    rows = enrich_rows(rows)
    frequencies = {code: {"question": question, "answers": frequency_for(rows, question)} for code, question in QUESTIONS.items()}
    text_analysis = {"q30": analyze_text_question(rows, "q30")}
    question_analysis = build_question_analysis(rows, frequencies, text_analysis)
    stats = readiness_stats(rows)
    sectors = comparison_rows(rows, "sector", "sector")
    districts = comparison_rows(rows, "district", "district")
    factors = factor_summary(rows)
    gaps = gap_analysis(rows)
    sector_distribution = frequency_for(rows, "sector")
    district_distribution = frequency_for(rows, "district")
    barriers = frequencies["q25"]["answers"]
    security_concerns = frequencies["q27"]["answers"]
    willingness = frequencies["q29"]["answers"]
    awareness = frequencies["q6"]["answers"]
    cloud_needs = frequencies["q28"]["answers"]
    readiness_distribution = readiness_bands(rows)
    today = datetime.now(timezone.utc).date().isoformat()
    responses_today = sum(1 for row in rows if safe_str(row.get("submittedAt")).startswith(today))
    readiness_values = [round_number(row.get("calculatedReadiness")) for row in rows]
    readiness_mean = mean(readiness_values)
    variance = mean([(value - readiness_mean) ** 2 for value in readiness_values]) if readiness_values else 0

    totals = {
        "totalResponses": len(rows),
        "totalSectorsCovered": len({safe_str(row.get("sector")) for row in rows if safe_str(row.get("sector"))}),
        "totalDistrictsCovered": len({safe_str(row.get("district")) for row in rows if safe_str(row.get("district"))}),
        "responsesToday": responses_today,
        "responsesThisWeek": len(rows),
        "averageCloudReadinessScore": stats["average"],
        "awarenessRate": answer_rate(rows, "q6", ["Haa"]),
        "adoptionWillingnessRate": answer_rate(rows, "q29", ["Haa"]),
        "cloudToolsUsageRate": answer_rate(rows, "q18", ["Haa"]),
        "backupPracticeRate": answer_rate(rows, "q14", ["Maalin kasta", "Toddobaadle", "Bille", "Mararka qaar"]),
        "infrastructureStabilityRate": round_number(mean([row.get("infrastructureReadiness", 0) for row in rows])),
        "securityTrustRate": round_number(mean([row.get("securityTrust", 0) for row in rows])),
    }

    summary_findings = [
        f"{len(rows)} responses were analyzed across {totals['totalSectorsCovered']} sectors and {totals['totalDistrictsCovered']} districts.",
        f"The average cloud readiness score is {stats['average']} out of 100.",
        f"The most represented sector is {(sector_distribution or [{'answer': 'No sector'}])[0]['answer']}.",
        f"The highest readiness sector is {(sectors or [{'sector': 'No sector'}])[0]['sector']}.",
        f"The most common technology improvement barrier is {(barriers or [{'answer': 'No dominant barrier'}])[0]['answer']}.",
        f"The strongest readiness area is {(factors or [{'label': 'No factor'}])[0]['label']}, while the largest gap is {(gaps or [{'label': 'No factor'}])[0]['label']}.",
    ]
    recs = recommendations(stats, gaps, frequencies)

    return {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "totalResponses": len(rows),
        "totals": totals,
        "filterOptions": {
            "districts": [item["answer"] for item in district_distribution],
            "awarenessLevels": [item["answer"] for item in awareness],
            "willingnessLevels": [item["answer"] for item in willingness],
            "readinessLevels": ["Low", "Medium", "High"],
        },
        "overview": {
            "totals": totals,
            "insightCards": [
                {"label": "Sector Distribution", "value": (sector_distribution or [{"answer": "No sector"}])[0]["answer"], "helper": "Most represented sector"},
                {"label": "Cloud Awareness", "value": f"{totals['awarenessRate']}%", "helper": "Q6 Haa responses"},
                {"label": "Technology Usage", "value": f"{round_number(mean([row.get('technologyUse', 0) for row in rows]))}%", "helper": "Combined Q8-Q12 score"},
                {"label": "Adoption Readiness", "value": f"{totals['adoptionWillingnessRate']}%", "helper": "Q29 Haa responses"},
            ],
            "executiveSummary": summary_findings[0],
            "timeSeries": {"dailyResponses": daily_responses(rows), "readinessTrend": [], "awarenessTrend": []},
            "readinessBands": readiness_distribution,
        },
        "questionAnalysis": question_analysis,
        "frequencyAnalysis": frequencies,
        "percentageAnalysis": frequencies,
        "readinessStats": stats,
        "factorSummary": factors,
        "sectorComparison": {"rows": sectors, "readinessLeaderboard": sectors, "stackedReadiness": sectors},
        "districtComparison": {"rows": districts, "ranking": districts},
        "readiness": {
            "overallAverage": stats["average"],
            "distribution": readiness_distribution,
            "sectorLeaderboard": sectors,
            "districtLeaderboard": districts,
            "responseRanking": [],
            "radar": factors,
            "factorBreakdown": factors,
            "lowReadinessAlerts": [item for item in sectors if item["averageReadiness"] < 40],
            "highReadinessOpportunities": [item for item in sectors if item["averageReadiness"] >= 70],
            "interpretation": f"Average cloud readiness is {stats['average']}%.",
            "explanation": "Readiness combines awareness, technology usage, backup, cloud usage, infrastructure, security, and adoption readiness.",
        },
        "gapAnalysis": {
            "overall": gaps,
            "progressToIdeal": [{**item, "value": item["current"]} for item in gaps],
            "sectorGaps": sectors,
            "districtGaps": districts,
            "largestGapFactor": (gaps or [{"label": "No factor"}])[0]["label"],
            "largestGapSector": (sectors[-1]["sector"] if sectors else "No sector"),
            "largestGapDistrict": (districts[-1]["district"] if districts else "No district"),
            "narrative": [f"{item['label']} has a {item['gap']}% gap to ideal readiness." for item in gaps[:3]],
        },
        "infrastructure": {
            "internetAvailability": frequencies["q22"]["answers"],
            "internetQuality": frequencies["q22"]["answers"],
            "electricityAvailability": frequencies["q24"]["answers"],
            "interruptionFrequency": frequencies["q23"]["answers"],
            "sectorComparison": sectors,
            "riskSummary": [item for item in gaps if item["factor"] == "infrastructureReadiness"],
        },
        "security": {
            "trustLevels": frequencies["q26"]["answers"],
            "securityConcerns": security_concerns,
            "sectorTrustComparison": [{"sector": item["sector"], "trust": item["securityTrust"], "responses": item["responses"]} for item in sectors],
            "topConcernLeaderboard": security_concerns,
            "fearSummary": security_concerns,
            "trustBuildingRecommendations": ["Sharax encryption, access control, iyo backup policies si loo dhiso kalsoonida cloud-ka."],
        },
        "barriers": {
            "overallRanking": barriers,
            "challengeFrequency": barriers,
            "topFiveChallenges": barriers[:5],
            "bySector": sectors,
            "byDistrict": districts,
            "mostCommonBarrier": (barriers or [{"answer": "No dominant barrier"}])[0]["answer"],
        },
        "businessNeeds": {
            "digitalNeeds": cloud_needs,
            "willingness": willingness,
            "openEndedQuestions": text_analysis,
            "themeCards": text_analysis["q30"]["themes"],
            "groupedTopicBlocks": text_analysis["q30"]["groupedTopics"],
            "keywordChart": text_analysis["q30"]["keywords"],
            "insightSummaries": [text_analysis["q30"]["summary"]],
            "mostCommonRecommendationTheme": (text_analysis["q30"]["themes"] or [{"theme": "No dominant theme"}])[0]["theme"],
        },
        "recommendationBlocks": {"overall": recs, "sectorSpecific": [], "districtSpecific": [], "summary": recs},
        "reportView": {
            "title": "Somalia Cloud Computing Survey Analytics Report",
            "subtitle": f"{len(rows)} filtered responses",
            "executiveSummary": f"This report analyzes {len(rows)} responses using the updated 30-question Cloud Computing survey instrument.",
            "keyFindings": summary_findings,
            "readinessRanking": sectors,
            "topBarriers": barriers,
            "topOpportunities": cloud_needs[:5],
            "recommendations": recs,
            "conclusion": "The updated responses show where cloud adoption can grow through better awareness, practical cloud tools, reliable infrastructure, security confidence, and clear business value.",
        },
        "importantQuestionAnalysis": important_questions(frequencies),
        "districtDistribution": district_distribution,
        "sectorDistribution": sector_distribution,
        "awarenessDistribution": awareness,
        "willingnessDistribution": willingness,
        "commonBarriers": barriers,
        "infrastructureChallenges": frequencies["q22"]["answers"],
        "securityConcerns": security_concerns,
        "cloudTools": frequencies["q19"]["answers"],
        "cloudNeeds": cloud_needs,
        "charts": {},
        "summaryFindings": summary_findings,
        "recommendations": recs,
        "descriptiveStatistics": {
            "responsesBySector": totals["totalSectorsCovered"],
            "responsesByDistrict": totals["totalDistrictsCovered"],
            "stdDeviationReadiness": round_number(math.sqrt(variance), 2),
        },
    }


def main():
    if len(sys.argv) < 2:
        raise SystemExit("Usage: analyze.py <rows.json>")
    rows = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    print(json.dumps(analyze(rows), ensure_ascii=False))


if __name__ == "__main__":
    main()
