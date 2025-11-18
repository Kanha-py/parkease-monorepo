# apps/api/app/schemas.py
from pydantic import BaseModel
from typing import Optional
import uuid
from typing import List
from datetime import datetime


# --- Request Schemas ---
class OTPRequest(BaseModel):
    phone: str


class OTPVerify(BaseModel):
    phone: str
    otp: str
    name: str


class LoginRequest(BaseModel):
    email: str
    password: str


# --- Response Schemas ---
class UserRead(BaseModel):
    id: uuid.UUID
    name: str
    phone: str
    role: str
    email: Optional[str] = None


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserRead


class LotCreate(BaseModel):
    name: str
    address: str
    spot_type: str = "CAR"
    amenities: List[str] = []


class LotRead(BaseModel):
    id: uuid.UUID
    name: str
    address: str
    created_at: datetime


class AvailabilityCreate(BaseModel):
    spot_id: uuid.UUID
    start_time: datetime
    end_time: datetime


class PricingCreate(BaseModel):
    lot_id: uuid.UUID
    rate: float
    rate_type: str = "HOURLY"


# Response models
class AvailabilityRead(BaseModel):
    id: int
    start_time: datetime
    end_time: datetime
    status: str


class PricingRead(BaseModel):
    id: uuid.UUID
    rate: float
    rate_type: str


class SpotRead(BaseModel):
    id: uuid.UUID
    name: str
    spot_type: str


class LotReadWithSpots(LotRead):
    spots: List[SpotRead]


# --- Search Schemas ---
class SearchResult(BaseModel):
    lot_id: uuid.UUID
    name: str
    address: str
    # We return lat/lon as simple floats for the frontend map
    latitude: float
    longitude: float
    price: float  # The calculated total price
    rate_type: str

    class Config:
        from_attributes = True
