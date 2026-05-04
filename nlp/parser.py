import json
import re
import os

# Veri setini yükle
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BASE_DIR, "data", "antalya_activities.json")

with open(DATA_PATH, "r", encoding="utf-8") as f:
    ACTIVITIES = json.load(f)


# Antalya lokasyon listesi
LOCATION_KEYWORDS = {
    "kaleiçi":          {"name": "Kaleiçi", "category": "historical"},
    "hadrian":          {"name": "Hadrian Kapısı", "category": "historical"},
    "antalya müzesi":   {"name": "Antalya Müzesi", "category": "historical"},
    "düden":            {"name": "Düden Şelalesi", "category": "nature"},
    "konyaaltı":        {"name": "Konyaaltı Plajı", "category": "nature"},
    "lara":             {"name": "Lara Plajı", "category": "nature"},
    "seraser":          {"name": "Seraser Fine Dining", "category": "restaurant"},
    "7 mehmet":         {"name": "7 Mehmet Restaurant", "category": "restaurant"},
    "club arma":        {"name": "Club Arma", "category": "nightlife"},
    "dubliner":         {"name": "Dubliner Irish Pub", "category": "nightlife"},
    "markantalya":      {"name": "MarkAntalya AVM", "category": "shopping"},
    "terrapark":        {"name": "TerraCity AVM", "category": "shopping"}
}

# Zaman dilimi eşleştirmesi
TIME_KEYWORDS = {
    "sabah":  ["historical", "nature", "museum"],
    "öğlen":  ["restaurant", "cafe", "shopping"],
    "akşam":  ["restaurant", "fine_dining"],
    "gece":   ["nightlife", "bar", "club"]
}

# Aktivite anahtar kelimeleri
ACTIVITY_KEYWORDS = {
    "tarihi":    "historical",
    "müze":      "historical",
    "antik":     "historical",
    "kaleiçi":   "historical",
    "yemek":     "restaurant",
    "restoran":  "restaurant",
    "balık":     "restaurant",
    "kulüp":     "nightlife",
    "gece":      "nightlife",
    "eğlence":   "nightlife",
    "bar":       "nightlife",
    "doğa":      "nature",
    "park":      "nature",
    "şelale":    "nature",
    "plaj":      "nature",
    "deniz":     "nature",
    "alışveriş": "shopping",
    "avm":       "shopping"
}

def parse_user_input(text: str) -> dict:
    text_lower = text.lower()

    result = {
        "raw_input": text,
        "time_slots": {},
        "categories": [],
        "count": 1,
        "keywords": []
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

    # Sayı tespiti
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
                "category": location["category"]
            })
    
    result["locations"] = found_locations

    
    return result


def get_activities_by_category(category: str) -> list:
    return [a for a in ACTIVITIES if a["category"] == category]


def recommend_from_parse(parsed: dict) -> dict:
    recommendations = {}

    for time_slot, cats in parsed["time_slots"].items():
        slot_results = []
        for cat in cats:
            activities = get_activities_by_category(cat)
            slot_results.extend(activities)
        
        # Popülerliğe göre sırala
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