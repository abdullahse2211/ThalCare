import requests, json

# Login as doctor
print("Logging in as doctor...")
r = requests.post("http://localhost:8000/api/v1/auth/login",
    json={"email": "doctor@thalcare.com", "password": "password123"})

if r.status_code != 200:
    r = requests.post("http://localhost:8000/api/v1/auth/login",
        json={"email": "admin@thalcare.com", "password": "password123"})

if r.status_code != 200:
    print("Login failed:", r.text)
    exit(1)

token = r.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}
print("Login successful.")

TEST_ID = 2  # from Step 5

print(f"\nRunning ML prediction on Test ID {TEST_ID}...")
r = requests.post("http://localhost:8000/api/v1/predictions/run",
    json={"test_id": TEST_ID}, headers=headers)

print("Prediction status:", r.status_code)
result = r.json()
print(json.dumps(result, indent=2))

# Validate the result has all required fields
required_fields = ["final_diagnosis", "confidence", "ensemble_probabilities", "agreement_rate", "model_predictions"]
print("\n--- Field Validation ---")
for field in required_fields:
    present = field in result
    print(f"  {field}: {'✓ PRESENT' if present else '✗ MISSING'}")

print(f"\nFinal Diagnosis: {result.get('final_diagnosis', 'N/A')}")
print(f"Confidence: {result.get('confidence', 'N/A')}%")
print(f"Agreement: {result.get('agreement_rate', 'N/A')}")
