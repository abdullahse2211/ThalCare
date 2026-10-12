from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from database import get_db
from models import Patient, User, Test, Prediction
from schemas import PatientCreate, PatientRead, TestRead, PredictionRead
from auth_handler import get_current_user
from typing import List

router = APIRouter(
    prefix="/api/v1/patients",
    tags=["Patients"],
)

@router.get("", response_model=List[PatientRead])
def get_all_patients(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    patients = db.query(Patient).offset(skip).limit(limit).all()
    return patients

@router.get("/pending-test", response_model=List[PatientRead])
def get_patients_needing_test(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns patients visible in doctor's Pending Tests queue.
    A patient stays in this list until a doctor FINALIZES their prediction
    (test status = COMPLETED). Simply submitting or verifying a test
    does NOT remove the patient from this list.
    """
    from sqlalchemy import not_, exists
    from models import TestStatus

    # Only remove patient once their test is COMPLETED (doctor finalized)
    has_finalized_test = exists().where(
        (Test.patient_id == Patient.id) &
        (Test.status == TestStatus.COMPLETED)
    )

    # Return patients who do NOT have any COMPLETED test
    # (i.e. they are either new or their tests are still PENDING/VERIFIED/PREDICTION_DONE)
    patients = db.query(Patient).filter(
        not_(has_finalized_test)
    ).order_by(Patient.created_at.desc()).all()
    return patients

@router.get("/search", response_model=List[PatientRead])
def search_patients(
    q: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    search = f"%{q}%"
    patients = db.query(Patient).filter(
        or_(
            Patient.first_name.ilike(search),
            Patient.last_name.ilike(search),
            Patient.mrn.ilike(search)
        )
    ).all()
    return patients

@router.get("/{patient_id}", response_model=PatientRead)
def get_patient(
    patient_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient

@router.post("", response_model=PatientRead, status_code=status.HTTP_201_CREATED)
def create_patient(
    patient: PatientCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_patient = db.query(Patient).filter(Patient.mrn == patient.mrn).first()
    if db_patient:
        raise HTTPException(status_code=400, detail="Patient with this MRN already exists")
    
    new_patient = Patient(**patient.model_dump())
    db.add(new_patient)
    db.commit()
    db.refresh(new_patient)
    return new_patient

@router.put("/{patient_id}", response_model=PatientRead)
def update_patient(
    patient_id: int, 
    patient_data: PatientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not db_patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    for key, value in patient_data.model_dump().items():
        setattr(db_patient, key, value)
        
    db.commit()
    db.refresh(db_patient)
    return db_patient

@router.delete("/{patient_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Only Admin or Doctor might delete depending on rules, assuming all authenticated for now
    db_patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not db_patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    db.delete(db_patient)
    db.commit()

@router.get("/{patient_id}/tests", response_model=List[TestRead])
def get_patient_tests(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tests = db.query(Test).filter(Test.patient_id == patient_id).all()
    return tests

@router.get("/{patient_id}/predictions", response_model=List[PredictionRead])
def get_patient_predictions(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    predictions = db.query(Prediction).join(Test).filter(Test.patient_id == patient_id).all()
    return predictions
