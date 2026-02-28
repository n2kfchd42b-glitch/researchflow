import requests
import json

BASE = "http://localhost:8000"

print("=== ResearchFlow Full API Test ===\n")

# Test 1: Health
r = requests.get(f"{BASE}/health")
print(f"1. Health: {r.json()}")

# Test 2: Upload dataset
with open("data/samples/health_dataset.csv", "rb") as f:
    r = requests.post(
        f"{BASE}/upload", 
        files={"file": ("health_dataset.csv", f, "text/csv")}
    )
upload = r.json()
dataset_id = upload["dataset_id"]
print(f"\n2. Upload:")
print(f"   Dataset ID: {dataset_id}")
print(f"   Rows: {upload['rows']}")
print(f"   Columns: {upload['columns']}")
print(f"   Issues: {len(upload['issues'])}")

# Test 3: Create study
r = requests.post(f"{BASE}/study", json={
    "title": "CHW Programme Evaluation",
    "description": "Community health worker impact on outcomes",
    "study_type": "retrospective_cohort",
    "user_role": "ngo"
})
study = r.json()
study_id = study["id"]
print(f"\n3. Study created:")
print(f"   Study ID: {study_id}")
print(f"   Status: {study['status']}")

# Test 4: Run analysis
r = requests.post(f"{BASE}/study/{study_id}/analyse", json={
    "dataset_id": dataset_id,
    "outcome_column": "outcome",
    "predictor_columns": ["age", "weight", "treatment", "sex"]
})
analysis = r.json()
print(f"\n4. Analysis complete:")
print(f"   Status: {analysis['status']}")
print(f"   Model: {analysis['results'].get('model')}")
print(f"   N: {analysis['results'].get('n')}")
print(f"   Rigor Score: {analysis['rigor_score']['overall_score']}/100")
print(f"   Grade: {analysis['rigor_score']['grade']}")

# Test 5: Get rigor report
r = requests.get(f"{BASE}/study/{study_id}/rigor")
rigor = r.json()
print(f"\n5. Rigor breakdown:")
for key, val in rigor["breakdown"].items():
    print(f"   {key}: {val['score']}/{val['max']}")

# Test 6: List studies
r = requests.get(f"{BASE}/studies")
studies = r.json()
print(f"\n6. Studies in system: {len(studies)}")

print("\n=== All tests passed ===")
