from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from models.trip import Trip
from models.user import User
from models.route import Route
from services.nlp import parse_input
from services.optimizer import optimize_route
from services.budget import calculate_budget

router = APIRouter(prefix="/api", tags=["trips"])

class ParseInputRequest(BaseModel):
    user_id: int
    text: str

class OptimizeRouteRequest(BaseModel):
    trip_id: int
    activity_ids: list  # [1, 3, 5, 7]

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

@router.post("/optimize-route")
def optimize_route_endpoint(request: OptimizeRouteRequest, db: Session = Depends(get_db)):
    # Trip var mı?
    trip = db.query(Trip).filter(Trip.id == request.trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip bulunamadi")
    
    # Rota optimizasyonunu yap
    try:
        optimization_result = optimize_route(request.trip_id, request.activity_ids, db)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    # Route'u veritabanına kaydet
    new_route = Route(
        trip_id=request.trip_id,
        activity_ids=optimization_result["optimized_order"],
        total_distance=optimization_result["total_distance"],
        total_duration=optimization_result["total_duration"],
        total_cost_estimate=optimization_result["total_cost_estimate"]
    )
    db.add(new_route)
    db.commit()
    db.refresh(new_route)
    
    return {
        "route_id": new_route.id,
        "trip_id": request.trip_id,
        "optimized_order": optimization_result["optimized_order"],
        "total_distance": optimization_result["total_distance"],
        "total_duration": optimization_result["total_duration"],
        "total_cost_estimate": optimization_result["total_cost_estimate"],
        "message": "Rota basariyla optimize edildi!"
    }

@router.get("/budget/{trip_id}")
def get_budget(trip_id: int, db: Session = Depends(get_db)):
    """Trip'in bütçesini hesapla ve döndür"""
    try:
        budget = calculate_budget(trip_id, db)
        return {
            "budget": budget,
            "message": "Bütçe basariyla hesaplandi!"
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))