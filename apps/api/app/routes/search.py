from fastapi import APIRouter, Depends, Query, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func, and_, asc, desc
from sqlmodel import select
from datetime import datetime
from geoalchemy2 import Geometry
from pytz import timezone
from typing import List, Optional

from app.db import get_session
from app.models import (
    ParkingLot,
    ParkingSpot,
    SpotAvailability,
    PricingRule,
    Review,
    LotAmenity,
    Amenity,
)
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
    # Filters
    min_price: float = Query(0),
    max_price: float = Query(10000),
    min_rating: float = Query(0),
    has_cctv: bool = Query(False),
    has_covered: bool = Query(False),
    session: AsyncSession = Depends(get_session),
):
    # 1. Timezone Handling
    ist = timezone("Asia/Kolkata")
    if start_time.tzinfo is None:
        start_time = ist.localize(start_time)
    if end_time.tzinfo is None:
        end_time = ist.localize(end_time)

    start_db = start_time.astimezone(ist).replace(tzinfo=None)
    end_db = end_time.astimezone(ist).replace(tzinfo=None)

    # 2. PostGIS Point
    user_location = func.ST_SetSRID(func.ST_MakePoint(long, lat), 4326)

    # 3. Rating Subquery
    rating_subq = (
        select(Review.lot_id, func.avg(Review.rating).label("avg_rating"))
        .group_by(Review.lot_id)
        .subquery()
    )

    # 4. Build Query
    statement = (
        select(
            ParkingLot.id,
            ParkingLot.name,
            ParkingLot.address,
            func.ST_Y(func.cast(ParkingLot.location, Geometry)).label("latitude"),
            func.ST_X(func.cast(ParkingLot.location, Geometry)).label("longitude"),
            PricingRule.rate,
            PricingRule.rate_type,
            # FIX 1: Added priority here because it is used in ORDER BY
            PricingRule.priority,
            func.coalesce(rating_subq.c.avg_rating, 0).label("rating_score"),
            func.ST_Distance(ParkingLot.location, user_location).label("distance"),
        )
        .distinct()
        .join(ParkingSpot, ParkingSpot.lot_id == ParkingLot.id)
        .join(SpotAvailability, SpotAvailability.spot_id == ParkingSpot.id)
        .join(PricingRule, PricingRule.lot_id == ParkingLot.id)
        .outerjoin(rating_subq, rating_subq.c.lot_id == ParkingLot.id)
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
        .where(PricingRule.rate >= min_price)
        .where(PricingRule.rate <= max_price)
    )

    if min_rating > 0:
        statement = statement.where(
            func.coalesce(rating_subq.c.avg_rating, 0) >= min_rating
        )

    if has_cctv or has_covered:
        statement = statement.join(LotAmenity, LotAmenity.lot_id == ParkingLot.id).join(
            Amenity, Amenity.id == LotAmenity.amenity_id
        )
        if has_cctv:
            statement = statement.where(Amenity.name == "CCTV")
        if has_covered:
            statement = statement.where(Amenity.name == "Covered Parking")

    # FIX 2: Order by columns are now present in SELECT list
    statement = statement.order_by(asc("distance"), PricingRule.priority.desc())

    results = await session.execute(statement)
    rows = results.all()

    # 5. Format Results
    search_results = []
    for r in rows:
        duration_seconds = (end_db - start_db).total_seconds()
        duration_hours = max(1.0, duration_seconds / 3600)
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

    background_tasks.add_task(
        log_event,
        "search_query",
        None,
        {"lat": lat, "long": long, "filters": {"price": [min_price, max_price]}},
    )

    return search_results
