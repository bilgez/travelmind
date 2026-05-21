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


# Mevcut satırı bul:
# def get_recommendations(normalized_prefs: dict, top_n: int = 5) -> list:

# Şununla değiştir:
def get_recommendations(normalized_prefs: dict, top_n: int = 5, mode: str = "balanced") -> list:
    """
    mode parametresi eklendi: 'budget' (ucuz), 'speed' (hızlı) veya 'balanced'.
    """
    interest_vector = normalized_prefs["interest_vector"]
    budget_score = normalized_prefs["budget"]["score"]
    
    # MODA GÖRE AĞIRLIK BELİRLEME
    if mode == "budget":
        w_budget, w_popularity = 0.8, 0.2  # Bütçe öncelikli
    elif mode == "speed":
        w_budget, w_popularity = 0.2, 0.8  # Hız ve popülerlik öncelikli
    else:
        w_budget, w_popularity = 0.5, 0.5  # Dengeli[cite: 1]

    user_vec = user_to_vector(interest_vector, budget_score)
    
    scored_activities = []
    for activity in ACTIVITIES:
        activity_vec = activity_to_vector(activity)
        # Temel cosine similarity skoru[cite: 1]
        base_score = content_based_score(user_vec, activity_vec)
        
        # Ağırlıklı final skoru hesapla[cite: 1]
        # Bütçe uyumu ve popülerliği seçilen moda göre harmanlıyoruz[cite: 1]
        final_score = (base_score * 0.4) + (activity_vec[-1] * w_popularity) + (activity_vec[-2] * w_budget)
        
        scored_activities.append({
            "id": activity["id"],
            "name": activity["name"],
            "category": activity["category"],
            "match_score": round(final_score, 4)
        })
    # ... (sıralama kısmı aynı kalır)
    
    # Skora göre sırala
    scored_activities = sorted(
        scored_activities,
        key=lambda x: x["match_score"],
        reverse=True
    )
    
    return scored_activities[:top_n]


# Mevcut fonksiyonu tamamen bununla değiştir:
def hybrid_recommend(parsed_input: dict, normalized_prefs: dict) -> dict:
    """
    Kullanıcıya hem 'En Ekonomik' hem de 'En Hızlı/Popüler' seçenekleri sunar[cite: 1].
    """
    # 1. Seçenek: Ekonomik Rota Paketi[cite: 1]
    budget_options = get_recommendations(normalized_prefs, top_n=10, mode="budget")
    
    # 2. Seçenek: Hızlı/Popüler Rota Paketi[cite: 1]
    speed_options = get_recommendations(normalized_prefs, top_n=10, mode="speed")
    
    time_slots = parsed_input.get("time_slots", {})
    
    result = {
        "budget_friendly_package": budget_options[:5],
        "premium_speed_package": speed_options[:5],
        "by_time_slot": {}
    }
    
    # Zaman dilimlerine göre ayırırken dengeli modu kullanabiliriz[cite: 1]
    balanced_recs = get_recommendations(normalized_prefs, top_n=15, mode="balanced")
    
    for time_slot, categories in time_slots.items():
        slot_recs = [
            r for r in balanced_recs
            if r["category"] in categories
        ]
        result["by_time_slot"][time_slot] = slot_recs[:3]
    
    return result