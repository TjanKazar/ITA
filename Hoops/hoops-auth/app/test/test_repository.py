import pytest
from app.models.repository import UserRepository


@pytest.fixture
def repo(db_session):
    return UserRepository(db_session)


def test_create_user(repo):
    user = repo.create("lebron", "lebron@hoops.com", "plainpassword")
    assert user.id is not None
    assert user.username == "lebron"
    assert user.in_game is False
    assert user.games_played == 0


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


def test_set_in_game_true(repo):
    user = repo.create("lebron", "lebron@hoops.com", "plainpassword")
    updated = repo.set_in_game(user, True)
    assert updated.in_game is True


def test_set_in_game_false(repo):
    user = repo.create("lebron", "lebron@hoops.com", "plainpassword")
    repo.set_in_game(user, True)
    updated = repo.set_in_game(user, False)
    assert updated.in_game is False


def test_update_stats_win(repo):
    user = repo.create("lebron", "lebron@hoops.com", "plainpassword")
    updated = repo.update_stats(user, won=True)
    assert updated.games_played == 1
    assert updated.wins == 1
    assert updated.losses == 0


def test_update_stats_loss(repo):
    user = repo.create("lebron", "lebron@hoops.com", "plainpassword")
    updated = repo.update_stats(user, won=False)
    assert updated.games_played == 1
    assert updated.wins == 0
    assert updated.losses == 1


def test_update_stats_multiple(repo):
    user = repo.create("lebron", "lebron@hoops.com", "plainpassword")
    repo.update_stats(user, won=True)
    repo.update_stats(user, won=True)
    repo.update_stats(user, won=False)
    assert user.games_played == 3
    assert user.wins == 2
    assert user.losses == 1
