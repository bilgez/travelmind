from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import json
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database import get_db
from models.trip import Trip
from models.user import User
from models.activity import Activity
from nlp.parser import parse_user_input as parse_input

from services.budget import calculate_budget
from services.auth_deps import get_current_user
from services.chat_engine import ChatEngine
from services.plan_builder import build_plan, add_to_plan
from nlp.parser import ConversationSession

router = APIRouter(prefix="/trips", tags=["trips"])
@router.get("/")
def trips_root():
    return {
        "message": "Trips API çalışıyor!",
        "endpoints": [
            "/plans (GET, POST)",
            "/plans/{trip_id} (DELETE, PATCH)",
            "/activities (GET)",
            "/activities/{activity_id} (GET)",
            "/trips/{user_id} (GET)",
            "/budget/{trip_id} (GET)"
        ]
    }



# In-memory ChatEngine instances (session_id → ChatEngine)
_engines: dict[str, ChatEngine] = {}

class ParseInputRequest(BaseModel):
    user_id: int
    text: str

class PlanChatRequest(BaseModel):
    session_id: str
    text: str
    reset: bool = False

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

@router.post("/plan-chat")
def plan_chat(request: PlanChatRequest):
    """
    ChatEngine tabanlı çok turlu sohbet endpoint'i.
    - Selamlama → karşılama mesajı
    - Bütçe eksikse → bütçeyi sor
    - Yeterli bilgi varsa → hybrid_recommend ile öneri üret
    """
    session_id = request.session_id

    if request.reset or session_id not in _engines:
        _engines[session_id] = ChatEngine()

    engine = _engines[session_id]
    result = engine.handle_message(request.text)

    # Plan hazırsa: engine.session'dan direkt plan inşa et
    if result.get("state") == "ready":
        try:
            collected = engine.session.collected
            normalized_prefs = engine.session.to_normalized_prefs()
            plan = build_plan(collected, normalized_prefs)
            result["plan"] = plan
            _engines.pop(session_id, None)
        except Exception as e:
            import traceback
            print("BUILD_PLAN HATASI:", traceback.format_exc())
            result["plan_error"] = str(e)

    return result

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
                plan_obj["title"] = t.title
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


@router.get("/activities")
def get_all_activities(db: Session = Depends(get_db)):
    activities = db.query(Activity).order_by(Activity.rating.desc()).all()
    return [
        {
            "id": a.id, "name": a.name, "category": a.category,
            "description": a.description, "latitude": a.latitude,
            "longitude": a.longitude, "price": a.price, "rating": a.rating,
            "city": a.city, "image_url": a.image_url, "muzekart": a.muzekart,
        }
        for a in activities
    ]


@router.get("/activities/{activity_id}")
def get_activity(activity_id: int, db: Session = Depends(get_db)):
    a = db.query(Activity).filter(Activity.id == activity_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Aktivite bulunamadı")
    return {
        "id": a.id, "name": a.name, "category": a.category,
        "description": a.description, "latitude": a.latitude,
        "longitude": a.longitude, "price": a.price, "rating": a.rating,
        "city": a.city, "image_url": a.image_url, "muzekart": a.muzekart,
    }


class PlanBuildRequest(BaseModel):
    budget: Optional[float] = None
    duration_days: Optional[int] = 1
    group_type: Optional[str] = "solo"
    categories: Optional[list] = []
    locations: Optional[list] = []
    sentiment_vector: Optional[dict] = {}
    time_slots: Optional[dict] = {}
    has_muzekart: Optional[bool] = False
    age_groups: Optional[list] = []
    is_family_trip: Optional[bool] = False
    keywords: Optional[list] = []
    mode: Optional[str] = "balanced"


@router.post("/plan-build")
def plan_build_endpoint(request: PlanBuildRequest):
    """
    Direkt plan oluşturma — ChatEngine'e gerek yok.
    Refine modu ve yeniden inşa için kullanılır.
    """
    collected = {
        "budget":          request.budget,
        "duration_days":   request.duration_days or 1,
        "group_type":      request.group_type or "solo",
        "categories":      request.categories or [],
        "locations":       request.locations or [],
        "sentiment_vector": request.sentiment_vector or {},
        "time_slots":      request.time_slots or {},
        "has_muzekart":    request.has_muzekart or False,
        "age_groups":      request.age_groups or [],
        "is_family_trip":  request.is_family_trip or False,
        "keywords":        request.keywords or [],
        "mode":            request.mode or "balanced",
    }
    session = ConversationSession()
    session.collected = collected
    normalized_prefs = session.to_normalized_prefs()
    try:
        plan = build_plan(collected, normalized_prefs)
        return {"plan": plan}
    except Exception as e:
        import traceback
        print("PLAN_BUILD HATASI:", traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


class PlanAddRequest(BaseModel):
    current_plan: dict
    category: str
    existing_ids: Optional[list] = []
    count: Optional[int] = 2
    has_muzekart: Optional[bool] = False
    budget_per_activity: Optional[float] = None


@router.post("/plan-add")
def plan_add_endpoint(request: PlanAddRequest):
    """Mevcut plana kategori bazlı aktivite ekler, Dijkstra ile optimize eder."""
    db_cat = _NLP_TO_DB.get(request.category, request.category)
    updated, added_names = add_to_plan(
        current_plan=request.current_plan,
        db_category=db_cat,
        existing_ids=request.existing_ids or [],
        count=request.count or 2,
        has_muzekart=request.has_muzekart or False,
        budget_per_activity=request.budget_per_activity,
    )
    return {"plan": updated, "added_names": added_names}


class PlanSuggestRequest(BaseModel):
    existing_ids: list = []
    category: Optional[str] = None
    count: Optional[int] = 2
    budget_per_activity: Optional[float] = None


# Backend kategori eşleme (NLP kategorileri → DB kategorileri)
_NLP_TO_DB = {
    "historical": "tarihi_yer", "ruins": "tarihi_yer", "museum": "tarihi_yer",
    "beach": "plaj", "beachclub": "plaj",
    "nature": "doga", "waterfall": "doga", "cave": "doga", "park": "doga", "activity": "doga",
    "restaurant": "restoran", "fine_dining": "restoran",
    "nightlife": "gece_hayati",
    "shopping": "alisveris", "mall": "alisveris", "market": "alisveris",
    "themepark": "eglence", "family": "eglence",
    "tarihi_yer": "tarihi_yer", "plaj": "plaj", "doga": "doga",
    "restoran": "restoran", "gece_hayati": "gece_hayati",
    "alisveris": "alisveris", "eglence": "eglence",
}


@router.post("/plan-suggest")
def plan_suggest(request: PlanSuggestRequest, db: Session = Depends(get_db)):
    """
    Mevcut plana eklenecek aktivite önerir.
    Zaten planda olan ID'leri dışlar, kategori filtresi uygular.
    """
    db_cat = _NLP_TO_DB.get(request.category, request.category) if request.category else None
    query = db.query(Activity)
    if db_cat:
        query = query.filter(Activity.category == db_cat)
    if request.existing_ids:
        query = query.filter(Activity.id.notin_(request.existing_ids))
    if request.budget_per_activity and request.budget_per_activity > 0:
        query = query.filter(
            (Activity.price == None) | (Activity.price == 0) | (Activity.price <= request.budget_per_activity)
        )
    activities = query.order_by(Activity.rating.desc()).limit(request.count).all()
    return [
        {
            "id": a.id, "name": a.name, "category": a.category,
            "description": a.description, "latitude": a.latitude,
            "longitude": a.longitude, "price": a.price, "rating": a.rating,
            "city": a.city, "image_url": a.image_url, "muzekart": a.muzekart,
        }
        for a in activities
    ]
