from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from pytz import timezone
from app.db import get_session
from app.models import User, SpotAvailability, PricingRule, ParkingSpot, ParkingLot
from app.schemas import AvailabilityCreate, AvailabilityRead, PricingCreate, PricingRead
from app.deps import get_current_user

router = APIRouter()


@router.post("/availability", response_model=AvailabilityRead)
async def set_availability(
    payload: AvailabilityCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    # 1. Verify Ownership
    # We need to join Spot -> Lot -> Owner to check permissions
    statement = (
        select(ParkingSpot)
        .join(ParkingLot)
        .where(ParkingSpot.id == payload.spot_id)
        .where(ParkingLot.owner_user_id == current_user.id)
    )
    result = await session.execute(statement)
    spot = result.scalars().first()

    if not spot:
        raise HTTPException(
            status_code=404, detail="Spot not found or you don't own it."
        )
    ist = timezone("Asia/Kolkata")
    start_ist = payload.start_time.astimezone(ist)
    end_ist = payload.end_time.astimezone(ist)

    # 2. Create Availability
    # In a real app, we would check for overlapping time slots here!
    new_avail = SpotAvailability(
        spot_id=payload.spot_id,
        start_time=start_ist.replace(tzinfo=None),
        end_time=end_ist.replace(tzinfo=None),
        status="AVAILABLE",
    )

    session.add(new_avail)
    await session.commit()
    await session.refresh(new_avail)
    return new_avail


@router.post("/pricing", response_model=PricingRead)
async def set_pricing(
    payload: PricingCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    # 1. Verify Ownership
    statement = select(ParkingLot).where(
        ParkingLot.id == payload.lot_id, ParkingLot.owner_user_id == current_user.id
    )
    result = await session.execute(statement)
    lot = result.scalars().first()

    if not lot:
        raise HTTPException(
            status_code=404, detail="Lot not found or you don't own it."
        )

    # 2. Deactivate old rules (Simple C2B Logic: One active price at a time)
    # In Phase 3, we will allow multiple rules.
    existing_rules_stmt = select(PricingRule).where(
        PricingRule.lot_id == payload.lot_id
    )
    result = await session.execute(existing_rules_stmt)
    existing_rules = result.scalars().all()

    for rule in existing_rules:
        rule.is_active = False
        session.add(rule)

    # 3. Create new rule
    new_rule = PricingRule(
        lot_id=payload.lot_id,
        name="Standard Rate",
        rate=payload.rate,
        rate_type=payload.rate_type,
        is_active=True,
    )

    session.add(new_rule)
    await session.commit()
    await session.refresh(new_rule)
    return new_rule
