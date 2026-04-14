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
- [x] `main.py` — FastAPI sunucusu yazıldı (`http://127.0.0.1:8000`)
- [x] `database.py` — PostgreSQL bağlantısı hazırlandı
- [x] `.env` — gizli bilgiler güvenli şekilde saklanıyor
- [x] PostgreSQL kuruldu, `travelmind` veritabanı oluşturuldu
- [x] GitHub repo oluşturuldu, ekip eklendi

### ✅ Hafta 2 — Kullanıcı Sistemi
- [x] `models/user.py` — users tablosu oluşturuldu
- [x] `models/trip.py` — trips tablosu oluşturuldu
- [x] `services/auth.py` — bcrypt şifre hash, JWT token üretimi
- [x] `routes/auth.py` — POST /auth/register endpoint'i yazıldı
- [x] `routes/auth.py` — POST /auth/login endpoint'i yazıldı
- [x] Gerçek kullanıcı kaydı ve girişi test edildi ✔

### 🔄 Hafta 3 — NLP Modülü (Devam Ediyor)
- [ ] `POST /api/parse-input` endpoint'i
- [ ] Parse edilen veriyi trips tablosuna kaydet
- [ ] Pydantic modelleri
- [ ] ⚠️ Zehra'nın NLP servisine bağlanılacak → `services/nlp.py`

### ⏳ Hafta 4 — Öneri Motoru
- [ ] `GET /api/recommendations` endpoint'i
- [ ] Redis cache entegrasyonu
- [ ] ⚠️ Zehra'nın öneri algoritmasına bağlanılacak → `services/recommender.py`

### ⏳ Hafta 5 — Rota Optimizasyonu
- [ ] `POST /api/optimize-route` endpoint'i
- [ ] Google Maps Distance Matrix API entegrasyonu
- [ ] GeoJSON formatı
- [ ] ⚠️ Zehra'nın optimizasyon koduna bağlanılacak → `services/optimizer.py`

### ⏳ Hafta 6 — Bütçe Modülü
- [ ] `GET /api/budget/{trip_id}` endpoint'i
- [ ] OpenWeather API entegrasyonu
- [ ] `budget_estimates` tablosu
- [ ] `POST /api/adapt-plan` endpoint'i

### ⏳ Hafta 7 — Test
- [ ] pytest ile integration testler
- [ ] Swagger dokümantasyonu tamamla
- [ ] Docker ile containerize et

### ⏳ Hafta 8 — Final
- [ ] Production deploy (Railway/Render)
- [ ] Performans ölçümleri raporu

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
- [ ] Filtre butonları (tarihi/yemek/eğlence)
- [ ] Kart seçme/kaldırma

### ⏳ Hafta 5 — Harita
- [ ] Google Maps entegrasyonu
- [ ] Aktivite pinleri
- [ ] Rota çizimi (Polyline)

### ⏳ Hafta 6 — Bütçe Ekranı
- [ ] Bütçe breakdown grafiği
- [ ] Uyarı banner'ı
- [ ] Plan güncellendi bildirimi

### ⏳ Hafta 7-8 — Test & Final
- [ ] Responsive tasarım
- [ ] Demo video
- [ ] Vercel deploy

---

## 🧠 ZEHRA — NLP & AI

### ⏳ Hafta 1 — Ortam Kurulumu
- [ ] spaCy kur, Türkçe model indir (`tr_core_news_sm`)
- [ ] HuggingFace Transformers kur
- [ ] scikit-learn kur
- [ ] Jupyter Notebook ortamı

### ⏳ Hafta 2 — Veri Toplama
- [ ] OpenTripMap API'den Antalya aktivite verisi çek
- [ ] Veriyi temizle, JSON formatına dönüştür
- [ ] 50+ aktivite seed data hazırla

### ⏳ Hafta 3 — NLP Modülü ⚠️ BİLGE BEKLİYOR
- [ ] Intent extraction (sabah/öğle/akşam/gece)
- [ ] Entity extraction (tarihi yer, restoran, kulüp)
- [ ] JSON çıktı formatı
- [ ] `services/nlp.py` dosyasına yaz → Bilge'ye gönder

### ⏳ Hafta 4 — Öneri Motoru
- [ ] TF-IDF ile content-based filtering
- [ ] Cosine similarity
- [ ] Collaborative filtering
- [ ] Hybrid skor (w1/w2 ağırlıkları)
- [ ] `services/recommender.py` dosyasına yaz

### ⏳ Hafta 5 — Rota Optimizasyonu
- [ ] Dijkstra algoritması
- [ ] A* algoritması
- [ ] Genetic Algorithm
- [ ] Objective function: Z = w1*mesafe + w2*maliyet - w3*kalite
- [ ] `services/optimizer.py` dosyasına yaz

### ⏳ Hafta 6 — Adaptasyon
- [ ] Hava durumu tabanlı aktivite filtreleme
- [ ] `adaptPlan()` fonksiyonu
- [ ] Redis cache

### ⏳ Hafta 7-8 — Test & Final
- [ ] 20+ Türkçe girdi testi
- [ ] SUS anketi (5 kişi)
- [ ] Model doğruluk metrikleri
- [ ] Final rapor evaluation bölümü

---

## 🛠 Teknoloji Stack

| Katman | Teknoloji |
|--------|-----------|
| Backend | Python 3.13 + FastAPI |
| Frontend | React (Vite) + Tailwind CSS |
| Veritabanı | PostgreSQL 18 |
| NLP | spaCy (tr_core_news_sm) + HuggingFace |
| Harita | Google Maps API |
| Hava Durumu | OpenWeather API |
| Cache | Redis |
| Auth | JWT + bcrypt |

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
| POST | /api/parse-input | NLP ile plan parse | 🔄 Devam |
| GET | /api/recommendations | Aktivite önerileri | ⏳ Bekliyor |
| POST | /api/optimize-route | Rota optimizasyonu | ⏳ Bekliyor |
| GET | /api/budget/{trip_id} | Bütçe tahmini | ⏳ Bekliyor |
