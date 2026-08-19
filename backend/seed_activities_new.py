import os  # ✅ BUNU EKLE!
import json
from database import SessionLocal, engine
from models.activity import Activity, Base

from sqlalchemy import create_engine

# .env dosyasından verileri oku
from dotenv import load_dotenv
load_dotenv()

# Parçalara ayrılmış bağlantı bilgileri
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")

# Veritabanı URL'sini manuel olarak oluştur (SSL ayarları ile)
DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}?sslmode=require"
os.environ["DATABASE_URL"] = DATABASE_URL

print(f"✅ Bağlantı URL'si oluşturuldu: {DATABASE_URL}")
# Kategori mapping (İngilizce → Türkçe)
CATEGORY_MAP = {
    'historical': 'tarihi_yer',
    'ruins': 'tarihi_yer',
    'museum': 'tarihi_yer',
    'gallery': 'tarihi_yer',
    'religious': 'tarihi_yer',
    'beach': 'plaj',
    'beachclub': 'plaj',
    'waterfall': 'doga',
    'cave': 'doga',
    'park': 'doga',
    'nature': 'doga',
    'activity': 'doga',
    'restaurant': 'restoran',
    'fine_dining': 'restoran',
    'nightlife': 'gece_hayati',
    'mall': 'alisveris',
    'shopping': 'alisveris',
    'market': 'alisveris',
    'themepark': 'eglence',
    'wellness': 'eglence',
}

# Veritabani tablolarini oluştur
Base.metadata.create_all(bind=engine)

# JSON dosyasini oku
with open('data/antalya_activities.json', 'r', encoding='utf-8') as f:
    activities_json = json.load(f)

# Aktiviteleri database'e ekle
db = SessionLocal()

# Eski verileri sil
db.query(Activity).delete()
db.commit()

# Yeni verileri ekle
for activity in activities_json:
    # Kategoriyimap et
    original_category = activity.get('category', 'doga').lower()
    mapped_category = CATEGORY_MAP.get(original_category, 'doga')
    
    new_activity = Activity(
        name=activity.get('name'),
        category=mapped_category,  # Türkçe kategorisi kullan
        description=activity.get('description', ''),
        price=float(activity.get('price', 0)),
        rating=float(activity.get('popularity', 4.5)),
        latitude=float(activity.get('lat', 0)),
        longitude=float(activity.get('lng', 0)),
        image_url=activity.get('image_url', ''),
        city='Antalya'
    )
    db.add(new_activity)

db.commit()
print(f"✓ {len(activities_json)} aktivite Türkçe kategorilerle database'e eklendi!")
db.close()
