from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from models.trip import Trip
from models.user import User
from services.nlp import parse_input

router = APIRouter(prefix="/api", tags=["trips"])

class ParseInputRequest(BaseModel):
    user_id: int
    text: str

@router.post("/parse-input")
def parse_user_input(request: ParseInputRequest, db: Session = Depends(get_db)):
    # Kullanici var mi?
    user = db.query(User).filter(User.id == request.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Kullanici bulunamadi")
    
    # NLP ile parse et
    parsed = parse_input(request.text)
    
    # Trips tablosuna kaydet
    new_trip = Trip(
        user_id=request.user_id,
        title=request.text[:50],
        parsed_plan=str(parsed),
        status="parsed"
    )
    db.add(new_trip)
    db.commit()
    db.refresh(new_trip)
    
    return {
        "trip_id": new_trip.id,
        "parsed_plan": parsed,
        "message": "Plan basariyla olusturuldu!"
    }

@router.get("/trips/{user_id}")
def get_user_trips(user_id: int, db: Session = Depends(get_db)):
    trips = db.query(Trip).filter(Trip.user_id == user_id).all()
    return {"trips": [{"id": t.id, "title": t.title, "status": t.status} for t in trips]}