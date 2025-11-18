from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from sqlalchemy import and_
from datetime import datetime
import razorpay
import uuid
from app.models import SpotAvailability
from pytz import timezone

from app.db import get_session
from app.models import (
    User,
    ParkingLot,
    ParkingSpot,
    SpotAvailability,
    PricingRule,
    Booking,
    Payment,
)
from app.schemas import BookingCreate, BookingResponse
from app.deps import get_current_user
from app.config import settings

router = APIRouter()

# Initialize Razorpay Client
# Note: If keys are "dummy", this will fail actual calls, which is expected in dev without keys.
client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))


@router.post("/", response_model=BookingResponse)
async def create_booking(
    payload: BookingCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    # 1. Timezone Handling (Convert Request to DB Time)
    ist = timezone("Asia/Kolkata")
    start_db = payload.start_time.astimezone(ist).replace(tzinfo=None)
    end_db = payload.end_time.astimezone(ist).replace(tzinfo=None)

    # 2. Find an Available Spot in this Lot
    # We need a spot that is OPEN during the requested window
    statement = (
        select(ParkingSpot)
        .join(SpotAvailability)
        .where(ParkingSpot.lot_id == payload.lot_id)
        .where(ParkingSpot.spot_type == payload.vehicle_type)
        .where(
            and_(
                SpotAvailability.start_time <= start_db,
                SpotAvailability.end_time >= end_db,
                SpotAvailability.status == "AVAILABLE",
            )
        )
    )
    result = await session.execute(statement)
    spot = result.scalars().first()

    if not spot:
        raise HTTPException(
            status_code=400, detail="Spot is no longer available for this time."
        )

    # 3. Calculate Price
    # Get the active pricing rule
    price_stmt = select(PricingRule).where(
        PricingRule.lot_id == payload.lot_id, PricingRule.is_active == True
    )
    price_result = await session.execute(price_stmt)
    rule = price_result.scalars().first()

    if not rule:
        raise HTTPException(
            status_code=400, detail="Pricing error: No active rate found."
        )

    duration_hours = max(1.0, (end_db - start_db).total_seconds() / 3600)
    amount_inr = (
        float(rule.rate) * duration_hours
        if rule.rate_type == "HOURLY"
        else float(rule.rate)
    )
    amount_paise = int(amount_inr * 100)  # Razorpay expects paise (integer)

    # 4. Create Razorpay Order
    try:
        # If using dummy keys, this might fail.
        # For local dev without real keys, we can mock the order_id.
        if "dummy" in settings.RAZORPAY_KEY_ID:
            print("!! WARNING: Using Dummy Razorpay Keys. Mocking Order ID. !!")
            order_data = {"id": f"order_mock_{uuid.uuid4().hex[:10]}"}
        else:
            order_data = client.order.create(
                {
                    "amount": amount_paise,
                    "currency": "INR",
                    "receipt": f"rcpt_{uuid.uuid4().hex[:10]}",
                    "notes": {
                        "user_id": str(current_user.id),
                        "lot_id": str(payload.lot_id),
                    },
                }
            )
    except Exception as e:
        print(f"Razorpay Error: {e}")
        raise HTTPException(status_code=500, detail="Payment gateway error")

    # 5. Create Booking Record (PENDING)
    new_booking = Booking(
        driver_user_id=current_user.id,
        lot_id=payload.lot_id,
        spot_id=spot.id,
        start_time=start_db,
        end_time=end_db,
        status="PENDING",
    )
    session.add(new_booking)
    await session.commit()
    await session.refresh(new_booking)

    # 6. Create Payment Ledger (PENDING)
    new_payment = Payment(
        booking_id=new_booking.id,
        razorpay_order_id=order_data["id"],
        amount_charged=amount_inr,
        commission_fee=amount_inr * 0.20,  # 20% Platform Fee
        seller_payout_amount=amount_inr * 0.80,
        status="PENDING",
    )
    session.add(new_payment)
    await session.commit()

    return BookingResponse(
        booking_id=new_booking.id,
        razorpay_order_id=order_data["id"],
        amount=amount_inr,
        currency="INR",
        status="PENDING",
    )


@router.post("/webhook")
async def razorpay_webhook(
    request: Request, session: AsyncSession = Depends(get_session)
):
    """
    Handles Razorpay payment success webhook.
    1. Verifies signature (Skipped for Dev/Mock).
    2. Updates Payment -> PAID.
    3. Updates Booking -> CONFIRMED.
    4. Splits Availability.
    """
    # 1. Parse Payload
    payload = await request.json()

    # In PROD, you MUST verify the 'X-Razorpay-Signature' header here.
    # For DEV, we assume the payload is valid.

    event = payload.get("event")
    if event == "payment.captured":
        payment_entity = payload["payload"]["payment"]["entity"]
        order_id = payment_entity["order_id"]

        # 2. Find Payment Record
        stmt = select(Payment).where(Payment.razorpay_order_id == order_id)
        result = await session.execute(stmt)
        payment_record = result.scalars().first()

        if not payment_record:
            # Log error in production
            return {"status": "ignored", "reason": "Payment not found"}

        if payment_record.status == "PAID_BY_DRIVER":
            return {"status": "ignored", "reason": "Already processed"}

        # 3. Update Payment
        payment_record.status = "PAID_BY_DRIVER"
        payment_record.razorpay_payment_id = payment_entity["id"]
        session.add(payment_record)

        # 4. Update Booking
        booking_stmt = select(Booking).where(Booking.id == payment_record.booking_id)
        booking_result = await session.execute(booking_stmt)
        booking = booking_result.scalars().first()

        booking.status = "CONFIRMED"
        booking.qr_code_data = f"QR_{uuid.uuid4().hex[:12]}"  # Generate QR Data
        session.add(booking)

        # 5. ATOMIC AVAILABILITY SPLITTING
        # Find the availability window that contains this booking
        # Note: We assume timezones are handled (naive UTC in DB)
        avail_stmt = select(SpotAvailability).where(
            SpotAvailability.spot_id == booking.spot_id,
            SpotAvailability.start_time <= booking.start_time,
            SpotAvailability.end_time >= booking.end_time,
            SpotAvailability.status == "AVAILABLE",
        )
        avail_result = await session.execute(avail_stmt)
        original_window = avail_result.scalars().first()

        if original_window:
            # A. Create "Before" Window (if gap exists)
            if original_window.start_time < booking.start_time:
                before_window = SpotAvailability(
                    spot_id=booking.spot_id,
                    start_time=original_window.start_time,
                    end_time=booking.start_time,
                    status="AVAILABLE",
                )
                session.add(before_window)

            # B. Create "Booked" Window (The actual booking)
            booked_window = SpotAvailability(
                spot_id=booking.spot_id,
                start_time=booking.start_time,
                end_time=booking.end_time,
                status="BOOKED",
                booking_id=booking.id,
            )
            session.add(booked_window)

            # C. Create "After" Window (if gap exists)
            if original_window.end_time > booking.end_time:
                after_window = SpotAvailability(
                    spot_id=booking.spot_id,
                    start_time=booking.end_time,
                    end_time=original_window.end_time,
                    status="AVAILABLE",
                )
                session.add(after_window)

            # D. Delete Original Window
            await session.delete(original_window)

        await session.commit()
        return {"status": "ok"}

    return {"status": "ignored"}
