from datetime import datetime

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
    in_game: bool
    games_played: int
    wins: int
    losses: int
    created_at: datetime

    model_config = {"from_attributes": True}


class UserInternalResponse(BaseModel):
    id: int
    username: str
    in_game: bool
    is_active: bool

    model_config = {"from_attributes": True}