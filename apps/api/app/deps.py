from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.config import settings
from app.db import get_session
from app.models import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login-with-password")


async def get_current_user(
    token: str = Depends(oauth2_scheme), session: AsyncSession = Depends(get_session)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    statement = select(User).where(User.id == user_id)
    result = await session.execute(statement)
    user = result.scalars().first()

    if user is None:
        raise credentials_exception
    return user
