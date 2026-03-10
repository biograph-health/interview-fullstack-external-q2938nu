from datetime import date

from pydantic import BaseModel, Field


class AuthBody(BaseModel):
    username: str = Field(min_length=3, max_length=150)
    password: str = Field(min_length=8, max_length=150)


class ReservationCreateBody(BaseModel):
    party_size: int = Field(ge=1, le=20)
    date: date
    time: str


class TableRead(BaseModel):
    id: int
    label: str
    seats: int


class AvailabilityTableRead(BaseModel):
    id: int
    seats: int


class ReservationRead(BaseModel):
    id: int
    party_size: int
    date: date
    time: str
    status: str
    table: TableRead


class AvailabilityRead(BaseModel):
    time: str
    table: AvailabilityTableRead
