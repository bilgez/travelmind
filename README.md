# TravelMind
**NLP Tabanlı Akıllı Seyahat Planlama Sistemi**
Türk Hava Kurumu Üniversitesi | 2025-2026 Güz Dönemi

---

## Projeyi Çalıştırma

### Gereksinimler
- [Python 3.10+](https://www.python.org/downloads/) — kurulumda **"Add to PATH"** seçeneğini işaretle
- [Node.js 18+](https://nodejs.org/)
- [PostgreSQL 18](https://www.postgresql.org/download/windows/)

---

### Adım 1 — Repo'yu çek

```bash
git clone https://github.com/bilgez/travelmind.git
cd travelmind
git checkout bilgez
```

### Adım 2 — PostgreSQL'de veritabanı oluştur

```sql
CREATE DATABASE travelmind;
```

### Adım 3 — Backend .env dosyasını oluştur

```bash
cd backend
copy .env.example .env
```

`.env` dosyasını aç, `SIFRENIZ` yazan yere PostgreSQL şifreni yaz.

### Adım 4 — Python sanal ortamı kur

```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

### Adım 5 — Frontend .env dosyasını oluştur

```bash
cd ..\frontend
copy .env.example .env
npm install
```

### Adım 6 — Çalıştır

Ana klasördeki **`baslat.bat`** dosyasına çift tıkla. Tarayıcı otomatik açılır.

- Frontend → http://localhost:5173
- Backend → http://localhost:8000

---

### Sorun giderme

**"PostgreSQL servisi bulunamadı"**
→ Görev Yöneticisi → Servisler → `postgresql-x64-18` çalışıyor olmalı.

**"Module not found" (backend)**
→ `backend\venv\Scripts\activate` çalıştır, sonra `pip install -r requirements.txt`.

**Harita görünmüyor**
→ `frontend\.env` dosyasında `VITE_GOOGLE_MAPS_API_KEY` dolu mu kontrol et.

---

## NLP Pipeline

```
Kullanıcı mesajı (Türkçe)
    ↓
nlp/parser.py — bütçe, gün, grup, sentiment, lokasyon çıkarır
    ↓
nlp/recommender.py — cosine similarity + bütçe/çeşitlilik skoru
    ↓
services/plan_builder.py — günlere dağıtım + Dijkstra rota optimizasyonu
    ↓
Frontend — plan görüntüleme
```

---

## NLP Model Metrikleri

| Metrik | Değer |
|--------|-------|
| Avg Precision | 0.24 |
| Avg Recall | 0.3833 |
| Avg F1-Score | 0.2952 |
| Avg MAPE | %18.58 (< %20 — İyi) |

---

## API Endpoints

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | /auth/register | Kullanıcı kaydı |
| POST | /auth/login | Kullanıcı girişi |
| POST | /api/plan-chat | Çok turlu AI sohbeti |
| POST | /api/plan-build | Direkt plan oluşturma |
| POST | /api/plan-add | Plana aktivite ekleme |
| POST | /api/parse-input | NLP parse |
| GET | /api/trips/{user_id} | Kullanıcı planları |
| POST | /api/trips/save | Plan kaydetme |

---

## Teknoloji Stack

| Katman | Teknoloji |
|--------|-----------|
| Backend | Python 3.13 + FastAPI |
| Frontend | React (Vite) + Tailwind CSS |
| Veritabanı | PostgreSQL 18 |
| NLP | scikit-learn + özel parser |
| Harita | Google Maps API |
| Auth | JWT + bcrypt |
| Test | pytest |
