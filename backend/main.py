from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.auth import router as auth_router
from routes.trips import router as trips_router
import os

app = FastAPI(title="TravelMind API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Router'ları prefix ile ekle
app.include_router(auth_router, prefix="/api")
app.include_router(trips_router, prefix="/api")

print("🚀 Router'lar yükleniyor...")
print("✅ Router'lar yüklendi!")

@app.get("/")
def root():
    return {"message": "TravelMind API calisiyor!"}

@app.get("/health")
def health_check():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)