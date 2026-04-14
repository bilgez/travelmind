from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from models.activity import Activity
from services.recommender import get_recommendations

router = APIRouter(prefix="/api", tags=["recommendations"])

class RecommendationRequest(BaseModel):
    user_id: int
    category: str  # "tarihi_yer", "restoran", "kulup", etc.

@router.get("/recommendations")
def get_activity_recommendations(user_id: int, category: str, db: Session = Depends(get_db)):
    """
    Kategori bazında aktivite önerileri döndürür.
    """
    recommendations = get_recommendations(user_id, category, db)
    
    if not recommendations:
        raise HTTPException(status_code=404, detail="Bu kategoride oneriye bulunamamadi")
    
    return {
        "user_id": user_id,
        "category": category,
        "recommendations": recommendations
    }
