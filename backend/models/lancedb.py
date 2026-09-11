from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

SortColumn = Literal["image_uri", "tag", "hash", "mtime"]
SortOrder = Literal["asc", "desc"]
LanceStorageType = Literal["local", "s3", "r2"]


class LanceConnection(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    name: str = Field(min_length=1, max_length=128)
    storage: LanceStorageType
    path: str = Field(default="", max_length=2048)

    access_key_id: str = Field(default="", max_length=256)
    secret_access_key: str = Field(default="", max_length=512)
    session_token: str = Field(default="", max_length=4096)

    region: str = Field(default="", max_length=128)
    bucket: str = Field(default="", max_length=255)
    endpoint: str = Field(default="", max_length=2048)

    @model_validator(mode="before")
    @classmethod
    def normalize_frontend_field_names(cls, data: Any) -> Any:
        if not isinstance(data, dict):
            return data

        normalized = dict(data)

        if "accessKeyId" in normalized and "access_key_id" not in normalized:
            normalized["access_key_id"] = normalized.pop("accessKeyId")

        if "secretAccessKey" in normalized and "secret_access_key" not in normalized:
            normalized["secret_access_key"] = normalized.pop("secretAccessKey")

        if "sessionToken" in normalized and "session_token" not in normalized:
            normalized["session_token"] = normalized.pop("sessionToken")

        return normalized


class LanceTableItem(BaseModel):
    name: str


class LanceConnectionInfo(BaseModel):
    name: str
    storage: LanceStorageType
    path: str = ""


class LanceTablesResponse(BaseModel):
    source: LanceConnectionInfo
    tables: list[LanceTableItem]


class LanceSchemaField(BaseModel):
    name: str
    type: str
    nullable: bool
    is_vector: bool = False


class LanceEmbeddingFunction(BaseModel):
    name: str
    source_column: str
    vector_column: str


class LanceVectorColumn(BaseModel):
    name: str
    dimension: int


class LanceTableDetailsResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True)

    name: str
    row_count: int = Field(ge=0)
    table_schema: list[LanceSchemaField] = Field(alias="schema")
    schema_metadata: dict[str, Any]
    embedding_functions: list[LanceEmbeddingFunction]
    vector_columns: list[LanceVectorColumn]


class LanceVectorSummary(BaseModel):
    length: int = Field(ge=0)
    included: bool = False


class LanceRowSummary(BaseModel):
    row_id: int = Field(ge=0)
    image_uri: str | None = None
    tag: str | None = None
    hash: str | None = None
    mtime: float | int | str | None = None
    vector: LanceVectorSummary


class LancePagination(BaseModel):
    page: int = Field(ge=1)
    page_size: int = Field(ge=1, le=100)
    total_rows: int = Field(ge=0)
    total_pages: int = Field(ge=0)
    has_next: bool
    has_previous: bool


class LanceFilterState(BaseModel):
    tag: str | None = None


class LanceSortState(BaseModel):
    column: SortColumn | None = None
    order: SortOrder = "asc"


class LanceRowsResponse(BaseModel):
    table: str
    rows: list[LanceRowSummary]
    pagination: LancePagination
    filter: LanceFilterState
    sort: LanceSortState


class LanceVectorValues(BaseModel):
    length: int = Field(ge=0)
    values: list[float | None]


class LanceRowDetailResponse(BaseModel):
    row_id: int = Field(ge=0)
    image_uri: str | None = None
    tag: str | None = None
    hash: str | None = None
    mtime: float | int | str | None = None
    vector: LanceVectorValues
