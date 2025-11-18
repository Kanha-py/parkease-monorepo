# apps/api/app/models.py
from typing import Optional
from datetime import datetime
from sqlmodel import SQLModel, Field
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
