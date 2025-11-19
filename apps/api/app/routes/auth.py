from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
import random
from twilio.rest import Client
import re  # <--- Import regex for cleaning up phone numbers

from app.db import get_session
from app.models import User
from app.schemas import OTPRequest, OTPVerify, LoginRequest, Token
from app.security import create_access_token, verify_password
from app.config import settings

router = APIRouter()

# Temporary storage for OTPs (For production, use Redis)
MOCK_OTP_DB = {}


# Helper function to ensure consistent phone format
def standardize_phone(phone: str) -> str:
    """Removes non-digits and ensures +91 prefix for 10-digit Indian numbers."""
    cleaned = re.sub(r"\D", "", phone)
    if len(cleaned) == 10 and not phone.startswith("+"):
        return f"+91{cleaned}"
    elif cleaned and not phone.startswith("+"):
        return f"+{cleaned}"
    return phone  # Assume any other format is already correct or handled by Pydantic


@router.post("/register-with-phone")
async def register_with_phone(payload: OTPRequest):
    """
    Initiates login.
    """
    # FIX: Standardize the phone number immediately
    phone_key = standardize_phone(payload.phone)

    otp = str(random.randint(100000, 999999))
    MOCK_OTP_DB[phone_key] = otp  # <--- Store using the standardized key

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
                to=phone_key,  # <--- Send to the standardized number
            )
            return {"message": "OTP sent via SMS."}
        except Exception as e:
            print(f"Twilio Error: {e}")
            print(f"!!! FALLBACK OTP for {phone_key}: {otp} !!!")
            raise HTTPException(
                status_code=500, detail="Failed to send SMS. Check server logs."
            )
    else:
        # DEV MODE
        print(f"!!! DEV OTP for {phone_key}: {otp} !!!")
        return {"message": "OTP sent (Check server console)"}


@router.post("/verify-otp", response_model=Token)
async def verify_otp(payload: OTPVerify, session: AsyncSession = Depends(get_session)):
    """
    Verifies OTP. If user exists, logs them in. If not, creates new User.
    Returns JWT token.
    """
    # FIX: Standardize the phone number immediately
    phone_key = standardize_phone(payload.phone)

    # 1. Verify OTP
    stored_otp = MOCK_OTP_DB.get(phone_key)  # <--- Look up using the standardized key

    # Allow "123456" as a master backdoor key ONLY in Dev Mode (optional convenience)
    is_backdoor = payload.otp == "123456" and "dummy" in settings.TWILIO_ACCOUNT_SID

    if not is_backdoor:
        if not stored_otp or stored_otp != payload.otp:
            raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    # 2. Clear OTP (Security: One-time use)
    if phone_key in MOCK_OTP_DB:
        del MOCK_OTP_DB[phone_key]

    # 3. Check if user exists
    statement = select(User).where(
        User.phone == phone_key
    )  # <--- Use the standardized number for DB query
    result = await session.execute(statement)
    user = result.scalars().first()

    # 4. Create user if they don't exist
    if not user:
        user = User(
            phone=phone_key,  # <--- Store the standardized number
            name=payload.name,
            role="DRIVER",
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
    # This path does not need standardization if email is used as login key
    statement = select(User).where(User.email == payload.email)
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
