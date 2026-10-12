# =============================================================================
# config.py — Phase 5 Chaos Protocol Configuration
# All scripts import from here so every model uses IDENTICAL stress parameters.
# =============================================================================

import os

# ── Paths ─────────────────────────────────────────────────────────────────────
BASE_DIR   = r"E:\FYP MOHID\Model-2"
BRAIN_DIR  = os.path.join(BASE_DIR, "Brain")
MODEL_DIR  = os.path.join(BRAIN_DIR, "models")
PARAM_DIR  = os.path.join(BRAIN_DIR, "parameters")

TRAIN_CSV  = os.path.join(BASE_DIR, "train_4000.csv")
TEST_CSV   = os.path.join(BASE_DIR, "test_2000.csv")

# ── Chaos Protocol ────────────────────────────────────────────────────────────
GLOBAL_SIGMA   = 0.60          # Gaussian noise applied to ALL numerical features
DROPOUT_RATE   = 0.10          # 10 % feature dropout (set to 0)
DROPOUT_COLS   = ["rdw", "hba2", "Mentzer_Index"]   # columns zeroed out

# Biological mimicry: blur Infection (1) vs Iron Deficiency (2) boundary
MIMICRY_SIGMA       = 1.80     # extra noise on HB & RBC
MIMICRY_COLS        = ["hb", "rbc"]
LABEL_NOISE_RATE    = 0.12     # 12 % label swap between class 1 ↔ 2

# ── Consistency Audit ─────────────────────────────────────────────────────────
RANDOM_STATES = [42, 123, 999]

# ── Label Map ─────────────────────────────────────────────────────────────────
LABEL_MAP = {
    0: "Alpha Trait",
    1: "Infection/Other",
    2: "Iron Deficiency",
    3: "Normal",
    4: "Silent Carrier",
}
TARGET_NAMES = [LABEL_MAP[i] for i in range(5)]

# ── Deep-Learning Hyper-params ────────────────────────────────────────────────
BATCH_SIZE = 32
EPOCHS_HYBRID      = 45
EPOCHS_TRANSFORMER = 40
EPOCHS_CNN         = 35
LEARNING_RATE      = 0.001
