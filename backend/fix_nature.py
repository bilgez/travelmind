# -*- coding: utf-8 -*-
"""Doga kategorisi - tum 16 mekan icin dogrulanmis Wikimedia gorselleri."""
import json

JSON_FILE = 'data/antalya_activities.json'

NATURE_IMAGES = {
    "Düden Şelalesi (Alt)":
        "https://upload.wikimedia.org/wikipedia/commons/thumb/f/ff/Lower_Duden_Falls.jpg/960px-Lower_Duden_Falls.jpg",
    "Düden Şelalesi (Üst)":
        "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Upper_Duden_Falls.jpg/960px-Upper_Duden_Falls.jpg",
    "Kurşunlu Şelalesi":
        "https://upload.wikimedia.org/wikipedia/commons/thumb/d/da/Kursunlu_Waterfall_Nature_Park%2C_Antalya.jpg/960px-Kursunlu_Waterfall_Nature_Park%2C_Antalya.jpg",
    "Manavgat Şelalesi":
        "https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Manavgat_waterfall_by_tomgensler.JPG/960px-Manavgat_waterfall_by_tomgensler.JPG",
    "Konyaaltı Sahil Parkı":
        "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Konyaalt%C4%B1%2C_Antalya%2C_Turkey_2022_-_04.jpg/960px-Konyaalt%C4%B1%2C_Antalya%2C_Turkey_2022_-_04.jpg",
    "Atatürk Parkı":
        "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Antalya_Atat%C3%BCrk_Park%C4%B1_in_2012_15.jpg/960px-Antalya_Atat%C3%BCrk_Park%C4%B1_in_2012_15.jpg",
    "Düden Parkı":
        "https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Antalya%2C_Turkey_March_2022_-_D%C3%BCden_Park_-_Sea_View_with_Cat.jpg/960px-Antalya%2C_Turkey_March_2022_-_D%C3%BCden_Park_-_Sea_View_with_Cat.jpg",
    "Köprülü Kanyon Milli Parkı":
        "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Koprulu_Canyon_and_a_mini_waterfall%2C_captured_in_this_immensely_beautiful_low_spot_01.jpg/960px-Koprulu_Canyon_and_a_mini_waterfall%2C_captured_in_this_immensely_beautiful_low_spot_01.jpg",
    "Dim Mağarası":
        "https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Turkey%2C_Alanya_-_Dim_cave_02.jpg/960px-Turkey%2C_Alanya_-_Dim_cave_02.jpg",
    "Karain Mağarası":
        "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Karain_cave_antalya_museum_turkey_paleolitik.JPG/960px-Karain_cave_antalya_museum_turkey_paleolitik.JPG",
    "Altınbeşik Mağarası":
        "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Alt%C4%B1nbe%C5%9Fik_Cave_National_Park.jpg/960px-Alt%C4%B1nbe%C5%9Fik_Cave_National_Park.jpg",
    "Rafting (Köprülü Kanyon)":
        "https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Koprulu_Canyon_and_a_mini_waterfall%2C_captured_in_this_immensely_beautiful_low_spot_02.jpg/960px-Koprulu_Canyon_and_a_mini_waterfall%2C_captured_in_this_immensely_beautiful_low_spot_02.jpg",
    "Tekne Turu (Kaleiçi Marina)":
        "https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/ANTALYA_KALE%C4%B0%C3%87%C4%B0_YAT_L%C4%B0MANI_-_panoramio.jpg/960px-ANTALYA_KALE%C4%B0%C3%87%C4%B0_YAT_L%C4%B0MANI_-_panoramio.jpg",
    "Tünektepe Teleferik":
        "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Antalya_as_seen_from_a_cable_car.jpg/960px-Antalya_as_seen_from_a_cable_car.jpg",
    "Zipline (Tünektepe)":
        "https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/T%C3%BCnektepe.jpg/960px-T%C3%BCnektepe.jpg",
    "Jeep Safari":
        "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/K%C3%B6pr%C3%BCl%C3%BC-kanyon.jpg/960px-K%C3%B6pr%C3%BCl%C3%BC-kanyon.jpg",
}

with open(JSON_FILE, "r", encoding="utf-8") as f:
    activities = json.load(f)

updated = 0
for a in activities:
    if a["name"] in NATURE_IMAGES:
        a["image_url"] = NATURE_IMAGES[a["name"]]
        print(f"[FIX] {a['name']}")
        updated += 1

print(f"\n{updated} / {len(NATURE_IMAGES)} guncellendi.")

with open(JSON_FILE, "w", encoding="utf-8") as f:
    json.dump(activities, f, ensure_ascii=False, indent=2)

print("JSON kaydedildi.")
