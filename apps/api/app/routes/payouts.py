from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from sqlalchemy import func
import uuid

from app.db import get_session
from app.models import Payment, Booking, ParkingLot, User
from app.deps import get_current_user

router = APIRouter()

@router.post("/trigger-weekly-payouts")
async def trigger_payouts(
    # In prod, secure this with a Super Admin check
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    1. Find all payments that are 'PAID_BY_DRIVER'.
    2. Group them by Seller.
    3. 'Send' the money (Mocked for MVP).
    4. Update status to 'PAYOUT_TO_SELLER_COMPLETE'.
    """

    # 1. Fetch pending payouts
    # Join Payment -> Booking -> Lot -> Owner
    stmt = (
        select(Payment, ParkingLot.owner_user_id, User.name)
        .join(Booking, Payment.booking_id == Booking.id)
        .join(ParkingLot, Booking.lot_id == ParkingLot.id)
        .join(User, ParkingLot.owner_user_id == User.id)
        .where(Payment.status == "PAID_BY_DRIVER")
    )

    result = await session.execute(stmt)
    rows = result.all()

    if not rows:
        return {"message": "No pending payouts found."}

    # 2. Group by Seller
    payouts = {}
    for payment, owner_id, owner_name in rows:
        if owner_id not in payouts:
            payouts[owner_id] = {
                "name": owner_name,
                "total_amount": 0,
                "payment_ids": []
            }

        payouts[owner_id]["total_amount"] += payment.seller_payout_amount
        payouts[owner_id]["payment_ids"].append(payment.id)

    # 3. Process Payouts
    results_log = []

    for owner_id, data in payouts.items():
        # --- RAZORPAY PAYOUTS API CALL WOULD GO HERE ---
        # client.payout.create({
        #   "account_number": "...",
        #   "amount": data["total_amount"] * 100,
        #   ...
        # })
        # -----------------------------------------------

        # For MVP, we assume success
        results_log.append(f"Paid ₹{data['total_amount']} to {data['name']}")

        # 4. Update Database
        for payment_id in data["payment_ids"]:
            payment = await session.get(Payment, payment_id)
            payment.status = "PAYOUT_TO_SELLER_COMPLETE"
            session.add(payment)

    await session.commit()

    return {
        "success": True,
        "payouts_processed": len(payouts),
        "details": results_log
    }

@router.get("/my-earnings")
async def get_my_earnings(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Returns total earnings for the logged-in seller.
    """
    stmt = (
        select(
            func.sum(Payment.seller_payout_amount).label("total_earned"),
            func.count(Payment.id).label("total_bookings")
        )
        .join(Booking, Payment.booking_id == Booking.id)
        .join(ParkingLot, Booking.lot_id == ParkingLot.id)
        .where(ParkingLot.owner_user_id == current_user.id)
        .where(Payment.status == "PAYOUT_TO_SELLER_COMPLETE")
    )

    result = await session.execute(stmt)
    earned, count = result.one()

    return {
        "total_earnings": earned or 0.0,
        "completed_payouts": count or 0
    }
