"""
Rota optimizasyonu servisi
Zehra'nın Dijkstra/A*/GA algoritması gelince burası değişecek
"""

from sqlalchemy.orm import Session
from models.activity import Activity
from models.route import Route

def optimize_route(trip_id: int, activity_ids: list, db: Session) -> dict:
    """
    Aktiviteleri optimal sıraya dizer.
    Şimdilik girilen sırayla döndürüyor (DUMMY).
    Zehra'nın kodu gelince Dijkstra/A*/GA kullanacaksın.
    """
    
    # Aktiviteleri sırayla al
    activities = db.query(Activity).filter(Activity.id.in_(activity_ids)).all()
    
    if not activities:
        raise ValueError("Aktivite bulunamadı")
    
    # DUMMY: Girilen sıralamayla döndür
    # Zehra'nın kodu: optimize_order(activities) fonksiyonu
    optimized_ids = [a.id for a in activities]
    
    # Mesafe hesapla (DUMMY: tüm aktivitelerin 50km olduğunu varsay)
    total_distance = len(activity_ids) * 50  # km
    total_duration = len(activity_ids) * 0.5  # saat
    total_cost_estimate = sum([a.price for a in activities])
    
    return {
        "optimized_order": optimized_ids,
        "total_distance": total_distance,
        "total_duration": total_duration,
        "total_cost_estimate": total_cost_estimate
    }
