from typing import Optional, List, Any
from datetime import datetime
from geoalchemy2 import Geography
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import Column, JSON, BigInteger, String
from sqlalchemy.dialects import postgresql
import uuid


# --- 0. OTP Verification (NEW: Required for Auth) ---
class OTPVerification(SQLModel, table=True):
    phone: str = Field(primary_key=True, max_length=15)
    otp_code: str = Field(max_length=6)
    expires_at: datetime


# --- 1. Extended User Model ---
class User(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    phone: str = Field(index=True, unique=True, max_length=15)
    email: Optional[str] = Field(default=None, unique=True, max_length=255)
    password_hash: Optional[str] = Field(default=None)
    name: str = Field(max_length=100)
    role: str = Field(default="DRIVER", max_length=20)
    profile_picture_url: Optional[str] = Field(default=None)
    default_vehicle_plate: Optional[str] = Field(default=None, max_length=20)
    is_blocked: bool = Field(default=False)

    # New Profile Fields
    bio: Optional[str] = Field(default=None)
    work: Optional[str] = Field(default=None)
    location: Optional[str] = Field(default=None)
    school: Optional[str] = Field(default=None)
    languages: Optional[str] = Field(default=None)

    # Postgres Array for Tags
    interests: Optional[List[str]] = Field(
        default=None, sa_column=Column(postgresql.ARRAY(String))
    )

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    preferences: Optional["UserPreferences"] = Relationship(
        sa_relationship_kwargs={"uselist": False}, back_populates="user"
    )
    notification_settings: Optional["NotificationSettings"] = Relationship(
        sa_relationship_kwargs={"uselist": False}, back_populates="user"
    )


# --- 2. Account Settings Models ---


class UserPreferences(SQLModel, table=True):
    user_id: uuid.UUID = Field(foreign_key="user.id", primary_key=True)
    currency: str = Field(default="INR")
    language: str = Field(default="en")
    timezone: str = Field(default="Asia/Kolkata")

    user: User = Relationship(back_populates="preferences")


class NotificationSettings(SQLModel, table=True):
    user_id: uuid.UUID = Field(foreign_key="user.id", primary_key=True)
    email_messages: bool = Field(default=True)
    sms_messages: bool = Field(default=True)
    push_reminders: bool = Field(default=True)
    email_promotions: bool = Field(default=False)

    user: User = Relationship(back_populates="notification_settings")


class UserSession(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="user.id")
    device_name: str
    ip_address: str
    location: Optional[str] = None
    last_active: datetime = Field(default_factory=datetime.utcnow)
    is_current: bool = Field(default=False)


# --- 3. Financial & Inventory Models ---


class PayoutAccount(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="user.id")
    account_type: str
    account_details_encrypted: str
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class Amenity(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(unique=True, index=True)
    icon_svg: Optional[str] = Field(default=None)


class ParkingLot(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    owner_user_id: uuid.UUID = Field(foreign_key="user.id")
    name: str = Field(max_length=255)
    address: str
    location: Any = Field(sa_column=Column(Geography("POINT", srid=4326)))
    photos: Optional[List[str]] = Field(default=None, sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class LotAmenity(SQLModel, table=True):
    lot_id: uuid.UUID = Field(foreign_key="parkinglot.id", primary_key=True)
    amenity_id: uuid.UUID = Field(foreign_key="amenity.id", primary_key=True)


class ParkingSpot(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    lot_id: uuid.UUID = Field(foreign_key="parkinglot.id")
    name: str = Field(max_length=50)
    spot_type: str = Field(max_length=20)


class SpotAvailability(SQLModel, table=True):
    id: Optional[int] = Field(
        default=None, sa_column=Column(BigInteger, primary_key=True, autoincrement=True)
    )
    spot_id: uuid.UUID = Field(foreign_key="parkingspot.id", index=True)
    start_time: datetime = Field(index=True)
    end_time: datetime = Field(index=True)
    status: str = Field(default="AVAILABLE", max_length=20)
    booking_id: Optional[uuid.UUID] = Field(default=None)


class PricingRule(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    lot_id: uuid.UUID = Field(foreign_key="parkinglot.id", index=True)
    name: str = Field(max_length=50)
    rate: float = Field(default=0.0)
    rate_type: str = Field(default="HOURLY", max_length=20)
    is_active: bool = Field(default=True)
    priority: int = Field(default=0)


class Booking(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    driver_user_id: uuid.UUID = Field(foreign_key="user.id")
    lot_id: uuid.UUID = Field(foreign_key="parkinglot.id")
    spot_id: uuid.UUID = Field(foreign_key="parkingspot.id")
    start_time: datetime = Field(index=True)
    end_time: datetime = Field(index=True)
    status: str = Field(default="PENDING", max_length=20)
    qr_code_data: Optional[str] = Field(default=None, unique=True)
    vehicle_plate: Optional[str] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Payment(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    booking_id: uuid.UUID = Field(foreign_key="booking.id")
    razorpay_order_id: str = Field(index=True)
    razorpay_payment_id: Optional[str] = Field(default=None)
    amount_charged: float
    commission_fee: float
    seller_payout_amount: float
    status: str = Field(default="PENDING", max_length=50)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class Review(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    booking_id: uuid.UUID = Field(
        foreign_key="booking.id", unique=True
    )  # One review per booking
    reviewer_id: uuid.UUID = Field(foreign_key="user.id")
    lot_id: uuid.UUID = Field(foreign_key="parkinglot.id")
    rating: int = Field(ge=1, le=5)
    comment: Optional[str] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)
