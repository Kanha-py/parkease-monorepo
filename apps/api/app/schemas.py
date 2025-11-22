# apps/api/app/schemas.py
from pydantic import BaseModel
from typing import Optional, List
import uuid
from datetime import datetime


# --- Request Schemas ---
class OTPRequest(BaseModel):
    phone: str


class OTPVerify(BaseModel):
    phone: str
    otp: str
    name: str


class UserSignup(BaseModel):
    phone: str
    otp: str
    name: str
    email: str
    password: str
    confirm_password: str = ""


class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None
    default_vehicle_plate: Optional[str] = None
    profile_picture_url: Optional[str] = None
    bio: Optional[str] = None
    work: Optional[str] = None
    location: Optional[str] = None
    school: Optional[str] = None
    languages: Optional[str] = None
    interests: Optional[List[str]] = None


class PreferencesUpdate(BaseModel):
    currency: str
    language: str


class NotificationsUpdate(BaseModel):
    email_messages: bool
    sms_messages: bool
    push_reminders: bool
    email_promotions: bool


# --- Response Schemas ---
class UserRead(BaseModel):
    id: uuid.UUID
    name: str
    phone: str
    role: str
    email: Optional[str] = None
    default_vehicle_plate: Optional[str] = None
    profile_picture_url: Optional[str] = None
    bio: Optional[str] = None
    work: Optional[str] = None
    location: Optional[str] = None
    school: Optional[str] = None
    languages: Optional[str] = None
    interests: Optional[List[str]] = None
    created_at: datetime


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserRead


class PreferencesRead(BaseModel):
    currency: str
    language: str
    timezone: str


class NotificationsRead(BaseModel):
    email_messages: bool
    sms_messages: bool
    push_reminders: bool
    email_promotions: bool


class SessionRead(BaseModel):
    id: uuid.UUID
    device_name: str
    location: Optional[str]
    last_active: datetime
    is_current: bool


# --- Core Domain Schemas ---


class LoginRequest(BaseModel):
    email: str
    password: str


class LotCreate(BaseModel):
    name: str
    address: str
    spot_type: str = "CAR"
    amenities: List[str] = []
    latitude: float | None = None
    longitude: float | None = None


class LotRead(BaseModel):
    id: uuid.UUID
    name: str
    address: str
    created_at: datetime


# --- RESTORED MISSING SCHEMAS ---
class SpotRead(BaseModel):
    id: uuid.UUID
    name: str
    spot_type: str


class LotReadWithSpots(LotRead):
    spots: List[SpotRead]


class LotDetails(LotRead):  # Keep this alias if other files use it
    spots: List[SpotRead]


# --------------------------------


class SearchResult(BaseModel):
    lot_id: uuid.UUID
    name: str
    address: str
    latitude: float
    longitude: float
    price: float
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


class PayoutAccountCreate(BaseModel):
    account_type: str = "upi"
    details: dict


class PayoutAccountRead(BaseModel):
    id: uuid.UUID
    account_type: str
    is_active: bool


class PricingCreate(BaseModel):
    lot_id: uuid.UUID
    rate: float
    rate_type: str = "HOURLY"
    name: str = "Standard Rate"
    priority: int = 0


class PricingRead(BaseModel):
    id: uuid.UUID
    rate: float
    rate_type: str
    name: str
    priority: int
    is_active: bool


class PricingRuleUpdate(BaseModel):
    name: Optional[str] = None
    rate: Optional[float] = None
    is_active: Optional[bool] = None
    priority: Optional[int] = None


class AvailabilityCreate(BaseModel):
    spot_id: uuid.UUID
    start_time: datetime
    end_time: datetime


class AvailabilityRead(BaseModel):
    id: int
    start_time: datetime
    end_time: datetime
    status: str


class ReviewCreate(BaseModel):
    booking_id: uuid.UUID
    rating: int
    comment: Optional[str] = None


class ReviewRead(BaseModel):
    id: uuid.UUID
    reviewer_name: str
    rating: int
    comment: Optional[str]
    created_at: datetime
