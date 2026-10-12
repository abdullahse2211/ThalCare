from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from database import get_db
from models import User, UserRole
from schemas import UserRead, UserCreate
from auth_handler import get_current_user, get_password_hash
from typing import List, Optional
from datetime import datetime

router = APIRouter(
    prefix="/api/v1/admin",
    tags=["Admin"],
)

def is_admin(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this resource"
        )
    return current_user

@router.get("/users", response_model=List[UserRead])
def get_all_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1),
    search: Optional[str] = None,
    role: Optional[str] = None,
    db: Session = Depends(get_db),
    admin_user: User = Depends(is_admin)
):
    query = db.query(User)
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                User.email.ilike(search_term),
                User.first_name.ilike(search_term),
                User.last_name.ilike(search_term)
            )
        )
    
    if role:
        try:
            role_enum = UserRole[role.upper()]
            query = query.filter(User.role == role_enum)
        except KeyError:
            pass # Ignore invalid role filters
            
    return query.offset(skip).limit(limit).all()

@router.post("/users", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def create_user(
    user: UserCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(is_admin)
):
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user.password)
    new_user = User(
        email=user.email,
        hashed_password=hashed_password,
        first_name=user.first_name,
        last_name=user.last_name,
        role=user.role,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.put("/users/{user_id}", response_model=UserRead)
def update_user(
    user_id: int,
    user_data: dict, # Using dict for flexibility
    db: Session = Depends(get_db),
    admin_user: User = Depends(is_admin)
):
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if "first_name" in user_data:
        db_user.first_name = user_data["first_name"]
    if "last_name" in user_data:
        db_user.last_name = user_data["last_name"]
    if "role" in user_data:
        try:
            db_user.role = UserRole[user_data["role"].upper()]
        except KeyError:
            raise HTTPException(status_code=400, detail="Invalid role")
    if "is_active" in user_data:
        db_user.is_active = user_data["is_active"]
    if "password" in user_data and user_data["password"]:
        db_user.hashed_password = get_password_hash(user_data["password"])
        
    db.commit()
    db.refresh(db_user)
    return db_user

@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(is_admin)
):
    if user_id == admin_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own admin account")
        
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    db.delete(db_user)
    db.commit()
    return None

@router.get("/logs")
def get_audit_logs(
    limit: int = 50,
    admin_user: User = Depends(is_admin)
):
    # Mock audit logs for now
    return [
        {
            "id": i,
            "user": "admin@thalcare.com",
            "action": ["LOGIN", "CREATE_USER", "DELETE_PATIENT", "UPDATE_CONFIG", "EXPORT_REPORT"][i % 5],
            "details": f"Attempted to perform action {i}",
            "ip_address": "192.168.1.1",
            "timestamp": datetime.now().isoformat()
        } for i in range(limit)
    ]

@router.get("/config")
def get_system_config(
    admin_user: User = Depends(is_admin)
):
    # Mock system configuration
    return {
        "site_name": "ThalCare",
        "maintenance_mode": False,
        "allow_registrations": True,
        "prediction_model_version": "2.1",
        "smtp_settings": {
            "server": "smtp.gmail.com",
            "port": 587,
            "user": "noreply@thalcare.com"
        }
    }


@router.put("/config")
def update_system_config(
    config_data: dict,
    admin_user: User = Depends(is_admin)
):
    # Mock update implementation
    return {"message": "System configuration updated successfully", "config": config_data}
