"""Open-ended text analysis for academic DOCX reports."""

from __future__ import annotations

import json
import re
import sys
from collections import Counter
from pathlib import Path


STOP_WORDS = {
    "iyo",
    "ama",
    "waa",
    "wax",
    "in",
    "la",
    "oo",
    "ka",
    "ku",
    "ay",
    "uu",
    "u",
    "ah",
    "ee",
    "si",
    "leh",
}

THEMES = [
    ("Data storage, backup, and document management", ["backup", "kayd", "xog", "dukumenti", "document"]),
    ("Security and data protection", ["amn", "sir", "xatooyo", "security", "ilaalin"]),
    ("Training, awareness, and skills", ["tababar", "wacyi", "xirfad", "aqoon"]),
    ("Infrastructure, internet, power, and cost", ["internet", "koronto", "qiime", "kharash", "jaban"]),
    ("Efficiency, management, and collaboration", ["hufnaan", "fudud", "maamul", "shaqo", "wada"]),
    ("Future growth of cloud computing in Somalia", ["mustaqbal", "soomaaliya", "kori", "cloud"]),
]

POSITIVE_WORDS = ["caawin", "fudud", "kori", "hagaaj", "jaban", "fiican", "wanaag"]
NEGATIVE_WORDS = ["caqabad", "kharash", "darro", "walwal", "xatooyo", "liita", "dhibaato"]


def clean(value):
    return str(value or "").strip()


def tokens(text):
    return [
        item
        for item in re.sub(r"[^\w\s'-]", " ", text.lower()).split()
        if len(item) > 2 and item not in STOP_WORDS
    ]


def analyze(values):
    texts = [clean(value) for value in values if clean(value)]
    word_counts = Counter()
    repeated = Counter()
    sentiments = Counter({"positive": 0, "neutral": 0, "negative": 0})
    themes = [{"theme": theme, "keywords": keywords, "count": 0, "examples": []} for theme, keywords in THEMES]

    for text in texts:
        normalized = text.lower()
        text_tokens = tokens(text)
        word_counts.update(text_tokens)
        repeated.update(text_tokens[:8])

        positive_hits = sum(1 for word in POSITIVE_WORDS if word in normalized)
        negative_hits = sum(1 for word in NEGATIVE_WORDS if word in normalized)
        if positive_hits > negative_hits:
            sentiments["positive"] += 1
        elif negative_hits > positive_hits:
            sentiments["negative"] += 1
        else:
            sentiments["neutral"] += 1

        matched = False
        for theme in themes:
            if any(keyword in normalized for keyword in theme["keywords"]):
                theme["count"] += 1
                matched = True
                if len(theme["examples"]) < 3:
                    theme["examples"].append(text)

        if not matched:
            other = next((item for item in themes if item["theme"] == "Other operational comments"), None)
            if not other:
                other = {"theme": "Other operational comments", "keywords": [], "count": 0, "examples": []}
                themes.append(other)
            other["count"] += 1
            if len(other["examples"]) < 3:
                other["examples"].append(text)

    total = len(texts) or 1
    theme_rows = [
        {**theme, "percentage": round((theme["count"] / total) * 100, 2)}
        for theme in themes
        if theme["count"]
    ]
    theme_rows.sort(key=lambda item: item["count"], reverse=True)

    return {
        "totalResponses": len(texts),
        "themes": theme_rows,
        "keywords": [
            {"keyword": word, "count": count, "percentage": round((count / total) * 100, 2)}
            for word, count in word_counts.most_common(25)
        ],
        "repeatedIdeas": [
            {"answer": word, "label": word, "count": count, "percentage": round((count / total) * 100, 2)}
            for word, count in repeated.most_common(15)
            if count > 1
        ],
        "sentiment": [
            {"answer": label, "label": label, "count": count, "percentage": round((count / total) * 100, 2)}
            for label, count in sentiments.items()
        ],
        "sampleResponses": texts[:8],
    }


def main():
    if len(sys.argv) < 2:
        raise SystemExit("Usage: text_analysis.py <values.json>")
    values = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    print(json.dumps(analyze(values), ensure_ascii=False))


if __name__ == "__main__":
    main()
