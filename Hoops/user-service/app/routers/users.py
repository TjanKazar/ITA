from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.logging import get_logger
from app.models.repository import UserRepository
from app.models.user import RankTier
from app.schemas.user import LeaderboardEntry, LeaderboardResponse, UserInternalResponse, UserPublicResponse

router = APIRouter(prefix="/users", tags=["users"])
log = get_logger(__name__)


@router.get("/", response_model=list[UserPublicResponse])
def get_all_users(db: Session = Depends(get_db)):
    """Get all users."""
    repo = UserRepository(db)
    users = repo.get_all()
    log.info("Fetched all users: count=%d", len(users))
    return [UserPublicResponse.from_user(user) for user in users]

@router.get("/leaderboard", response_model=LeaderboardResponse)
def get_leaderboard(limit: int = 50, offset: int = 0, db: Session = Depends(get_db)):
    """Get global leaderboard."""
    repo = UserRepository(db)
    users = repo.get_leaderboard(limit=limit, offset=offset)
    total_count = repo.get_leaderboard_count()
    log.info("Fetched leaderboard: count=%d, total=%d", len(users), total_count)
    entries = [LeaderboardEntry.from_user(user) for user in users]
    return LeaderboardResponse(total_count=total_count, entries=entries)

@router.get("/users", response_model=list[UserPublicResponse])
def get_users(db: Session = Depends(get_db)):
    """Get all users."""
    repo = UserRepository(db)
    users = repo.get_all()
    log.info("Fetched all users: count=%d", len(users))
    return [UserPublicResponse.from_user(user) for user in users]


@router.get("/{user_id}", response_model=UserPublicResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    """Get user profile with ranking info."""
    repo = UserRepository(db)
    user = repo.get_by_id(user_id)
    if user is None:
        log.warning("User lookup failed: id=%s not found", user_id)
        raise HTTPException(status_code=404, detail="User not found")
    log.info("User lookup: id=%s", user_id)
    return UserPublicResponse.from_user(user)


@router.get("/{user_id}/internal", response_model=UserInternalResponse)
def get_user_internal(user_id: int, db: Session = Depends(get_db)):
    """Inter-service lookup — called by Session Service."""
    user = UserRepository(db).get_by_id(user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.get("/{user_id}/rank-position")
def get_rank_position(user_id: int, db: Session = Depends(get_db)):
    """Get user's position on the global leaderboard."""
    repo = UserRepository(db)
    user = repo.get_by_id(user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    position = repo.get_user_rank_position(user_id)
    return {
        "user_id": user_id,
        "position": position,
        "rating": user.rating,
        "rank_tier": user.rank_tier,
        "rank_name": RankTier.NAMES.get(user.rank_tier, "Unranked"),
        "games_played": user.games_played,
        "eligible": user.games_played >= 5,
    }