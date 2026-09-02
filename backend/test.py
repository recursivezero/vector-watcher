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

TABLE = "fabric_table"


def test_row() -> None:
    response = client.post(
        "/connections/row",
        params={
            "table": TABLE,
            "row_id": 0,
        },
        json=connection,
    )

    print("\n=== ROW TEST ===")
    print(f"Status: {response.status_code}")

    data = response.json()

    print("Image:", data.get("image_uri"))
    print("Tag:", data.get("tag"))
    print("Hash:", data.get("hash"))
    print(
        "Vector length:",
        data.get("vector", {}).get("length"),
    )
    print(
        "Vector values:",
        len(data.get("vector", {}).get("values", [])),
    )


def test_sorted_rows() -> None:
    response = client.post(
        "/connections/rows",
        params={
            "table": TABLE,
            "page": 1,
            "page_size": 25,
            "sort_by": "tag",
            "sort_order": "asc",
        },
        json=connection,
    )

    print("\n=== SORTED ROWS TEST ===")
    print(f"Status: {response.status_code}")

    data = response.json()

    print("Rows:", len(data.get("rows", [])))
    print(
        "Total rows:",
        data.get("pagination", {}).get("total_rows"),
    )

    for row in data.get("rows", [])[:5]:
        print(
            row.get("row_id"),
            row.get("tag"),
        )


def test_search_rows() -> None:
    for search_term in (
        "product",
        "cc38c7",
        "does-not-exist",
    ):
        response = client.post(
            "/connections/rows",
            params={
                "table": TABLE,
                "page": 1,
                "page_size": 25,
                "search": search_term,
            },
            json=connection,
        )

        print(f"\n=== SEARCH TEST: {search_term} ===")
        print(f"Status: {response.status_code}")

        data = response.json()

        print(
            "Rows:",
            len(data.get("rows", [])),
        )

        print(
            "Total matching rows:",
            data.get("pagination", {}).get("total_rows"),
        )

        for row in data.get("rows", [])[:5]:
            print(
                row.get("row_id"),
                row.get("tag"),
                row.get("hash"),
            )


if __name__ == "__main__":
    test_row()
    test_sorted_rows()
    test_search_rows()
