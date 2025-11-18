from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
import random
from twilio.rest import Client # <--- Import Twilio Client

from app.db import get_session
from app.models import User
from app.schemas import OTPRequest, OTPVerify, LoginRequest, Token
from app.security import create_access_token, verify_password
from app.config import settings # <--- Import Settings

router = APIRouter()

# Temporary storage for OTPs (For production, use Redis)
MOCK_OTP_DB = {}

@router.post("/register-with-phone")
async def register_with_phone(payload: OTPRequest):
    """
    Initiates login.
    - If REAL keys are present: Sends SMS via Twilio.
    - If DUMMY keys are present: Prints OTP to Console (Dev Mode).
    """
    otp = str(random.randint(100000, 999999))
    MOCK_OTP_DB[payload.phone] = otp

    # Check if keys are valid (Not "dummy" and not empty)
    use_real_sms = (
        settings.TWILIO_ACCOUNT_SID
        and "dummy" not in settings.TWILIO_ACCOUNT_SID
        and settings.TWILIO_AUTH_TOKEN
    )

    if use_real_sms:
        try:
            client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
            message = client.messages.create(
                body=f"Your ParkEase verification code is: {otp}",
                from_=settings.TWILIO_PHONE_NUMBER,
                to=payload.phone
            )
            return {"message": "OTP sent via SMS."}
        except Exception as e:
            print(f"Twilio Error: {e}")
            # Fallback to console if SMS fails (optional, good for debugging)
            print(f"!!! FALLBACK OTP for {payload.phone}: {otp} !!!")
            raise HTTPException(status_code=500, detail="Failed to send SMS. Check server logs.")
    else:
        # DEV MODE
        print(f"!!! DEV OTP for {payload.phone}: {otp} !!!")
        return {"message": "OTP sent (Check server console)"}

@router.post("/verify-otp", response_model=Token)
async def verify_otp(payload: OTPVerify, session: AsyncSession = Depends(get_session)):
    """
    Verifies OTP. If user exists, logs them in. If not, creates new User.
    Returns JWT token.
    """
    # 1. Verify OTP
    stored_otp = MOCK_OTP_DB.get(payload.phone)

    # Allow "123456" as a master backdoor key ONLY in Dev Mode (optional convenience)
    is_backdoor = payload.otp == "123456" and "dummy" in settings.TWILIO_ACCOUNT_SID

    if not is_backdoor:
        if not stored_otp or stored_otp != payload.otp:
            raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    # 2. Clear OTP (Security: One-time use)
    if payload.phone in MOCK_OTP_DB:
        del MOCK_OTP_DB[payload.phone]

    # 3. Check if user exists
    statement = select(User).where(User.phone == payload.phone)
    result = await session.execute(statement)
    user = result.scalars().first()

    # 4. Create user if they don't exist
    if not user:
        user = User(
            phone=payload.phone,
            name=payload.name,
            role="DRIVER" # Default role
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)

    # 5. Generate JWT
    access_token = create_access_token(subject=user.id)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.post("/login-with-password", response_model=Token)
async def login_with_password(payload: LoginRequest, session: AsyncSession = Depends(get_session)):
    """
    B2B / Admin login flow.
    """
    statement = select(User).where(User.email == payload.email)
    result = await session.execute(statement)
    user = result.scalars().first()

    if not user or not user.password_hash or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = create_access_token(subject=user.id)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }
