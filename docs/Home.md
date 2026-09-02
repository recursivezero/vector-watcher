# Vector Watcher

Vector Watcher is a cross-platform desktop application built with:

- Tauri
- React
- TypeScript
- Rust
- Python
- FastAPI

The Python backend is packaged as a native sidecar using PyInstaller.

Vector Watcher packages the frontend, Rust/Tauri application, and Python backend into a single desktop application for:

- Linux
- macOS
- Windows

The Python backend runs locally and is started automatically when the Tauri application launches.

---

## Screenshots

> 📷 Screenshot placeholder: Main application window

<!--
![Vector Watcher Main Window](images/main-window.png)
-->

> 📷 Screenshot placeholder: Connection screen

<!--
![Connection Screen](images/connection-screen.png)
-->

> 📷 Screenshot placeholder: Search or main workspace

<!--
![Workspace](images/workspace.png)
-->

---

## Documentation

### Getting Started

- [[Requirements]]
- [[Development]]
- [[Project Structure]]

### Architecture

- [[Architecture]]
- [[Backend Packaging]]
- [[Backend Sidecar]]
- [[Cross Platform Builds]]

### Building Releases

- [[Linux]]
- [[macOS]]
- [[Windows]]
- [[Release Workflow]]
- [[Release Checklist]]

### Help

- [[Troubleshooting]]

---

## Application Architecture

```text
┌──────────────────────────────────────────────┐
│                Vector Watcher                │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │            Tauri Frontend              │  │
│  │                                        │  │
│  │         React / TypeScript UI          │  │
│  │                                        │  │
│  └────────────────────┬───────────────────┘  │
│                       │ HTTP                 │
│                       │                      │
│                       ▼                      │
│            http://127.0.0.1:8765             │
│                       │                      │
│  ┌────────────────────▼───────────────────┐  │
│  │          Python Backend Sidecar        │  │
│  │                                        │  │
│  │         FastAPI / Uvicorn              │  │
│  │                                        │  │
│  │       Packaged with PyInstaller        │  │
│  │                                        │  │
│  └────────────────────────────────────────┘  │
│                                              │
└──────────────────────────────────────────────┘
