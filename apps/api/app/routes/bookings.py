# apps/api/app/routes/bookings.py
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
    Request,
    BackgroundTasks,
    Header,
)
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from sqlalchemy import and_
from datetime import datetime
import razorpay
import uuid
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
from app.services.logger import log_event
from app.services.notifications import notify_booking_confirmed

router = APIRouter()

# Production Safety: Ensure keys exist
if not settings.RAZORPAY_KEY_ID or not settings.RAZORPAY_KEY_SECRET:
    raise RuntimeError(
        "FATAL: Razorpay credentials are missing from environment variables."
    )

# Initialize Razorpay Client
client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))


@router.post("/", response_model=BookingResponse)
async def create_booking(
    background_tasks: BackgroundTasks,
    payload: BookingCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """
    Initiates a booking.
    1. Converts User Time -> IST -> DB Time.
    2. Checks Availability (Atomic).
    3. Creates Pending Booking & Payment.
    4. Returns Razorpay Order ID.
    """
    # 1. Timezone Handling (Enforce IST)
    # We assume the input is UTC or ISO format, but we interpret the *intent* as IST
    # for business logic (e.g. "9 AM") if the frontend sends naive times.
    # If frontend sends UTC, this conversion places it correctly in Indian context.
    ist = timezone("Asia/Kolkata")
    start_db = payload.start_time.astimezone(ist).replace(tzinfo=None)
    end_db = payload.end_time.astimezone(ist).replace(tzinfo=None)

    # 2. Availability Check
    # Find a spot in this lot that is OPEN during the requested window
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
            status_code=400,
            detail="Sorry, this spot is no longer available for the selected time.",
        )

    # 3. Calculate Price
    price_stmt = select(PricingRule).where(
        PricingRule.lot_id == payload.lot_id, PricingRule.is_active == True
    )
    price_result = await session.execute(price_stmt)
    rule = price_result.scalars().first()

    if not rule:
        raise HTTPException(
            status_code=400, detail="Pricing configuration error: No active rate found."
        )

    duration_hours = max(1.0, (end_db - start_db).total_seconds() / 3600)

    if rule.rate_type == "HOURLY":
        amount_inr = float(rule.rate) * duration_hours
    else:
        # Flat fee (e.g., Event Parking)
        amount_inr = float(rule.rate)

    amount_paise = int(amount_inr * 100)

    # 4. Create Razorpay Order
    try:
        order_data = client.order.create(
            {
                "amount": amount_paise,
                "currency": "INR",
                "receipt": f"rcpt_{uuid.uuid4().hex[:10]}",
                "notes": {
                    "user_id": str(current_user.id),
                    "lot_id": str(payload.lot_id),
                    "spot_id": str(spot.id),
                },
            }
        )
    except Exception as e:
        print(f"[Razorpay Error] {e}")
        raise HTTPException(
            status_code=502, detail="Payment gateway error. Please try again."
        )

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

    # 7. Log Event
    background_tasks.add_task(
        log_event,
        "booking_initiated",
        str(current_user.id),
        {
            "booking_id": str(new_booking.id),
            "lot_id": str(payload.lot_id),
            "amount": amount_inr,
            "duration": duration_hours,
        },
    )

    return BookingResponse(
        booking_id=new_booking.id,
        razorpay_order_id=order_data["id"],
        amount=amount_inr,
        currency="INR",
        status="PENDING",
    )


@router.post("/webhook")
async def razorpay_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    x_razorpay_signature: str = Header(None),
    session: AsyncSession = Depends(get_session),
):
    """
    Secure Webhook:
    1. Verifies Signature.
    2. Updates Payment -> PAID.
    3. Updates Booking -> CONFIRMED.
    4. Splits Availability Window.
    5. Sends SMS Notification.
    """
    if not x_razorpay_signature:
        raise HTTPException(status_code=400, detail="Missing Signature Header")

    # 1. Verify Signature
    try:
        body_bytes = await request.body()
        client.utility.verify_webhook_signature(
            body_bytes.decode(), x_razorpay_signature, settings.RAZORPAY_WEBHOOK_SECRET
        )
    except razorpay.errors.SignatureVerificationError:
        print("[Security] Invalid Razorpay Signature")
        raise HTTPException(status_code=400, detail="Invalid Signature")

    # 2. Process Payload
    payload = await request.json()
    event = payload.get("event")

    if event == "payment.captured":
        payment_entity = payload["payload"]["payment"]["entity"]
        order_id = payment_entity["order_id"]

        # Find Payment
        stmt = select(Payment).where(Payment.razorpay_order_id == order_id)
        result = await session.execute(stmt)
        payment_record = result.scalars().first()

        if not payment_record:
            return {"status": "ignored", "reason": "Payment not found in DB"}

        # Idempotency Check
        if payment_record.status == "PAID_BY_DRIVER":
            return {"status": "ignored", "reason": "Already processed"}

        # Update Payment
        payment_record.status = "PAID_BY_DRIVER"
        payment_record.razorpay_payment_id = payment_entity["id"]
        session.add(payment_record)

        # Update Booking
        booking_stmt = select(Booking).where(Booking.id == payment_record.booking_id)
        booking_result = await session.execute(booking_stmt)
        booking = booking_result.scalars().first()

        if booking:
            booking.status = "CONFIRMED"
            booking.qr_code_data = f"pk_{uuid.uuid4().hex[:12]}"
            session.add(booking)

            # ---------------------------------------------------------
            # ATOMIC AVAILABILITY SPLITTING
            # ---------------------------------------------------------
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

                # B. Create "Booked" Window
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

            # ---------------------------------------------------------
            # NOTIFICATIONS
            # ---------------------------------------------------------
            # Fetch details for SMS
            user = await session.get(User, booking.driver_user_id)
            lot = await session.get(ParkingLot, booking.lot_id)

            if user and lot:
                background_tasks.add_task(
                    notify_booking_confirmed,
                    user_phone=user.phone,
                    user_name=user.name,
                    lot_name=lot.name,
                    booking_id=str(booking.id),
                )

        return {"status": "ok"}

    return {"status": "ignored"}
