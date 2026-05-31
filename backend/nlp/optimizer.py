"""
optimizer.py  —  Rota optimizasyonu + ulaşım süreleri

Mevcut koddan değişmeyen kısımlar:
- get_activity_coordinates()  — JSON'dan dinamik koordinat
- haversine_distance()        — km hesabı
- build_graph()               — tam bağlı graf
- dijkstra()                  — en kısa yol
- optimize_route()            — nearest neighbor döngüsü

EKLENENLER:
- travel_times(distance_km)   → yürüme / araç / toplu taşıma süresi
- Her segment artık 3 mod süresini döner
- Çıktıya total_walk_min / total_drive_min / total_transit_min eklendi
"""

import heapq
import json
import os
import math

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BASE_DIR, "data", "antalya_activities.json")

with open(DATA_PATH, "r", encoding="utf-8") as f:
    ACTIVITIES = json.load(f)

# ──────────────────────────────────────────
# ULAŞIM HIZLARI
# ──────────────────────────────────────────

# Antalya şehir içi gerçekçi ortalamalar
WALK_KMH    = 5.0    # Yürüme
DRIVE_KMH   = 25.0   # Araç (şehir içi trafik dahil)
TRANSIT_KMH = 18.0   # Toplu taşıma (durak + bekleme dahil)

# Toplu taşıma sabit bekleme süresi (dakika)
TRANSIT_OVERHEAD_MIN = 5


def travel_times(distance_km: float) -> dict:
    """
    Verilen mesafe için 3 ulaşım modunda süre hesaplar.

    Returns:
        {
            "walk_min":    int,
            "drive_min":   int,
            "transit_min": int,
        }
    """
    walk_min    = max(1, round((distance_km / WALK_KMH) * 60))
    drive_min   = max(1, round((distance_km / DRIVE_KMH) * 60))
    transit_min = max(1, round((distance_km / TRANSIT_KMH) * 60 + TRANSIT_OVERHEAD_MIN))

    return {
        "walk_min":    walk_min,
        "drive_min":   drive_min,
        "transit_min": transit_min,
    }


# ──────────────────────────────────────────
# KOORDİNAT — JSON'dan dinamik
# ──────────────────────────────────────────

def get_activity_coordinates(activity_id: int) -> tuple | None:
    for activity in ACTIVITIES:
        if activity.get("id") == activity_id:
            lat = activity.get("lat")
            lng = activity.get("lng")
            if lat is not None and lng is not None:
                return (float(lat), float(lng))
    return None


# ──────────────────────────────────────────
# MESAFE
# ──────────────────────────────────────────

def haversine_distance(coord1: tuple, coord2: tuple) -> float:
    R = 6371
    lat1, lon1 = math.radians(coord1[0]), math.radians(coord1[1])
    lat2, lon2 = math.radians(coord2[0]), math.radians(coord2[1])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    return round(R * c, 4)


# ──────────────────────────────────────────
# GRAF
# ──────────────────────────────────────────

def build_graph(activity_ids: list) -> dict:
    graph = {aid: {} for aid in activity_ids}
    for i in range(len(activity_ids)):
        for j in range(len(activity_ids)):
            if i != j:
                id1, id2 = activity_ids[i], activity_ids[j]
                coord1 = get_activity_coordinates(id1)
                coord2 = get_activity_coordinates(id2)
                if coord1 and coord2:
                    graph[id1][id2] = haversine_distance(coord1, coord2)
    return graph


def dijkstra(graph: dict, start_id: int) -> dict:
    distances = {node: float('inf') for node in graph}
    distances[start_id] = 0
    pq = [(0, start_id)]
    while pq:
        current_dist, current_node = heapq.heappop(pq)
        if current_dist > distances[current_node]:
            continue
        for neighbor, weight in graph[current_node].items():
            distance = current_dist + weight
            if distance < distances[neighbor]:
                distances[neighbor] = distance
                heapq.heappush(pq, (distance, neighbor))
    return distances


# ──────────────────────────────────────────
# ANA FONKSİYON
# ──────────────────────────────────────────

def optimize_route(selected_activity_ids: list, user_coords: tuple = None) -> dict:
    """
    Kullanıcının seçtiği aktivitelerden optimize rota üretir.
    Her segmentte yürüme / araç / toplu taşıma süresi döner.

    Returns:
        {
            route, total_distance_km, segments,
            total_walk_min, total_drive_min, total_transit_min,
            algorithm
        }
    """
    if not selected_activity_ids:
        return {
            "route":              [],
            "total_distance_km":  0,
            "segments":           [],
            "total_walk_min":     0,
            "total_drive_min":    0,
            "total_transit_min":  0,
            "algorithm":          "Dijkstra + JSON Linked Dynamic Routing v2",
        }

    if user_coords is None:
        user_coords = (36.8850, 30.7020)  # Antalya Saat Kulesi

    graph          = build_graph(selected_activity_ids)
    route          = []
    current_coords = user_coords
    unvisited      = set(selected_activity_ids)
    total_distance = 0.0
    segments       = []

    while unvisited:
        nearest  = None
        min_dist = float('inf')

        for node in unvisited:
            node_coords = get_activity_coordinates(node)
            if not node_coords:
                continue

            if not route:
                dist = haversine_distance(user_coords, node_coords)
            else:
                dijkstra_distances = dijkstra(graph, route[-1])
                dist = dijkstra_distances.get(node, float('inf'))

            if dist < min_dist:
                min_dist = dist
                nearest  = node

        # Fallback: graf kopukluğu
        if nearest is None:
            nearest = min(
                unvisited,
                key=lambda x: haversine_distance(
                    current_coords, get_activity_coordinates(x)
                )
            )
            min_dist = haversine_distance(
                current_coords, get_activity_coordinates(nearest)
            )

        total_distance += min_dist

        # Ulaşım sürelerini hesapla
        times = travel_times(min_dist)

        segments.append({
            "from":        "Mevcut Konum" if not route else route[-1],
            "to":          nearest,
            "distance_km": round(min_dist, 4),
            **times,
        })

        route.append(nearest)
        unvisited.remove(nearest)
        current_coords = get_activity_coordinates(nearest)

    # Toplam süreler
    total_walk_min    = sum(s["walk_min"]    for s in segments)
    total_drive_min   = sum(s["drive_min"]   for s in segments)
    total_transit_min = sum(s["transit_min"] for s in segments)

    # İsim eşleştirme
    activity_map = {a["id"]: a["name"] for a in ACTIVITIES}

    named_route = [
        {"id": aid, "name": activity_map.get(aid, f"Aktivite {aid}")}
        for aid in route
    ]

    named_segments = [
        {
            "from_id":     s["from"],
            "from_name":   activity_map.get(s["from"], "Mevcut Konum")
                           if isinstance(s["from"], int) else s["from"],
            "to_id":       s["to"],
            "to_name":     activity_map.get(s["to"], ""),
            "distance_km": s["distance_km"],
            "walk_min":    s["walk_min"],
            "drive_min":   s["drive_min"],
            "transit_min": s["transit_min"],
        }
        for s in segments
    ]

    return {
        "route":              named_route,
        "total_distance_km":  round(total_distance, 4),
        "total_walk_min":     total_walk_min,
        "total_drive_min":    total_drive_min,
        "total_transit_min":  total_transit_min,
        "segments":           named_segments,
        "algorithm":          "Dijkstra + JSON Linked Dynamic Routing v2",
    }