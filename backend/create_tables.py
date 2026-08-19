import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# .env dosyasını yükle
load_dotenv()

# Veritabanı bağlantısı
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    # Alternatif: parçalı bağlantı
    DB_HOST = os.getenv("DB_HOST")
    DB_PORT = os.getenv("DB_PORT")
    DB_NAME = os.getenv("DB_NAME")
    DB_USER = os.getenv("DB_USER")
    DB_PASSWORD = os.getenv("DB_PASSWORD")
    DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}?sslmode=require"

print(f"📡 Bağlanılıyor: {DATABASE_URL}")

try:
    engine = create_engine(DATABASE_URL)
    
    # SQL sorguları ile tabloları oluştur
    with engine.connect() as conn:
        # users tablosu
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                username VARCHAR(100) UNIQUE NOT NULL,
                hashed_password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """))
        
        # trips tablosu
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS trips (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                title VARCHAR(255),
                description TEXT,
                total_budget DECIMAL(10,2),
                status VARCHAR(50),
                plan_data TEXT,
                parsed_plan TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """))
        
        # activities tablosu
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS activities (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                category VARCHAR(100),
                description TEXT,
                price DECIMAL(10,2),
                rating DECIMAL(3,2),
                latitude DECIMAL(10,8),
                longitude DECIMAL(11,8),
                image_url TEXT,
                city VARCHAR(100),
                muzekart BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """))
        
        # routes tablosu (eğer varsa)
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS routes (
                id SERIAL PRIMARY KEY,
                trip_id INTEGER REFERENCES trips(id) ON DELETE CASCADE,
                activity_id INTEGER REFERENCES activities(id) ON DELETE CASCADE,
                day_number INTEGER,
                order_index INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """))
        
        # budget tablosu (eğer varsa)
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS budgets (
                id SERIAL PRIMARY KEY,
                trip_id INTEGER REFERENCES trips(id) ON DELETE CASCADE,
                category VARCHAR(100),
                amount DECIMAL(10,2),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """))
        
        conn.commit()
        print("✅ Tablolar başarıyla oluşturuldu!")
        
        # Tabloları listele
        result = conn.execute(text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        """))
        tables = [row[0] for row in result]
        print(f"📋 Oluşturulan tablolar: {tables}")
        
except Exception as e:
    print(f"❌ HATA: {e}")