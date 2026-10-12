import sqlite3

columns_to_add = [
    ("blood_group", "TEXT"),
    ("email", "TEXT"),
    ("address", "TEXT"),
    ("city", "TEXT"),
    ("emergency_contact_name", "TEXT"),
    ("emergency_contact", "TEXT"),
    ("medical_history", "TEXT"),
    ("family_history", "TEXT"),
    ("allergies", "TEXT"),
]

try:
    conn = sqlite3.connect('thalcare.db', timeout=10)
    c = conn.cursor()
    
    for col_name, col_type in columns_to_add:
        try:
            c.execute(f"ALTER TABLE patients ADD COLUMN {col_name} {col_type}")
            print(f"Added column '{col_name}' to patients table.")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e).lower():
                print(f"Column '{col_name}' already exists. Skipping.")
            else:
                print(f"Error adding '{col_name}': {e}")
    
    conn.commit()
    print("\nDatabase update completed successfully!")
except Exception as e:
    print(f"Error: {e}")
finally:
    try:
        conn.close()
    except:
        pass
