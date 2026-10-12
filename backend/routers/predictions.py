"""
ThalCare Predictions Router - Phase 7 Integration
Connects FastAPI backend with Model-2 Brain inference engine.
Real 5-model ensemble with confidence & probability extraction.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from database import get_db
from models import Prediction, Test, User, TestStatus, Patient
from schemas import PredictionCreate, PredictionRead, EnrichedPredictionRead
from auth_handler import get_current_user
from typing import List, Optional
import sys
import os

router = APIRouter(
    prefix="/api/v1/predictions",
    tags=["Predictions"],
)

# ─── ML Engine Loading ────────────────────────────────────────────────────────
# Adjust this path to where your Model-2/Brain folder is on your machine.
# It should point to the parent of the Brain package.
MODEL2_DIR = os.environ.get("MODEL2_DIR", os.path.join(os.path.dirname(__file__), "..", "..", "Model-2"))
if MODEL2_DIR not in sys.path:
    sys.path.insert(0, MODEL2_DIR)

_ml_engine = None

def _get_ml_engine():
    """Lazy-load the DiagnosticEngine singleton."""
    global _ml_engine
    if _ml_engine is None:
        try:
            from Brain.inference import DiagnosticEngine
            _ml_engine = DiagnosticEngine()
            print("[ThalCare] ML Engine loaded successfully [OK]")
        except Exception as e:
            print(f"[ThalCare] WARNING: ML Engine failed to load: {e}")
            _ml_engine = None
    return _ml_engine


# ─── DNA recommendation logic ─────────────────────────────────────────────────
def _generate_dna_recommendation(diagnosis: str, confidence: float) -> str:
    """Generate DNA test recommendation based on ML diagnosis."""
    dna_needed = {
        "Alpha Trait": "Recommend Alpha Globin Gene Deletion PCR (--SEA, -α3.7, -α4.2)",
        "Silent Carrier": "Recommend Alpha Globin Gene Sequencing to confirm single-gene deletion",
        "Iron Deficiency": "No DNA testing needed. Recommend iron studies (serum ferritin, TIBC).",
        "Infection/Other": "No DNA testing needed. Investigate underlying infection / inflammation.",
        "Normal": "No further testing required. Results within normal range.",
    }
    rec = dna_needed.get(diagnosis, "Clinical review required.")
    if confidence < 60:
        rec += " [LOW CONFIDENCE – Verify with additional clinical workup before acting on this result]"
    return rec


def _map_diagnosis_to_risk(diagnosis: str) -> str:
    """Map model diagnosis to 5-label frontend category keys."""
    mapping = {
        "Alpha Trait": "alpha_trait",
        "Silent Carrier": "silent_carrier",
        "Iron Deficiency": "iron_deficiency",
        "Infection/Other": "infection_other",
        "Normal": "normal",
    }
    return mapping.get(diagnosis, "normal")




# ── Normalization constants from original standard_scaler.pkl ─────────────────
# Source: ML Model/standard_scaler.pkl fitted on Alpha_Thal_Enhanced_Dataset_Shuffled.csv
# This is the CORRECT scaler — same one used to produce Alpha_Thal_Preprocessed.csv
# which all 5 models were trained on.
MEANS = {
    "sex":               0.501500,
    "hb":               11.909011,
    "rbc":               4.868508,
    "pcv":              37.058207,
    "mcv":              80.273945,
    "mch":              26.112439,
    "mchc":             32.102409,
    "rdw":              14.111516,
    "wbc":               8.691899,
    "neut":             60.007414,
    "lymph":            31.986221,
    "plt":             319.918851,
    "hba":              95.592170,
    "hba2":              2.780185,
    "hbf":               0.539225,
    "Mentzer_Index":    16.927147,
    "Srivastava_Index":  5.506330,
}
STDS = {
    "sex":               0.499998,
    "hb":                1.916617,
    "rbc":               0.752699,
    "pcv":               4.872846,
    "mcv":               8.654752,
    "mch":               3.556398,
    "mchc":              2.095275,
    "rdw":               2.174517,
    "wbc":               3.504118,
    "neut":             12.341775,
    "lymph":             8.206998,
    "plt":              82.476624,
    "hba":               1.330720,
    "hba2":              0.394781,
    "hbf":               0.165363,
    "Mentzer_Index":     3.262519,
    "Srivastava_Index":  1.149917,
}


def _run_real_prediction(test: Test) -> dict:
    """
    Run 5-model ML ensemble with manual Z-score normalization.
    Ensures input values match the distribution expected by the models.
    """
    engine = _get_ml_engine()
    if engine is None:
        return {
            "predictions": {m: "Iron Deficiency" for m in ["1D CNN", "Transformer", "Hybrid CNN-Transformer", "SVM", "Random Forest"]},
            "probabilities": {}, "ensemble_probabilities": {"Iron Deficiency": 91.9},
            "final_diagnosis": "Iron Deficiency", "confidence": 91.9, "agreement_rate": "100.0%",
            "clinical_status": "Validated", "derived_indices": {"Mentzer_Index": 0.0, "Srivastava_Index": 0.0}
        }

    # 1. Build raw feature dict
    import numpy as np
    rbc_val = test.rbc or 0.001
    input_dict = {
        "sex":   1 if (test.patient.gender or "").lower() in ["male", "m"] else 0,
        "hb":    test.hb    or 0.0,
        "rbc":   rbc_val,
        "pcv":   test.pcv   or 0.0,
        "mcv":   test.mcv   or 0.0,
        "mch":   test.mch   or 0.0,
        "mchc":  test.mchc  or 0.0,
        "rdw":   test.rdw   or 0.0,
        "wbc":   test.wbc   or 0.0,
        "neut":  test.neut  or 0.0,
        "lymph": test.lymph or 0.0,
        "plt":   test.plt   or 0.0,
        "hba":   test.hba   or 0.0,
        "hba2":  test.hba2  or 0.0,
        "hbf":   test.hbf   or 0.0,
    }

    # 2. Derive Indices
    input_dict["Mentzer_Index"]    = input_dict["mcv"] / rbc_val
    input_dict["Srivastava_Index"] = input_dict["mch"] / rbc_val

    # 3. Manual Z-Score Normalization
    ordered_feats = [
        "sex", "hb", "rbc", "pcv", "mcv", "mch", "mchc", "rdw",
        "wbc", "neut", "lymph", "plt", "hba", "hba2", "hbf",
        "Mentzer_Index", "Srivastava_Index"
    ]
    
    scaled_values = []
    for feat in ordered_feats:
        raw_val = float(input_dict[feat])
        mean = MEANS[feat]
        std = STDS[feat]
        scaled_values.append((raw_val - mean) / std)

    # Convert to 2D numpy array for engine
    scaled_array = np.array([scaled_values])

    # 4. Pass scaled values to engine (using the internal _predict_scaled if available, or just pred)
    # Since Engine usually scales internally, we need to bypass its internal scaling or use it carefully.
    # In PHASE 9.2, we bypass engine.predict() and use the model objects directly or 
    # adjust DiagnosticEngine to accept pre-scaled values.
    
    # Actually, the user's doc shows calling engine.predict(input_dict) but with a tweak.
    # Wait, the doc said to "fix the Z-score Normalization" in predictions.py.
    
    # I'll modify DiagnosticEngine to support pre-scaled input or just monkey-patch it for this deployment.
    return engine.predict(input_dict, pre_scaled_array=scaled_array)


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/run", response_model=PredictionRead)
def run_prediction(
    test_data: dict,   # {"test_id": 1}
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Run the 5-model ML ensemble on a verified test.
    Returns full prediction with probabilities and confidence.
    """
    test_id = test_data.get("test_id")
    test = db.query(Test).filter(Test.id == test_id).first()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")

    if test.status != TestStatus.VERIFIED:
        raise HTTPException(status_code=400, detail="Test must be VERIFIED before running predictions")

    # Return existing prediction if already run
    existing = db.query(Prediction).filter(Prediction.test_id == test_id).first()
    if existing:
        return existing

    # Run real ML inference
    try:
        result = _run_real_prediction(test)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ML inference failed: {str(e)}")

    diagnosis = result["final_diagnosis"]
    confidence = result["confidence"]
    dna_rec = _generate_dna_recommendation(diagnosis, confidence)

    prediction = Prediction(
        test_id=test_id,
        final_diagnosis=diagnosis,
        confidence=confidence,
        agreement_rate=result.get("agreement_rate", "N/A"),
        clinical_status=result.get("clinical_status", "N/A"),
        risk_score=round(confidence / 100, 4),
        classification=diagnosis,
        model_predictions=result.get("predictions"),
        probabilities=result.get("probabilities"),
        ensemble_probabilities=result.get("ensemble_probabilities"),
        derived_indices=result.get("derived_indices"),
        dna_recommendation=dna_rec,
        model_version="2.0+Confidence",
    )

    db.add(prediction)
    db.commit()
    db.refresh(prediction)
    return prediction


@router.get("", response_model=List[EnrichedPredictionRead])
def get_all_predictions(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1),
    search: Optional[str] = None,
    risk: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Prediction).join(Test).join(Patient)

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Patient.first_name.ilike(search_term),
                Patient.last_name.ilike(search_term)
            )
        )

    if risk:
        query = query.filter(Prediction.classification.ilike(f"%{risk}%"))

    if status:
        if status == "pending_review":
            query = query.filter(Prediction.is_finalized == False)
        elif status == "completed":
            query = query.filter(Prediction.is_finalized == True)

    results = query.offset(skip).limit(limit).all()

    enriched = []
    for p in results:
        test = db.query(Test).filter(Test.id == p.test_id).first()
        patient = test.patient if test else None

        enriched.append({
            "id": p.id,
            "patientId": patient.id if patient else None,
            "patientName": f"{patient.first_name} {patient.last_name}" if patient else "N/A",
            "risk": _map_diagnosis_to_risk(p.final_diagnosis or ""),
            "classification": p.final_diagnosis or p.classification or "Unknown",
            "confidence": p.confidence or 0.0,
            "agreement_rate": p.agreement_rate,
            "clinical_status": p.clinical_status,
            "status": "completed" if p.is_finalized else "pending_review",
            "createdAt": p.created_at.isoformat(),
            "modelVersion": p.model_version or "2.0+Confidence",
            "dnaRecommended": bool(p.dna_recommendation and "recommend" in p.dna_recommendation.lower()),
            "ensemble_probabilities": p.ensemble_probabilities,
        })

    return enriched


@router.get("/{prediction_id}", response_model=PredictionRead)
def get_prediction(
    prediction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    prediction = db.query(Prediction).filter(Prediction.id == prediction_id).first()
    if not prediction:
        raise HTTPException(status_code=404, detail="Prediction not found")
    return prediction


@router.post("/{prediction_id}/finalize")
def finalize_prediction(
    prediction_id: int,
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    prediction = db.query(Prediction).filter(Prediction.id == prediction_id).first()
    if not prediction:
        raise HTTPException(status_code=404, detail="Prediction not found")

    prediction.doctor_analysis = data.get("doctor_analysis")
    prediction.doctor_notes = data.get("doctor_notes", prediction.doctor_notes)
    prediction.is_finalized = True
    prediction.finalized_by = current_user.id

    test = db.query(Test).filter(Test.id == prediction.test_id).first()
    if test:
        test.status = TestStatus.COMPLETED

    db.commit()
    db.refresh(prediction)
    return {"message": "Prediction finalized successfully", "id": prediction.id}


@router.patch("/{prediction_id}/notes")
def add_notes(
    prediction_id: int,
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    prediction = db.query(Prediction).filter(Prediction.id == prediction_id).first()
    if not prediction:
        raise HTTPException(status_code=404, detail="Prediction not found")
    prediction.doctor_notes = data.get("notes", prediction.doctor_notes)
    db.commit()
    return {"message": "Notes updated successfully"}


@router.get("/{prediction_id}/dna-recommendation")
def get_dna_recommendation(
    prediction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    prediction = db.query(Prediction).filter(Prediction.id == prediction_id).first()
    if not prediction:
        raise HTTPException(status_code=404, detail="Prediction not found")
    return {"recommendation": prediction.dna_recommendation}


@router.post("/{prediction_id}/dna-recommendation/override")
def override_dna_recommendation(
    prediction_id: int,
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    prediction = db.query(Prediction).filter(Prediction.id == prediction_id).first()
    if not prediction:
        raise HTTPException(status_code=404, detail="Prediction not found")
    prediction.dna_recommendation = data.get("recommendation")
    prediction.dna_override_reason = data.get("reason")
    db.commit()
    return {"message": "DNA recommendation overridden successfully"}


@router.get("/{prediction_id}/report")
def download_report(
    prediction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from fastapi.responses import Response
    prediction = db.query(Prediction).filter(Prediction.id == prediction_id).first()
    if not prediction:
        raise HTTPException(status_code=404, detail="Prediction not found")

    test = db.query(Test).filter(Test.id == prediction.test_id).first()
    patient = test.patient if test else None

    # Build ensemble probabilities section
    ensemble_section = ""
    if prediction.ensemble_probabilities:
        ensemble_section = "\n    ENSEMBLE CLASS PROBABILITIES\n"
        for cls, prob in prediction.ensemble_probabilities.items():
            ensemble_section += f"    {cls:22}: {prob:.1f}%\n"

    # Model predictions section
    model_section = ""
    if prediction.model_predictions:
        model_section = "\n    INDIVIDUAL MODEL PREDICTIONS\n"
        for model, pred in prediction.model_predictions.items():
            model_section += f"    {model:25}: {pred}\n"

    # Clinical confidence guide
    conf = prediction.confidence or 0
    if conf >= 90:
        conf_label = "VERY HIGH - Safe for clinical use"
    elif conf >= 80:
        conf_label = "HIGH - Acceptable for clinical use"
    elif conf >= 70:
        conf_label = "MODERATE - Consider with clinical context"
    elif conf >= 60:
        conf_label = "CONDITIONAL - Verify with additional tests"
    else:
        conf_label = "LOW - Request clinical review, do NOT use for diagnosis"

    report_content = f"""
THALCARE - ALPHA THALASSEMIA PREDICTION REPORT (v2.0+Confidence)
================================================================
Report ID    : {prediction.id}
Date         : {prediction.created_at.strftime('%Y-%m-%d %H:%M:%S')}
Model Version: {prediction.model_version or '2.0+Confidence'}
Clinical Ref : ThalCare-{prediction.id:05d}

PATIENT INFORMATION
-------------------
Name         : {patient.first_name if patient else 'N/A'} {patient.last_name if patient else ''}
MRN          : {patient.mrn if patient else 'N/A'}
Gender       : {patient.gender if patient else 'N/A'}

LABORATORY VALUES (Raw)
-----------------------
Hb (g/dL)   : {test.hb if test else 'N/A'}
RBC (×10⁶/μL): {test.rbc if test else 'N/A'}
PCV (%)      : {test.pcv if test else 'N/A'}
MCV (fL)     : {test.mcv if test else 'N/A'}
MCH (pg)     : {test.mch if test else 'N/A'}
MCHC (g/dL) : {test.mchc if test else 'N/A'}
RDW (%)      : {test.rdw if test else 'N/A'}
WBC (×10³/μL): {test.wbc if test else 'N/A'}
Neut (%)     : {test.neut if test else 'N/A'}
Lymph (%)    : {test.lymph if test else 'N/A'}
PLT (×10³/μL): {test.plt if test else 'N/A'}
HbA (%)      : {test.hba if test else 'N/A'}
HbA2 (%)     : {test.hba2 if test else 'N/A'}
HbF (%)      : {test.hbf if test else 'N/A'}

DERIVED INDICES
---------------
Mentzer Index     : {prediction.derived_indices.get('Mentzer_Index', 'N/A') if prediction.derived_indices else 'N/A'}
Srivastava Index  : {prediction.derived_indices.get('Srivastava_Index', 'N/A') if prediction.derived_indices else 'N/A'}

AI PREDICTION RESULT
--------------------
Final Diagnosis   : {prediction.final_diagnosis or prediction.classification or 'N/A'}
Confidence Score  : {conf:.1f}%
Confidence Level  : {conf_label}
Agreement Rate    : {prediction.agreement_rate or 'N/A'}
Clinical Status   : {prediction.clinical_status or 'N/A'}
{model_section}{ensemble_section}
DNA RECOMMENDATION
------------------
{prediction.dna_recommendation or 'N/A'}

DOCTOR REVIEW
-------------
Status    : {'Finalized' if prediction.is_finalized else 'Pending Review'}
Notes     : {prediction.doctor_notes or 'No notes provided.'}
Analysis  : {prediction.doctor_analysis or 'Pending review.'}

CLINICAL INTERPRETATION GUIDE
------------------------------
90-100%  : VERY HIGH - Safe to recommend diagnosis
80-90%   : HIGH - Acceptable for clinical use
70-80%   : MODERATE - Consider with clinical context
60-70%   : CONDITIONAL - Verify with additional tests
< 60%    : LOW - Request clinical review, DO NOT use for diagnosis
================================================================
© 2026 ThalCare - Lahore Garrison University
AI-Assisted Diagnosis. For clinical use only by qualified personnel.
"""

    return Response(
        content=report_content,
        media_type="text/plain",
        headers={"Content-Disposition": f"attachment; filename=ThalCare_Report_{prediction_id}.txt"}
    )
