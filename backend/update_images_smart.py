# -*- coding: utf-8 -*-
import json
import requests
import os
from dotenv import load_dotenv
import time

load_dotenv()
PEXELS_API_KEY = os.getenv('PEXELS_API_KEY')

with open('data/antalya_activities.json', 'r', encoding='utf-8') as f:
    activities = json.load(f)

def get_pexels_image(search_query, category=None):
    """Pexels'den gorsel cek - daha iyi arama stratejisi"""
    headers = {'Authorization': PEXELS_API_KEY}
    
    # Ilk olarak mekan adi + Antalya ile ara
    search_terms = [
        search_query + " Antalya",  # Mekan + sehir
        search_query,  # Mekan adi
    ]
    
    # Kategori fallback
    category_search = {
        'restoran': 'Turkish food restaurant Antalya',
        'plaj': 'beach sea Antalya',
        'doga': 'nature waterfall mountain',
        'gece_hayati': 'nightclub bar entertainment',
        'tarihi_yer': 'historical ancient ruins Antalya'
    }
    
    if category and category in category_search:
        search_terms.append(category_search[category])
    
    for term in search_terms:
        try:
            response = requests.get(
                'https://api.pexels.com/v1/search',
                headers=headers,
                params={'query': term, 'per_page': 5, 'page': 1}
            )
            
            if response.status_code == 200:
                data = response.json()
                if data['photos']:
                    # En iyi foto (highest rated/popular)
                    photo = data['photos'][0]
                    return photo['src']['large']
        except:
            pass
        
        time.sleep(0.3)  # Rate limiting
    
    return None

# Tum mekanları kontrol et
problematic = []
updated_count = 0

for i, activity in enumerate(activities):
    name = activity['name']
    category = activity['category']
    
    # Daha iyi gorsel cek
    new_image = get_pexels_image(name, category)
    
    if new_image:
        activity['image_url'] = new_image
        updated_count += 1
        print(f"OK: {name}")
    else:
        print(f"FAIL: {name}")
        problematic.append(name)
    
    if (i + 1) % 10 == 0:
        print(f"  ({i+1}/85 completed)")

# Kaydet
with open('data/antalya_activities.json', 'w', encoding='utf-8') as f:
    json.dump(activities, f, ensure_ascii=False, indent=2)

print(f"\nOK: {updated_count}/85 mekan guncellendi!")
if problematic:
    print(f"\nProblematic mekanlar ({len(problematic)}):")
    for p in problematic:
        print(f"  - {p}")
