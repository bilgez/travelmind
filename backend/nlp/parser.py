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
    # Tarihi Yerler
    "tarihi":       "historical",
    "tarih":        "historical",
    "kaleiçi":      "historical",
    "kale":         "historical",
    "kule":         "historical",
    "minare":       "historical",

    # Eski Kalıntılar
    "antik":        "ruins",
    "harabe":       "ruins",
    "kalıntı":      "ruins",
    "arkeoloji":    "ruins",
    "tiyatro":      "ruins",
    "roma":         "ruins",

    # Müze
    "müze":         "museum",
    "müzeler":      "museum",
    "sergi":        "museum",

    # Tema Parkları
    "akvaryum":     "themepark",
    "tema park":    "themepark",
    "hayvanat":     "themepark",
    "eğlence park": "themepark",

    # Plajlar
    "plaj":         "beach",
    "plajlar":      "beach",
    "deniz":        "beach",
    "koy":          "beach",
    "sahil":        "beach",

    # Plaj & Havuz Kulüpleri
    "beach club":   "beachclub",
    "havuz":        "beachclub",
    "plaj kulübü":  "beachclub",

    # Şelaleler
    "şelale":       "waterfall",
    "şelaleler":    "waterfall",

    # Parklar
    "park":         "park",
    "milli park":   "park",
    "kanyon":       "park",
    "doğa":         "park",
    "orman":        "park",

    # Mağaralar
    "mağara":       "cave",
    "mağaralar":    "cave",
    "oyuk":         "cave",

    # Bit Pazarı & Sokak Pazarları
    "pazar":        "market",
    "bit pazarı":   "market",
    "çarşı":        "market",
    "bazaar":       "market",
    "sokak pazarı": "market",

    # AVM
    "avm":          "mall",
    "alışveriş merkezi": "mall",

    # Mağazalar
    "alışveriş":    "shopping",
    "dükkan":       "shopping",
    "mağaza":       "shopping",

    # Sanat Galerileri
    "galeri":       "gallery",
    "sanat":        "gallery",
    "sergi":        "gallery",

    # Restoranlar
    "restoran":     "restaurant",
    "restoranlar":  "restaurant",
    "yemek":        "restaurant",
    "balık":        "restaurant",
    "kafe":         "restaurant",
    "kahvaltı":     "restaurant",

    # Gece Hayatı
    "gece":         "nightlife",
    "bar":          "nightlife",
    "kulüp":        "nightlife",
    "eğlence":      "nightlife",

    # Aktiviteler
    "tekne":        "activity",
    "tur":          "activity",
    "rafting":      "activity",
    "zipline":      "activity",
    "safari":       "activity",
    "teleferik":    "activity",

    # Dini Mekanlar
    "cami":         "religious",
    "camiler":      "religious",
    "türbe":        "religious",
    "dini":         "religious",
    "kilise":       "religious",

    # Wellness
    "hamam":        "wellness",
    "spa":          "wellness",
    "masaj":        "wellness",
}

# YENİ: Grup tipi eşleştirmesi
GROUP_KEYWORDS = {
    "ailecek":        "family",
    "aile":           "family",
    "çocuklu":        "family",
    "çocuklar":       "family",
    "çocuklarla":     "family",
    "eşimle":         "couple",
    "sevgilimle":     "couple",
    "çift":           "couple",
    "romantik":       "couple",
    "yalnız":         "solo",
    "solo":           "solo",
    "tek başıma":     "solo",
    "arkadaşlarla":   "friends",
    "arkadaşlarım":   "friends",
    "grup":           "friends",
    "ekip":           "friends",
}

# YENİ: Grup tipine uygun kategoriler
GROUP_CATEGORY_MAP = {
    "family":  ["nature", "museum", "historical", "beach"],
    "couple":  ["restaurant", "fine_dining", "nature", "historical"],
    "solo":    ["historical", "museum", "nature", "shopping"],
    "friends": ["nightlife", "restaurant", "beach", "shopping"],
}

# YENİ: Bütçe yazı → sayı çevirici
BUDGET_WORD_MAP = {
    "bin":    1000,
    "iki bin": 2000,
    "üç bin": 3000,
    "beş yüz": 500,
    "yüz":    100,
    "milyon": 1_000_000,
}

# YENİ: Gün yazı → sayı çevirici
DAY_WORD_MAP = {
    "bir":      1,
    "iki":      2,
    "üç":       3,
    "dört":     4,
    "beş":      5,
    "altı":     6,
    "yedi":     7,
    "hafta sonu": 2,
    "haftalık": 7,
    "bir hafta": 7,
}

# YENİ: Negasyon kelimeleri
NEGATION_WORDS = [
    "istemiyorum", "sevmiyorum", "nefret", "değil",
    "olmaz", "hayır", "no", "yok", "istemem", "gitme",
]

# YENİ: Sentiment kelimeleri
POSITIVE_WORDS = ["seviyorum", "istiyorum", "harika", "güzel", "mükemmel", "çok iyi"]
NEGATIVE_WORDS = ["sevmiyorum", "istemiyorum", "nefret", "berbat", "kötü", "sıkıcı"]


# ──────────────────────────────────────────
# YARDIMCI FONKSİYONLAR
# ──────────────────────────────────────────

def extract_budget(text: str) -> int | None:
    """
    Metinden bütçeyi çeker.
    "500 TL", "1500 lira", "bin lira", "1.5k TL" → int
    """
    text_lower = text.lower()

    # "1.5k", "2k" gibi formatlar
    k_match = re.search(r'(\d+(?:\.\d+)?)\s*k\b', text_lower)
    if k_match:
        return int(float(k_match.group(1)) * 1000)

    # "1500 TL", "500 lira" gibi sayısal değerler
    num_match = re.search(r'(\d[\d.,]*)\s*(tl|lira|₺)', text_lower)
    if num_match:
        raw = num_match.group(1).replace(".", "").replace(",", "")
        return int(raw)

    # Kelime tabanlı: "bin lira", "beş yüz TL"
    for word, value in sorted(BUDGET_WORD_MAP.items(), key=lambda x: -len(x[0])):
        if word in text_lower:
            return value

    return None


def extract_duration(text: str) -> int | None:
    """
    Metinden süreyi (gün) çeker.
    "3 gün", "bir hafta", "hafta sonu" → int
    """
    text_lower = text.lower()

    # "3 gün", "5 günlük"
    num_match = re.search(r'(\d+)\s*gün', text_lower)
    if num_match:
        return int(num_match.group(1))

    # Kelime tabanlı: "üç gün", "bir hafta"
    for word, value in sorted(DAY_WORD_MAP.items(), key=lambda x: -len(x[0])):
        if word in text_lower:
            return value

    return None


def extract_group_type(text: str) -> str:
    """
    Metinden grup tipini çeker.
    "ailecek", "arkadaşlarla", "eşimle" → group_type string
    """
    text_lower = text.lower()
    for keyword, group_type in sorted(GROUP_KEYWORDS.items(), key=lambda x: -len(x[0])):
        if keyword in text_lower:
            return group_type
    return "solo"  # varsayılan


def extract_age_groups(text: str) -> list:
    text_lower = text.lower()
    # "5 ve 8 yaşında" formatı
    multi = re.findall(r'(\d+)\s*ve\s*(\d+)\s*yaş', text_lower)
    if multi:
        return [int(a) for group in multi for a in group]
    # "5 yaşında" tekil format
    single = re.findall(r'(\d+)\s*yaş', text_lower)
    return [int(a) for a in single]


def detect_sentiment(text: str, category: str) -> float:
    sentences = re.split(r'[.,!?]', text.lower())
    category_keys = [k for k, v in ACTIVITY_KEYWORDS.items() if v == category]

    for sentence in sentences:
        sentence = sentence.strip()
        if not sentence:
            continue

        has_category = any(kw in sentence for kw in category_keys)
        if not has_category:
            continue

        has_negation = any(neg in sentence for neg in NEGATION_WORDS)
        has_negative = any(neg in sentence for neg in NEGATIVE_WORDS)
        has_positive = any(pos in sentence for pos in POSITIVE_WORDS)

        if has_negation or has_negative:
            return -1.0
        if has_positive:
            return 1.0

        # Keyword varsa ama net sentiment yok → pozitif say
        return 1.0

    return 0.0


def build_sentiment_vector(text: str) -> dict:
    """
    Tüm kategoriler için sentiment skorlarını hesaplar.
    Örnek: {"historical": 1.0, "nightlife": -1.0, "restaurant": 0.0, ...}
    """
    all_categories = list(set(ACTIVITY_KEYWORDS.values()))
    return {cat: detect_sentiment(text, cat) for cat in all_categories}


# ──────────────────────────────────────────
# ANA FONKSİYON
# ──────────────────────────────────────────

def parse_user_input(text: str) -> dict:
    text_lower = text.lower()

    result = {
        "raw_input": text,
        "time_slots": {},
        "categories": [],
        "count": 1,
        "keywords": [],
        "locations": [],
        # YENİ alanlar
        "budget": None,
        "duration_days": None,
        "group_type": "solo",
        "age_groups": [],
        "sentiment_vector": {},
    }

    # Zaman dilimi tespiti
    for time, cats in TIME_KEYWORDS.items():
        if time in text_lower:
            result["time_slots"][time] = cats

    # Kategori tespiti
    found_categories = []
    for keyword, category in ACTIVITY_KEYWORDS.items():
        if keyword in text_lower:
            if category not in found_categories:
                found_categories.append(category)
            if keyword not in result["keywords"]:
                result["keywords"].append(keyword)
    result["categories"] = found_categories

    # Sayı tespiti (fallback)
    numbers = re.findall(r'\d+', text)
    if numbers:
        result["count"] = int(numbers[0])

    # Lokasyon tespiti
    found_locations = []
    for keyword, location in LOCATION_KEYWORDS.items():
        if keyword in text_lower:
            found_locations.append({
                "keyword": keyword,
                "name": location["name"],
                "category": location["category"],
            })
    result["locations"] = found_locations

    # YENİ: Bütçe tespiti
    result["budget"] = extract_budget(text)

    # YENİ: Süre tespiti
    result["duration_days"] = extract_duration(text)

    # YENİ: Grup tipi tespiti
    result["group_type"] = extract_group_type(text)

    # YENİ: Yaş grubu tespiti
    result["age_groups"] = extract_age_groups(text)

    # YENİ: Sentiment analizi
    result["sentiment_vector"] = build_sentiment_vector(text)

    return result


def get_activities_by_category(category: str) -> list:
    return [a for a in ACTIVITIES if a["category"] == category]


def recommend_from_parse(parsed: dict) -> dict:
    recommendations = {}

    for time_slot, cats in parsed["time_slots"].items():
        slot_results = []
        for cat in cats:
            activities = get_activities_by_category(cat)

            # YENİ: Sentiment negatifse bu kategorideki aktiviteleri atla
            sentiment = parsed["sentiment_vector"].get(cat, 0.0)
            if sentiment < 0:
                continue

            slot_results.extend(activities)

        # YENİ: Grup tipine göre filtrele
        group_type = parsed.get("group_type", "solo")
        preferred_cats = GROUP_CATEGORY_MAP.get(group_type, [])
        if preferred_cats:
            slot_results = sorted(
                slot_results,
                key=lambda x: (x["category"] in preferred_cats, x["popularity"]),
                reverse=True
            )
        else:
            slot_results = sorted(slot_results, key=lambda x: x["popularity"], reverse=True)

        # Tekrar edenleri kaldır
        seen = []
        unique = []
        for a in slot_results:
            if a["id"] not in seen:
                seen.append(a["id"])
                unique.append(a)

        recommendations[time_slot] = unique[:parsed["count"]]

    return recommendations