from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy", "service": "ParkEase API"}

def test_keys_loaded():
    response = client.get("/api/health/keys")
    assert response.status_code == 200
    # This test will fail if you haven't added your keys to .env
    assert response.json()["twilio_loaded"] == True
    assert response.json()["google_loaded"] == True
