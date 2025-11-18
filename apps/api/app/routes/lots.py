from fastapi import APIRouter, Depends, HTTPException
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from geoalchemy2.elements import WKTElement
from app.schemas import LotReadWithSpots, SpotRead

from app.db import get_session
from app.models import User, ParkingLot, ParkingSpot
from app.schemas import LotCreate, LotRead
from app.deps import get_current_user
from app.services.geocoding import get_lat_lon

router = APIRouter()


@router.post("/", response_model=LotRead, status_code=201)
async def create_lot(
    payload: LotCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    # 1. Geocode
    lat, lon = get_lat_lon(payload.address)

    # 2. Create Lot
    # PostGIS Point is (longitude, latitude)
    location_point = WKTElement(f"POINT({lon} {lat})", srid=4326)

    new_lot = ParkingLot(
        owner_user_id=current_user.id,
        name=payload.name,
        address=payload.address,
        location=location_point,
    )
    session.add(new_lot)
    await session.commit()
    await session.refresh(new_lot)

    # 3. Create Spot
    new_spot = ParkingSpot(
        lot_id=new_lot.id, name=f"{payload.name} - Spot 1", spot_type=payload.spot_type
    )
    session.add(new_spot)

    # 4. Upgrade Role
    if current_user.role == "DRIVER":
        current_user.role = "SELLER_C2B"
        session.add(current_user)

    await session.commit()

    return new_lot


@router.get("/my-lots", response_model=list[LotRead])
async def get_my_lots(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    statement = select(ParkingLot).where(ParkingLot.owner_user_id == current_user.id)
    result = await session.execute(statement)
    return result.scalars().all()


@router.get("/{lot_id}", response_model=LotReadWithSpots)
async def get_lot_details(
    lot_id: uuid.UUID, session: AsyncSession = Depends(get_session)
):
    lot = await session.get(ParkingLot, lot_id)
    if not lot:
        raise HTTPException(status_code=404, detail="Lot not found")

    # Fetch spots manually since we aren't using Relationship attributes yet
    statement = select(ParkingSpot).where(ParkingSpot.lot_id == lot_id)
    result = await session.execute(statement)
    spots = result.scalars().all()

    # Combine into response
    return LotReadWithSpots(
        **lot.model_dump(), spots=[SpotRead(**s.model_dump()) for s in spots]
    )
