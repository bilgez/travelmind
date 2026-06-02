from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
import models.user
import models.trip
import models.activity
import models.route
import models.budget
from routes.auth import router as auth_router
from routes.trips import router as trips_router

Base.metadata.create_all(bind=engine)

from sqlalchemy import text
import json, os

with engine.connect() as conn:
    conn.execute(text("ALTER TABLE trips ADD COLUMN IF NOT EXISTS plan_data TEXT"))
    conn.execute(text("ALTER TABLE activities ADD COLUMN IF NOT EXISTS muzekart BOOLEAN DEFAULT FALSE"))
    conn.commit()

# muzekart değerlerini JSON'dan aktar — yalnızca henüz FALSE olan satırları günceller
_json_path = os.path.join(os.path.dirname(__file__), "data", "antalya_activities.json")
if os.path.exists(_json_path):
    with open(_json_path, encoding="utf-8") as _f:
        _muzekart_names = {a["name"] for a in json.load(_f) if a.get("muzekart")}
    with engine.connect() as conn:
        for name in _muzekart_names:
            conn.execute(
                text("UPDATE activities SET muzekart = TRUE WHERE name = :name AND muzekart = FALSE"),
                {"name": name}
            )
        conn.commit()

app = FastAPI(title="TravelMind API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(trips_router)

@app.get("/")
def root():
    return {"message": "TravelMind API calisiyor!"}

@app.get("/health")
def health_check():
    return {"status": "ok"}