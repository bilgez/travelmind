"""
plan_builder.py — Backend'de tam plan oluşturur.

Akış:
  1. Kullanıcı tercihleri (budget, duration, categories, group_type, sentiment...)
  2. hybrid_recommend → aktivite skorları (JSON'dan, cosine similarity)
  3. Yeterli aktivite yoksa score'a göre tamamla
  4. Günlere böl (zaman + bütçeye göre, 2-6 aktivite/gün)
  5. Her gün için nlp/optimizer.py → Dijkstra sıralaması
  6. DB'den tam detay çek (description, latitude/longitude, rating, image_url)
  7. Yapılandırılmış plan döndür
"""

import os
import sys
import json
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from database import engine

from nlp.recommender import hybrid_recommend, get_recommendations
from nlp.optimizer import optimize_route

# Müzekart kabul eden mekan isimleri (JSON'dan, DB'de bu kolon yok)
_JSON_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "antalya_activities.json")
with open(_JSON_PATH, encoding="utf-8") as _f:
    _MUZEKART_NAMES: set = {a["name"] for a in json.load(_f) if a.get("muzekart")}

# ──────────────────────────────────────────
# KATEGORİ DÖNÜŞÜM HARİTALARI
# ──────────────────────────────────────────

EN_TO_TR = {
    "historical": "tarihi_yer", "ruins": "tarihi_yer", "museum": "tarihi_yer",
    "gallery": "tarihi_yer", "religious": "tarihi_yer",
    "beach": "plaj", "beachclub": "plaj",
    "nature": "doga", "park": "doga", "waterfall": "doga",
    "cave": "doga", "activity": "doga",
    "restaurant": "restoran",
    "nightlife": "gece_hayati",
    "shopping": "alisveris", "mall": "alisveris", "market": "alisveris",
    "themepark": "eglence", "family": "eglence", "wellness": "eglence",
}

TR_LABELS = {
    "tarihi_yer": "Tarihi Yer", "plaj": "Plaj", "doga": "Doğa",
    "restoran": "Restoran", "gece_hayati": "Gece Hayatı",
    "alisveris": "Alışveriş", "eglence": "Eğlence",
}

DAY_THEMES = {
    "tarihi_yer": "Tarihi Keşif", "plaj": "Plaj ve Deniz",
    "doga": "Doğa Macerası", "restoran": "Gastronomi Günü",
    "gece_hayati": "Gece Hayatı", "alisveris": "Alışveriş ve Keşif",
    "eglence": "Eğlence Günü",
}

VISIT_DURATIONS = {
    "tarihi_yer": 90, "plaj": 180, "doga": 120,
    "restoran": 75, "gece_hayati": 120, "alisveris": 90, "eglence": 120,
}


# ──────────────────────────────────────────
# YARDIMCI FONKSİYONLAR
# ──────────────────────────────────────────

def _get_db_activities_by_ids(ids: list) -> dict:
    """DB'den verilen id'lere ait aktivite detaylarını döndürür."""
    if not ids:
        return {}
    with engine.connect() as conn:
        result = conn.execute(
            text("SELECT * FROM activities WHERE id = ANY(:ids)"),
            {"ids": list(ids)}
        )
        return {row['id']: dict(row) for row in result.mappings().all()}


def _effective_price(db_act: dict, has_muzekart: bool) -> float:
    """Müzekart varsa ve mekan müzekart kabul ediyorsa 0, yoksa DB fiyatı döner."""
    if has_muzekart and db_act.get("name") in _MUZEKART_NAMES:
        return 0
    return db_act.get("price") or 0


def _get_all_db_activities() -> list:
    """DB'deki tüm aktiviteleri rating'e göre sıralı döndürür."""
    with engine.connect() as conn:
        result = conn.execute(
            text("SELECT * FROM activities ORDER BY rating DESC")
        )
        return [dict(row) for row in result.mappings().all()]


def _dominant_category(activities: list) -> str:
    counts = {}
    for a in activities:
        cat = a.get("category", "")
        counts[cat] = counts.get(cat, 0) + 1
    return max(counts, key=counts.get) if counts else "tarihi_yer"


MAX_DAY_MINUTES = 660   # 09:00 → 20:00
MAX_PER_DAY     = 6
MIN_PER_DAY     = 2


def _calc_start_times(activities: list) -> list:
    """Tüm aktiviteler için start_time'ları tek geçişte hesaplar (O(n))."""
    times = []
    current = 9 * 60
    for act in activities:
        h, m = divmod(current, 60)
        times.append(f"{h:02d}:{m:02d}")
        dur = VISIT_DURATIONS.get(act.get("category", ""), 90)
        current += dur + 20
        if 12.5 * 60 <= current < 14 * 60:
            current = 14 * 60
    return times


def _fill_day(pool: list, forced_ids: set, daily_budget: float,
              used_ids: set, negative_tr_cats: set) -> list:
    """
    Zaman ve bütçeye sığan aktiviteleri seç.
    Forced aktiviteler (kullanıcının yazdıkları) her zaman dahil edilir.
    """
    day_acts = []
    time_used = 0
    spent = 0

    for act in pool:
        if act["id"] in used_ids:
            continue

        is_forced = act["id"] in forced_ids

        if not is_forced and act["category"] in negative_tr_cats:
            continue

        act_time = VISIT_DURATIONS.get(act["category"], 90) + 20
        price = act["price"]

        if not is_forced:
            if len(day_acts) >= MAX_PER_DAY:
                continue
            if time_used + act_time > MAX_DAY_MINUTES:
                continue
            if daily_budget > 0 and price > 0 and spent + price > daily_budget * 1.1:
                continue

        day_acts.append(act)
        time_used += act_time
        spent += price
        used_ids.add(act["id"])

    return day_acts


# ──────────────────────────────────────────
# ANA FONKSİYON
# ──────────────────────────────────────────

def build_plan(collected: dict, normalized_prefs: dict) -> dict:
    """
    NLP pipeline çıktısından tam gün planı oluşturur.
    FIX 1: Negatif sentiment kategorileri her aşamada filtrelenir.
    FIX 2: Belirtilen lokasyonlar (Perge, Aspendos vs.) plana zorla girer.
    FIX 3: Bütçe aşıldığında pahalı mekanlar ucuzlarla değiştirilir.
    """
    duration_days  = collected.get("duration_days") or 1
    budget         = collected.get("budget") or 0
    has_muzekart   = collected.get("has_muzekart") or False
    max_candidates = duration_days * MAX_PER_DAY

    # ── FIX 1: Negatif sentiment → dışlanacak Türkçe DB kategorileri ──
    sentiment_vector = collected.get("sentiment_vector", {})
    negative_tr_cats = set()
    for nlp_cat, score in sentiment_vector.items():
        if score < 0:
            tr = EN_TO_TR.get(nlp_cat)
            if tr:
                negative_tr_cats.add(tr)

    # ── FIX 2: Lokasyonlar → DB'de bul, plana zorla ekle ──
    locations = collected.get("locations", [])
    forced_activities = []
    forced_ids = set()
    if locations:
        loc_names = [loc["name"] for loc in locations]
        all_db_for_locs = _get_all_db_activities()
        for db_act in all_db_for_locs:
            if db_act["name"] in loc_names and db_act["id"] not in forced_ids:
                forced_activities.append({
                    "id":             db_act["id"],
                    "name":           db_act["name"],
                    "category":       db_act["category"],
                    "price":          _effective_price(db_act, has_muzekart),
                    "original_price": db_act.get("price") or 0,
                    "muzekart":       db_act.get("name") in _MUZEKART_NAMES,
                    "rating":         db_act["rating"] or 0,
                    "latitude":       db_act["latitude"],
                    "longitude":      db_act["longitude"],
                    "image_url":      db_act["image_url"] or "",
                    "description":    db_act.get("description") or "",
                    "match_score":    1.0,
                })
                forced_ids.add(db_act["id"])

    # ── 1. hybrid_recommend ile skorlanmış aktivite listesi al ──
    ages = collected.get("age_groups", [])
    is_family = collected.get("is_family_trip", False)
    parsed_for_hybrid = {
        "age_groups":       ages,
        "is_family_trip":   is_family,
        "time_slots":       collected.get("time_slots", {}),
        "categories":       collected.get("categories", []),
        "keywords":         collected.get("keywords", []),
        "sentiment_vector": sentiment_vector,
        "group_type":       collected.get("group_type"),
    }

    hybrid_result = hybrid_recommend(parsed_for_hybrid, normalized_prefs)
    balanced = hybrid_result.get("balanced_recommendations", [])
    budget_friendly = hybrid_result.get("budget_friendly_package", [])

    seen_ids = set(forced_ids)
    all_recs = []
    for rec in balanced + budget_friendly:
        if rec["id"] not in seen_ids:
            seen_ids.add(rec["id"])
            all_recs.append(rec)
    all_recs.sort(key=lambda x: x.get("match_score", 0), reverse=True)

    # Yeterli aday yoksa daha fazla al
    if len(all_recs) + len(forced_activities) < max_candidates:
        extra = get_recommendations(
            normalized_prefs, top_n=max_candidates * 2,
            mode="balanced", ages=ages, family_boost=is_family
        )
        for rec in extra:
            if rec["id"] not in seen_ids:
                seen_ids.add(rec["id"])
                all_recs.append(rec)

    # ── 2. DB'den tam detayları çek ──
    rec_ids = [r["id"] for r in all_recs]
    db_map = _get_db_activities_by_ids(rec_ids)

    enriched = []
    for rec in all_recs:
        db_act = db_map.get(rec["id"])
        if not db_act:
            continue
        if db_act["category"] in negative_tr_cats:
            continue
        enriched.append({
            "id":             db_act["id"],
            "name":           db_act["name"],
            "category":       db_act["category"],
            "price":          _effective_price(db_act, has_muzekart),
            "original_price": db_act.get("price") or 0,
            "muzekart":       db_act.get("name") in _MUZEKART_NAMES,
            "rating":         db_act["rating"] or rec.get("popularity", 0),
            "latitude":       db_act["latitude"],
            "longitude":      db_act["longitude"],
            "image_url":      db_act["image_url"] or "",
            "description":    db_act.get("description") or "",
            "match_score":    rec.get("match_score", 0),
        })

    # Yetmezse DB'den negatif olmayan aktiviteler ekle
    if len(enriched) + len(forced_activities) < max_candidates:
        all_db = _get_all_db_activities()
        existing_ids = {a["id"] for a in enriched} | forced_ids
        daily_budget = budget / duration_days if budget > 0 else 0
        for db_act in all_db:
            if db_act["id"] in existing_ids:
                continue
            if db_act["category"] in negative_tr_cats:
                continue
            eff = _effective_price(db_act, has_muzekart)
            if daily_budget > 0 and eff > 0 and eff > daily_budget * 1.1:
                continue
            enriched.append({
                "id":             db_act["id"],
                "name":           db_act["name"],
                "category":       db_act["category"],
                "price":          eff,
                "original_price": db_act.get("price") or 0,
                "muzekart":       db_act.get("name") in _MUZEKART_NAMES,
                "rating":         db_act["rating"] or 0,
                "latitude":       db_act["latitude"],
                "longitude":      db_act["longitude"],
                "image_url":      db_act["image_url"] or "",
                "description":    db_act.get("description") or "",
                "match_score":    0,
            })

    # Forced aktiviteleri başa al
    final_pool = forced_activities + enriched

    # ── 3. Günlere böl (zaman + bütçe bazlı) ──
    daily_budget = budget / duration_days if budget > 0 else 0
    used_ids: set = set()
    days = []

    for d in range(duration_days):
        day_acts = _fill_day(final_pool, forced_ids, daily_budget, used_ids, negative_tr_cats)
        if not day_acts:
            break

        # ── 4. Dijkstra ile gün içi rota optimize et ──
        act_ids = [a["id"] for a in day_acts]
        try:
            opt_result = optimize_route(act_ids)
            optimized_ids = [r["id"] for r in opt_result["route"]]
            id_to_act = {a["id"]: a for a in day_acts}
            day_acts_ordered = [id_to_act[i] for i in optimized_ids if i in id_to_act]
            ordered_ids = set(optimized_ids)
            for a in day_acts:
                if a["id"] not in ordered_ids:
                    day_acts_ordered.append(a)
            segments = opt_result.get("segments", [])
            for i, act in enumerate(day_acts_ordered):
                if i < len(segments):
                    seg = segments[i]
                    act["distance_km"] = seg.get("distance_km", 0)
                    act["walk_min"] = seg.get("walk_min", 0)
                    act["drive_min"] = seg.get("drive_min", 0)
        except Exception:
            day_acts_ordered = day_acts

        start_times = _calc_start_times(day_acts_ordered)
        for i, act in enumerate(day_acts_ordered):
            act["start_time"] = start_times[i]

        dominant = _dominant_category(day_acts_ordered)
        day_cost = sum(a["price"] for a in day_acts_ordered)

        days.append({
            "day":        d + 1,
            "theme":      DAY_THEMES.get(dominant, "Antalya Turu"),
            "activities": day_acts_ordered,
            "day_cost":   day_cost,
        })

    # ── 5. Plan başlığı ve toplam maliyet ──
    all_acts = [a for day in days for a in day["activities"]]
    total_cost = sum(a["price"] for a in all_acts)
    dominant_overall = _dominant_category(all_acts)

    PLAN_TITLES = {
        "tarihi_yer": f"{duration_days} Günlük Tarihi Antalya Turu",
        "plaj":       f"{duration_days} Günlük Antalya Plaj Tatili",
        "doga":       f"{duration_days} Günlük Doğa Kaçamağı",
        "restoran":   f"{duration_days} Günlük Gastronomi Turu",
        "gece_hayati":f"{duration_days} Günlük Eğlence Tatili",
        "alisveris":  f"{duration_days} Günlük Keşif Turu",
        "eglence":    f"{duration_days} Günlük Eğlenceli Tatil",
    }

    return {
        "title":       PLAN_TITLES.get(dominant_overall, f"{duration_days} Günlük Antalya Tatili"),
        "totalCost":   total_cost,
        "budget":      budget,
        "duration":    duration_days,
        "has_muzekart": has_muzekart,
        "days":        days,
    }