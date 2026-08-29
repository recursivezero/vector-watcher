from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from models.lancedb import (
    LanceConnection,
    LanceRowDetailResponse,
    LanceRowsResponse,
    LanceTableDetailsResponse,
    LanceTablesResponse,
    SortColumn,
    SortOrder,
)
from services.lancedb import (
    LanceDBError,
    LanceDBService,
    LanceDBTableNotFound,
    LanceDBUnavailable,
    LanceDBValidationError,
)

load_dotenv()


app = FastAPI(
    title="Vector Watcher Backend",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:1420",
        "http://127.0.0.1:1420",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {
        "status": "ok",
        "service": "vector-watcher-backend",
    }


@app.post(
    "/connections/scan",
    response_model=LanceTablesResponse,
)
def scan_connection(
    connection: LanceConnection,
) -> LanceTablesResponse:
    try:
        service = LanceDBService(connection)
        return service.list_tables()

    except LanceDBValidationError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        ) from error

    except LanceDBUnavailable as error:
        raise HTTPException(
            status_code=502,
            detail=str(error),
        ) from error

    except LanceDBError as error:
        raise HTTPException(
            status_code=500,
            detail=str(error),
        ) from error


@app.post(
    "/connections/table-details",
    response_model=LanceTableDetailsResponse,
)
def table_details(
    connection: LanceConnection,
    table: str,
) -> LanceTableDetailsResponse:
    try:
        service = LanceDBService(connection)
        return service.get_table_details(table)

    except LanceDBValidationError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        ) from error

    except LanceDBTableNotFound as error:
        raise HTTPException(
            status_code=404,
            detail=str(error),
        ) from error

    except LanceDBUnavailable as error:
        raise HTTPException(
            status_code=502,
            detail=str(error),
        ) from error

    except LanceDBError as error:
        raise HTTPException(
            status_code=500,
            detail=str(error),
        ) from error


@app.post(
    "/connections/rows",
    response_model=LanceRowsResponse,
)
def table_rows(
    connection: LanceConnection,
    table: str,
    page: int = 1,
    page_size: int = 25,
    search: str | None = None,
    tag: str | None = None,
    sort_by: SortColumn | None = None,
    sort_order: SortOrder = "asc",
) -> LanceRowsResponse:
    try:
        service = LanceDBService(connection)

        return service.get_rows(
            table_name=table,
            page=page,
            page_size=page_size,
            search=search,
            tag=tag,
            sort_by=sort_by,
            sort_order=sort_order,
        )

    except LanceDBValidationError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        ) from error

    except LanceDBTableNotFound as error:
        raise HTTPException(
            status_code=404,
            detail=str(error),
        ) from error

    except LanceDBUnavailable as error:
        raise HTTPException(
            status_code=502,
            detail=str(error),
        ) from error

    except LanceDBError as error:
        raise HTTPException(
            status_code=500,
            detail=str(error),
        ) from error


@app.post(
    "/connections/row",
    response_model=LanceRowDetailResponse,
)
def table_row(
    connection: LanceConnection,
    table: str,
    row_id: int,
) -> LanceRowDetailResponse:
    try:
        service = LanceDBService(connection)

        return service.get_row(
            table_name=table,
            row_id=row_id,
        )

    except LanceDBValidationError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        ) from error

    except LanceDBTableNotFound as error:
        raise HTTPException(
            status_code=404,
            detail=str(error),
        ) from error

    except LanceDBUnavailable as error:
        raise HTTPException(
            status_code=502,
            detail=str(error),
        ) from error

    except LanceDBError as error:
        raise HTTPException(
            status_code=500,
            detail=str(error),
        ) from error
