from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.logging import get_logger
from app.models.repository import UserRepository
from app.models.user import RankTier, User
from app.schemas.user import (
    GameResultRequest,
    LeaderboardEntry,
    LeaderboardResponse,
    RatingUpdateResponse,
)
from app.services.rating import RatingService

router = APIRouter(prefix="/ranking", tags=["ranking"])
log = get_logger(__name__)


@router.get("/leaderboard", response_model=LeaderboardResponse)
def get_leaderboard(
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
):
    """Get global leaderboard."""
    repo = UserRepository(db)
    users = repo.get_leaderboard(limit=limit, offset=offset)

    entries = []
    for i, user in enumerate(users, start=offset + 1):
        win_rate = user.wins / user.games_played if user.games_played > 0 else 0.0
        entries.append(LeaderboardEntry(
            position=i,
            user_id=user.id,
            username=user.username,
            rating=user.rating,
            rank_tier=user.rank_tier,
            rank_name=RankTier.NAMES.get(user.rank_tier, "Unranked"),
            games_played=user.games_played,
            wins=user.wins,
            losses=user.losses,
            win_rate=round(win_rate, 3),
        ))

    # Count total ranked players
    total = repo.db.query(User).filter(User.is_active == True).filter(User.games_played >= 5).count()

    return LeaderboardResponse(entries=entries, total_ranked_players=total)


@router.post("/process-game", response_model=list[RatingUpdateResponse])
def process_game_result(
    payload: GameResultRequest,
    db: Session = Depends(get_db),
):
    """
    Called by Session Service when a game ends.
    Calculates and applies rating changes for all players.
    """
    repo = UserRepository(db)

    # Fetch all players
    all_ids = payload.winner_ids + payload.loser_ids
    users = {u.id: u for u in repo.get_users_by_ids(all_ids)}

    # Validate all players exist
    missing = set(all_ids) - set(users.keys())
    if missing:
        raise HTTPException(status_code=404, detail=f"Users not found: {missing}")

    # Prepare ratings for calculation
    winner_ratings = [(uid, users[uid].rating) for uid in payload.winner_ids]
    loser_ratings = [(uid, users[uid].rating) for uid in payload.loser_ids]

    # Calculate new ratings
    changes = RatingService.calculate_game_ratings(winner_ratings, loser_ratings)

    # Apply changes
    results = []
    for change in changes:
        user = users[change.user_id]
        won = change.user_id in payload.winner_ids
        repo.update_rating(user, change.new_rating, won)

        results.append(RatingUpdateResponse(
            user_id=change.user_id,
            old_rating=change.old_rating,
            new_rating=change.new_rating,
            change=change.change,
            new_rank_tier=user.rank_tier,
            rank_name=RankTier.NAMES.get(user.rank_tier, "Unranked"),
        ))

    log.info(
        "Processed game session=%s | winners=%s | losers=%s",
        payload.session_id,
        payload.winner_ids,
        payload.loser_ids,
    )

    return results