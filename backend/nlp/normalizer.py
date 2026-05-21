def normalize_user_preferences(raw_prefs: dict, parsed_input: dict = None) -> dict:
    """
    Ham tercihleri + parser çıktısını birleştirerek
    AI modeline uygun formata dönüştürür.

    Parser çıktısı varsa ondan gelen veriler öncelikli,
    yoksa raw_prefs'ten alır (fallback).
    """

    # ── Bütçe ──────────────────────────────────────────────
    # Önce parser'dan bak, yoksa raw_prefs'ten al
    budget = (
        parsed_input.get("budget")
        if parsed_input and parsed_input.get("budget")
        else raw_prefs.get("budget", 1000)
    )

    if budget < 500:
        budget_level = "low"
        budget_score = round(budget / 2500, 4)   # doğrusal ölçek
    elif budget < 2000:
        budget_level = "medium"
        budget_score = round(0.2 + (budget - 500) / 3000, 4)
    else:
        budget_level = "high"
        budget_score = min(round(budget / 3000, 4), 1.0)

    # ── Süre ───────────────────────────────────────────────
    duration_days = (
        parsed_input.get("duration_days")
        if parsed_input and parsed_input.get("duration_days")
        else raw_prefs.get("duration_days", 1)
    )
    duration_score = round(min(duration_days / 7, 1.0), 4)

    # ── İlgi alanları ──────────────────────────────────────
    all_categories = [
        "historical", "nature", "restaurant",
        "nightlife", "shopping", "museum", "beach",
    ]
    interests = raw_prefs.get("interests", [])
    interest_vector = {
        cat: 1 if cat in interests else 0
        for cat in all_categories
    }

    # YENİ: Sentiment vektörünü interest_vector'a uygula
    # Pozitif sentiment → skoru 1'e çek
    # Negatif sentiment → skoru -1'e çek (recommender filtreler)
    if parsed_input:
        sentiment = parsed_input.get("sentiment_vector", {})
        for cat, score in sentiment.items():
            if score > 0:
                interest_vector[cat] = 1
            elif score < 0:
                interest_vector[cat] = -1   # negatif sinyal

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

    # ── Travel style (grup tipinden türet) ─────────────────
    GROUP_TO_STYLE = {
        "family":  "family",
        "couple":  "romantic",
        "solo":    "balanced",
        "friends": "entertainment",
    }
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