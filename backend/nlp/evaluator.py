import json
import os
from .recommender import get_recommendations

# Simüle edilmiş kullanıcı verileri (gerçek veri olmadığı için mock)
MOCK_USER_DATA = [
    {
        "user_id": 1,
        "preferences": {
            "budget": {"raw": 500, "level": "low", "score": 0.2},
            "interest_vector": {
                "historical": 1, "nature": 1, "restaurant": 0,
                "nightlife": 0, "shopping": 0, "museum": 1, "beach": 0
            },
            "duration": {"days": 2, "score": 0.28},
            "travel_style": "cultural"
        },
        "actual_choices": [1, 2, 3]  # Gerçekte seçtiği aktivite ID'leri
    },
    {
        "user_id": 2,
        "preferences": {
            "budget": {"raw": 2000, "level": "high", "score": 1.0},
            "interest_vector": {
                "historical": 0, "nature": 0, "restaurant": 1,
                "nightlife": 1, "shopping": 1, "museum": 0, "beach": 1
            },
            "duration": {"days": 5, "score": 0.71},
            "travel_style": "entertainment"
        },
        "actual_choices": [4, 6, 9, 10]
    },
    {
        "user_id": 3,
        "preferences": {
            "budget": {"raw": 1000, "level": "medium", "score": 0.5},
            "interest_vector": {
                "historical": 1, "nature": 1, "restaurant": 1,
                "nightlife": 0, "shopping": 0, "museum": 0, "beach": 1
            },
            "duration": {"days": 3, "score": 0.43},
            "travel_style": "balanced"
        },
        "actual_choices": [1, 8, 9, 5]
    },
    {
        "user_id": 4,
        "preferences": {
            "budget": {"raw": 300, "level": "low", "score": 0.2},
            "interest_vector": {
                "historical": 1, "nature": 0, "restaurant": 0,
                "nightlife": 1, "shopping": 0, "museum": 1, "beach": 0
            },
            "duration": {"days": 1, "score": 0.14},
            "travel_style": "cultural"
        },
        "actual_choices": [2, 3, 7]
    },
    {
        "user_id": 5,
        "preferences": {
            "budget": {"raw": 3000, "level": "high", "score": 1.0},
            "interest_vector": {
                "historical": 0, "nature": 1, "restaurant": 1,
                "nightlife": 1, "shopping": 1, "museum": 0, "beach": 1
            },
            "duration": {"days": 7, "score": 1.0},
            "travel_style": "luxury"
        },
        "actual_choices": [4, 5, 6, 9, 10]
    }
]


def calculate_precision(recommended_ids: list, actual_ids: list) -> float:
    """
    Precision: Önerilen aktivitelerin kaçı gerçekten seçildi?
    Precision = Doğru öneri sayısı / Toplam öneri sayısı
    """
    if not recommended_ids:
        return 0.0
    
    hits = len(set(recommended_ids) & set(actual_ids))
    return round(hits / len(recommended_ids), 4)


def calculate_recall(recommended_ids: list, actual_ids: list) -> float:
    """
    Recall: Gerçek seçimlerin kaçı önerildi?
    Recall = Doğru öneri sayısı / Toplam gerçek seçim sayısı
    """
    if not actual_ids:
        return 0.0
    
    hits = len(set(recommended_ids) & set(actual_ids))
    return round(hits / len(actual_ids), 4)


def calculate_mape(recommended_scores: list, actual_scores: list) -> float:
    """
    MAPE: Öneri skorlarının gerçek tercihlerden
    ortalama yüzde sapmasını ölçer.
    """
    if not recommended_scores or not actual_scores:
        return 0.0
    
    min_len = min(len(recommended_scores), len(actual_scores))
    recommended_scores = recommended_scores[:min_len]
    actual_scores = actual_scores[:min_len]
    
    total_error = 0.0
    for rec, act in zip(recommended_scores, actual_scores):
        if act != 0:
            total_error += abs(rec - act) / act
    
    mape = (total_error / min_len) * 100
    return round(mape, 2)


def evaluate_model(top_n: int = 5) -> dict:
    """
    Tüm mock kullanıcılar üzerinde modeli değerlendirir.
    """
    precision_scores = []
    recall_scores = []
    mape_scores = []
    user_results = []

    for user in MOCK_USER_DATA:
        # Model önerilerini al
        recommendations = get_recommendations(user["preferences"], top_n=top_n)
        recommended_ids = [r["id"] for r in recommendations]
        recommended_scores = [r["match_score"] for r in recommendations]
        
        # Gerçek seçimler
        actual_ids = user["actual_choices"]
        actual_scores = [1.0] * len(actual_ids)  # Gerçek seçimler = 1.0 skor
        
        # Metrikleri hesapla
        precision = calculate_precision(recommended_ids, actual_ids)
        recall = calculate_recall(recommended_ids, actual_ids)
        mape = calculate_mape(recommended_scores, actual_scores)
        
        precision_scores.append(precision)
        recall_scores.append(recall)
        mape_scores.append(mape)
        
        user_results.append({
            "user_id": user["user_id"],
            "recommended": recommended_ids,
            "actual": actual_ids,
            "precision": precision,
            "recall": recall,
            "mape": mape
        })

    # Ortalama metrikler
    avg_precision = round(sum(precision_scores) / len(precision_scores), 4)
    avg_recall = round(sum(recall_scores) / len(recall_scores), 4)
    avg_mape = round(sum(mape_scores) / len(mape_scores), 2)

    return {
        "user_results": user_results,
        "summary": {
            "avg_precision": avg_precision,
            "avg_recall": avg_recall,
            "avg_mape_percent": avg_mape,
            "total_users_tested": len(MOCK_USER_DATA),
            "top_n": top_n
        }
    }