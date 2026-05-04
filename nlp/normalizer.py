def normalize_user_preferences(raw_prefs: dict) -> dict:
    """
    Kullanıcının gönderdiği ham tercihleri
    AI modeline uygun formata dönüştürür.
    """

    # Bütçe normalizasyonu
    budget = raw_prefs.get("budget", 1000)
    if budget < 500:
        budget_level = "low"
        budget_score = 0.2
    elif budget < 2000:
        budget_level = "medium"
        budget_score = 0.5
    else:
        budget_level = "high"
        budget_score = 1.0

    # Tüm kategoriler
    all_categories = [
        "historical", "nature", "restaurant",
        "nightlife", "shopping", "museum", "beach"
    ]

    # İlgi alanları → one-hot encoding
    interests = raw_prefs.get("interests", [])
    interest_vector = {
        cat: 1 if cat in interests else 0
        for cat in all_categories
    }

    # Süre normalizasyonu
    duration_days = raw_prefs.get("duration_days", 1)
    duration_score = min(duration_days / 7, 1.0)

    return {
        "budget": {
            "raw": budget,
            "level": budget_level,
            "score": budget_score
        },
        "interest_vector": interest_vector,
        "duration": {
            "days": duration_days,
            "score": duration_score
        },
        "travel_style": raw_prefs.get("travel_style", "balanced")
    }