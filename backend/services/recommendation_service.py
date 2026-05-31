"""
recommendation_service.py
─────────────────────────
Frontend'den gelen ham isteği alır, parser/normalizer/recommender
zincirinden geçirir ve seçilebilir kategori havuzları ile özel paketler döner.

v4 Güncellemesi:
- name 'TIME_KEYWORDS' is not defined NameError krizini önlemek adına local import temizliği yapıldı.
- constants bağımlılığı kuralına tam senkronizasyon sağlandı.
"""

from nlp.parser      import parse_user_input, recommend_from_parse
from nlp.normalizer  import normalize_user_preferences
from nlp.recommender import (
    hybrid_recommend,
    normalize_budget,
    CATEGORY_LABELS_TR,
    ACTIVITIES,
)


class RecommendationService:

    # Veritabanında (JSON) ve parser'da desteklenen tüm alt ve ana kategoriler
    VALID_GROUP_TYPES = {"family", "couple", "solo", "friends"}
    VALID_CATEGORIES = {
        "historical", "nature", "restaurant", "nightlife",
        "shopping", "museum", "beach", "family", "ruins",
        "themepark", "market", "mall", "park", "waterfall",
        "cave", "gallery", "religious", "wellness", "beachclub", "activity",
    }

    def recommend(self, data: dict) -> dict:
        """
        Ana öneri metodu. Frontend isteğini alır, kategori havuzları ve bütçe planı döner.
        """
        validated  = self._validate(data)
        parsed     = self._build_parsed(validated, raw_data=data)
        normalized = self._build_normalized(validated)

        # 1. Akademik Hibrit Öneri Paketlerini Hesapla
        hybrid_result = hybrid_recommend(parsed, normalized)

        # 2. Esnek Kategori Havuzlarını Hesapla
        raw_pools = recommend_from_parse(parsed, top_n_per_category=5)
        
        category_pools = {}
        for cat_name, act_list in raw_pools.items():
            category_pools[cat_name] = self._build_cards(act_list, budget=validated["budget"])

        # 3. Hibrit paketlerin kart formatına dönüştürülmesi
        balanced_cards = self._build_cards(hybrid_result.get("balanced_recommendations", []), budget=validated["budget"])
        budget_friendly_cards = self._build_cards(hybrid_result.get("budget_friendly_package", []), budget=validated["budget"])
        premium_speed_cards = self._build_cards(hybrid_result.get("premium_speed_package", []), budget=validated["budget"])

        return {
            "cards": balanced_cards,  # Geriye uyumluluk için ana kart listesi dengeli paket kalıyor
            "category_pools": category_pools,  # Frontend'in kategorilere göre dizeceği asıl havuz yapısı
            "packages": {
                "balanced": balanced_cards,
                "budget_friendly": budget_friendly_cards,
                "premium_speed": premium_speed_cards
            },
            "budget_plan":  hybrid_result.get("budget_plan"),
            "budget_swaps": hybrid_result.get("budget_swaps", []),
            "meta": {
                "budget":        validated["budget"],
                "budget_level":  normalized["budget"]["level"],
                "group_type":    validated.get("group_type"),
                "categories":    validated.get("categories", []),
                "duration_days": validated.get("duration_days"),
                "age_groups":    validated.get("age_groups", []),
                "is_family":     parsed.get("is_family_trip", False),
                "travel_style":  normalized.get("travel_style"),
            },
        }

    # ─────────────────────────────────────────────────────────
    # YARDIMCI METODLAR
    # ─────────────────────────────────────────────────────────

    def _validate(self, data: dict) -> dict:
        budget = data.get("budget")
        if budget is None:
            raise ValueError("'budget' alanı zorunlu.")
        try:
            budget = int(budget)
        except (TypeError, ValueError):
            raise ValueError(f"'budget' sayısal olmalı, gelen: {budget!r}")
        if budget <= 0:
            raise ValueError(f"Bütçe sıfırdan büyük olmalı, gelen: {budget}")

        group_type = data.get("group_type")
        if group_type and group_type not in self.VALID_GROUP_TYPES:
            raise ValueError(f"Geçersiz group_type: {group_type!r}. Geçerli değerler: {self.VALID_GROUP_TYPES}")

        raw_cats = data.get("categories", [])
        categories = [c for c in raw_cats if c in self.VALID_CATEGORIES]

        age_groups = data.get("age_groups", [])
        try:
            age_groups = [int(a) for a in age_groups]
        except (TypeError, ValueError):
            age_groups = []

        duration = data.get("duration_days")
        if duration is not None:
            try:
                duration = int(duration)
                if duration <= 0: duration = 1
            except (TypeError, ValueError):
                duration = None

        user_text = data.get("user_text", "")
        self._parsed_text_cache = {}
        
        if user_text:
            parsed_text = parse_user_input(user_text)
            self._parsed_text_cache = parsed_text
            
            if not group_type and parsed_text.get("group_type"):
                group_type = parsed_text["group_type"]
            if not categories and parsed_text.get("categories"):
                categories = [c for c in parsed_text["categories"] if c in self.VALID_CATEGORIES]
            if not age_groups and parsed_text.get("age_groups"):
                age_groups = parsed_text["age_groups"]
            if duration is None and parsed_text.get("duration_days"):
                duration = parsed_text["duration_days"]

        return {
            "budget":        budget,
            "group_type":    group_type,
            "categories":    categories,
            "duration_days": duration,
            "age_groups":    age_groups,
        }

    def _build_parsed(self, v: dict, raw_data: dict) -> dict:
        is_family = v["group_type"] == "family" or bool(v["age_groups"])
        categories = list(v["categories"])
        if is_family and "family" not in categories:
            categories.insert(0, "family")

        cache = getattr(self, "_parsed_text_cache", {})
        time_slots = cache.get("time_slots", {})
        sentiment_vector = cache.get("sentiment_vector", {})

        return {
            "age_groups":     v["age_groups"],
            "is_family_trip": is_family,
            "time_slots":     time_slots,
            "sentiment_vector": sentiment_vector,
            "categories":     categories,
            "group_type":     v["group_type"],
            "raw_input":      raw_data.get("user_text", "")
        }

    def _build_normalized(self, v: dict) -> dict:
        budget_info = normalize_budget(v["budget"])
        duration = v["duration_days"] or 1
        duration_score = round(min(duration / 7.0, 1.0), 4)

        all_cats = [
            "historical", "nature", "restaurant", "nightlife",
            "shopping", "museum", "beach", "family", "ruins",
            "themepark", "market", "mall", "park", "waterfall",
            "cave", "gallery", "religious", "wellness", "beachclub", "activity"
        ]
        interest_vector = {cat: 0.0 for cat in all_cats}
        for cat in v["categories"]:
            if cat in interest_vector:
                interest_vector[cat] = 1.0

        cache = getattr(self, "_parsed_text_cache", {})
        sentiment_vector = cache.get("sentiment_vector", {})
        for cat, score in sentiment_vector.items():
            if cat in interest_vector and score < 0:
                interest_vector[cat] = -1.0

        GROUP_BOOST = {
            "family":  ["family", "nature", "museum", "beach", "themepark"],
            "couple":  ["restaurant", "nature", "historical", "wellness"],
            "solo":    ["historical", "museum", "nature"],
            "friends": ["nightlife", "restaurant", "beach", "shopping", "activity"],
        }
        if v["group_type"]:
            for cat in GROUP_BOOST.get(v["group_type"], []):
                if cat in interest_vector and interest_vector[cat] == 0.0:
                    interest_vector[cat] = 0.5

        travel_style_map = {
            "family":  "cultural", "couple":  "romantic",
            "solo":    "cultural", "friends": "entertainment",
        }
        travel_style = travel_style_map.get(v["group_type"] or "solo", "balanced")

        return {
            "budget": budget_info,
            "interest_vector": interest_vector,
            "duration": {"days": duration, "score": duration_score},
            "travel_style": travel_style,
            "age_groups": v["age_groups"],
            "group_type": v["group_type"] or "solo",
            "is_family_trip": v["group_type"] == "family" or bool(v["age_groups"]),
        }

    def _build_cards(self, recommendations: list, budget: int) -> list:
        cards = []
        for rec in recommendations:
            price = rec.get("price", 0)
            budget_pct = round((price / budget) * 100, 1) if budget > 0 else 0

            card = {
                "id":             rec["id"],
                "name":           rec["name"],
                "category":       rec["category"],
                "category_label": CATEGORY_LABELS_TR.get(rec["category"], rec["category"]),
                "price":          price,
                "duration_min":   rec.get("duration_minutes", 60),
                "popularity":     rec.get("popularity", 0),
                "match_score":    rec.get("match_score", 0.0),
                "budget_status":  rec.get("budget_status", "unknown"),
                "budget_pct":     budget_pct,
                "tags":           rec.get("explanation", {}).get("tags", []),
                "explanation":    rec.get("explanation", {}),
            }
            cards.append(card)
        return cards