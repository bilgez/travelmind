from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
import models.user
import models.trip
import models.activity
import models.route
from routes.auth import router as auth_router
from routes.trips import router as trips_router
from routes.recommendations import router as recommendations_router

Base.metadata.create_all(bind=engine)

app = FastAPI(title="TravelMind API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(trips_router)
app.include_router(recommendations_router)

@app.get("/")
def root():
    return {"message": "TravelMind API calisiyor!"}

@app.get("/health")
def health_check():
    return {"status": "ok"}