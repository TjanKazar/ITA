"""Integration tests for all API endpoints."""


def test_health(client):
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


# ── POST /auth/register ────────────────────────────────────────────────────────

def test_register_success(client):
    res = client.post("/auth/register", json={
        "username": "jordan",
        "email": "jordan@hoops.com",
        "password": "buckets23",
    })
    assert res.status_code == 201
    data = res.json()
    assert data["username"] == "jordan"
    assert data["rating"] == 1000
    assert data["reputation"] == 0.5
    assert data["games_played"] == 0
    assert "hashed_password" not in data


def test_register_duplicate_username(client):
    payload = {"username": "jordan", "email": "jordan@hoops.com", "password": "buckets23"}
    client.post("/auth/register", json=payload)
    res = client.post("/auth/register", json={**payload, "email": "other@hoops.com"})
    assert res.status_code == 409


def test_register_duplicate_email(client):
    client.post("/auth/register", json={"username": "jordan", "email": "same@hoops.com", "password": "buckets23"})
    res = client.post("/auth/register", json={"username": "kobe", "email": "same@hoops.com", "password": "buckets23"})
    assert res.status_code == 409


def test_register_short_password(client):
    res = client.post("/auth/register", json={"username": "jordan", "email": "j@hoops.com", "password": "short"})
    assert res.status_code == 422


def test_register_short_username(client):
    res = client.post("/auth/register", json={"username": "ab", "email": "j@hoops.com", "password": "buckets23"})
    assert res.status_code == 422


def test_register_invalid_username_chars(client):
    res = client.post("/auth/register", json={"username": "bad name!", "email": "j@hoops.com", "password": "buckets23"})
    assert res.status_code == 422


# ── POST /auth/login ───────────────────────────────────────────────────────────

def test_login_success(client, registered_user):
    res = client.post("/auth/login", json=registered_user)
    assert res.status_code == 200
    assert "access_token" in res.json()
    assert res.json()["token_type"] == "bearer"


def test_login_wrong_password(client, registered_user):
    res = client.post("/auth/login", json={**registered_user, "password": "wrongpass"})
    assert res.status_code == 401


def test_login_unknown_user(client):
    res = client.post("/auth/login", json={"username": "ghost", "password": "buckets99"})
    assert res.status_code == 401


# ── GET /auth/me ───────────────────────────────────────────────────────────────

def test_me_success(client, auth_headers):
    res = client.get("/auth/me", headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["username"] == "testplayer"


def test_me_no_token(client):
    res = client.get("/auth/me")
    assert res.status_code == 403


def test_me_invalid_token(client):
    res = client.get("/auth/me", headers={"Authorization": "Bearer garbage"})
    assert res.status_code == 401


# ── GET /users/{id} ────────────────────────────────────────────────────────────

def test_get_user_by_id(client, auth_headers):
    user_id = client.get("/auth/me", headers=auth_headers).json()["id"]
    res = client.get(f"/users/{user_id}")
    assert res.status_code == 200
    data = res.json()
    assert data["username"] == "testplayer"
    assert "rating" in data
    assert "rank_tier" in data


def test_get_user_not_found(client):
    res = client.get("/users/9999")
    assert res.status_code == 404


