# apps/api/app/routes/payouts.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
import json

from app.db import get_session
from app.models import User, PayoutAccount
from app.schemas import PayoutAccountCreate, PayoutAccountRead
from app.security import get_current_user

router = APIRouter()


@router.post("/account", response_model=PayoutAccountRead)
async def create_or_update_payout_account(
    payload: PayoutAccountCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Link a payout method AND upgrade user to SELLER_C2B.
    """
    # 1. Handle Payout Account Logic
    stmt = select(PayoutAccount).where(PayoutAccount.user_id == current_user.id)
    existing_account = (await session.execute(stmt)).scalars().first()

    if existing_account:
        existing_account.account_type = payload.account_type
        existing_account.account_details_encrypted = json.dumps(payload.details)
        session.add(existing_account)
        response_account = existing_account
    else:
        new_account = PayoutAccount(
            user_id=current_user.id,
            account_type=payload.account_type,
            account_details_encrypted=json.dumps(payload.details),
        )
        session.add(new_account)
        response_account = new_account

    # 2. CRITICAL: Upgrade User Role if they are just a DRIVER
    if current_user.role == "DRIVER":
        current_user.role = "SELLER_C2B"
        session.add(current_user)

    await session.commit()
    await session.refresh(response_account)

    return response_account


@router.get("/account", response_model=PayoutAccountRead)
async def get_my_payout_account(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    stmt = select(PayoutAccount).where(PayoutAccount.user_id == current_user.id)
    account = (await session.execute(stmt)).scalars().first()
    if not account:
        raise HTTPException(status_code=404, detail="No payout account found")
    return account
