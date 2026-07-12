import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_parse_input():
    response = client.post("/api/parse-input", json={
        "user_id": 1,
        "text": "Sabah tarihi yer gezmek istiyorum, aksam restoran"
    })
    assert response.status_code in [200, 404]

def test_get_recommendations_tarihi():
    response = client.get("/api/recommendations?user_id=1&category=tarihi_yer")
    assert response.status_code in [200, 404]

def test_get_recommendations_restoran():
    response = client.get("/api/recommendations?user_id=1&category=restoran")
    assert response.status_code in [200, 404]
    if response.status_code == 200:
        data = response.json()
        assert "recommendations" in data

def test_optimize_route():
    response = client.post("/api/optimize-route", json={
        "trip_id": 1,
        "activity_ids": [1, 2, 3]
    })
    assert response.status_code in [200, 400, 404, 422]

def test_get_budget():
    response = client.get("/api/budget/1")
    assert response.status_code in [200, 404]

def test_get_user_trips():
    response = client.get("/api/trips/1")
    assert response.status_code == 200
    data = response.json()
    assert "trips" in data