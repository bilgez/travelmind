"""
Seed script - veritabanına aktivite verileri ekleme
Terminal'de: python seed_activities.py
"""

from database import SessionLocal
from models.activity import Activity

# Antalya'daki örnek aktiviteler
activities_data = [
    # Tarihi Yerler
    {"name": "Kaleiçi Eski Şehir", "category": "tarihi_yer", "price": 50, "rating": 4.8, "latitude": 36.8915, "longitude": 30.7082},
    {"name": "Aspendos Antik Tiyatrosu", "category": "tarihi_yer", "price": 75, "rating": 4.9, "latitude": 36.9442, "longitude": 31.1619},
    {"name": "Antalya Müzesi", "category": "tarihi_yer", "price": 60, "rating": 4.6, "latitude": 36.8758, "longitude": 30.7254},
    {"name": "Konyaaltı Plajı", "category": "tarihi_yer", "price": 0, "rating": 4.5, "latitude": 36.8878, "longitude": 30.6424},
    {"name": "Düden Şelalesi", "category": "tarihi_yer", "price": 30, "rating": 4.7, "latitude": 36.8245, "longitude": 30.8923},
    
    # Restoranlar
    {"name": "Arif Baba Pide Salonu", "category": "restoran", "price": 40, "rating": 4.4, "latitude": 36.8912, "longitude": 30.7100},
    {"name": "Cıvata Antalya", "category": "restoran", "price": 120, "rating": 4.7, "latitude": 36.8900, "longitude": 30.7090},
    {"name": "Selene Restaurant", "category": "restoran", "price": 150, "rating": 4.8, "latitude": 36.8905, "longitude": 30.7075},
    {"name": "Seraser Fine Dining", "category": "restoran", "price": 180, "rating": 4.9, "latitude": 36.8920, "longitude": 30.7120},
    {"name": "Pati Cafe", "category": "restoran", "price": 50, "rating": 4.3, "latitude": 36.8910, "longitude": 30.7095},
    
    # Kulüpler
    {"name": "Museum Nightclub", "category": "kulup", "price": 80, "rating": 4.5, "latitude": 36.8850, "longitude": 30.7000},
    {"name": "Inferno Club", "category": "kulup", "price": 100, "rating": 4.3, "latitude": 36.8870, "longitude": 30.6950},
    {"name": "Aura Nightclub", "category": "kulup", "price": 120, "rating": 4.6, "latitude": 36.8890, "longitude": 30.6920},
    {"name": "Groove Club", "category": "kulup", "price": 90, "rating": 4.4, "latitude": 36.8900, "longitude": 30.6980},
]

def seed_activities():
    db = SessionLocal()
    try:
        # Önce kontrol et — zaten var mı?
        existing = db.query(Activity).count()
        if existing > 0:
            print(f"✓ {existing} aktivite zaten var, ekleme işlemi atlanıyor.")
            return
        
        # Yeni aktiviteleri ekle
        for data in activities_data:
            activity = Activity(**data, city="Antalya")
            db.add(activity)
        
        db.commit()
        print(f"✓ {len(activities_data)} aktivite eklendi!")
        
    except Exception as e:
        print(f"✗ Hata: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_activities()
