import requests
import json

# Login as lab technician
print("Attempting login as lab technician...")
r = requests.post("http://localhost:8000/api/v1/auth/login",
    json={"email": "lab@thalcare.com", "password": "admin123"})

# Try admin password if lab fails
if r.status_code != 200:
    r = requests.post("http://localhost:8000/api/v1/auth/login",
        json={"email": "lab@thalcare.com", "password": "password123"})
        
if r.status_code != 200:
    # Try Admin user instead if lab user is missing completely
    r = requests.post("http://localhost:8000/api/v1/auth/login",
        json={"email": "admin@thalcare.com", "password": "admin123"})
        
if r.status_code != 200:
    # Try Admin user with alternate password
    r = requests.post("http://localhost:8000/api/v1/auth/login",
        json={"email": "admin@thalcare.com", "password": "password123"})

if r.status_code != 200:
    print("Login failed:", r.text)
    exit(1)

token = r.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}
print("Login successful.")

PATIENT_ID = 1  # We verified this in step 4

# Create test with Iron Deficiency pattern values
print(f"Creating test for Patient ID {PATIENT_ID}...")
r = requests.post("http://localhost:8000/api/v1/tests", headers=headers, json={
    "patient_id": PATIENT_ID,
    "hb":    8.5,
    "rbc":   5.2,
    "pcv":   28.0,
    "mcv":   62.0,
    "mch":   18.0,
    "mchc":  29.0,
    "rdw":   19.5,
    "plt":   310.0,
    "wbc":   7.2,
    "neut":  55.0,
    "lymph": 35.0,
    "hba":   95.5,
    "hba2":  2.8,
    "hbf":   1.7,
    "status": "PENDING"
})
if r.status_code not in [200, 201]:
    print("Failed to create test:", r.text)
    exit(1)

test_data = r.json()
print("Test created successfully.")
print(json.dumps(test_data, indent=2))
test_id = test_data["id"]

# Verify the test
print(f"\nVerifying test ID {test_id}...")
r = requests.post(f"http://localhost:8000/api/v1/tests/{test_id}/verify", headers=headers)
if r.status_code != 200:
    print("Failed to verify test:", r.text)
    exit(1)

print("Test verified successfully.")
print(json.dumps(r.json(), indent=2))
print(f"\nTest ID to predict on: {test_id}")
