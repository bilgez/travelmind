from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.activity import Activity
from services.recommender import get_recommendations

router = APIRouter(prefix="/api", tags=["recommendations"])

@router.get("/activities")
def get_all_activities(db: Session = Depends(get_db)):
    activities = db.query(Activity).all()
    return {
        "activities": [
            {
                "id": a.id,
                "name": a.name,
                "category": a.category,
                "description": a.description,
                "price": a.price,
                "rating": a.rating,
                "latitude": a.latitude,
                "longitude": a.longitude,
                "image_url": a.image_url,
                "city": a.city
            }
            for a in activities
        ]
    }

@router.get("/activities/{activity_id}")
def get_activity(activity_id: int, db: Session = Depends(get_db)):
    activity = db.query(Activity).filter(Activity.id == activity_id).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Aktivite bulunamadi")
    return {
        "id": activity.id,
        "name": activity.name,
        "category": activity.category,
        "description": activity.description,
        "price": activity.price,
        "rating": activity.rating,
        "latitude": activity.latitude,
        "longitude": activity.longitude,
        "image_url": activity.image_url,
        "city": activity.city
    }

@router.get("/recommendations")
def get_activity_recommendations(user_id: int, category: str, db: Session = Depends(get_db)):
    recommendations = get_recommendations(user_id, category, db)
    if not recommendations:
        return {"user_id": user_id, "category": category, "recommendations": []}
    return {"user_id": user_id, "category": category, "recommendations": recommendations}