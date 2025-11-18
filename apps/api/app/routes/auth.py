# apps/api/app/routes/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
import random

from app.db import get_session
from app.models import User
from app.schemas import OTPRequest, OTPVerify, LoginRequest, Token, UserRead
from app.security import create_access_token, verify_password, get_password_hash

router = APIRouter()

# Temporary storage for OTPs (For production, use Redis)
MOCK_OTP_DB = {}


@router.post("/register-with-phone")
async def register_with_phone(payload: OTPRequest):
    """
    Initiates login. Generates a random 6-digit OTP.
    """
    otp = str(random.randint(100000, 999999))
    MOCK_OTP_DB[payload.phone] = otp

    # --- DEV ONLY: PRINT OTP TO CONSOLE ---
    print(f"!!! DEV OTP for {payload.phone}: {otp} !!!")
    # --------------------------------------

    return {"message": "OTP sent successfully (Check server console)"}


@router.post("/verify-otp", response_model=Token)
async def verify_otp(payload: OTPVerify, session: AsyncSession = Depends(get_session)):
    """
    Verifies OTP. If user exists, logs them in. If not, creates new User.
    Returns JWT token.
    """
    # 1. Verify OTP
    stored_otp = MOCK_OTP_DB.get(payload.phone)
    if not stored_otp or stored_otp != payload.otp:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    # 2. Clear OTP
    del MOCK_OTP_DB[payload.phone]

    # 3. Check if user exists
    statement = select(User).where(User.phone == payload.phone)
    # FIX: Use .execute() instead of .exec() and .scalars().first()
    result = await session.execute(statement)
    user = result.scalars().first()

    # 4. Create user if they don't exist
    if not user:
        user = User(
            phone=payload.phone,
            name=payload.name,
            role="DRIVER",  # Default role
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)

    # 5. Generate JWT
    access_token = create_access_token(subject=user.id)

    return {"access_token": access_token, "token_type": "bearer", "user": user}


@router.post("/login-with-password", response_model=Token)
async def login_with_password(
    payload: LoginRequest, session: AsyncSession = Depends(get_session)
):
    """
    B2B / Admin login flow.
    """
    statement = select(User).where(User.email == payload.email)
    # FIX: Use .execute() and .scalars().first()
    result = await session.execute(statement)
    user = result.scalars().first()

    if (
        not user
        or not user.password_hash
        or not verify_password(payload.password, user.password_hash)
    ):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = create_access_token(subject=user.id)

    return {"access_token": access_token, "token_type": "bearer", "user": user}
