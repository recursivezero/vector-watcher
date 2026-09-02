# Development

This page describes how to prepare the development environment.

---

## Install Frontend Dependencies

From the project root:

```bash
npm install
```

Install Backend Dependencies

From the backend directory:

```bash
cd backend
poetry install
```

Run the Backend Manually

For development:

```bash
cd backend
poetry run uvicorn main:app --host 127.0.0.1 --port 8765
```

Verify the Backend

Run:

> curl <http://127.0.0.1:8765/openapi.json>

A JSON response confirms that the backend is running correctly.

Check the Backend Port

> lsof -nP -iTCP:8765 -sTCP:LISTEN

## Development Architecture

During development, the Python backend can run directly through Poetry and Uvicorn.

This avoids packaging the backend every time frontend code changes.

Development Environment
        │
        ├── React / TypeScript
        │
        ├── Tauri
        │
        └── Poetry
              │
              ▼
        FastAPI / Uvicorn
              │
              ▼
        127.0.0.1:8765

### Future Documentation

TODO: Add command for starting the complete development application.

TODO: Add frontend development workflow.

TODO: Add environment variable documentation.

TODO: Add database connection setup.

TODO: Add saved connection configuration documentation.
