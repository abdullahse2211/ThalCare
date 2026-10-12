import requests

# Login as admin
print("Attempting login as admin...")
r = requests.post("http://localhost:8000/api/v1/auth/login",
    json={"email": "admin@thalcare.com", "password": "admin123"})

if r.status_code != 200:
    # Try alternate password
    r = requests.post("http://localhost:8000/api/v1/auth/login",
        json={"email": "admin@thalcare.com", "password": "password123"})

if r.status_code != 200:
    print("Login failed:", r.text)
    exit(1)

token = r.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}
print("Login successful.")

# Check existing patients
r = requests.get("http://localhost:8000/api/v1/patients", headers=headers)
patients = r.json()
print(f"Existing patients: {len(patients)}")

if len(patients) == 0:
    # Create a test patient
    print("Seeding test patient Fatima Khan...")
    r = requests.post("http://localhost:8000/api/v1/patients", headers=headers, json={
        "mrn": "TEST-001",
        "first_name": "Fatima",
        "last_name": "Khan",
        "dob": "1995-06-15T00:00:00",
        "gender": "female",
        "blood_group": "B+",
        "contact_number": "0300-1234567",
        "city": "Lahore"
    })
    if r.status_code in [200, 201]:
        print("Patient created successfully.")
        patient_id = r.json()["id"]
    else:
        print("Failed to create patient:", r.text)
        exit(1)
else:
    patient_id = patients[0]["id"]
    print(f"Using existing patient ID: {patient_id}")

print(f"\nPatient ID to use in test: {patient_id}")
