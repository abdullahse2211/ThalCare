import os
import sys
import torch
import torch.nn.functional as F
import joblib
import numpy as np
from collections import Counter

# Resolve imports relative to this file's directory (Brain/)
_brain_dir = os.path.dirname(os.path.abspath(__file__))
if _brain_dir not in sys.path:
    sys.path.insert(0, _brain_dir)

from model import CNN1D, TransformerClassifier, HybridCNNTransformer
from config import LABEL_MAP, PARAM_DIR, MODEL_DIR

# =============================================================================
# inference.py -- Clinical Diagnostic Inference Engine
# Loads all models and provides a majority-vote diagnosis.
# AUTO-CALCULATES derived indices (Mentzer & Srivastava) from lab inputs.
# =============================================================================

# 15 REAL LAB FEATURES - What the frontend/user provides
REAL_LAB_FEATURES = [
    "sex", "hb", "rbc", "pcv", "mcv", "mch", "mchc", "rdw",
    "wbc", "neut", "lymph", "plt", "hba", "hba2", "hbf"
]
N_REAL_FEATURES = len(REAL_LAB_FEATURES)  # 15

# ALL 17 FEATURES - For model inference (includes derived indices)
FEATURE_ORDER = [
    "sex", "hb", "rbc", "pcv", "mcv", "mch", "mchc", "rdw",
    "wbc", "neut", "lymph", "plt", "hba", "hba2", "hbf",
    "Mentzer_Index", "Srivastava_Index"
]
N_FEATURES = len(FEATURE_ORDER)  # 17


class DiagnosticEngine:
    def __init__(self):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

        # 1. Load Scaler (inference-specific, trained on raw/non-stressed data)
        scaler_path = os.path.join(PARAM_DIR, "inference_scaler.joblib")
        if not os.path.exists(scaler_path):
            # Fallback to training scaler if inference scaler not available
            scaler_path = os.path.join(PARAM_DIR, "scaler.joblib")
            print(f"[WARNING] Using training scaler (not optimized for inference)")
        
        self.scaler = joblib.load(scaler_path)
        print(f"[Scaler] Loaded from: {scaler_path}")

        # 2. Initialize Model Architectures
        self.cnn = CNN1D(N_FEATURES).to(self.device)
        self.transformer = TransformerClassifier(N_FEATURES).to(self.device)
        self.hybrid = HybridCNNTransformer(N_FEATURES).to(self.device)

        # 3. Load Model Weights
        self._load_weights()

    def _load_weights(self):
        """Load .pth and .pkl files."""
        self.cnn.load_state_dict(
            torch.load(os.path.join(MODEL_DIR, "cnn_model.pth"), map_location=self.device))
        self.transformer.load_state_dict(
            torch.load(os.path.join(MODEL_DIR, "transformer_model.pth"), map_location=self.device))
        self.hybrid.load_state_dict(
            torch.load(os.path.join(MODEL_DIR, "hybrid_model.pth"), map_location=self.device))

        self.cnn.eval()
        self.transformer.eval()
        self.hybrid.eval()

        self.svm = joblib.load(os.path.join(MODEL_DIR, "svm_model.pkl"))
        self.rf  = joblib.load(os.path.join(MODEL_DIR, "random_forest_model.pkl"))

    def _get_svm_probabilities(self, scaled_values: np.ndarray) -> np.ndarray:
        """
        Extract probabilities from SVM model.
        If SVM supports predict_proba, use it. Otherwise use decision_function with softmax.
        
        Returns:
            Array of shape (1, n_classes) with probabilities summing to 1.
        """
        # Check if SVM supports predict_proba
        if hasattr(self.svm, 'predict_proba'):
            return self.svm.predict_proba(scaled_values)
        else:
            # Fallback: Use decision_function and convert with softmax
            decision_scores = self.svm.decision_function(scaled_values)  # shape: (1, n_classes)
            
            # Apply softmax to convert decision scores to probabilities
            exp_scores = np.exp(decision_scores - np.max(decision_scores, axis=1, keepdims=True))
            probabilities = exp_scores / np.sum(exp_scores, axis=1, keepdims=True)
            return probabilities

    def predict(self, input_dict: dict, pre_scaled_array: np.ndarray = None) -> dict:
        """
        Clinical diagnostic inference pipeline.
        
        Takes 15 normalized lab features (+ sex as string or int), auto-calculates 
        2 derived indices, scales them for model input, and returns ensemble predictions.
        
        NOTE: Clinical stress is NOT applied during inference (training-only).

        Args:
            input_dict: Dictionary with 15 lab features:
                sex (0=female, "female", 1=male, "male"),
                hb, rbc, pcv, mcv, mch, mchc, rdw,
                wbc, neut, lymph, plt, hba, hba2, hbf

        Returns:
            Dictionary with predictions from all 5 models + final diagnosis.

        Raises:
            ValueError: If required features are missing
            TypeError: If feature values cannot be converted to float
        """
        # ─ STEP 1: Validate feature count ─────────────────────────────────
        provided_features = set(input_dict.keys())
        required_features = set(REAL_LAB_FEATURES)
        missing_features = required_features - provided_features
        
        if missing_features:
            raise ValueError(
                f"FEATURE MISMATCH: Missing {len(missing_features)} required lab features.\n"
                f"Expected features ({N_REAL_FEATURES}): {REAL_LAB_FEATURES}\n"
                f"Missing: {sorted(missing_features)}\n"
                f"Provided ({len(provided_features)}): {sorted(provided_features)}"
            )
        
        extra_features = provided_features - required_features
        if extra_features:
            print(f"WARNING: Extra features provided (will be ignored): {sorted(extra_features)}")
        
        # ─ STEP 2: Type validation & conversion ──────────────────────────
        try:
            numeric_dict = {}
            for feat in REAL_LAB_FEATURES:
                value = input_dict[feat]
                
                # Special handling for "sex" - convert string to int if needed
                if feat == "sex":
                    if isinstance(value, str):
                        lower_val = value.lower().strip()
                        if lower_val in ["female", "f", "0"]:
                            numeric_dict[feat] = 0.0
                        elif lower_val in ["male", "m", "1"]:
                            numeric_dict[feat] = 1.0
                        else:
                            raise ValueError(f"sex must be 'male', 'female', 0, or 1, got: {value}")
                    else:
                        numeric_dict[feat] = float(value)
                else:
                    # All other values converted to float
                    numeric_dict[feat] = float(value)
                    
        except (TypeError, ValueError) as e:
            raise TypeError(
                f"DATATYPE ERROR: Feature '{feat}' has invalid value '{value}'.\n"
                f"All features must be numeric (int or float), sex can be 'male'/'female'.\n"
                f"Error: {e}"
            )
        
        # ─ STEP 3: Auto-calculate derived indices (NO STRESS) ──────────────
        rbc = numeric_dict["rbc"]
        
        # Guard against division by zero
        if rbc != 0:
            mentzer = float(numeric_dict["mcv"]) / rbc
            srivastava = float(numeric_dict["mch"]) / rbc
        else:
            print(f"WARNING: RBC is 0, setting derived indices to 0.0")
            mentzer = 0.0
            srivastava = 0.0
        
        numeric_dict["Mentzer_Index"] = mentzer
        numeric_dict["Srivastava_Index"] = srivastava
        
        # ─ STEP 4: Build feature array in EXACT model order ──────────────
        # NO clinical stress applied - that's only for training robustness
        raw_values = np.array([[numeric_dict[f] for f in FEATURE_ORDER]])

        # ─ STEP 5: Scale for model input ────────────────────────────────
        if pre_scaled_array is not None:
            scaled_values = pre_scaled_array
        else:
            scaled_values = self.scaler.transform(raw_values)

        # ─ STEP 6: Get predictions AND probabilities from all 5 models ──────────────
        xt = torch.FloatTensor(scaled_values.astype(np.float32)).unsqueeze(-1).to(self.device)
        
        with torch.no_grad():
            # PyTorch models - extract probabilities with softmax
            cnn_logits = self.cnn(xt)
            cnn_probs = F.softmax(cnn_logits, dim=1).squeeze().cpu().numpy() * 100  # Convert to percentage
            cnn_pred = int(cnn_logits.argmax(1).item())
            
            transformer_logits = self.transformer(xt)
            transformer_probs = F.softmax(transformer_logits, dim=1).squeeze().cpu().numpy() * 100
            transformer_pred = int(transformer_logits.argmax(1).item())
            
            hybrid_logits = self.hybrid(xt)
            hybrid_probs = F.softmax(hybrid_logits, dim=1).squeeze().cpu().numpy() * 100
            hybrid_pred = int(hybrid_logits.argmax(1).item())

        # ML Predictions - extract probabilities
        try:
            svm_probs = self._get_svm_probabilities(scaled_values).squeeze() * 100  # Convert to percentage
            svm_pred = int(self.svm.predict(scaled_values)[0])
        except Exception as e:
            print(f"[WARNING] SVM probability extraction failed: {e}")
            svm_probs = np.ones(len(LABEL_MAP)) / len(LABEL_MAP) * 100
            svm_pred = int(self.svm.predict(scaled_values)[0])
        
        rf_probs = self.rf.predict_proba(scaled_values).squeeze() * 100  # Convert to percentage
        rf_pred = int(self.rf.predict(scaled_values)[0])

        all_preds = [cnn_pred, transformer_pred, hybrid_pred, svm_pred, rf_pred]
        
        # ─ STEP 7: Calculate ensemble probabilities (SOFT VOTING) ──────────────────
        # Average probabilities across all 5 models per class
        all_probs = np.array([cnn_probs, transformer_probs, hybrid_probs, svm_probs, rf_probs])
        ensemble_probs = np.mean(all_probs, axis=0)  # Shape: (5,) - average across 5 models
        
        # FINAL DIAGNOSIS SELECTION: Argmax of Ensemble Probabilities (Soft Voting)
        # This is more robust than majority voting for borderline cases
        final_class = int(np.argmax(ensemble_probs))
        
        # ─ STEP 8: Medical Priority Heuristic (Tie-Breaker for Silent Carrier) ─────
        # If Infection/Other (1) is winning but Silent Carrier (4) has solid evidence
        # AND Mentzer Index is < 14.1 (Biological trait indicator), we prioritize SC.
        inf_idx = 1 # Infection/Other
        sc_idx = 4  # Silent Carrier
        at_idx = 0  # Alpha Trait
        
        if final_class == inf_idx:
            # Check if Silent Carrier or Alpha Trait has high support (> 20% or 2+ models)
            sc_prob = ensemble_probs[sc_idx]
            at_prob = ensemble_probs[at_idx]
            
            sc_votes = all_preds.count(sc_idx)
            at_votes = all_preds.count(at_idx)
            
            # If Silent Carrier has significant probability OR 2+ models predicted it
            # AND Mentzer Index is clinically suspicious (< 15.0 is the Gray Zone), 
            # prioritize Thalassemia to avoid missing a genetic carrier.
            if (sc_prob > 20.0 or sc_votes >= 2) and mentzer < 13.2:
                print(f"[Heuristic] Overriding Infection -> Silent Carrier (Mentzer: {mentzer:.2f})")
                final_class = sc_idx
            elif (at_prob > 20.0 or at_votes >= 2) and mentzer < 14.5:
                print(f"[Heuristic] Overriding Infection -> Alpha Trait (Mentzer: {mentzer:.2f})")
                final_class = at_idx
            
            # ─ NEW: Iron Deficiency vs Infection Rule ─
            # Use label names to be safer against index mapping issues
            winner_label = LABEL_MAP.get(final_class, "Unknown")
            
            if winner_label == "Infection/Other":
                raw_wbc = numeric_dict.get("wbc", input_dict.get("wbc", 0))
                raw_neut = numeric_dict.get("neut", input_dict.get("neut", 0))
                wbc = float(raw_wbc)
                neut = float(raw_neut)
                
                # Clinical Logic: Normal WBC/NEUT ruled out Infection for borderline CBCs
                # Threshold for High WBC in IDA context is typically > 11.0
                if mentzer > 14.1 and wbc <= 11.0 and neut <= 70.0:
                    # OVERRIDE: Change final_class to Iron Deficiency (Class 2)
                    for idx, label in LABEL_MAP.items():
                        if label == "Iron Deficiency":
                            print(f"[Heuristic] IDA OVERRIDE APPLIED: Infection -> Iron Deficiency (WBC: {wbc}, NEUT: {neut})")
                            final_class = idx
                            break
                else:
                    print(f"[Heuristic] IDA Check: No override needed (WBC: {wbc}, Neut: {neut}, Mentzer: {mentzer:.2f})")
            
            # ─ NEW: Viral/Inflammatory Pattern Rule (Normal vs Infection) ─
            # Catching viral markers (low platelets/neutrophils) that the AI might miss in a "Normal" CBC
            if winner_label == "Normal":
                wbc = float(numeric_dict.get("wbc", input_dict.get("wbc", 0)))
                neut = float(numeric_dict.get("neut", input_dict.get("neut", 0)))
                plt = float(numeric_dict.get("plt", input_dict.get("plt", 0)))
                
                if wbc < 4.5 or neut < 40.0 or plt < 150.0:
                    for idx, label in LABEL_MAP.items():
                        if label == "Infection/Other":
                            print(f"[Heuristic] VIRAL OVERRIDE: Normal -> Infection (WBC:{wbc}, NEUT:{neut}, PLT:{plt})")
                            final_class = idx
                            break

        # Calculate agreement rate based on the finalized selection
        vote_counts = Counter(all_preds)
        agreement_rate = (vote_counts.get(final_class, 0) / len(all_preds)) * 100
        
        # Confidence is the ensemble probability of the winning class
        confidence = round(ensemble_probs[final_class], 1)
        
        # Build probability dictionaries for return
        probabilities_dict = {
            "1D CNN": {
                LABEL_MAP.get(i, "Unknown"): round(float(cnn_probs[i]), 1)
                for i in range(len(LABEL_MAP))
            },
            "Transformer": {
                LABEL_MAP.get(i, "Unknown"): round(float(transformer_probs[i]), 1)
                for i in range(len(LABEL_MAP))
            },
            "Hybrid CNN-Transformer": {
                LABEL_MAP.get(i, "Unknown"): round(float(hybrid_probs[i]), 1)
                for i in range(len(LABEL_MAP))
            },
            "SVM": {
                LABEL_MAP.get(i, "Unknown"): round(float(svm_probs[i]), 1)
                for i in range(len(LABEL_MAP))
            },
            "Random Forest": {
                LABEL_MAP.get(i, "Unknown"): round(float(rf_probs[i]), 1)
                for i in range(len(LABEL_MAP))
            }
        }
        
        ensemble_probs_dict = {
            LABEL_MAP.get(i, "Unknown"): round(float(ensemble_probs[i]), 1)
            for i in range(len(LABEL_MAP))
        }

        return {
            "predictions": {
                "1D CNN":                LABEL_MAP.get(cnn_pred, "Unknown"),
                "Transformer":           LABEL_MAP.get(transformer_pred, "Unknown"),
                "Hybrid CNN-Transformer": LABEL_MAP.get(hybrid_pred, "Unknown"),
                "SVM":                   LABEL_MAP.get(svm_pred, "Unknown"),
                "Random Forest":         LABEL_MAP.get(rf_pred, "Unknown"),
            },
            "probabilities": probabilities_dict,
            "ensemble_probabilities": ensemble_probs_dict,
            "final_diagnosis": LABEL_MAP.get(final_class, "Unknown"),
            "confidence": confidence,
            "agreement_rate":  f"{agreement_rate:.1f}%",
            "clinical_status": "Validated" if agreement_rate >= 60 else "Requires Review",
            "derived_indices": {
                "Mentzer_Index": round(mentzer, 4),
                "Srivastava_Index": round(srivastava, 4),
            }
        }


# Singleton for deployment
_engine = None

def predict(input_dict: dict, pre_scaled_array: np.ndarray = None) -> dict:
    """Module-level convenience function."""
    global _engine
    if _engine is None:
        _engine = DiagnosticEngine()
    return _engine.predict(input_dict, pre_scaled_array=pre_scaled_array)

def get_prediction(input_dict: dict) -> dict:
    """Alias kept for Flask compatibility."""
    return predict(input_dict)
