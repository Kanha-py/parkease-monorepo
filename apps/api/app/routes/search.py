from fastapi import APIRouter, Depends, Query, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func, and_
from sqlmodel import select
from datetime import datetime
from geoalchemy2 import Geometry
from pytz import timezone

from app.db import get_session
from app.models import ParkingLot, ParkingSpot, SpotAvailability, PricingRule
from app.schemas import SearchResult
from app.services.logger import log_event

router = APIRouter()


@router.get("/availability", response_model=list[SearchResult])
async def search_spots(
    background_tasks: BackgroundTasks,
    lat: float = Query(..., description="Latitude"),
    long: float = Query(..., description="Longitude"),
    start_time: datetime = Query(..., description="ISO Start Time"),
    end_time: datetime = Query(..., description="ISO End Time"),
    vehicle_type: str = Query("CAR", description="CAR or TWO_WHEELER"),
    radius_meters: int = Query(2000, description="Search radius in meters"),
    session: AsyncSession = Depends(get_session),
):
    # 1. Strict IST Conversion
    ist = timezone("Asia/Kolkata")

    if start_time.tzinfo is None:
        start_time = ist.localize(start_time)
    else:
        start_time = start_time.astimezone(ist)

    if end_time.tzinfo is None:
        end_time = ist.localize(end_time)
    else:
        end_time = end_time.astimezone(ist)

    start_db = start_time.replace(tzinfo=None)
    end_db = end_time.replace(tzinfo=None)

    # 2. PostGIS Query
    user_location = func.ST_SetSRID(func.ST_MakePoint(long, lat), 4326)

    statement = (
        select(
            ParkingLot.id,
            ParkingLot.name,
            ParkingLot.address,
            func.ST_Y(func.cast(ParkingLot.location, Geometry)).label("latitude"),
            func.ST_X(func.cast(ParkingLot.location, Geometry)).label("longitude"),
            PricingRule.rate,
            PricingRule.rate_type,
        )
        .distinct(ParkingLot.id)
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
        .order_by(ParkingLot.id, PricingRule.priority.desc())
    )

    results = await session.execute(statement)
    rows = results.all()

    # 3. Price Calculation
    search_results = []
    for r in rows:
        duration_hours = max(1.0, (end_db - start_db).total_seconds() / 3600)
        total_price = (
            float(r.rate) * duration_hours if r.rate_type == "HOURLY" else float(r.rate)
        )

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

    # 4. Log (Async)
    background_tasks.add_task(
        log_event,
        "search_query",
        None,
        {
            "lat": lat,
            "long": long,
            "vehicle": vehicle_type,
            "results": len(search_results),
        },
    )

    return search_results
