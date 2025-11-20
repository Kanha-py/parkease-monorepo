from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
import uuid

from app.db import get_session
from app.models import User, PricingRule, ParkingLot

# UPDATED IMPORT: Added PricingRuleUpdate
from app.schemas import PricingCreate, PricingRead, PricingRuleUpdate
from app.deps import get_current_user

router = APIRouter()

# --- Endpoints ---


@router.get("/lots/{lot_id}/rules", response_model=list[PricingRead])
async def get_pricing_rules(
    lot_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """List all pricing rules for a specific lot."""
    # Verify Owner
    lot = await session.get(ParkingLot, lot_id)
    if not lot or lot.owner_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    stmt = (
        select(PricingRule)
        .where(PricingRule.lot_id == lot_id)
        .order_by(PricingRule.priority.desc())
    )
    result = await session.execute(stmt)
    return result.scalars().all()


@router.post("/lots/{lot_id}/rules", response_model=PricingRead)
async def create_pricing_rule(
    lot_id: uuid.UUID,
    payload: PricingCreate,
    priority: int = 0,  # Default to standard
    name: str = "Custom Rate",
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Create a new complex rule."""
    # Verify Owner
    lot = await session.get(ParkingLot, lot_id)
    if not lot or lot.owner_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    new_rule = PricingRule(
        lot_id=lot_id,
        name=name,
        rate=payload.rate,
        rate_type=payload.rate_type,
        is_active=True,
        priority=priority,
    )
    session.add(new_rule)
    await session.commit()
    await session.refresh(new_rule)
    return new_rule


@router.delete("/rules/{rule_id}")
async def delete_pricing_rule(
    rule_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Delete a rule."""
    rule = await session.get(PricingRule, rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")

    # Verify Owner (Indirectly via Lot)
    lot = await session.get(ParkingLot, rule.lot_id)
    if lot.owner_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    await session.delete(rule)
    await session.commit()
    return {"message": "Rule deleted"}
