from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from datetime import datetime
from pytz import timezone
import uuid

from app.db import get_session
from app.models import User, ParkingLot, ParkingSpot, SpotAvailability, PricingRule
from app.schemas import AvailabilityCreate, PricingCreate, PricingRead, AvailabilityRead
from app.deps import get_current_user

router = APIRouter()

# Helper: IST Timezone
IST = timezone("Asia/Kolkata")


@router.post("/availability", response_model=list[AvailabilityRead])
async def set_availability(
    payload: AvailabilityCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """
    Sets availability for a spot.
    Input times are assumed to be IST intent, converted to UTC for storage.
    """
    # 1. Verify Ownership
    spot = await session.get(ParkingSpot, payload.spot_id)
    if not spot:
        raise HTTPException(status_code=404, detail="Spot not found")

    lot = await session.get(ParkingLot, spot.lot_id)
    if lot.owner_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    # 2. Handle Timezones (Strict IST)
    # If the frontend sends ISO strings, we ensure they are treated as IST
    if payload.start_time.tzinfo is None:
        start_ist = IST.localize(payload.start_time)
    else:
        start_ist = payload.start_time.astimezone(IST)

    if payload.end_time.tzinfo is None:
        end_ist = IST.localize(payload.end_time)
    else:
        end_ist = payload.end_time.astimezone(IST)

    # Save as naive UTC (Standard DB format)
    start_db = start_ist.replace(tzinfo=None)
    end_db = end_ist.replace(tzinfo=None)

    # 3. Create Availability Window
    new_availability = SpotAvailability(
        spot_id=payload.spot_id,
        start_time=start_db,
        end_time=end_db,
        status="AVAILABLE",
    )
    session.add(new_availability)
    await session.commit()
    await session.refresh(new_availability)

    return [new_availability]


@router.post("/pricing", response_model=PricingRead)
async def set_pricing(
    payload: PricingCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """
    Sets the base price for the lot (Simple C2B interface).
    """
    # 1. Verify Ownership
    lot = await session.get(ParkingLot, payload.lot_id)
    if not lot or lot.owner_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    # 2. Create/Update Default Rule
    # For C2B, we often just have one main rule.
    # We deactivate old rules to keep it simple.
    stmt = select(PricingRule).where(PricingRule.lot_id == payload.lot_id)
    existing_rules = (await session.execute(stmt)).scalars().all()
    for rule in existing_rules:
        rule.is_active = False
        session.add(rule)

    new_rule = PricingRule(
        lot_id=payload.lot_id,
        name="Standard Rate",
        rate=payload.rate,
        rate_type=payload.rate_type,
        is_active=True,
        priority=0,
    )
    session.add(new_rule)
    await session.commit()
    await session.refresh(new_rule)

    return new_rule
