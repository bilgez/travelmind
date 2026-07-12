from sqlalchemy.orm import Session
from models.trip import Trip
from models.route import Route
from models.activity import Activity
from models.budget import Budget

def calculate_budget(trip_id: int, db: Session):
    """
    Trip için bütçe hesapla:
    - Trip'in route'undaki aktiviteleri sor
    - Toplam fiyat hesapla
    - Taşıma maliyeti ekle (50km × benzin türü)
    - Budget tablosuna kaydet
    """
    # Trip var mı?
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise ValueError("Trip bulunamadi")
    
    # Trip'in route'u var mı?
    route = db.query(Route).filter(Route.trip_id == trip_id).first()
    
    activity_cost_sum = 0.0
    if route and route.activity_ids:
        # Activity fiyatlarını topla
        activities = db.query(Activity).filter(Activity.id.in_(route.activity_ids)).all()
        activity_cost_sum = sum([a.price or 0 for a in activities])
    
    # Taşıma maliyeti tahmini: 50km × 0.5 TL/km = 25 TL
    # Gerçekte optimize_route endpoint'inde total_distance var, onu kullanabiliriz
    transport_cost = 25.0  # Basit tahmin
    if route:
        # total_distance km, ortalama 0.5 TL/km (benzin + işçilik)
        transport_cost = route.total_distance * 0.5 if route.total_distance else 25.0
    
    # Beklenmedik masraflar: %10
    contingency = (activity_cost_sum + transport_cost) * 0.1
    
    # Toplam
    total_estimate = activity_cost_sum + transport_cost + contingency
    
    # Budget'i kaydet (varsa güncelle, yoksa oluştur)
    budget = db.query(Budget).filter(Budget.trip_id == trip_id).first()
    if budget:
        budget.activity_cost_sum = activity_cost_sum
        budget.transport_cost = transport_cost
        budget.contingency = contingency
        budget.total_estimate = total_estimate
    else:
        budget = Budget(
            trip_id=trip_id,
            activity_cost_sum=activity_cost_sum,
            transport_cost=transport_cost,
            contingency=contingency,
            total_estimate=total_estimate
        )
        db.add(budget)
    
    db.commit()
    db.refresh(budget)
    
    return {
        "budget_id": budget.id,
        "trip_id": trip_id,
        "activity_cost_sum": activity_cost_sum,
        "transport_cost": transport_cost,
        "contingency": contingency,
        "total_estimate": total_estimate
    }
