import json
import os
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

# Veri setini yükle
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BASE_DIR, "data", "antalya_activities.json")

with open(DATA_PATH, "r", encoding="utf-8") as f:
    ACTIVITIES = json.load(f)

# Tüm kategoriler (vektör sırası önemli)
ALL_CATEGORIES = [
    "historical", "nature", "restaurant",
    "nightlife", "shopping", "museum", "beach"
]

def activity_to_vector(activity: dict) -> list:
    """
    Bir aktiviteyi sayısal vektöre çevirir.
    Örnek: {"category": "historical"} → [1, 0, 0, 0, 0, 0, 0]
    """
    vector = []
    for cat in ALL_CATEGORIES:
        if activity["category"] == cat:
            vector.append(1)
        else:
            vector.append(0)
    
    # Popülerlik skorunu da ekle (0-1 arası normalize et)
    popularity_score = activity["popularity"] / 10.0
    vector.append(popularity_score)
    
    # Fiyat skorunu ekle (düşük fiyat = yüksek skor)
    max_price = 500
    price_score = 1.0 - min(activity["price"] / max_price, 1.0)
    vector.append(price_score)
    
    return vector


def user_to_vector(interest_vector: dict, budget_score: float) -> list:
    """
    Kullanıcı tercihlerini sayısal vektöre çevirir.
    """
    vector = []
    for cat in ALL_CATEGORIES:
        vector.append(interest_vector.get(cat, 0))
    
    # Popülerlik — her zaman yüksek tercih et
    vector.append(1.0)
    
    # Bütçe skoru
    vector.append(budget_score)
    
    return vector


def content_based_score(user_vector: list, activity_vector: list) -> float:
    """
    Kullanıcı ve aktivite vektörleri arasındaki
    cosine similarity hesaplar. (0-1 arası)
    """
    user_arr = np.array(user_vector).reshape(1, -1)
    activity_arr = np.array(activity_vector).reshape(1, -1)
    
    score = cosine_similarity(user_arr, activity_arr)[0][0]
    return round(float(score), 4)


def get_recommendations(normalized_prefs: dict, top_n: int = 5) -> list:
    """
    Kullanıcı tercihlerine göre aktiviteleri skorlar ve sıralar.
    """
    interest_vector = normalized_prefs["interest_vector"]
    budget_score = normalized_prefs["budget"]["score"]
    
    user_vec = user_to_vector(interest_vector, budget_score)
    
    scored_activities = []
    for activity in ACTIVITIES:
        activity_vec = activity_to_vector(activity)
        score = content_based_score(user_vec, activity_vec)
        
        scored_activities.append({
            "id": activity["id"],
            "name": activity["name"],
            "category": activity["category"],
            "price": activity["price"],
            "duration_min": activity["duration_min"],
            "popularity": activity["popularity"],
            "match_score": score
        })
    
    # Skora göre sırala
    scored_activities = sorted(
        scored_activities,
        key=lambda x: x["match_score"],
        reverse=True
    )
    
    return scored_activities[:top_n]


def hybrid_recommend(parsed_input: dict, normalized_prefs: dict) -> dict:
    """
    NLP parser çıktısı + kullanıcı tercihleri birleştirerek
    hibrit öneri yapar.
    """
    # Content-based öneriler
    cb_recommendations = get_recommendations(normalized_prefs, top_n=10)
    
    # Zaman dilimine göre filtrele
    time_slots = parsed_input.get("time_slots", {})
    
    result = {
        "content_based": cb_recommendations[:5],
        "by_time_slot": {}
    }
    
    for time_slot, categories in time_slots.items():
        slot_recs = [
            r for r in cb_recommendations
            if r["category"] in categories
        ]
        result["by_time_slot"][time_slot] = slot_recs[:3]
    
    return result