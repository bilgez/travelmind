# -*- coding: utf-8 -*-
"""Alisveris kategorisi - dogrulanmis Wikimedia gorselleri."""
import json

JSON_FILE = 'data/antalya_activities.json'

IMAGES = {
    "Kaleiçi Bazaar":
        "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Varuna_Gezgin_Cafe%2C_Kalei%C3%A7i_Old_Town%2C_Antalya%2C_Turkey_Feb_2022.jpg/960px-Varuna_Gezgin_Cafe%2C_Kalei%C3%A7i_Old_Town%2C_Antalya%2C_Turkey_Feb_2022.jpg",
    "Antalya Bit Pazarı":
        "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Pazar_or_traditional_open_air_market.jpg/960px-Pazar_or_traditional_open_air_market.jpg",
    "Doğu Garaj Pazarı":
        "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ee/Pazar_%28open_air_food_market%29_stall_in_Ankara.jpg/960px-Pazar_%28open_air_food_market%29_stall_in_Ankara.jpg",
    "MarkAntalya AVM":
        "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Antala_MarkAntalya_Mall_Interior_general_view_in_2013_34.jpg/960px-Antala_MarkAntalya_Mall_Interior_general_view_in_2013_34.jpg",
    "TerraCity AVM":
        "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Antalya%2C_Turkey_2022_-_TerraCity.jpg/960px-Antalya%2C_Turkey_2022_-_TerraCity.jpg",
    "Deepo AVM":
        "https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Antala_MarkAntalya_Mall_Interior_playground_in_2013_29.jpg/960px-Antala_MarkAntalya_Mall_Interior_playground_in_2013_29.jpg",
    "Kaleiçi Dükkanları":
        "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Kalei%C3%A7i_Old_Town%2C_Antalya%2C_Turkey_2022_-_Mekan_M%C3%BCdavim.jpg/960px-Kalei%C3%A7i_Old_Town%2C_Antalya%2C_Turkey_2022_-_Mekan_M%C3%BCdavim.jpg",
    "Migros Antalya":
        "https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/Migros_t%C3%BCrk.jpg/960px-Migros_t%C3%BCrk.jpg",
}

with open(JSON_FILE, "r", encoding="utf-8") as f:
    activities = json.load(f)

updated = 0
for a in activities:
    if a["name"] in IMAGES:
        a["image_url"] = IMAGES[a["name"]]
        print(f"[FIX] {a['name']}")
        updated += 1

print(f"\n{updated} / {len(IMAGES)} guncellendi.")

with open(JSON_FILE, "w", encoding="utf-8") as f:
    json.dump(activities, f, ensure_ascii=False, indent=2)
print("JSON kaydedildi.")
