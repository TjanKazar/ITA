from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.logging import get_logger
from app.models.repository import UserRepository
from app.schemas.user import UserInternalResponse, UserPublicResponse

router = APIRouter(prefix="/users", tags=["users"])
log = get_logger(__name__)


@router.get("/{user_id}", response_model=UserInternalResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    """Inter-service lookup — called by Game Service and Vision Service."""
    user = UserRepository(db).get_by_id(user_id)
    if user is None:
        log.warning("User lookup failed: id=%s not found", user_id)
        raise HTTPException(status_code=404, detail="User not found")
    log.info("User lookup: id=%s", user_id)
    return user


@router.patch("/{user_id}/in-game", response_model=UserInternalResponse)
def set_in_game(user_id: int, in_game: bool, db: Session = Depends(get_db)):
    """Called by Game Service when a match starts or ends."""
    user = UserRepository(db).get_by_id(user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    updated = UserRepository(db).set_in_game(user, in_game)
    log.info("in_game set to %s for user id=%s", in_game, user_id)
    return updated


@router.patch("/{user_id}/stats", response_model=UserPublicResponse)
def update_stats(user_id: int, won: bool, db: Session = Depends(get_db)):
    """Called by Game Service after a match finishes."""
    user = UserRepository(db).get_by_id(user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    updated = UserRepository(db).update_stats(user, won)
    log.info("Stats updated for user id=%s | won=%s | total=%s", user_id, won, updated.games_played)
    return updated