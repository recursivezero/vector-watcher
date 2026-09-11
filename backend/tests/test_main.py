from fastapi.testclient import TestClient

from main import app
from models.lancedb import LanceConnection

client = TestClient(app)


def test_health():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "service": "vector-watcher-backend",
    }


def test_lance_connection_accepts_frontend_camelcase_aliases():
    payload = {
        "name": "demo-r2",
        "storage": "r2",
        "path": "demo/path",
        "bucket": "demo-bucket",
        "endpoint": "https://demo.r2.cloudflarestorage.com",
        "accessKeyId": "AKIA",
        "secretAccessKey": "SECRET",
        "sessionToken": "",
        "region": "auto",
    }

    connection = LanceConnection.model_validate(payload)

    assert connection.access_key_id == "AKIA"
    assert connection.secret_access_key == "SECRET"
    assert connection.session_token == ""
    assert connection.region == "auto"
