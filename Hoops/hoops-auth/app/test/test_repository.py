import pytest
from app.models.repository import UserRepository


@pytest.fixture
def repo(db_session):
    return UserRepository(db_session)


def test_create_user(repo):
    user = repo.create("lebron", "lebron@hoops.com", "plainpassword")
    assert user.id is not None
    assert user.username == "lebron"
    assert user.rating == 1000
    assert user.rank_tier == 0
    assert user.games_played == 0
    assert user.reputation == 0.5


def test_get_by_id(repo):
    created = repo.create("lebron", "lebron@hoops.com", "plainpassword")
    found = repo.get_by_id(created.id)
    assert found is not None
    assert found.username == "lebron"


def test_get_by_id_missing(repo):
    assert repo.get_by_id(9999) is None


def test_get_by_username(repo):
    repo.create("lebron", "lebron@hoops.com", "plainpassword")
    assert repo.get_by_username("lebron") is not None


def test_get_by_username_missing(repo):
    assert repo.get_by_username("ghost") is None


def test_get_by_email(repo):
    repo.create("lebron", "lebron@hoops.com", "plainpassword")
    assert repo.get_by_email("lebron@hoops.com") is not None


def test_get_by_email_missing(repo):
    assert repo.get_by_email("nobody@hoops.com") is None


def test_update_rating_win(repo):
    user = repo.create("lebron", "lebron@hoops.com", "plainpassword")
    updated = repo.update_rating(user, new_rating=1050, won=True)
    assert updated.games_played == 1
    assert updated.wins == 1
    assert updated.losses == 0
    assert updated.rating == 1050


def test_update_rating_loss(repo):
    user = repo.create("lebron", "lebron@hoops.com", "plainpassword")
    updated = repo.update_rating(user, new_rating=950, won=False)
    assert updated.games_played == 1
    assert updated.wins == 0
    assert updated.losses == 1
    assert updated.rating == 950


def test_update_rating_multiple(repo):
    user = repo.create("lebron", "lebron@hoops.com", "plainpassword")
    repo.update_rating(user, new_rating=1050, won=True)
    repo.update_rating(user, new_rating=1020, won=True)
    repo.update_rating(user, new_rating=1000, won=False)
    assert user.games_played == 3
    assert user.wins == 2
    assert user.losses == 1


def test_update_reputation(repo):
    user = repo.create("lebron", "lebron@hoops.com", "plainpassword")
    updated = repo.update_reputation(user, 0.8)
    assert updated.reputation == 0.8


def test_update_reputation_clamped(repo):
    user = repo.create("lebron", "lebron@hoops.com", "plainpassword")
    updated = repo.update_reputation(user, 1.5)  # Should clamp to 1.0
    assert updated.reputation == 1.0