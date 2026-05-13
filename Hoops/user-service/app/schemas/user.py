from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, field_validator


class RegisterRequest(BaseModel):
    username: str
    email: EmailStr
    password: str

    @field_validator("username")
    @classmethod
    def validate_username(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 3 or len(v) > 50:
            raise ValueError("Username must be 3-50 characters")
        if not v.replace("_", "").replace("-", "").isalnum():
            raise ValueError("Username may only contain letters, numbers, - and _")
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if len(v) > 72:
            raise ValueError("Password must not exceed 72 characters")
        return v


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserPublicResponse(BaseModel):
    id: int
    username: str
    email: str
    rating: int
    rank_tier: int
    rank_name: str
    games_played: int
    wins: int
    losses: int
    win_rate: float
    reputation: float
    created_at: datetime

    model_config = {"from_attributes": True}

    @classmethod
    def from_user(cls, user) -> "UserPublicResponse":
        from app.models.user import RankTier
        win_rate = user.wins / user.games_played if user.games_played > 0 else 0.0
        return cls(
            id=user.id,
            username=user.username,
            email=user.email,
            rating=user.rating,
            rank_tier=user.rank_tier,
            rank_name=RankTier.NAMES.get(user.rank_tier, "Unranked"),
            games_played=user.games_played,
            wins=user.wins,
            losses=user.losses,
            win_rate=round(win_rate, 3),
            reputation=user.reputation,
            created_at=user.created_at,
        )


class UserInternalResponse(BaseModel):
    """Used for inter-service communication."""
    id: int
    username: str
    rating: int
    rank_tier: int
    is_active: bool
    reputation: float

    model_config = {"from_attributes": True}


class LeaderboardEntry(BaseModel):
    position: int
    user_id: int
    username: str
    rating: int
    rank_tier: int
    rank_name: str
    games_played: int
    wins: int
    losses: int
    win_rate: float


class LeaderboardResponse(BaseModel):
    entries: list[LeaderboardEntry]
    total_ranked_players: int


class GameResultRequest(BaseModel):
    """Received from Session Service when a game ends."""
    session_id: int
    winner_ids: list[int]
    loser_ids: list[int]
    score: str  # e.g., "21-18"
    game_mode: str  # "1v1", "3v3", "5v5"


class RatingUpdateResponse(BaseModel):
    user_id: int
    old_rating: int
    new_rating: int
    change: int
    new_rank_tier: int
    rank_name: str