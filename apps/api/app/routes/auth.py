# apps/api/app/routes/auth.py
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
import random
from twilio.rest import Client
import re
from typing import List  # <--- FIXED: Added List import
import uuid
from datetime import datetime
from app.db import get_session
from app.models import User, UserPreferences, NotificationSettings, UserSession
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

router = APIRouter()

MOCK_OTP_DB = {}


def standardize_phone(phone: str) -> str:
    cleaned = re.sub(r"\D", "", phone)
    if len(cleaned) == 10 and not phone.startswith("+"):
        return f"+91{cleaned}"
    elif cleaned and not phone.startswith("+"):
        return f"+{cleaned}"
    return phone


# ... (Existing Auth/OTP routes remain unchanged) ...
@router.post("/login-request-otp")
async def login_request_otp(payload: OTPRequest):
    phone_key = standardize_phone(payload.phone)
    otp = str(random.randint(100000, 999999))
    MOCK_OTP_DB[phone_key] = otp

    # ... Twilio Logic ...
    print(f"!!! DEV OTP for {phone_key}: {otp} !!!")
    return {"message": "OTP sent"}


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
            status_code=status.HTTP_409_CONFLICT, detail="Account exists."
        )

    otp = str(random.randint(100000, 999999))
    MOCK_OTP_DB[phone_key] = otp
    print(f"!!! DEV OTP for {phone_key}: {otp} !!!")
    return {"message": "OTP sent"}


@router.post("/verify-otp", response_model=Token)
async def verify_otp(payload: OTPVerify, session: AsyncSession = Depends(get_session)):
    phone_key = standardize_phone(payload.phone)
    stored_otp = MOCK_OTP_DB.get(phone_key)

    is_backdoor = payload.otp == "123456" and "dummy" in settings.TWILIO_ACCOUNT_SID
    if not is_backdoor and (not stored_otp or stored_otp != payload.otp):
        raise HTTPException(status_code=400, detail="Invalid OTP")

    if phone_key in MOCK_OTP_DB:
        del MOCK_OTP_DB[phone_key]

    statement = select(User).where(User.phone == phone_key)
    result = await session.execute(statement)
    user = result.scalars().first()

    if not user:
        user = User(phone=phone_key, name=payload.name, role="DRIVER")
        session.add(user)
        await session.commit()
        await session.refresh(user)

        # Initialize Default Settings
        session.add(UserPreferences(user_id=user.id))
        session.add(NotificationSettings(user_id=user.id))
        await session.commit()

    access_token = create_access_token(subject=user.id)
    return {"access_token": access_token, "token_type": "bearer", "user": user}


@router.post("/signup", response_model=Token)
async def signup_complete(
    payload: UserSignup, session: AsyncSession = Depends(get_session)
):
    if payload.password != payload.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match.")

    phone_key = standardize_phone(payload.phone)
    stored_otp = MOCK_OTP_DB.get(phone_key)
    is_backdoor = payload.otp == "123456" and "dummy" in settings.TWILIO_ACCOUNT_SID

    if not is_backdoor and (not stored_otp or stored_otp != payload.otp):
        raise HTTPException(status_code=400, detail="Invalid OTP")

    if phone_key in MOCK_OTP_DB:
        del MOCK_OTP_DB[phone_key]

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

    # Initialize Default Settings
    session.add(UserPreferences(user_id=new_user.id))
    session.add(NotificationSettings(user_id=new_user.id))
    await session.commit()

    access_token = create_access_token(subject=new_user.id)
    return {"access_token": access_token, "token_type": "bearer", "user": new_user}


@router.post("/login-with-password", response_model=Token)
async def login_with_password(
    payload: LoginRequest, session: AsyncSession = Depends(get_session)
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

    access_token = create_access_token(subject=user.id)
    return {"access_token": access_token, "token_type": "bearer", "user": user}


# --- UPDATED PROFILE ROUTE ---


@router.patch("/profile", response_model=UserRead)
async def update_profile(
    payload: UserProfileUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    # Email Uniqueness Check
    if payload.email and payload.email != current_user.email:
        stmt = select(User).where(User.email == payload.email)
        existing = (await session.execute(stmt)).scalars().first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already in use.")

    # Basic Fields
    current_user.name = payload.name
    current_user.email = payload.email

    # Password
    if payload.password and len(payload.password) >= 6:
        current_user.password_hash = get_password_hash(payload.password)

    # Vehicle
    if payload.default_vehicle_plate:
        current_user.default_vehicle_plate = payload.default_vehicle_plate.upper()

    # New Profile Fields
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


# --- NEW ACCOUNT SETTINGS ROUTES ---


@router.get("/settings/preferences", response_model=PreferencesRead)
async def get_preferences(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    stmt = select(UserPreferences).where(UserPreferences.user_id == current_user.id)
    prefs = (await session.execute(stmt)).scalars().first()

    if not prefs:
        # Create default if missing
        prefs = UserPreferences(user_id=current_user.id)
        session.add(prefs)
        await session.commit()
        await session.refresh(prefs)

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

    prefs.currency = payload.currency
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
        await session.refresh(notifs)

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

    notifs.email_messages = payload.email_messages
    notifs.sms_messages = payload.sms_messages
    notifs.push_reminders = payload.push_reminders
    notifs.email_promotions = payload.email_promotions

    session.add(notifs)
    await session.commit()
    await session.refresh(notifs)
    return notifs


@router.get("/settings/sessions", response_model=List[SessionRead])
async def get_sessions(
    request: Request,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    # In a real app, this table is populated by middleware on every request
    # For MVP, we mock the current session based on the request
    current_ip = request.client.host if request.client else "Unknown"

    mock_session = SessionRead(
        id=uuid.uuid4(),
        device_name="Current Browser",
        location="Detected Location",
        last_active=datetime.utcnow(),
        is_current=True,
    )
    return [mock_session]
