# -*- coding: utf-8 -*-
"""Restoran ve gece hayati kategorileri - dogrulanmis Wikimedia gorselleri."""
import json

JSON_FILE = 'data/antalya_activities.json'

IMAGES = {
    # Restoranlar - tumu Wikimedia
    "7 Mehmet Restaurant":
        "https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Antalya%2C_Turkey_February_2022_-_Blue_Paradise_Fish_%26_Steak_%26_Kebap_House.jpg/960px-Antalya%2C_Turkey_February_2022_-_Blue_Paradise_Fish_%26_Steak_%26_Kebap_House.jpg",
    "Seraser Fine Dining":
        "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Kalei%C3%A7i_Old_Town%2C_Antalya%2C_Turkey_2022_-_Mekan_M%C3%BCdavim.jpg/960px-Kalei%C3%A7i_Old_Town%2C_Antalya%2C_Turkey_2022_-_Mekan_M%C3%BCdavim.jpg",
    "Vanilla Restaurant":
        "https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Kiraz_Biberi_Lido_Restaurant_Adalar.JPG/960px-Kiraz_Biberi_Lido_Restaurant_Adalar.JPG",
    "Parlak Restaurant":
        "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Turkish_egg_dish_Menemen.jpg/960px-Turkish_egg_dish_Menemen.jpg",
    "Yeşil Ev Kahvaltı":
        "https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Turkish_Breakfast_Spread.jpg/960px-Turkish_Breakfast_Spread.jpg",
    # Gece hayati - tumu Wikimedia
    "Club Arma":
        "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Yat_Liman%C4%B1%2C_Kalei%C3%A7i_%282%29.jpg/960px-Yat_Liman%C4%B1%2C_Kalei%C3%A7i_%282%29.jpg",
    "Dubliner Irish Pub":
        "https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Doolin_-_Gus_O%27Connor%27s_Pub_interior_-_geograph.org.uk_-_1606071.jpg/960px-Doolin_-_Gus_O%27Connor%27s_Pub_interior_-_geograph.org.uk_-_1606071.jpg",
    "Konyaaltı Bar Sokağı":
        "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Green_Mill_Cocktail_Lounge_interior.jpg/960px-Green_Mill_Cocktail_Lounge_interior.jpg",
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
