from sqlalchemy.orm import Session
from models.activity import Activity

def get_recommendations(user_id: int, category: str, db: Session) -> list:
    """
    Zehra'nın algoritması gelince bu fonksiyon değişecek.
    Şimdilik kategori bazında dummy aktiviteler döndürüyor.
    """
    
    # Kategoriyi basit bir şekilde filtrele
    activities = db.query(Activity).filter(
        Activity.category == category
    ).limit(5).all()
    
    return [
        {
            "id": a.id,
            "name": a.name,
            "category": a.category,
            "price": a.price,
            "rating": a.rating,
            "latitude": a.latitude,
            "longitude": a.longitude
        }
        for a in activities
    ]
