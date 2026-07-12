import json
import requests
import os
from dotenv import load_dotenv

# .env dosyasını yükle
load_dotenv()

API_KEY = os.getenv("PEXELS_API_KEY")
JSON_FILE = 'data/antalya_activities.json'

if not API_KEY:
    print("❌ Hata: PEXELS_API_KEY .env dosyasında bulunamadı!")
    exit(1)

def get_pexels_image(query):
    headers = {"Authorization": API_KEY}
    url = f"https://api.pexels.com/v1/search?query={query}&per_page=1"
    try:
        response = requests.get(url, headers=headers)
        data = response.json()
        if 'photos' in data and len(data['photos']) > 0:
            # En iyi kalitede görseli al
            return data['photos'][0]['src']['large']
    except Exception as e:
        print(f"Hata oluştu: {e}")
    return None

# Dosyayı oku
with open(JSON_FILE, 'r', encoding='utf-8') as f:
    activities = json.load(f)

# Görselleri güncelle
for activity in activities:
    # Eğer görsel yoksa veya boşsa çek
    if not activity.get('image_url') or activity['image_url'] == "":
        print(f"Görsel aranıyor: {activity['name']}...")
        img_url = get_pexels_image(activity['name'] + " Antalya")
        if img_url:
            activity['image_url'] = img_url
            print(f"✓ {activity['name']} için görsel bulundu.")
        else:
            print(f"✗ {activity['name']} için görsel bulunamadı.")

# Dosyayı kaydet
with open(JSON_FILE, 'w', encoding='utf-8') as f:
    json.dump(activities, f, indent=4, ensure_ascii=False)

print("\n✓ İşlem tamamlandı! JSON dosyan güncellendi.")