# =============================================================================
# preprocessing.py — Clinical Stress / Chaos Protocol
# Implements apply_clinical_stress() used by ALL training scripts.
# =============================================================================

import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
import joblib
import os
from config import (GLOBAL_SIGMA, DROPOUT_RATE, DROPOUT_COLS,
                    MIMICRY_SIGMA, MIMICRY_COLS,
                    LABEL_NOISE_RATE, PARAM_DIR)


def apply_clinical_stress(df: pd.DataFrame, seed: int = 42) -> pd.DataFrame:
    """
    Apply Phase-5 Clinical Stress to a raw (already-scaled) dataframe.

    Steps
    ─────
    1. Global Gaussian Noise  (σ = GLOBAL_SIGMA) on every numerical feature.
    2. Targeted Mimicry Noise (σ = MIMICRY_SIGMA) on HB + RBC to blur the
       Infection / Iron-Deficiency boundary.
    3. Feature Dropout        (DROPOUT_RATE) — zero out RDW, HBA2, Mentzer_Index.
    4. Label Noise            (LABEL_NOISE_RATE) — randomly swap class 1 ↔ 2
       to simulate biological mimicry in borderline cases.

    Parameters
    ----------
    df   : DataFrame with feature columns + 'label' column
    seed : random seed for reproducibility

    Returns
    -------
    Stressed copy of df
    """
    rng = np.random.default_rng(seed)
    out = df.copy()

    num_cols = [c for c in out.columns if c != "label"]

    # ── Step 1: Global Gaussian Noise ─────────────────────────────────────────
    noise = rng.normal(0, GLOBAL_SIGMA, size=(len(out), len(num_cols)))
    out[num_cols] = out[num_cols].values + noise

    # ── Step 2: Targeted Mimicry Noise (HB + RBC) ─────────────────────────────
    for col in MIMICRY_COLS:
        if col in out.columns:
            out[col] += rng.normal(0, MIMICRY_SIGMA, size=len(out))

    # ── Step 3: Feature Dropout ────────────────────────────────────────────────
    for col in DROPOUT_COLS:
        if col in out.columns:
            mask = rng.random(len(out)) < DROPOUT_RATE
            out.loc[mask, col] = 0.0

    # ── Step 4: Label Noise (class 1 ↔ 2 swap) ────────────────────────────────
    candidates = out[out["label"].isin([1, 2])].index.tolist()
    n_swap = int(len(candidates) * LABEL_NOISE_RATE)
    swap_idx = rng.choice(candidates, size=n_swap, replace=False)
    out.loc[swap_idx, "label"] = out.loc[swap_idx, "label"].map(
        {1: 2, 2: 1}
    )

    return out


def fit_and_save_scaler(X_train: np.ndarray, seed: int = 42) -> StandardScaler:
    """
    Fit a StandardScaler on training data and save it to Brain/parameters/.
    Returns the fitted scaler.
    """
    scaler = StandardScaler()
    scaler.fit(X_train)
    out_path = os.path.join(PARAM_DIR, "scaler.joblib")
    joblib.dump(scaler, out_path)
    print(f"[Scaler] Saved -> {out_path}")
    return scaler


def load_data(train_csv: str, test_csv: str, seed: int = 42):
    """
    Load CSVs, apply clinical stress, fit+save scaler, return arrays.

    Returns
    -------
    X_tr, y_tr, X_ts, y_ts, feature_cols
    """
    train_df = pd.read_csv(train_csv)
    test_df  = pd.read_csv(test_csv)

    # Apply chaos to BOTH sets
    train_stressed = apply_clinical_stress(train_df, seed=seed)
    test_stressed  = apply_clinical_stress(test_df,  seed=seed + 1000)

    feature_cols = [c for c in train_df.columns if c != "label"]

    X_tr_raw = train_stressed[feature_cols].values
    y_tr     = train_stressed["label"].values.astype(int)
    X_ts_raw = test_stressed[feature_cols].values
    y_ts     = test_stressed["label"].values.astype(int)

    # Scale — fit ONLY on training data
    scaler = fit_and_save_scaler(X_tr_raw, seed=seed)
    X_tr = scaler.transform(X_tr_raw)
    X_ts = scaler.transform(X_ts_raw)

    return X_tr, y_tr, X_ts, y_ts, feature_cols


# ── Noise Summary (printed once for audit trail) ──────────────────────────────
def print_chaos_config():
    print("=" * 60)
    print("  Phase-5 Clinical Stress Configuration")
    print("=" * 60)
    print(f"  Global Gaussian Noise sigma : {GLOBAL_SIGMA}")
    print(f"  Targeted Mimicry sigma      : {MIMICRY_SIGMA}  (cols: {MIMICRY_COLS})")
    print(f"  Feature Dropout Rate    : {DROPOUT_RATE*100:.0f}%  (cols: {DROPOUT_COLS})")
    print(f"  Label Noise Rate (1->2)  : {LABEL_NOISE_RATE*100:.0f}%")
    print("=" * 60)
