# -*- coding: utf-8 -*-
"""
Wikipedia REST API kullanarak mekan gorselleri ceker.
API key gerektirmez.
"""
import json
import requests
import time

JSON_FILE = 'data/antalya_activities.json'

# Wikipedia'da aranacak isimler (mekan adi -> Wikipedia makale basligi)
WIKI_SEARCH = {
    "Kaleiçi (Eski Şehir)":        "Kaleiçi",
    "Hadrian Kapısı":              "Hadrian's Gate",
    "Yivli Minare":                "Yivli Minare",
    "Saat Kulesi":                 "Antalya Clock Tower",
    "Hıdırlık Kulesi":             "Hıdırlık Tower",
    "Perge Antik Kenti":           "Perge",
    "Aspendos Tiyatrosu":          "Aspendos",
    "Termessos Antik Kenti":       "Termessos",
    "Phaselis Antik Kenti":        "Phaselis",
    "Olympos Antik Kenti":         "Olympos, Lycia",
    "Antalya Müzesi":              "Antalya Museum",
    "Kaleiçi Müzesi":              "Antalya",
    "Suna & İnan Kıraç Müzesi":   "Antalya",
    "Antalya Akvaryumu":           "Antalya Aquarium",
    "Land of Legends":             "Land of Legends",
    "Antalya Hayvanat Bahçesi":    "Antalya",
    "Konyaaltı Plajı":             "Konyaaltı",
    "Lara Plajı":                  "Lara, Antalya",
    "Mermerli Plajı":              "Antalya",
    "Kaputaş Plajı":               "Kaputaş Beach",
    "Çıralı Plajı":                "Çıralı",
    "Düden Şelalesi (Alt)":        "Düden Waterfalls",
    "Düden Şelalesi (Üst)":        "Düden Waterfalls",
    "Kurşunlu Şelalesi":           "Kurşunlu Waterfall",
    "Manavgat Şelalesi":           "Manavgat Waterfall",
    "Köprülü Kanyon Milli Parkı":  "Köprülü Canyon National Park",
    "Dim Mağarası":                "Dim Cave",
    "Karain Mağarası":             "Karain Cave",
    "Altınbeşik Mağarası":         "Altınbeşik Cave",
    "Kesik Minare Camii":          "Kesik Minare",
    "Murat Paşa Camii":            "Murat Paşa Mosque",
    "Karatay Medresesi":           "Antalya",
}

# Manuel atamalar - Wikipedia'da bulunamayan mekanlar icin Unsplash
MANUAL_IMAGES = {
    "Saat Kulesi":                 "https://images.unsplash.com/photo-1548013146-72479768bada?w=600&q=80",
    "Antalya Akvaryumu":           "https://images.unsplash.com/photo-1575783970733-1aaedde1db74?w=600&q=80",
    "Land of Legends":             "https://images.unsplash.com/photo-1567016432779-094069958ea5?w=600&q=80",
    "Antalya Hayvanat Bahçesi":    "https://images.unsplash.com/photo-1474511320723-9a56873867b5?w=600&q=80",
    "Mermerli Plajı":              "https://images.unsplash.com/photo-1455729552865-3658a5d39692?w=600&q=80",
    "Çıralı Plajı":                "https://images.unsplash.com/photo-1548438294-1ad5d5f4f063?w=600&q=80",
    "Club Arma Beach":             "https://images.unsplash.com/photo-1540202404-a2f29016b523?w=600&q=80",
    "Konyaaltı Beach Park":        "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&q=80",
    "Lara Beach Club":             "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=600&q=80",
    "Konyaaltı Sahil Parkı":       "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&q=80",
    "Atatürk Parkı":               "https://images.unsplash.com/photo-1453728013993-6d66e9c9123a?w=600&q=80",
    "Düden Parkı":                 "https://images.unsplash.com/photo-1418065460487-3e41a6c84dc5?w=600&q=80",
    "Kaleiçi Bazaar":              "https://images.unsplash.com/photo-1555664424-778a1e5e1b48?w=600&q=80",
    "Antalya Bit Pazarı":          "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=600&q=80",
    "Doğu Garaj Pazarı":           "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=600&q=80",
    "MarkAntalya AVM":             "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=600&q=80",
    "TerraCity AVM":               "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=600&q=80",
    "Deepo AVM":                   "https://images.unsplash.com/photo-1509803874385-db7c23652552?w=600&q=80",
    "Kaleiçi Dükkanları":          "https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?w=600&q=80",
    "Migros Antalya":              "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&q=80",
    "Antalya Resim ve Heykel Müzesi": "https://images.unsplash.com/photo-1551038247-3d9af20df552?w=600&q=80",
    "Kaleiçi Sanat Galerileri":    "https://images.unsplash.com/photo-1536924430914-91f9e2041b83?w=600&q=80",
    "7 Mehmet Restaurant":         "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80",
    "Seraser Fine Dining":         "https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=600&q=80",
    "Vanilla Restaurant":          "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80",
    "Parlak Restaurant":           "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&q=80",
    "Yeşil Ev Kahvaltı":           "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=600&q=80",
    "Club Arma":                   "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=600&q=80",
    "Dubliner Irish Pub":          "https://images.unsplash.com/photo-1436076863939-06870fe779c2?w=600&q=80",
    "Konyaaltı Bar Sokağı":        "https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=600&q=80",
    "Rafting (Köprülü Kanyon)":    "https://images.unsplash.com/photo-1530521954074-e64f6810b32d?w=600&q=80",
    "Tekne Turu (Kaleiçi Marina)": "https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=600&q=80",
    "Tünektepe Teleferik":         "https://images.unsplash.com/photo-1534180477871-5d6cc81f3920?w=600&q=80",
    "Zipline (Tünektepe)":         "https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=600&q=80",
    "Jeep Safari":                 "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&q=80",
    "İskele Camii":                "https://images.unsplash.com/photo-1545167622-3a6ac756afa4?w=600&q=80",
    "Karatay Medresesi":           "https://images.unsplash.com/photo-1548013146-72479768bada?w=600&q=80",
    "Kalekapı Hamamı":             "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80",
    "Sefa Hamamı":                 "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&q=80",
    "Antalya Spa & Wellness":      "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&q=80",
    "Kaleiçi Müzesi":              "https://images.unsplash.com/photo-1564399579883-451a5d44ec08?w=600&q=80",
    "Suna & Inan Kirac Muzesi":    "https://images.unsplash.com/photo-1580136579312-94651dfd596d?w=600&q=80",
}

def get_wiki_image(title):
    """Wikipedia REST API'den makale kapak gorseli ceker."""
    try:
        url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{requests.utils.quote(title)}"
        r = requests.get(url, timeout=5, headers={"User-Agent": "TravelMind/1.0"})
        if r.status_code == 200:
            data = r.json()
            img = data.get("originalimage") or data.get("thumbnail")
            if img:
                return img["source"]
    except Exception as e:
        print(f"  Wiki hata ({title}): {e}")
    return None

with open(JSON_FILE, "r", encoding="utf-8") as f:
    activities = json.load(f)

ok, fail = 0, 0

for activity in activities:
    name = activity["name"]

    # 1. Manuel atama varsa kullan
    if name in MANUAL_IMAGES:
        activity["image_url"] = MANUAL_IMAGES[name]
        print(f"[MANUEL] {name}")
        ok += 1
        continue

    # 2. Wikipedia'da ara
    wiki_title = WIKI_SEARCH.get(name)
    if wiki_title:
        img = get_wiki_image(wiki_title)
        if img:
            activity["image_url"] = img
            print(f"[WIKI  ] {name}")
            ok += 1
            time.sleep(0.2)
            continue

    # 3. Mevcut gorsel varsa koru
    if activity.get("image_url"):
        print(f"[MEVCUT] {name}")
        ok += 1
    else:
        print(f"[YOK   ] {name}")
        fail += 1

with open(JSON_FILE, "w", encoding="utf-8") as f:
    json.dump(activities, f, ensure_ascii=False, indent=2)

print(f"\nTamamlandi: {ok} gorsel / {fail} eksik")
