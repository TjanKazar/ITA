from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.logging import get_logger
from app.core.security import create_access_token, hash_password, verify_password
from app.models.repository import UserRepository
from app.models.user import User
from app.schemas.user import LoginRequest, RegisterRequest, TokenResponse, UserPublicResponse

router = APIRouter(prefix="/auth", tags=["auth"])
log = get_logger(__name__)


@router.post("/register", response_model=UserPublicResponse, status_code=201)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    repo = UserRepository(db)

    if repo.get_by_username(payload.username):
        log.warning("Register failed - username taken: %s", payload.username)
        raise HTTPException(status_code=409, detail="Username already taken")

    if repo.get_by_email(payload.email):
        log.warning("Register failed - email taken: %s", payload.email)
        raise HTTPException(status_code=409, detail="Email already registered")

    user = repo.create(
        username=payload.username,
        email=payload.email,
        hashed_password=hash_password(payload.password),
    )
    log.info("New user registered: id=%s username=%s", user.id, user.username)
    return user


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    repo = UserRepository(db)
    user = repo.get_by_username(payload.username)

    if user is None or not verify_password(payload.password, user.hashed_password):
        log.warning("Login failed for username: %s", payload.username)
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account disabled")

    token = create_access_token(user.id)
    log.info("User logged in: id=%s username=%s", user.id, user.username)
    return TokenResponse(access_token=token)


@router.get("/me", response_model=UserPublicResponse)
def me(current_user: User = Depends(get_current_user)):
    log.info("Profile fetched: id=%s", current_user.id)
    return current_user