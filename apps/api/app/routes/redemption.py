from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from datetime import datetime
import uuid

from app.db import get_session
from app.models import User, Booking, ParkingLot, ParkingSpot
from app.deps import get_current_user
from pydantic import BaseModel

router = APIRouter()


# --- Schemas ---
class BookingListSchema(BaseModel):
    id: uuid.UUID
    lot_name: str
    address: str
    start_time: datetime
    end_time: datetime
    status: str
    qr_code_data: str | None


class ScanRequest(BaseModel):
    qr_code: str


class ScanResponse(BaseModel):
    success: bool
    message: str
    driver_name: str | None = None
    vehicle_plate: str | None = None
    time_remaining: str | None = None


# --- Routes ---


@router.get("/my-bookings", response_model=list[BookingListSchema])
async def get_my_bookings(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Returns all bookings for the logged-in driver."""
    stmt = (
        select(Booking, ParkingLot.name, ParkingLot.address)
        .join(ParkingLot, Booking.lot_id == ParkingLot.id)
        .where(Booking.driver_user_id == current_user.id)
        .order_by(Booking.created_at.desc())
    )
    result = await session.execute(stmt)
    rows = result.all()

    return [
        BookingListSchema(
            id=row.Booking.id,
            lot_name=row.name,
            address=row.address,
            start_time=row.Booking.start_time,
            end_time=row.Booking.end_time,
            status=row.Booking.status,
            qr_code_data=row.Booking.qr_code_data,
        )
        for row in rows
    ]


@router.post("/scan", response_model=ScanResponse)
async def scan_booking(
    payload: ScanRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """
    Seller scans a QR code.
    1. Find Booking.
    2. Verify Seller owns the lot.
    3. Verify Time (Is it valid right now?).
    """
    # 1. Find Booking
    stmt = (
        select(Booking, User.name, ParkingLot.owner_user_id)
        .join(User, Booking.driver_user_id == User.id)
        .join(ParkingLot, Booking.lot_id == ParkingLot.id)
        .where(Booking.qr_code_data == payload.qr_code)
    )
    result = await session.execute(stmt)
    row = result.first()

    if not row:
        raise HTTPException(status_code=404, detail="Invalid QR Code.")

    booking, driver_name, lot_owner_id = row

    # 2. Verify Ownership (Only the Lot Owner can scan)
    if lot_owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="You do not own this parking lot.")

    # 3. Verify Logic
    now = datetime.utcnow()  # Note: Use UTC comparison as DB is naive UTC

    if booking.status != "CONFIRMED":
        return ScanResponse(success=False, message=f"Booking is {booking.status}")

    # Check if too early
    if now < booking.start_time:
        return ScanResponse(
            success=False, message="Too Early!", driver_name=driver_name
        )

    # Check if expired
    if now > booking.end_time:
        return ScanResponse(
            success=False, message="Booking Expired!", driver_name=driver_name
        )

    return ScanResponse(
        success=True,
        message="Verified ✅",
        driver_name=driver_name,
        vehicle_plate=booking.vehicle_plate or "Not Provided",
    )
