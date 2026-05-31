"""
parser.py  —  Kullanıcı mesajını yapısal veriye dönüştürür.

İyileştirmeler (v2):
- extract_group_type artık eşleşme yoksa None döndürüyor ("solo" varsayımı kaldırıldı)
- Sentiment: cümle bazında daha geniş kategori eşleştirmesi
- Bütçe: "k" suffix + kelime haritası genişletildi (750 TL, 1.5k gibi)
- Süre: "yarım gün", "tam gün" desteği eklendi
- ConversationSession.update: group_type None koruması düzeltildi
- is_ready() daha katı: bütçe zorunlu, kategori VEYA süre yeterli
"""

import json
import re
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BASE_DIR, "data", "antalya_activities.json")

with open(DATA_PATH, "r", encoding="utf-8") as f:
    ACTIVITIES = json.load(f)

# ──────────────────────────────────────────
# SABITLER
# ──────────────────────────────────────────

LOCATION_KEYWORDS = {
    "kaleiçi":          {"name": "Kaleiçi",                "category": "historical"},
    "hadrian":          {"name": "Hadrian Kapısı",          "category": "historical"},
    "yivli minare":     {"name": "Yivli Minare",            "category": "historical"},
    "hıdırlık":         {"name": "Hıdırlık Kulesi",         "category": "historical"},
    "perge":            {"name": "Perge Antik Kenti",       "category": "ruins"},
    "aspendos":         {"name": "Aspendos Tiyatrosu",      "category": "ruins"},
    "termessos":        {"name": "Termessos Antik Kenti",   "category": "ruins"},
    "phaselis":         {"name": "Phaselis Antik Kenti",    "category": "ruins"},
    "olympos":          {"name": "Olympos Antik Kenti",     "category": "ruins"},
    "antalya müzesi":   {"name": "Antalya Müzesi",          "category": "museum"},
    "akvaryum":         {"name": "Antalya Akvaryumu",       "category": "themepark"},
    "land of legends":  {"name": "Land of Legends",         "category": "themepark"},
    "konyaaltı":        {"name": "Konyaaltı Plajı",         "category": "beach"},
    "lara":             {"name": "Lara Plajı",              "category": "beach"},
    "mermerli":         {"name": "Mermerli Plajı",          "category": "beach"},
    "kaputaş":          {"name": "Kaputaş Plajı",           "category": "beach"},
    "çıralı":           {"name": "Çıralı Plajı",            "category": "beach"},
    "düden":            {"name": "Düden Şelalesi",          "category": "waterfall"},
    "kurşunlu":         {"name": "Kurşunlu Şelalesi",       "category": "waterfall"},
    "manavgat":         {"name": "Manavgat Şelalesi",       "category": "waterfall"},
    "dim mağarası":     {"name": "Dim Mağarası",            "category": "cave"},
    "karain":           {"name": "Karain Mağarası",         "category": "cave"},
    "altınbeşik":       {"name": "Altınbeşik Mağarası",     "category": "cave"},
    "bit pazarı":       {"name": "Antalya Bit Pazarı",      "category": "market"},
    "kaleiçi bazaar":   {"name": "Kaleiçi Bazaar",          "category": "market"},
    "markantalya":      {"name": "MarkAntalya AVM",         "category": "mall"},
    "terracıty":        {"name": "TerraCity AVM",           "category": "mall"},
    "deepo":            {"name": "Deepo AVM",               "category": "mall"},
    "seraser":          {"name": "Seraser Fine Dining",     "category": "restaurant"},
    "7 mehmet":         {"name": "7 Mehmet Restaurant",     "category": "restaurant"},
    "club arma":        {"name": "Club Arma",               "category": "nightlife"},
    "dubliner":         {"name": "Dubliner Irish Pub",      "category": "nightlife"},
    "köprülü":          {"name": "Rafting Köprülü Kanyon",  "category": "activity"},
    "tünektepe":        {"name": "Tünektepe Teleferik",     "category": "activity"},
    "kesik minare":     {"name": "Kesik Minare Camii",      "category": "religious"},
    "murat paşa":       {"name": "Murat Paşa Camii",       "category": "religious"},
    "kalekapı hamamı":  {"name": "Kalekapı Hamamı",        "category": "wellness"},
    "sefa hamamı":      {"name": "Sefa Hamamı",            "category": "wellness"},
}

TIME_KEYWORDS = {
    "sabah":  ["historical", "nature", "museum"],
    "öğlen":  ["restaurant", "cafe", "shopping"],
    "akşam":  ["restaurant", "fine_dining"],
    "gece":   ["nightlife", "bar", "club"],
}

ACTIVITY_KEYWORDS = {
    # ── Tarihi ──────────────────────────────
    "tarihi":           "historical",
    "kültürel":     "historical",
    "kültür":       "historical",
    "kültürel yer": "historical",
    "tarih":            "historical",
    "kaleiçi":          "historical",
    "kale":             "historical",
    "kule":             "historical",
    "minare":           "historical",
    "osmanlı":          "historical",
    "bizans":           "historical",
    "eski şehir":       "historical",
    "tarihi yerler":    "historical",
    # ── Antik ───────────────────────────────
    "antik":            "ruins",
    "harabe":           "ruins",
    "kalıntı":          "ruins",
    "arkeoloji":        "ruins",
    "tiyatro":          "ruins",
    "roma":             "ruins",
    "yunan":            "ruins",
    "arkeolojik":       "ruins",
    # ── Müze ────────────────────────────────
    "müze":             "museum",
    "müzeler":          "museum",
    "sergi":            "museum",
    "galeri":           "gallery",
    "sanat":            "gallery",
    "resim":            "gallery",
    "heykel":           "gallery",
    # ── Tema Park ───────────────────────────
    "akvaryum":         "themepark",
    "tema park":        "themepark",
    "hayvanat":         "themepark",
    "eğlence park":     "themepark",
    "lunapark":         "themepark",
    "su parkı":         "themepark",
    "aquapark":         "themepark",
    # ── Plaj ────────────────────────────────
    "plaj":             "beach",
    "plajlar":          "beach",
    "deniz":            "beach",
    "koy":              "beach",
    "sahil":            "beach",
    "yüzmek":           "beach",
    "güneşlenmek":      "beach",
    "kumsal":           "beach",
    # ── Beach Club ──────────────────────────
    "beach club":       "beachclub",
    "havuz":            "beachclub",
    "plaj kulübü":      "beachclub",
    "özel plaj":        "beachclub",
    # ── Doğa / Şelale ───────────────────────
    "şelale":           "waterfall",
    "şelaleler":        "waterfall",
    "park":             "park",
    "milli park":       "park",
    "kanyon":           "park",
    "doğa":             "nature",
    "orman":            "nature",
    "dağ":              "nature",
    "yürüyüş":          "nature",
    "trekking":         "nature",
    "piknik":           "nature",
    # ── Mağara ──────────────────────────────
    "mağara":           "cave",
    "mağaralar":        "cave",
    "oyuk":             "cave",
    # ── Pazar / AVM ─────────────────────────
    "pazar":            "market",
    "bit pazarı":       "market",
    "çarşı":            "market",
    "bazaar":           "market",
    "sokak pazarı":     "market",
    "avm":              "mall",
    "alışveriş merkezi": "mall",
    "alışveriş":        "shopping",
    "dükkan":           "shopping",
    "mağaza":           "shopping",
    "hediyelik":        "shopping",
    "kıyafet":          "shopping",
    # ── Restoran (genişletilmiş v3) ─────────
    "restoran":         "restaurant",
    "restoranlar":      "restaurant",
    "yemek":            "restaurant",
    "balık":            "restaurant",
    "kafe":             "restaurant",
    "kahvaltı":         "restaurant",
    "lokanta":          "restaurant",
    "yemek yeri":       "restaurant",
    "yemek yerleri":    "restaurant",
    "kebap":            "restaurant",
    "kahve":            "restaurant",
    "kahveci":          "restaurant",
    "çay bahçesi":      "restaurant",
    "çay":              "restaurant",
    "tatlı":            "restaurant",
    "pastane":          "restaurant",
    "döner":            "restaurant",
    "pide":             "restaurant",
    "gözleme":          "restaurant",
    "meze":             "restaurant",
    "içecek":           "restaurant",
    "breakfast":        "restaurant",
    # ── Gece Hayatı ─────────────────────────
    "gece":             "nightlife",
    "bar":              "nightlife",
    "kulüp":            "nightlife",
    "eğlence":          "themepark",
    "disko":            "nightlife",
    "canlı müzik":      "nightlife",
    "konser":           "nightlife",
    "pub":              "nightlife",
    # ── Aktivite ────────────────────────────
    "tekne":            "activity",
    "tur":              "activity",
    "rafting":          "activity",
    "zipline":          "activity",
    "safari":           "activity",
    "teleferik":        "activity",
    "jeep safari":      "activity",
    "parasailing":      "activity",
    "dalış":            "activity",
    "scuba":            "activity",
    "atv":              "activity",
    "yamaç paraşütü":   "activity",
    # ── Dini ────────────────────────────────
    "cami":             "religious",
    "camiler":          "religious",
    "türbe":            "religious",
    "dini":             "religious",
    "kilise":           "religious",
    "ibadet":           "religious",
    "mescit":           "religious",
    # ── Wellness ────────────────────────────
    "hamam":            "wellness",
    "spa":              "wellness",
    "masaj":            "wellness",
    "termal":           "wellness",
    "kaplıca":          "wellness",
    "sağlık":           "wellness",
    # ── Aile ────────────────────────────────
    "çocuk":            "family",
    "çocuklar":         "family",
    "bebek":            "family",
    "oyun":             "family",
    "oyun parkı":       "family",
    "çocuk dostu":      "family",
    "aile":             "family",
    "çocuklu":          "family",
    "çocukla":          "family",
}

GROUP_KEYWORDS = {
    "ailecek":        "family",
    "aileyle":        "family",
    "aile":           "family",
    "çocuklu":        "family",
    "çocuklarla":     "family",
    "eşimle":         "couple",
    "eşimle birlikte": "couple",
    "sevgilimle":     "couple",
    "sevgilimle birlikte": "couple",
    "çift olarak":    "couple",
    "çift":           "couple",
    "romantik":       "couple",
    "yalnız":         "solo",
    "solo":           "solo",
    "tek başıma":     "solo",
    "tek başına":     "solo",
    "arkadaşlarımla": "friends",
    "arkadaşlarla":   "friends",
    "arkadaşlarım":   "friends",
    "arkadaş grubu":  "friends",
    "grup olarak":    "friends",
    "ekiple":         "friends",
    "ekip":           "friends",
}

GROUP_CATEGORY_MAP = {
    "family":  ["family", "nature", "museum", "historical", "beach", "themepark"],
    "couple":  ["restaurant", "fine_dining", "nature", "historical", "wellness"],
    "solo":    ["historical", "museum", "nature", "shopping"],
    "friends": ["nightlife", "restaurant", "beach", "shopping", "activity"],
}

BUDGET_WORD_MAP = {
    "iki buçuk bin":  2500,
    "bir buçuk bin":  1500,
    "iki bin":        2000,
    "üç bin":         3000,
    "dört bin":       4000,
    "beş bin":        5000,
    "on bin":         10000,
    "beş yüz":        500,
    "yedi yüz elli":  750,
    "bin":            1000,
    "yüz":            100,
    "milyon":         1_000_000,
}

DAY_WORD_MAP = {
    "yarım gün":  0,   # 0 ile işaretle, özel handle
    "tam gün":    1,
    "bir hafta":  7,
    "haftalık":   7,
    "hafta sonu": 2,
    "bir":        1,
    "iki":        2,
    "üç":         3,
    "dört":       4,
    "beş":        5,
    "altı":       6,
    "yedi":       7,
}

NEGATION_WORDS = [
    # Tekil
    "istemiyorum", "sevmiyorum", "nefret", "değil",
    "olmaz", "hayır", "no", "yok", "istemem", "gitme",
    "gitmek istemiyorum", "ilgilenmiyorum",
    # Çoğul / biz formu
    "istemiyoruz", "sevmiyoruz", "istemeyiz", "gitmeyiz",
    "ilgilenmiyoruz",
    # Yasaklayıcı
    "olmasın", "istemiyorsun", "istemiyorsunuz", "gitmeyin",
    "gerek yok", "gerekmiyor", "hiç istemiyoruz",
]

POSITIVE_WORDS = ["seviyorum", "istiyorum", "harika", "güzel", "mükemmel",
                  "çok iyi", "bayılırım", "çok seviyorum", "kesinlikle",
                  "istiyoruz", "gidelim", "görmek istiyoruz", "seviyoruz"]
NEGATIVE_WORDS = ["sevmiyorum", "istemiyorum", "nefret", "berbat",
                  "kötü", "sıkıcı", "ilgilenmiyorum", "hiç istemem",
                  "istemiyoruz", "sevmiyoruz", "istemeyiz"]

CATEGORY_AGE_SUITABILITY = {
    "family":     (0,   99),
    "themepark":  (3,   99),
    "beach":      (0,   99),
    "nature":     (3,   99),
    "museum":     (5,   99),
    "historical": (6,   99),
    "ruins":      (8,   99),
    "restaurant": (0,   99),
    "mall":       (0,   99),
    "shopping":   (0,   99),
    "market":     (3,   99),
    "park":       (0,   99),
    "waterfall":  (3,   99),
    "cave":       (6,   99),
    "gallery":    (10,  99),
    "religious":  (5,   99),
    "wellness":   (16,  99),
    "nightlife":  (18,  99),
    "beachclub":  (18,  99),
    "activity":   (10,  99),
}

ACTIVITY_AGE_OVERRIDES = {}


# ──────────────────────────────────────────
# CONVERSATION SESSION STATE
# ──────────────────────────────────────────

class ConversationSession:
    """
    Kullanıcıyla devam eden sohbetin durumunu saklar.

    v2 değişiklikleri:
    - group_type None koruması: "solo" asla otomatik set edilmez
    - update() daha dikkatli birleştirme
    - summary() missing_fields listesini döndürüyor
    """

    FIELD_LABELS = {
        "budget":        "Bütçe",
        "duration_days": "Seyahat süresi",
        "group_type":    "Kiminle geliyor",
        "categories":    "İlgi alanları",
        "age_groups":    "Çocuk yaşları",
    }

    CLARIFICATION_QUESTIONS = {
        "budget": (
            "Bu gezi için yaklaşık ne kadar bütçen var? "
            "(Örnek: 500 TL, 2000 TL gibi söyleyebilirsin.)"
        ),
        "duration_days": (
            "Kaç gün kalacaksın Antalya'da?"
        ),
        "group_type": (
            "Kiminle geliyorsun? "
            "(Yalnız mı, eşinle mi, arkadaşlarınla mı yoksa aileyle mi?)"
        ),
        "categories": (
            "Ne tür aktiviteler ilgini çekiyor? "
            "(Tarihi yerler, plaj, yemek, doğa, alışveriş gibi birkaç şey söyleyebilirsin.)"
        ),
        "age_groups": (
            "Çocukların kaç yaşında? Bilsem yaşa uygun yerler önerebilirim."
        ),
    }

    QUESTION_PRIORITY = ["budget", "duration_days", "group_type", "categories", "age_groups"]

    def __init__(self):
        self.collected: dict = {
            "budget":           None,
            "duration_days":    None,
            "group_type":       None,   # ← None kalır, "solo" OLMAZ
            "categories":       [],
            "age_groups":       [],
            "locations":        [],
            "time_slots":       {},
            "sentiment_vector": {},
            "keywords":         [],
            "is_family_trip":   False,
            "age_suitability_active": False,
        }
        self.history: list[dict] = []
        self.turn_count: int = 0

    def update(self, parsed: dict) -> None:
        """
        Parse sonucunu mevcut session'a birleştirir.

        Kural: None gelen değer mevcut değerin üzerine YAZMAZ.
        "solo" group_type'ı: sadece kullanıcı açıkça söylediyse kabul edilir.
        """
        self.turn_count += 1
        self.history.append({
            "turn": self.turn_count,
            "raw_input": parsed.get("raw_input", ""),
            "parsed": parsed,
        })

        # Skalar: sadece gerçek değer geldiyse güncelle
        for field in ("budget", "duration_days"):
            val = parsed.get(field)
            if val is not None:
                self.collected[field] = val

        # group_type: None veya zaten "solo" ise sadece açık sinyal geldiyse yaz
        new_gt = parsed.get("group_type")
        if new_gt is not None:
            # Parser explicit eşleşme bulduysa kabul et
            if new_gt != "solo" or parsed.get("group_type_explicit", False):
                self.collected["group_type"] = new_gt

        # Listeler: biriktir, tekrar edenleri kaldır
        for field in ("categories", "age_groups", "locations", "keywords"):
            new_items = parsed.get(field, [])
            existing = self.collected.get(field, [])
            merged = existing + [x for x in new_items if x not in existing]
            self.collected[field] = merged

        # Dicts: birleştir
        self.collected["time_slots"].update(parsed.get("time_slots", {}))
        # Sadece sıfır olmayan değerleri güncelle — tarafsız mesajlar önceki negatif/pozitifi ezmemelidir
        new_sv = parsed.get("sentiment_vector", {})
        for cat, score in new_sv.items():
            if score != 0:
                self.collected["sentiment_vector"][cat] = score

        # Türev alanlar
        self.collected["is_family_trip"] = (
            self.collected["group_type"] == "family"
            or bool(self.collected["age_groups"])
        )
        self.collected["age_suitability_active"] = bool(self.collected["age_groups"])

        if self.collected["is_family_trip"] and "family" not in self.collected["categories"]:
            self.collected["categories"].insert(0, "family")

    def get_missing_fields(self) -> list[str]:
        missing = []
        c = self.collected
        if c["budget"] is None:
            missing.append("budget")
        if c["duration_days"] is None:
            missing.append("duration_days")
        if c["group_type"] is None:
            missing.append("group_type")
        if not c["categories"]:
            missing.append("categories")
        if c["is_family_trip"] and not c["age_groups"]:
            missing.append("age_groups")
        return missing

    def get_next_question(self) -> str | None:
        missing = self.get_missing_fields()
        for field in self.QUESTION_PRIORITY:
            if field in missing:
                return self.CLARIFICATION_QUESTIONS[field]
        return None

    def is_ready(self) -> bool:
        """
        Öneri üretmek için minimum koşul:
        Bütçe + (kategori VEYA süre).
        """
        c = self.collected
        return (
            c["budget"] is not None
            and (bool(c["categories"]) or c["duration_days"] is not None)
        )

    def to_normalized_prefs(self) -> dict:
        from nlp.normalizer import get_budget_level

        budget_raw = self.collected["budget"] or 0
        budget_level, budget_score = get_budget_level(budget_raw)
        budget_info = {"raw": budget_raw, "level": budget_level, "score": budget_score}

        duration_days = self.collected["duration_days"] or 1
        duration_score = round(min(duration_days / 7.0, 1.0), 4)

        all_cats = [
            "historical", "nature", "restaurant", "nightlife",
            "shopping", "museum", "beach", "family",
        ]
        # Alt kategorileri ana kategoriye eşle (ruins→historical, cave→nature vb.)
        SUBCAT_MAP = {
            "ruins":      "historical",
            "museum":     "historical",
            "gallery":    "historical",
            "religious":  "historical",
            "cave":       "cave",        # nature'a çevirme, olduğu gibi bırak
            "waterfall":  "waterfall",   # nature'a çevirme, olduğu gibi bırak
            "park":       "park",        # nature'a çevirme, olduğu gibi bırak
            "activity":   "activity",
            "beachclub":  "beach",
            "mall":       "shopping",
            "market":     "shopping",
            "themepark":  "themepark",
            "wellness":   "wellness",
        }
        interest_vector = {cat: 0 for cat in all_cats}
        for cat in self.collected["categories"]:
            mapped = SUBCAT_MAP.get(cat, cat)
            if mapped in interest_vector:
                interest_vector[mapped] = 1

        for cat, score in self.collected["sentiment_vector"].items():
            mapped = SUBCAT_MAP.get(cat, cat)
            if mapped in interest_vector and score < 0:
                interest_vector[mapped] = 0

        travel_style_map = {
            "family":  "cultural",
            "couple":  "romantic",
            "solo":    "cultural",
            "friends": "entertainment",
        }
        group = self.collected["group_type"] or "solo"
        travel_style = travel_style_map.get(group, "balanced")

        return {
            "budget": budget_info,
            "interest_vector": interest_vector,
            "duration": {"days": duration_days, "score": duration_score},
            "travel_style": travel_style,
            "age_groups": self.collected["age_groups"],
            "group_type": group,
            "is_family_trip": self.collected["is_family_trip"],
        }

    def summary(self) -> dict:
        return {
            "turn": self.turn_count,
            "collected": self.collected,
            "missing_fields": self.get_missing_fields(),
            "next_question": self.get_next_question(),
            "is_ready": self.is_ready(),
        }


# ──────────────────────────────────────────
# YAŞ UYGUNLUK
# ──────────────────────────────────────────

def check_age_suitability(activity: dict, ages: list) -> dict:
    if not ages:
        return {"suitable": True, "reason": None, "unsuitable_ages": []}

    activity_id = activity.get("id")
    category = activity.get("category", "")

    if activity_id in ACTIVITY_AGE_OVERRIDES:
        min_age, max_age = ACTIVITY_AGE_OVERRIDES[activity_id]
    else:
        min_age, max_age = CATEGORY_AGE_SUITABILITY.get(category, (0, 99))

    unsuitable = [age for age in ages if not (min_age <= age <= max_age)]

    if unsuitable:
        if min_age > 0 and any(a < min_age for a in unsuitable):
            reason = f"Bu aktivite {min_age} yaş altındaki ziyaretçiler için uygun değil."
        elif max_age < 99 and any(a > max_age for a in unsuitable):
            reason = f"Bu aktivite {max_age} yaş üstündeki ziyaretçiler için uygun değil."
        else:
            reason = "Yaş uyumsuzluğu var."
        return {"suitable": False, "reason": reason, "unsuitable_ages": unsuitable}

    return {"suitable": True, "reason": None, "unsuitable_ages": []}


def filter_by_age(activities: list, ages: list) -> dict:
    suitable = []
    alternatives_needed = []
    for activity in activities:
        result = check_age_suitability(activity, ages)
        if result["suitable"]:
            suitable.append(activity)
        else:
            alternatives_needed.append({
                "activity": activity,
                "reason": result["reason"],
                "unsuitable_ages": result["unsuitable_ages"],
            })
    return {"suitable": suitable, "alternatives_needed": alternatives_needed}


def suggest_family_alternatives(unsuitable_activity: dict) -> list:
    family_friendly_cats = ["family", "themepark", "beach", "nature", "museum", "park"]
    alternatives = [
        a for a in ACTIVITIES
        if a["category"] in family_friendly_cats
        and a["id"] != unsuitable_activity.get("id")
    ]
    return sorted(alternatives, key=lambda x: x["popularity"], reverse=True)[:3]


# ──────────────────────────────────────────
# YARDIMCI PARSE FONKSİYONLARI
# ──────────────────────────────────────────

def extract_budget(text: str) -> int | None:
    text_lower = text.lower()

    # "1.5k", "2k", "750" gibi k-suffix
    k_match = re.search(r'(\d+(?:[.,]\d+)?)\s*k\b', text_lower)
    if k_match:
        return int(float(k_match.group(1).replace(",", ".")) * 1000)

    # "1500 TL", "₺750", "1.500 lira"
    num_match = re.search(r'(\d[\d.,]*)\s*(tl|lira|₺)', text_lower)
    if num_match:
        raw = num_match.group(1).replace(".", "").replace(",", "")
        try:
            return int(raw)
        except ValueError:
            pass

    # Noktalı sayı — rakam + TL olmadan: "1.500" veya "1500"
    plain_match = re.search(r'\b(\d{3,6})\b', text_lower)
    if plain_match and any(word in text_lower for word in ["bütçe", "para", "harca", "ayır"]):
        try:
            return int(plain_match.group(1))
        except ValueError:
            pass

    # Kelime haritası (uzun → kısa sıra)
    for word, value in sorted(BUDGET_WORD_MAP.items(), key=lambda x: -len(x[0])):
        if word in text_lower:
            return value

    return None


def extract_duration(text: str) -> int | None:
    text_lower = text.lower()

    if "yarım gün" in text_lower:
        return 1  # yarım günü 1 gün say

    num_match = re.search(r'(\d+)\s*g[üu]n', text_lower)
    if num_match:
        return int(num_match.group(1))

    for word, value in sorted(DAY_WORD_MAP.items(), key=lambda x: -len(x[0])):
        if word in text_lower and value > 0:
            return value

    return None


def extract_group_type(text: str) -> tuple[str | None, bool]:
    """
    Grup tipini döndürür.
    Returns:
        (group_type | None, explicit: bool)
        explicit=True → kullanıcı açıkça söyledi
    """
    text_lower = text.lower()
    for keyword, group_type in sorted(GROUP_KEYWORDS.items(), key=lambda x: -len(x[0])):
        if keyword in text_lower:
            return group_type, True
    return None, False


def extract_age_groups(text: str) -> list:
    text_lower = text.lower()
    multi = re.findall(r'(\d+)\s*ve\s*(\d+)\s*yaş', text_lower)
    if multi:
        return [int(a) for group in multi for a in group]
    single = re.findall(r'(\d+)\s*yaş', text_lower)
    if single:
        return [int(a) for a in single]
    if "bebek" in text_lower:
        return [1]
    return []


def detect_sentiment(text: str, category: str) -> float:
    """
    Proximity bazlı sentiment.
    Önce keyword'ün hemen sağındaki 3 tokena bakar (yüksek öncelik),
    sonra sol+sağ 4 tokena bakar (genel bağlam).
    'restoranlar istiyoruz plaj istemiyoruz' → restoran:+1, beach:-1
    """
    tokens = text.lower().split()
    category_keys = sorted(
        [k for k, v in ACTIVITY_KEYWORDS.items() if v == category],
        key=len, reverse=True
    )

    cat_positions = []
    for i in range(len(tokens)):
        for kw in category_keys:
            kw_parts = kw.split()
            if tokens[i:i + len(kw_parts)] == kw_parts:
                cat_positions.append(i + len(kw_parts) - 1)
                break

    if not cat_positions:
        return 0.0

    for pos in cat_positions:
        # Keyword'den sonraki 5 tokena sırayla bak — ilk sinyal kazanır
        for tok in tokens[pos + 1:pos + 6]:
            if any(neg in tok for neg in NEGATION_WORDS):
                return -1.0
            if any(pw in tok for pw in POSITIVE_WORDS):
                return 1.0

        # Sol bağlam: keyword'den önceki 2 token
        left = ' '.join(tokens[max(0, pos - 2):pos])
        if any(neg in left for neg in NEGATION_WORDS):
            return -1.0
        if any(pw in left for pw in POSITIVE_WORDS):
            return 1.0

    return 1.0


def build_sentiment_vector(text: str) -> dict:
    all_categories = list(set(ACTIVITY_KEYWORDS.values()))
    return {cat: detect_sentiment(text, cat) for cat in all_categories}


# ──────────────────────────────────────────
# ANA PARSE FONKSİYONU
# ──────────────────────────────────────────

def parse_user_input(text: str) -> dict:
    """
    Kullanıcının tek bir mesajını parse eder.

    v2: group_type_explicit flag eklendi.
    """
    text_lower = text.lower()

    result = {
        "raw_input":           text,
        "time_slots":          {},
        "categories":          [],
        "count":               1,
        "keywords":            [],
        "locations":           [],
        "budget":              None,
        "duration_days":       None,
        "group_type":          None,
        "group_type_explicit": False,
        "age_groups":          [],
        "sentiment_vector":    {},
        "is_family_trip":      False,
        "age_suitability_active": False,
    }

    # Zaman dilimleri — v3: düzgün doldur
    for time_label, cats in TIME_KEYWORDS.items():
        if time_label in text_lower:
            result["time_slots"][time_label] = cats
            if time_label not in result["keywords"]:
                result["keywords"].append(time_label)

    # Kategoriler — v3: uzun keyword'ler önce eşleşsin
    found_categories = []
    for keyword, category in sorted(ACTIVITY_KEYWORDS.items(), key=lambda x: -len(x[0])):
        if keyword in text_lower:
            if category not in found_categories:
                found_categories.append(category)
            if keyword not in result["keywords"]:
                result["keywords"].append(keyword)
    result["categories"] = found_categories

    # Sayı
    numbers = re.findall(r'\d+', text)
    if numbers:
        result["count"] = int(numbers[0])

    # Lokasyonlar
    found_locations = []
    for keyword, location in LOCATION_KEYWORDS.items():
        if keyword in text_lower:
            found_locations.append({
                "keyword": keyword,
                "name": location["name"],
                "category": location["category"],
            })
    result["locations"] = found_locations

    # Bütçe, süre, grup
    result["budget"] = extract_budget(text)
    result["duration_days"] = extract_duration(text)

    group_type, explicit = extract_group_type(text)
    result["group_type"] = group_type
    result["group_type_explicit"] = explicit

    result["age_groups"] = extract_age_groups(text)
    result["sentiment_vector"] = build_sentiment_vector(text)

    result["is_family_trip"] = (
        result["group_type"] == "family" or bool(result["age_groups"])
    )
    result["age_suitability_active"] = bool(result["age_groups"])

    if result["is_family_trip"] and "family" not in result["categories"]:
        result["categories"].insert(0, "family")

    return result


# ──────────────────────────────────────────
# CATEGORY FONKSİYONLARI
# ──────────────────────────────────────────

def get_activities_by_category(category: str) -> list:
    return [a for a in ACTIVITIES if a["category"] == category]


def recommend_from_parse(parsed: dict, top_n_per_category: int = 4) -> dict:
    """
    Kullanıcının talep ettiği kategorilere göre en iyi 4-5 aktiviteyi içeren esnek havuz sunar.
    Geliştirme: Aktiviteleri sadece popülerliğe göre değil, kullanıcının bütçesine 
    uygunluğuna göre (bütçe dostu ve popüler olanlar en üste gelecek şekilde) sıralar.
    """
    recommendations = {}
    ages = parsed.get("age_groups", [])
    requested_categories = parsed.get("categories", [])
    
    # Parser girdisinden veya normalizasyondan ham bütçeyi alıyoruz (varsayılan 1000 TL)
    user_budget = parsed.get("budget") if parsed.get("budget") is not None else 1000
    duration_days = parsed.get("duration_days") if parsed.get("duration_days") is not None else 1

    # Günlük harcanabilir makul bütçe sınırı (Toplam bütçenin gün başına düşen payı)
    daily_budget_limit = user_budget / max(duration_days, 1)

    if not requested_categories:
        requested_categories = [cat for cat, score in parsed["sentiment_vector"].items() if score > 0]

    group_type = parsed.get("group_type") or "solo"
    preferred_cats = GROUP_CATEGORY_MAP.get(group_type, [])

    for cat in requested_categories:
        sentiment = parsed["sentiment_vector"].get(cat, 0.0)
        if sentiment < 0: continue

        cat_results = get_activities_by_category(cat)

        # 1. Yaş Filtresi ve Alternatif Üretimi
        if ages:
            age_filter_result = filter_by_age(cat_results, ages)
            cat_results = age_filter_result["suitable"]
            for item in age_filter_result["alternatives_needed"]:
                alts = suggest_family_alternatives(item["activity"])
                cat_results.extend([a for a in alts if a not in cat_results])

        # 2. AKILLI SIRALAMA FORMÜLÜ (Bütçe Uyumu + Popülerlik)
        def pool_sorting_score(activity):
            price = activity.get("price", 0)
            popularity = activity.get("popularity", 0) # 0-10 arası
            
            # Aktivite fiyatının günlük limit içindeki yeri (Fiyat ne kadar düşükse skor o kadar yüksek)
            if price == 0:
                price_score = 1.0  # Ücretsiz yerler mükemmel bütçe uyumu sağlar
            elif daily_budget_limit > 0:
                # Fiyat günlük bütçeyi aştıkça bütçe skoru düşer (negatife kayabilir)
                price_score = 1.0 - (price / daily_budget_limit)
            else:
                price_score = 0.5

            # Grup tipi eşleşmesi bonusu (Kullanıcının stiline doğrudan uyuyorsa)
            group_bonus = 1.0 if activity.get("category") in preferred_cats else 0.0

            # Matematiksel Model: %50 Bütçe Uygunluğu, %35 Popülerlik, %15 Grup Bonusu
            return (price_score * 0.5) + ((popularity / 10.0) * 0.35) + (group_bonus * 0.15)

        # Aktiviteleri hesaplanan bütçe-popülerlik skoruna göre büyükten küçüğe sıralıyoruz
        cat_results = sorted(cat_results, key=pool_sorting_score, reverse=True)

        # 3. Mükerrer (Duplicate) Kayıt Kontrolü
        seen = []
        unique_cat_results = []
        for a in cat_results:
            if a.get("id") not in seen:
                seen.append(a.get("id"))
                unique_cat_results.append(a)

        if unique_cat_results:
            recommendations[cat] = unique_cat_results[:top_n_per_category]

    return recommendations