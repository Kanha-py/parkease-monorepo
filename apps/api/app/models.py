# apps/api/app/models.py
from typing import Optional, List, Any
from datetime import datetime
from geoalchemy2 import Geography
from sqlmodel import SQLModel, Field
from sqlalchemy import Column, text, JSON
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
    is_blocked: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class PayoutAccount(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="user.id")
    account_type: str  # 'upi', 'bank_account'
    account_details_encrypted: str  # Encrypted JSON
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
