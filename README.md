# TravelMind 🧳
**NLP Tabanlı Akıllı Seyahat Planlama Sistemi**
Türk Hava Kurumu Üniversitesi | 2025-2026 Güz Dönemi

---

## 👥 Ekip

| İsim | Rol | Alan |
|------|-----|------|
| Bilge Zerda Keklik | Backend Developer | FastAPI, PostgreSQL, Redis |
| Cevriye Ülkü Boztaş | Frontend Developer | React, Google Maps, Tailwind |
| Zehra Timurağaoğlu | NLP & AI Engineer | spaCy, scikit-learn, TensorFlow |

---

## 💼 BİLGE — Backend

### ✅ Hafta 1 — Ortam Kurulumu
- [x] Python venv kuruldu
- [x] FastAPI, PostgreSQL, JWT, bcrypt tüm paketler kuruldu
- [x] Klasör yapısı oluşturuldu (backend, models, routes, services)
- [x] `main.py` — FastAPI sunucusu yazıldı
- [x] `database.py` — PostgreSQL bağlantısı hazırlandı
- [x] `.env` — gizli bilgiler güvenli şekilde saklanıyor
- [x] PostgreSQL kuruldu, `travelmind` veritabanı oluşturuldu
- [x] GitHub repo oluşturuldu, ekip eklendi

### ✅ Hafta 2 — Kullanıcı Sistemi
- [x] `models/user.py` — users tablosu oluşturuldu
- [x] `models/trip.py` — trips tablosu oluşturuldu
- [x] `services/auth.py` — bcrypt şifre hash, JWT token üretimi
- [x] `POST /auth/register` endpoint'i yazıldı ve test edildi
- [x] `POST /auth/login` endpoint'i yazıldı ve test edildi

### ✅ Hafta 3 — NLP Modülü
- [x] `services/nlp.py` — dummy NLP fonksiyonu yazıldı
- [x] `POST /api/parse-input` endpoint'i yazıldı ve test edildi
- [x] Parse edilen veri trips tablosuna kaydediliyor
- [x] ⚠️ Zehra'nın NLP kodu gelince `services/nlp.py` güncellenecek

### ✅ Hafta 4 — Öneri Motoru
- [x] `models/activity.py` — Activity tablosu oluşturuldu
- [x] 14 aktivite seed data eklendi (Antalya)
- [x] `GET /api/recommendations` endpoint'i yazıldı ve test edildi
- [x] Rating bazlı sıralama eklendi
- [x] ⚠️ Zehra'nın hybrid algoritması gelince `services/recommender.py` güncellenecek

### ✅ Hafta 5 — Rota Optimizasyonu
- [x] `models/route.py` — Route tablosu oluşturuldu
- [x] Haversine mesafe hesabı eklendi
- [x] Nearest Neighbor algoritması ile rota optimizasyonu
- [x] `POST /api/optimize-route` endpoint'i yazıldı ve test edildi
- [x] ⚠️ Zehra'nın Dijkstra/A*/GA kodu gelince `services/optimizer.py` güncellenecek

### ✅ Hafta 6 — Bütçe Modülü
- [x] `models/budget.py` — Budget tablosu oluşturuldu
- [x] `services/budget.py` — Bütçe hesaplama servisi yazıldı
- [x] `GET /api/budget/{trip_id}` endpoint'i yazıldı ve test edildi

### ✅ Hafta 7 — Test
- [x] pytest kuruldu
- [x] 12 unit test yazıldı — 12/12 passed, 0 warning
- [x] `tests/test_auth.py` — Auth testleri
- [x] `tests/test_trips.py` — Trip, recommendation, budget testleri
- [x] SQLAlchemy ve timezone deprecation uyarıları düzeltildi

### ⏳ Hafta 8 — Final
- [ ] SUS anketi (Zehra ve Ülkü bitince)
- [ ] Demo videosu
- [ ] Production deploy

---

## 🎨 ÜLKÜ — Frontend

### ⏳ Hafta 1 — Ortam Kurulumu
- [ ] Vite ile React projesi oluştur
- [ ] Tailwind CSS entegrasyonu
- [ ] Temel sayfa yapısı (Giriş / Ana / Plan)
- [ ] React Router kurulumu
- [ ] Axios HTTP client

### ⏳ Hafta 2 — Kullanıcı Sistemi
- [ ] Kayıt formu sayfası
- [ ] Giriş formu sayfası
- [ ] JWT token localStorage'a kaydet
- [ ] Protected Route yapısı

### ⏳ Hafta 3 — NLP Ekranı
- [ ] Doğal dil girişi metin kutusu ekranı
- [ ] NLP sonucunu gösteren onay ekranı
- [ ] Yükleniyor animasyonu

### ⏳ Hafta 4 — Öneri Ekranı
- [ ] Öneri kartları listesi
- [ ] Filtre butonları
- [ ] Kart seçme/kaldırma

### ⏳ Hafta 5 — Harita
- [ ] Google Maps entegrasyonu
- [ ] Aktivite pinleri
- [ ] Rota çizimi

### ⏳ Hafta 6-8 — Bütçe, Test & Final
- [ ] Bütçe breakdown grafiği
- [ ] Demo video
- [ ] Vercel deploy

---

## 🧠 ZEHRA — NLP & AI

### ⏳ Hafta 1-2 — Kurulum & Veri
- [ ] spaCy + Türkçe model kurulumu
- [ ] Antalya aktivite verisi toplama

### ⏳ Hafta 3 — NLP Modülü ⚠️ BİLGE BEKLİYOR
- [ ] Intent + Entity extraction
- [ ] `services/nlp.py` → Bilge'ye gönder

### ⏳ Hafta 4 — Öneri Motoru
- [ ] TF-IDF, cosine similarity
- [ ] `services/recommender.py` → Bilge'ye gönder

### ⏳ Hafta 5 — Rota Optimizasyonu
- [ ] Dijkstra / A* / Genetic Algorithm
- [ ] `services/optimizer.py` → Bilge'ye gönder

### ⏳ Hafta 6-8 — Adaptasyon & Final
- [ ] Hava durumu tabanlı adaptasyon
- [ ] SUS anketi, model doğruluk metrikleri

---

## 🛠 Teknoloji Stack

| Katman | Teknoloji |
|--------|-----------|
| Backend | Python 3.13 + FastAPI |
| Frontend | React (Vite) + Tailwind CSS |
| Veritabanı | PostgreSQL 18 |
| NLP | spaCy + HuggingFace |
| Harita | Google Maps API |
| Cache | Redis |
| Auth | JWT + bcrypt |
| Test | pytest (12/12 passed) |

## 🚀 Kurulum

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 📡 API Endpoints

| Method | Endpoint | Açıklama | Durum |
|--------|----------|----------|-------|
| POST | /auth/register | Kullanıcı kaydı | ✅ Hazır |
| POST | /auth/login | Kullanıcı girişi | ✅ Hazır |
| POST | /api/parse-input | NLP ile plan parse | ✅ Hazır |
| GET | /api/recommendations | Aktivite önerileri | ✅ Hazır |
| POST | /api/optimize-route | Rota optimizasyonu | ✅ Hazır |
| GET | /api/budget/{trip_id} | Bütçe tahmini | ✅ Hazır |
| GET | /api/trips/{user_id} | Kullanıcı planları | ✅ Hazır |
