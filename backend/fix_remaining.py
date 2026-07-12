# -*- coding: utf-8 -*-
"""Museum, themepark, gallery, wellness kategorileri - Wikimedia gorselleri."""
import json

JSON_FILE = 'data/antalya_activities.json'

IMAGES = {
    # Museum
    "Kaleiçi Müzesi":
        "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/Antalya_Kaleici_museum_5843.jpg/960px-Antalya_Kaleici_museum_5843.jpg",

    # Themepark
    "Antalya Akvaryumu":
        "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Antalya_Aquarium.jpg/960px-Antalya_Aquarium.jpg",
    "Land of Legends":
        "https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/The_land_of_legends%2C_belek%2C_Antalya.jpg/960px-The_land_of_legends%2C_belek%2C_Antalya.jpg",
    "Antalya Hayvanat Bahçesi":
        "https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Pogona_vitticeps_in_the_Antalya_Aquarium.jpg/960px-Pogona_vitticeps_in_the_Antalya_Aquarium.jpg",

    # Gallery
    "Kaleiçi Sanat Galerileri":
        "https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Kalei%C3%A7i_Old_Town%2C_Antalya%2C_Turkey_26_Feb_2022.jpg/960px-Kalei%C3%A7i_Old_Town%2C_Antalya%2C_Turkey_26_Feb_2022.jpg",

    # Wellness / Hamam
    "Kalekapı Hamamı":
        "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Cemberlitas_Hamami.jpg/960px-Cemberlitas_Hamami.jpg",
    "Sefa Hamamı":
        "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Hamam_%286032255970%29.jpg/960px-Hamam_%286032255970%29.jpg",
    "Antalya Spa & Wellness":
        "https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Turkish_bath_%28hamam%29.JPG/960px-Turkish_bath_%28hamam%29.JPG",
}

with open(JSON_FILE, "r", encoding="utf-8") as f:
    activities = json.load(f)

updated = 0
for a in activities:
    if a["name"] in IMAGES:
        a["image_url"] = IMAGES[a["name"]]
        print("[FIX] " + a["name"])
        updated += 1

print("\n" + str(updated) + " / " + str(len(IMAGES)) + " guncellendi.")

with open(JSON_FILE, "w", encoding="utf-8") as f:
    json.dump(activities, f, ensure_ascii=False, indent=2)
print("JSON kaydedildi.")
