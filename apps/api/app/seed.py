from datetime import date, timedelta

from sqlalchemy import select

from app.auth import hash_password
from app.db import SessionLocal
from app.models import ReservationModel, TableModel, UserModel


def run_seed() -> None:
    db = SessionLocal()
    try:
        defaults = [("T1", 2), ("T2", 2), ("T3", 4), ("T4", 4), ("T5", 6)]
        for label, seats in defaults:
            table = db.scalar(select(TableModel).where(TableModel.label == label))
            if not table:
                db.add(TableModel(label=label, seats=seats))

        fixture_users = [
            ("demo-user", "demo12345"),
            ("alex", "demo12345"),
            ("sam", "demo12345"),
            ("riley", "demo12345"),
            ("jordan", "demo12345"),
        ]
        for username, password in fixture_users:
            user = db.scalar(select(UserModel).where(UserModel.username == username))
            if not user:
                user = UserModel(username=username, password_hash=hash_password(password))
                db.add(user)
            else:
                user.password_hash = hash_password(password)

        db.commit()

        tables = db.scalars(select(TableModel).order_by(TableModel.id)).all()
        users = db.scalars(select(UserModel).order_by(UserModel.id)).all()
        if len(tables) < 3 or len(users) < 4:
            return

        start = date.today() + timedelta(days=1)
        fixture_reservations = [
            (tables[0].id, users[1].id, 2, start, "17:30:00"),
            (tables[1].id, users[2].id, 2, start, "19:00:00"),
            (tables[2].id, users[3].id, 4, start + timedelta(days=1), "20:30:00"),
            (tables[2].id, users[1].id, 4, start + timedelta(days=2), "17:30:00"),
        ]

        for table_id, user_id, party_size, reservation_date, reservation_time in fixture_reservations:
            existing = db.scalar(
                select(ReservationModel).where(
                    ReservationModel.table_id == table_id,
                    ReservationModel.date == reservation_date,
                    ReservationModel.time == reservation_time,
                )
            )
            if existing:
                continue
            db.add(
                ReservationModel(
                    table_id=table_id,
                    user_id=user_id,
                    party_size=party_size,
                    date=reservation_date,
                    time=reservation_time,
                    status=ReservationModel.STATUS_BOOKED,
                )
            )

        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    run_seed()
