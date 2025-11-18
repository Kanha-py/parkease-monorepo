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
    # New fields for B2B
    name: str = "Standard Rate"
    priority: int = 0


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
    # New fields
    name: str
    priority: int
    is_active: bool


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


class BookingCreate(BaseModel):
    lot_id: uuid.UUID
    start_time: datetime
    end_time: datetime
    vehicle_type: str = "CAR"


class BookingResponse(BaseModel):
    booking_id: uuid.UUID
    razorpay_order_id: str
    amount: float
    currency: str
    status: str

