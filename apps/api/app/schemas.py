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
