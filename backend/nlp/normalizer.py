import os
import json

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BASE_DIR, "data", "antalya_activities.json")

with open(DATA_PATH, "r", encoding="utf-8") as f:
    ACTIVITIES = json.load(f)

# ──────────────────────────────────────────
# SABITLER
# ──────────────────────────────────────────

ALL_CATEGORIES = [
    "historical", "nature", "restaurant",
    "nightlife", "shopping", "museum", "beach", "family",
    "cave", "waterfall", "park", "ruins", "activity",
    "wellness", "themepark", "beachclub",
]

GROUP_INTEREST_BOOST = {
    "family":  ["family", "nature", "museum", "beach"],
    "couple":  ["restaurant", "nature", "historical", "wellness"],
    "solo":    ["historical", "museum", "nature"],
    "friends": ["nightlife", "restaurant", "beach", "shopping", "activity", "nature"],
}

BUDGET_CATEGORY_BOOST = {
    "low":         ["historical", "nature", "museum", "park"],
    "medium_low":  ["historical", "nature", "museum", "restaurant"],
    "medium":      ["restaurant", "beach", "nature", "shopping"],
    "medium_high": ["restaurant", "nightlife", "shopping", "beach"],
    "high":        ["nightlife", "shopping", "restaurant", "beachclub"],
}

BUDGET_LEVELS = [
    (0,     500,   "low",         0.2),
    (501,   1500,  "medium_low",  0.4),
    (1501,  3000,  "medium",      0.6),
    (3001,  6000,  "medium_high", 0.8),
    (6001,  float("inf"), "high", 1.0),
]

GROUP_TO_STYLE = {
    "family":  "family",
    "couple":  "romantic",
    "solo":    "balanced",
    "friends": "entertainment",
}


# ──────────────────────────────────────────
# YARDIMCI FONKSİYONLAR
# ──────────────────────────────────────────

def get_budget_level(budget: int) -> tuple:
    for low, high, level, score in BUDGET_LEVELS:
        if low <= budget <= high:
            return level, score
    return "high", 1.0


def get_affordable_categories(budget: int) -> list:
    category_prices = {}
    for activity in ACTIVITIES:
        cat = activity.get("category")
        price = activity.get("price", 0)
        if cat not in category_prices:
            category_prices[cat] = []
        category_prices[cat].append(price)

    affordable = []
    for cat, prices in category_prices.items():
        avg_price = sum(prices) / len(prices)
        if avg_price <= budget * 0.4:
            affordable.append(cat)

    return affordable


# ──────────────────────────────────────────
# ANA FONKSİYON
# ──────────────────────────────────────────

def normalize_user_preferences(raw_prefs: dict, parsed_input: dict = None) -> dict:

    # ── Bütçe ──────────────────────────────────────────────
    budget = (
        parsed_input.get("budget")
        if parsed_input and parsed_input.get("budget")
        else raw_prefs.get("budget", 1000)
    )
    budget_level, budget_score = get_budget_level(budget)

    # ── Süre ───────────────────────────────────────────────
    duration_days = (
        parsed_input.get("duration_days")
        if parsed_input and parsed_input.get("duration_days")
        else raw_prefs.get("duration_days", 1)
    )
    duration_score = round(min(duration_days / 7, 1.0), 4)

    # ── Grup tipi ──────────────────────────────────────────
    group_type = (
        parsed_input.get("group_type")
        if parsed_input and parsed_input.get("group_type")
        else raw_prefs.get("travel_style", "solo")
    )

    # ── Yaş grubu ──────────────────────────────────────────
    age_groups = (
        parsed_input.get("age_groups", [])
        if parsed_input
        else raw_prefs.get("age_groups", [])
    )

    # ── Interest vektörü ───────────────────────────────────
    interests = raw_prefs.get("interests", [])

    interest_vector = {
        cat: 1 if cat in interests else 0
        for cat in ALL_CATEGORIES
    }

    # 1) Grup tipine göre boost
    group_boost_cats = GROUP_INTEREST_BOOST.get(group_type, [])
    has_explicit = any(v >= 1 for v in interest_vector.values())
    for cat in group_boost_cats:
        if cat in interest_vector:
            if has_explicit:
                interest_vector[cat] = max(interest_vector[cat], 0.7)
            else:
                interest_vector[cat] = max(interest_vector[cat], 1)

    # 2) Bütçeye göre boost
    budget_boost_cats = BUDGET_CATEGORY_BOOST.get(budget_level, [])
    for cat in budget_boost_cats:
        if cat in interest_vector and interest_vector[cat] == 0:
            interest_vector[cat] = 0.5

    # 3) Parser'dan gelen kategorileri ekle
    if parsed_input:
        for cat in parsed_input.get("categories", []):
            if cat in interest_vector:
                interest_vector[cat] = max(interest_vector[cat], 1)

    # 4) Sentiment vektörünü uygula
    if parsed_input:
        sentiment = parsed_input.get("sentiment_vector", {})
        for cat, score in sentiment.items():
            if cat in interest_vector:
                if score > 0 and interest_vector[cat] == 0:
                    interest_vector[cat] = 0.7
                elif score < 0:
                    interest_vector[cat] = -1

    # 5) Bütçeyle uyumsuz pahalı kategorileri zayıflat
    affordable_cats = get_affordable_categories(budget)
    for cat in ALL_CATEGORIES:
        if cat not in affordable_cats and interest_vector.get(cat, 0) > 0:
            if interest_vector[cat] > 0:
                interest_vector[cat] = round(interest_vector[cat] * 0.6, 2)

    travel_style = GROUP_TO_STYLE.get(group_type, "balanced")

    return {
        "budget": {
            "raw":   budget,
            "level": budget_level,
            "score": budget_score,
        },
        "interest_vector": interest_vector,
        "duration": {
            "days":  duration_days,
            "score": duration_score,
        },
        "group_type":   group_type,
        "age_groups":   age_groups,
        "travel_style": travel_style,
    }