from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form
from sqlalchemy.orm import Session
from database import get_db
from models import Test, User, TestStatus, Patient
from schemas import TestCreate, TestRead, EnrichedTestRead
from auth_handler import get_current_user
from typing import List, Optional
import pandas as pd
import io

router = APIRouter(
    prefix="/api/v1/tests",
    tags=["Tests"],
)

@router.get("")
def get_all_tests(
    skip: int = 0,
    limit: int = 100,
    status: Optional[TestStatus] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Test, Patient.first_name, Patient.last_name)\
        .join(Patient, Test.patient_id == Patient.id, isouter=True)
    if status:
        query = query.filter(Test.status == status)
    results = query.offset(skip).limit(limit).all()
    output = []
    for test, first, last in results:
        d = {c.name: getattr(test, c.name) for c in test.__table__.columns}
        d['patient_name'] = f"{first or ''} {last or ''}".strip()
        output.append(d)
    return output

@router.get("/pending", response_model=List[EnrichedTestRead])
def get_pending_tests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tests = db.query(Test).filter(Test.status == TestStatus.PENDING).all()
    enriched = []
    for t in tests:
        patient = t.patient
        enriched.append({
            "id": t.id,
            "patientId": t.patient_id,
            "patientName": f"{patient.first_name} {patient.last_name}" if patient else "N/A",
            "status": t.status.value,
            "createdAt": t.created_at,
            "hb": t.hb,
            "mcv": t.mcv,
            "mch": t.mch,
        })
    return enriched

@router.get("/{test_id}", response_model=TestRead)
def get_test(
    test_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    test = db.query(Test).filter(Test.id == test_id).first()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    return test

@router.post("", response_model=TestRead, status_code=status.HTTP_201_CREATED)
def create_test(
    test: TestCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    patient = db.query(Patient).filter(Patient.id == test.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    db_test = Test(**test.model_dump(), created_by=current_user.id)
    db.add(db_test)
    db.commit()
    db.refresh(db_test)
    return db_test

@router.put("/{test_id}", response_model=TestRead)
def update_test(
    test_id: int,
    test_data: TestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_test = db.query(Test).filter(Test.id == test_id).first()
    if not db_test:
        raise HTTPException(status_code=404, detail="Test not found")
    
    for key, value in test_data.model_dump().items():
        setattr(db_test, key, value)
        
    db.commit()
    db.refresh(db_test)
    return db_test

@router.delete("/{test_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_test(
    test_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_test = db.query(Test).filter(Test.id == test_id).first()
    if not db_test:
        raise HTTPException(status_code=404, detail="Test not found")
    db.delete(db_test)
    db.commit()

@router.post("/upload")
async def upload_test_file(
    patient_id: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported for now")
    
    try:
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
        
        # Mapping CSV columns to the Test schema. We assume simple mappings for now.
        extracted_data = {}
        for col in df.columns:
            key = col.lower().strip()
            if key in TestCreate.model_fields.keys():
                extracted_data[key] = float(df.iloc[0][col])
        
        extracted_data['patient_id'] = patient_id
        extracted_data['status'] = TestStatus.PENDING
        
        test = Test(**extracted_data, created_by=current_user.id, file_url=file.filename)
        db.add(test)
        db.commit()
        db.refresh(test)
        
        return test
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")

@router.post("/{test_id}/verify")
def verify_test(
    test_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    test = db.query(Test).filter(Test.id == test_id).first()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
        
    test.status = TestStatus.VERIFIED
    db.commit()
    db.refresh(test)
    return test
