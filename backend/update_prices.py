# -*- coding: utf-8 -*-
"""Gercekci fiyat guncellemesi - arastirma kaynakli."""
import json

JSON_FILE = 'data/antalya_activities.json'

# Kisi basi TL fiyatlari (2025/2026 piyasa fiyatlari)
PRICES = {
    # --- tarihi_yer: ucretsiz mekanlar ---
    "Kaleiçi (Eski Şehir)":      0,
    "Hadrian Kapısı":             0,
    "Yivli Minare":               0,
    "Saat Kulesi":                0,
    "Hıdırlık Kulesi":            0,
    "Kaleiçi Sanat Galerileri":   0,
    "Kesik Minare Camii":         0,
    "Murat Paşa Camii":           0,
    "İskele Camii":               0,

    # --- KTB orenYeri / muzeler (Muzekart gecerli) ---
    "Perge Antik Kenti":          590,   # 11 EUR
    "Aspendos Tiyatrosu":         800,   # 15 EUR
    "Termessos Antik Kenti":      160,   # 3 EUR (resmi site onaylı)
    "Phaselis Antik Kenti":       530,   # 10 EUR
    "Olympos Antik Kenti":        530,   # 10 EUR
    "Antalya Müzesi":             800,   # 15 EUR
    "Kaleiçi Müzesi":             270,   # ~5 EUR
    "Karain Mağarası":            270,   # 5 EUR
    "Karatay Medresesi":          200,   # KTB, tahmini
    "Altınbeşik Mağarası":        150,   # tekne turu ucreti

    # --- Ozel / belediye muzeler ---
    "Suna & İnan Kıraç Müzesi":   150,
    "Antalya Resim ve Heykel Müzesi": 150,

    # --- Plajlar - ucretsiz ---
    "Konyaaltı Plajı":            0,
    "Lara Plajı":                 0,
    "Kaputaş Plajı":              0,
    "Çıralı Plajı":               0,
    "Mermerli Plajı":             150,   # ozel plaj giris

    # --- Beach Club ---
    "Club Arma Beach":            300,
    "Konyaaltı Beach Park":       150,
    "Lara Beach Club":            200,

    # --- Selaleler / Doga ---
    "Düden Şelalesi (Alt)":       0,
    "Düden Şelalesi (Üst)":       0,
    "Kurşunlu Şelalesi":          45,
    "Manavgat Şelalesi":          0,
    "Konyaaltı Sahil Parkı":      0,
    "Atatürk Parkı":              0,
    "Düden Parkı":                0,
    "Köprülü Kanyon Milli Parkı": 0,

    # --- Magaralar ---
    "Dim Mağarası":               125,
    # Karain zaten yukarida

    # --- Aktiviteler ---
    "Rafting (Köprülü Kanyon)":   850,
    "Tekne Turu (Kaleiçi Marina)": 1000,
    "Tünektepe Teleferik":        700,   # ~$20-30 gidis-donus
    "Zipline (Tünektepe)":        500,
    "Jeep Safari":                1200,

    # --- Alisveris / Market / AVM ---
    "Kaleiçi Bazaar":             0,
    "Antalya Bit Pazarı":         0,
    "Doğu Garaj Pazarı":          0,
    "MarkAntalya AVM":            0,
    "TerraCity AVM":              0,
    "Deepo AVM":                  0,
    "Kaleiçi Dükkanları":         0,
    "Migros Antalya":             0,

    # --- Restoranlar (kisi basi ortalama) ---
    "7 Mehmet Restaurant":        1500,  # 1200-2000+ arasi
    "Seraser Fine Dining":        2000,  # 2000+
    "Vanilla Restaurant":         1000,  # 800-1200 arasi
    "Parlak Restaurant":          500,
    "Yeşil Ev Kahvaltı":          350,

    # --- Gece Hayati ---
    "Club Arma":                  300,
    "Dubliner Irish Pub":         200,
    "Konyaaltı Bar Sokağı":       150,

    # --- Eglence ---
    "Antalya Akvaryumu":          355,   # resmi TL fiyati
    "Land of Legends":            1500,  # ~$37-50
    "Antalya Hayvanat Bahçesi":   50,    # belediye zosu, simbolik

    # --- Wellness / Hamam ---
    "Kalekapı Hamamı":            2000,
    "Sefa Hamamı":                2800,  # resmi site onaylı (Geleneksel Paket)
    "Antalya Spa & Wellness":     1000,
}

with open(JSON_FILE, "r", encoding="utf-8") as f:
    activities = json.load(f)

updated = 0
not_found = []
for a in activities:
    if a["name"] in PRICES:
        a["price"] = PRICES[a["name"]]
        updated += 1
    else:
        not_found.append(a["name"])

print(str(updated) + " / " + str(len(activities)) + " fiyat guncellendi.")
if not_found:
    print("Bulunamayan: " + str(not_found))

with open(JSON_FILE, "w", encoding="utf-8") as f:
    json.dump(activities, f, ensure_ascii=False, indent=2)
print("JSON kaydedildi.")
