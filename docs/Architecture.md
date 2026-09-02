# Architecture

Vector Watcher is packaged as a single desktop application containing:

- React and TypeScript frontend
- Tauri application shell
- Rust application runtime
- Python FastAPI backend
- PyInstaller packaged backend runtime

---

## Application Flow

When the packaged desktop application starts:

1. Tauri starts.
2. Tauri launches the packaged Python backend sidecar.
3. The backend starts Uvicorn on `127.0.0.1:8765`.
4. The frontend communicates with the backend through localhost.

When the application closes, Tauri terminates the backend process.

---

## Architecture Diagram

```text
┌──────────────────────────────────────────────┐
│                Vector Watcher                │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │            Tauri Frontend              │  │
│  │                                        │  │
│  │         React / TypeScript UI          │  │
│  └────────────────────┬───────────────────┘  │
│                       │ HTTP                 │
│                       ▼                      │
│            http://127.0.0.1:8765             │
│                       │                      │
│  ┌────────────────────▼───────────────────┐  │
│  │          Python Backend Sidecar        │  │
│  │                                        │  │
│  │         FastAPI / Uvicorn              │  │
│  │                                        │  │
│  │       Packaged with PyInstaller        │  │
│  └────────────────────────────────────────┘  │
│                                              │
└──────────────────────────────────────────────┘
```

### Frontend

The desktop UI is built using:

React
TypeScript
Tauri

The frontend communicates with the local backend using HTTP.

### Backend

The backend uses:

Python
FastAPI
Uvicorn

The backend listens only on:

127.0.0.1:8765

It is started automatically by the Tauri application.

### Backend Lifecycle

```text
Application Starts
        │
        ▼
Tauri Starts
        │
        ▼
Python Sidecar Starts
        │
        ▼
FastAPI / Uvicorn Starts
        │
        ▼
Port 8765 Available
        │
        ▼
Frontend Communicates with Backend
        │
        ▼
Application Closes
        │
        ▼
Tauri Terminates Backend

```

See also:

[[Backend Sidecar]]  
[[Backend Packaging]]
