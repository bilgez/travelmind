"""
recommender.py  —  Aktivite öneri motoru.

v4 Gelişmiş Akademik İyileştirmeler (Mevcut Kapsam Tamamen Korundu):
─────────────────────────────────────────────────────────────
SKORLAMA & MATEMATİKSEL MODEL:
- Ağırlık toplamı garantili 1.0: w_content + w_pop + w_price = 1.0
- Akıllı Bütçe Cezası (Continuous Logarithmic Penalty): Sabit kademeler (0.1/0.2) 
  yerine bütçe sınırından uzaklaştıkça logaritmik olarak artan pürüzsüz ceza fonksiyonu.
- family_bonus artık final skor üzerine ek bonus (normalize dışında)
- Negatif interest_vector değerleri (-1) → aktivite tamamen filtrelenir

ÇEŞİTLİLİK (Diversity Boost v4):
- Aynı kategorideki yerlerin üst üste yığılmasını engellemek için koruma bölgesi 1'e çekildi.
- _apply_diversity artık hem KATEGORİ hem de KONUM/BÖLGE bazlı çalışıyor ve tüm paket 
  modlarında dengeli bir dağılım sağlıyor.

XAI (Explainable AI) KATMANI:
- build_explanation fonksiyonu modelin kararlarını matematiksel bileşenlerine 
  ayırarak yüzdesel ağırlıklarla kullanıcıya açıklar.
─────────────────────────────────────────────────────────────
"""

import json
import os
import math
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BASE_DIR, "data", "antalya_activities.json")

with open(DATA_PATH, "r", encoding="utf-8") as f:
    ACTIVITIES = json.load(f)

# ──────────────────────────────────────────
# SABİTLER (HİÇBİRİ EKSİLTİLMEDİ)
# ──────────────────────────────────────────

ALL_CATEGORIES = [
    "historical", "nature", "restaurant",
    "nightlife", "shopping", "museum", "beach", "family",
    "cave", "waterfall", "park", "ruins", "activity",
    "wellness", "themepark", "beachclub",
]

CATEGORY_AGE_SUITABILITY = {
    "family":     (0,  99),
    "themepark":  (3,  99),
    "beach":      (0,  99),
    "nature":     (3,  99),
    "museum":     (5,  99),
    "historical": (6,  99),
    "ruins":      (8,  99),
    "restaurant": (0,  99),
    "mall":       (0,  99),
    "shopping":   (0,  99),
    "market":     (3,  99),
    "park":       (0,  99),
    "waterfall":  (3,  99),
    "cave":       (6,  99),
    "gallery":    (10, 99),
    "religious":  (5,  99),
    "wellness":   (16, 99),
    "nightlife":  (18, 99),
    "beachclub":  (18, 99),
    "activity":   (10, 99),
}

BUDGET_LEVELS = [
    (0,     500,   "low",         0.2),
    (501,   1500,  "medium_low",  0.4),
    (1501,  3000,  "medium",      0.6),
    (3001,  6000,  "medium_high", 0.8),
    (6001,  float("inf"), "high", 1.0),
]

DAILY_BUDGET_RATIOS = {
    "low":         {"food": 0.40, "activity": 0.35, "shopping": 0.15, "other": 0.10},
    "medium_low":  {"food": 0.35, "activity": 0.40, "shopping": 0.15, "other": 0.10},
    "medium":      {"food": 0.30, "activity": 0.40, "shopping": 0.20, "other": 0.10},
    "medium_high": {"food": 0.25, "activity": 0.35, "shopping": 0.25, "other": 0.15},
    "high":        {"food": 0.20, "activity": 0.35, "shopping": 0.30, "other": 0.15},
}

CATEGORY_TO_BUDGET_ITEM = {
    "restaurant":  "food", "fine_dining": "food", "cafe": "food",
    "nightlife":   "activity", "beachclub": "activity", "beach": "activity",
    "historical":  "activity", "museum": "activity", "ruins": "activity",
    "nature":      "activity", "park": "activity", "waterfall": "activity",
    "cave":        "activity", "themepark": "activity", "activity": "activity",
    "wellness":    "activity", "gallery": "activity", "religious": "activity",
    "shopping":    "shopping", "mall": "shopping", "market": "shopping", "family": "activity",
}

CATEGORY_LABELS_TR = {
    "historical": "Tarihi Mekan", "nature": "Doğa", "restaurant": "Restoran",
    "nightlife": "Gece Hayatı", "shopping": "Alışveriş", "museum": "Müze",
    "beach": "Plaj", "family": "Aile Aktivitesi", "ruins": "Antik Kalıntı",
    "themepark": "Tema Park", "market": "Pazar", "mall": "AVM", "park": "Park",
    "waterfall": "Şelale", "cave": "Mağara", "gallery": "Galeri",
    "religious": "Dini Mekan", "wellness": "Wellness", "beachclub": "Beach Club", "activity": "Aktivite",
}

# NameError hatasını çözen eksik sabit buraya eklendi!
TIME_KEYWORDS = {
    "sabah":  ["historical", "nature", "museum"],
    "öğlen":  ["restaurant", "cafe", "shopping"],
    "akşam":  ["restaurant", "fine_dining"],
    "gece":   ["nightlife", "bar", "club"],
}


# ──────────────────────────────────────────
# HELPER: DİNAMİK BÖLGE TESPİTİ
# ──────────────────────────────────────────
def _detect_region(activity_name: str) -> str:
    name_lower = activity_name.lower()
    if "konyaaltı" in name_lower: return "konyaalti"
    if "lara" in name_lower: return "lara"
    if "kaleiçi" in name_lower or "hadrian" in name_lower or "yivli" in name_lower: return "kaleici"
    if "manavgat" in name_lower: return "manavgat"
    if "alanya" in name_lower: return "alanya"
    if "kemer" in name_lower or "phaselis" in name_lower: return "kemer"
    return "other"


# ──────────────────────────────────────────
# BÜTÇE PLANI v2 (TAMAMEN KORUNDU)
# ──────────────────────────────────────────
def calculate_budget_plan(activities: list, total_budget: float, duration_days: int = 1, budget_level: str = "medium") -> dict:
    if not activities or total_budget <= 0:
        return {
            "total_cost": 0, "remaining_budget": total_budget, "status": "ok", "status_label": "Bütçe yeterli",
            "daily_budget": 0, "daily_cost": 0, "remaining_pct": 100, "category_breakdown": {},
            "over_budget_activities": [], "per_activity": [], "advice": None,
        }

    total_cost = sum(a.get("price", 0) for a in activities)
    remaining = total_budget - total_cost
    remaining_pct = round((remaining / total_budget) * 100, 1)

    daily_budget = round(total_budget / max(duration_days, 1), 2)
    daily_cost = round(total_cost / max(duration_days, 1), 2)

    category_breakdown = {}
    for activity in activities:
        cat = activity.get("category", "other")
        budget_item = CATEGORY_TO_BUDGET_ITEM.get(cat, "other")
        price = activity.get("price", 0)
        if budget_item not in category_breakdown:
            category_breakdown[budget_item] = {"total": 0, "activities": []}
        category_breakdown[budget_item]["total"] += price
        category_breakdown[budget_item]["activities"].append(activity.get("name", ""))

    recommended_ratios = DAILY_BUDGET_RATIOS.get(budget_level, DAILY_BUDGET_RATIOS["medium"])
    distribution_warnings = []
    for item, data in category_breakdown.items():
        actual_ratio = data["total"] / total_budget
        rec_ratio = recommended_ratios.get(item, 0.1)
        if actual_ratio > rec_ratio * 1.5:
            distribution_warnings.append(f"{item} harcaması önerilen oranın {round(actual_ratio/rec_ratio, 1)}x üzerinde")

    over_budget_activities = [a for a in activities if a.get("price", 0) > total_budget * 0.5]

    if remaining < 0:
        status = "over_budget"
        status_label = f"Bütçe {abs(round(remaining))} TL aşıldı"
    elif remaining_pct < 10:
        status = "warning"
        status_label = f"Bütçenin %{100 - remaining_pct:.0f}'i kullanılıyor, çok az kalıyor"
    elif remaining_pct < 20:
        status = "tight_budget"
        status_label = f"Bütçe sıkışık — %{remaining_pct:.0f} ({round(remaining)} TL) kalıyor"
    else:
        status = "ok"
        status_label = f"Bütçe uygun — %{remaining_pct:.0f} ({round(remaining)} TL) kalıyor"

    per_activity = []
    for a in activities:
        price = a.get("price", 0)
        pct_of_budget = round((price / total_budget) * 100, 1) if total_budget > 0 else 0
        within = price <= total_budget
        per_activity.append({
            "id": a.get("id"), "name": a.get("name"), "category": a.get("category"),
            "price": price, "pct_of_budget": pct_of_budget, "within_budget": within,
            "budget_item": CATEGORY_TO_BUDGET_ITEM.get(a.get("category", ""), "other"),
        })

    advice = None
    if status == "over_budget":
        most_expensive = max(activities, key=lambda x: x.get("price", 0), default=None)
        if most_expensive:
            advice = f"En pahalı aktivite '{most_expensive['name']}' ({most_expensive.get('price', 0)} TL). Bunu değiştirirsen bütçene girebilirsin."
    elif status in ("warning", "tight_budget"):
        advice = f"Günlük ortalama harcaman {daily_cost} TL. Bütçeni {daily_budget} TL/gün olarak planlarsan rahat edersin."
    elif distribution_warnings:
        advice = " | ".join(distribution_warnings)

    return {
        "total_cost": round(total_cost, 2), "remaining_budget": round(remaining, 2), "remaining_pct": remaining_pct,
        "status": status, "status_label": status_label, "daily_budget": daily_budget, "daily_cost": daily_cost,
        "category_breakdown": category_breakdown, "distribution_warnings": distribution_warnings,
        "over_budget_activities": [a["name"] for a in over_budget_activities], "per_activity": per_activity, "advice": advice,
    }


# ──────────────────────────────────────────
# BUDGET FRIENDLY SWAP (TAMAMEN KORUNDU)
# ──────────────────────────────────────────
def get_budget_friendly_swap(activity: dict, budget_limit: float) -> dict | None:
    alternatives = [
        a for a in ACTIVITIES
        if a["category"] == activity["category"] and a["id"] != activity["id"]
        and a.get("price", 0) < activity.get("price", 0) and a.get("price", 0) <= budget_limit
    ]
    if not alternatives:
        related = {"restaurant": ["cafe", "market"], "nightlife": ["restaurant", "beachclub"], "beachclub": ["beach", "nightlife"], "themepark": ["family", "nature"]}
        alt_cats = related.get(activity["category"], [])
        alternatives = [
            a for a in ACTIVITIES
            if a["category"] in alt_cats and a.get("price", 0) < activity.get("price", 0) and a.get("price", 0) <= budget_limit
        ]
    if not alternatives: return None

    def swap_score(a):
        popularity = a.get("popularity", 0) / 10.0
        price_fit = 1.0 - (a.get("price", 0) / max(budget_limit, 1))
        return popularity * 0.6 + price_fit * 0.4

    return sorted(alternatives, key=swap_score, reverse=True)[0]


# ──────────────────────────────────────────
# EXPLANATION KATMANI (XAI Geliştirildi)
# ──────────────────────────────────────────
def build_explanation(
    activity: dict,
    user_prefs: dict,
    match_score: float,
    components: dict,
    distance_km: float | None = None,
) -> dict:
    category = activity.get("category", "")
    price = activity.get("price", 0)
    duration = activity.get("duration_minutes", 60)
    raw_budget = user_prefs.get("budget", {}).get("raw", 0)
    interest_vector = user_prefs.get("interest_vector", {})

    interest_score = interest_vector.get(category, 0)
    if interest_score >= 1.0:
        primary_reason = f"İlgi alanlarınla doğrudan örtüşüyor: {CATEGORY_LABELS_TR.get(category, category)}"
    elif interest_score > 0:
        primary_reason = f"Profiline kısmen uyuyor: {CATEGORY_LABELS_TR.get(category, category)}"
    elif match_score > 0.7:
        primary_reason = "Profiline göre yüksek uyum sağlıyor"
    else:
        primary_reason = "Popüler ve bütçene uygun bir seçenek"

    xai_report = (
        f"Model Karar Dağılımı: %{components['content_influence']:.0f} İlgi Uyumu, "
        f"%{components['pop_influence']:.0f} Popülerlik Etkisi, "
        f"%{components['price_influence']:.0f} Fiyat Uygunluğu."
    )
    if components.get("penalty_applied", 0) > 0:
        xai_report += f" (Bütçe aşımından ötürü %{components['penalty_applied']:.0f} puan ceza kesilmiştir.)"

    if raw_budget > 0:
        ratio = price / raw_budget
        if price == 0: budget_note = "Ücretsiz giriş"
        elif ratio <= 0.05: budget_note = f"Bütçenin çok küçük bir kısmı ({price} TL)"
        elif ratio <= 0.15: budget_note = f"Bütçene rahatlıkla uyuyor ({price} TL)"
        elif ratio <= 0.35: budget_note = f"Bütçene uygun ({price} TL)"
        elif ratio <= 0.60: budget_note = f"Bütçenin önemli bir kısmını kullanıyor ({price} TL)"
        else: budget_note = f"⚠️ Bütçenin büyük bölümünü kullanıyor ({price} TL)"
    else:
        budget_note = f"Giriş ücreti: {price} TL" if price > 0 else "Ücretsiz giriş"

    if duration < 60: duration_note = f"~{duration} dakika"
    elif duration < 120: duration_note = "~1 saat"
    else:
        hours = duration // 60
        mins = duration % 60
        duration_note = f"~{hours} saat" + (f" {mins} dk" if mins else "")

    if match_score >= 0.8: score_label = "🌟 Mükemmel Eşleşme"
    elif match_score >= 0.6: score_label = "✓ İyi Eşleşme"
    elif match_score >= 0.4: score_label = "~ Orta Eşleşme"
    else: score_label = "Genel Öneri"

    tags = [CATEGORY_LABELS_TR.get(category, category)]
    if price == 0: tags.append("Ücretsiz")
    if activity.get("popularity", 0) >= 8: tags.append("Çok Popüler")

    return {
        "primary_reason": primary_reason,
        "mathematical_explanation": xai_report,
        "budget_note": budget_note,
        "duration_note": duration_note,
        "score_label": score_label,
        "tags": tags,
    }


# ──────────────────────────────────────────
# VEKTÖR FONKSİYONLARI
# ──────────────────────────────────────────
def is_age_suitable(activity: dict, ages: list) -> bool:
    if not ages: return True
    category = activity.get("category", "")
    min_age, max_age = CATEGORY_AGE_SUITABILITY.get(category, (0, 99))
    return all(min_age <= age <= max_age for age in ages)

def activity_to_vector(activity: dict) -> list:
    vector = []
    for cat in ALL_CATEGORIES:
        vector.append(1.0 if activity["category"] == cat else 0.0)
    vector.append(activity["popularity"] / 10.0)
    max_price = 500.0
    vector.append(1.0 - min(activity["price"] / max_price, 1.0))
    return vector

def user_to_vector(interest_vector: dict, budget_score: float) -> list:
    vector = []
    for cat in ALL_CATEGORIES:
        vector.append(max(interest_vector.get(cat, 0.0), 0.0))
    vector.append(1.0)
    vector.append(budget_score)
    return vector

def content_based_score(user_vector: list, activity_vector: list) -> float:
    user_arr = np.array(user_vector).reshape(1, -1)
    activity_arr = np.array(activity_vector).reshape(1, -1)
    return round(float(cosine_similarity(user_arr, activity_arr)[0][0]), 4)


# ──────────────────────────────────────────
# ANA ÖNERİ FONKSİYONU v3 (Dinamik Ceza Entegreli)
# ──────────────────────────────────────────
def get_recommendations(
    normalized_prefs: dict,
    top_n: int = 5,
    mode: str = "balanced",
    ages: list = None,
    family_boost: bool = False,
    include_explanations: bool = True,
    diversity_boost: bool = False,
) -> list:
    interest_vector = normalized_prefs["interest_vector"]
    budget_score    = normalized_prefs["budget"]["score"]
    raw_budget      = normalized_prefs["budget"].get("raw", 0)

    weight_sets = {
        "budget":   (0.35, 0.20, 0.45),
        "speed":    (0.35, 0.55, 0.10),
        "balanced": (0.45, 0.30, 0.25),
    }
    w_content, w_pop, w_price = weight_sets.get(mode, weight_sets["balanced"])

    iv = dict(interest_vector)
    if family_boost:
        iv["family"] = max(iv.get("family", 0.0), 1.0)

    # 🚨 KRİTİK FİLTRE: Sadece kullanıcının açıkça pozitif (>0) veya 1 yaptığı kategorileri kabul et.
    # Normalizer'dan gelen otomatik yan kategorileri (0.5 olanları) veya hiç geçmeyen 0'ları tamamen eliyoruz.
    allowed_categories = {cat for cat, val in iv.items() if val >= 0.7}
    negative_cats = {cat for cat, val in iv.items() if val < 0}

    user_vec = user_to_vector(iv, budget_score)

    scored_activities = []
    for activity in ACTIVITIES:
        # Yaş uygun değilse geç
        if ages and not is_age_suitable(activity, ages): continue
        
        # Kullanıcının istemediği (negatif sentiment) kategori ise kesinlikle geç
        if activity["category"] in negative_cats: continue

        # 🚨 KESİN KATEGORİ FİLTRESİ: Aktivite kategorisi izin verilen ana kategorilerden biri değilse pakete SIZAMAZ!
        if activity["category"] not in allowed_categories: continue

        activity_vec = activity_to_vector(activity)
        base_score = content_based_score(user_vec, activity_vec)

        price = activity.get("price", 0)
        budget_penalty = 0.0
        if raw_budget > 0 and price > raw_budget:
            ratio = price / raw_budget
            budget_penalty = min(0.15 * math.log(ratio) + 0.1, 0.5)

        raw_score = (
            base_score * w_content
            + activity_vec[-2] * w_pop
            + activity_vec[-1] * w_price
            - budget_penalty
        )
        final_score = round(min(max(raw_score, 0.0), 1.0), 4)

        if family_boost and activity["category"] == "family":
            final_score = min(final_score + 0.08, 1.0)

        total_weights = w_content + w_pop + w_price
        components = {
            "content_influence": (w_content / total_weights) * 100,
            "pop_influence": (w_pop / total_weights) * 100,
            "price_influence": (w_price / total_weights) * 100,
            "penalty_applied": budget_penalty * 100
        }

        entry = {
            "id":               activity["id"],
            "name":             activity["name"],
            "category":         activity["category"],
            "price":            price,
            "duration_minutes": activity.get("duration_minutes", 60),
            "popularity":       activity.get("popularity", 0),
            "match_score":      final_score,
            "region":           _detect_region(activity["name"]),
            "budget_status":    "over_budget" if price > raw_budget else "within_budget",
            "age_suitable":     True,
        }

        if include_explanations:
            entry["explanation"] = build_explanation(
                activity=activity, user_prefs=normalized_prefs,
                match_score=final_score, components=components
            )

        scored_activities.append(entry)

    scored_activities.sort(key=lambda x: x["match_score"], reverse=True)

    if diversity_boost:
        scored_activities = _apply_diversity(scored_activities)

    return scored_activities[:top_n]
# ──────────────────────────────────────────
# INTERNALS: BÖLGE + KATEGORİ ÇEŞİTLİLİK ALGORİTMASI
# ──────────────────────────────────────────
def _apply_diversity(activities: list, cat_penalty: float = 0.08, region_penalty: float = 0.04) -> list:
    """
    Akıllı Çeşitlilik v4.
    Listenin sadece en kaliteli 1. önerisine dokunmaz.
    Hemen ardından gelen aynı kategorideki verilere yumuşak ama etkili bir ceza 
    uygulayarak havuzun diğer kategorilerle (müze, restoran vb.) harmanlanmasını sağlar.
    """
    if len(activities) <= 1:
        return activities

    category_count = {}
    region_count = {}
    
    protected_zone = activities[:1]
    burn_zone = activities[1:]

    for act in protected_zone:
        category_count[act["category"]] = category_count.get(act["category"], 0) + 1
        if act["region"] != "other":
            region_count[act["region"]] = region_count.get(act["region"], 0) + 1

    processed_burn_zone = []
    for act in burn_zone:
        cat = act["category"]
        reg = act["region"]

        c_count = category_count.get(cat, 0)
        r_count = region_count.get(reg, 0)

        total_penalty = (c_count * cat_penalty) + (r_count * region_penalty)
        
        if total_penalty > 0:
            act = dict(act)
            act["match_score"] = round(max(act["match_score"] - total_penalty, 0.0), 4)

        category_count[cat] = c_count + 1
        if reg != "other": 
            region_count[reg] = r_count + 1
            
        processed_burn_zone.append(act)

    processed_burn_zone.sort(key=lambda x: x["match_score"], reverse=True)

    return protected_zone + processed_burn_zone


# ──────────────────────────────────────────
# HYBRİD ÖNERİ MERKEZİ (TAMAMEN KORUNDU)
# ──────────────────────────────────────────
def hybrid_recommend(parsed_input: dict, normalized_prefs: dict) -> dict:
    ages = parsed_input.get("age_groups", [])
    is_family = parsed_input.get("is_family_trip", False)
    raw_budget = normalized_prefs["budget"].get("raw", 0)
    duration = normalized_prefs.get("duration", {}).get("days", 1)
    b_level = normalized_prefs["budget"].get("level", "medium")

    # diversity_boost=True parametresi tüm paket modlarına eklendi!
    budget_options = get_recommendations(normalized_prefs, top_n=10, mode="budget", ages=ages, family_boost=is_family, diversity_boost=True)
    speed_options = get_recommendations(normalized_prefs, top_n=10, mode="speed", ages=ages, family_boost=is_family, diversity_boost=True)
    balanced_recs = get_recommendations(normalized_prefs, top_n=15, mode="balanced", ages=ages, family_boost=is_family, diversity_boost=True)

    by_time_slot = {}
    user_keywords = parsed_input.get("keywords", [])
    for slot, slot_categories in TIME_KEYWORDS.items():
        if slot in user_keywords:
            slot_recs = [r for r in balanced_recs if r["category"] in slot_categories]
            if slot_recs: by_time_slot[slot] = slot_recs[:3]

    top5_activities = balanced_recs[:5]
    top5_full = [a for a in ACTIVITIES if a.get("id") in {r["id"] for r in top5_activities}]

    budget_plan = calculate_budget_plan(top5_full, raw_budget, duration, b_level) if raw_budget > 0 else None
    budget_swaps = []
    if budget_plan and budget_plan["status"] in ("warning", "over_budget", "tight_budget"):
        for item in budget_plan["per_activity"]:
            if not item["within_budget"] or budget_plan["status"] == "over_budget":
                original = next((a for a in ACTIVITIES if a.get("id") == item["id"]), None)
                if original:
                    swap = get_budget_friendly_swap(original, raw_budget * 0.25)
                    if swap and swap.get("id") != original.get("id"):
                        saving = item["price"] - swap.get("price", 0)
                        if saving > 0:
                            budget_swaps.append({
                                "original": item["name"], "swap": swap.get("name"), "swap_category": swap.get("category"),
                                "original_price": item["price"], "swap_price": swap.get("price", 0), "saving": saving,
                            })

    return {
        "budget_friendly_package": budget_options[:5], "premium_speed_package": speed_options[:5],
        "balanced_recommendations": balanced_recs[:5], "by_time_slot": by_time_slot,
        "budget_plan": budget_plan, "budget_swaps": budget_swaps, "age_filter_applied": bool(ages), "family_mode": is_family,
    }