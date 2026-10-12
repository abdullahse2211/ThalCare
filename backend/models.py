from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, Enum, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import enum

class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    DOCTOR = "DOCTOR"
    LAB_TECHNICIAN = "LAB_TECHNICIAN"

class TestStatus(str, enum.Enum):
    PENDING = "PENDING"
    VERIFIED = "VERIFIED"
    COMPLETED = "COMPLETED"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.DOCTOR, nullable=False)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    tests_created = relationship("Test", back_populates="created_by_user", foreign_keys="Test.created_by")
    predictions_finalized = relationship("Prediction", back_populates="finalized_by_user", foreign_keys="Prediction.finalized_by")


class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    mrn = Column(String, unique=True, index=True, nullable=False) # Medical Record Number / CNIC
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    dob = Column(DateTime(timezone=True), nullable=False)
    gender = Column(String, nullable=False)
    blood_group = Column(String, nullable=True)
    contact_number = Column(String, nullable=True)
    email = Column(String, nullable=True)
    address = Column(String, nullable=True)
    city = Column(String, nullable=True)
    emergency_contact_name = Column(String, nullable=True)
    emergency_contact = Column(String, nullable=True)
    medical_history = Column(Text, nullable=True)
    family_history = Column(Text, nullable=True)
    allergies = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    tests = relationship("Test", back_populates="patient", cascade="all, delete-orphan")


class Test(Base):
    __tablename__ = "tests"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    status = Column(Enum(TestStatus), default=TestStatus.PENDING)
    
    # CBC/HPLC Parameters
    hb = Column(Float, nullable=True)
    rbc = Column(Float, nullable=True)
    pcv = Column(Float, nullable=True) # Hematocrit
    mcv = Column(Float, nullable=True)
    mch = Column(Float, nullable=True)
    mchc = Column(Float, nullable=True)
    rdw = Column(Float, nullable=True)
    wbc = Column(Float, nullable=True)
    neut = Column(Float, nullable=True)
    lymph = Column(Float, nullable=True)
    plt = Column(Float, nullable=True)
    hba = Column(Float, nullable=True)
    hba2 = Column(Float, nullable=True)
    hbf = Column(Float, nullable=True)
    
    file_url = Column(String, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    patient = relationship("Patient", back_populates="tests")
    created_by_user = relationship("User", back_populates="tests_created", foreign_keys=[created_by])
    prediction = relationship("Prediction", back_populates="test", uselist=False, cascade="all, delete-orphan")


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    test_id = Column(Integer, ForeignKey("tests.id"), unique=True, nullable=False)
    
    # Core result (Phase 7)
    final_diagnosis = Column(String, nullable=True)          # e.g. "Iron Deficiency"
    confidence = Column(Float, nullable=True)                 # e.g. 91.9
    agreement_rate = Column(String, nullable=True)            # e.g. "100.0%"
    clinical_status = Column(String, nullable=True)           # "Validated" | "Requires Review"
    
    # Legacy / compat fields
    risk_score = Column(Float, nullable=True)
    classification = Column(String, nullable=True)
    
    # JSON fields for rich ML output (Phase 7)
    model_predictions = Column(JSON, nullable=True)           # {model: label, ...}
    probabilities = Column(JSON, nullable=True)               # {model: {class: pct, ...}, ...}
    ensemble_probabilities = Column(JSON, nullable=True)      # {class: pct, ...}
    derived_indices = Column(JSON, nullable=True)             # {Mentzer_Index, Srivastava_Index}
    
    # DNA
    dna_recommendation = Column(String, nullable=True)
    
    # Doctor review
    doctor_notes = Column(Text, nullable=True)
    doctor_analysis = Column(Text, nullable=True)
    dna_override_reason = Column(String, nullable=True)
    is_finalized = Column(Boolean, default=False)
    finalized_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Model version
    model_version = Column(String, default="2.0+Confidence")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    test = relationship("Test", back_populates="prediction")
    finalized_by_user = relationship("User", back_populates="predictions_finalized", foreign_keys=[finalized_by])
