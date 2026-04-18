import math
from sqlalchemy.orm import Session
from models.activity import Activity
from models.route import Route

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    İki koordinat arasındaki gerçek mesafeyi hesaplar (km).
    Haversine formülü kullanır.
    """
    R = 6371  # Dünya yarıçapı km

    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1

    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a))

    return round(R * c, 2)

def optimize_route(trip_id: int, activity_ids: list, db: Session) -> dict:
    """
    Aktiviteler arasındaki gerçek mesafeyi Haversine formülüyle hesaplar.
    En yakın komşu (greedy) algoritmasıyla rota optimize eder.
    Zehra'nın Dijkstra/A*/GA kodu gelince bu fonksiyon değişecek.
    """
    activities = db.query(Activity).filter(Activity.id.in_(activity_ids)).all()

    if not activities:
        raise ValueError("Aktivite bulunamadi")

    # Nearest Neighbor (greedy) algoritması
    unvisited = list(activities)
    ordered = [unvisited.pop(0)]  # İlk aktiviteden başla

    while unvisited:
        current = ordered[-1]
        nearest = min(
            unvisited,
            key=lambda a: haversine_distance(
                current.latitude, current.longitude,
                a.latitude, a.longitude
            )
        )
        ordered.append(nearest)
        unvisited.remove(nearest)

    # Toplam mesafe hesapla
    total_distance = 0
    for i in range(len(ordered) - 1):
        total_distance += haversine_distance(
            ordered[i].latitude, ordered[i].longitude,
            ordered[i+1].latitude, ordered[i+1].longitude
        )

    total_distance = round(total_distance, 2)
    total_duration = round(total_distance / 50, 2)  # 50 km/saat ortalama
    total_cost = sum(a.price for a in ordered)

    return {
        "optimized_order": [a.id for a in ordered],
        "total_distance": total_distance,
        "total_duration": total_duration,
        "total_cost_estimate": total_cost
    }