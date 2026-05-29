from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import json
from database import get_db
from models.trip import Trip
from models.user import User
from models.route import Route
from services.nlp import parse_input
from services.optimizer import optimize_route
from services.budget import calculate_budget
from services.auth_deps import get_current_user

router = APIRouter(prefix="/api", tags=["trips"])

class ParseInputRequest(BaseModel):
    user_id: int
    text: str

class OptimizeRouteRequest(BaseModel):
    trip_id: int
    activity_ids: list  # [1, 3, 5, 7]

@router.post("/parse-input")
def parse_user_input(request: ParseInputRequest, db: Session = Depends(get_db)):
    parsed = parse_input(request.text)

    user = db.query(User).filter(User.id == request.user_id).first()
    trip_id = None
    if user:
        new_trip = Trip(
            user_id=request.user_id,
            title=request.text[:50],
            parsed_plan=str(parsed),
            status="parsed"
        )
        db.add(new_trip)
        db.commit()
        db.refresh(new_trip)
        trip_id = new_trip.id

    return {
        "trip_id": trip_id,
        "parsed_plan": parsed,
        "message": "Plan basariyla olusturuldu!"
    }

class SavePlanRequest(BaseModel):
    trip_id: Optional[int] = None
    title: str
    plan_data: str
    total_cost: float = 0
    duration: int = 1
    budget: float = 0
    status: str = "active"

@router.post("/plans")
def save_user_plan(
    request: SavePlanRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if request.trip_id:
        trip = db.query(Trip).filter(Trip.id == request.trip_id, Trip.user_id == current_user.id).first()
        if trip:
            trip.title = request.title
            trip.plan_data = request.plan_data
            trip.total_budget = request.total_cost
            trip.status = request.status
            db.commit()
            db.refresh(trip)
            return {"id": trip.id, "message": "Plan güncellendi"}

    trip = Trip(
        user_id=current_user.id,
        title=request.title,
        plan_data=request.plan_data,
        total_budget=request.total_cost,
        status=request.status,
    )
    db.add(trip)
    db.commit()
    db.refresh(trip)
    return {"id": trip.id, "message": "Plan kaydedildi"}

@router.get("/plans")
def get_my_plans(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    trips = db.query(Trip).filter(Trip.user_id == current_user.id, Trip.plan_data != None).order_by(Trip.created_at.desc()).all()
    plans = []
    for t in trips:
        plan_obj = {
            "id": str(t.id),
            "title": t.title,
            "status": t.status or "active",
            "createdAt": t.created_at.isoformat() if t.created_at else None,
            "totalCost": t.total_budget or 0,
            "days": [],
        }
        if t.plan_data:
            try:
                extra = json.loads(t.plan_data)
                plan_obj.update(extra)
                plan_obj["id"] = str(t.id)
                plan_obj["totalCost"] = t.total_budget or plan_obj.get("totalCost", 0)
            except Exception:
                pass
        plans.append(plan_obj)
    return {"plans": plans}

@router.delete("/plans/{trip_id}")
def delete_plan(
    trip_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    trip = db.query(Trip).filter(Trip.id == trip_id, Trip.user_id == current_user.id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Plan bulunamadı")
    db.delete(trip)
    db.commit()
    return {"message": "Plan silindi"}

@router.patch("/plans/{trip_id}/status")
def update_plan_status(
    trip_id: int,
    body: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    trip = db.query(Trip).filter(Trip.id == trip_id, Trip.user_id == current_user.id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Plan bulunamadı")
    trip.status = body.get("status", trip.status)
    trip.title = body.get("title", trip.title)
    db.commit()
    return {"message": "Güncellendi"}

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