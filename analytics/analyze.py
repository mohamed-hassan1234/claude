"""Python analytics entrypoint for the Cloud Survey System.

The backend sends filtered survey rows as JSON. Each row contains metadata plus
the exact Somali question text as column names and the real Somali answer labels
as values. This script never expects option indexes.
"""

import json
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

FACTOR_QUESTIONS = {
    "cloudAwareness": ["q5", "q6"],
    "technologyUse": ["q8", "q9"],
    "infrastructureReadiness": ["q10", "q11", "q18", "q19", "q20"],
    "backupPractices": ["q12", "q13"],
    "cloudToolsUse": ["q15", "q17"],
    "securityTrust": ["q24"],
    "willingnessToAdopt": ["q27"],
}

CLOSED_ENDED_QUESTIONS = [
    "q5",
    "q6",
    "q8",
    "q9",
    "q10",
    "q11",
    "q12",
    "q13",
    "q14",
    "q15",
    "q17",
    "q18",
    "q19",
    "q20",
    "q21",
    "q22",
    "q23",
    "q24",
    "q25",
    "q26",
    "q27",
]

FACTOR_LABELS = {
    "cloudAwareness": "Cloud awareness",
    "technologyUse": "Technology use",
    "infrastructureReadiness": "Infrastructure readiness",
    "backupPractices": "Backup practices",
    "cloudToolsUse": "Cloud tools use",
    "securityTrust": "Security trust",
    "willingnessToAdopt": "Willingness to adopt",
}

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


def safe_str(value):
    if value is None or pd.isna(value):
        return ""
    return str(value).strip()


def split_answer(value):
    text = safe_str(value)
    if not text:
        return []
    return [item.strip() for item in text.split(",") if item.strip()]


def frequency_for_column(df, column):
    counts = Counter()
    if column not in df:
        return []
    for value in df[column]:
        for answer in split_answer(value):
            counts[answer] += 1
    total = sum(counts.values())
    return [
        {
            "answer": answer,
            "count": int(count),
            "percentage": round((count / total) * 100, 2) if total else 0,
        }
        for answer, count in counts.most_common()
    ]


def all_frequency_analysis(df):
    return {
        code: {
            "question": text,
            "answers": frequency_for_column(df, text),
        }
        for code, text in QUESTIONS.items()
        if text in df
    }


def important_question_analysis(frequencies):
    important = []
    for code in CLOSED_ENDED_QUESTIONS:
        item = frequencies.get(code)
        if not item:
            continue
        answers = item.get("answers", [])
        important.append(
            {
                "code": code,
                "question": item["question"],
                "topAnswer": answers[0]["answer"] if answers else "No answer",
                "topCount": answers[0]["count"] if answers else 0,
                "topPercentage": answers[0]["percentage"] if answers else 0,
                "answers": answers,
            }
        )
    return important


def score_answer(code, value):
    answers = split_answer(value)
    if not answers:
        return 0
    score_map = SCORES.get(code, {})
    scores = [score_map.get(answer, 40) for answer in answers]
    return float(np.mean(scores))


def add_factor_scores(df):
    working = df.copy()
    for factor, codes in FACTOR_QUESTIONS.items():
        per_question = []
        for code in codes:
            text = QUESTIONS[code]
            if text in working:
                per_question.append(working[text].apply(lambda value, current_code=code: score_answer(current_code, value)))
        working[factor] = pd.concat(per_question, axis=1).mean(axis=1) if per_question else 0
    factor_columns = list(FACTOR_QUESTIONS.keys())
    working["calculatedReadiness"] = working[factor_columns].mean(axis=1)
    return working


def readiness_stats(df):
    scores = pd.to_numeric(df.get("readinessScore", df.get("calculatedReadiness", 0)), errors="coerce").fillna(0)
    if scores.empty:
        return {"average": 0, "median": 0, "min": 0, "max": 0}
    return {
        "average": int(round(float(scores.mean()))),
        "median": int(round(float(scores.median()))),
        "min": int(round(float(scores.min()))),
        "max": int(round(float(scores.max()))),
    }


def sector_comparison(df):
    if df.empty or "sector" not in df:
        return []
    grouped = (
        df.groupby("sector")
        .agg(
            responses=("sector", "count"),
            cloudAwareness=("cloudAwareness", "mean"),
            technologyUse=("technologyUse", "mean"),
            infrastructureReadiness=("infrastructureReadiness", "mean"),
            backupPractices=("backupPractices", "mean"),
            willingnessToAdopt=("willingnessToAdopt", "mean"),
            averageReadiness=("calculatedReadiness", "mean"),
        )
        .reset_index()
        .sort_values("averageReadiness", ascending=False)
    )
    return [
        {
            "sector": row["sector"],
            "responses": int(row["responses"]),
            "cloudAwareness": int(round(row["cloudAwareness"])),
            "technologyUse": int(round(row["technologyUse"])),
            "infrastructureReadiness": int(round(row["infrastructureReadiness"])),
            "backupPractices": int(round(row["backupPractices"])),
            "willingnessToAdopt": int(round(row["willingnessToAdopt"])),
            "averageReadiness": int(round(row["averageReadiness"])),
        }
        for _, row in grouped.iterrows()
    ]


def gap_analysis(df):
    gaps = []
    ideal = 100
    for factor in FACTOR_QUESTIONS:
        current = float(df[factor].mean()) if factor in df and len(df.index) else 0
        gaps.append(
            {
                "factor": factor,
                "current": int(round(current)),
                "ideal": ideal,
                "gap": int(round(ideal - current)),
            }
        )
    return sorted(gaps, key=lambda item: item["gap"], reverse=True)


def factor_summary(df):
    summary = []
    for factor, label in FACTOR_LABELS.items():
        current = float(df[factor].mean()) if factor in df and len(df.index) else 0
        summary.append(
            {
                "factor": factor,
                "label": label,
                "score": int(round(current)),
            }
        )
    return sorted(summary, key=lambda item: item["score"], reverse=True)


def chart_path(name):
    output_dir = Path(__file__).resolve().parent / "generated"
    output_dir.mkdir(exist_ok=True)
    return output_dir / f"{name}-{uuid4().hex[:8]}.png"


def save_bar_chart(items, label_key, value_key, title, name):
    path = chart_path(name)
    labels = [item[label_key] for item in items[:10]]
    values = [item[value_key] for item in items[:10]]
    plt.figure(figsize=(10, 5))
    plt.bar(labels, values, color="#0f7c90")
    plt.title(title)
    plt.xticks(rotation=35, ha="right")
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
        plt.pie(values, labels=labels, autopct="%1.1f%%")
    plt.title(title)
    plt.tight_layout()
    plt.savefig(path)
    plt.close()
    return str(path)


def recommendations(stats, gaps, frequencies):
    recs = []
    if stats["average"] < 40:
        recs.append("Kor u qaad wacyigelinta cloud computing, tababarka aasaasiga ah, iyo tijaabooyin qiimo jaban.")
    elif stats["average"] < 70:
        recs.append("Xooji backup joogto ah, tababar shaqaale, iyo hagitaan ku saabsan isticmaalka cloud tools.")
    else:
        recs.append("Diiradda saar amniga xogta, governance, iyo ballaarinta cloud systems-ka waaxyaha kala duwan.")

    gap_names = [item["factor"] for item in gaps[:3]]
    if "infrastructureReadiness" in gap_names:
        recs.append("Mudnaanta sii koronto joogto ah iyo internet la isku halleyn karo si adoption-ku u noqdo mid macquul ah.")
    if "backupPractices" in gap_names:
        recs.append("Samee siyaasad backup ah oo cad, gaar ahaan hay’adaha weli isticmaala Warqado ama Computer local ah.")
    if "securityTrust" in gap_names:
        recs.append("Bixi wacyigelin ku saabsan encryption, access control, iyo ilaalinta sirta xogta.")

    barriers = frequencies.get("q21", {}).get("answers", [])
    if barriers:
        recs.append(f"Caqabadda ugu badan waa {barriers[0]['answer']}; qorshaha hirgelintu waa inuu si gaar ah u xalliyo.")
    return recs


def analyze(path):
    raw = json.loads(Path(path).read_text(encoding="utf-8"))
    df = pd.DataFrame(raw)

    if df.empty:
        return {
            "totalResponses": 0,
            "frequencyAnalysis": {},
            "percentageAnalysis": {},
            "readinessStats": {"average": 0, "median": 0, "min": 0, "max": 0},
            "factorSummary": [],
            "sectorComparison": [],
            "readinessRanking": [],
            "gapAnalysis": [],
            "importantQuestionAnalysis": [],
            "charts": {},
            "summaryFindings": ["No survey responses match the selected filters yet."],
            "recommendations": ["Collect more responses before drawing operational conclusions."],
        }

    working = add_factor_scores(df)
    frequencies = all_frequency_analysis(working)
    important = important_question_analysis(frequencies)
    stats = readiness_stats(working)
    sectors = sector_comparison(working)
    gaps = gap_analysis(working)
    factors = factor_summary(working)

    q27_frequency = frequencies.get("q27", {}).get("answers", [])
    q8_frequency = frequencies.get("q8", {}).get("answers", [])
    q21_frequency = frequencies.get("q21", {}).get("answers", [])

    charts = {
        "sectorRanking": save_bar_chart(sectors, "sector", "averageReadiness", "Readiness ranking by sector", "sector-ranking")
        if sectors
        else "",
        "technologyUse": save_pie_chart(q8_frequency, "answer", "count", "Technology use", "technology-use") if q8_frequency else "",
        "barriers": save_bar_chart(q21_frequency, "answer", "count", "Cloud adoption barriers", "barriers") if q21_frequency else "",
        "adoptionWillingness": save_pie_chart(q27_frequency, "answer", "count", "Adoption willingness", "adoption-willingness")
        if q27_frequency
        else "",
    }

    top_sector = sectors[0]["sector"] if sectors else "No sector"
    top_barrier = q21_frequency[0]["answer"] if q21_frequency else "No dominant barrier"
    weakest_factor = gaps[0]["factor"] if gaps else "No factor"
    strongest_factor = factors[0]["label"] if factors else "No factor"

    return {
        "totalResponses": int(len(working.index)),
        "frequencyAnalysis": frequencies,
        "percentageAnalysis": frequencies,
        "readinessStats": stats,
        "factorSummary": factors,
        "sectorComparison": sectors,
        "readinessRanking": sectors,
        "gapAnalysis": gaps,
        "importantQuestionAnalysis": important,
        "districtDistribution": frequency_for_column(working, "district"),
        "awarenessDistribution": frequencies.get("q5", {}).get("answers", []),
        "willingnessDistribution": q27_frequency,
        "commonBarriers": q21_frequency,
        "infrastructureChallenges": frequencies.get("q20", {}).get("answers", []),
        "securityConcerns": frequencies.get("q25", {}).get("answers", []),
        "charts": charts,
        "summaryFindings": [
            f"{len(working.index)} responses were analyzed.",
            f"The average cloud readiness score is {stats['average']} out of 100.",
            f"The highest readiness sector is {top_sector}.",
            f"The most common cloud adoption barrier is {top_barrier}.",
            f"The strongest readiness area is {strongest_factor}.",
            f"The largest readiness gap is {FACTOR_LABELS.get(weakest_factor, weakest_factor)}.",
        ],
        "recommendations": recommendations(stats, gaps, frequencies),
        "descriptiveStatistics": {
            "responsesBySector": int(working["sector"].nunique()) if "sector" in working else 0,
            "responsesByDistrict": int(working["district"].nunique()) if "district" in working else 0,
            "stdDeviationReadiness": float(np.std(working["calculatedReadiness"])),
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
