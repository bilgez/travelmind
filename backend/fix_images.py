# -*- coding: utf-8 -*-
"""
Yanlis gorselleri dogru Wikipedia/Unsplash gorselleriyle gunceller.
"""
import json
import requests
import time

JSON_FILE = 'data/antalya_activities.json'

def get_wiki_image(title):
    try:
        url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{requests.utils.quote(title)}"
        r = requests.get(url, timeout=8, headers={"User-Agent": "TravelMind/1.0"})
        if r.status_code == 200:
            data = r.json()
            img = data.get("originalimage") or data.get("thumbnail")
            if img:
                return img["source"]
    except Exception as e:
        print(f"  Wiki hata ({title}): {e}")
    return None

# Wikipedia'dan cekilecekler (mevcut gorsel yanlis oldugu icin zorunlu guncelleme)
FORCE_WIKI = {
    "Saat Kulesi":        "Antalya Clock Tower",
    "Olympos Antik Kenti": "Olympos, Lycia",
    "Kesik Minare Camii": "Kesik Minare",
    "Murat Pasa Camii":   "Murat Pasa Mosque, Antalya",
    "Murat Paşa Camii":   "Murat Pasa Mosque, Antalya",
}

# Duzeltilmis Unsplash gorselleri (alakasiz olanlar icin)
FIXED_IMAGES = {
    # Tarihi yerler - Turk/islami mimari gorselleri
    "Karatay Medresesi":           "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80",  # tarihi tas bina
    "Iskele Camii":                "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=600&q=80",  # cami
    "İskele Camii":                "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=600&q=80",
    # Muzeler
    "Suna & Inan Kirac Muzesi":    "https://images.unsplash.com/photo-1565060169194-19fabf63012c?w=600&q=80",  # muzeum ic
    "Suna & İnan Kıraç Müzesi":    "https://images.unsplash.com/photo-1565060169194-19fabf63012c?w=600&q=80",
    "Antalya Resim ve Heykel Muzesi": "https://images.unsplash.com/photo-1561839561-b13bcfe95249?w=600&q=80",
    "Antalya Resim ve Heykel Müzesi": "https://images.unsplash.com/photo-1561839561-b13bcfe95249?w=600&q=80",
    "Kaleici Sanat Galerileri":    "https://images.unsplash.com/photo-1578926288207-32356a3eb6d2?w=600&q=80",
    "Kaleiçi Sanat Galerileri":    "https://images.unsplash.com/photo-1578926288207-32356a3eb6d2?w=600&q=80",
}

with open(JSON_FILE, "r", encoding="utf-8") as f:
    activities = json.load(f)

fixed = 0
for activity in activities:
    name = activity["name"]

    # 1. FORCE_WIKI: Wikipedia'dan zorla cek
    wiki_key = FORCE_WIKI.get(name)
    if wiki_key:
        img = get_wiki_image(wiki_key)
        if img:
            activity["image_url"] = img
            print(f"[WIKI-FIX] {name}")
            fixed += 1
            time.sleep(0.3)
            continue
        else:
            print(f"[WIKI-FAIL] {name} -> Wikipedia bulunamadi, Unsplash'e geciyorum")

    # 2. FIXED_IMAGES: Bilinen yanlis Unsplash'leri duzelt
    if name in FIXED_IMAGES:
        activity["image_url"] = FIXED_IMAGES[name]
        print(f"[UNSPLASH-FIX] {name}")
        fixed += 1

print(f"\nDuzeltilen: {fixed} gorsel")

with open(JSON_FILE, "w", encoding="utf-8") as f:
    json.dump(activities, f, ensure_ascii=False, indent=2)

print("JSON kaydedildi.")
