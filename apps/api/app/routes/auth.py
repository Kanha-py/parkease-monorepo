# apps/api/app/routes/auth.py
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from twilio.rest import Client
import random
import re
from typing import List
from datetime import datetime

from app.db import get_session
from app.models import (
    User,
    UserPreferences,
    NotificationSettings,
    UserSession,
)
from app.schemas import (
    OTPRequest,
    OTPVerify,
    LoginRequest,
    Token,
    UserSignup,
    UserProfileUpdate,
    UserRead,
    PreferencesRead,
    PreferencesUpdate,
    NotificationsRead,
    NotificationsUpdate,
    SessionRead,
)
from app.security import (
    create_access_token,
    verify_password,
    get_password_hash,
    get_current_user,
)
from app.config import settings
from app.core.redis_client import redis_client

router = APIRouter()

# Initialize Twilio
twilio_client = (
    Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
    if settings.TWILIO_ACCOUNT_SID and "dummy" not in settings.TWILIO_ACCOUNT_SID
    else None
)

OTP_EXPIRY_SECONDS = 300


def standardize_phone(phone: str) -> str:
    cleaned = re.sub(r"\D", "", phone)
    if len(cleaned) == 10 and not phone.startswith("+"):
        return f"+91{cleaned}"
    elif cleaned and not phone.startswith("+"):
        return f"+{cleaned}"
    return phone


# --- 1. OTP & Registration Routes ---


@router.post("/register-with-phone")
async def register_with_phone(
    payload: OTPRequest, session: AsyncSession = Depends(get_session)
):
    phone_key = standardize_phone(payload.phone)

    statement = select(User).where(User.phone == phone_key)
    result = await session.execute(statement)
    existing_user = result.scalars().first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Account exists. Please login."
        )

    otp = str(random.randint(100000, 999999))
    await redis_client.set(f"otp:{phone_key}", otp, ex=OTP_EXPIRY_SECONDS)

    try:
        if twilio_client:
            twilio_client.messages.create(
                body=f"Your ParkEase verification code is: {otp}",
                from_=settings.TWILIO_PHONE_NUMBER,
                to=phone_key,
            )
        else:
            print(f"!!! DEV REGISTER OTP for {phone_key}: {otp} !!!")
    except Exception as e:
        print(f"Twilio Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to send SMS.")

    return {"message": "OTP sent successfully"}


@router.post("/login-request-otp")
async def login_request_otp(
    payload: OTPRequest, session: AsyncSession = Depends(get_session)
):
    phone_key = standardize_phone(payload.phone)

    statement = select(User).where(User.phone == phone_key)
    result = await session.execute(statement)
    user = result.scalars().first()

    if not user:
        raise HTTPException(
            status_code=404, detail="Account not found. Please register first."
        )

    otp = str(random.randint(100000, 999999))
    await redis_client.set(f"otp:{phone_key}", otp, ex=OTP_EXPIRY_SECONDS)

    try:
        if twilio_client:
            twilio_client.messages.create(
                body=f"Your ParkEase login code is: {otp}",
                from_=settings.TWILIO_PHONE_NUMBER,
                to=phone_key,
            )
        else:
            print(f"!!! DEV LOGIN OTP for {phone_key}: {otp} !!!")
    except Exception as e:
        print(f"Twilio Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to send SMS.")

    return {"message": "OTP sent"}


@router.post("/verify-otp", response_model=Token)
async def verify_otp(
    request: Request, payload: OTPVerify, session: AsyncSession = Depends(get_session)
):
    phone_key = standardize_phone(payload.phone)
    stored_otp = await redis_client.get(f"otp:{phone_key}")

    is_backdoor = payload.otp == "123456" and (
        not settings.TWILIO_ACCOUNT_SID or "dummy" in settings.TWILIO_ACCOUNT_SID
    )

    if not is_backdoor:
        if not stored_otp:
            raise HTTPException(status_code=400, detail="OTP expired or invalid.")
        if stored_otp != payload.otp:
            raise HTTPException(status_code=400, detail="Incorrect OTP.")
        await redis_client.delete(f"otp:{phone_key}")

    statement = select(User).where(User.phone == phone_key)
    result = await session.execute(statement)
    user = result.scalars().first()

    if not user:
        user = User(phone=phone_key, name=payload.name or "User", role="DRIVER")
        session.add(user)
        await session.commit()
        await session.refresh(user)

        session.add(UserPreferences(user_id=user.id))
        session.add(NotificationSettings(user_id=user.id))

    new_session = UserSession(
        user_id=user.id,
        device_name=request.headers.get("User-Agent", "Unknown"),
        ip_address=request.client.host or "Unknown",
        is_current=True,
        last_active=datetime.utcnow(),
    )
    session.add(new_session)
    await session.commit()

    access_token = create_access_token(subject=str(user.id))
    return {"access_token": access_token, "token_type": "bearer", "user": user}


@router.post("/signup", response_model=Token)
async def signup_complete(
    request: Request, payload: UserSignup, session: AsyncSession = Depends(get_session)
):
    if payload.password != payload.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match.")

    phone_key = standardize_phone(payload.phone)
    stored_otp = await redis_client.get(f"otp:{phone_key}")
    is_backdoor = payload.otp == "123456" and (
        not settings.TWILIO_ACCOUNT_SID or "dummy" in settings.TWILIO_ACCOUNT_SID
    )

    if not is_backdoor:
        if not stored_otp or stored_otp != payload.otp:
            raise HTTPException(status_code=400, detail="Invalid OTP.")
        await redis_client.delete(f"otp:{phone_key}")

    hashed_password = get_password_hash(payload.password)
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

    session.add(UserPreferences(user_id=new_user.id))
    session.add(NotificationSettings(user_id=new_user.id))

    new_session = UserSession(
        user_id=new_user.id,
        device_name=request.headers.get("User-Agent", "Unknown"),
        ip_address=request.client.host or "Unknown",
        is_current=True,
        last_active=datetime.utcnow(),
    )
    session.add(new_session)
    await session.commit()

    access_token = create_access_token(subject=str(new_user.id))
    return {"access_token": access_token, "token_type": "bearer", "user": new_user}


@router.post("/login-with-password", response_model=Token)
async def login_with_password(
    request: Request,
    payload: LoginRequest,
    session: AsyncSession = Depends(get_session),
):
    statement = select(User).where(User.email == payload.email)
    result = await session.execute(statement)
    user = result.scalars().first()

    if (
        not user
        or not user.password_hash
        or not verify_password(payload.password, user.password_hash)
    ):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    new_session = UserSession(
        user_id=user.id,
        device_name=request.headers.get("User-Agent", "Unknown"),
        ip_address=request.client.host or "Unknown",
        is_current=True,
        last_active=datetime.utcnow(),
    )
    session.add(new_session)
    await session.commit()

    access_token = create_access_token(subject=str(user.id))
    return {"access_token": access_token, "token_type": "bearer", "user": user}


# --- 2. Profile & Settings Routes (FIXED) ---


@router.patch("/profile", response_model=UserRead)
async def update_profile(
    payload: UserProfileUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Updates user profile. Fields not sent (None) are ignored.
    """
    # Email Uniqueness Check
    if payload.email and payload.email != current_user.email:
        stmt = select(User).where(User.email == payload.email)
        existing = (await session.execute(stmt)).scalars().first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already in use.")

    # Only update fields that are present in the payload
    if payload.name is not None:
        current_user.name = payload.name
    if payload.email is not None:
        current_user.email = payload.email
    if payload.password and len(payload.password) >= 6:
        current_user.password_hash = get_password_hash(payload.password)
    if payload.default_vehicle_plate is not None:
        current_user.default_vehicle_plate = payload.default_vehicle_plate.upper()
    if payload.profile_picture_url is not None:
        current_user.profile_picture_url = payload.profile_picture_url
    if payload.bio is not None:
        current_user.bio = payload.bio
    if payload.work is not None:
        current_user.work = payload.work
    if payload.location is not None:
        current_user.location = payload.location
    if payload.school is not None:
        current_user.school = payload.school
    if payload.languages is not None:
        current_user.languages = payload.languages
    if payload.interests is not None:
        current_user.interests = payload.interests

    session.add(current_user)
    await session.commit()
    await session.refresh(current_user)
    return current_user


@router.get("/settings/preferences", response_model=PreferencesRead)
async def get_preferences(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    stmt = select(UserPreferences).where(UserPreferences.user_id == current_user.id)
    prefs = (await session.execute(stmt)).scalars().first()
    if not prefs:
        prefs = UserPreferences(user_id=current_user.id)
        session.add(prefs)
        await session.commit()
    return prefs


@router.put("/settings/preferences", response_model=PreferencesRead)
async def update_preferences(
    payload: PreferencesUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    stmt = select(UserPreferences).where(UserPreferences.user_id == current_user.id)
    prefs = (await session.execute(stmt)).scalars().first()
    if not prefs:
        prefs = UserPreferences(user_id=current_user.id)

    if payload.currency:
        prefs.currency = payload.currency
    if payload.language:
        prefs.language = payload.language

    session.add(prefs)
    await session.commit()
    await session.refresh(prefs)
    return prefs


@router.get("/settings/notifications", response_model=NotificationsRead)
async def get_notifications(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    stmt = select(NotificationSettings).where(
        NotificationSettings.user_id == current_user.id
    )
    notifs = (await session.execute(stmt)).scalars().first()
    if not notifs:
        notifs = NotificationSettings(user_id=current_user.id)
        session.add(notifs)
        await session.commit()
    return notifs


@router.put("/settings/notifications", response_model=NotificationsRead)
async def update_notifications(
    payload: NotificationsUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    stmt = select(NotificationSettings).where(
        NotificationSettings.user_id == current_user.id
    )
    notifs = (await session.execute(stmt)).scalars().first()
    if not notifs:
        notifs = NotificationSettings(user_id=current_user.id)

    if payload.email_messages is not None:
        notifs.email_messages = payload.email_messages
    if payload.sms_messages is not None:
        notifs.sms_messages = payload.sms_messages
    if payload.push_reminders is not None:
        notifs.push_reminders = payload.push_reminders
    if payload.email_promotions is not None:
        notifs.email_promotions = payload.email_promotions

    session.add(notifs)
    await session.commit()
    await session.refresh(notifs)
    return notifs


@router.get("/settings/sessions", response_model=List[SessionRead])
async def get_sessions(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    stmt = (
        select(UserSession)
        .where(UserSession.user_id == current_user.id)
        .order_by(UserSession.last_active.desc())
    )
    result = await session.execute(stmt)
    return result.scalars().all()
