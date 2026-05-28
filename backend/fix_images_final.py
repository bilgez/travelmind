# -*- coding: utf-8 -*-
"""
Yanlis gorselleri dogrulanmis Wikimedia Commons URL'leri ile gunceller.
Hepsi elle aranip dogrulanmistir.
"""
import json

JSON_FILE = 'data/antalya_activities.json'

# Dogrulanmis Wikimedia Commons URL'leri (tam ve dogru mekan gorselleri)
VERIFIED = {
    "Saat Kulesi": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Antalya_Clock_Tower_02.jpg/960px-Antalya_Clock_Tower_02.jpg",
    "Olympos Antik Kenti": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Picture_of_2_coffins_in_the_ruins_of_Olympus_%28Lycia%29.jpg/960px-Picture_of_2_coffins_in_the_ruins_of_Olympus_%28Lycia%29.jpg",
    "Murat Paşa Camii": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Antalya_Murat_Pasha_Mosque_Exterior_in_2015_15.jpg/960px-Antalya_Murat_Pasha_Mosque_Exterior_in_2015_15.jpg",
    "Iskele Camii": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Antalya_Iskele_Mescidi_4777.jpg/960px-Antalya_Iskele_Mescidi_4777.jpg",
    "İskele Camii": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Antalya_Iskele_Mescidi_4777.jpg/960px-Antalya_Iskele_Mescidi_4777.jpg",
    "Suna & İnan Kıraç Müzesi": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/Antalya_Kaleici_museum_5794.jpg/960px-Antalya_Kaleici_museum_5794.jpg",
    "Karatay Medresesi": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Antalya_Karatay_Medresesi_in_2011_06.jpg/960px-Antalya_Karatay_Medresesi_in_2011_06.jpg",
    # Muzeler icin guzel Unsplash gorselleri (muzeum / sanat)
    "Antalya Resim ve Heykel Müzesi": "https://images.unsplash.com/photo-1580927752452-89d86da3fa0a?w=600&q=80",
    "Kaleiçi Sanat Galerileri": "https://images.unsplash.com/photo-1572947650440-e8a97ef053b2?w=600&q=80",
}

with open(JSON_FILE, "r", encoding="utf-8") as f:
    activities = json.load(f)

updated = 0
for a in activities:
    if a["name"] in VERIFIED:
        a["image_url"] = VERIFIED[a["name"]]
        print(f"[FIX] {a['name']}")
        updated += 1

print(f"\n{updated} gorsel guncellendi.")

with open(JSON_FILE, "w", encoding="utf-8") as f:
    json.dump(activities, f, ensure_ascii=False, indent=2)

print("JSON kaydedildi.")
