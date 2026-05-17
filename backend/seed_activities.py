from database import SessionLocal, engine, Base
from models.activity import Activity

activities_data = [

    # TARIHI YERLER
    {
        "name": "Kaleiçi Eski Sehir",
        "category": "tarihi_yer",
        "description": "Antalya'nin 2000 yillik tarihi surlarla cevrili eski sehir merkezi. Roma, Bizans ve Osmanli mimarisinin ic ice geçtigi efsanevi semt.",
        "price": 0, "rating": 4.8,
        "latitude": 36.8915, "longitude": 30.7082,
        "image_url": "https://images.unsplash.com/photo-1622979135225-d2ba269cf1ac?w=600&q=80"
    },
    {
        "name": "Aspendos Antik Tiyatrosu",
        "category": "tarihi_yer",
        "description": "MS 2. yuzyilda insa edilmis, dunyanin en iyi korunmus Roma tiyatrolarindan biri. Akustigi hala mukemmel.",
        "price": 75, "rating": 4.9,
        "latitude": 36.9442, "longitude": 31.1619,
        "image_url": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80"
    },
    {
        "name": "Antalya Arkeoloji Muzesi",
        "category": "tarihi_yer",
        "description": "Turkiye'nin en zengin muzelerinden biri. Perge ve Side'den gelen heykeller, sarkofajlar ve antik eserler.",
        "price": 60, "rating": 4.6,
        "latitude": 36.8758, "longitude": 30.7254,
        "image_url": "https://images.unsplash.com/photo-1564399579883-451a5d44ec08?w=600&q=80"
    },
    {
        "name": "Hadrian Kapisi",
        "category": "tarihi_yer",
        "description": "MS 130 yilinda Roma Imparatoru Hadrian'in ziyareti serefiне insa edilmis uclu zafer kemeri. Antalya'nin simgesi.",
        "price": 0, "rating": 4.7,
        "latitude": 36.8872, "longitude": 30.7089,
        "image_url": "https://images.unsplash.com/photo-1589352967045-52eb41902b2e?w=600&q=80"
    },
    {
        "name": "Perge Antik Kenti",
        "category": "tarihi_yer",
        "description": "Helenistik ve Roma donemlerine ait muhtesem kalintilari barindiran antik kent. Stadyum, agora ve sutunlu cadde.",
        "price": 75, "rating": 4.6,
        "latitude": 36.9609, "longitude": 30.8547,
        "image_url": "https://images.unsplash.com/photo-1548013146-72479768bada?w=600&q=80"
    },
    {
        "name": "Yivli Minare",
        "category": "tarihi_yer",
        "description": "13. yuzyildan kalma oluklu minare. Antalya'nin simgesi ve en fotogenik yapisi.",
        "price": 0, "rating": 4.5,
        "latitude": 36.8890, "longitude": 30.7070,
        "image_url": "https://images.unsplash.com/photo-1596797882870-8c33f938c5b1?w=600&q=80"
    },

    # PLAJLAR
    {
        "name": "Konyaalti Plaji",
        "category": "plaj",
        "description": "Antalya sehir merkezine yakin 7 km uzunlugunda çakil plaj. Toroslar'in arka fonu ile nefes kesici manzara.",
        "price": 0, "rating": 4.5,
        "latitude": 36.8878, "longitude": 30.6424,
        "image_url": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80"
    },
    {
        "name": "Lara Plaji",
        "category": "plaj",
        "description": "Antalya'nin en uzun kumsal seridi. Lüks oteller ve beach club'larla cevrili, ince kumlu plaj.",
        "price": 0, "rating": 4.4,
        "latitude": 36.8410, "longitude": 30.8290,
        "image_url": "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=600&q=80"
    },
    {
        "name": "Kaputas Plaji",
        "category": "plaj",
        "description": "Turkiye'nin en guzel koylarindan biri. Turkuaz sular, sarp kayaliklar ve masmavi kumsal.",
        "price": 0, "rating": 4.9,
        "latitude": 36.1965, "longitude": 29.6382,
        "image_url": "https://images.unsplash.com/photo-1530841377377-3ff06c0ca713?w=600&q=80"
    },
    {
        "name": "Olympos Plaji",
        "category": "plaj",
        "description": "Antik Olympos harabeleri yaninda el degmemis doga. Caretta caretta kaplumbaglarin yumurtlama alani.",
        "price": 20, "rating": 4.7,
        "latitude": 36.3882, "longitude": 30.4729,
        "image_url": "https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=600&q=80"
    },

    # DOGA & AKTIVITE
    {
        "name": "Duden Selalesi",
        "category": "doga",
        "description": "Sehir merkezine 14 km mesafede, denize dökülen nefes kesici selale. Tekne turuyla yakindan gorulebilir.",
        "price": 30, "rating": 4.7,
        "latitude": 36.8245, "longitude": 30.8923,
        "image_url": "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=600&q=80"
    },
    {
        "name": "Kursunlu Selalesi",
        "category": "doga",
        "description": "Yemyesil dogayla cevrili romantik selale. Piknik alanlari ve yuruyus patikalariyla aile gezisi icin ideal.",
        "price": 25, "rating": 4.3,
        "latitude": 36.9850, "longitude": 30.8200,
        "image_url": "https://images.unsplash.com/photo-1446329813274-7c9036bd9a1f?w=600&q=80"
    },
    {
        "name": "Tahtalı Dagi Teleferiği",
        "category": "doga",
        "description": "2365 metre yuksekligindeki Tahtalı Dagi'na cikan dunyanin en uzun teleferiklerinden biri. Panoramik manzara.",
        "price": 350, "rating": 4.8,
        "latitude": 36.5183, "longitude": 30.4742,
        "image_url": "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&q=80"
    },

    # RESTORANLAR
    {
        "name": "Seraser Fine Dining",
        "category": "restoran",
        "description": "Kaleiçi'nin tarihi konaginda deniz mahsulleri ve Akdeniz mutfagi. Romantik atmosfer ve odul kazanmis servis.",
        "price": 250, "rating": 4.9,
        "latitude": 36.8920, "longitude": 30.7120,
        "image_url": "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80"
    },
    {
        "name": "Ayar Meyhanesi",
        "category": "restoran",
        "description": "Antalya'nin en sevilen meyhane klasigi. Taze balik, meze tabakları ve samimi atmosfer.",
        "price": 150, "rating": 4.9,
        "latitude": 36.8912, "longitude": 30.7100,
        "image_url": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&q=80"
    },
    {
        "name": "Civata Antalya",
        "category": "restoran",
        "description": "Modern Türk mutfagi ve kokteyl bar. Sehir manzarali teras ve yaratici menüsuyle ozel geceler icin ideal.",
        "price": 200, "rating": 4.7,
        "latitude": 36.8900, "longitude": 30.7090,
        "image_url": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80"
    },
    {
        "name": "Arif Baba Pide Salonu",
        "category": "restoran",
        "description": "50 yillik geleneksel pide ustasi. Odun atesi, el acmasi hamur ve bol malzeme ile Antalya'nin efsane pide lezzeti.",
        "price": 60, "rating": 4.4,
        "latitude": 36.8912, "longitude": 30.7100,
        "image_url": "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80"
    },
    {
        "name": "Selene Restaurant",
        "category": "restoran",
        "description": "Konyaalti sahilinde gunbatimi esliginde taze deniz mahsulleri. Romantik atmosfer ve genis sezonu.",
        "price": 180, "rating": 4.8,
        "latitude": 36.8905, "longitude": 30.7075,
        "image_url": "https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=600&q=80"
    },

    # GECE HAYATI
    {
        "name": "Museum Nightclub",
        "category": "gece_hayati",
        "description": "Antalya'nin en prestijli gece klubu. Uluslararasi DJ'ler, VIP alanlar ve Akdeniz atmosferi.",
        "price": 150, "rating": 4.5,
        "latitude": 36.8850, "longitude": 30.7000,
        "image_url": "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=600&q=80"
    },
    {
        "name": "Aura Nightclub",
        "category": "gece_hayati",
        "description": "Kaleiçi'nin tarihi duvarlari arasinda açik hava parti mekan. Yaz geceleri unutulmaz deneyim.",
        "price": 120, "rating": 4.6,
        "latitude": 36.8890, "longitude": 30.6920,
        "image_url": "https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=600&q=80"
    },
    {
        "name": "Beerzone Kaleiçi",
        "category": "gece_hayati",
        "description": "Tarihi bir konakta butik bira bari. 30'dan fazla yerel ve ithal bira cesidi, samimi atmosfer.",
        "price": 80, "rating": 4.6,
        "latitude": 36.8900, "longitude": 30.6980,
        "image_url": "https://images.unsplash.com/photo-1436076863939-06870fe779c2?w=600&q=80"
    },
]

def seed_activities():
    db = SessionLocal()
    try:
        existing = db.query(Activity).count()
        if existing > 0:
            print(f"Siliyor ve yeniden yukluyor...")
            db.query(Activity).delete()
            db.commit()

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