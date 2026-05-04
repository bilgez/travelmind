import heapq
import json
import os
import math

# Veri setini yükle
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BASE_DIR, "data", "antalya_activities.json")

with open(DATA_PATH, "r", encoding="utf-8") as f:
    ACTIVITIES = json.load(f)

# Aktivitelere koordinat ekle
COORDINATES = {
    1:  (36.8841, 30.7056),  # Kaleiçi
    2:  (36.8847, 30.7063),  # Hadrian Kapısı
    3:  (36.8872, 30.6891),  # Antalya Müzesi
    4:  (36.8835, 30.7048),  # Seraser Fine Dining
    5:  (36.8820, 30.7100),  # 7 Mehmet Restaurant
    6:  (36.8830, 30.7040),  # Club Arma
    7:  (36.8810, 30.7020),  # Dubliner Irish Pub
    8:  (36.9012, 30.7234),  # Düden Şelalesi
    9:  (36.8650, 30.6300),  # Konyaaltı Plajı
    10: (36.8900, 30.6950),  # MarkAntalya AVM
}


def haversine_distance(coord1: tuple, coord2: tuple) -> float:
    """
    İki koordinat arasındaki mesafeyi km cinsinden hesaplar.
    """
    R = 6371  # Dünya yarıçapı km

    lat1, lon1 = math.radians(coord1[0]), math.radians(coord1[1])
    lat2, lon2 = math.radians(coord2[0]), math.radians(coord2[1])

    dlat = lat2 - lat1
    dlon = lon2 - lon1

    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a))

    return round(R * c, 4)


def build_graph(activity_ids: list) -> dict:
    """
    Verilen aktiviteler arasında tam bağlı graf oluşturur.
    Her aktivite diğerine bağlı, ağırlık = mesafe (km)
    """
    graph = {aid: {} for aid in activity_ids}

    for i in range(len(activity_ids)):
        for j in range(len(activity_ids)):
            if i != j:
                id1 = activity_ids[i]
                id2 = activity_ids[j]
                coord1 = COORDINATES.get(id1)
                coord2 = COORDINATES.get(id2)
                if coord1 and coord2:
                    dist = haversine_distance(coord1, coord2)
                    graph[id1][id2] = dist

    return graph


def dijkstra(graph: dict, start_id: int) -> dict:
    """
    Dijkstra algoritması ile başlangıç noktasından
    tüm aktivitelere en kısa mesafeleri hesaplar.
    """
    distances = {node: float('inf') for node in graph}
    distances[start_id] = 0
    
    # (mesafe, node) formatında priority queue
    pq = [(0, start_id)]

    while pq:
        current_dist, current_node = heapq.heappop(pq)

        # Daha kısa yol bulunmuşsa atla
        if current_dist > distances[current_node]:
            continue

        for neighbor, weight in graph[current_node].items():
            distance = current_dist + weight

            if distance < distances[neighbor]:
                distances[neighbor] = distance
                heapq.heappush(pq, (distance, neighbor))

    return distances


def optimize_route(activity_ids: list) -> dict:
    """
    Verilen aktiviteler için en kısa rotayı hesaplar.
    Başlangıç noktası: ilk aktivite
    """
    if len(activity_ids) < 2:
        return {
            "route": activity_ids,
            "total_distance_km": 0,
            "segments": []
        }

    # Graf oluştur
    graph = build_graph(activity_ids)

    # Greedy nearest neighbor ile rota oluştur
    start = activity_ids[0]
    route = [start]
    unvisited = set(activity_ids[1:])
    total_distance = 0
    segments = []

    current = start
    while unvisited:
        # En yakın ziyaret edilmemiş aktiviteyi bul
        nearest = min(
            unvisited,
            key=lambda x: graph[current].get(x, float('inf'))
        )
        
        dist = graph[current][nearest]
        total_distance += dist
        
        segments.append({
            "from": current,
            "to": nearest,
            "distance_km": dist
        })
        
        route.append(nearest)
        unvisited.remove(nearest)
        current = nearest

    # Aktivite isimlerini ekle
    activity_map = {a["id"]: a["name"] for a in ACTIVITIES}
    
    named_route = [
        {"id": aid, "name": activity_map.get(aid, f"Aktivite {aid}")}
        for aid in route
    ]
    
    named_segments = [
        {
            "from_id": s["from"],
            "from_name": activity_map.get(s["from"], ""),
            "to_id": s["to"],
            "to_name": activity_map.get(s["to"], ""),
            "distance_km": s["distance_km"]
        }
        for s in segments
    ]

    return {
        "route": named_route,
        "total_distance_km": round(total_distance, 4),
        "segments": named_segments,
        "algorithm": "Dijkstra + Nearest Neighbor"
    }