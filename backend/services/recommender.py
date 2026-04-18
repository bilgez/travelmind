from sqlalchemy.orm import Session
from models.activity import Activity

def get_recommendations(user_id: int, category: str, db: Session) -> list:
    """
    Kategori bazında aktivite önerir.
    Rating'e göre sıralar (en yüksek önce).
    Zehra'nın hybrid algoritması gelince bu fonksiyon güçlendirilecek.
    """
    activities = db.query(Activity).filter(
        Activity.category == category
    ).order_by(Activity.rating.desc()).limit(5).all()

    if not activities:
        return []

    # Normalize edilmiş skor hesapla (0-1 arası)
    max_rating = max(a.rating for a in activities)
    min_price = min(a.price for a in activities) if activities else 1

    return [
        {
            "id": a.id,
            "name": a.name,
            "category": a.category,
            "price": a.price,
            "rating": a.rating,
            "latitude": a.latitude,
            "longitude": a.longitude,
            "score": round(a.rating / max_rating, 2)  # Normalize skor
        }
        for a in activities
    ]