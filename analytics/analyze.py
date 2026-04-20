"""Advanced Python analytics engine for the Cloud Survey System.

The backend sends filtered survey rows as JSON. Each row contains metadata plus
the exact Somali question text as column names and the real Somali answer labels
as values. This script never expects numeric option indexes.
"""

import json
import re
import sys
from collections import Counter
from pathlib import Path
from uuid import uuid4

import matplotlib

matplotlib.use("Agg")

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd


QUESTIONS = {
    "q1": "Ganacsigaaga ama hay’addaadu noocee ah ayey tahay?",
    "q2": "Immisa sano ayuu ganacsigaagu shaqeynayay?",
    "q3": "Immisa shaqaale ayaa ka shaqeeya hay’addaada?",
    "q4": "Waaxdee ayaad ka shaqeysaa?",
    "q5": "Ma maqashay erayga “Cloud Computing” hore?",
    "q6": "Sidee baad u qiimeyn lahayd fahamkaaga cloud computing?",
    "q7": "Maxaad u fahantaa cloud computing?",
    "q8": "Noocee qalab ah ayaad inta badan isticmaashaan?",
    "q9": "Ma isticmaashaan software maamulka ganacsiga?",
    "q10": "Internet joogto ah ma haysataan?",
    "q11": "Tayada internet-kiinnu sidee tahay?",
    "q12": "Xogta ganacsiga xaggee ku kaydsataan?",
    "q13": "Ma sameysaan backup joogto ah?",
    "q14": "Immisa jeer ayay xog kaa luntay?",
    "q15": "Ma isticmaashaan adeegyada cloud sida Google Drive, OneDrive, Dropbox?",
    "q16": "Haddii haa, adeeggee ugu badan ayaad isticmaashaan?",
    "q17": "Cloud systems ma ka caawiyeen shaqadaada?",
    "q18": "Koronto joogto ah ma haysataan?",
    "q19": "Koronto la’aantu intee jeer ayay shaqada hakisaa?",
    "q20": "Internet la’aantu ma caqabad weyn bay idiin tahay?",
    "q21": "Maxay yihiin caqabadaha ugu waaweyn ee kaa hor istaagaya cloud adoption?",
    "q22": "Shaqaalahaagu ma leeyihiin xirfad ku filan cloud technology?",
    "q23": "Tababar ma u baahan tihiin?",
    "q24": "Ma ku kalsoon tahay in xogtaada lagu kaydiyo cloud?",
    "q25": "Maxaa kaa walwal geliya cloud security?",
    "q26": "Ganacsigaagu ma u baahan yahay nidaam digital casri ah?",
    "q27": "Haddii cloud solution la heli karo, ma diyaar baad u tahay inaad isticmaasho?",
    "q28": "Maxay yihiin adeegyada aad rabto in cloud kuu xalliyo?",
    "q29": "Sidee ayaad u aragtaa mustaqbalka cloud computing ee Soomaaliya?",
    "q30": "Maxaad kula talin lahayd dowladda ama shirkadaha si loo kordhiyo cloud adoption-ka Soomaaliya?",
}

TEXT_QUESTIONS = {"q7", "q16", "q28", "q29", "q30"}

FACTOR_QUESTIONS = {
    "cloudAwareness": ["q5", "q6"],
    "technologyUse": ["q8", "q9"],
    "infrastructureReadiness": ["q10", "q11", "q18", "q19", "q20"],
    "backupPractices": ["q12", "q13"],
    "cloudToolsUse": ["q15", "q17"],
    "securityTrust": ["q24"],
    "willingnessToAdopt": ["q27"],
}

FACTOR_LABELS = {
    "cloudAwareness": "Cloud awareness",
    "technologyUse": "Technology usage",
    "infrastructureReadiness": "Infrastructure stability",
    "backupPractices": "Backup readiness",
    "cloudToolsUse": "Cloud tools usage",
    "securityTrust": "Security trust",
    "willingnessToAdopt": "Adoption willingness",
}

FACTOR_ORDER = list(FACTOR_QUESTIONS.keys())

SCORES = {
    "q5": {"Haa": 100, "Maya": 0},
    "q6": {"Aad u fiican": 100, "Fiican": 80, "Dhexdhexaad": 60, "Yar": 30, "Midna ma aqaan": 0},
    "q8": {"Desktop": 70, "Laptop": 85, "Tablet": 65, "Mobile phone": 50},
    "q9": {"Haa": 100, "Maya": 20},
    "q10": {"Haa": 100, "Maya": 0},
    "q11": {"Aad u fiican": 100, "Fiican": 80, "Dhexdhexaad": 60, "Liita": 20},
    "q12": {"Warqado": 10, "Computer local ah": 45, "External hard disk": 60, "Cloud storage": 100},
    "q13": {"Haa maalin kasta": 100, "Toddobaadle": 80, "Mararka qaar": 45, "Maya": 0},
    "q15": {"Haa": 100, "Maya": 0},
    "q17": {"Aad u badan": 100, "Dhexdhexaad": 60, "Wax yar": 30, "Maya": 0},
    "q18": {"Haa": 100, "Maya": 0},
    "q19": {"Badanaa": 10, "Mararka qaar": 45, "Marar dhif ah": 75, "Marnaba": 100},
    "q20": {"Haa": 20, "Maya": 100},
    "q24": {"Aad baan ugu kalsoonahay": 100, "Waan ku kalsoonahay": 80, "Dhexdhexaad": 60, "Kuma kalsooni": 10},
    "q27": {"Haa": 100, "Maya": 0, "Waxaa ku xiran qiimaha": 60},
}

TEXT_THEME_RULES = {
    "Storage & backup": [
        "storage",
        "kayd",
        "backup",
        "drive",
        "dropbox",
        "onedrive",
        "google drive",
        "server",
    ],
    "Communication & collaboration": [
        "communication",
        "isgaarsiin",
        "email",
        "meeting",
        "zoom",
        "teams",
        "wadaag",
        "chat",
        "collaboration",
    ],
    "Reporting & analytics": [
        "report",
        "reporting",
        "warbixin",
        "dashboard",
        "analysis",
        "xog ururin",
        "insight",
    ],
    "Security & privacy": [
        "security",
        "amni",
        "privacy",
        "sir",
        "hack",
        "encryption",
        "control",
        "ilaalin",
    ],
    "Training & awareness": [
        "tababar",
        "training",
        "awareness",
        "wacyi",
        "aqoon",
        "xirfad",
        "skill",
    ],
    "Cost reduction": [
        "kharash",
        "cost",
        "qiimo",
        "jaban",
        "lacag",
        "dhaqaale",
    ],
    "Infrastructure": [
        "internet",
        "koronto",
        "network",
        "wifi",
        "xawaare",
        "connection",
    ],
    "Automation & digital systems": [
        "automation",
        "system",
        "nidaam",
        "digital",
        "inventory",
        "accounting",
        "crm",
        "erp",
        "casri",
        "maamul",
    ],
    "Remote access & mobility": [
        "remote",
        "fog",
        "mobile",
        "online",
        "access",
        "meel kasta",
        "shaqo fog",
    ],
    "Policy & ecosystem support": [
        "dowlad",
        "policy",
        "taageero",
        "shirkad",
        "sharci",
        "maalgashi",
        "investment",
    ],
    "Future growth": [
        "future",
        "mustaqbal",
        "koritaan",
        "ballaar",
        "growth",
        "fursad",
        "innovation",
    ],
}

STOPWORDS = {
    "ayaa",
    "ahay",
    "ama",
    "and",
    "baa",
    "baad",
    "badan",
    "but",
    "cloud",
    "computing",
    "for",
    "in",
    "iyo",
    "inta",
    "kale",
    "ka",
    "ku",
    "la",
    "leh",
    "loo",
    "ma",
    "marka",
    "mid",
    "oo",
    "si",
    "sida",
    "ta",
    "the",
    "to",
    "u",
    "waa",
    "wax",
    "waxaa",
    "waxay",
    "waxqabad",
    "xog",
    "xogta",
}

QUESTION_GROUP_LABELS = {
    "q7": "Cloud understanding",
    "q16": "Current cloud services",
    "q28": "Desired cloud services",
    "q29": "Future view",
    "q30": "Adoption recommendations",
}


def safe_str(value):
    if value is None or pd.isna(value):
        return ""
    return str(value).strip()


def split_answer(value):
    text = safe_str(value)
    if not text:
        return []
    return [item.strip() for item in text.split(",") if item.strip()]


def round_number(value, digits=0):
    number = float(value or 0)
    return round(number, digits) if digits else int(round(number))


def percentage(part, whole):
    if not whole:
        return 0.0
    return round((part / whole) * 100, 2)


def mean_or_zero(values):
    series = pd.Series(list(values), dtype="float64")
    return float(series.mean()) if not series.empty else 0.0


def readiness_band(score):
    if score >= 70:
        return "High"
    if score >= 40:
        return "Medium"
    return "Low"


def score_status(score):
    if score >= 70:
        return "good"
    if score >= 40:
        return "warning"
    return "critical"


def gap_status(gap):
    if gap <= 20:
        return "good"
    if gap <= 40:
        return "warning"
    return "critical"


def normalize_text(value):
    text = safe_str(value).lower()
    text = re.sub(r"[^\w\s]", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def tokenize(value):
    normalized = normalize_text(value)
    return [
        token
        for token in re.findall(r"[a-zA-Z0-9]+", normalized)
        if len(token) > 2 and token not in STOPWORDS and not token.isdigit()
    ]


def frequency_for_series(series):
    counts = Counter()
    respondent_total = 0
    if series is None:
        return []

    for value in series:
        answers = list(dict.fromkeys(split_answer(value)))
        if not answers:
            continue
        respondent_total += 1
        for answer in answers:
            counts[answer] += 1

    return [
        {
            "answer": answer,
            "count": int(count),
            "percentage": percentage(count, respondent_total),
        }
        for answer, count in counts.most_common()
    ]


def all_frequency_analysis(df):
    result = {}
    for code, question in QUESTIONS.items():
        if question in df:
            result[code] = {"question": question, "answers": frequency_for_series(df[question])}
    return result


def score_answer(code, value):
    answers = split_answer(value)
    if not answers:
        return 0.0
    score_map = SCORES.get(code, {})
    return float(np.mean([score_map.get(answer, 40) for answer in answers]))


def add_factor_scores(df):
    working = df.copy()

    for code in SCORES:
        question = QUESTIONS[code]
        column = f"score_{code}"
        if question in working:
            working[column] = working[question].apply(lambda value, current_code=code: score_answer(current_code, value))
        else:
            working[column] = 0

    for factor, codes in FACTOR_QUESTIONS.items():
        score_columns = [f"score_{code}" for code in codes]
        working[factor] = working[score_columns].mean(axis=1)

    working["calculatedReadiness"] = working[FACTOR_ORDER].mean(axis=1)
    if "readinessScore" in working:
        readiness_numeric = pd.to_numeric(working["readinessScore"], errors="coerce")
        working["effectiveReadiness"] = readiness_numeric.fillna(working["calculatedReadiness"])
    else:
        working["effectiveReadiness"] = working["calculatedReadiness"]

    if "readinessBand" not in working:
        working["readinessBand"] = working["effectiveReadiness"].apply(readiness_band)
    else:
        working["readinessBand"] = working["readinessBand"].apply(lambda value: safe_str(value) or "Low")

    if "submittedAt" in working:
        submitted = pd.to_datetime(working["submittedAt"], errors="coerce", utc=True)
        working["submittedAtParsed"] = submitted.dt.tz_convert(None)
    else:
        working["submittedAtParsed"] = pd.NaT

    working["responseDate"] = working["submittedAtParsed"].dt.strftime("%Y-%m-%d").fillna("")
    return working


def readiness_stats(df):
    scores = pd.to_numeric(df.get("effectiveReadiness", 0), errors="coerce").fillna(0)
    if scores.empty:
        return {"average": 0, "median": 0, "min": 0, "max": 0}
    return {
        "average": round_number(scores.mean()),
        "median": round_number(scores.median()),
        "min": round_number(scores.min()),
        "max": round_number(scores.max()),
    }


def answer_rate(df, code, selected_answers):
    question = QUESTIONS[code]
    if question not in df:
        return 0.0
    total = 0
    matched = 0
    wanted = set(selected_answers)
    for value in df[question]:
        answers = split_answer(value)
        if not answers:
            continue
        total += 1
        if wanted.intersection(answers):
            matched += 1
    return percentage(matched, total)


def answer_mode(df, code):
    question = QUESTIONS[code]
    if question not in df:
        return {}
    answers = frequency_for_series(df[question])
    return answers[0] if answers else {}


def build_time_series(df):
    if "submittedAtParsed" not in df or df["submittedAtParsed"].dropna().empty:
        return {"dailyResponses": [], "readinessTrend": [], "awarenessTrend": []}

    now = pd.Timestamp.utcnow().tz_localize(None).normalize()
    start = now - pd.Timedelta(days=13)
    days = pd.date_range(start=start, end=now, freq="D")
    base = pd.DataFrame({"date": days})

    daily_counts = (
        df.dropna(subset=["submittedAtParsed"])
        .groupby(df["submittedAtParsed"].dt.normalize())
        .size()
        .rename("responses")
        .reset_index()
        .rename(columns={"submittedAtParsed": "date"})
    )
    readiness = (
        df.dropna(subset=["submittedAtParsed"])
        .groupby(df["submittedAtParsed"].dt.normalize())["effectiveReadiness"]
        .mean()
        .rename("readiness")
        .reset_index()
        .rename(columns={"submittedAtParsed": "date"})
    )

    aware_rows = []
    aware_question = QUESTIONS["q5"]
    if aware_question in df:
        for day, items in df.dropna(subset=["submittedAtParsed"]).groupby(df["submittedAtParsed"].dt.normalize()):
            aware_rows.append({"date": day, "awarenessRate": answer_rate(items, "q5", ["Haa"])})
    awareness = pd.DataFrame(aware_rows)

    merged = base.merge(daily_counts, how="left", on="date").merge(readiness, how="left", on="date")
    if not awareness.empty:
        merged = merged.merge(awareness, how="left", on="date")
    merged = merged.fillna(0)
    merged["label"] = merged["date"].dt.strftime("%d %b")

    return {
        "dailyResponses": [
            {"date": row["label"], "responses": int(row["responses"])}
            for _, row in merged.iterrows()
        ],
        "readinessTrend": [
            {"date": row["label"], "readiness": round_number(row["readiness"])}
            for _, row in merged.iterrows()
        ],
        "awarenessTrend": [
            {"date": row["label"], "awarenessRate": round_number(row["awarenessRate"], 2)}
            for _, row in merged.iterrows()
        ],
    }


def question_interpretation(question, answers):
    if not answers:
        return "No responses were available for this question under the selected filters."
    top = answers[0]
    second = answers[1] if len(answers) > 1 else None
    if top["percentage"] >= 70:
        return f"A clear majority selected {top['answer']} ({top['percentage']}%), showing a strong consensus."
    if second and (top["percentage"] - second["percentage"]) <= 10:
        return f"Responses are split between {top['answer']} ({top['percentage']}%) and {second['answer']} ({second['percentage']}%), so this area is mixed."
    return f"The most common answer is {top['answer']} ({top['percentage']}%), but there is still meaningful variation across respondents."


def analyze_text_question(df, code):
    question = QUESTIONS[code]
    responses = [safe_str(value) for value in df.get(question, []) if safe_str(value)]
    if not responses:
        return {
            "question": question,
            "totalResponses": 0,
            "themes": [],
            "keywords": [],
            "groupedTopics": [],
            "summary": "No open-ended responses were available for this question.",
            "sampleResponses": [],
        }

    token_counts = Counter()
    theme_matches = {}
    for response in responses:
        normalized = normalize_text(response)
        for token in tokenize(response):
            token_counts[token] += 1
        for theme, keywords in TEXT_THEME_RULES.items():
            matched_keywords = [keyword for keyword in keywords if keyword in normalized]
            if matched_keywords:
                bucket = theme_matches.setdefault(theme, {"count": 0, "keywords": Counter(), "examples": []})
                bucket["count"] += 1
                bucket["keywords"].update(matched_keywords)
                if len(bucket["examples"]) < 3:
                    bucket["examples"].append(response)

    if not theme_matches:
        fallback_topics = token_counts.most_common(5)
        for keyword, count in fallback_topics:
            theme_matches[keyword.title()] = {
                "count": count,
                "keywords": Counter({keyword: count}),
                "examples": responses[:3],
            }

    total = len(responses)
    themes = [
        {
            "theme": theme,
            "count": int(data["count"]),
            "percentage": percentage(data["count"], total),
            "keywords": [keyword for keyword, _ in data["keywords"].most_common(4)],
            "examples": data["examples"],
        }
        for theme, data in sorted(theme_matches.items(), key=lambda item: item[1]["count"], reverse=True)
    ]
    keywords = [{"keyword": keyword, "count": int(count)} for keyword, count in token_counts.most_common(12)]
    grouped_topics = [
        {
            "topic": item["theme"],
            "count": item["count"],
            "percentage": item["percentage"],
            "examples": item["examples"],
        }
        for item in themes[:6]
    ]
    top_themes = ", ".join(item["theme"] for item in themes[:3])
    summary = (
        f"{QUESTION_GROUP_LABELS.get(code, 'This question')} mainly clusters around {top_themes}."
        if top_themes
        else "Open-ended responses were too varied to produce a dominant theme."
    )

    return {
        "question": question,
        "totalResponses": total,
        "themes": themes,
        "keywords": keywords,
        "groupedTopics": grouped_topics,
        "summary": summary,
        "sampleResponses": responses[:5],
    }


def build_question_analysis(df, frequencies, text_analysis):
    analysis = []
    for code, question in QUESTIONS.items():
        if code in TEXT_QUESTIONS:
            text_item = text_analysis.get(code, {})
            analysis.append(
                {
                    "code": code,
                    "question": question,
                    "type": "text",
                    "totalResponses": int(text_item.get("totalResponses", 0)),
                    "answers": [],
                    "labels": [],
                    "interpretation": text_item.get("summary", ""),
                    "textAnalysis": text_item,
                }
            )
            continue

        answers = frequencies.get(code, {}).get("answers", [])
        total_responses = sum(item["count"] for item in answers[:1]) if len(answers) == 1 else sum(
            1 for value in df.get(question, []) if split_answer(value)
        )
        analysis.append(
            {
                "code": code,
                "question": question,
                "type": "closed",
                "totalResponses": int(total_responses),
                "answers": answers,
                "labels": [item["answer"] for item in answers],
                "interpretation": question_interpretation(question, answers),
                "textAnalysis": None,
            }
        )
    return analysis


def group_metrics(items, label, label_key):
    factor_scores = {factor: mean_or_zero(items[factor]) for factor in FACTOR_ORDER}
    factor_entries = [
        {"factor": factor, "label": FACTOR_LABELS[factor], "score": round_number(score)}
        for factor, score in factor_scores.items()
    ]
    strongest = max(factor_entries, key=lambda item: item["score"])
    weakest = min(factor_entries, key=lambda item: item["score"])

    low_count = int((items["readinessBand"] == "Low").sum())
    medium_count = int((items["readinessBand"] == "Medium").sum())
    high_count = int((items["readinessBand"] == "High").sum())
    barrier_mode = answer_mode(items, "q21")
    concern_mode = answer_mode(items, "q25")

    return {
        label_key: label,
        "responses": int(len(items.index)),
        "averageReadiness": round_number(items["effectiveReadiness"].mean()),
        "cloudAwareness": round_number(factor_scores["cloudAwareness"]),
        "technologyUse": round_number(factor_scores["technologyUse"]),
        "infrastructureReadiness": round_number(factor_scores["infrastructureReadiness"]),
        "backupPractices": round_number(factor_scores["backupPractices"]),
        "cloudToolsUse": round_number(factor_scores["cloudToolsUse"]),
        "securityTrust": round_number(factor_scores["securityTrust"]),
        "willingnessToAdopt": round_number(factor_scores["willingnessToAdopt"]),
        "internetAvailabilityRate": round_number(answer_rate(items, "q10", ["Haa"])),
        "internetQuality": round_number(items["score_q11"].mean()),
        "electricityAvailabilityRate": round_number(answer_rate(items, "q18", ["Haa"])),
        "powerStability": round_number(items[["score_q18", "score_q19"]].mean(axis=1).mean()),
        "interruptionRisk": round_number(100 - items["score_q19"].mean()),
        "internetProblemImpact": round_number(100 - items["score_q20"].mean()),
        "backupRate": round_number(answer_rate(items, "q13", ["Haa maalin kasta", "Toddobaadle", "Mararka qaar"])),
        "cloudToolUsageRate": round_number(answer_rate(items, "q15", ["Haa"])),
        "softwareUsageRate": round_number(answer_rate(items, "q9", ["Haa"])),
        "trainingNeedRate": round_number(answer_rate(items, "q23", ["Haa"])),
        "skillsGapRate": round_number(100 - answer_rate(items, "q22", ["Haa"])),
        "digitalNeedRate": round_number(answer_rate(items, "q26", ["Haa"])),
        "trustPositiveRate": round_number(answer_rate(items, "q24", ["Aad baan ugu kalsoonahay", "Waan ku kalsoonahay"])),
        "topBarrier": barrier_mode.get("answer", "No dominant barrier"),
        "topBarrierShare": barrier_mode.get("percentage", 0),
        "topSecurityConcern": concern_mode.get("answer", "No dominant concern"),
        "lowCount": low_count,
        "mediumCount": medium_count,
        "highCount": high_count,
        "lowShare": percentage(low_count, len(items.index)),
        "mediumShare": percentage(medium_count, len(items.index)),
        "highShare": percentage(high_count, len(items.index)),
        "strongestFactor": strongest["label"],
        "weakestFactor": weakest["label"],
        "factorBreakdown": factor_entries,
    }


def build_group_comparison(df, column, label_key):
    if column not in df:
        return []

    rows = []
    prepared = df.copy()
    prepared[column] = prepared[column].fillna("").apply(lambda value: safe_str(value) or "Unknown")
    for label, items in prepared.groupby(column):
        rows.append(group_metrics(items, label, label_key))

    return sorted(rows, key=lambda item: item["averageReadiness"], reverse=True)


def build_heatmap(rows, label_key, columns):
    return {
        "columns": [{"key": key, "label": label} for key, label in columns],
        "rows": [
            {
                "name": row[label_key],
                "values": [
                    {
                        "key": key,
                        "label": label,
                        "value": row.get(key, 0),
                        "status": score_status(row.get(key, 0)),
                    }
                    for key, label in columns
                ],
            }
            for row in rows
        ],
    }


def build_gap_analysis(df, sector_rows, district_rows):
    overall = []
    for factor in FACTOR_ORDER:
        current = mean_or_zero(df[factor]) if factor in df else 0
        gap = 100 - current
        overall.append(
            {
                "factor": factor,
                "label": FACTOR_LABELS[factor],
                "current": round_number(current),
                "ideal": 100,
                "gap": round_number(gap),
                "status": gap_status(gap),
                "whereAreWeNow": round_number(current),
                "whereShouldWeBe": 100,
                "gapSize": round_number(gap),
            }
        )

    overall = sorted(overall, key=lambda item: item["gap"], reverse=True)

    def group_gap_rows(rows, label_key):
        result = []
        for row in rows:
            factor_gaps = [
                {
                    "factor": factor,
                    "label": FACTOR_LABELS[factor],
                    "current": row.get(factor, 0),
                    "ideal": 100,
                    "gap": round_number(100 - row.get(factor, 0)),
                }
                for factor in FACTOR_ORDER
            ]
            factor_gaps.sort(key=lambda item: item["gap"], reverse=True)
            result.append(
                {
                    label_key: row[label_key],
                    "responses": row["responses"],
                    "averageReadiness": row["averageReadiness"],
                    "largestGapFactor": factor_gaps[0]["label"] if factor_gaps else "No factor",
                    "largestGap": factor_gaps[0]["gap"] if factor_gaps else 0,
                    "factorGaps": factor_gaps,
                }
            )
        return sorted(result, key=lambda item: item["largestGap"], reverse=True)

    sector_gap_rows = group_gap_rows(sector_rows, "sector")
    district_gap_rows = group_gap_rows(district_rows, "district")

    return {
        "overall": overall,
        "progressToIdeal": overall,
        "sectorGaps": sector_gap_rows,
        "districtGaps": district_gap_rows,
        "largestGapFactor": overall[0]["label"] if overall else "No factor",
        "largestGapSector": sector_gap_rows[0]["sector"] if sector_gap_rows else "No sector",
        "largestGapDistrict": district_gap_rows[0]["district"] if district_gap_rows else "No district",
        "narrative": [
            f"The widest overall gap is {overall[0]['label']} at {overall[0]['gap']}%." if overall else "",
            f"The sector with the biggest combined gap is {sector_gap_rows[0]['sector']}." if sector_gap_rows else "",
            f"The district with the biggest combined gap is {district_gap_rows[0]['district']}." if district_gap_rows else "",
        ],
    }


def build_sector_analysis(sector_rows):
    columns = [
        ("cloudAwareness", "Awareness"),
        ("technologyUse", "Technology"),
        ("backupPractices", "Backup"),
        ("cloudToolsUse", "Cloud tools"),
        ("infrastructureReadiness", "Infrastructure"),
        ("securityTrust", "Security trust"),
        ("willingnessToAdopt", "Willingness"),
    ]
    heatmap = build_heatmap(sector_rows, "sector", columns)

    return {
        "rows": sector_rows,
        "readinessLeaderboard": [{"sector": row["sector"], "averageReadiness": row["averageReadiness"]} for row in sector_rows],
        "stackedReadiness": [
            {
                "sector": row["sector"],
                "Low": row["lowShare"],
                "Medium": row["mediumShare"],
                "High": row["highShare"],
            }
            for row in sector_rows
        ],
        "heatmap": heatmap,
        "highlights": {
            "bestPerformingSector": sector_rows[0]["sector"] if sector_rows else "No sector",
            "weakestSector": sector_rows[-1]["sector"] if sector_rows else "No sector",
            "highestWillingnessSector": max(sector_rows, key=lambda item: item["willingnessToAdopt"])["sector"] if sector_rows else "No sector",
            "weakestInfrastructureSector": min(sector_rows, key=lambda item: item["infrastructureReadiness"])["sector"] if sector_rows else "No sector",
            "biggestSecurityConcernSector": min(sector_rows, key=lambda item: item["securityTrust"])["sector"] if sector_rows else "No sector",
            "lowestBackupReadinessSector": min(sector_rows, key=lambda item: item["backupPractices"])["sector"] if sector_rows else "No sector",
        },
    }


def build_district_analysis(district_rows):
    columns = [
        ("averageReadiness", "Readiness"),
        ("cloudAwareness", "Awareness"),
        ("technologyUse", "Technology"),
        ("infrastructureReadiness", "Infrastructure"),
        ("willingnessToAdopt", "Willingness"),
    ]
    heatmap = build_heatmap(district_rows, "district", columns)

    return {
        "rows": district_rows,
        "ranking": [{"district": row["district"], "averageReadiness": row["averageReadiness"]} for row in district_rows],
        "heatmap": heatmap,
        "highlights": {
            "bestDistrict": district_rows[0]["district"] if district_rows else "No district",
            "weakestDistrict": district_rows[-1]["district"] if district_rows else "No district",
            "highestWillingnessDistrict": max(district_rows, key=lambda item: item["willingnessToAdopt"])["district"] if district_rows else "No district",
        },
    }


def build_readiness_analysis(df, sector_rows, district_rows, factor_summary):
    distribution_counts = Counter(df["readinessBand"])
    total = len(df.index)
    distribution = [
        {
            "band": band,
            "count": int(distribution_counts.get(band, 0)),
            "percentage": percentage(distribution_counts.get(band, 0), total),
        }
        for band in ["Low", "Medium", "High"]
    ]

    response_rows = (
        df.sort_values("effectiveReadiness", ascending=False)
        .loc[:, ["organizationName", "sector", "district", "effectiveReadiness", "readinessBand"] + FACTOR_ORDER]
        .rename(columns={"effectiveReadiness": "readinessScore"})
    )
    response_ranking = [
        {
            "organizationName": safe_str(row["organizationName"]) or "Unnamed organization",
            "sector": safe_str(row["sector"]) or "Unknown",
            "district": safe_str(row["district"]) or "Unknown",
            "readinessScore": round_number(row["readinessScore"]),
            "readinessBand": safe_str(row["readinessBand"]) or readiness_band(row["readinessScore"]),
            "cloudAwareness": round_number(row["cloudAwareness"]),
            "technologyUse": round_number(row["technologyUse"]),
            "infrastructureReadiness": round_number(row["infrastructureReadiness"]),
            "backupPractices": round_number(row["backupPractices"]),
            "cloudToolsUse": round_number(row["cloudToolsUse"]),
            "securityTrust": round_number(row["securityTrust"]),
            "willingnessToAdopt": round_number(row["willingnessToAdopt"]),
        }
        for _, row in response_rows.head(25).iterrows()
    ]

    alert_rows = sorted(sector_rows, key=lambda item: item["averageReadiness"])[:5]
    opportunity_rows = sorted(sector_rows, key=lambda item: item["averageReadiness"], reverse=True)[:5]
    strongest = factor_summary[0]["label"] if factor_summary else "No factor"
    weakest = factor_summary[-1]["label"] if factor_summary else "No factor"
    overall_average = round_number(df["effectiveReadiness"].mean())

    return {
        "overallAverage": overall_average,
        "distribution": distribution,
        "sectorLeaderboard": [{"sector": row["sector"], "averageReadiness": row["averageReadiness"]} for row in sector_rows],
        "districtLeaderboard": [{"district": row["district"], "averageReadiness": row["averageReadiness"]} for row in district_rows],
        "responseRanking": response_ranking,
        "radar": [{"factor": item["label"], "score": item["score"]} for item in factor_summary],
        "factorBreakdown": factor_summary,
        "lowReadinessAlerts": [
            {
                "sector": row["sector"],
                "averageReadiness": row["averageReadiness"],
                "reason": f"{row['weakestFactor']} is the weakest driver in this sector.",
            }
            for row in alert_rows
        ],
        "highReadinessOpportunities": [
            {
                "sector": row["sector"],
                "averageReadiness": row["averageReadiness"],
                "opportunity": f"{row['sector']} combines readiness with {row['willingnessToAdopt']}% willingness.",
            }
            for row in opportunity_rows
        ],
        "interpretation": f"Overall readiness is {overall_average}/100. {strongest} leads the scorecard while {weakest} is holding performance back.",
        "explanation": f"High scores reflect stronger awareness, tooling, and trust. Lower scores mainly come from infrastructure, backup, or security gaps depending on the filtered data.",
    }


def build_infrastructure_analysis(df, sector_rows):
    columns = [
        ("internetAvailabilityRate", "Internet availability"),
        ("internetQuality", "Internet quality"),
        ("electricityAvailabilityRate", "Electricity availability"),
        ("powerStability", "Power stability"),
        ("infrastructureReadiness", "Infrastructure readiness"),
    ]
    heatmap = build_heatmap(sector_rows, "sector", columns)
    affected_internet = sorted(sector_rows, key=lambda item: item["internetQuality"])[:5]
    affected_power = sorted(sector_rows, key=lambda item: item["powerStability"])[:5]

    q11_mode = answer_mode(df, "q11").get("answer", "No dominant level")
    q19_mode = answer_mode(df, "q19").get("answer", "No dominant level")

    return {
        "internetAvailability": frequency_for_series(df.get(QUESTIONS["q10"])),
        "internetQuality": frequency_for_series(df.get(QUESTIONS["q11"])),
        "electricityAvailability": frequency_for_series(df.get(QUESTIONS["q18"])),
        "interruptionFrequency": frequency_for_series(df.get(QUESTIONS["q19"])),
        "internetImpact": frequency_for_series(df.get(QUESTIONS["q20"])),
        "sectorComparison": [
            {
                "sector": row["sector"],
                "internetAvailabilityRate": row["internetAvailabilityRate"],
                "internetQuality": row["internetQuality"],
                "electricityAvailabilityRate": row["electricityAvailabilityRate"],
                "powerStability": row["powerStability"],
                "infrastructureReadiness": row["infrastructureReadiness"],
            }
            for row in sector_rows
        ],
        "heatmap": heatmap,
        "riskSummary": [
            f"The most common internet quality rating is {q11_mode}.",
            f"The most common power interruption pattern is {q19_mode}.",
            "Infrastructure risk is highest where internet quality and electricity continuity both lag readiness targets.",
        ],
        "mostAffectedInternet": [{"sector": row["sector"], "internetQuality": row["internetQuality"]} for row in affected_internet],
        "mostAffectedPower": [{"sector": row["sector"], "powerStability": row["powerStability"]} for row in affected_power],
    }


def build_security_analysis(df, sector_rows):
    trust_levels = frequency_for_series(df.get(QUESTIONS["q24"]))
    concerns = frequency_for_series(df.get(QUESTIONS["q25"]))
    trust_rows = [
        {
            "sector": row["sector"],
            "securityTrust": row["securityTrust"],
            "trustPositiveRate": row["trustPositiveRate"],
            "topSecurityConcern": row["topSecurityConcern"],
        }
        for row in sorted(sector_rows, key=lambda item: item["securityTrust"], reverse=True)
    ]

    top_concerns = ", ".join(item["answer"] for item in concerns[:3]) if concerns else "No recurring concern"

    return {
        "trustLevels": trust_levels,
        "securityConcerns": concerns,
        "sectorTrustComparison": trust_rows,
        "topConcernLeaderboard": concerns[:10],
        "fearSummary": [
            f"The main security worries are {top_concerns}.",
            "Trust scores rise where respondents already use cloud tools and regular backup practices.",
        ],
        "trustBuildingRecommendations": [
            "Show clear policies for access control, encryption, and backup recovery.",
            "Use sector-specific demonstrations to explain how cloud security works in practice.",
            "Pair awareness campaigns with simple trust-building case studies from local organizations.",
        ],
    }


def build_barrier_analysis(df, sector_rows, district_rows):
    overall_ranking = frequency_for_series(df.get(QUESTIONS["q21"]))

    sector_barriers = []
    for row in sector_rows:
        items = df[df["sector"].fillna("").apply(lambda value: safe_str(value) or "Unknown") == row["sector"]]
        barriers = frequency_for_series(items.get(QUESTIONS["q21"]))
        sector_barriers.append(
            {
                "sector": row["sector"],
                "topBarrier": barriers[0]["answer"] if barriers else "No dominant barrier",
                "barriers": barriers,
                "trainingNeedRate": row["trainingNeedRate"],
                "skillsGapRate": row["skillsGapRate"],
                "averageReadiness": row["averageReadiness"],
            }
        )

    district_barriers = []
    for row in district_rows:
        items = df[df["district"].fillna("").apply(lambda value: safe_str(value) or "Unknown") == row["district"]]
        barriers = frequency_for_series(items.get(QUESTIONS["q21"]))
        district_barriers.append(
            {
                "district": row["district"],
                "topBarrier": barriers[0]["answer"] if barriers else "No dominant barrier",
                "barriers": barriers,
            }
        )

    return {
        "overallRanking": overall_ranking,
        "challengeFrequency": overall_ranking,
        "topFiveChallenges": overall_ranking[:5],
        "bySector": sector_barriers,
        "byDistrict": district_barriers,
        "mostCommonBarrier": overall_ranking[0]["answer"] if overall_ranking else "No dominant barrier",
    }


def build_business_needs_analysis(frequencies, text_analysis):
    combined_theme_counts = Counter()
    combined_keyword_counts = Counter()
    grouped_topics = []

    for code in TEXT_QUESTIONS:
        entry = text_analysis.get(code, {})
        for item in entry.get("themes", []):
            combined_theme_counts[item["theme"]] += item["count"]
        for item in entry.get("keywords", []):
            combined_keyword_counts[item["keyword"]] += item["count"]
        for topic in entry.get("groupedTopics", [])[:2]:
            grouped_topics.append(
                {
                    "question": QUESTION_GROUP_LABELS.get(code, code),
                    "topic": topic["topic"],
                    "count": topic["count"],
                    "examples": topic["examples"],
                }
            )

    theme_cards = [
        {"theme": theme, "count": int(count)}
        for theme, count in combined_theme_counts.most_common(8)
    ]
    keyword_chart = [
        {"keyword": keyword, "count": int(count)}
        for keyword, count in combined_keyword_counts.most_common(12)
    ]

    top_theme = theme_cards[0]["theme"] if theme_cards else "No dominant theme"

    return {
        "digitalNeeds": frequencies.get("q26", {}).get("answers", []),
        "willingness": frequencies.get("q27", {}).get("answers", []),
        "openEndedQuestions": {code: text_analysis.get(code, {}) for code in TEXT_QUESTIONS},
        "themeCards": theme_cards,
        "groupedTopicBlocks": grouped_topics[:10],
        "keywordChart": keyword_chart,
        "insightSummaries": [
            f"The strongest open-ended theme is {top_theme}.",
            "Open-ended answers consistently ask for practical systems, training support, and safer data handling.",
        ],
        "mostCommonRecommendationTheme": text_analysis.get("q30", {}).get("themes", [{}])[0].get("theme", "No dominant theme"),
    }


def build_factor_summary(df):
    summary = [
        {
            "factor": factor,
            "label": FACTOR_LABELS[factor],
            "score": round_number(df[factor].mean()) if factor in df else 0,
        }
        for factor in FACTOR_ORDER
    ]
    return sorted(summary, key=lambda item: item["score"], reverse=True)


def build_correlations(df):
    columns = FACTOR_ORDER + ["effectiveReadiness"]
    matrix = df[columns].corr().fillna(0)
    rows = []
    for factor in FACTOR_ORDER:
        rows.append(
            {
                "factor": FACTOR_LABELS[factor],
                "correlationWithReadiness": round_number(matrix.loc[factor, "effectiveReadiness"], 2),
            }
        )
    rows.sort(key=lambda item: abs(item["correlationWithReadiness"]), reverse=True)
    return rows


def build_summary_findings(totals, stats, frequencies, sector_rows, gap_analysis, correlations, business_needs):
    device = frequencies.get("q8", {}).get("answers", [{}])[0].get("answer", "No dominant device")
    barrier = frequencies.get("q21", {}).get("answers", [{}])[0].get("answer", "No dominant barrier")
    top_sector = sector_rows[0]["sector"] if sector_rows else "No sector"
    top_gap = gap_analysis["overall"][0]["label"] if gap_analysis["overall"] else "No factor"
    correlation_label = correlations[0]["factor"] if correlations else "No factor"

    return [
        f"{totals['totalResponses']} responses were analyzed across {totals['totalSectorsCovered']} sectors and {totals['totalDistrictsCovered']} districts.",
        f"The average cloud readiness score is {stats['average']}/100, with {totals['adoptionWillingnessRate']}% showing willingness to adopt cloud solutions.",
        f"{device} is the most common device in use, while {barrier} is the most common adoption barrier.",
        f"{top_sector} is currently the highest-readiness sector in the filtered dataset.",
        f"The largest readiness gap is {top_gap}.",
        f"{correlation_label} has the strongest relationship with readiness in the current responses.",
        f"The most common recommendation theme in open-ended responses is {business_needs['mostCommonRecommendationTheme']}.",
    ]


def build_recommendations(totals, factor_summary, barrier_analysis, sector_rows, district_rows, business_needs):
    recommendations = []
    factor_lookup = {item["factor"]: item["score"] for item in factor_summary}
    top_barrier = barrier_analysis["mostCommonBarrier"]

    def push(title, detail, priority, focus_area):
        recommendations.append(
            {
                "title": title,
                "detail": detail,
                "priority": priority,
                "focusArea": focus_area,
            }
        )

    if totals["awarenessRate"] < 70:
        push(
            "Expand cloud awareness and practical orientation",
            "Awareness is still uneven, so short Somali-language workshops and demos should explain real business use cases instead of abstract concepts.",
            "High",
            "Awareness",
        )

    if factor_lookup.get("infrastructureReadiness", 0) < 65:
        push(
            "Prioritize internet and power reliability",
            "Infrastructure stability is below target, so connectivity and electricity continuity should be addressed before large cloud rollouts.",
            "High",
            "Infrastructure",
        )

    if factor_lookup.get("backupPractices", 0) < 65:
        push(
            "Standardize backup routines",
            "Organizations still need stronger backup discipline. Promote daily or weekly backup policies tied to easy recovery procedures.",
            "High",
            "Backup",
        )

    if factor_lookup.get("securityTrust", 0) < 70:
        push(
            "Build trust with visible security controls",
            "Security trust is limiting adoption. Communicate access control, encryption, and incident-response practices in plain language.",
            "High",
            "Security & Trust",
        )

    if top_barrier and top_barrier != "No dominant barrier":
        push(
            "Address the main adoption blocker directly",
            f"The most common barrier is {top_barrier}, so the rollout plan should include a visible response to that issue.",
            "Medium",
            "Barriers",
        )

    top_theme = business_needs["mostCommonRecommendationTheme"]
    if top_theme and top_theme != "No dominant theme":
        push(
            "Translate respondent advice into the adoption roadmap",
            f"Open-ended recommendations cluster around {top_theme}; that theme should be reflected in the next implementation phase.",
            "Medium",
            "Policy & Enablement",
        )

    sector_specific = []
    for row in sorted(sector_rows, key=lambda item: item["averageReadiness"])[:6]:
        sector_specific.append(
            {
                "sector": row["sector"],
                "priority": "High" if row["averageReadiness"] < 40 else "Medium",
                "recommendation": f"Focus on {row['weakestFactor']} in {row['sector']} and remove the barrier '{row['topBarrier']}'.",
            }
        )

    district_specific = []
    for row in sorted(district_rows, key=lambda item: item["averageReadiness"])[:6]:
        district_specific.append(
            {
                "district": row["district"],
                "priority": "High" if row["averageReadiness"] < 40 else "Medium",
                "recommendation": f"Strengthen {row['weakestFactor']} in {row['district']} and support local training where readiness is still low.",
            }
        )

    return {
        "overall": recommendations,
        "sectorSpecific": sector_specific,
        "districtSpecific": district_specific,
        "summary": [f"{item['title']}: {item['detail']}" for item in recommendations],
    }


def build_overview(totals, stats, time_series, factor_summary, sector_rows, frequencies, business_needs):
    insight_cards = [
        {"label": "Most common sector", "value": sector_rows[0]["sector"] if sector_rows else "No sector", "helper": "Highest response volume appears first in the ranking table."},
        {"label": "Most common device used", "value": frequencies.get("q8", {}).get("answers", [{}])[0].get("answer", "No dominant device"), "helper": "From device usage responses."},
        {"label": "Most common cloud barrier", "value": frequencies.get("q21", {}).get("answers", [{}])[0].get("answer", "No dominant barrier"), "helper": "From barrier selections."},
        {"label": "Most trusted response level", "value": frequencies.get("q24", {}).get("answers", [{}])[0].get("answer", "No dominant trust level"), "helper": "From security trust responses."},
        {"label": "Most common internet quality level", "value": frequencies.get("q11", {}).get("answers", [{}])[0].get("answer", "No dominant level"), "helper": "From internet quality responses."},
        {"label": "Most common storage method", "value": frequencies.get("q12", {}).get("answers", [{}])[0].get("answer", "No dominant method"), "helper": "From data storage responses."},
        {"label": "Most common recommendation theme", "value": business_needs["mostCommonRecommendationTheme"], "helper": "From open-ended recommendations."},
    ]

    strong = factor_summary[0]["label"] if factor_summary else "No factor"
    weak = factor_summary[-1]["label"] if factor_summary else "No factor"
    executive_summary = (
        f"The current dataset shows {stats['average']}/100 average readiness across {totals['totalResponses']} responses."
        f" {strong} is performing best, while {weak} needs the most attention."
    )

    return {
        "totals": totals,
        "insightCards": insight_cards,
        "executiveSummary": executive_summary,
        "timeSeries": time_series,
        "readinessBands": [
            {"name": "Low", "value": totals["lowReadinessCount"]},
            {"name": "Medium", "value": totals["mediumReadinessCount"]},
            {"name": "High", "value": totals["highReadinessCount"]},
        ],
    }


def build_report_view(totals, summary_findings, sector_rows, barrier_analysis, readiness_analysis, recommendations):
    opportunities = readiness_analysis["highReadinessOpportunities"][:5]
    return {
        "title": "Somalia Cloud Computing Survey Analytics Report",
        "subtitle": f"{totals['totalResponses']} filtered responses",
        "executiveSummary": f"{totals['totalResponses']} responses across {totals['totalSectorsCovered']} sectors show an average readiness of {totals['averageCloudReadinessScore']}/100.",
        "keyFindings": summary_findings[:6],
        "readinessRanking": [{"sector": row["sector"], "averageReadiness": row["averageReadiness"]} for row in sector_rows[:8]],
        "topBarriers": barrier_analysis["overallRanking"][:5],
        "topOpportunities": opportunities,
        "recommendations": recommendations["summary"][:6],
        "conclusion": "The strongest adoption gains will come from pairing better awareness and training with practical improvements in infrastructure, backup, and security confidence.",
    }


def chart_path(name):
    output_dir = Path(__file__).resolve().parent / "generated"
    output_dir.mkdir(exist_ok=True)
    return output_dir / f"{name}-{uuid4().hex[:8]}.png"


def save_bar_chart(items, label_key, value_key, title, name, horizontal=False, color="#0f7c90"):
    path = chart_path(name)
    labels = [item[label_key] for item in items[:10]]
    values = [item[value_key] for item in items[:10]]
    plt.figure(figsize=(10, 5))
    if horizontal:
        plt.barh(labels, values, color=color)
    else:
        plt.bar(labels, values, color=color)
        plt.xticks(rotation=35, ha="right")
    plt.title(title)
    plt.tight_layout()
    plt.savefig(path)
    plt.close()
    return str(path)


def save_pie_chart(items, label_key, value_key, title, name):
    path = chart_path(name)
    labels = [item[label_key] for item in items if item[value_key] > 0]
    values = [item[value_key] for item in items if item[value_key] > 0]
    plt.figure(figsize=(7, 7))
    if values:
        wedges, _ = plt.pie(values, labels=labels, startangle=90)
        centre_circle = plt.Circle((0, 0), 0.62, fc="white")
        plt.gca().add_artist(centre_circle)
        plt.legend(wedges, labels, loc="center left", bbox_to_anchor=(1, 0.5))
    plt.title(title)
    plt.tight_layout()
    plt.savefig(path)
    plt.close()
    return str(path)


def chart_files(sector_rows, readiness_analysis, barrier_analysis, security_analysis, frequencies):
    files = {}
    if sector_rows:
        files["sectorRanking"] = save_bar_chart(
            [{"label": item["sector"], "value": item["averageReadiness"]} for item in sector_rows],
            "label",
            "value",
            "Readiness ranking by sector",
            "sector-ranking",
            horizontal=True,
        )
    if readiness_analysis["distribution"]:
        files["readinessDistribution"] = save_pie_chart(
            [{"label": item["band"], "value": item["count"]} for item in readiness_analysis["distribution"]],
            "label",
            "value",
            "Readiness distribution",
            "readiness-distribution",
        )
    if barrier_analysis["overallRanking"]:
        files["barriers"] = save_bar_chart(
            [{"label": item["answer"], "value": item["count"]} for item in barrier_analysis["overallRanking"]],
            "label",
            "value",
            "Barrier ranking",
            "barriers",
            horizontal=True,
            color="#b54745",
        )
    if security_analysis["trustLevels"]:
        files["trustLevels"] = save_pie_chart(
            [{"label": item["answer"], "value": item["count"]} for item in security_analysis["trustLevels"]],
            "label",
            "value",
            "Security trust levels",
            "trust-levels",
        )
    willingness = frequencies.get("q27", {}).get("answers", [])
    if willingness:
        files["adoptionWillingness"] = save_pie_chart(
            [{"label": item["answer"], "value": item["count"]} for item in willingness],
            "label",
            "value",
            "Adoption willingness",
            "adoption-willingness",
        )
    return files


def empty_payload():
    return {
        "generatedAt": pd.Timestamp.utcnow().isoformat(),
        "filters": {},
        "filterOptions": {
            "districts": [],
            "awarenessLevels": ["Haa", "Maya"],
            "willingnessLevels": ["Haa", "Maya", "Waxaa ku xiran qiimaha"],
            "readinessLevels": ["Low", "Medium", "High"],
        },
        "totals": {
            "totalResponses": 0,
            "totalSectorsCovered": 0,
            "totalDistrictsCovered": 0,
            "responsesToday": 0,
            "responsesThisWeek": 0,
            "averageCloudReadinessScore": 0,
            "awarenessRate": 0,
            "adoptionWillingnessRate": 0,
            "cloudToolsUsageRate": 0,
            "backupPracticeRate": 0,
            "infrastructureStabilityRate": 0,
            "securityTrustRate": 0,
            "lowReadinessCount": 0,
            "mediumReadinessCount": 0,
            "highReadinessCount": 0,
        },
        "overview": {"totals": {}, "insightCards": [], "executiveSummary": "No data available.", "timeSeries": {"dailyResponses": [], "readinessTrend": [], "awarenessTrend": []}, "readinessBands": []},
        "questionAnalysis": [],
        "sectorComparison": {"rows": [], "readinessLeaderboard": [], "stackedReadiness": [], "heatmap": {"columns": [], "rows": []}, "highlights": {}},
        "districtComparison": {"rows": [], "ranking": [], "heatmap": {"columns": [], "rows": []}, "highlights": {}},
        "readiness": {"overallAverage": 0, "distribution": [], "sectorLeaderboard": [], "districtLeaderboard": [], "responseRanking": [], "radar": [], "factorBreakdown": [], "lowReadinessAlerts": [], "highReadinessOpportunities": [], "interpretation": "No readiness data.", "explanation": "No readiness data."},
        "gapAnalysis": {"overall": [], "progressToIdeal": [], "sectorGaps": [], "districtGaps": [], "largestGapFactor": "No factor", "largestGapSector": "No sector", "largestGapDistrict": "No district", "narrative": []},
        "infrastructure": {"internetAvailability": [], "internetQuality": [], "electricityAvailability": [], "interruptionFrequency": [], "internetImpact": [], "sectorComparison": [], "heatmap": {"columns": [], "rows": []}, "riskSummary": [], "mostAffectedInternet": [], "mostAffectedPower": []},
        "security": {"trustLevels": [], "securityConcerns": [], "sectorTrustComparison": [], "topConcernLeaderboard": [], "fearSummary": [], "trustBuildingRecommendations": []},
        "barriers": {"overallRanking": [], "challengeFrequency": [], "topFiveChallenges": [], "bySector": [], "byDistrict": [], "mostCommonBarrier": "No dominant barrier"},
        "businessNeeds": {"digitalNeeds": [], "willingness": [], "openEndedQuestions": {}, "themeCards": [], "groupedTopicBlocks": [], "keywordChart": [], "insightSummaries": [], "mostCommonRecommendationTheme": "No dominant theme"},
        "recommendationBlocks": {"overall": [], "sectorSpecific": [], "districtSpecific": [], "summary": []},
        "reportView": {"title": "Somalia Cloud Computing Survey Analytics Report", "subtitle": "0 filtered responses", "executiveSummary": "No data available.", "keyFindings": ["No survey responses match the selected filters yet."], "readinessRanking": [], "topBarriers": [], "topOpportunities": [], "recommendations": ["Collect more responses before drawing operational conclusions."], "conclusion": "No conclusion yet."},
        "chartFiles": {},
        "summaryFindings": ["No survey responses match the selected filters yet."],
        "recommendations": ["Collect more responses before drawing operational conclusions."],
        "frequencyAnalysis": {},
        "percentageAnalysis": {},
        "readinessStats": {"average": 0, "median": 0, "min": 0, "max": 0},
        "factorSummary": [],
        "readinessRanking": [],
        "importantQuestionAnalysis": [],
        "commonBarriers": [],
        "securityConcerns": [],
        "districtDistribution": [],
        "awarenessDistribution": [],
        "willingnessDistribution": [],
        "descriptiveStatistics": {"responsesBySector": 0, "responsesByDistrict": 0, "stdDeviationReadiness": 0},
    }


def analyze(path):
    raw = json.loads(Path(path).read_text(encoding="utf-8"))
    df = pd.DataFrame(raw)
    if df.empty:
        return empty_payload()

    working = add_factor_scores(df)
    frequencies = all_frequency_analysis(working)
    text_analysis = {code: analyze_text_question(working, code) for code in TEXT_QUESTIONS}
    question_analysis = build_question_analysis(working, frequencies, text_analysis)
    stats = readiness_stats(working)
    factor_summary = build_factor_summary(working)
    sector_rows = build_group_comparison(working, "sector", "sector")
    district_rows = build_group_comparison(working, "district", "district")
    sector_analysis = build_sector_analysis(sector_rows)
    district_analysis = build_district_analysis(district_rows)
    readiness_analysis = build_readiness_analysis(working, sector_rows, district_rows, factor_summary)
    gaps = build_gap_analysis(working, sector_rows, district_rows)
    infrastructure = build_infrastructure_analysis(working, sector_rows)
    security = build_security_analysis(working, sector_rows)
    barriers = build_barrier_analysis(working, sector_rows, district_rows)
    business_needs = build_business_needs_analysis(frequencies, text_analysis)
    correlations = build_correlations(working)

    today = pd.Timestamp.utcnow().tz_localize(None).normalize()
    week_start = today - pd.Timedelta(days=6)
    responses_today = int((working["submittedAtParsed"].dt.normalize() == today).sum()) if "submittedAtParsed" in working else 0
    responses_week = int(((working["submittedAtParsed"].dt.normalize() >= week_start) & (working["submittedAtParsed"].dt.normalize() <= today)).sum()) if "submittedAtParsed" in working else 0

    totals = {
        "totalResponses": int(len(working.index)),
        "totalSectorsCovered": int(working["sector"].fillna("").apply(lambda value: safe_str(value)).replace("", np.nan).nunique()) if "sector" in working else 0,
        "totalDistrictsCovered": int(working["district"].fillna("").apply(lambda value: safe_str(value)).replace("", np.nan).nunique()) if "district" in working else 0,
        "responsesToday": responses_today,
        "responsesThisWeek": responses_week,
        "averageCloudReadinessScore": stats["average"],
        "awarenessRate": round_number(answer_rate(working, "q5", ["Haa"])),
        "adoptionWillingnessRate": round_number(answer_rate(working, "q27", ["Haa", "Waxaa ku xiran qiimaha"])),
        "cloudToolsUsageRate": round_number(answer_rate(working, "q15", ["Haa"])),
        "backupPracticeRate": round_number(answer_rate(working, "q13", ["Haa maalin kasta", "Toddobaadle", "Mararka qaar"])),
        "infrastructureStabilityRate": round_number(working["infrastructureReadiness"].mean()),
        "securityTrustRate": round_number(working["securityTrust"].mean()),
        "lowReadinessCount": int((working["readinessBand"] == "Low").sum()),
        "mediumReadinessCount": int((working["readinessBand"] == "Medium").sum()),
        "highReadinessCount": int((working["readinessBand"] == "High").sum()),
    }

    time_series = build_time_series(working)
    overview = build_overview(totals, stats, time_series, factor_summary, sector_rows, frequencies, business_needs)
    summary_findings = build_summary_findings(totals, stats, frequencies, sector_rows, gaps, correlations, business_needs)
    recommendation_blocks = build_recommendations(totals, factor_summary, barriers, sector_rows, district_rows, business_needs)
    report_view = build_report_view(totals, summary_findings, sector_rows, barriers, readiness_analysis, recommendation_blocks)
    files = chart_files(sector_rows, readiness_analysis, barriers, security, frequencies)

    important_questions = [
        {
            "code": item["code"],
            "question": item["question"],
            "topAnswer": item["answers"][0]["answer"] if item["answers"] else "No answer",
            "topCount": item["answers"][0]["count"] if item["answers"] else 0,
            "topPercentage": item["answers"][0]["percentage"] if item["answers"] else 0,
            "answers": item["answers"],
        }
        for item in question_analysis
        if item["type"] == "closed"
    ]

    readiness_values = working["effectiveReadiness"].astype(float)
    std_deviation = float(np.std(readiness_values)) if not readiness_values.empty else 0.0

    return {
        "generatedAt": pd.Timestamp.utcnow().isoformat(),
        "filters": {},
        "filterOptions": {
            "districts": sorted({safe_str(item) for item in working.get("district", []) if safe_str(item)}),
            "awarenessLevels": [item["answer"] for item in frequencies.get("q5", {}).get("answers", [])],
            "willingnessLevels": [item["answer"] for item in frequencies.get("q27", {}).get("answers", [])],
            "readinessLevels": ["Low", "Medium", "High"],
        },
        "totals": totals,
        "overview": overview,
        "questionAnalysis": question_analysis,
        "sectorComparison": sector_analysis,
        "districtComparison": district_analysis,
        "readiness": readiness_analysis,
        "gapAnalysis": gaps,
        "infrastructure": infrastructure,
        "security": security,
        "barriers": barriers,
        "businessNeeds": business_needs,
        "recommendationBlocks": recommendation_blocks,
        "reportView": report_view,
        "chartFiles": files,
        "summaryFindings": summary_findings,
        "recommendations": recommendation_blocks["summary"],
        "frequencyAnalysis": frequencies,
        "percentageAnalysis": frequencies,
        "readinessStats": stats,
        "factorSummary": factor_summary,
        "readinessRanking": readiness_analysis["sectorLeaderboard"],
        "importantQuestionAnalysis": important_questions,
        "commonBarriers": barriers["overallRanking"],
        "securityConcerns": security["securityConcerns"],
        "districtDistribution": frequency_for_series(working.get("district")),
        "awarenessDistribution": frequencies.get("q5", {}).get("answers", []),
        "willingnessDistribution": frequencies.get("q27", {}).get("answers", []),
        "descriptiveStatistics": {
            "responsesBySector": totals["totalSectorsCovered"],
            "responsesByDistrict": totals["totalDistrictsCovered"],
            "stdDeviationReadiness": round(std_deviation, 2),
        },
    }


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Missing input file"}))
        sys.exit(1)

    try:
        print(json.dumps(analyze(sys.argv[1]), ensure_ascii=True))
    except Exception as exc:
        print(str(exc), file=sys.stderr)
        sys.exit(1)
