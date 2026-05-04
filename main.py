from nlp.parser import parse_user_input, recommend_from_parse
from nlp.normalizer import normalize_user_preferences
import json
from nlp.recommender import hybrid_recommend
from nlp.optimizer import optimize_route


def main():
    print("=" * 50)
    print("TravelMind NLP Motor Testi")
    print("=" * 50)

    # TEST 1 - NLP Parser
    print("\n📝 TEST 1: Kullanıcı girdisi parse ediliyor...")
    user_input = user_input = "Sabah kaleiçi ve hadrian kapısı gezmek istiyorum, akşam seraser'de yemek, gece club arma'ya gitmek istiyorum"
    
    parsed = parse_user_input(user_input)
    print("\nParse Sonucu:")
    print(json.dumps(parsed, ensure_ascii=False, indent=2))

    # TEST 2 - Öneri Motoru
    print("\n🎯 TEST 2: Öneriler getiriliyor...")
    recommendations = recommend_from_parse(parsed)
    print("\nÖneriler:")
    print(json.dumps(recommendations, ensure_ascii=False, indent=2))

    # TEST 3 - Tercih Normalizasyonu
    print("\n⚙️  TEST 3: Kullanıcı tercihleri normalize ediliyor...")
    raw_preferences = {
        "budget": 1500,
        "interests": ["historical", "restaurant", "nightlife"],
        "duration_days": 3,
        "travel_style": "cultural"
    }

    normalized = normalize_user_preferences(raw_preferences)
    print("\nNormalize Edilmiş Tercihler:")
    print(json.dumps(normalized, ensure_ascii=False, indent=2))
    print("\n" + "=" * 50)
    
    # TEST 4 - Hibrit Öneri Motoru
    print("\n🤖 TEST 4: Hibrit öneri motoru çalışıyor...")
    hybrid_results = hybrid_recommend(parsed, normalized)
    print("\nContent-Based Öneriler:")
    print(json.dumps(hybrid_results["content_based"], ensure_ascii=False, indent=2))
    print("\nZaman Dilimine Göre Öneriler:")
    print(json.dumps(hybrid_results["by_time_slot"], ensure_ascii=False, indent=2))

    # TEST 5 - Rota Optimizasyonu
    print("\n🗺️  TEST 5: Rota optimizasyonu çalışıyor...")
    activity_ids = [1, 2, 4, 6]  # Kaleiçi, Hadrian, Seraser, Club Arma
    route_result = optimize_route(activity_ids)
    print("\nOptimize Edilmiş Rota:")
    print(json.dumps(route_result, ensure_ascii=False, indent=2))

    print("✅ Tüm testler tamamlandı!")
    print("=" * 50)

if __name__ == "__main__":
    main()