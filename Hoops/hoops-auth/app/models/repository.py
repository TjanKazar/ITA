from typing import Optional

from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.models.user import RankTier, User


class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, user_id: int) -> Optional[User]:
        return self.db.get(User, user_id)

    def get_by_username(self, username: str) -> Optional[User]:
        return self.db.query(User).filter(User.username == username).first()

    def get_all(self) -> list[User]:
        """Get all users."""
        return self.db.query(User).all()

    def get_by_email(self, email: str) -> Optional[User]:
        return self.db.query(User).filter(User.email == email).first()

    def create(self, username: str, email: str, hashed_password: str) -> User:
        user = User(username=username, email=email, hashed_password=hashed_password)
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user
    
    

    def update_rating(self, user: User, new_rating: int, won: bool) -> User:
        """Update rating, rank tier, and win/loss stats after a game."""
        user.rating = max(0, new_rating)  # Rating can't go below 0
        user.rank_tier = RankTier.from_rating(user.rating)
        user.games_played += 1
        if won:
            user.wins += 1
        else:
            user.losses += 1
        self.db.commit()
        self.db.refresh(user)
        return user

    def update_reputation(self, user: User, new_reputation: float) -> User:
        """Update user reputation score."""
        user.reputation = max(0.0, min(1.0, new_reputation))  # Clamp to 0-1
        self.db.commit()
        self.db.refresh(user)
        return user

    def get_leaderboard(self, limit: int = 50, offset: int = 0) -> list[User]:
        """Get global leaderboard sorted by rating."""
        return (
            self.db.query(User)
            .filter(User.is_active == True)
            .filter(User.games_played >= 5)  # Minimum games to appear on leaderboard
            .order_by(desc(User.rating))
            .offset(offset)
            .limit(limit)
            .all()
        )

    def get_user_rank_position(self, user_id: int) -> Optional[int]:
        """Get user's position on the leaderboard (1-indexed)."""
        user = self.get_by_id(user_id)
        if not user or user.games_played < 5:
            return None

        position = (
            self.db.query(User)
            .filter(User.is_active == True)
            .filter(User.games_played >= 5)
            .filter(User.rating > user.rating)
            .count()
        )
        return position + 1

    def get_users_by_ids(self, user_ids: list[int]) -> list[User]:
        """Batch fetch users by IDs."""
        return self.db.query(User).filter(User.id.in_(user_ids)).all()