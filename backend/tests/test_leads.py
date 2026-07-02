import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://df0a6413-e00c-4066-a98f-854c50facfe4.preview.emergentagent.com").rstrip("/")


@pytest.fixture
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


def test_root(client):
    r = client.get(f"{BASE_URL}/api/")
    assert r.status_code == 200
    assert r.json().get("status") == "ok"


def test_create_lead_and_persist(client):
    payload = {
        "name": "TEST_Lead",
        "email": "test_lead@example.com",
        "service": "Premium Website",
        "message": "Testing lead endpoint",
        "language": "pt",
    }
    r = client.post(f"{BASE_URL}/api/leads", json=payload)
    assert r.status_code == 201, r.text
    data = r.json()
    assert data["name"] == payload["name"]
    assert data["email"] == payload["email"]
    assert data["service"] == payload["service"]
    assert "id" in data and data["id"]
    assert "created_at" in data and data["created_at"]
    assert data["notified"] is False  # RESEND key empty

    # GET verifies persistence
    r2 = client.get(f"{BASE_URL}/api/leads")
    assert r2.status_code == 200
    leads = r2.json()
    assert any(l["email"] == payload["email"] and l["name"] == payload["name"] for l in leads)


def test_invalid_email(client):
    payload = {
        "name": "TEST_Bad",
        "email": "not-an-email",
        "service": "Automation",
        "message": "hi",
        "language": "en",
    }
    r = client.post(f"{BASE_URL}/api/leads", json=payload)
    assert r.status_code == 422


def test_missing_fields(client):
    r = client.post(f"{BASE_URL}/api/leads", json={"email": "a@b.com"})
    assert r.status_code == 422
