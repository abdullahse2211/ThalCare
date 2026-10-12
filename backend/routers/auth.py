from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta
from pydantic import BaseModel
from database import get_db
from models import User, UserRole
from schemas import UserCreate, UserRead, Token, TokenData, UserBase
from auth_handler import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    get_current_user,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    SECRET_KEY,
    ALGORITHM,
)
from jose import jwt, JWTError

router = APIRouter(
    prefix="/api/v1/auth",
    tags=["Authentication"],
)

# ── Helpers ───────────────────────────────────────────────────────────────────

def _role_map(role: UserRole) -> str:
    return {
        UserRole.DOCTOR: "doctor",
        UserRole.LAB_TECHNICIAN: "lab_technician",
        UserRole.ADMIN: "admin",
    }.get(role, "doctor")

def _user_response(user: User) -> dict:
    return {
        "id": user.id,
        "email": user.email,
        "name": f"{user.first_name} {user.last_name}",
        "role": _role_map(user.role),
        "first_name": user.first_name,
        "last_name": user.last_name,
        "is_active": user.is_active,
        "created_at": user.created_at,
    }

# ── Schemas ───────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: str
    password: str

class RefreshRequest(BaseModel):
    refresh_token: str

# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register(user: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    new_user = User(
        email=user.email,
        hashed_password=get_password_hash(user.password),
        first_name=user.first_name,
        last_name=user.last_name,
        role=user.role,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.post("/login")
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")

    access_token = create_access_token(
        data={"sub": user.email, "role": user.role.value},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    refresh_token = create_refresh_token(data={"sub": user.email})

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": _user_response(user),
    }


@router.post("/logout")
def logout():
    return {"message": "Logged out successfully"}


@router.post("/refresh")
def refresh_token_endpoint(body: RefreshRequest, db: Session = Depends(get_db)):
    """
    Issue a new access token from a valid refresh token.
    This fixes the infinite redirect loop caused by the old placeholder.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired refresh token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(body.refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
        # Refresh tokens carry a "type": "refresh" claim
        if payload.get("type") != "refresh":
            raise credentials_exception
        email: str = payload.get("sub")
        if not email:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.email == email).first()
    if not user or not user.is_active:
        raise credentials_exception

    new_access_token = create_access_token(
        data={"sub": user.email, "role": user.role.value},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    new_refresh_token = create_refresh_token(data={"sub": user.email})

    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer",
    }


@router.get("/profile")
def read_profile(current_user: User = Depends(get_current_user)):
    return _user_response(current_user)


@router.put("/profile")
def update_profile(
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if "first_name" in data:
        current_user.first_name = data["first_name"]
    if "last_name" in data:
        current_user.last_name = data["last_name"]
    db.commit()
    db.refresh(current_user)
    return _user_response(current_user)


@router.post("/forgot-password")
def forgot_password(data: dict):
    # Placeholder — implement email sending when ready
    return {"message": "If that email exists, a reset link has been sent."}


@router.post("/reset-password")
def reset_password(data: dict):
    # Placeholder — implement token validation when ready
    return {"message": "Password reset functionality coming soon."}


@router.post("/change-password")
def change_password(
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    current_pw = data.get("current_password", "")
    new_pw = data.get("new_password", "")
    if not verify_password(current_pw, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if len(new_pw) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")
    current_user.hashed_password = get_password_hash(new_pw)
    db.commit()
    return {"message": "Password changed successfully"}
