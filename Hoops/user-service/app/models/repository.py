from typing import Optional

from sqlalchemy.orm import Session

from app.models.user import User


class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, user_id: int) -> Optional[User]:
        return self.db.get(User, user_id)

    def get_by_username(self, username: str) -> Optional[User]:
        return self.db.query(User).filter(User.username == username).first()

    def get_by_email(self, email: str) -> Optional[User]:
        return self.db.query(User).filter(User.email == email).first()

    def create(self, username: str, email: str, hashed_password: str) -> User:
        user = User(username=username, email=email, hashed_password=hashed_password)
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def set_in_game(self, user: User, in_game: bool) -> User:
        user.in_game = in_game
        self.db.commit()
        self.db.refresh(user)
        return user

    def update_stats(self, user: User, won: bool) -> User:
        user.games_played += 1
        if won:
            user.wins += 1
        else:
            user.losses += 1
        self.db.commit()
        self.db.refresh(user)
        return user