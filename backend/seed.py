from database import SessionLocal, engine, Base
from models import User, UserRole
from auth_handler import get_password_hash

def seed_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    users = [
        {
            "email": "admin@thalcare.com",
            "password": "password123",
            "first_name": "System",
            "last_name": "Admin",
            "role": UserRole.ADMIN
        },
        {
            "email": "doctor@thalcare.com",
            "password": "password123",
            "first_name": "Jane",
            "last_name": "Doe",
            "role": UserRole.DOCTOR
        },
        {
            "email": "lab@thalcare.com",
            "password": "password123",
            "first_name": "John",
            "last_name": "Smith",
            "role": UserRole.LAB_TECHNICIAN
        }
    ]
    
    for user_data in users:
        existing_user = db.query(User).filter(User.email == user_data["email"]).first()
        if not existing_user:
            new_user = User(
                email=user_data["email"],
                hashed_password=get_password_hash(user_data["password"]),
                first_name=user_data["first_name"],
                last_name=user_data["last_name"],
                role=user_data["role"]
            )
            db.add(new_user)
            print(f"Added {user_data['role']} user: {user_data['email']}")
        else:
            print(f"User {user_data['email']} already exists.")
            
    db.commit()
    db.close()

if __name__ == "__main__":
    seed_db()
    print("Database seeding completed.")
