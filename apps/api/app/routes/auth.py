from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
import random
from twilio.rest import Client
import re  # <--- Import regex for cleaning up phone numbers

from app.db import get_session
from app.models import User
from app.schemas import (
    OTPRequest,
    OTPVerify,
    LoginRequest,
    Token,
    UserSignup,
    UserProfileUpdate,
    UserRead,
)
from app.security import create_access_token, verify_password, get_password_hash, get_current_user
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


@router.post("/login-request-otp")
async def login_request_otp(payload: OTPRequest):
    """
    Generates and sends an OTP for the Login flow.
    Does NOT check for existing users (allows re-login).
    """
    phone_key = standardize_phone(payload.phone)

    # Generate OTP
    otp = str(random.randint(100000, 999999))
    MOCK_OTP_DB[phone_key] = otp

    use_real_sms = (
        settings.TWILIO_ACCOUNT_SID
        and "dummy" not in settings.TWILIO_ACCOUNT_SID
        and settings.TWILIO_AUTH_TOKEN
    )

    if use_real_sms:
        try:
            client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
            client.messages.create(
                body=f"Your ParkEase login code is: {otp}",
                from_=settings.TWILIO_PHONE_NUMBER,
                to=phone_key,
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


@router.post("/register-with-phone")
async def register_with_phone(
    payload: OTPRequest, session: AsyncSession = Depends(get_session)
):
    """
    Initiates login.
    """
    # FIX: Standardize the phone number immediately
    phone_key = standardize_phone(payload.phone)
    statement = select(User).where(User.phone == phone_key)
    result = await session.execute(statement)
    existing_user = result.scalars().first()

    if existing_user:
        # User is already registered via phone. Raise Conflict error.
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,  # 409 Conflict is better than 400 here
            detail="Account already exists for this phone number. Please log in.",
        )
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


@router.post("/signup", response_model=Token)
async def signup_complete(  # <-- Corrected function name
    payload: UserSignup, session: AsyncSession = Depends(get_session)
):
    """
    Finalize user registration: verifies OTP, checks for existing accounts,
    creates user with email, phone, and hashed password.
    """
    if payload.password != payload.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match.")

    phone_key = standardize_phone(payload.phone)

    # 1. Re-Verify OTP (Critical step)
    stored_otp = MOCK_OTP_DB.get(phone_key)
    is_backdoor = payload.otp == "123456" and "dummy" in settings.TWILIO_ACCOUNT_SID

    if not is_backdoor:
        if not stored_otp or stored_otp != payload.otp:
            # Do not clear OTP on failed attempt
            raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    # 2. Clear OTP (Security: One-time use)
    if phone_key in MOCK_OTP_DB:
        del MOCK_OTP_DB[phone_key]

    # 3. Check for existing phone or email (Check if already registered)
    phone_stmt = select(User).where(User.phone == phone_key)
    email_stmt = select(User).where(User.email == payload.email)

    existing_by_phone = (await session.execute(phone_stmt)).scalars().first()
    if existing_by_phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone number is already registered. Please log in.",
        )

    existing_by_email = (await session.execute(email_stmt)).scalars().first()
    if existing_by_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email address is already registered.",
        )

    # 4. Hash password
    hashed_password = get_password_hash(payload.password)

    # 5. Create New User (Default to DRIVER role)
    new_user = User(
        phone=phone_key,
        email=payload.email,
        password_hash=hashed_password,
        name=payload.name,
        role="DRIVER",
    )

    session.add(new_user)
    await session.commit()
    await session.refresh(new_user)

    # 6. Generate JWT
    access_token = create_access_token(subject=new_user.id)

    return {"access_token": access_token, "token_type": "bearer", "user": new_user}


@router.post("/login-with-password", response_model=Token)
async def login_with_password(
    payload: LoginRequest, session: AsyncSession = Depends(get_session)
):
    """
    B2B / Admin login flow (remains unchanged)
    """
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


@router.patch("/profile", response_model=UserRead)
async def update_profile(
    payload: UserProfileUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Complete or Update user profile.
    """
    if payload.email:
        stmt = select(User).where(User.email == payload.email, User.id != current_user.id)
        existing = (await session.execute(stmt)).scalars().first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already in use.")

    current_user.name = payload.name
    current_user.email = payload.email
    # Only hash if password is provided/changed (simple check for MVP)
    if payload.password and len(payload.password) >= 6:
        current_user.password_hash = get_password_hash(payload.password)

    # Update Vehicle Plate
    if payload.default_vehicle_plate:
        current_user.default_vehicle_plate = payload.default_vehicle_plate.upper()

    session.add(current_user)
    await session.commit()
    await session.refresh(current_user)

    return current_user
