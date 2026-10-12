from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from models import UserRole, TestStatus

# ----------------- TOKEN SCHEMAS -----------------
class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# ----------------- USER SCHEMAS -----------------
class UserBase(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    role: UserRole = UserRole.DOCTOR

class UserCreate(UserBase):
    password: str

class UserRead(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# ----------------- PATIENT SCHEMAS -----------------
class PatientBase(BaseModel):
    mrn: str
    first_name: str
    last_name: str
    dob: datetime
    gender: str
    blood_group: Optional[str] = None
    contact_number: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact: Optional[str] = None
    medical_history: Optional[str] = None
    family_history: Optional[str] = None
    allergies: Optional[str] = None

class PatientCreate(PatientBase):
    pass

class PatientRead(PatientBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# ----------------- TEST SCHEMAS -----------------
class TestBase(BaseModel):
    hb: Optional[float] = None
    rbc: Optional[float] = None
    pcv: Optional[float] = None
    mcv: Optional[float] = None
    mch: Optional[float] = None
    mchc: Optional[float] = None
    rdw: Optional[float] = None
    wbc: Optional[float] = None
    neut: Optional[float] = None
    lymph: Optional[float] = None
    plt: Optional[float] = None
    hba: Optional[float] = None
    hba2: Optional[float] = None
    hbf: Optional[float] = None
    status: TestStatus = TestStatus.PENDING

class TestCreate(TestBase):
    patient_id: int

class TestRead(TestBase):
    id: int
    patient_id: int
    file_url: Optional[str] = None
    created_by: Optional[int] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class EnrichedTestRead(BaseModel):
    id: int
    patientId: int
    patientName: str
    status: str
    createdAt: datetime
    hb: Optional[float] = None
    mcv: Optional[float] = None
    mch: Optional[float] = None

# ----------------- PREDICTION SCHEMAS -----------------
class PredictionBase(BaseModel):
    test_id: int
    final_diagnosis: Optional[str] = None
    confidence: Optional[float] = None
    agreement_rate: Optional[str] = None
    clinical_status: Optional[str] = None
    risk_score: Optional[float] = None
    classification: Optional[str] = None
    model_predictions: Optional[Dict[str, str]] = None
    probabilities: Optional[Dict[str, Dict[str, float]]] = None
    ensemble_probabilities: Optional[Dict[str, float]] = None
    derived_indices: Optional[Dict[str, float]] = None
    dna_recommendation: Optional[str] = None
    doctor_notes: Optional[str] = None
    doctor_analysis: Optional[str] = None
    dna_override_reason: Optional[str] = None
    is_finalized: bool = False
    model_version: Optional[str] = "2.0+Confidence"

class PredictionCreate(PredictionBase):
    pass

class PredictionRead(PredictionBase):
    id: int
    finalized_by: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True

class EnrichedPredictionRead(BaseModel):
    id: int
    patientId: Optional[int] = None
    patientName: str
    risk: str
    classification: str
    confidence: float
    agreement_rate: Optional[str] = None
    clinical_status: Optional[str] = None
    status: str
    createdAt: str
    modelVersion: str
    dnaRecommended: bool
    ensemble_probabilities: Optional[Dict[str, float]] = None
