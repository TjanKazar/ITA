import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, delete
from sqlalchemy.orm import sessionmaker

from app.core.database import Base, get_db
from app.models.user import User
from app.main import app

TEST_DB_PATH = "./test_hoops.db"
TEST_DB_URL = f"sqlite:///{TEST_DB_PATH}"

engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)


def override_get_db():
    db = TestingSession()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def reset_db():
    db = TestingSession()
    db.execute(delete(User))
    db.commit()
    db.close()
    yield


@pytest.fixture
def db_session():
    db = TestingSession()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def registered_user(client):
    client.post("/auth/register", json={
        "username": "testplayer",
        "email": "test@hoops.com",
        "password": "buckets99",
    })
    return {"username": "testplayer", "password": "buckets99"}


@pytest.fixture
def auth_token(client, registered_user):
    res = client.post("/auth/login", json=registered_user)
    return res.json()["access_token"]


@pytest.fixture
def auth_headers(auth_token):
    return {"Authorization": f"Bearer {auth_token}"}
