import json
import os

# Veri setini yükle
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BASE_DIR, "data", "antalya_activities.json")

with open(DATA_PATH, "r", encoding="utf-8") as f:
    ACTIVITIES = json.load(f)

# Aktivite tipi tanımları
OUTDOOR_CATEGORIES = ["nature", "beach"]
INDOOR_CATEGORIES  = ["historical", "museum", "restaurant", "shopping", "nightlife"]

# Hava durumu senaryoları
WEATHER_SCENARIOS = {
    "sunny":  {"label": "Güneşli",  "outdoor_ok": True},
    "cloudy": {"label": "Bulutlu",  "outdoor_ok": True},
    "rainy":  {"label": "Yağmurlu", "outdoor_ok": False},
    "stormy": {"label": "Fırtınalı","outdoor_ok": False},
    "snowy":  {"label": "Karlı",    "outdoor_ok": False},
}


def is_outdoor(activity: dict) -> bool:
    return activity["category"] in OUTDOOR_CATEGORIES


def get_indoor_alternatives(outdoor_activity: dict) -> list:
    """
    Outdoor bir aktivite için indoor alternatifleri döner.
    Popülerliğe göre sıralı.
    """
    alternatives = [
        a for a in ACTIVITIES
        if a["category"] in INDOOR_CATEGORIES
        and a["id"] != outdoor_activity["id"]
    ]
    
    return sorted(alternatives, key=lambda x: x["popularity"], reverse=True)


def apply_weather_filter(plan: dict, weather_condition: str) -> dict:
    """
    Hava durumuna göre planı filtreler.
    Yağmurlu/fırtınalı havalarda outdoor aktiviteleri
    indoor alternatiflerle değiştirir.
    """
    scenario = WEATHER_SCENARIOS.get(weather_condition, WEATHER_SCENARIOS["sunny"])
    
    result = {
        "weather": {
            "condition": weather_condition,
            "label": scenario["label"],
            "outdoor_ok": scenario["outdoor_ok"]
        },
        "original_plan": plan,
        "adapted_plan": {},
        "changes": []
    }

    # Hava iyiyse plan değişmez
    if scenario["outdoor_ok"]:
        result["adapted_plan"] = plan
        result["changes"] = []
        return result

    # Hava kötüyse outdoor aktiviteleri değiştir
    activity_map = {a["id"]: a for a in ACTIVITIES}
    adapted = {}

    for time_slot, activities in plan.items():
        adapted[time_slot] = []
        
        for activity in activities:
            activity_id = activity.get("id")
            full_activity = activity_map.get(activity_id, activity)
            
            if is_outdoor(full_activity):
                # Indoor alternatif bul
                alternatives = get_indoor_alternatives(full_activity)
                
                if alternatives:
                    new_activity = alternatives[0]
                    adapted[time_slot].append(new_activity)
                    
                    result["changes"].append({
                        "time_slot": time_slot,
                        "removed": full_activity["name"],
                        "added": new_activity["name"],
                        "reason": f"{scenario['label']} hava nedeniyle değiştirildi"
                    })
                else:
                    adapted[time_slot].append(activity)
            else:
                adapted[time_slot].append(activity)

    result["adapted_plan"] = adapted
    return result