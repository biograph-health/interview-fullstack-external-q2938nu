import os
from datetime import date, timedelta

from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import and_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth import create_user_token, get_current_user, hash_password, verify_password
from app.db import get_db
from app.models import ReservationModel, TableModel, UserModel
from app.schemas import (
    AuthBody,
    AvailabilityRead,
    AvailabilityTableRead,
    ReservationCreateBody,
    ReservationRead,
    TableRead,
)

MANAGEMENT_API_TOKEN = os.getenv("MANAGEMENT_API_TOKEN", "local-management-token")
DEFAULT_TIME_SLOTS = ["17:30:00", "19:00:00", "20:30:00"]

app = FastAPI(title="Restaurant Interview API")
allowed_origins = os.getenv(
    "CORS_ALLOW_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001",
).split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def choose_table(db: Session, *, party_size: int, reservation_date: date, reservation_time: str) -> TableModel | None:
    tables = db.scalars(select(TableModel).where(TableModel.seats >= party_size).order_by(TableModel.seats, TableModel.id)).all()
    for table in tables:
        conflict = db.scalar(
            select(ReservationModel.id).where(
                and_(
                    ReservationModel.table_id == table.id,
                    ReservationModel.date == reservation_date,
                    ReservationModel.time == reservation_time,
                    ReservationModel.status == ReservationModel.STATUS_BOOKED,
                )
            )
        )
        if not conflict:
            return table
    return None


@app.post("/api/auth/register")
def register(body: AuthBody, db: Session = Depends(get_db)):
    existing = db.scalar(select(UserModel).where(UserModel.username == body.username))
    if existing:
        raise HTTPException(status_code=409, detail="Username already taken")

    user = UserModel(username=body.username, password_hash=hash_password(body.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"token": create_user_token(user), "user": {"id": user.id, "username": user.username}}


@app.post("/api/auth/login")
def login(body: AuthBody, db: Session = Depends(get_db)):
    user = db.scalar(select(UserModel).where(UserModel.username == body.username))
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {"token": create_user_token(user), "user": {"id": user.id, "username": user.username}}


@app.get("/api/availability/dates")
def availability_dates(start: date, stop: date, seats: int, db: Session = Depends(get_db)):
    available: list[str] = []
    current = start
    while current <= stop:
        for slot in DEFAULT_TIME_SLOTS:
            if choose_table(db, party_size=seats, reservation_date=current, reservation_time=slot):
                available.append(current.isoformat())
                break
        current += timedelta(days=1)
    return sorted(set(available))


@app.get("/api/availability/times", response_model=list[AvailabilityRead])
def availability_times(date: date, seats: int, db: Session = Depends(get_db)):
    response: list[AvailabilityRead] = []
    for slot in DEFAULT_TIME_SLOTS:
        table = choose_table(db, party_size=seats, reservation_date=date, reservation_time=slot)
        if table:
            response.append(
                AvailabilityRead(
                    time=slot,
                    table=AvailabilityTableRead(id=table.id, seats=table.seats),
                )
            )
    return response


@app.post("/api/user/reservation", response_model=ReservationRead, status_code=201)
def create_reservation(
    body: ReservationCreateBody,
    db: Session = Depends(get_db),
    user: UserModel = Depends(get_current_user),
):
    table = choose_table(db, party_size=body.party_size, reservation_date=body.date, reservation_time=body.time)
    if not table:
        raise HTTPException(status_code=409, detail="No table available")

    reservation = ReservationModel(
        table_id=table.id,
        user_id=user.id,
        party_size=body.party_size,
        date=body.date,
        time=body.time,
        status=ReservationModel.STATUS_BOOKED,
    )
    try:
        db.add(reservation)
        db.commit()
        db.refresh(reservation)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Reservation already booked") from exc

    return ReservationRead(
        id=reservation.id,
        party_size=reservation.party_size,
        date=reservation.date,
        time=reservation.time,
        status=reservation.status,
        table=TableRead(id=table.id, label=table.label, seats=table.seats),
    )


@app.get("/api/user/reservation", response_model=list[ReservationRead])
def list_user_reservations(db: Session = Depends(get_db), user: UserModel = Depends(get_current_user)):
    rows = db.scalars(
        select(ReservationModel)
        .where(
            and_(
                ReservationModel.user_id == user.id,
                ReservationModel.status == ReservationModel.STATUS_BOOKED,
            )
        )
        .order_by(ReservationModel.date, ReservationModel.time)
    ).all()
    return [
        ReservationRead(
            id=row.id,
            party_size=row.party_size,
            date=row.date,
            time=row.time,
            status=row.status,
            table=TableRead(id=row.table.id, label=row.table.label, seats=row.table.seats),
        )
        for row in rows
    ]


@app.delete("/api/user/reservation/{reservation_id}")
def delete_user_reservation(
    reservation_id: int,
    db: Session = Depends(get_db),
    user: UserModel = Depends(get_current_user),
):
    row = db.scalar(
        select(ReservationModel).where(
            and_(ReservationModel.id == reservation_id, ReservationModel.user_id == user.id)
        )
    )
    if not row:
        raise HTTPException(status_code=404, detail="Not found")
    row.status = ReservationModel.STATUS_CANCELLED
    db.commit()
    return {"deleted": reservation_id}


@app.get("/api/management/reservations/upcoming-week")
def list_upcoming_week(
    db: Session = Depends(get_db),
    x_management_token: str | None = Header(default=None),
):
    if x_management_token != MANAGEMENT_API_TOKEN:
        raise HTTPException(status_code=401, detail="Unauthorized")

    start = date.today()
    end = start + timedelta(days=7)
    rows = db.scalars(
        select(ReservationModel).where(
            and_(
                ReservationModel.date >= start,
                ReservationModel.date <= end,
                ReservationModel.status == ReservationModel.STATUS_BOOKED,
            )
        )
    ).all()

    return [
        {
            "id": row.id,
            "date": row.date.isoformat(),
            "time": row.time,
            "party_size": row.party_size,
            "username": row.user.username,
            "table": {"id": row.table.id, "label": row.table.label, "seats": row.table.seats},
        }
        for row in rows
    ]
