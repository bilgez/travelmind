import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert "message" in response.json()

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_register_success():
    import time
    unique_email = f"test_{int(time.time())}@travelmind.com"
    response = client.post("/auth/register", json={
        "email": unique_email,
        "username": f"testuser_{int(time.time())}",
        "password": "test123"
    })
    assert response.status_code == 200
    assert response.json()["message"] == "Kayit basarili!"

def test_register_duplicate_email():
    # Aynı email ile tekrar kayıt olmaya çalış
    client.post("/auth/register", json={
        "email": "duplicate@travelmind.com",
        "username": "user1",
        "password": "test123"
    })
    response = client.post("/auth/register", json={
        "email": "duplicate@travelmind.com",
        "username": "user2",
        "password": "test123"
    })
    assert response.status_code == 400

def test_login_success():
    # Önce kayıt ol
    client.post("/auth/register", json={
        "email": "login_test@travelmind.com",
        "username": "logintest",
        "password": "test123"
    })
    # Sonra giriş yap
    response = client.post("/auth/login", json={
        "email": "login_test@travelmind.com",
        "password": "test123"
    })
    assert response.status_code == 200
    assert "access_token" in response.json()

def test_login_wrong_password():
    response = client.post("/auth/login", json={
        "email": "login_test@travelmind.com",
        "password": "yanlis_sifre"
    })
    assert response.status_code == 401