# Development

This page describes how to prepare the development environment.

---

## Install Frontend Dependencies

From the project root:

```bash
cd frontend
npm install
```

Run the Frontend Manually

```bash
npm run tauri:dev
```

## Install Backend Dependencies

From the project root, navigate to backend directory:

```bash
cd backend
poetry install --all-extras --with dev
```

Run the Backend Manually

For development:

```bash
cd backend
poetry run uvicorn main:app --host 127.0.0.1 --port 8765
# or
bash /start.sh
```

## Verify the Backend

Run:

```bash
curl http://127.0.0.1:8765/openapi.json
```

A JSON response confirms that the backend is running correctly.

Check the Backend Port

```bash
lsof -nP -iTCP:8765 -sTCP:LISTEN
```

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
