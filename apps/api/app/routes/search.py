from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func, and_
from sqlmodel import select
from datetime import datetime
from geoalchemy2 import Geometry
from pytz import timezone
import uuid

from app.db import get_session
from app.models import ParkingLot, ParkingSpot, SpotAvailability, PricingRule
from app.schemas import SearchResult

router = APIRouter()


@router.get("/availability", response_model=list[SearchResult])
async def search_spots(
    lat: float = Query(..., description="Latitude"),
    long: float = Query(..., description="Longitude"),
    start_time: datetime = Query(..., description="ISO Start Time"),
    end_time: datetime = Query(..., description="ISO End Time"),
    vehicle_type: str = Query("CAR", description="CAR or TWO_WHEELER"),
    radius_meters: int = Query(2000, description="Search radius in meters"),
    session: AsyncSession = Depends(get_session),
):
    # 1. Handle Timezones
    ist = timezone('Asia/Kolkata')

    start_ist = start_time.astimezone(ist)
    end_ist = end_time.astimezone(ist)

    # Strip timezone for DB comparison
    start_db = start_ist.replace(tzinfo=None)
    end_db = end_ist.replace(tzinfo=None)

    # 2. Construct PostGIS Point
    user_location = func.ST_SetSRID(func.ST_MakePoint(long, lat), 4326)

    # 3. The Query
    statement = (
        select(
            ParkingLot.id,
            ParkingLot.name,
            ParkingLot.address,
            # FIX: Cast Geography to Geometry to extract coordinates
            func.ST_Y(func.cast(ParkingLot.location, Geometry)).label("latitude"),
            func.ST_X(func.cast(ParkingLot.location, Geometry)).label("longitude"),
            PricingRule.rate,
            PricingRule.rate_type,
        )
        .join(ParkingSpot, ParkingSpot.lot_id == ParkingLot.id)
        .join(SpotAvailability, SpotAvailability.spot_id == ParkingSpot.id)
        .join(PricingRule, PricingRule.lot_id == ParkingLot.id)
        .where(func.ST_DWithin(ParkingLot.location, user_location, radius_meters))
        .where(ParkingSpot.spot_type == vehicle_type)
        .where(
            and_(
                SpotAvailability.start_time <= start_db,
                SpotAvailability.end_time >= end_db,
                SpotAvailability.status == "AVAILABLE",
            )
        )
        .where(PricingRule.is_active == True)
        .distinct()
    )

    results = await session.execute(statement)
    rows = results.all()

    # 4. Calculate Prices
    search_results = []
    for r in rows:
        duration_seconds = (end_db - start_db).total_seconds()
        duration_hours = max(1.0, duration_seconds / 3600)

        if r.rate_type == "HOURLY":
            total_price = float(r.rate) * duration_hours
        else:
            total_price = float(r.rate)

        search_results.append(
            SearchResult(
                lot_id=r.id,
                name=r.name,
                address=r.address,
                latitude=r.latitude,
                longitude=r.longitude,
                price=round(total_price, 2),
                rate_type=r.rate_type,
            )
        )

    return search_results
