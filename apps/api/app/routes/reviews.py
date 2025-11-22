from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from app.db import get_session
from app.models import Review, Booking, User
from app.schemas import ReviewCreate, ReviewRead
from app.deps import get_current_user
import uuid

router = APIRouter()


@router.post("/", response_model=ReviewRead)
async def create_review(
    payload: ReviewCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    # 1. Validate Booking Ownership
    booking = await session.get(Booking, payload.booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking.driver_user_id != current_user.id:
        raise HTTPException(
            status_code=403, detail="You can only review your own bookings"
        )

    if booking.status != "COMPLETED" and booking.status != "CONFIRMED":
        # In a real app, we'd require "COMPLETED" (after scan out).
        # For MVP, "CONFIRMED" is okay if they visited.
        pass

    # 2. Check if already reviewed
    stmt = select(Review).where(Review.booking_id == payload.booking_id)
    existing = (await session.execute(stmt)).scalars().first()
    if existing:
        raise HTTPException(
            status_code=400, detail="You have already reviewed this spot."
        )

    # 3. Create Review
    new_review = Review(
        booking_id=payload.booking_id,
        reviewer_id=current_user.id,
        lot_id=booking.lot_id,
        rating=payload.rating,
        comment=payload.comment,
    )
    session.add(new_review)
    await session.commit()
    await session.refresh(new_review)

    return ReviewRead(
        id=new_review.id,
        reviewer_name=current_user.name,
        rating=new_review.rating,
        comment=new_review.comment,
        created_at=new_review.created_at,
    )


@router.get("/lots/{lot_id}", response_model=list[ReviewRead])
async def get_lot_reviews(
    lot_id: uuid.UUID, session: AsyncSession = Depends(get_session)
):
    # Join User to get names
    stmt = (
        select(Review, User.name)
        .join(User, Review.reviewer_id == User.id)
        .where(Review.lot_id == lot_id)
    )
    results = await session.execute(stmt)

    reviews = []
    for review, name in results:
        reviews.append(
            ReviewRead(
                id=review.id,
                reviewer_name=name,
                rating=review.rating,
                comment=review.comment,
                created_at=review.created_at,
            )
        )
    return reviews
