# Project Structure

A simplified project structure:

```text
vector-watcher/
│
├── backend/
│   ├── server.py
│   ├── main.py
│   ├── pyproject.toml
│   ├── poetry.lock
│   ├── build.sh
│   ├── start.sh
│   │
│   ├── build/
│   └── dist/
│
├── frontend/
│     ├── src/
│     │──package.json
│     └── dist/
│
├── src-tauri/
│   ├── binaries/
│   │
│   ├── src/
│   │   └── lib.rs
│   │
│   ├── tauri.conf.json
│   ├── tauri.prod.conf.json
│   │
│   └── target/
│
└──README.md
```

## Important Directories

### backend/

Contains the Python backend.

Important files include:

```text
main.py
server.py
pyproject.toml
poetry.lock
build.sh
```

The PyInstaller output is generated inside this area.

#### frontend/

Contains the frontend application source.

#### src-tauri/

Contains the Tauri and Rust application.

Important areas:

```text
src-tauri/
├── binaries/
├── src/
│   └── lib.rs
├── tauri.conf.json
└── tauri.prod.conf.json
```

#### src-tauri/binaries/

Contains the platform-specific backend sidecar binaries used during production builds.

See

- [Backend Sidecar](./Backend-Sidecar.md)
