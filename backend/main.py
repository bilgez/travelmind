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
import os
from sqlalchemy import text
import json

# ⚠️ VERCEL'DE TABLOLARI OLUŞTURMA - Supabase'de zaten varlar!
# Base.metadata.create_all(bind=engine)

app = FastAPI(title="TravelMind API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Router'ları doğru prefix ile ekle
app.include_router(auth_router, prefix="/api")
app.include_router(trips_router, prefix="/api")

@app.get("/")
def root():
    return {"message": "TravelMind API calisiyor!"}

@app.get("/health")
def health_check():
    return {"status": "ok"}

# Vercel için entrypoint
if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)