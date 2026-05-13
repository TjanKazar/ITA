from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class User(Base):
    __tablename__ = "users"
    __table_args__ = {"extend_existing": True}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)

    # Ranking
    rating: Mapped[int] = mapped_column(Integer, default=1000, index=True)
    rank_tier: Mapped[int] = mapped_column(Integer, default=0)  # 0=Bronze, 1=Silver, etc.

    # Stats
    games_played: Mapped[int] = mapped_column(Integer, default=0)
    wins: Mapped[int] = mapped_column(Integer, default=0)
    losses: Mapped[int] = mapped_column(Integer, default=0)

    # Reputation (0.0 to 1.0)
    reputation: Mapped[float] = mapped_column(Float, default=0.5)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )


# Rank tier definitions
class RankTier:
    BRONZE = 0
    SILVER = 1
    GOLD = 2
    PLATINUM = 3
    DIAMOND = 4

    THRESHOLDS = {
        BRONZE: 0,
        SILVER: 1200,
        GOLD: 1500,
        PLATINUM: 1800,
        DIAMOND: 2200,
    }

    NAMES = {
        BRONZE: "Bronze",
        SILVER: "Silver",
        GOLD: "Gold",
        PLATINUM: "Platinum",
        DIAMOND: "Diamond",
    }

    @classmethod
    def from_rating(cls, rating: int) -> int:
        """Returns the rank tier for a given rating."""
        tier = cls.BRONZE
        for rank, threshold in cls.THRESHOLDS.items():
            if rating >= threshold:
                tier = rank
        return tier