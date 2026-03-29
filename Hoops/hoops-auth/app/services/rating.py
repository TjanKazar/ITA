from dataclasses import dataclass


@dataclass
class RatingChange:
    user_id: int
    old_rating: int
    new_rating: int
    change: int


class RatingService:
    """ELO-based rating calculation."""

    K_FACTOR = 32  # Base K-factor
    HANDICAP_BONUS = 0.1  # 10% bonus/penalty per player difference

    @classmethod
    def calculate_expected_score(cls, rating_a: int, rating_b: int) -> float:
        """Calculate expected score for player A against player B."""
        return 1 / (1 + 10 ** ((rating_b - rating_a) / 400))

    @classmethod
    def calculate_game_ratings(
        cls,
        winner_ratings: list[tuple[int, int]],  # [(user_id, rating), ...]
        loser_ratings: list[tuple[int, int]],
        score_margin: float = 1.0,  # Optional: factor in score margin
    ) -> list[RatingChange]:
        """
        Calculate new ratings for all players in a game.
        
        Returns list of RatingChange for each player.
        """
        if not winner_ratings or not loser_ratings:
            return []

        # Calculate team average ratings
        winner_avg = sum(r for _, r in winner_ratings) / len(winner_ratings)
        loser_avg = sum(r for _, r in loser_ratings) / len(loser_ratings)

        # Handicap adjustment (e.g., 5v4 game)
        team_size_diff = len(winner_ratings) - len(loser_ratings)
        handicap_factor = 1 + (team_size_diff * cls.HANDICAP_BONUS)

        changes = []

        # Calculate winner rating changes
        for user_id, rating in winner_ratings:
            expected = cls.calculate_expected_score(rating, loser_avg)
            k = cls.K_FACTOR / handicap_factor  # Winners get less if they had more players
            change = round(k * (1 - expected) * score_margin)
            changes.append(RatingChange(
                user_id=user_id,
                old_rating=rating,
                new_rating=rating + change,
                change=change,
            ))

        # Calculate loser rating changes
        for user_id, rating in loser_ratings:
            expected = cls.calculate_expected_score(rating, winner_avg)
            k = cls.K_FACTOR * handicap_factor  # Losers lose more if they had more players
            change = round(k * (0 - expected) * score_margin)
            changes.append(RatingChange(
                user_id=user_id,
                old_rating=rating,
                new_rating=max(0, rating + change),
                change=change,
            ))

        return changes

    @classmethod
    def calculate_1v1_ratings(
        cls,
        winner_id: int,
        winner_rating: int,
        loser_id: int,
        loser_rating: int,
    ) -> list[RatingChange]:
        """Simplified calculation for 1v1 games."""
        return cls.calculate_game_ratings(
            winner_ratings=[(winner_id, winner_rating)],
            loser_ratings=[(loser_id, loser_rating)],
        )