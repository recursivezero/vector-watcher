import logging
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

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
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Vector Watcher Backend",
    version="1.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {
        "status": "ok",
        "service": "vector-watcher-backend",
    }


# @app.post(
#    "/connections/scan",
#    response_model=LanceTablesResponse,
# )
# def scan_connection(
#    connection: LanceConnection,
# ) -> LanceTablesResponse:
#    try:
#        service = LanceDBService(connection)
#        return service.list_tables()

#    except LanceDBValidationError as error:
#        raise HTTPException(
#            status_code=400,
#            detail=str(error),
#        ) from error

#    except LanceDBUnavailable as error:
#        logger.exception("Unable to connect to LanceDB: %s", error)
#        raise HTTPException(
#            status_code=502,
#            detail=str(error),
#        )

#    except LanceDBError as error:
#        raise HTTPException(
#            status_code=500,
#            detail=str(error),
#        ) from error


@app.post(
    "/connections/scan",
    response_model=LanceTablesResponse,
)
def scan_connection(
    connection: LanceConnection,
) -> LanceTablesResponse:
    logger.info(
        "SCAN request received: storage=%s name=%s bucket=%s endpoint=%s region=%s",
        connection.storage,
        connection.name,
        connection.bucket,
        connection.endpoint,
        connection.region,
    )

    try:
        logger.info("Creating LanceDBService...")
        service = LanceDBService(connection)

        logger.info("LanceDBService created. Calling list_tables()...")
        result = service.list_tables()

        logger.info(
            "SCAN successful: found %d tables",
            len(result.tables),
        )

        return result

    except LanceDBValidationError as error:
        logger.exception("SCAN validation error: %s", error)
        raise HTTPException(
            status_code=400,
            detail=str(error),
        ) from error

    except LanceDBUnavailable as error:
        logger.exception("SCAN LanceDB unavailable: %s", error)
        raise HTTPException(
            status_code=502,
            detail=str(error),
        ) from error

    except LanceDBError as error:
        logger.exception("SCAN LanceDB error: %s", error)
        raise HTTPException(
            status_code=500,
            detail=str(error),
        ) from error

    except Exception as error:
        logger.exception("SCAN unexpected error: %s", error)
        raise HTTPException(
            status_code=500,
            detail="Unexpected backend error while scanning LanceDB.",
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


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request,
    exc: RequestValidationError,
):
    logger.error("VALIDATION ERROR: %s", exc.errors())
    logger.error("VALIDATION BODY: %s", exc.body)

    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors()},
    )
