from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
import json
import razorpay

from app.db import get_session
from app.models import User, PayoutAccount, Payment, Booking, ParkingLot
from app.schemas import PayoutAccountCreate, PayoutAccountRead
from app.security import get_current_user
from app.config import settings
from app.services.notifications import notify_payout_processed
from app.services.logger import log_event

router = APIRouter()

# Initialize Razorpay Client (for Payouts/Razorpay X)
# Note: Standard client is for collections. Razorpay X usually requires a separate client
# or specific API calls, but we use the standard client for the MVP simulation.
razorpay_client = razorpay.Client(
    auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
)


# --- 1. Payout Account Management (Seller) ---


@router.post("/account", response_model=PayoutAccountRead)
async def create_or_update_payout_account(
    payload: PayoutAccountCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Link a payout method (UPI/Bank) and upgrade the user to SELLER_C2B.
    """
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

    # Auto-upgrade role if they are just a driver
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
    """
    Retrieve the linked payout account details.
    """
    stmt = select(PayoutAccount).where(PayoutAccount.user_id == current_user.id)
    account = (await session.execute(stmt)).scalars().first()

    if not account:
        raise HTTPException(status_code=404, detail="No payout account found.")

    return account


# --- 2. Batch Payout Processing (Admin/Cron Job) ---


@router.post("/process-batch")
async def trigger_payout_batch(
    background_tasks: BackgroundTasks,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Calculates owed amounts for all sellers and triggers Razorpay Payouts.
    This is designed to be called by a weekly Cron Job.
    """
    # 1. Security Check
    # In production, you would verify a specific API Key or "SUPER_ADMIN" role.
    if current_user.role not in ["SUPER_ADMIN", "OPERATOR_B2B"]:
        # For MVP dev, we allow it but log the warning.
        print(
            f"[Security Warning] Payout batch triggered by {current_user.role} user: {current_user.id}"
        )

    # 2. Find Unsettled Payments (Status: PAID_BY_DRIVER)
    stmt = select(Payment).where(Payment.status == "PAID_BY_DRIVER")
    payments = (await session.execute(stmt)).scalars().all()

    if not payments:
        return {"message": "No pending payouts found.", "processed_count": 0}

    # 3. Aggregate Money by Seller
    # Structure: { seller_id: { 'amount': 0.0, 'payment_ids': [] } }
    payouts_map = {}

    for payment in payments:
        # Fetch associated Booking & Lot to find the Seller
        booking = await session.get(Booking, payment.booking_id)
        if not booking:
            continue

        lot = await session.get(ParkingLot, booking.lot_id)
        if not lot:
            continue

        seller_id = lot.owner_user_id

        if seller_id not in payouts_map:
            payouts_map[seller_id] = {"amount": 0.0, "payment_ids": []}

        payouts_map[seller_id]["amount"] += payment.seller_payout_amount
        payouts_map[seller_id]["payment_ids"].append(payment.id)

    # 4. Process Transfers
    results = []

    for seller_id, data in payouts_map.items():
        total_amount = data["amount"]
        payment_ids = data["payment_ids"]

        # Fetch Seller's Payout Details
        acct_stmt = select(PayoutAccount).where(PayoutAccount.user_id == seller_id)
        payout_account = (await session.execute(acct_stmt)).scalars().first()

        status_msg = "Skipped (No Payout Account Linked)"

        if payout_account and total_amount > 0:
            try:
                # REAL LOGIC: Check environment
                if "dummy" not in settings.RAZORPAY_KEY_ID:
                    # In a real scenario, you use razorpay_client.payout.create()
                    # Since that requires a funded RazorpayX account, we simulate success here
                    # but log that we *would* have called the API.

                    # payload = {
                    #     "account_number": settings.RAZORPAY_X_ACCOUNT_NUMBER,
                    #     "amount": int(total_amount * 100),
                    #     "currency": "INR",
                    #     "mode": "IMPS",
                    #     "purpose": "payout",
                    #     "fund_account_id": json.loads(payout_account.account_details_encrypted).get("id")
                    # }
                    # razorpay_client.payout.create(payload)

                    status_msg = "Processed (Simulated)"
                else:
                    status_msg = "Processed (Dev Mock)"

                # Update Payment Ledger
                for pid in payment_ids:
                    p = await session.get(Payment, pid)
                    p.status = "PAYOUT_TO_SELLER_COMPLETE"
                    session.add(p)

                # Notify Seller via SMS
                seller = await session.get(User, seller_id)
                if seller:
                    background_tasks.add_task(
                        notify_payout_processed,
                        seller_phone=seller.phone,
                        amount=total_amount,
                    )

                # Log Data Event
                background_tasks.add_task(
                    log_event,
                    "payout_processed",
                    str(seller_id),
                    {
                        "amount": total_amount,
                        "currency": "INR",
                        "transaction_count": len(payment_ids),
                    },
                )

            except Exception as e:
                status_msg = f"Failed: {str(e)}"
                print(f"[Payout Error] Seller {seller_id}: {e}")

        results.append(
            {"seller_id": str(seller_id), "amount": total_amount, "status": status_msg}
        )

    await session.commit()

    return {"message": "Batch processing complete", "summary": results}
