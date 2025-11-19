# apps/api/app/models.py
from typing import Optional, List, Any
from datetime import datetime
from geoalchemy2 import Geography
from sqlmodel import SQLModel, Field
from sqlalchemy import Column, text, JSON, BigInteger
import uuid


class User(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    phone: str = Field(index=True, unique=True, max_length=15)
    email: Optional[str] = Field(default=None, unique=True, max_length=255)
    password_hash: Optional[str] = Field(default=None)
    name: str = Field(max_length=100)
    role: str = Field(
        default="DRIVER", max_length=20
    )  # DRIVER, SELLER_C2B, OPERATOR_B2B
    profile_picture_url: Optional[str] = Field(default=None)
    default_vehicle_plate: Optional[str] = Field(default=None, max_length=20)
    is_blocked: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class PayoutAccount(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="user.id")
    account_type: str  # 'upi', 'bank_account'
    account_details_encrypted: str  # We will store raw JSON for MVP simplicity, encrypted in Prod
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


# 1. LotAmenity Class
class LotAmenity(SQLModel, table=True):
    lot_id: uuid.UUID = Field(foreign_key="parkinglot.id", primary_key=True)
    amenity_id: uuid.UUID = Field(foreign_key="amenity.id", primary_key=True)


# 2. Amenity Class
class Amenity(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(unique=True, index=True)
    icon_svg: Optional[str] = Field(default=None)


# 3. ParkingLot Class (Should NOT have lot_id or amenity_id)
class ParkingLot(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    owner_user_id: uuid.UUID = Field(foreign_key="user.id")
    name: str = Field(max_length=255)
    address: str
    location: Any = Field(sa_column=Column(Geography("POINT", srid=4326)))
    photos: Optional[List[str]] = Field(default=None, sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


# 4. ParkingSpot Class
class ParkingSpot(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    lot_id: uuid.UUID = Field(foreign_key="parkinglot.id")
    name: str = Field(max_length=50)
    spot_type: str = Field(max_length=20)


class SpotAvailability(SQLModel, table=True):
    # Use BigInteger for ID as this table grows very fast
    id: Optional[int] = Field(
        default=None, sa_column=Column(BigInteger, primary_key=True, autoincrement=True)
    )
    spot_id: uuid.UUID = Field(foreign_key="parkingspot.id", index=True)

    start_time: datetime = Field(index=True)
    end_time: datetime = Field(index=True)

    status: str = Field(default="AVAILABLE", max_length=20)  # 'AVAILABLE', 'BOOKED'
    booking_id: Optional[uuid.UUID] = Field(default=None)  # Link to Booking later


class PricingRule(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    lot_id: uuid.UUID = Field(foreign_key="parkinglot.id", index=True)

    name: str = Field(max_length=50)  # e.g. "Standard Hourly"
    rate: float = Field(default=0.0)
    rate_type: str = Field(default="HOURLY", max_length=20)  # 'HOURLY', 'FLAT'

    is_active: bool = Field(default=True)
    priority: int = Field(default=0)  # 0=Base, 10=Event (Higher overrides lower)


# --- Booking & Payment ---


class Booking(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)

    driver_user_id: uuid.UUID = Field(foreign_key="user.id")
    lot_id: uuid.UUID = Field(foreign_key="parkinglot.id")
    spot_id: uuid.UUID = Field(foreign_key="parkingspot.id")

    start_time: datetime = Field(index=True)
    end_time: datetime = Field(index=True)

    # Status: 'PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'
    status: str = Field(default="PENDING", max_length=20)

    # QR Code (Generated after payment)
    qr_code_data: Optional[str] = Field(default=None, unique=True)
    vehicle_plate: Optional[str] = Field(default=None)

    created_at: datetime = Field(default_factory=datetime.utcnow)


class Payment(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    booking_id: uuid.UUID = Field(foreign_key="booking.id")

    razorpay_order_id: str = Field(index=True)
    razorpay_payment_id: Optional[str] = Field(default=None)

    amount_charged: float
    commission_fee: float  # Our cut
    seller_payout_amount: float  # Seller's share

    # Status: 'PENDING', 'PAID_BY_DRIVER', 'PAYOUT_TO_SELLER_COMPLETE'
    status: str = Field(default="PENDING", max_length=50)

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
