from datetime import date, timedelta

from fastapi.testclient import TestClient
from sqlalchemy import text

from app.db import SessionLocal, engine
from app.main import app
from app.models import Base
from app.seed import run_seed


def setup_data():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    run_seed()


def test_auth_register_and_login():
    setup_data()
    client = TestClient(app)

    register = client.post("/api/auth/register", json={"username": "sam", "password": "secret1234"})
    assert register.status_code == 200
    assert register.json()["token"]

    login = client.post("/api/auth/login", json={"username": "sam", "password": "secret1234"})
    assert login.status_code == 200
    assert login.json()["user"]["username"] == "sam"


def test_availability_and_user_reservation_flow():
    setup_data()
    client = TestClient(app)
    register = client.post("/api/auth/register", json={"username": "jerry", "password": "secret1234"})
    token = register.json()["token"]

    start = date.today() + timedelta(days=1)
    end = start + timedelta(days=3)
    dates = client.get(f"/api/availability/dates?seats=2&start={start}&stop={end}")
    assert dates.status_code == 200
    assert len(dates.json()) >= 1

    times = client.get(f"/api/availability/times?seats=2&date={start}")
    assert times.status_code == 200
    selected_time = times.json()[0]["time"]

    create = client.post(
        "/api/user/reservation",
        json={"party_size": 2, "date": start.isoformat(), "time": selected_time},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert create.status_code == 201

    listed = client.get("/api/user/reservation", headers={"Authorization": f"Bearer {token}"})
    assert listed.status_code == 200
    assert len(listed.json()) == 1

    reservation_id = listed.json()[0]["id"]
    deleted = client.delete(
        f"/api/user/reservation/{reservation_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert deleted.status_code == 200

    db = SessionLocal()
    try:
        count = db.execute(text("SELECT COUNT(*) FROM reservations WHERE status = 'booked'")).scalar_one()
    finally:
        db.close()
    assert count == 0


def test_management_upcoming_week_requires_token():
    setup_data()
    client = TestClient(app)

    unauthorized = client.get("/api/management/reservations/upcoming-week")
    assert unauthorized.status_code == 401

    authorized = client.get(
        "/api/management/reservations/upcoming-week",
        headers={"X-Management-Token": "local-management-token"},
    )
    assert authorized.status_code == 200
