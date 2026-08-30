from __future__ import annotations

import json
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any
from unittest import result
from urllib.parse import urlsplit

import lancedb

from models.lancedb import (
    LanceConnection,
    LanceConnectionInfo,
    LanceEmbeddingFunction,
    LanceFilterState,
    LancePagination,
    LanceRowDetailResponse,
    LanceRowsResponse,
    LanceRowSummary,
    LanceSchemaField,
    LanceSortState,
    LanceTableDetailsResponse,
    LanceTableItem,
    LanceTablesResponse,
    LanceVectorColumn,
    LanceVectorSummary,
    LanceVectorValues,
    SortColumn,
    SortOrder,
)

_TABLE_NAME_PATTERN = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_.-]{0,127}$")

_AWS_BUCKET_PATTERN = re.compile(r"^[a-z0-9](?:[a-z0-9.-]{1,61})[a-z0-9]$")

_R2_BUCKET_PATTERN = re.compile(r"^[a-z0-9](?:[a-z0-9-]{1,61})[a-z0-9]$")

_IPV4_ADDRESS_PATTERN = re.compile(r"^(?:\d{1,3}\.){3}\d{1,3}$")


class LanceDBError(RuntimeError):
    """Base error for Vector Watcher's LanceDB service."""


class LanceDBValidationError(LanceDBError):
    """Invalid connection or request."""


class LanceDBUnavailable(LanceDBError):
    """LanceDB could not access the requested resource."""


class LanceDBTableNotFound(LanceDBError):
    """Requested table does not exist."""


@dataclass
class LanceDBService:
    connection: LanceConnection

    def __post_init__(self) -> None:
        self._db_uri = self._normalise_db_uri()
        self._db: Any | None = None

    @staticmethod
    def _validate_bucket_name(
        storage: str,
        bucket: str,
    ) -> bool:
        if storage == "r2":
            return bool(_R2_BUCKET_PATTERN.fullmatch(bucket))

        return bool(
            _AWS_BUCKET_PATTERN.fullmatch(bucket)
            and ".." not in bucket
            and not _IPV4_ADDRESS_PATTERN.fullmatch(bucket)
        )

    def _normalise_db_uri(self) -> str:
        connection = self.connection
        path = connection.path.strip()

        if "\x00" in path:
            raise LanceDBValidationError(
                "The LanceDB path contains an invalid character."
            )

        # Local LanceDB database.
        if connection.storage == "local":
            if not path:
                raise LanceDBValidationError("A local LanceDB path is required.")

            local_path = Path(path).expanduser()

            try:
                resolved = local_path.resolve(strict=True)
            except (OSError, RuntimeError) as error:
                raise LanceDBValidationError(
                    "The local LanceDB path does not exist."
                ) from error

            if not resolved.is_dir():
                raise LanceDBValidationError(
                    "The local LanceDB path must be a directory."
                )

            return str(resolved)

        # S3 / R2.
        bucket = connection.bucket.strip()

        if not self._validate_bucket_name(
            connection.storage,
            bucket,
        ):
            provider = "Amazon S3" if connection.storage == "s3" else "Cloudflare R2"

            raise LanceDBValidationError(f"Enter a valid {provider} bucket name.")

        path = path.strip("/")

        if "\x00" in path:
            raise LanceDBValidationError(
                "The LanceDB path contains an invalid character."
            )

        if path:
            return f"s3://{bucket}/{path}"

        return f"s3://{bucket}"

    def _storage_options(self) -> dict[str, str] | None:
        connection = self.connection

        if connection.storage == "local":
            return None

        access_key = connection.access_key_id.strip()
        secret_key = connection.secret_access_key.strip()
        region = connection.region.strip()

        if not access_key or not secret_key:
            raise LanceDBValidationError(
                "Access key and secret access key are required."
            )

        if connection.storage == "s3":
            if not region:
                raise LanceDBValidationError("AWS S3 region is required.")

            options: dict[str, str] = {
                "aws_access_key_id": access_key,
                "aws_secret_access_key": secret_key,
                "aws_region": region,
            }

            session_token = connection.session_token.strip()

            if session_token:
                options["aws_session_token"] = session_token

            return options

        # Cloudflare R2.
        endpoint = connection.endpoint.strip()

        if not endpoint:
            raise LanceDBValidationError("Cloudflare R2 endpoint is required.")

        parsed_endpoint = urlsplit(endpoint)

        if (
            parsed_endpoint.scheme.lower() != "https"
            or not parsed_endpoint.netloc
            or parsed_endpoint.username
            or parsed_endpoint.password
            or parsed_endpoint.path not in {"", "/"}
            or parsed_endpoint.query
            or parsed_endpoint.fragment
        ):
            raise LanceDBValidationError("The Cloudflare R2 endpoint is invalid.")

        return {
            "endpoint": endpoint.rstrip("/"),
            "aws_access_key_id": access_key,
            "aws_secret_access_key": secret_key,
            "aws_region": region or "auto",
        }

    def connect(self) -> Any:
        if self._db is not None:
            return self._db

        try:
            self._db = lancedb.connect(
                self._db_uri,
                storage_options=self._storage_options(),
            )
        except LanceDBError:
            raise
        except Exception as error:
            raise LanceDBUnavailable("Unable to connect to LanceDB.") from error

        return self._db

    def _table_names(self) -> list[str]:
        db = self.connect()

        try:
            if hasattr(db, "list_tables"):
                result = db.list_tables()

                if isinstance(result, dict):
                    names = result.get("tables", [])
                elif hasattr(result, "tables"):
                    names = result.tables
                else:
                    names = result

                return sorted(str(name) for name in names)

            # Compatibility with older LanceDB versions.
            return sorted(str(name) for name in db.table_names())

        except Exception as error:
            raise LanceDBUnavailable("Unable to list LanceDB tables.") from error

    def list_tables(self) -> LanceTablesResponse:
        source = LanceConnectionInfo(
            name=self.connection.name,
            storage=self.connection.storage,
            path=self.connection.path,
        )

        return LanceTablesResponse(
            source=source,
            tables=[LanceTableItem(name=name) for name in self._table_names()],
        )

    def _validate_table_name(
        self,
        table_name: str,
    ) -> None:
        if not _TABLE_NAME_PATTERN.fullmatch(table_name):
            raise LanceDBValidationError("Invalid LanceDB table name.")

    def open_table(
        self,
        table_name: str,
    ) -> Any:
        self._validate_table_name(table_name)

        if table_name not in self._table_names():
            raise LanceDBTableNotFound("The selected LanceDB table was not found.")

        try:
            return self.connect().open_table(table_name)
        except LanceDBError:
            raise
        except Exception as error:
            raise LanceDBUnavailable(
                "Unable to open the selected LanceDB table."
            ) from error

    @staticmethod
    def _vector_dimension(
        data_type: Any,
    ) -> int | None:
        for attribute in (
            "list_size",
            "value_length",
        ):
            value = getattr(
                data_type,
                attribute,
                None,
            )

            if isinstance(value, int) and value >= 0:
                return value

        text = str(data_type)

        match = re.search(
            r"\[(\d+)\]",
            text,
        )

        return int(match.group(1)) if match else None

    @classmethod
    def _schema_fields(
        cls,
        schema: Any,
    ) -> tuple[
        list[LanceSchemaField],
        list[LanceVectorColumn],
    ]:
        fields: list[LanceSchemaField] = []
        vectors: list[LanceVectorColumn] = []

        for field in schema:
            dimension = cls._vector_dimension(field.type)

            is_vector = dimension is not None or field.name == "vector"

            fields.append(
                LanceSchemaField(
                    name=str(field.name),
                    type=str(field.type),
                    nullable=bool(
                        getattr(
                            field,
                            "nullable",
                            True,
                        )
                    ),
                    is_vector=is_vector,
                )
            )

            if is_vector:
                vectors.append(
                    LanceVectorColumn(
                        name=str(field.name),
                        dimension=dimension or 0,
                    )
                )

        return fields, vectors

    import json

    @staticmethod
    def _schema_metadata(
        schema: Any,
    ) -> dict[str, Any]:
        metadata = (
            getattr(
                schema,
                "metadata",
                None,
            )
            or {}
        )

        result: dict[str, Any] = {}

        for key, value in metadata.items():
            decoded_key = key.decode("utf-8") if isinstance(key, bytes) else str(key)

            decoded_value = value.decode("utf-8") if isinstance(value, bytes) else value

            if isinstance(decoded_value, str):
                try:
                    decoded_value = json.loads(decoded_value)
                except json.JSONDecodeError:
                    pass

        result[decoded_key] = decoded_value

        return result

    @classmethod
    def _embedding_functions(
        cls,
        table: Any,
    ) -> list[LanceEmbeddingFunction]:
        try:
            raw_configs = getattr(
                table,
                "embedding_functions",
                {},
            )

            configs = raw_configs() if callable(raw_configs) else raw_configs
        except Exception:
            configs = {}

        result: list[LanceEmbeddingFunction] = []

        if isinstance(configs, dict):
            for vector_name, config in configs.items():
                function = getattr(
                    config,
                    "function",
                    None,
                )

                function_name = (
                    getattr(
                        function,
                        "name",
                        None,
                    )
                    or getattr(
                        function,
                        "__name__",
                        None,
                    )
                    or (
                        function.__class__.__name__
                        if function is not None
                        else "unknown"
                    )
                )

                result.append(
                    LanceEmbeddingFunction(
                        name=str(function_name),
                        source_column=str(
                            getattr(
                                config,
                                "source_column",
                                "",
                            )
                        ),
                        vector_column=str(
                            getattr(
                                config,
                                "vector_column",
                                None,
                            )
                            or vector_name
                        ),
                    )
                )

        # Existing API successfully returned functions.
        if result:
            return result

        # Fallback: read embedding functions from schema metadata.
        try:
            schema = getattr(
                table,
                "schema",
                None,
            )

            metadata = (
                getattr(
                    schema,
                    "metadata",
                    None,
                )
                or {}
            )

            raw_embedding_functions = metadata.get(
                b"embedding_functions",
            )

            if raw_embedding_functions is None:
                raw_embedding_functions = metadata.get(
                    "embedding_functions",
                )

            if isinstance(
                raw_embedding_functions,
                bytes,
            ):
                raw_embedding_functions = raw_embedding_functions.decode("utf-8")

            if isinstance(
                raw_embedding_functions,
                str,
            ):
                raw_embedding_functions = json.loads(raw_embedding_functions)

            if not isinstance(
                raw_embedding_functions,
                list,
            ):
                return []

            for config in raw_embedding_functions:
                if not isinstance(config, dict):
                    continue

                result.append(
                    LanceEmbeddingFunction(
                        name=str(
                            config.get(
                                "name",
                                "unknown",
                            )
                        ),
                        source_column=str(
                            config.get(
                                "source_column",
                                "",
                            )
                        ),
                        vector_column=str(
                            config.get(
                                "vector_column",
                                "",
                            )
                        ),
                    )
                )

        except (Exception,):
            return result

        return result

    def get_table_details(
        self,
        table_name: str,
    ) -> LanceTableDetailsResponse:
        table = self.open_table(table_name)

        try:
            schema = table.schema

            if callable(schema):
                schema = schema()

        except Exception as error:
            raise LanceDBUnavailable("Unable to read the table schema.") from error

        fields, vectors = self._schema_fields(schema)

        try:
            row_count = int(table.count_rows())
        except Exception as error:
            raise LanceDBUnavailable("Unable to count table rows.") from error

        embedding_functions = self._embedding_functions(table)

        print(
            "EMBEDDING FUNCTIONS RESULT:",
            embedding_functions,
        )

        return LanceTableDetailsResponse(
            name=table_name,
            row_count=row_count,
            schema=fields,
            schema_metadata=self._schema_metadata(schema),
            embedding_functions=self._embedding_functions(table),
            vector_columns=vectors,
        )

    def get_rows(
        self,
        table_name: str,
        page: int = 1,
        page_size: int = 25,
        search: str | None = None,
        tag: str | None = None,
        sort_by: SortColumn | None = None,
        sort_order: SortOrder = "asc",
    ) -> LanceRowsResponse:
        if page < 1:
            raise LanceDBValidationError("Page must be greater than or equal to 1.")

        if page_size < 1 or page_size > 100:
            raise LanceDBValidationError("Page size must be between 1 and 100.")

        table = self.open_table(table_name)

        try:
            query = table.search()

            if search:
                escaped_search = search.replace("'", "''")
                search_pattern = f"%{escaped_search}%"

                query = query.where(
                    "("
                    f"image_uri LIKE '{search_pattern}' "
                    f"OR tag LIKE '{search_pattern}' "
                    f"OR hash LIKE '{search_pattern}'"
                    ")"
                )

            if tag:
                escaped_tag = tag.replace("'", "''")

                query = query.where(f"tag = '{escaped_tag}'")

            if sort_by:
                allowed_sort_columns = {
                    "image_uri",
                    "tag",
                    "hash",
                    "mtime",
                }

                if sort_by not in allowed_sort_columns:
                    raise LanceDBValidationError("Invalid sort column.")

                if sort_order not in {"asc", "desc"}:
                    raise LanceDBValidationError("Invalid sort order.")

                query = query.order_by(
                    [
                        {
                            "column_name": sort_by,
                            "ascending": sort_order == "asc",
                        }
                    ]
                )

            filtered_rows = query.to_list()
            total_rows = len(filtered_rows)

            total_pages = (total_rows + page_size - 1) // page_size if total_rows else 0

            if total_pages and page > total_pages:
                raise LanceDBValidationError(
                    "Requested page is outside the available range."
                )

            offset = (page - 1) * page_size

            rows = filtered_rows[offset : offset + page_size]

        except LanceDBValidationError:
            raise

        except Exception as error:
            print(f"Unable to read table rows: {error!r}")

            raise LanceDBUnavailable("Unable to read table rows.") from error

        result: list[LanceRowSummary] = []

        for index, row in enumerate(rows):
            vector = row.get("vector")

            vector_length = len(vector) if vector is not None else 0

            result.append(
                LanceRowSummary(
                    row_id=offset + index,
                    image_uri=row.get("image_uri"),
                    tag=row.get("tag"),
                    hash=row.get("hash"),
                    mtime=row.get("mtime"),
                    vector=LanceVectorSummary(
                        length=vector_length,
                        included=False,
                    ),
                )
            )

        return LanceRowsResponse(
            table=table_name,
            rows=result,
            pagination=LancePagination(
                page=page,
                page_size=page_size,
                total_rows=total_rows,
                total_pages=total_pages,
                has_next=page < total_pages,
                has_previous=page > 1,
            ),
            filter=LanceFilterState(
                tag=tag,
            ),
            sort=LanceSortState(
                column=sort_by,
                order=sort_order,
            ),
        )

    def get_row(
        self,
        table_name: str,
        row_id: int,
    ) -> LanceRowDetailResponse:
        if row_id < 0:
            raise LanceDBValidationError("Row ID must be greater than or equal to 0.")

        table = self.open_table(table_name)

        try:
            rows = table.to_arrow().slice(row_id, 1).to_pylist()
        except Exception as error:
            raise LanceDBUnavailable("Unable to read the requested row.") from error

        if not rows:
            raise LanceDBTableNotFound("The requested row was not found.")

        row = rows[0]
        vector = row.get("vector")

        values = (
            [float(value) if value is not None else None for value in vector]
            if vector is not None
            else []
        )

        return LanceRowDetailResponse(
            row_id=row_id,
            image_uri=row.get("image_uri"),
            tag=row.get("tag"),
            hash=row.get("hash"),
            mtime=row.get("mtime"),
            vector=LanceVectorValues(
                length=len(values),
                values=values,
            ),
        )
