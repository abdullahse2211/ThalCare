"""
ThalCare Phase 7 - Database Migration Script
Run this ONCE to add new columns to the existing thalcare.db.

Usage:
    cd backend
    python update_db_phase7.py
"""

import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "thalcare.db")

def migrate():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    # ── Predictions table: new columns ────────────────────────────────────────
    prediction_columns = [
        ("final_diagnosis",        "TEXT"),
        ("confidence",             "REAL"),
        ("agreement_rate",         "TEXT"),
        ("clinical_status",        "TEXT"),
        ("model_predictions",      "TEXT"),   # stored as JSON string
        ("probabilities",          "TEXT"),   # stored as JSON string
        ("ensemble_probabilities", "TEXT"),   # stored as JSON string
        ("derived_indices",        "TEXT"),   # stored as JSON string
        ("model_version",          "TEXT DEFAULT '2.0+Confidence'"),
    ]

    # ── Tests table: new columns (lymph, hba were missing) ────────────────────
    test_columns = [
        ("lymph", "REAL"),
        ("hba",   "REAL"),
    ]

    print("=== ThalCare Phase 7 Database Migration ===\n")

    # Migrate predictions
    cur.execute("PRAGMA table_info(predictions)")
    existing_pred_cols = {row[1] for row in cur.fetchall()}

    for col_name, col_type in prediction_columns:
        if col_name not in existing_pred_cols:
            sql = f"ALTER TABLE predictions ADD COLUMN {col_name} {col_type}"
            cur.execute(sql)
            print(f"  ✓ predictions.{col_name} added")
        else:
            print(f"  - predictions.{col_name} already exists (skipped)")

    # Migrate tests
    cur.execute("PRAGMA table_info(tests)")
    existing_test_cols = {row[1] for row in cur.fetchall()}

    for col_name, col_type in test_columns:
        if col_name not in existing_test_cols:
            sql = f"ALTER TABLE tests ADD COLUMN {col_name} {col_type}"
            cur.execute(sql)
            print(f"  ✓ tests.{col_name} added")
        else:
            print(f"  - tests.{col_name} already exists (skipped)")

    conn.commit()
    conn.close()
    print("\n✅ Migration complete. Your database is ready for Phase 7.")
    print(f"   Database: {DB_PATH}")

if __name__ == "__main__":
    migrate()
