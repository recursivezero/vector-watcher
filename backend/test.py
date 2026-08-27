import os

from dotenv import load_dotenv
from fastapi.testclient import TestClient

from main import app

load_dotenv()

connection = {
    "name": "Threadzip R2",
    "storage": "r2",
    "path": os.environ["R2_PATH"],
    "bucket": os.environ["R2_BUCKET"],
    "endpoint": os.environ["R2_ENDPOINT"],
    "access_key_id": os.environ["R2_ACCESS_KEY_ID"],
    "secret_access_key": os.environ["R2_SECRET_ACCESS_KEY"],
    "region": os.getenv("R2_REGION", "auto"),
}

client = TestClient(app)

response = client.post(
    "/connections/row",
    params={
        "table": "fabric_table",
        "row_id": 0,
    },
    json=connection,
)

print(f"Status: {response.status_code}")

data = response.json()

print("Image:", data.get("image_uri"))
print("Tag:", data.get("tag"))
print("Hash:", data.get("hash"))
print("Vector length:", data.get("vector", {}).get("length"))
print("Vector values:", len(data.get("vector", {}).get("values", [])))